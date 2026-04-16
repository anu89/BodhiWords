'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface BodhiTreeProps {
  leafCount: number        // how many leaves are shown (0–25+)
  size?: number            // svg width
  animate?: boolean        // breathe animation
  showGlow?: boolean       // gold glow on latest leaf
}

// Pre-defined leaf positions on the tree branches
const LEAF_POSITIONS = [
  // right upper cluster
  { x: 168, y: 68,  r: 0 },
  { x: 182, y: 55,  r: 20 },
  { x: 195, y: 70,  r: -10 },
  { x: 175, y: 82,  r: 15 },
  { x: 158, y: 57,  r: -20 },
  // right mid cluster
  { x: 178, y: 100, r: 10 },
  { x: 192, y: 88,  r: -5 },
  { x: 203, y: 102, r: 25 },
  { x: 165, y: 95,  r: -15 },
  { x: 185, y: 115, r: 5 },
  // right lower
  { x: 170, y: 128, r: -25 },
  { x: 188, y: 135, r: 18 },
  { x: 200, y: 120, r: -8 },
  { x: 158, y: 118, r: 12 },
  { x: 176, y: 142, r: -20 },
  // left-leaning extras
  { x: 148, y: 75,  r: -30 },
  { x: 142, y: 92,  r: 20 },
  { x: 150, y: 108, r: -15 },
  { x: 136, y: 65,  r: 10 },
  { x: 145, y: 122, r: -5 },
  // top crown
  { x: 162, y: 45,  r: 0 },
  { x: 178, y: 40,  r: 15 },
  { x: 193, y: 52,  r: -10 },
  { x: 148, y: 48,  r: 20 },
  { x: 170, y: 35,  r: -5 },
]

function Leaf({ x, y, rotation, visible, isNew, glow }: {
  x: number; y: number; rotation: number
  visible: boolean; isNew: boolean; glow: boolean
}) {
  if (!visible) return null
  return (
    <motion.g
      initial={isNew ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={isNew ? { type: 'spring', stiffness: 400, damping: 15, duration: 0.45 } : {}}
    >
      <g transform={`translate(${x},${y}) rotate(${rotation})`}>
        {/* Leaf shape */}
        <ellipse
          cx={0} cy={0} rx={9} ry={13}
          fill={glow ? '#81C784' : '#4CAF50'}
          stroke={glow ? '#C8A24A' : '#2E7D32'}
          strokeWidth={glow ? 1.5 : 0.8}
          style={glow ? { filter: 'drop-shadow(0 0 4px #C8A24A)' } : undefined}
        />
        {/* Leaf vein */}
        <line x1={0} y1={-11} x2={0} y2={11} stroke="#2E7D32" strokeWidth={0.6} opacity={0.6} />
        {/* Small side veins */}
        <line x1={0} y1={-4} x2={-5} y2={2} stroke="#2E7D32" strokeWidth={0.4} opacity={0.4} />
        <line x1={0} y1={-4} x2={5} y2={2} stroke="#2E7D32" strokeWidth={0.4} opacity={0.4} />
        <line x1={0} y1={3} x2={-5} y2={8} stroke="#2E7D32" strokeWidth={0.4} opacity={0.4} />
        <line x1={0} y1={3} x2={5} y2={8} stroke="#2E7D32" strokeWidth={0.4} opacity={0.4} />
      </g>
    </motion.g>
  )
}

export default function BodhiTree({ leafCount, size = 260, animate = true, showGlow = false }: BodhiTreeProps) {
  const shownLeaves = Math.min(leafCount, LEAF_POSITIONS.length)
  const completionPct = shownLeaves / LEAF_POSITIONS.length

  return (
    <motion.div
      animate={animate ? { scale: [1, 1.012, 1] } : {}}
      transition={animate ? { repeat: Infinity, duration: 4, ease: 'easeInOut' } : {}}
      style={{ display: 'inline-block', transformOrigin: 'center bottom' }}
    >
      <svg
        width={size}
        height={size * 1.1}
        viewBox="0 0 260 286"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Ground / roots suggestion */}
        <ellipse cx={130} cy={270} rx={60} ry={8} fill="#D7CBA0" opacity={0.4} />

        {/* Main trunk */}
        <path
          d="M115 268 C112 240 108 210 110 180 C112 155 115 140 118 120 C120 105 122 90 124 75"
          stroke="#5D4037" strokeWidth={14} strokeLinecap="round" fill="none"
        />
        <path
          d="M138 268 C140 240 143 210 141 180 C139 155 136 140 133 120 C131 105 129 90 128 75"
          stroke="#6D4C41" strokeWidth={10} strokeLinecap="round" fill="none"
        />
        {/* Center line of trunk (B logo hint) */}
        <path
          d="M125 268 C125 240 126 200 127 175 C128 145 128 110 130 75"
          stroke="#4E342E" strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.5}
        />

        {/* B-shape bulges on right side of trunk */}
        <path
          d="M134 145 C145 145 155 150 155 162 C155 174 145 178 134 178 Z"
          fill="#5D4037" stroke="#4E342E" strokeWidth={1}
        />
        <path
          d="M134 110 C145 110 154 114 154 125 C154 136 145 140 134 140 Z"
          fill="#6D4C41" stroke="#4E342E" strokeWidth={1}
        />

        {/* Main branches */}
        {/* Upper right */}
        <path d="M130 90 C140 80 155 68 168 58" stroke="#5D4037" strokeWidth={5} strokeLinecap="round" fill="none" />
        {/* Mid right */}
        <path d="M132 115 C144 105 158 95 172 88" stroke="#5D4037" strokeWidth={4} strokeLinecap="round" fill="none" />
        {/* Lower right */}
        <path d="M133 140 C146 132 160 122 173 118" stroke="#6D4C41" strokeWidth={4} strokeLinecap="round" fill="none" />
        {/* Upper left */}
        <path d="M128 88 C120 78 112 68 100 60" stroke="#5D4037" strokeWidth={4} strokeLinecap="round" fill="none" />
        {/* Mid left */}
        <path d="M129 113 C120 103 110 95 98 90" stroke="#6D4C41" strokeWidth={3} strokeLinecap="round" fill="none" />

        {/* Small sub-branches */}
        <path d="M168 58 C175 52 182 48 190 45" stroke="#6D4C41" strokeWidth={2.5} strokeLinecap="round" fill="none" />
        <path d="M168 58 C172 62 178 65 184 68" stroke="#6D4C41" strokeWidth={2} strokeLinecap="round" fill="none" />
        <path d="M172 88 C180 83 188 80 196 78" stroke="#6D4C41" strokeWidth={2} strokeLinecap="round" fill="none" />
        <path d="M172 88 C176 94 182 98 188 100" stroke="#6D4C41" strokeWidth={2} strokeLinecap="round" fill="none" />
        <path d="M173 118 C180 114 188 112 196 110" stroke="#6D4C41" strokeWidth={2} strokeLinecap="round" fill="none" />

        {/* Leaves — render in order, newest last (on top) */}
        <AnimatePresence>
          {LEAF_POSITIONS.map((pos, i) => (
            <Leaf
              key={i}
              x={pos.x}
              y={pos.y}
              rotation={pos.r}
              visible={i < shownLeaves}
              isNew={i === shownLeaves - 1}
              glow={showGlow && i === shownLeaves - 1}
            />
          ))}
        </AnimatePresence>

        {/* Seed stage — small sprout */}
        {shownLeaves === 0 && (
          <g>
            <path d="M127 185 C127 175 124 168 120 165" stroke="#81C784" strokeWidth={2} strokeLinecap="round" fill="none" />
            <ellipse cx={120} cy={162} rx={6} ry={8} fill="#A5D6A7" transform="rotate(-20 120 162)" />
          </g>
        )}

        {/* Completion sparkles */}
        {completionPct >= 1 && (
          <>
            {[...Array(6)].map((_, i) => {
              const angle = (i * 60) * Math.PI / 180
              const r = 18
              const cx = 160 + r * Math.cos(angle)
              const cy = 80 + r * Math.sin(angle)
              return (
                <motion.circle
                  key={i}
                  cx={cx} cy={cy} r={2.5}
                  fill="#C8A24A"
                  animate={{ opacity: [1, 0.3, 1], scale: [1, 1.4, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.25 }}
                />
              )
            })}
          </>
        )}
      </svg>
    </motion.div>
  )
}
