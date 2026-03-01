'use client'

import { useSuspenseQuery } from '@tanstack/react-query'
import { getPriceHistory } from '@/services/product-service'

export function usePriceHistory(asin: string, range: string) {
  return useSuspenseQuery({
    queryKey: ['priceHistory', asin, range],
    queryFn: () => getPriceHistory(asin, range),
  })
}
