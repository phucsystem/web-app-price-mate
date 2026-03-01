import type { Metadata } from 'next'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'

export const metadata: Metadata = {
  title: 'Reset password',
}

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token } = await searchParams

  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          {token ? 'Set new password' : 'Reset password'}
        </h1>
        {!token && (
          <p className="mt-1 text-sm text-gray-500">
            We will send you a reset link by email
          </p>
        )}
      </div>
      <ResetPasswordForm token={token} />
    </>
  )
}
