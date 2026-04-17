import type { Metadata } from 'next'
import './globals.css'
import { AppProvider } from '@/context/AppContext'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'BodhiWords — Learn 5 Words Daily',
  description: 'A vocabulary mastery platform. Grow your Bodhi Tree of knowledge, one word at a time.',
  keywords: ['vocabulary', 'english', 'ESL', 'learning', 'words', 'mnemonic'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-bodhi-bg text-bodhi-text antialiased" suppressHydrationWarning>
        <AppProvider>
          <Navbar />
          <main className="md:pt-14 pb-16 md:pb-0 min-h-screen">
            {children}
          </main>
        </AppProvider>
      </body>
    </html>
  )
}
