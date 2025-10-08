import type { Metadata } from 'next'
import './globals.css'
import '@fontsource-variable/inter'
import '@fontsource/jetbrains-mono/latin.css'

export const metadata: Metadata = {
  title: 'Launchloom — Weave launch-ready agents from any idea',
  description: 'Launchloom turns raw ideas into production-ready agent blueprints: PRDs, runbooks, repo scaffolds, and compliance briefs in one package.',
  keywords: ['launchloom', 'agents', 'startup', 'prd', 'wireframes', 'code generation', 'ai'],
  authors: [{ name: 'Launchloom Team' }],
  robots: 'index, follow',
  openGraph: {
    title: 'Launchloom — Weave launch-ready agents from any idea',
    description: 'Launchloom delivers agent-powered startup dossiers in minutes.',
    type: 'website',
    url: 'https://launchloom.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Launchloom — Weave launch-ready agents from any idea',
    description: 'Launchloom delivers agent-powered startup dossiers in minutes.',
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
      <body className="h-full antialiased">
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          {children}
        </div>
      </body>
    </html>
  )
}
