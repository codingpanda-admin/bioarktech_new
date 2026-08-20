import logging
from datetime import timedelta
from decimal import Decimal
from email.mime.image import MIMEImage
from pathlib import Path

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.db import transaction
from django.utils import timezone
from django.utils.html import escape

from .invoice_pdf import build_invoice_pdf, invoice_number_for
from .models import Order


logger = logging.getLogger(__name__)
CLAIM_TIMEOUT = timedelta(minutes=15)


def _money(value):
    return f'${Decimal(value or 0):,.2f}'


def _claim_purchase_email(order_id):
    """Claim one delivery attempt while preventing concurrent duplicates."""
    now = timezone.now()
    with transaction.atomic():
        order = Order.objects.select_for_update().get(order_id=order_id)

        if not order.paid or order.transaction_status != 'completed':
            return False
        if order.purchase_email_status in ('legacy', 'sent'):
            return False
        if (
            order.purchase_email_status == 'sending'
            and order.purchase_email_attempted_at
            and order.purchase_email_attempted_at > now - CLAIM_TIMEOUT
        ):
            return False

        order.purchase_email_status = 'sending'
        order.purchase_email_attempted_at = now
        order.save(update_fields=['purchase_email_status', 'purchase_email_attempted_at'])
        return True


def _item_rows(order):
    rows = []
    for item in order.orderitem_set.all().order_by('order_item_id'):
        details = ' - '.join(part for part in [item.product_sku, item.unit_size] if part)
        detail_html = (
            f"<div style='margin-top:4px;color:#718096;font-size:12px;'>{escape(details)}</div>"
            if details else ''
        )
        rows.append(
            "<tr>"
            f"<td style='padding:12px 10px;border-bottom:1px solid #e6edf5;'>"
            f"<strong>{escape(item.product_name)}</strong>{detail_html}</td>"
            f"<td align='center' style='padding:12px 10px;border-bottom:1px solid #e6edf5;'>{item.quantity}</td>"
            f"<td align='right' style='padding:12px 10px;border-bottom:1px solid #e6edf5;'>{_money(item.total_price)}</td>"
            "</tr>"
        )
    return ''.join(rows)


def _build_html(order, invoice_number):
    customer_name = ' '.join(
        part for part in [order.user.first_name, order.user.last_name] if str(part or '').strip()
    ) or 'Customer'
    rows = _item_rows(order)
    if not rows:
        rows = (
            "<tr><td style='padding:12px 10px;'>Order purchase</td>"
            f"<td align='center' style='padding:12px 10px;'>{order.quantity}</td>"
            f"<td align='right' style='padding:12px 10px;'>{_money(order.subtotal)}</td></tr>"
        )

    return f"""<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f3f7fb;font-family:Arial,sans-serif;color:#172b4d;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f7fb;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="620" cellspacing="0" cellpadding="0" style="width:100%;max-width:620px;background:#ffffff;border:1px solid #dce7f3;">
        <tr><td style="padding:24px 32px;border-top:5px solid #087fea;text-align:center;">
          <img src="cid:bioark-logo" alt="BioArk Technologies" width="230" style="display:inline-block;width:230px;max-width:100%;height:auto;border:0;">
        </td></tr>
        <tr><td style="padding:8px 38px 34px;">
          <h1 style="margin:12px 0 10px;font-size:26px;line-height:1.3;text-align:center;color:#10264b;">Thank you for your purchase</h1>
          <p style="margin:0 0 24px;text-align:center;font-size:15px;line-height:1.6;color:#5c6f8c;">Your payment was successful and your order is being processed.</p>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#435472;">Hello {escape(customer_name)},</p>
          <p style="margin:0 0 22px;font-size:15px;line-height:1.65;color:#435472;">We have received your BioArk Technologies order. Your paid invoice is attached to this email as a PDF.</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:22px;background:#f7fafc;border:1px solid #e1eaf3;">
            <tr>
              <td style="padding:14px 16px;font-size:13px;color:#60728e;">Order</td>
              <td align="right" style="padding:14px 16px;font-size:14px;font-weight:bold;">#{order.order_id}</td>
            </tr>
            <tr>
              <td style="padding:0 16px 14px;font-size:13px;color:#60728e;">Invoice</td>
              <td align="right" style="padding:0 16px 14px;font-size:14px;font-weight:bold;">{escape(invoice_number)}</td>
            </tr>
            <tr>
              <td style="padding:0 16px 14px;font-size:13px;color:#60728e;">Amount paid</td>
              <td align="right" style="padding:0 16px 14px;font-size:16px;font-weight:bold;color:#087fea;">{_money(order.total_paid)}</td>
            </tr>
          </table>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:24px;border-collapse:collapse;font-size:14px;">
            <tr style="background:#eaf5ff;color:#17355f;">
              <th align="left" style="padding:10px;">Item</th>
              <th style="padding:10px;">Qty</th>
              <th align="right" style="padding:10px;">Total</th>
            </tr>
            {rows}
          </table>
          <p style="margin:0;font-size:14px;line-height:1.6;color:#5c6f8c;">If you have questions about this order, please reply to this email or contact BioArk Technologies support.</p>
        </td></tr>
        <tr><td style="padding:20px 32px;background:#f7fafc;border-top:1px solid #e2eaf3;text-align:center;font-size:12px;line-height:1.5;color:#718096;">
          BioArk Technologies<br>13 Taft Court, Rockville, MD 20850
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""


def send_purchase_confirmation_email(order_id):
    """Send one paid-order confirmation with the generated invoice attached."""
    if not _claim_purchase_email(order_id):
        return False

    try:
        order = (
            Order.objects.select_related('user', 'billing_address', 'shipping_address')
            .prefetch_related('orderitem_set')
            .get(order_id=order_id)
        )
        if not order.user.email:
            raise ValueError('The customer account has no email address.')

        invoice_number = invoice_number_for(order)
        pdf_content = build_invoice_pdf(order)
        filename = f'BioArk-Invoice-{invoice_number}.pdf'
        customer_name = order.user.first_name or 'Customer'
        plain_body = (
            f'Hello {customer_name},\n\n'
            f'Thank you for your BioArk Technologies purchase. Order #{order.order_id} '
            f'has been paid successfully. Your invoice {invoice_number} is attached as a PDF.\n\n'
            'BioArk Technologies'
        )
        notification_recipient = settings.EMAIL_NOTIFICATION_RECIPIENT.strip()
        cc_recipients = (
            [notification_recipient]
            if notification_recipient
            and notification_recipient.casefold() != order.user.email.casefold()
            else []
        )
        message = EmailMultiAlternatives(
            subject=f'BioArk order #{order.order_id} confirmation and invoice',
            body=plain_body,
            from_email=f'BioArk Technologies <{settings.DEFAULT_FROM_EMAIL}>',
            to=[order.user.email],
            cc=cc_recipients,
        )
        message.attach_alternative(_build_html(order, invoice_number), 'text/html')

        logo_path = Path(__file__).resolve().parent / 'assets' / 'invoice_logo.png'
        if logo_path.exists():
            logo = MIMEImage(logo_path.read_bytes(), _subtype='png')
            logo.add_header('Content-ID', '<bioark-logo>')
            logo.add_header('Content-Disposition', 'inline', filename='bioark-logo.png')
            message.attach(logo)

        message.attach(filename, pdf_content, 'application/pdf')
        message.send(fail_silently=False)
    except Exception:
        Order.objects.filter(
            order_id=order_id,
            purchase_email_status='sending',
        ).update(purchase_email_status='failed')
        logger.exception('Unable to send purchase confirmation email for order %s.', order_id)
        return False

    Order.objects.filter(order_id=order_id).update(
        purchase_email_status='sent',
        purchase_email_sent_at=timezone.now(),
    )
    logger.info('Purchase confirmation email sent for order %s.', order_id)
    return True


def queue_purchase_confirmation_email(order_id):
    """Deliver only after the successful order transaction commits."""
    transaction.on_commit(lambda: send_purchase_confirmation_email(order_id))
