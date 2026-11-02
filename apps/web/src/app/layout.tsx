import type { Metadata } from 'next';
import { Bebas_Neue, Manrope } from 'next/font/google';
import { AuthProvider } from '@/lib/auth';
import './globals.css';

const bebas = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Gymverse — Multi-gym management',
  description:
    'Discover gyms. Join with a digital Member ID. Owners run memberships, attendance, and cash/UPI payments — without payment gateways.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${bebas.variable} ${manrope.variable}`}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
