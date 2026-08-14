import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Generate PDF from invoice data
export const generateInvoicePDF = (invoice) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = margin;
  
  // Colors
  const primaryColor = [37, 99, 235]; // #2563EB
  const darkColor = [31, 41, 55]; // #1F2937
  const lightGray = [156, 163, 175]; // #9CA3AF
  
  // Header - Company Info
  doc.setFontSize(24);
  doc.setTextColor(...primaryColor);
  doc.text('INVOICE', pageWidth - margin, yPos, { align: 'right' });
  
  yPos += 10;
  doc.setFontSize(12);
  doc.setTextColor(...lightGray);
  doc.text(`#${invoice.invoiceNumber}`, pageWidth - margin, yPos, { align: 'right' });
  
  yPos += 15;
  doc.setTextColor(...darkColor);
  doc.setFontSize(10);
  
  // Company details (right aligned)
  const companyLines = [
    invoice.company.name,
    invoice.company.email,
    invoice.company.phone,
    `${invoice.company.address}, ${invoice.company.city}`,
    `${invoice.company.state} ${invoice.company.zip}`,
  ];
  
  companyLines.forEach((line) => {
    doc.text(line, pageWidth - margin, yPos, { align: 'right' });
    yPos += 5;
  });
  
  // Bill To section
  yPos = margin;
  doc.setFontSize(14);
  doc.setTextColor(...darkColor);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', margin, yPos);
  
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  
  const clientLines = [
    invoice.client.name,
    invoice.client.email,
    invoice.client.phone,
    invoice.client.address,
    `${invoice.client.city}, ${invoice.client.state} ${invoice.client.zip}`,
  ];
  
  clientLines.forEach((line) => {
    doc.text(line, margin, yPos);
    yPos += 5;
  });
  
  // Invoice details
  yPos += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice Details:', margin, yPos);
  
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  const detailsLines = [
    `Invoice Date: ${formatDate(invoice.invoiceDate)}`,
    `Due Date: ${formatDate(invoice.dueDate)}`,
    `Payment Terms: ${invoice.paymentTerms}`,
  ];
  
  detailsLines.forEach((line) => {
    doc.text(line, margin, yPos);
    yPos += 5;
  });
  
  // Items table
  yPos += 15;
  
  const tableColumn = ['Description', 'Qty', 'Unit Price', 'Tax %', 'Amount'];
  const tableRows = invoice.items.map(item => [
    item.description,
    item.quantity.toString(),
    formatCurrency(item.unitPrice, invoice.currency),
    `${item.tax}%`,
    formatCurrency(item.quantity * item.unitPrice * (1 + item.tax / 100), invoice.currency),
  ]);
  
  doc.autoTable({
    startY: yPos,
    head: [tableColumn],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: darkColor,
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    margin: { left: margin, right: margin },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 30, halign: 'right' },
    },
  });
  
  yPos = doc.lastAutoTable.finalY + 10;
  
  // Totals
  const subtotal = invoice.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const taxTotal = invoice.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * item.tax / 100), 0);
  const discountAmount = invoice.discountType === 'percentage' 
    ? subtotal * (invoice.discount / 100) 
    : invoice.discount;
  const total = subtotal + taxTotal - discountAmount + (invoice.shipping || 0);
  
  const totalsX = pageWidth - margin - 80;
  
  doc.setFontSize(10);
  
  // Subtotal
  doc.text('Subtotal:', totalsX, yPos, { align: 'right' });
  doc.text(formatCurrency(subtotal, invoice.currency), pageWidth - margin, yPos, { align: 'right' });
  yPos += 6;
  
  // Discount
  if (invoice.discount > 0) {
    doc.setTextColor(22, 163, 74); // Green
    doc.text('Discount:', totalsX, yPos, { align: 'right' });
    doc.text(`-${formatCurrency(discountAmount, invoice.currency)}`, pageWidth - margin, yPos, { align: 'right' });
    doc.setTextColor(...darkColor);
    yPos += 6;
  }
  
  // Tax
  doc.text('Tax:', totalsX, yPos, { align: 'right' });
  doc.text(formatCurrency(taxTotal, invoice.currency), pageWidth - margin, yPos, { align: 'right' });
  yPos += 6;
  
  // Shipping
  if (invoice.shipping > 0) {
    doc.text('Shipping:', totalsX, yPos, { align: 'right' });
    doc.text(formatCurrency(invoice.shipping, invoice.currency), pageWidth - margin, yPos, { align: 'right' });
    yPos += 6;
  }
  
  // Total
  yPos += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...primaryColor);
  doc.text('Total:', totalsX, yPos, { align: 'right' });
  doc.text(formatCurrency(total, invoice.currency), pageWidth - margin, yPos, { align: 'right' });
  
  // Notes and Terms
  yPos += 20;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...darkColor);
  
  if (invoice.notes) {
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', margin, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    const notesLines = doc.splitTextToSize(invoice.notes, pageWidth - margin * 2);
    doc.text(notesLines, margin, yPos);
    yPos += notesLines.length * 5 + 10;
  }
  
  if (invoice.terms) {
    doc.setFont('helvetica', 'bold');
    doc.text('Terms & Conditions:', margin, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    const termsLines = doc.splitTextToSize(invoice.terms, pageWidth - margin * 2);
    doc.text(termsLines, margin, yPos);
  }
  
  // Footer
  const footerY = pageHeight - 20;
  doc.setFontSize(8);
  doc.setTextColor(...lightGray);
  doc.text('Thank you for your business!', pageWidth / 2, footerY, { align: 'center' });
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, footerY + 5, { align: 'center' });
  
  return doc;
};

// Download PDF
export const downloadInvoicePDF = (invoice) => {
  const doc = generateInvoicePDF(invoice);
  doc.save(`Invoice_${invoice.invoiceNumber}.pdf`);
};

// Format currency helper
const formatCurrency = (amount, currency = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  } catch (e) {
    return `${currency} ${amount.toFixed(2)}`;
  }
};

// Format date helper
const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (e) {
    return dateString;
  }
};

export default {
  generateInvoicePDF,
  downloadInvoicePDF,
};