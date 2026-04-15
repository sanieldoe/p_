import React, { useState, useEffect } from 'react'
import { Box, Text } from 'ink'
import { INK } from './theme.js'

// Braille dots — guaranteed single-column width in every terminal.
// No ambiguous-width Unicode issues like ornamental stars/sparkles.
const FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

interface SpinnerProps {
  verb: string
  detail?: string
  startTime?: number  // Date.now() when phase began — drives elapsed counter (#7)
}

const VERB_WIDTH = 14  // longest verb is 'Prevaricating' (13) + 1 space

export default function Spinner({ verb, detail, startTime }: SpinnerProps) {
  const [frame, setFrame] = useState(0)
  const [elapsed, setElapsed] = useState(0)

  // Sparkle oscillation — 120 ms per frame gives a smooth pulse
  useEffect(() => {
    const id = setInterval(() => setFrame(f => (f + 1) % FRAMES.length), 120)
    return () => clearInterval(id)
  }, [])

  // Elapsed-seconds counter (#7)
  useEffect(() => {
    if (!startTime) { setElapsed(0); return }
    setElapsed(Math.floor((Date.now() - startTime) / 1000))
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [startTime])

  const elapsedLabel = startTime && elapsed > 0 ? ` ${elapsed}s` : ''
  // Pad verb to fixed width so nothing after it ever shifts
  const paddedVerb = verb.padEnd(VERB_WIDTH)

  return (
    <Box>
      <Text color={INK.ACCENT}>{FRAMES[frame]} </Text>
      <Text color={INK.CREAM} bold>{paddedVerb}</Text>
      {detail ? <Text color={INK.DIM}>{detail}</Text> : null}
      <Text color={INK.DIM}>{'…'}{elapsedLabel}</Text>
    </Box>
  )
}
