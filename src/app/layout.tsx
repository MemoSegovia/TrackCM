import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const viewport = {
  themeColor: '#10b981',
};

export const metadata: Metadata = {
  title: 'TrackCM — Educación Física Colegio Mexicano',
  description:
    'Sistema integral de registro antropométrico, pruebas de atletismo y evaluaciones cualitativas del Colegio Mexicano.',
  manifest: '/manifest.json',
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
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#10b981" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen flex flex-col selection:bg-emerald-500 selection:text-slate-950">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
