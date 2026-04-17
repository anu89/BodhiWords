'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface BodhiTreeProps {
  leafCount: number        // how many leaves are shown (0–30)
  size?: number            // svg width
  animate?: boolean        // breathe animation
  showGlow?: boolean       // gold glow on latest leaf
}

// 30 leaf positions spread across the peepal canopy — outer clusters first so
// the tree fills from the tips inward as more words are learned.
const LEAF_POSITIONS = [
  // Far-left cluster
  { x: 18,  y: 58,  r: -40 },
  { x: 28,  y: 70,  r: -30 },
  { x: 22,  y: 84,  r: -25 },
  { x: 32,  y: 100, r: -20 },
  // Left cluster
  { x: 34,  y: 34,  r: -35 },
  { x: 46,  y: 50,  r: -25 },
  { x: 44,  y: 70,  r: -15 },
  { x: 55,  y: 86,  r: -10 },
  // Left-centre
  { x: 68,  y: 75,  r: -5  },
  { x: 78,  y: 60,  r:  5  },
  { x: 90,  y: 100, r: -15 },
  { x: 110, y: 28,  r:  15 },
  // Upper-left
  { x: 110, y: 70,  r:  10 },
  { x: 122, y: 52,  r:   0 },
  // Crown centre
  { x: 132, y: 40,  r: -10 },
  { x: 145, y: 28,  r:   5 },
  { x: 155, y: 20,  r:   0 },
  { x: 165, y: 28,  r:  -5 },
  { x: 178, y: 40,  r:  10 },
  // Upper-right
  { x: 186, y: 28,  r: -15 },
  { x: 188, y: 70,  r: -10 },
  // Right-centre
  { x: 200, y: 52,  r:   0 },
  { x: 220, y: 100, r:  15 },
  { x: 232, y: 75,  r:   5 },
  // Right cluster
  { x: 253, y: 86,  r:  10 },
  { x: 264, y: 70,  r:  15 },
  { x: 264, y: 50,  r:  25 },
  { x: 274, y: 34,  r:  35 },
  // Far-right cluster
  { x: 280, y: 70,  r:  30 },
  { x: 290, y: 56,  r:  40 },
]

// Peepal leaf — ovate body with the distinctive long acuminate drip-tip at top
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
        {/* Peepal leaf outline — wide middle, tapering to a long drip-tip */}
        <path
          d="M 0,7 C -3,5 -9,2 -10,-3 C -10,-8 -6,-13 -2,-16 C -1,-18 0,-20 0,-20 C 0,-20 1,-18 2,-16 C 6,-13 10,-8 10,-3 C 9,2 3,5 0,7 Z"
          fill={glow ? '#66BB6A' : '#43A047'}
          stroke={glow ? '#C8A24A' : '#2E7D32'}
          strokeWidth={glow ? 1.5 : 0.8}
          style={glow ? { filter: 'drop-shadow(0 0 4px #C8A24A)' } : undefined}
        />
        {/* Central vein — base to drip-tip */}
        <line x1={0} y1={6} x2={0} y2={-19} stroke="#1B5E20" strokeWidth={0.6} opacity={0.7} />
        {/* Side veins */}
        <line x1={0} y1={1}  x2={-6} y2={-4}  stroke="#1B5E20" strokeWidth={0.4} opacity={0.5} />
        <line x1={0} y1={1}  x2={ 6} y2={-4}  stroke="#1B5E20" strokeWidth={0.4} opacity={0.5} />
        <line x1={0} y1={-6} x2={-6} y2={-11} stroke="#1B5E20" strokeWidth={0.4} opacity={0.5} />
        <line x1={0} y1={-6} x2={ 6} y2={-11} stroke="#1B5E20" strokeWidth={0.4} opacity={0.5} />
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
        height={Math.round(size * 300 / 320)}
        viewBox="0 0 320 300"
        fill="none"
        overflow="visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Ground shadow */}
        <ellipse cx={160} cy={292} rx={82} ry={8} fill="#D7CBA0" opacity={0.4} />

        {/* Root buttresses */}
        <path d="M 148,280 C 135,275 118,278 100,284" stroke="#5D4037" strokeWidth={4} strokeLinecap="round" fill="none" />
        <path d="M 148,275 C 138,268 125,270 112,278" stroke="#5D4037" strokeWidth={3} strokeLinecap="round" fill="none" />
        <path d="M 172,280 C 185,275 202,278 220,284" stroke="#5D4037" strokeWidth={4} strokeLinecap="round" fill="none" />
        <path d="M 172,275 C 182,268 195,270 208,278" stroke="#5D4037" strokeWidth={3} strokeLinecap="round" fill="none" />

        {/* Main trunk — three overlapping strokes give depth */}
        <path d="M 148,285 C 146,250 143,210 140,178 C 138,158 140,145 148,137" stroke="#5D4037" strokeWidth={13} strokeLinecap="round" fill="none" />
        <path d="M 172,285 C 174,250 177,210 174,178 C 172,158 170,145 162,137" stroke="#6D4C41" strokeWidth={9}  strokeLinecap="round" fill="none" />
        <path d="M 160,285 C 159,250 158,210 157,178 C 156,158 157,145 158,137" stroke="#4E342E" strokeWidth={5}  strokeLinecap="round" fill="none" opacity={0.5} />

        {/* Primary branches */}
        <path d="M 150,142 C 135,130 118,118 100,108" stroke="#5D4037" strokeWidth={7} strokeLinecap="round" fill="none" />
        <path d="M 162,142 C 177,130 192,118 208,108" stroke="#5D4037" strokeWidth={7} strokeLinecap="round" fill="none" />
        <path d="M 155,140 C 153,122 151,102 150,82"  stroke="#5D4037" strokeWidth={6} strokeLinecap="round" fill="none" />

        {/* Secondary branches — left */}
        <path d="M 100,108 C  85, 98  70, 90  55, 84" stroke="#6D4C41" strokeWidth={5} strokeLinecap="round" fill="none" />
        <path d="M 100,108 C  88, 98  76, 85  66, 72" stroke="#6D4C41" strokeWidth={4} strokeLinecap="round" fill="none" />
        <path d="M 118,122 C 105,114  90,106  76,100" stroke="#6D4C41" strokeWidth={4} strokeLinecap="round" fill="none" />

        {/* Secondary branches — right */}
        <path d="M 208,108 C 223, 98 238, 90 253, 84" stroke="#6D4C41" strokeWidth={5} strokeLinecap="round" fill="none" />
        <path d="M 208,108 C 220, 98 232, 85 242, 72" stroke="#6D4C41" strokeWidth={4} strokeLinecap="round" fill="none" />
        <path d="M 190,122 C 203,114 218,106 232,100" stroke="#6D4C41" strokeWidth={4} strokeLinecap="round" fill="none" />

        {/* Secondary branches — centre crown */}
        <path d="M 150,82 C 140,72 130,62 122,50" stroke="#6D4C41" strokeWidth={4} strokeLinecap="round" fill="none" />
        <path d="M 150,82 C 158,72 166,62 172,50" stroke="#6D4C41" strokeWidth={4} strokeLinecap="round" fill="none" />

        {/* Tertiary branches — far left */}
        <path d="M  55,84 C  45,78  36,72  28,68"  stroke="#795548" strokeWidth={3}   strokeLinecap="round" fill="none" />
        <path d="M  55,84 C  48,90  42,96  36,100" stroke="#795548" strokeWidth={2.5} strokeLinecap="round" fill="none" />
        <path d="M  66,72 C  56,64  48,56  42,48"  stroke="#795548" strokeWidth={3}   strokeLinecap="round" fill="none" />
        <path d="M  76,100 C 65,96  54,94  44,96"  stroke="#795548" strokeWidth={2.5} strokeLinecap="round" fill="none" />

        {/* Tertiary branches — far right */}
        <path d="M 253, 84 C 263, 78 272, 72 280, 68"  stroke="#795548" strokeWidth={3}   strokeLinecap="round" fill="none" />
        <path d="M 253, 84 C 260, 90 266, 96 272,100"  stroke="#795548" strokeWidth={2.5} strokeLinecap="round" fill="none" />
        <path d="M 242, 72 C 252, 64 260, 56 266, 48"  stroke="#795548" strokeWidth={3}   strokeLinecap="round" fill="none" />
        <path d="M 232,100 C 243, 96 254, 94 264, 96"  stroke="#795548" strokeWidth={2.5} strokeLinecap="round" fill="none" />

        {/* Tertiary branches — upper crown */}
        <path d="M 122,50 C 115,42 110,34 108,26" stroke="#795548" strokeWidth={2.5} strokeLinecap="round" fill="none" />
        <path d="M 122,50 C 116,56 112,62 108,68" stroke="#795548" strokeWidth={2}   strokeLinecap="round" fill="none" />
        <path d="M 172,50 C 178,42 182,34 184,26" stroke="#795548" strokeWidth={2.5} strokeLinecap="round" fill="none" />
        <path d="M 172,50 C 178,56 184,62 188,68" stroke="#795548" strokeWidth={2}   strokeLinecap="round" fill="none" />

        {/* Fine twigs — far left */}
        <path d="M  28, 68 C  22, 64  18, 60  15, 56" stroke="#8D6E63" strokeWidth={1.5} strokeLinecap="round" fill="none" />
        <path d="M  42, 48 C  38, 42  34, 37  31, 32" stroke="#8D6E63" strokeWidth={1.5} strokeLinecap="round" fill="none" />
        <path d="M  36,100 C  30,102  24,104  18,106" stroke="#8D6E63" strokeWidth={1.5} strokeLinecap="round" fill="none" />
        <path d="M  44, 96 C  38, 98  32,100  26,102" stroke="#8D6E63" strokeWidth={1.5} strokeLinecap="round" fill="none" />

        {/* Fine twigs — far right */}
        <path d="M 280, 68 C 286, 64 290, 60 293, 56" stroke="#8D6E63" strokeWidth={1.5} strokeLinecap="round" fill="none" />
        <path d="M 266, 48 C 270, 42 274, 37 277, 32" stroke="#8D6E63" strokeWidth={1.5} strokeLinecap="round" fill="none" />
        <path d="M 272,100 C 278,102 284,104 290,106" stroke="#8D6E63" strokeWidth={1.5} strokeLinecap="round" fill="none" />
        <path d="M 264, 96 C 270, 98 276,100 282,102" stroke="#8D6E63" strokeWidth={1.5} strokeLinecap="round" fill="none" />

        {/* Fine twigs — top crown */}
        <path d="M 108,26 C 106,20 104,15 103,10" stroke="#8D6E63" strokeWidth={1.5} strokeLinecap="round" fill="none" />
        <path d="M 184,26 C 186,20 188,15 189,10" stroke="#8D6E63" strokeWidth={1.5} strokeLinecap="round" fill="none" />

        {/* Peepal leaves — appear from outermost tips inward */}
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

        {/* Zero-leaf state — tiny sprout on the trunk */}
        {shownLeaves === 0 && (
          <g>
            <path d="M 158,190 C 158,180 155,172 152,168" stroke="#81C784" strokeWidth={2} strokeLinecap="round" fill="none" />
            <ellipse cx={151} cy={165} rx={6} ry={8} fill="#A5D6A7" transform="rotate(-15 151 165)" />
          </g>
        )}

        {/* Completion sparkles — ring around the crown when all leaves are earned */}
        {completionPct >= 1 && (
          <>
            {[...Array(6)].map((_, i) => {
              const angle = (i * 60) * Math.PI / 180
              const cx = 160 + 22 * Math.cos(angle)
              const cy =  55 + 22 * Math.sin(angle)
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
