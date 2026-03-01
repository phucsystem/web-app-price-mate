'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface SearchBarProps {
  initialQuery?: string
  placeholder?: string
  size?: 'sm' | 'lg'
}

export function SearchBar({ initialQuery = '', placeholder = 'Search Amazon AU products…', size = 'lg' }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery)
  const router = useRouter()

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const trimmed = query.trim()
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`)
    }
  }

  const inputClass = size === 'lg'
    ? 'w-full rounded-l-lg border border-gray-300 bg-white pl-4 pr-3 py-3 text-base text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500'
    : 'w-full rounded-l-md border border-gray-300 bg-gray-50 pl-3 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'

  const buttonClass = size === 'lg'
    ? 'rounded-r-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white hover:bg-blue-700 transition-colors'
    : 'rounded-r-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors'

  return (
    <form onSubmit={handleSubmit} className="flex w-full">
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
      <button type="submit" className={buttonClass}>
        Search
      </button>
    </form>
  )
}
