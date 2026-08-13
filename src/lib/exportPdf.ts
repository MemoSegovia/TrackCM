import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function exportElementToPdf(
  elementId: string,
  fileName: string = 'Reporte_TrackCM.pdf',
  title: string = 'Reporte Oficial Colegio Mexicano'
) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found for PDF export.`);
    return;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#020617', // Match dark slate theme
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth - 20; // 10mm margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Header banner
    pdf.setFillColor(15, 23, 42); // slate-900
    pdf.rect(0, 0, pdfWidth, 20, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.setTextColor(16, 185, 129); // emerald-500
    pdf.text('TrackCM — Colegio Mexicano', 10, 12);

    pdf.setFontSize(10);
    pdf.setTextColor(203, 213, 225); // slate-300
    pdf.text(title, pdfWidth - 10, 12, { align: 'right' });

    let heightLeft = imgHeight;
    let position = 25;

    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight - 30;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    // Footer
    const totalPages = (pdf as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text(
        `Generado el ${new Date().toLocaleDateString()} | © Colegio Mexicano Soporte de Sistemas | Página ${i} de ${totalPages}`,
        pdfWidth / 2,
        pdfHeight - 5,
        { align: 'center' }
      );
    }

    pdf.save(fileName);
  } catch (err) {
    console.error('Error generating PDF:', err);
  }
}
