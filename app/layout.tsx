import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: {
    default: 'TIXORA - The Ultimate Concert Ticketing Experience',
    template: '%s | TIXORA',
  },
  description: 'Platform ticketing konser premium dengan fitur war ticket, queue system, dan perlindungan anti-bot untuk pengalaman beli tiket terbaik.',
  keywords: ['ticketing', 'konser', 'tiket', 'event', 'kpop', 'festival', 'war ticket'],
  authors: [{ name: 'TIXORA' }],
  creator: 'TIXORA',
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: 'https://tixora.id',
    siteName: 'TIXORA',
    title: 'TIXORA — The Ultimate Concert Ticketing Experience',
    description: 'Platform ticketing konser dan event terpercaya.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TIXORA',
    description: 'The Ultimate Concert Ticketing Experience',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#FAFAFA" />
      </head>
      <body style={{ minHeight: '100vh', background: 'var(--background)', color: 'var(--text-primary)' }}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
