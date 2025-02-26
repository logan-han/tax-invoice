import React, { useState, useEffect, Fragment } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import '../styles.css';

const InvoicePDF = ({ businessDetails, clientDetails, items, invoiceDate, invoiceNumber, dueDate, currencyRemark = { enabled: false, currency: 'AUD' } }) => {
    const [total, setTotal] = useState(0);
    const [gst, setGst] = useState(0);
    const [grandTotal, setGrandTotal] = useState(0);

    useEffect(() => {
        const calculateTotal = () => {
            return items.reduce((total, item) => total + item.quantity * item.price, 0);
        };

        const calculateGST = () => {
            return items.reduce((totalGST, item) => totalGST + (item.gst ? item.quantity * item.price * 0.1 : 0), 0);
        };

        const total = calculateTotal();
        const gst = calculateGST();
        const grandTotal = total + gst;

        setTotal(total);
        setGst(gst);
        setGrandTotal(grandTotal);
    }, [items]);

    const formatDate = (date) => {
        const [day, month, year] = date.split('-');
        return `${day}-${month}-${year}`;
    };

    const formatCurrency = (amount) => {
        const num = parseFloat(amount);
        return `$${num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
    };

    const generatePDF = () => {
        const input = document.getElementById('invoice');
        html2canvas(input).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgWidth = 190;
            const pageHeight = pdf.internal.pageSize.height;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 10;

            pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight + 10;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`invoice_${formatDate(invoiceDate).replace(/-/g, '')}-${invoiceNumber}.pdf`);
        });
    };

    return (
        <div>
            <div id="invoice" className="invoice">
                <table align="center" border="0" cellPadding="0" cellSpacing="0" className="table">
                    <tbody><tr>
                        <td valign="top">Bill To: <br /><br />
                            <table width="100%" cellSpacing="0" cellPadding="0">
                                <tbody><tr>
                                    <td valign="top" width="35%" className="clientDetails">
                                        <strong>{clientDetails.name}</strong><br />
                                        {clientDetails.abn && <Fragment>ABN: {clientDetails.abn}<br /></Fragment>}
                                        {clientDetails.acn && <Fragment>ACN: {clientDetails.acn}<br /></Fragment>}
                                        {clientDetails.street}<br />
                                        {clientDetails.suburb} {clientDetails.state} {clientDetails.postcode}<br />
                                        {clientDetails.email && <Fragment>Email: {clientDetails.email}<br /></Fragment>}
                                        {clientDetails.phone && <Fragment>Phone: {clientDetails.phone}<br /></Fragment>}
                                    </td>
                                     <td valign="top" width="35%"/>
                                    <td valign="top" width="30%" className="invoiceDates">
                                        <table className="dateBox"><tbody>
                                            <tr><td className="dateLabel" style={{ textAlign: 'right' }}>Invoice Date:</td><td className="dateValue">{formatDate(invoiceDate)}</td></tr>
                                            {dueDate && <tr><td className="dateLabel" style={{ textAlign: 'right' }}><b>Due Date:</b></td><td className="dateValue">{formatDate(dueDate)}</td></tr>}
                                        </tbody></table>
                                    </td>
                                </tr></tbody>
                            </table>
                            <table width="100%" height="100" cellSpacing="0" cellPadding="0"><tbody><tr>
                                    <td><div align="center" className="invoiceNumber">Tax Invoice # {invoiceNumber}</div></td>
                                </tr></tbody>
                            </table>
                            <table width="100%" cellSpacing="0" cellPadding="2" border="1" bordercolor="#CCCCCC">
                                <tbody>
                                    <tr><td width="25%" bordercolor="#ccc" bgcolor="#f2f2f2" className="tableHeader" style={{ textAlign: 'center' }}><strong>Description</strong></td><td width="10%" bordercolor="#ccc" bgcolor="#f2f2f2" className="tableHeader" style={{ textAlign: 'center' }}><strong>Qty</strong></td><td width="15%" bordercolor="#ccc" bgcolor="#f2f2f2" className="tableHeader" style={{ textAlign: 'center' }}><strong>Unit Price</strong></td><td width="10%" bordercolor="#ccc" bgcolor="#f2f2f2" className="tableHeader" style={{ textAlign: 'center' }}><strong>GST</strong></td><td width="15%" bordercolor="#ccc" bgcolor="#f2f2f2" className="tableHeader" style={{ textAlign: 'center' }}><strong>Amount {currencyRemark.enabled && currencyRemark.currency}</strong></td></tr>
                                    {items.map((item, index) => (
                                        <tr key={index}><td valign="top" className="tableCell" style={{ textAlign: 'center' }}>{item.name}</td><td valign="top" className="tableCell" style={{ textAlign: 'center' }}>{item.quantity}</td><td valign="top" className="tableCell" style={{ textAlign: 'center' }}>{formatCurrency(item.price)}</td><td valign="top" className="tableCell" style={{ textAlign: 'center' }}>{item.gst ? '10%' : '0%'}</td><td valign="top" className="tableCell" style={{ textAlign: 'center' }}>{formatCurrency(item.quantity * item.price * (item.gst ? 1.1 : 1))}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                            <table width="100%" cellSpacing="0" cellPadding="2" border="0">
                                <tbody>
                                    {gst > 0 ? (
                                        <Fragment>
                                            <tr><td align="right" className="tableCell">Subtotal</td><td align="right" className="tableCell">{formatCurrency(total)}</td></tr>
                                            <tr><td align="right" className="tableCell">TOTAL GST(10%)</td><td align="right" className="tableCell">{formatCurrency(gst)}</td></tr>
                                            <tr><td align="right" className="tableCell"><b>Total {currencyRemark.enabled && currencyRemark.currency}</b></td><td align="right" className="tableCell"><b>{formatCurrency(grandTotal)}</b></td></tr>
                                        </Fragment>
                                    ) : (
                                        <tr><td align="right" className="tableCell"><b>Total {currencyRemark.enabled && currencyRemark.currency}</b></td><td align="right" className="tableCell"><b>{formatCurrency(grandTotal)}</b></td></tr>
                                    )}
                                </tbody>
                            </table>
                            <table width="100%" height="50"><tbody><tr><td className="footer"></td></tr></tbody></table>
                            <table width="100%" cellSpacing="0" cellPadding="2">
                                <tbody><tr>
                                    <td width="33%" className="footerDetails" valign="top">
                                        <b>{businessDetails.name}</b><br />
                                        {businessDetails.abn && <Fragment>ABN: {businessDetails.abn}<br /></Fragment>}
                                        {businessDetails.acn && <Fragment>ACN: {businessDetails.acn}<br /></Fragment>}
                                        {businessDetails.street}<br />
                                        {businessDetails.suburb} {businessDetails.state} {businessDetails.postcode} <br />
                                        {businessDetails.email && <Fragment>{businessDetails.email}<br /></Fragment>}
                                        {businessDetails.phone && <Fragment>{businessDetails.phone}<br /></Fragment>}
                                    </td>
                                    {businessDetails.bsb && businessDetails.accountNumber && (
                                        <td valign="top" width="34%" className="footerDetails" align="right">
                                            <table><tbody>
                                                <tr><td colSpan="2" className="footerDetailsValue" style={{ textAlign: 'right' }}>Bank Account Details</td></tr>
                                                <tr><td colSpan="2" className="footerDetailsValue" style={{ textAlign: 'right' }}>{businessDetails.accountName}</td></tr>
                                                <tr><td className="footerDetailsLabel" style={{ textAlign: 'right' }}>BSB:</td><td className="footerDetailsValue">{businessDetails.bsb}</td></tr>
                                                <tr><td className="footerDetailsLabel" style={{ textAlign: 'right' }}>Account No:</td><td className="footerDetailsValue">{businessDetails.accountNumber}</td></tr>
                                            </tbody></table>
                                        </td>
                                    )}
                                </tr></tbody>
                            </table>
                        </td>
                    </tr></tbody>
                </table>
            </div>
            <button onClick={generatePDF} className="button pdf-button">Generate PDF</button>
        </div>
    );
};

export default InvoicePDF;
