import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Account',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center">
          <Link href="/" className="text-xl font-bold text-blue-600">
            PriceMate <span className="text-gray-500 text-sm font-medium">AU</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm bg-white rounded-md shadow-sm border border-gray-200 p-8">
          {children}
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} PriceMate AU
      </footer>
    </div>
  )
}
