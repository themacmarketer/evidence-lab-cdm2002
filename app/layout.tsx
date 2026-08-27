import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Evidence Lab — CDM2002',
  description: 'An interactive field guide to data analytics and visualisation for CDM2002.',
  openGraph: {
    title: 'Evidence Lab — CDM2002',
    description: 'Don’t just read the chart. Question it.',
    images: [{ url: '/og.png', width: 1730, height: 909, alt: 'Evidence Lab — Don’t just read the chart. Question it.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Evidence Lab — CDM2002',
    description: 'Don’t just read the chart. Question it.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
