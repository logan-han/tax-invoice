import { useMemo, memo, Fragment } from 'react';
import { formatHumanDate } from '../utils/dates';
import { calculateTotals, formatMoney, lineExGst } from '../utils/money';
import type { BusinessDetails, ClientDetails, InvoiceItem } from '../types';

interface InvoicePDFProps {
  businessDetails: BusinessDetails;
  clientDetails: ClientDetails;
  items: InvoiceItem[];
  invoiceDate: string;
  invoiceNumber: string;
  dueDate: string;
  currency?: string;
  notes?: string;
}

const joinAddrTail = (p: { suburb?: string; state?: string; postcode?: string }): string =>
  [p.suburb, p.state, p.postcode].filter(Boolean).join(' ');

/** The A4 paper. Elements marked data-placeholder are editor hints, left out of the PDF and print. */
const InvoicePDF = memo(function InvoicePDF({
  businessDetails,
  clientDetails,
  items,
  invoiceDate,
  invoiceNumber,
  dueDate,
  currency = '',
  notes = '',
}: InvoicePDFProps) {
  const totals = useMemo(() => calculateTotals(items), [items]);
  const money = (amount: number) => formatMoney(amount, currency);

  const hasBankDetails = Boolean(businessDetails.bsb && businessDetails.accountNumber);
  const hasRemittance = Boolean(businessDetails.accountName || hasBankDetails);
  // Only GST-registered sellers may issue a tax invoice, so with no taxable lines it's an invoice.
  const isTaxInvoice = items.some((item) => item.gst !== 'no');

  return (
    <div className="paper" id="invoice">
      <div className="inv-top">
        <div>
          <div className="inv-brand-name">
            {businessDetails.name || <span data-placeholder="">Your business</span>}
          </div>
          <div className="inv-brand-meta">
            {businessDetails.street && <div>{businessDetails.street}</div>}
            {(businessDetails.suburb || businessDetails.state || businessDetails.postcode) && (
              <div>{joinAddrTail(businessDetails)}</div>
            )}
            {businessDetails.email && <div>{businessDetails.email}</div>}
            {businessDetails.phone && <div className="mono">{businessDetails.phone}</div>}
            {businessDetails.abn && <div className="mono">ABN: {businessDetails.abn}</div>}
            {businessDetails.acn && <div className="mono">ACN: {businessDetails.acn}</div>}
          </div>
        </div>
        <div className="inv-badge">
          <div className="inv-badge-kicker">{isTaxInvoice ? 'Tax Invoice' : 'Invoice'}</div>
          <div className="inv-badge-num">
            #<span>{invoiceNumber || '—'}</span>
          </div>
          <div className="inv-meta-grid">
            <span className="lbl">Issued</span>
            <span>{formatHumanDate(invoiceDate) || '—'}</span>
            {dueDate && (
              <Fragment>
                <span className="lbl">Due</span>
                <span>{formatHumanDate(dueDate)}</span>
              </Fragment>
            )}
            {currency && (
              <Fragment>
                <span className="lbl">Currency</span>
                <span>{currency}</span>
              </Fragment>
            )}
          </div>
        </div>
      </div>

      <div className="inv-parties">
        <div className="clientDetails">
          <div className="inv-party-label">Bill to</div>
          <div className="inv-party-name">
            {clientDetails.name || <span data-placeholder="">Client name</span>}
          </div>
          <div className="inv-party-detail">
            {clientDetails.street && <div>{clientDetails.street}</div>}
            {(clientDetails.suburb || clientDetails.state || clientDetails.postcode) && (
              <div>{joinAddrTail(clientDetails)}</div>
            )}
            {clientDetails.abn && <div className="mono">ABN: {clientDetails.abn}</div>}
            {clientDetails.acn && <div className="mono">ACN: {clientDetails.acn}</div>}
          </div>
        </div>
        <div className="footerDetails">
          <div className="inv-party-label">From</div>
          <div className="inv-party-name">{businessDetails.name || '—'}</div>
          <div className="inv-party-detail">
            {businessDetails.abn && <div className="mono">ABN: {businessDetails.abn}</div>}
            {businessDetails.acn && <div className="mono">ACN: {businessDetails.acn}</div>}
            {businessDetails.email && <div>{businessDetails.email}</div>}
            {businessDetails.phone && <div>{businessDetails.phone}</div>}
          </div>
        </div>
      </div>

      <table className="inv-table">
        <thead>
          <tr>
            <th>Description</th>
            <th className="num" style={{ width: 50 }}>
              Qty
            </th>
            <th className="num" style={{ width: 90 }}>
              Unit
            </th>
            <th style={{ width: 60 }}>GST</th>
            <th className="num" style={{ width: 90 }}>
              Amount {currency}
            </th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr>
              <td colSpan={5} className="empty" data-placeholder="">
                No items yet.
              </td>
            </tr>
          )}
          {items.map((item) => {
            const unit = item.gst === 'inclusive' ? item.price / 1.1 : item.price;
            return (
              <tr key={item.id}>
                <td>
                  {item.name || (
                    <span className="placeholder" data-placeholder="">
                      Item description
                    </span>
                  )}
                </td>
                <td className="num">{item.quantity}</td>
                <td className="num">{money(unit)}</td>
                <td>
                  <span className="gst-tag">{item.gst === 'no' ? '—' : '10%'}</span>
                </td>
                <td className="num">{money(lineExGst(item))}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="inv-totals">
        <table className="inv-totals-table">
          <tbody>
            {isTaxInvoice && (
              <Fragment>
                <tr>
                  <td>Subtotal</td>
                  <td className="num">{money(totals.subtotal)}</td>
                </tr>
                <tr>
                  <td>GST (10%)</td>
                  <td className="num">{money(totals.gst)}</td>
                </tr>
              </Fragment>
            )}
            <tr className="grand">
              <td>Total {currency}</td>
              <td className="num">{money(totals.total)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="inv-footer">
        <div data-placeholder={hasRemittance ? undefined : ''}>
          <div className="bank-label">Remit to</div>
          {businessDetails.accountName && <div>{businessDetails.accountName}</div>}
          {hasBankDetails ? (
            <Fragment>
              <div className="bank-label" style={{ marginTop: 10 }}>
                Bank Account Details
              </div>
              <div className="bank-row">
                <span>BSB</span>
                <span>{businessDetails.bsb}</span>
                <span>Account</span>
                <span>{businessDetails.accountNumber}</span>
              </div>
            </Fragment>
          ) : (
            <div className="bank-missing" data-placeholder="">
              Add BSB &amp; account
            </div>
          )}
        </div>
        <div className="notes">
          <div className="bank-label">Notes</div>
          <div style={{ whiteSpace: 'pre-wrap' }}>{notes}</div>
        </div>
      </div>
    </div>
  );
});

export default InvoicePDF;
