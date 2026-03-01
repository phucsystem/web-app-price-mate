import type { Metadata, Viewport } from 'next'
import { Providers } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'PriceMate AU — Track Amazon Prices in Australia',
    template: '%s | PriceMate AU',
  },
  description: 'Track Amazon Australia product prices, get alerts when prices drop, and find the best deals.',
  keywords: ['price tracker', 'amazon australia', 'price alerts', 'deals', 'shopping'],
  authors: [{ name: 'PriceMate AU' }],
  robots: 'index, follow',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
