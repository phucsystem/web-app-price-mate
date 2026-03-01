interface DealBadgeProps {
  score: 'great' | 'good' | 'average' | string
}

const scoreStyles: Record<string, string> = {
  great: 'bg-green-600 text-white',
  good: 'bg-blue-600 text-white',
  average: 'bg-yellow-500 text-white',
}

const scoreLabels: Record<string, string> = {
  great: 'Great Deal',
  good: 'Good Deal',
  average: 'Average',
}

export function DealBadge({ score }: DealBadgeProps) {
  const style = scoreStyles[score] ?? 'bg-gray-400 text-white'
  const label = scoreLabels[score] ?? score

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${style}`}>
      {label}
    </span>
  )
}
