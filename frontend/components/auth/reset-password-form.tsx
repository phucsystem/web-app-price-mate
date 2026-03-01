'use client'

import { useForm } from '@tanstack/react-form'
import { useState } from 'react'
import Link from 'next/link'
import { API_BASE_URL } from '@/lib/constants'

type Step = 'request' | 'success' | 'reset'

interface ResetPasswordFormProps {
  token?: string
}

function RequestEmailForm({ onSuccess }: { onSuccess: () => void }) {
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: { email: '' },
    onSubmit: async ({ value }) => {
      setServerError(null)
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(value),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({ message: 'Request failed' }))
        setServerError(body.message ?? 'Request failed')
        return
      }
      onSuccess()
    },
  })

  return (
    <form
      onSubmit={(event) => { event.preventDefault(); form.handleSubmit() }}
      className="space-y-4 w-full"
    >
      {serverError && (
        <div className="rounded-sm bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
          {serverError}
        </div>
      )}

      <p className="text-sm text-gray-600">
        Enter your email and we will send you a link to reset your password.
      </p>

      <form.Field
        name="email"
        validators={{ onChange: ({ value }) => !value.includes('@') ? 'Valid email required' : undefined }}
        children={(field) => (
          <div>
            <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              id="reset-email"
              type="email"
              autoComplete="email"
              value={field.state.value}
              onChange={(event) => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
              className="block w-full rounded-sm border border-gray-300 px-3 py-2 text-sm
                         text-gray-900 placeholder-gray-400
                         focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="you@example.com"
            />
            {field.state.meta.errors.length > 0 && (
              <p className="mt-1 text-xs text-red-600">{field.state.meta.errors[0]}</p>
            )}
          </div>
        )}
      />

      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
        children={([canSubmit, isSubmitting]) => (
          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="w-full rounded-sm bg-blue-600 px-4 py-2.5 text-sm font-medium text-white
                       hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Sending…' : 'Send reset link'}
          </button>
        )}
      />

      <p className="text-center text-sm text-gray-600">
        <Link href="/login" className="text-blue-600 font-medium hover:text-blue-700">
          Back to sign in
        </Link>
      </p>
    </form>
  )
}

function NewPasswordForm({ token }: { token: string }) {
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: { password: '', confirmPassword: '' },
    onSubmit: async ({ value }) => {
      setServerError(null)
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: value.password }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({ message: 'Reset failed' }))
        setServerError(body.message ?? 'Reset failed')
        return
      }
      window.location.href = '/login?reset=success'
    },
  })

  return (
    <form
      onSubmit={(event) => { event.preventDefault(); form.handleSubmit() }}
      className="space-y-4 w-full"
    >
      {serverError && (
        <div className="rounded-sm bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
          {serverError}
        </div>
      )}

      <form.Field
        name="password"
        validators={{ onChange: ({ value }) => value.length < 8 ? 'Password must be at least 8 characters' : undefined }}
        children={(field) => (
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={field.state.value}
              onChange={(event) => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
              className="block w-full rounded-sm border border-gray-300 px-3 py-2 text-sm
                         text-gray-900 placeholder-gray-400
                         focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="At least 8 characters"
            />
            {field.state.meta.errors.length > 0 && (
              <p className="mt-1 text-xs text-red-600">{field.state.meta.errors[0]}</p>
            )}
          </div>
        )}
      />

      <form.Field
        name="confirmPassword"
        validators={{
          onChangeListenTo: ['password'],
          onChange: ({ value, fieldApi }) => {
            const password = fieldApi.form.getFieldValue('password')
            return value !== password ? 'Passwords do not match' : undefined
          },
        }}
        children={(field) => (
          <div>
            <label htmlFor="confirm-new-password" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm new password
            </label>
            <input
              id="confirm-new-password"
              type="password"
              autoComplete="new-password"
              value={field.state.value}
              onChange={(event) => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
              className="block w-full rounded-sm border border-gray-300 px-3 py-2 text-sm
                         text-gray-900 placeholder-gray-400
                         focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Repeat your password"
            />
            {field.state.meta.errors.length > 0 && (
              <p className="mt-1 text-xs text-red-600">{field.state.meta.errors[0]}</p>
            )}
          </div>
        )}
      />

      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
        children={([canSubmit, isSubmitting]) => (
          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="w-full rounded-sm bg-blue-600 px-4 py-2.5 text-sm font-medium text-white
                       hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Saving…' : 'Set new password'}
          </button>
        )}
      />
    </form>
  )
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [step, setStep] = useState<Step>(token ? 'reset' : 'request')

  if (step === 'success') {
    return (
      <div className="text-center space-y-4">
        <div className="text-4xl">✉️</div>
        <h2 className="text-lg font-semibold text-gray-900">Check your email</h2>
        <p className="text-sm text-gray-600">
          We sent a password reset link to your email address.
        </p>
        <Link href="/login" className="inline-block text-sm text-blue-600 font-medium hover:text-blue-700">
          Back to sign in
        </Link>
      </div>
    )
  }

  if (step === 'reset' && token) {
    return <NewPasswordForm token={token} />
  }

  return <RequestEmailForm onSuccess={() => setStep('success')} />
}
