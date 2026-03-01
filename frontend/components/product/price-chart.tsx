'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import type { PriceHistory } from '@/_types/domain'

interface PriceChartProps {
  data: PriceHistory[]
  height?: number
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' })
}

export function PriceChart({ data, height = 300 }: PriceChartProps) {
  const chartData = data.map((entry) => ({
    date: formatDate(entry.recordedAt),
    price: entry.price,
  }))

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: '#757575' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          domain={['auto', 'auto']}
          tick={{ fontSize: 11, fill: '#757575' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value: number) => `$${value}`}
        />
        <Tooltip
          formatter={(value: number | undefined) => [value != null ? `$${value.toFixed(2)}` : '—', 'Price']}
          labelStyle={{ color: '#212121', fontWeight: 600 }}
          contentStyle={{ border: '1px solid #E0E0E0', borderRadius: 8, fontSize: 12 }}
        />
        <Line
          type="monotone"
          dataKey="price"
          stroke="#1976D2"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: '#1976D2' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
