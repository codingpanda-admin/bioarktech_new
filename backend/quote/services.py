import re
import smtplib
import base64
import logging

from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from django.db import IntegrityError, connection, transaction
from django.db.models import Max
from interface.models import SmtpConfig

from .models import Quote

logger = logging.getLogger(__name__)


def render_email_template(template_str, context):
    """
    Renders {{var}} and {{#if var}}content{{/if}} template syntax.
    """
    if not template_str:
        return ""

    # Process {{#if key}}content{{/if}}
    def replace_if(match):
        key = match.group(1).strip()
        body = match.group(2)
        val = context.get(key)
        if val and str(val).strip():
            return body
        return ""

    result = re.sub(r'\{\{#if\s+([a-zA-Z0-9_]+)\}\}(.*?)\{\{/if\}\}', replace_if, template_str, flags=re.DOTALL)

    # Process {{key}}
    def replace_var(match):
        key = match.group(1).strip()
        val = context.get(key)
        return str(val) if val is not None else ""

    result = re.sub(r'\{\{([a-zA-Z0-9_]+)\}\}', replace_var, result)
    return result


def _get_google_oauth2_access_token(client_id, client_secret, refresh_token):
    """
    Exchanges a refresh token for a fresh Google OAuth 2.0 access token using Google token endpoint.
    """
    import urllib.parse
    import urllib.request
    import json

    url = "https://oauth2.googleapis.com/token"
    params = {
        'client_id': client_id,
        'client_secret': client_secret,
        'refresh_token': refresh_token,
        'grant_type': 'refresh_token',
    }
    encoded_data = urllib.parse.urlencode(params).encode('utf-8')
    req = urllib.request.Request(url, data=encoded_data, headers={'Content-Type': 'application/x-www-form-urlencoded'})

    with urllib.request.urlopen(req, timeout=10) as response:
        res_body = json.loads(response.read().decode('utf-8'))
        return res_body.get('access_token')


def send_quote_smtp_email(context, template_type='full', custom_recipients=None):
    """
    Sends an email using Google OAuth 2.0 (XOAUTH2) or standard SMTP based on SmtpConfig in database.
    """
    try:
        config = SmtpConfig.objects.first()
        if not config:
            config = SmtpConfig.objects.create()

        # Select subject & body templates
        if template_type == 'product':
            subject_tmpl = config.product_subject
            body_tmpl = config.product_body
        else:
            subject_tmpl = config.full_subject
            body_tmpl = config.full_body

        subject = render_email_template(subject_tmpl, context)
        html_body = render_email_template(body_tmpl, context)

        recipients = custom_recipients
        if not recipients:
            raw_recipients = config.admin_to_emails or config.sender_email or config.user or 'wulipeng@gmail.com'
            recipients = [e.strip() for e in raw_recipients.split(',') if e.strip()]

        from_email = config.sender_email or config.from_email or config.user or 'wulipeng@gmail.com'

        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = from_email
        msg['To'] = ", ".join(recipients)

        part = MIMEText(html_body, 'html', 'utf-8')
        msg.attach(part)

        # Check if Google OAuth 2.0 is configured
        if config.use_google_oauth and config.google_client_id and config.google_client_secret and config.google_refresh_token:
            access_token = _get_google_oauth2_access_token(
                config.google_client_id.strip(),
                config.google_client_secret.strip(),
                config.google_refresh_token.strip()
            )
            if not access_token:
                raise ValueError("Could not obtain access token from Google OAuth 2.0 refresh token.")

            # Authenticate via XOAUTH2 over SMTP
            auth_string = f"user={from_email}\1auth=Bearer {access_token}\1\1"
            
            server = smtplib.SMTP_SSL('smtp.gmail.com', 465, timeout=15)
            server.ehlo()
            server.docmd('AUTH', 'XOAUTH2 ' + base64.b64encode(auth_string.encode('utf-8')).decode('utf-8'))
            server.sendmail(from_email, recipients, msg.as_string())
            server.quit()

            logger.info(f"Google OAuth 2.0 email sent successfully to {recipients}")
            return True, "Email sent successfully via Google OAuth 2.0"

        # Fallback to standard SMTP password
        host = config.host or 'smtp.gmail.com'
        port = int(config.port or 465)

        if config.secure or port == 465:
            server = smtplib.SMTP_SSL(host, port, timeout=15)
        else:
            server = smtplib.SMTP(host, port, timeout=15)
            server.starttls()

        if config.user and config.password:
            server.login(config.user, config.password)

        server.sendmail(from_email, recipients, msg.as_string())
        server.quit()

        logger.info(f"SMTP email sent successfully to {recipients}")
        return True, "Email sent successfully via SMTP"
    except Exception as e:
        logger.exception("Failed to send email notification")
        return False, str(e)



def create_quote_record(**fields):
    try:
        return Quote.objects.create(**fields)
    except IntegrityError as exc:
        exc_str = str(exc).lower()
        if 'id' not in exc_str and 'pkey' not in exc_str and 'duplicate' not in exc_str and 'unique' not in exc_str and 'null' not in exc_str:
            raise

    with transaction.atomic():
        with connection.cursor() as cursor:
            cursor.execute('LOCK TABLE public."quote" IN EXCLUSIVE MODE')

        next_id = (Quote.objects.aggregate(max_id=Max('id'))['max_id'] or 0) + 1
        return Quote.objects.create(id=next_id, **fields)

