'use client';

import React, { useState } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import { exportElementToPdf } from '@/lib/exportPdf';

interface ExportPdfButtonProps {
  elementId: string;
  fileName?: string;
  title?: string;
  buttonText?: string;
  className?: string;
}

export default function ExportPdfButton({
  elementId,
  fileName = 'Reporte_TrackCM.pdf',
  title = 'Reporte Oficial Colegio Mexicano',
  buttonText = 'Exportar Reporte PDF',
  className = '',
}: ExportPdfButtonProps) {
  const [exporting, setExporting] = useState<boolean>(false);

  const handleExport = async () => {
    try {
      setExporting(true);
      await exportElementToPdf(elementId, fileName, title);
    } catch (err) {
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all hover:scale-105 disabled:opacity-50 ${className}`}
    >
      {exporting ? (
        <>
          <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" /> Generando PDF...
        </>
      ) : (
        <>
          <Download className="w-4 h-4 text-emerald-400" /> {buttonText}
        </>
      )}
    </button>
  );
}
