import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
            <div id="invoice" style={styles.invoice}>
                <table align="center" border="0" cellPadding="0" cellSpacing="0" style={styles.table}>
                    <tbody>
                        <tr>
                            <td valign="top">
                                Bill To: <br /><br />
                                <table width="100%" cellSpacing="0" cellPadding="0">
                                    <tbody>
                                        <tr>
                                            <td valign="top" width="35%" style={styles.clientDetails}>
                                                <strong>{clientDetails.name}</strong><br />
                                                {clientDetails.abn && <>ABN: {clientDetails.abn}<br /></>}
                                                {clientDetails.acn && <>ACN: {clientDetails.acn}<br /></>}
                                                {clientDetails.street}<br />
                                                {clientDetails.suburb} {clientDetails.state} {clientDetails.postcode}<br />
                                                {clientDetails.email && <>Email: {clientDetails.email}<br /></>}
                                                {clientDetails.phone && <>Phone: {clientDetails.phone}<br /></>}
                                            </td>
                                            <td valign="top" width="35%"></td>
                                            <td valign="top" width="30%" style={styles.invoiceDates}>
                                                <table style={styles.dateBox}>
                                                    <tbody>
                                                        <tr>
                                                            <td style={{ ...styles.dateLabel, textAlign: 'right' }}>Invoice Date:</td>
                                                            <td style={styles.dateValue}>{formatDate(invoiceDate)}</td>
                                                        </tr>
                                                        {dueDate && (
                                                            <tr>
                                                                <td style={{ ...styles.dateLabel, textAlign: 'right' }}><b>Due Date:</b></td>
                                                                <td style={styles.dateValue}>{formatDate(dueDate)}</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                                <table width="100%" height="100" cellSpacing="0" cellPadding="0">
                                    <tbody>
                                        <tr>
                                            <td>
                                                <div align="center" style={styles.invoiceNumber}>Tax Invoice # {invoiceNumber}</div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                                <table width="100%" cellSpacing="0" cellPadding="2" border="1" bordercolor="#CCCCCC">
                                    <tbody>
                                        <tr>
                                            <td width="25%" bordercolor="#ccc" bgcolor="#f2f2f2" style={{ ...styles.tableHeader, textAlign: 'center' }}><strong>Description</strong></td>
                                            <td width="10%" bordercolor="#ccc" bgcolor="#f2f2f2" style={{ ...styles.tableHeader, textAlign: 'center' }}><strong>Qty</strong></td>
                                            <td width="15%" bordercolor="#ccc" bgcolor="#f2f2f2" style={{ ...styles.tableHeader, textAlign: 'center' }}><strong>Unit Price</strong></td>
                                            <td width="10%" bordercolor="#ccc" bgcolor="#f2f2f2" style={{ ...styles.tableHeader, textAlign: 'center' }}><strong>GST</strong></td>
                                            <td width="15%" bordercolor="#ccc" bgcolor="#f2f2f2" style={{ ...styles.tableHeader, textAlign: 'center' }}><strong>Amount {currencyRemark.enabled && currencyRemark.currency}</strong></td>
                                        </tr>
                                        {items.map((item, index) => (
                                            <tr key={index}>
                                                <td valign="top" style={{ ...styles.tableCell, textAlign: 'center' }}>{item.name}</td>
                                                <td valign="top" style={{ ...styles.tableCell, textAlign: 'center' }}>{item.quantity}</td>
                                                <td valign="top" style={{ ...styles.tableCell, textAlign: 'center' }}>
                                                    {formatCurrency(item.price)}
                                                </td>
                                                <td valign="top" style={{ ...styles.tableCell, textAlign: 'center' }}>{item.gst ? '10%' : '0%'}</td>
                                                <td valign="top" style={{ ...styles.tableCell, textAlign: 'center' }}>
                                                    {formatCurrency(item.quantity * item.price * (item.gst ? 1.1 : 1))}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <table width="100%" cellSpacing="0" cellPadding="2" border="0">
                                    <tbody>
                                        <tr>
                                            <td>
                                                <table width="100%" cellSpacing="0" cellPadding="2" border="0">
                                                    <tbody>
                                                        {gst > 0 && (
                                                            <>
                                                                <tr>
                                                                    <td align="right" style={styles.tableCell}>Subtotal</td>
                                                                    <td align="right" style={styles.tableCell}>
                                                                        {formatCurrency(total)}
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <td align="right" style={styles.tableCell}>TOTAL GST(10%)</td>
                                                                    <td align="right" style={styles.tableCell}>
                                                                        {formatCurrency(gst)}
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <td align="right" style={styles.tableCell}><b>Total {currencyRemark.enabled && currencyRemark.currency}</b></td>
                                                                    <td align="right" style={styles.tableCell}>
                                                                        <b>{formatCurrency(grandTotal)}</b>
                                                                    </td>
                                                                </tr>
                                                            </>
                                                        )}
                                                        {gst === 0 && (
                                                            <tr>
                                                                <td align="right" style={styles.tableCell}><b>Total {currencyRemark.enabled && currencyRemark.currency}</b></td>
                                                                <td align="right" style={styles.tableCell}>
                                                                    <b>{formatCurrency(grandTotal)}</b>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                                <table width="100%" height="50">
                                    <tbody>
                                        <tr>
                                            <td style={styles.footer}></td>
                                        </tr>
                                    </tbody>
                                </table>
                                <table width="100%" cellSpacing="0" cellPadding="2">
                                    <tbody>
                                        <tr>
                                            <td width="33%" style={styles.footerDetails} valign="top">
                                                <b>{businessDetails.name}</b><br />
                                                {businessDetails.abn && <>ABN: {businessDetails.abn}<br /></>}
                                                {businessDetails.acn && <>ACN: {businessDetails.acn}<br /></>}
                                                {businessDetails.street} <br />
                                                {businessDetails.suburb} {businessDetails.state} {businessDetails.postcode} <br />
                                                {businessDetails.email && <>{businessDetails.email}<br /></>}
                                                {businessDetails.phone && <>{businessDetails.phone}<br /></>}
                                            </td>
                                            {businessDetails.bsb && businessDetails.accountNumber && (
                                                <td valign="top" width="34%" style={styles.footerDetails} align="right">
                                                    <table>
                                                        <tbody>
                                                            <tr>
                                                                <td colSpan="2" style={{ ...styles.footerDetailsValue, textAlign: 'right' }}>Bank Account Details</td>
                                                            </tr>
                                                            <tr>
                                                                <td colSpan="2" style={{ ...styles.footerDetailsValue, textAlign: 'right' }}>{businessDetails.accountName}</td>
                                                            </tr>
                                                            <tr>
                                                                <td style={{ ...styles.footerDetailsLabel, textAlign: 'right' }}>BSB:</td>
                                                                <td style={styles.footerDetailsValue}>{businessDetails.bsb}</td>
                                                            </tr>
                                                            <tr>
                                                                <td style={{ ...styles.footerDetailsLabel, textAlign: 'right' }}>Account No:</td>
                                                                <td style={styles.footerDetailsValue}>{businessDetails.accountNumber}</td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </td>
                                            )}
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <button onClick={generatePDF} style={styles.button}>Generate PDF</button>
        </div>
    );
};

const styles = {
    invoice: {
        fontFamily: 'Tahoma',
        fontSize: '12px',
        color: '#333333',
        backgroundColor: '#FFFFFF',
        padding: '20px',
        border: '1px solid #ccc',
        borderRadius: '5px',
        maxWidth: '800px',
        margin: '0 auto'
    },
    table: {
        height: '842px',
        width: '595px',
        fontSize: '12px'
    },
    clientDetails: {
        fontSize: '12px'
    },
    invoiceDates: {
        fontSize: '12px'
    },
    dateBox: {
        border: '1px solid #000',
        padding: '5px',
        width: '100%'
    },
    dateLabel: {
        textAlign: 'left',
        paddingRight: '10px'
    },
    dateValue: {
        textAlign: 'right'
    },
    invoiceNumber: {
        fontSize: '14px',
        fontWeight: 'bold'
    },
    tableHeader: {
        fontSize: '12px',
        backgroundColor: '#f2f2f2'
    },
    tableCell: {
        fontSize: '12px'
    },
    amountInWords: {
        fontSize: '12px',
        width: '50%'
    },
    footer: {
        fontSize: '12px',
        textAlign: 'justify'
    },
    footerDetails: {
        borderTop: 'double medium #CCCCCC',
        fontSize: '12px'
    },
    footerDetailsBox: {
        border: '1px solid #000',
        padding: '5px',
        width: '100%'
    },
    footerDetailsLabel: {
        textAlign: 'left',
        paddingRight: '10px'
    },
    footerDetailsValue: {
        textAlign: 'right'
    },
    button: {
        display: 'block',
        width: '100%',
        padding: '10px',
        backgroundColor: '#007bff',
        color: '#fff',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        marginTop: '10px'
    }
};

export default InvoicePDF;