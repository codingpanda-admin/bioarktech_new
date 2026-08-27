from decimal import Decimal
from io import BytesIO
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


BLUE = colors.HexColor('#B4C7E7')
LIGHT_BLUE = colors.HexColor('#D9E7F7')
BRAND_BLUE = colors.HexColor('#4472C4')
LINK_BLUE = colors.HexColor('#0563C1')
ORANGE = colors.HexColor('#C65911')
PEACH = colors.HexColor('#FCE4D6')
LIGHT_GRAY = colors.HexColor('#F2F2F2')

COMPANY_PHONE = '+1 (734) 604-2386'
COMPANY_WEBSITE = 'www.BioArkTech.com'
COMPANY_EMAIL = 'Sales@BioArkTech.com'
COMPANY_ADDRESS = '13 Taft Court, Rockville, MD 20850'


def _money(value):
    amount = Decimal(value or 0)
    return f'${amount:,.2f}'


def invoice_number_for(order):
    order_date = order.order_placed_date.strftime('%Y%m%d')
    return order.invoice_number or f'IV{order_date}{order.order_id:04d}'


def _clean(value):
    return escape(str(value or '').strip())


def _address_lines(order, address):
    user = order.user
    full_name = ' '.join(
        part for part in [user.first_name, user.last_name] if str(part or '').strip()
    ) or user.email
    company = str(user.company or '').strip()
    street_parts = [
        str(address.address_line_1 or '').strip(),
        str(address.address_line_2 or address.apt_suite or '').strip(),
    ]
    street = ', '.join(part for part in street_parts if part)
    city_line = ', '.join(part for part in [address.city, address.state] if str(part or '').strip())
    city_line = f'{city_line} {address.zipcode or ""}'.strip()
    phone = str(user.telephone or user.mobile or '').strip()

    return [
        full_name,
        company,
        street,
        city_line,
        f'TEL: {phone}' if phone else '',
        user.email,
    ]


def _draw_labeled_value(canvas, x, y, label, value, value_color=colors.black):
    canvas.setFont('Helvetica-Bold', 8.5)
    canvas.setFillColor(colors.black)
    canvas.drawString(x, y, label)
    label_width = canvas.stringWidth(label, 'Helvetica-Bold', 8.5)
    canvas.setFont('Helvetica-Bold', 8.5)
    canvas.setFillColor(value_color)
    canvas.drawString(x + label_width + 3, y, value)


def _draw_address_panel(canvas, x, y, width, height, title, lines):
    header_height = 21
    canvas.setStrokeColor(colors.black)
    canvas.setLineWidth(0.7)
    canvas.rect(x, y, width, height, stroke=1, fill=0)
    canvas.setFillColor(BLUE)
    canvas.rect(x, y + height - header_height, width, header_height, stroke=1, fill=1)
    canvas.setFillColor(colors.black)
    canvas.setFont('Helvetica-Bold', 10)
    canvas.drawString(x + 6, y + height - 14, title)

    text = canvas.beginText(x + 6, y + height - header_height - 13)
    text.setFont('Helvetica', 8.7)
    text.setLeading(15)
    for line in lines:
        if line:
            text.textLine(line[:82])
    canvas.drawText(text)


def _draw_invoice_header(canvas, doc, order, styles, compact=False):
    page_width, page_height = A4
    canvas.saveState()

    logo_path = Path(__file__).resolve().parent / 'assets' / 'invoice_logo.png'
    if logo_path.exists():
        canvas.drawImage(
            str(logo_path),
            29,
            page_height - (58 if compact else 89),
            width=132 if not compact else 92,
            height=51 if not compact else 35,
            preserveAspectRatio=True,
            mask='auto',
        )

    if compact:
        canvas.setFillColor(BRAND_BLUE)
        canvas.setFont('Helvetica-Bold', 24)
        canvas.drawRightString(page_width - 29, page_height - 42, 'Invoice')
        canvas.setStrokeColor(BRAND_BLUE)
        canvas.setLineWidth(1)
        canvas.line(29, page_height - 66, page_width - 29, page_height - 66)
        canvas.restoreState()
        return

    contact_x = 181
    contact_y = page_height - 47
    _draw_labeled_value(canvas, contact_x, contact_y, 'Phone:', COMPANY_PHONE)
    _draw_labeled_value(canvas, contact_x, contact_y - 17, 'Website:', COMPANY_WEBSITE, LINK_BLUE)
    _draw_labeled_value(canvas, contact_x, contact_y - 34, 'Email:', COMPANY_EMAIL, LINK_BLUE)
    _draw_labeled_value(canvas, contact_x, contact_y - 51, 'Address:', COMPANY_ADDRESS)

    canvas.setFillColor(BRAND_BLUE)
    canvas.setFont('Helvetica-Bold', 31)
    canvas.drawRightString(page_width - 37, page_height - 71, 'Invoice')

    panel_y = page_height - 259
    panel_width = 253
    panel_height = 130
    _draw_address_panel(
        canvas,
        29,
        panel_y,
        panel_width,
        panel_height,
        'Bill To',
        _address_lines(order, order.billing_address),
    )
    _draw_address_panel(
        canvas,
        page_width - 29 - panel_width,
        panel_y,
        panel_width,
        panel_height,
        'Ship To',
        _address_lines(order, order.shipping_address),
    )

    invoice_number = invoice_number_for(order)
    payment_status = 'Paid' if order.paid else (order.transaction_status or 'Pending').title()
    terms = 'Paid' if order.paid else 'Due on receipt'
    metadata = [
        ['Invoice No.', 'Date', 'Total Due', 'Terms', 'Payment Status'],
        [
            invoice_number,
            order.order_placed_date.strftime('%m/%d/%Y'),
            _money(order.total_price),
            terms,
            payment_status,
        ],
    ]
    metadata_table = Table(metadata, colWidths=[101, 116, 95, 137, 87], rowHeights=[22, 23])
    metadata_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), LIGHT_BLUE),
        ('GRID', (0, 0), (-1, -1), 1.2, ORANGE),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica'),
        ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9.5),
        ('FONTSIZE', (0, 1), (-1, 1), 9.5),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TEXTCOLOR', (1, 1), (3, 1), colors.red),
        ('TEXTCOLOR', (4, 1), (4, 1), LINK_BLUE),
    ]))
    metadata_table.wrapOn(canvas, 537, 45)
    metadata_table.drawOn(canvas, 29, page_height - 334)

    quote_value = order.po_number or ''
    quote_table = Table(
        [[Paragraph('Quote ID', styles['invoice_meta']), Paragraph(_clean(quote_value), styles['invoice_meta'])]],
        colWidths=[300, 237],
        rowHeights=[17],
    )
    quote_table.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 1.2, colors.HexColor('#5B9BD5')),
        ('LINEAFTER', (0, 0), (0, 0), 1.0, colors.HexColor('#5B9BD5')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
    ]))
    quote_table.wrapOn(canvas, 537, 17)
    quote_table.drawOn(canvas, 29, page_height - 364)

    canvas.restoreState()


def build_invoice_pdf(order):
    buffer = BytesIO()
    page_width, page_height = A4
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name='invoice_body',
        parent=styles['BodyText'],
        fontName='Helvetica',
        fontSize=8.3,
        leading=10.2,
        textColor=colors.black,
        spaceAfter=0,
    ))
    styles.add(ParagraphStyle(
        name='invoice_center',
        parent=styles['invoice_body'],
        alignment=TA_CENTER,
    ))
    styles.add(ParagraphStyle(
        name='invoice_right',
        parent=styles['invoice_body'],
        alignment=TA_RIGHT,
    ))
    styles.add(ParagraphStyle(
        name='invoice_meta',
        parent=styles['invoice_body'],
        fontSize=8.7,
        leading=10,
        alignment=TA_LEFT,
    ))

    doc = BaseDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=29,
        rightMargin=29,
        topMargin=0,
        bottomMargin=38,
        title=f'BioArk Invoice {invoice_number_for(order)}',
        author='BioArk Technologies',
        subject=f'Invoice for order {order.order_id}',
    )
    first_frame = Frame(29, 52, page_width - 58, page_height - 427, id='invoice-first', showBoundary=0)
    later_frame = Frame(29, 52, page_width - 58, page_height - 132, id='invoice-later', showBoundary=0)
    first_template = PageTemplate(
        id='First',
        frames=[first_frame],
        onPage=lambda canvas, active_doc: _draw_invoice_header(canvas, active_doc, order, styles),
        autoNextPageTemplate='Later',
    )
    later_template = PageTemplate(
        id='Later',
        frames=[later_frame],
        onPage=lambda canvas, active_doc: _draw_invoice_header(canvas, active_doc, order, styles, compact=True),
    )
    doc.addPageTemplates([first_template, later_template])

    line_items = list(order.orderitem_set.all().order_by('order_item_id'))
    item_rows = [[
        Paragraph('Order Date', styles['invoice_center']),
        Paragraph('Order ID', styles['invoice_center']),
        Paragraph('Activity', styles['invoice_center']),
        Paragraph('QTY', styles['invoice_center']),
        Paragraph('UNIT PRICE', styles['invoice_center']),
        Paragraph('TOTAL', styles['invoice_center']),
    ]]

    for item in line_items:
        activity = _clean(item.product_name)
        details = [part for part in [item.unit_size, f'SKU: {item.product_sku}' if item.product_sku else ''] if part]
        if details:
            activity = f'{activity}<br/><font size="7" color="#666666">{_clean(" | ".join(details))}</font>'
        item_rows.append([
            Paragraph(order.order_placed_date.strftime('%m/%d/%Y'), styles['invoice_center']),
            Paragraph(_clean(item.product_sku or order.order_id), styles['invoice_center']),
            Paragraph(activity, styles['invoice_body']),
            Paragraph(str(item.quantity), styles['invoice_center']),
            Paragraph(_money(item.unit_price), styles['invoice_right']),
            Paragraph(_money(item.total_price), styles['invoice_right']),
        ])

    if len(item_rows) == 1:
        item_rows.append([
            '',
            Paragraph(str(order.order_id), styles['invoice_center']),
            Paragraph('Order purchase', styles['invoice_body']),
            Paragraph(str(order.quantity), styles['invoice_center']),
            '',
            Paragraph(_money(order.subtotal), styles['invoice_right']),
        ])

    items_table = Table(
        item_rows,
        colWidths=[70, 72, 223, 41, 66, 65],
        repeatRows=1,
        hAlign='LEFT',
    )
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), BLUE),
        ('BOX', (0, 0), (-1, 0), 0.8, colors.black),
        ('INNERGRID', (0, 0), (-1, 0), 0.6, colors.black),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, 0), 8.2),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
        ('BACKGROUND', (-1, 1), (-1, -1), PEACH),
        ('LINEBELOW', (0, 1), (-1, -1), 0.25, colors.HexColor('#E6E6E6')),
    ]))

    balance_due = max(Decimal(order.total_price or 0) - Decimal(order.total_paid or 0), Decimal('0'))
    totals = Table(
        [
            ['Shipping Fee', _money(order.shipping_amount)],
            ['Sales Tax', _money(order.tax_amount)],
            ['Balance Due', _money(balance_due)],
        ],
        colWidths=[472, 65],
        rowHeights=[22, 22, 27],
        hAlign='LEFT',
    )
    totals.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTNAME', (0, 0), (-1, 1), 'Helvetica'),
        ('FONTNAME', (0, 2), (-1, 2), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 1), 8.7),
        ('FONTSIZE', (0, 2), (-1, 2), 10),
        ('BACKGROUND', (1, 0), (1, -1), PEACH),
        ('LINEABOVE', (0, 2), (-1, 2), 1.2, ORANGE),
        ('TEXTCOLOR', (1, 2), (1, 2), colors.red),
        ('RIGHTPADDING', (0, 0), (0, -1), 12),
        ('RIGHTPADDING', (1, 0), (1, -1), 5),
    ]))

    footer_note = Table([['Thank you for choosing BioArk Technologies.']], colWidths=[322], rowHeights=[22])
    footer_note.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_GRAY),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#666666')),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))

    story = [
        items_table,
        Spacer(1, 8),
        KeepTogether([totals, Spacer(1, 21), footer_note]),
    ]
    doc.build(story)
    return buffer.getvalue()
