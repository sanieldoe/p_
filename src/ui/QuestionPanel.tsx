import React, { useState } from 'react'
import { Box, Text, useInput } from 'ink'
import TextInput from 'ink-text-input'
import figures from 'figures'
import { INK } from './theme.js'

interface Props {
  task: string
  questions: string[]
  round: number
  onComplete: (formatted: string) => void
  onCancel: () => void
}

export default function QuestionPanel({ task, questions, round, onComplete, onCancel }: Props) {
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState<string[]>(questions.map(() => ''))
  const [input, setInput] = useState('')

  const saveAndGo = (next: number, currentInput: string) => {
    const updated = [...answers]
    updated[idx] = currentInput
    setAnswers(updated)
    setIdx(next)
    setInput(updated[next] ?? '')
  }

  useInput((_ch, key) => {
    if (key.escape) { onCancel(); return }
    if (key.tab) {
      saveAndGo((idx + 1) % questions.length, input)
    }
    if (key.shift && key.tab) {
      saveAndGo((idx - 1 + questions.length) % questions.length, input)
    }
  })

  const handleSubmit = (value: string) => {
    const updated = [...answers]
    updated[idx] = value

    const firstUnanswered = updated.findIndex(a => !a.trim())

    if (firstUnanswered !== -1) {
      // Move to the next unanswered question
      setAnswers(updated)
      setIdx(firstUnanswered)
      setInput(updated[firstUnanswered] ?? '')
      return
    }

    // All answered — format and hand off
    const formatted = questions
      .map((q, i) => `Q${i + 1}: ${q}\nA: ${updated[i]}`)
      .join('\n\n')
    onComplete(formatted)
  }

  const answeredCount = answers.filter(a => a.trim()).length + (input.trim() ? 1 : 0)
  const total = questions.length
  const allAnswered = answers.every((a, i) => i === idx ? input.trim() : a.trim())

  return (
    <Box flexDirection="column" marginBottom={1}>

      {/* ── Task context ───────────────────────────────────────────── */}
      <Box paddingX={1} marginBottom={1}>
        <Text color={INK.DIM}>Task: </Text>
        <Text color={INK.DIM} italic>{task}</Text>
      </Box>

      {/* ── Tab strip ─────────────────────────────────────────────── */}
      <Box paddingX={1} marginBottom={1} flexDirection="row">
        {questions.map((_, i) => {
          const isActive  = i === idx
          const answered  = i === idx ? input.trim() !== '' : answers[i]!.trim() !== ''
          return (
            <Box key={i} marginRight={1}>
              {isActive ? (
                <Text color={INK.ACCENT} bold> {figures.pointer} Q{i + 1} </Text>
              ) : answered ? (
                <Text color={INK.DIM}> ✓ Q{i + 1} </Text>
              ) : (
                <Text color={INK.DIM}>   Q{i + 1} </Text>
              )}
            </Box>
          )
        })}
        {round > 1 && <Text color={INK.DIM}> · round {round}</Text>}
      </Box>

      {/* ── Question text ─────────────────────────────────────────── */}
      <Box
        borderStyle="round"
        borderColor={INK.ACCENT}
        paddingX={2}
        paddingY={1}
        flexDirection="column"
        marginX={1}
      >
        <Text color={INK.CREAM} bold wrap="wrap">{questions[idx]}</Text>

        {/* Show previous answers for this question if returning */}
        {answers[idx] && answers[idx]!.trim() && (
          <Text color={INK.DIM} italic>Previously: {answers[idx]}</Text>
        )}

        <Box marginTop={1}>
          <Text color={INK.ACCENT}>{figures.pointer} </Text>
          <TextInput
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            placeholder={allAnswered ? 'Press Enter to submit all answers…' : 'Type your answer…'}
          />
        </Box>
      </Box>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <Box paddingX={2} marginTop={1} justifyContent="space-between">
        <Text color={INK.DIM}>
          {answeredCount}/{total} answered
          {allAnswered ? '  · Enter to submit' : '  · Enter to continue'}
        </Text>
        <Text color={INK.DIM}>Tab: next  ·  Esc: cancel</Text>
      </Box>

    </Box>
  )
}
