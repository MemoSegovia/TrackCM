import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TrackCM — Educación Física Colegio Mexicano',
  description:
    'Sistema integral de registro antropométrico, pruebas de atletismo y evaluaciones cualitativas del Colegio Mexicano.',
  keywords: [
    'TrackCM',
    'Colegio Mexicano',
    'Educación Física',
    'IMC',
    'Atletismo',
    'Cronómetro',
    'Vercel',
    'Google Sheets API',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} dark`}>
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen flex flex-col selection:bg-emerald-500 selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}
