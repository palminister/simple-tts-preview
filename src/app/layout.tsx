import type { Metadata } from 'next';
import { Mitr } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';

const openRunde = localFont({
  src: [
    {
      path: './fonts/OpenRunde-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: './fonts/OpenRunde-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-open-runde',
});

const mitr = Mitr({
  subsets: ['latin', 'thai'],
  weight: ['400'],
  variable: '--font-mitr',
});

export const metadata: Metadata = {
  title: 'Voice Preview',
  description: 'Preview voice samples in English and Thai.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body className={`${openRunde.variable} ${mitr.variable}`}>
        {children}
      </body>
    </html>
  );
}
