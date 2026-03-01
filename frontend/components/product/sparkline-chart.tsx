'use client'

import { LineChart, Line, ResponsiveContainer } from 'recharts'
import type { PriceHistory } from '@/_types/domain'

interface SparklineChartProps {
  data: PriceHistory[]
  color?: string
}

export function SparklineChart({ data, color = '#1976D2' }: SparklineChartProps) {
  const chartData = data.map((entry) => ({ price: entry.price }))

  return (
    <ResponsiveContainer width="100%" height={50}>
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="price"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
