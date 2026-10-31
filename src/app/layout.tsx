import './globals.css';

import type { Metadata } from 'next';

import { Providers } from '@/components/providers';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: {
    default: 'CentCare Pro',
    template: '%s · CentCare Pro',
  },
  description: 'Hospital desk for registration, beds, charges, stock, and expenses.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={cn('h-full', 'antialiased', 'font-sans', inter.variable)}>
      <body className="min-h-full bg-background font-sans text-foreground">
        <Providers>
          <TooltipProvider>{children}</TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
