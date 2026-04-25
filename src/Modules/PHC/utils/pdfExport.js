import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const isBlank = (value) => value === null || value === undefined || value === '';

const formatCellValue = (value) => {
  if (isBlank(value)) {
    return '-';
  }

  if (Array.isArray(value)) {
    if (!value.length) {
      return '-';
    }

    return value.map((item) => formatCellValue(item)).join(', ');
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
};

const applyTable = (doc, { startY, title, headers, rows, headColor = [30, 41, 59] }) => {
  let cursorY = startY;

  if (title) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(title, 14, cursorY);
    cursorY += 6;
  }

  autoTable(doc, {
    startY: cursorY,
    head: [headers],
    body: rows.map((row) => row.map((cell) => formatCellValue(cell))),
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 2,
      overflow: 'linebreak',
      valign: 'top',
    },
    headStyles: {
      fillColor: headColor,
      textColor: 255,
      fontStyle: 'bold',
    },
    margin: { left: 14, right: 14 },
  });

  return doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 8 : cursorY + 8;
};

export const downloadPdfReport = ({
  fileName,
  title,
  subtitle,
  metadata = [],
  sections = [],
}) => {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(title, 14, 18);

  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const subtitleLines = doc.splitTextToSize(subtitle, pageWidth - 28);
    doc.text(subtitleLines, 14, 25);
  }

  let cursorY = subtitle ? 34 : 25;

  if (metadata.length) {
    cursorY = applyTable(doc, {
      startY: cursorY,
      title: 'Summary',
      headers: ['Field', 'Value'],
      rows: metadata,
      headColor: [59, 130, 246],
    });
  }

  sections.forEach((section) => {
    cursorY = applyTable(doc, {
      startY: cursorY,
      title: section.title,
      headers: section.headers,
      rows: section.rows,
      headColor: section.headColor || [30, 41, 59],
    });
  });

  doc.save(fileName);
};
