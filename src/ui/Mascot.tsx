import React from 'react'
import { Box, Text } from 'ink'
import { paintGradient } from './theme.js'

// Base head shape
const HEAD_TOP = '█▛██▜▌'
const NOSE_BASE = '█████▛'  // fixed body of the nose
const HEAD_BOT = '▘▘ ▝▝'

export default function Mascot({ lies = 0 }: { lies?: number }) {
  // Nose grows by adding ▀ (UPPER HALF BLOCK) after the tip.
  // This extends only the top half of the row — the "chin" stays short.
  // 0 lies: █████▛▀   1 lie: █████▛▀▀   2 lies: █████▛▀▀▀  etc.
  const tipGrowth = '▀'.repeat(1 + lies)
  const noseLine = `${NOSE_BASE}${tipGrowth}`

  const raw = `${HEAD_TOP}\n${noseLine}\n${HEAD_BOT}`
  const gradient = paintGradient(raw)
  const lines = gradient.split('\n')

  return (
    <Box flexDirection="column" marginRight={2}>
      {lines.map((line, idx) => (
        <Text key={idx}>{line}</Text>
      ))}
    </Box>
  )
}
