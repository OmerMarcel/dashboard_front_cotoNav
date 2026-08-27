'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import PushNotifications from '@/components/PushNotifications'
import LogoLoader from '@/components/LogoLoader'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  if (loading) {
    return <LogoLoader fullScreen={true} size="lg" text="Chargement de votre session..." />
  }

  if (!user) {
    router.push('/login')
    return null
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden md:ml-0">
        <PushNotifications />
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-slate-900 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

