'use client'

import { useForm } from '@tanstack/react-form'

interface AlertFormProps {
  currentPrice: number
  initialTargetPrice?: number
  onSave: (targetPrice: number) => Promise<void>
}

export function AlertForm({ currentPrice, initialTargetPrice, onSave }: AlertFormProps) {
  const form = useForm({
    defaultValues: {
      targetPrice: initialTargetPrice?.toString() ?? '',
    },
    onSubmit: async ({ value }) => {
      const parsed = Number(value.targetPrice)
      await onSave(parsed)
    },
  })

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        form.handleSubmit()
      }}
      className="flex flex-col gap-3"
    >
      <label className="text-sm font-medium text-gray-700">
        Alert me when price drops below
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
          <form.Field
            name="targetPrice"
            validators={{
              onChange: ({ value }) => {
                const parsed = Number(value)
                if (!value) return 'Target price is required'
                if (isNaN(parsed) || parsed <= 0) return 'Enter a valid price'
                if (parsed >= currentPrice) return `Must be below current price ($${currentPrice.toFixed(2)})`
                return undefined
              },
            }}
          >
            {(field) => (
              <div>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="0.00"
                  className="w-full rounded-md border border-gray-300 bg-white pl-7 pr-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {field.state.meta.errors.length > 0 && (
                  <p className="mt-1 text-xs text-red-600">{field.state.meta.errors[0]}</p>
                )}
              </div>
            )}
          </form.Field>
        </div>
        <button
          type="submit"
          disabled={form.state.isSubmitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {form.state.isSubmitting ? 'Saving…' : 'Set Alert'}
        </button>
      </div>
      <p className="text-xs text-gray-500">
        Current price: <span className="font-mono font-semibold">${currentPrice.toFixed(2)}</span>
      </p>
    </form>
  )
}
