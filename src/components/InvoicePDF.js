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
            return items.reduce((total, item) => 
                total + item.quantity * (item.gst === 'inclusive' ? item.price / 1.1 : item.price), 0);
        };

        const calculateGST = () => {
            return items.reduce((totalGST, item) => {
                if (item.gst === 'add') {
                    return totalGST + item.quantity * item.price * 0.1;
                } else if (item.gst === 'inclusive') {
                    return totalGST + item.quantity * item.price * (1 - 1 / 1.1);
                }
                return totalGST;
            }, 0);
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

        html2canvas(input, {
          scale: 2
        }).then((canvas) => {
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const imgProps = pdf.getImageProperties(imgData);
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          const imgAspectRatio = imgProps.width / imgProps.height;
          const scaleFactor = pdfWidth / imgProps.width;
          const imgWidth = pdfWidth;
          const imgHeight = imgProps.height * scaleFactor;

          let position = 0;

            if (imgHeight <= pdfHeight) {
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            } else {
                let currentHeight = 0;
                while (currentHeight < imgHeight) {
                    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                    currentHeight += pdfHeight
                    if (currentHeight < imgHeight){
                        pdf.addPage()
                        position = -currentHeight
                    }
                }
            }

          pdf.save(`invoice_${formatDate(invoiceDate).replace(/-/g, '')}-${invoiceNumber}.pdf`);
        });
    };

    return (
        <div>
            <div id="invoice" className="invoice" style={{ width: '210mm', margin: '0 auto' }}>
                <table align="center" border="0" cellPadding="0" cellSpacing="0" className="table">
                    <tbody><tr>
                        <td valign="top" style={{ width: '100%' }}> {/* Add width:100% here */}
                            Bill To: <br /><br />
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
                                        <table className="dateBox" style={{ width: '100%', lineHeight: "1.2"}}><tbody>
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
                                    <tr>
                                        <td width="25%" bordercolor="#ccc" bgcolor="#f2f2f2" className="tableHeader" style={{ textAlign: 'center' }}>
                                            <strong>Description</strong>
                                        </td>
                                        <td width="10%" bordercolor="#ccc" bgcolor="#f2f2f2" className="tableHeader" style={{ textAlign: 'center' }}>
                                            <strong>Qty</strong>
                                        </td>
                                        <td width="15%" bordercolor="#ccc" bgcolor="#f2f2f2" className="tableHeader" style={{ textAlign: 'center' }}>
                                            <strong>Unit Price</strong>
                                        </td>
                                        <td width="10%" bordercolor="#ccc" bgcolor="#f2f2f2" className="tableHeader" style={{ textAlign: 'center' }}>
                                            <strong>GST</strong>
                                        </td>
                                        <td width="15%" bordercolor="#ccc" bgcolor="#f2f2f2" className="tableHeader" style={{ textAlign: 'center' }}>
                                            <strong>Amount {currencyRemark.enabled && currencyRemark.currency}</strong>
                                        </td>
                                    </tr>
                                    {items.map((item, index) => (
                                        <tr key={index}>
                                            <td valign="top" className="tableCell" style={{ textAlign: 'center' }}>{item.name}</td>
                                            <td valign="top" className="tableCell" style={{ textAlign: 'center' }}>{item.quantity}</td>
                                            <td valign="top" className="tableCell" style={{ textAlign: 'center' }}>{formatCurrency(item.gst === 'inclusive' ? item.price / 1.1 : item.price)}</td>
                                            <td valign="top" className="tableCell" style={{ textAlign: 'center' }}>{item.gst === 'add' || item.gst === 'inclusive' ? '10%' : '0%'}</td>
                                            <td valign="top" className="tableCell" style={{ textAlign: 'center' }}>{formatCurrency(item.quantity * item.price)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <table width="100%" cellSpacing="0" cellPadding="2" border="0">
                                <tbody>
                                    {gst > 0 ? (
                                        <Fragment>
                                            <tr>
                                                <td align="right" className="tableCell">Subtotal</td>
                                                <td align="right" className="tableCell">{formatCurrency(total)}</td>
                                            </tr>
                                            <tr>
                                                <td align="right" className="tableCell">TOTAL GST(10%)</td>
                                                <td align="right" className="tableCell">{formatCurrency(gst)}</td>
                                            </tr>
                                            <tr>
                                                <td align="right" className="tableCell"><b>Total {currencyRemark.enabled && currencyRemark.currency}</b></td>
                                                <td align="right" className="tableCell"><b>{formatCurrency(grandTotal)}</b></td>
                                            </tr>
                                        </Fragment>
                                    ) : (
                                        <tr>
                                            <td align="right" className="tableCell"><b>Total {currencyRemark.enabled && currencyRemark.currency}</b></td>
                                            <td align="right" className="tableCell"><b>{formatCurrency(grandTotal)}</b></td>
                                        </tr>
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
                                            <table style={{width: "100%", lineHeight: "1.2"}}>
                                                <tbody>
                                                    <tr><td colSpan="2" className="footerDetailsValue" style={{ textAlign: 'right', paddingBottom: '5px' }}>Bank Account Details</td></tr> {/* add paddingBottom: 5px here */}
                                                    <tr><td colSpan="2" className="footerDetailsValue" style={{ textAlign: 'right' }}>{businessDetails.accountName}</td></tr>
                                                    <tr><td className="footerDetailsLabel" style={{ textAlign: 'right' }}>BSB:</td><td className="footerDetailsValue">{businessDetails.bsb}</td></tr>
                                                    <tr><td className="footerDetailsLabel" style={{ textAlign: 'right' }}>Account No:</td><td className="footerDetailsValue">{businessDetails.accountNumber}</td></tr>
                                                </tbody>
                                            </table>
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
