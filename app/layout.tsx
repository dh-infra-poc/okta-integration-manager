import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Fira_Sans } from 'next/font/google'
import './globals.css'

// Fira Sans — the closest free humanist grotesque to the corporate face (Corpid).
// The full weight range is loaded so the Black/Heavy vs Light/Regular contrast
// that defines the brand is available.
const firaSans = Fira_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700', '800', '900'],
  style: ['normal', 'italic'],
  variable: '--font-fira-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Delivery Hero — Slide System',
  description:
    'A spare, disciplined presentation design system: one red, white, black, one typeface.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#d82128',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={firaSans.variable}>
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
