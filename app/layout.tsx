import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'I2S Studio - Idea to Startup Studio',
  description: 'Transform raw ideas into structured startup scaffolds in minutes. Generate PRDs, wireframes, code scaffolds, and agent runbooks.',
  keywords: ['startup', 'idea', 'prd', 'wireframes', 'code generation', 'ai'],
  authors: [{ name: 'I2S Studio Team' }],
  robots: 'index, follow',
  openGraph: {
    title: 'I2S Studio - Idea to Startup Studio',
    description: 'Transform raw ideas into structured startup scaffolds in minutes.',
    type: 'website',
    url: 'https://i2s-studio.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'I2S Studio - Idea to Startup Studio',
    description: 'Transform raw ideas into structured startup scaffolds in minutes.',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full antialiased`}>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          {children}
        </div>
      </body>
    </html>
  )
}
