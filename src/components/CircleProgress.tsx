'use client'

interface CircleProgressProps {
  value: number   // 0–100
  size?: number   // px, default 28
  stroke?: number // stroke width, default 3
}

export default function CircleProgress({ value, size = 28, stroke = 3 }: CircleProgressProps) {
  const r = (size - stroke * 2) / 2
  const cx = size / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - Math.min(value, 100) / 100)

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle
        cx={cx} cy={cx} r={r}
        fill="none"
        stroke="#E2E2D5"
        strokeWidth={stroke}
      />
      <circle
        cx={cx} cy={cx} r={r}
        fill="none"
        stroke="#2E7D32"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.4s ease' }}
      />
    </svg>
  )
}
