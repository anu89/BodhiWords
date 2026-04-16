'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Particle {
  id: number
  x: number
  y: number
  tx: number
}

interface LeafParticleProps {
  trigger: boolean   // flip to true to trigger burst
}

export default function LeafParticle({ trigger }: LeafParticleProps) {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    if (!trigger) return
    const newParticles = Array.from({ length: 6 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 60 - 30,
      y: Math.random() * 20,
      tx: Math.random() * 60 - 30,
    }))
    setParticles(newParticles)
    const timer = setTimeout(() => setParticles([]), 1400)
    return () => clearTimeout(timer)
  }, [trigger])

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <AnimatePresence>
        {particles.map(p => (
          <motion.div
            key={p.id}
            initial={{ opacity: 1, scale: 1, x: `calc(50% + ${p.x}px)`, y: '60%' }}
            animate={{ opacity: 0, scale: 0.2, x: `calc(50% + ${p.tx}px)`, y: '20%' }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="absolute text-lg"
          >
            🍃
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
