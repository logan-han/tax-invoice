import { useMemo, memo, Fragment } from 'react';
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

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const formatDate = (iso: string): string => {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  const [y, m, d] = parts;
  const monthIdx = parseInt(m, 10) - 1;
  if (Number.isNaN(monthIdx) || monthIdx < 0 || monthIdx > 11) return iso;
  return `${parseInt(d, 10)} ${MONTHS[monthIdx]} ${y}`;
};

const formatCurrency = (amount: number): string => {
  const num = Number(amount) || 0;
  const sign = num < 0 ? '-' : '';
  const abs = Math.abs(num);
  const str = abs.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
  return `${sign}$${str}`;
};

const joinAddrTail = (p: {
  suburb?: string;
  state?: string;
  postcode?: string;
}): string => [p.suburb, p.state, p.postcode].filter(Boolean).join(' ');

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
  const { subtotal, gst, grandTotal } = useMemo(() => {
    let sub = 0;
    let gstSum = 0;
    items.forEach((it) => {
      const base = it.gst === 'inclusive' ? it.price / 1.1 : it.price;
      sub += base * it.quantity;
      if (it.gst === 'add') gstSum += it.price * it.quantity * 0.1;
      else if (it.gst === 'inclusive') gstSum += it.price * it.quantity * (1 - 1 / 1.1);
    });
    return { subtotal: sub, gst: gstSum, grandTotal: sub + gstSum };
  }, [items]);

  const hasBankDetails = Boolean(businessDetails.bsb && businessDetails.accountNumber);
  const hasGst = gst > 0;

  return (
    <div className="paper" id="invoice">
      <div className="inv-top">
        <div>
          <div className="inv-brand-name">{businessDetails.name || 'Your business'}</div>
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
          <div className="inv-badge-kicker">Tax Invoice</div>
          <div className="inv-badge-num">
            #<span>{invoiceNumber || '—'}</span>
          </div>
          <div className="inv-meta-grid">
            <span className="lbl">Issued</span>
            <span>{formatDate(invoiceDate) || '—'}</span>
            {dueDate && (
              <Fragment>
                <span className="lbl">Due Date:</span>
                <span>{formatDate(dueDate)}</span>
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
          <div className="inv-party-name">{clientDetails.name || 'Client name'}</div>
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
              <td colSpan={5} className="empty">
                No items yet.
              </td>
            </tr>
          )}
          {items.map((item) => {
            const unit = item.gst === 'inclusive' ? item.price / 1.1 : item.price;
            const amount = unit * item.quantity;
            const gstTag =
              item.gst === 'add' || item.gst === 'inclusive' ? '10%' : '—';
            return (
              <tr key={item.id}>
                <td>{item.name || <span className="placeholder">Item description</span>}</td>
                <td className="num">{item.quantity}</td>
                <td className="num">{formatCurrency(unit)}</td>
                <td>
                  <span className="gst-tag">{gstTag}</span>
                </td>
                <td className="num">{formatCurrency(amount)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="inv-totals">
        <table className="inv-totals-table">
          <tbody>
            {hasGst ? (
              <Fragment>
                <tr>
                  <td>Subtotal</td>
                  <td className="num">{formatCurrency(subtotal)}</td>
                </tr>
                <tr>
                  <td>TOTAL GST(10%)</td>
                  <td className="num">{formatCurrency(gst)}</td>
                </tr>
                <tr className="grand">
                  <td>Total {currency}</td>
                  <td className="num">{formatCurrency(grandTotal)}</td>
                </tr>
              </Fragment>
            ) : (
              <tr className="grand">
                <td>Total {currency}</td>
                <td className="num">{formatCurrency(grandTotal)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="inv-footer">
        <div>
          <div className="bank-label">Remit to</div>
          <div>{businessDetails.accountName || '—'}</div>
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
            <div className="bank-missing">Add BSB &amp; account</div>
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
