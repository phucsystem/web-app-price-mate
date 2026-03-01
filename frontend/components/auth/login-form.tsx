'use client'

import { useForm } from '@tanstack/react-form'
import { useState } from 'react'
import Link from 'next/link'

export function LoginForm() {
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: { email: '', password: '' },
    onSubmit: async ({ value }) => {
      setServerError(null)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(value),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({ message: 'Login failed' }))
        setServerError(body.message ?? 'Login failed')
        return
      }
      window.location.href = '/dashboard'
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
        name="email"
        validators={{ onChange: ({ value }) => !value.includes('@') ? 'Valid email required' : undefined }}
        children={(field) => (
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              id="email"
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

      <form.Field
        name="password"
        validators={{ onChange: ({ value }) => value.length < 8 ? 'Password must be at least 8 characters' : undefined }}
        children={(field) => (
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={field.state.value}
              onChange={(event) => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
              className="block w-full rounded-sm border border-gray-300 px-3 py-2 text-sm
                         text-gray-900 placeholder-gray-400
                         focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="••••••••"
            />
            {field.state.meta.errors.length > 0 && (
              <p className="mt-1 text-xs text-red-600">{field.state.meta.errors[0]}</p>
            )}
          </div>
        )}
      />

      <div className="flex items-center justify-between">
        <Link href="/reset-password" className="text-sm text-blue-600 hover:text-blue-700">
          Forgot password?
        </Link>
      </div>

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
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        )}
      />

      <p className="text-center text-sm text-gray-600">
        No account?{' '}
        <Link href="/register" className="text-blue-600 font-medium hover:text-blue-700">
          Create one
        </Link>
      </p>
    </form>
  )
}
