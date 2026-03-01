import { cookies } from 'next/headers'
import { NavBar } from '@/components/shared/nav-bar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const authToken = cookieStore.get('authToken')?.value
  const isAuthenticated = !!authToken

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar isAuthenticated={isAuthenticated} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {children}
      </main>
    </div>
  )
}
