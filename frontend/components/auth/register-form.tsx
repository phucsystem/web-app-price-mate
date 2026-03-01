'use client'

import { useForm } from '@tanstack/react-form'
import { useState } from 'react'
import Link from 'next/link'

export function RegisterForm() {
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm({
    defaultValues: { email: '', password: '', confirmPassword: '', displayName: '' },
    onSubmit: async ({ value }) => {
      setServerError(null)
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: value.email,
          password: value.password,
          displayName: value.displayName,
        }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({ message: 'Registration failed' }))
        setServerError(body.message ?? 'Registration failed')
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
        name="displayName"
        validators={{ onChange: ({ value }) => value.trim().length < 2 ? 'Name must be at least 2 characters' : undefined }}
        children={(field) => (
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
              Display name
            </label>
            <input
              id="displayName"
              type="text"
              autoComplete="name"
              value={field.state.value}
              onChange={(event) => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
              className="block w-full rounded-sm border border-gray-300 px-3 py-2 text-sm
                         text-gray-900 placeholder-gray-400
                         focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Your name"
            />
            {field.state.meta.errors.length > 0 && (
              <p className="mt-1 text-xs text-red-600">{field.state.meta.errors[0]}</p>
            )}
          </div>
        )}
      />

      <form.Field
        name="email"
        validators={{ onChange: ({ value }) => !value.includes('@') ? 'Valid email required' : undefined }}
        children={(field) => (
          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              id="reg-email"
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
            <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="reg-password"
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
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm password
            </label>
            <input
              id="confirmPassword"
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
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        )}
      />

      <p className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link href="/login" className="text-blue-600 font-medium hover:text-blue-700">
          Sign in
        </Link>
      </p>
    </form>
  )
}
