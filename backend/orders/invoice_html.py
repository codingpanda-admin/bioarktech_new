import base64
from decimal import Decimal
from html import escape
from pathlib import Path

from .invoice_pdf import (
    COMPANY_ADDRESS,
    COMPANY_EMAIL,
    COMPANY_PHONE,
    COMPANY_WEBSITE,
    invoice_number_for,
)


def _text(value):
    return escape(str(value or '').strip())


def _money(value):
    return f'${Decimal(value or 0):,.2f}'


def _address_html(order, address):
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
    city = ', '.join(part for part in [address.city, address.state] if str(part or '').strip())
    city = f'{city} {address.zipcode or ""}'.strip()
    country = str(address.country or '').strip()
    phone = str(user.telephone or user.mobile or '').strip()
    lines = [full_name, company, street, city, country, f'TEL: {phone}' if phone else '', user.email]
    return ''.join(f'<div>{_text(line)}</div>' for line in lines if line)


def _logo_data_uri():
    logo_path = Path(__file__).resolve().parent / 'assets' / 'invoice_logo.png'
    if not logo_path.exists():
        return ''
    encoded = base64.b64encode(logo_path.read_bytes()).decode('ascii')
    return f'data:image/png;base64,{encoded}'


def build_invoice_html(order):
    invoice_number = invoice_number_for(order)
    payment_status = 'Paid' if order.paid else (order.transaction_status or 'Pending').title()
    terms = 'Paid' if order.paid else 'Due on receipt'
    balance_due = max(Decimal(order.total_price or 0) - Decimal(order.total_paid or 0), Decimal('0'))
    items = list(order.orderitem_set.all().order_by('order_item_id'))

    item_rows = []
    for item in items:
        details = ' | '.join(
            part for part in [
                str(item.unit_size or '').strip(),
                f'SKU: {item.product_sku}' if item.product_sku else '',
            ]
            if part
        )
        details_html = f'<div class="item-details">{_text(details)}</div>' if details else ''
        item_rows.append(f'''
            <tr>
              <td>{order.order_placed_date.strftime('%m/%d/%Y')}</td>
              <td>{_text(item.product_sku or order.order_id)}</td>
              <td class="activity"><strong>{_text(item.product_name)}</strong>{details_html}</td>
              <td class="numeric">{item.quantity}</td>
              <td class="numeric">{_money(item.unit_price)}</td>
              <td class="numeric total-cell">{_money(item.total_price)}</td>
            </tr>''')

    if not item_rows:
        item_rows.append(f'''
            <tr>
              <td>{order.order_placed_date.strftime('%m/%d/%Y')}</td>
              <td>{order.order_id}</td>
              <td class="activity">Order purchase</td>
              <td class="numeric">{order.quantity}</td>
              <td class="numeric">&mdash;</td>
              <td class="numeric total-cell">{_money(order.subtotal)}</td>
            </tr>''')

    logo_uri = _logo_data_uri()
    logo_html = f'<img class="logo" src="{logo_uri}" alt="BioArk Technologies">' if logo_uri else '<div class="brand">BioArk Technologies</div>'
    return f'''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>BioArk Invoice {_text(invoice_number)}</title>
  <style>
    :root {{ color-scheme: light; --blue: #4472c4; --light-blue: #d9e7f7; --pale-blue: #f4f8fd; --green: #00b77d; --orange: #c65911; --peach: #fce4d6; --ink: #17213a; --muted: #60708f; }}
    * {{ box-sizing: border-box; }}
    body {{ margin: 0; background: #eef3f8; color: var(--ink); font: 14px/1.45 Arial, Helvetica, sans-serif; }}
    .actions {{ position: sticky; top: 0; z-index: 10; display: flex; justify-content: center; gap: 12px; padding: 14px; background: rgba(238, 243, 248, .96); border-bottom: 1px solid #d5dfeb; }}
    .action {{ min-width: 150px; padding: 11px 18px; border: 0; border-radius: 7px; color: #fff; background: linear-gradient(100deg, #0878df, var(--green)); font: 700 14px Arial, sans-serif; text-align: center; text-decoration: none; cursor: pointer; box-shadow: 0 6px 16px rgba(20, 103, 180, .18); }}
    .invoice {{ width: min(100% - 32px, 980px); margin: 28px auto; padding: 44px; background: #fff; border: 1px solid #d9e2ef; box-shadow: 0 12px 36px rgba(42, 67, 105, .1); }}
    .header {{ display: grid; grid-template-columns: 1fr auto; gap: 30px; align-items: start; border-bottom: 3px solid var(--blue); padding-bottom: 22px; }}
    .logo {{ width: 220px; max-width: 100%; height: auto; }}
    .brand {{ color: var(--blue); font-size: 25px; font-weight: 700; }}
    .company {{ margin-top: 14px; color: var(--muted); line-height: 1.65; }}
    .invoice-title {{ margin: 0; color: var(--blue); font-size: 42px; line-height: 1; text-align: right; }}
    .invoice-number {{ margin-top: 13px; color: var(--muted); text-align: right; }}
    .addresses {{ display: grid; grid-template-columns: 1fr 1fr; gap: 22px; margin-top: 28px; }}
    .address {{ min-height: 150px; border: 1px solid #aab7c9; }}
    .address h2 {{ margin: 0; padding: 9px 13px; background: var(--light-blue); color: var(--ink); font-size: 15px; }}
    .address-body {{ padding: 13px; line-height: 1.6; }}
    .metadata {{ display: grid; grid-template-columns: repeat(5, 1fr); margin-top: 24px; border: 1px solid var(--orange); }}
    .meta {{ text-align: center; border-right: 1px solid var(--orange); }}
    .meta:last-child {{ border-right: 0; }}
    .meta-label {{ padding: 7px 5px; background: var(--light-blue); font-size: 12px; }}
    .meta-value {{ padding: 9px 5px; font-weight: 700; }}
    .paid {{ color: #067a54; }}
    .quote-id {{ margin-top: 8px; padding: 6px 12px; border: 1px solid #5b9bd5; font-size: 12px; }}
    table {{ width: 100%; margin-top: 28px; border-collapse: collapse; }}
    th {{ padding: 10px 8px; background: #b4c7e7; border: 1px solid #8797ad; font-size: 12px; text-align: left; }}
    td {{ padding: 11px 8px; border-bottom: 1px solid #e1e7ef; vertical-align: top; }}
    th.numeric, td.numeric {{ text-align: right; white-space: nowrap; }}
    .activity {{ width: 36%; }}
    .item-details {{ margin-top: 3px; color: var(--muted); font-size: 11px; }}
    .total-cell {{ background: var(--peach); }}
    .totals {{ width: min(100%, 340px); margin: 20px 0 0 auto; }}
    .total-line {{ display: flex; justify-content: space-between; gap: 24px; padding: 8px 10px; }}
    .total-line span:last-child {{ min-width: 90px; text-align: right; }}
    .balance {{ margin-top: 3px; border-top: 2px solid var(--orange); font-size: 17px; font-weight: 700; }}
    .balance span:last-child {{ color: #d33; }}
    .thanks {{ margin-top: 34px; padding: 11px 14px; background: #f2f2f2; color: #666; font-size: 12px; }}
    @media (max-width: 720px) {{
      .invoice {{ width: 100%; margin: 0; padding: 22px 16px; border: 0; box-shadow: none; }}
      .header, .addresses {{ grid-template-columns: 1fr; }}
      .invoice-title, .invoice-number {{ text-align: left; }}
      .metadata {{ grid-template-columns: 1fr 1fr; }}
      .meta {{ border-bottom: 1px solid var(--orange); }}
      .table-wrap {{ overflow-x: auto; }}
      table {{ min-width: 680px; }}
    }}
    @media print {{
      @page {{ size: auto; margin: 12mm; }}
      body {{ background: #fff; font-size: 11px; }}
      .actions {{ display: none !important; }}
      .invoice {{ width: 100%; margin: 0; padding: 0; border: 0; box-shadow: none; }}
      .header {{ break-inside: avoid; }}
      .addresses, .metadata, .totals {{ break-inside: avoid; }}
      thead {{ display: table-header-group; }}
      tr {{ break-inside: avoid; }}
    }}
  </style>
</head>
<body>
  <nav class="actions" aria-label="Invoice actions">
    <button class="action" type="button" onclick="window.print()">Print Invoice</button>
  </nav>
  <main class="invoice">
    <header class="header">
      <div>
        {logo_html}
        <div class="company">
          <div>{_text(COMPANY_ADDRESS)}</div>
          <div>{_text(COMPANY_PHONE)} &nbsp;|&nbsp; {_text(COMPANY_EMAIL)}</div>
          <div>{_text(COMPANY_WEBSITE)}</div>
        </div>
      </div>
      <div>
        <h1 class="invoice-title">Invoice</h1>
        <div class="invoice-number">Invoice No. <strong>{_text(invoice_number)}</strong></div>
      </div>
    </header>

    <section class="addresses">
      <article class="address"><h2>Bill To</h2><div class="address-body">{_address_html(order, order.billing_address)}</div></article>
      <article class="address"><h2>Ship To</h2><div class="address-body">{_address_html(order, order.shipping_address)}</div></article>
    </section>

    <section class="metadata" aria-label="Invoice details">
      <div class="meta"><div class="meta-label">Invoice No.</div><div class="meta-value">{_text(invoice_number)}</div></div>
      <div class="meta"><div class="meta-label">Date</div><div class="meta-value">{order.order_placed_date.strftime('%m/%d/%Y')}</div></div>
      <div class="meta"><div class="meta-label">Total</div><div class="meta-value">{_money(order.total_price)}</div></div>
      <div class="meta"><div class="meta-label">Terms</div><div class="meta-value">{_text(terms)}</div></div>
      <div class="meta"><div class="meta-label">Payment Status</div><div class="meta-value paid">{_text(payment_status)}</div></div>
    </section>
    <div class="quote-id"><strong>Order ID:</strong> {_text(order.order_id)}{f' &nbsp; <strong>PO / Quote ID:</strong> {_text(order.po_number)}' if order.po_number else ''}</div>

    <div class="table-wrap">
      <table>
        <thead><tr><th>Order Date</th><th>SKU</th><th>Activity</th><th class="numeric">Qty</th><th class="numeric">Unit Price</th><th class="numeric">Total</th></tr></thead>
        <tbody>{''.join(item_rows)}</tbody>
      </table>
    </div>

    <section class="totals" aria-label="Invoice totals">
      <div class="total-line"><span>Subtotal</span><span>{_money(order.subtotal)}</span></div>
      <div class="total-line"><span>Shipping Fee</span><span>{_money(order.shipping_amount)}</span></div>
      <div class="total-line"><span>Sales Tax</span><span>{_money(order.tax_amount)}</span></div>
      <div class="total-line"><span>Total</span><span>{_money(order.total_price)}</span></div>
      <div class="total-line balance"><span>Balance Due</span><span>{_money(balance_due)}</span></div>
    </section>
    <footer class="thanks">Thank you for choosing BioArk Technologies.</footer>
  </main>
</body>
</html>'''
