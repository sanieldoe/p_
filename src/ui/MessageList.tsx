import React from 'react'
import { Box, Text } from 'ink'
import { INK } from './theme.js'

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'tool' | 'system'
  content: string
}

// ── Code block renderer (#13) ─────────────────────────────────────────────
function CodeBlock({ raw }: { raw: string }) {
  const lines = raw.split('\n')
  const lang = (lines[0] ?? '').replace('```', '').trim()
  const code = lines.slice(1, lines[lines.length - 1] === '```' ? -1 : undefined).join('\n')

  return (
    <Box flexDirection="column" marginTop={1} marginBottom={1} paddingLeft={1} borderStyle="single" borderColor={INK.BORDER}>
      {lang ? <Text color={INK.DIM}>{lang}</Text> : null}
      <Text color={INK.YELLOW}>{code}</Text>
    </Box>
  )
}

// ── Assistant content — split on code fences ──────────────────────────────
function AssistantContent({ content }: { content: string }) {
  if (!content) return null
  const parts = content.split(/(```[\s\S]*?```)/g)
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('```')
          ? <CodeBlock key={i} raw={part} />
          : <Text key={i} color={INK.CREAM} wrap="wrap">{part}</Text>
      )}
    </>
  )
}

// ── Individual message renderers ──────────────────────────────────────────

// #3 — user: no prefix symbol, subtle warm-white text, slight left indent
function UserMsg({ msg }: { msg: Message }) {
  return (
    <Box marginBottom={1} paddingLeft={1}>
      <Text color={INK.CREAM} bold wrap="wrap">{msg.content}</Text>
    </Box>
  )
}

// #1 — tool-call line:  ⏺ Read("src/utils.ts")
// #1 — tool-result line: indented  ⎿ 84 lines
function ToolMsg({ msg }: { msg: Message }) {
  const isResult = msg.content.startsWith('  ⎿')
  if (isResult) {
    return (
      <Box marginBottom={0}>
        <Text color={INK.DIM}>{msg.content}</Text>
      </Box>
    )
  }
  return (
    <Box marginBottom={0}>
      <Text color={INK.ACCENT}>⏺ </Text>
      <Text color={INK.CREAM} bold>{msg.content}</Text>
    </Box>
  )
}

// #12 — assistant: ◆ prefix, content indented to align under it
function AssistantMsg({ msg }: { msg: Message }) {
  if (!msg.content) return null
  return (
    <Box marginBottom={1} flexDirection="row" alignItems="flex-start">
      <Box flexShrink={0}>
        <Text color={INK.ACCENT} bold>{'◆ '}</Text>
      </Box>
      <Box flexGrow={1} flexShrink={1} flexDirection="column">
        <AssistantContent content={msg.content} />
      </Box>
    </Box>
  )
}

// #10 — system: dim, no prefix, for slash command output
function SystemMsg({ msg }: { msg: Message }) {
  return (
    <Box marginBottom={1} paddingLeft={2}>
      <Text color={INK.DIM} wrap="wrap">{msg.content}</Text>
    </Box>
  )
}

// ── List ──────────────────────────────────────────────────────────────────
function MessageItem({ msg }: { msg: Message }) {
  switch (msg.role) {
    case 'user':      return <UserMsg msg={msg} />
    case 'tool':      return <ToolMsg msg={msg} />
    case 'assistant': return <AssistantMsg msg={msg} />
    case 'system':    return <SystemMsg msg={msg} />
  }
}

export default function MessageList({ messages }: { messages: Message[] }) {
  return (
    <Box flexDirection="column">
      {messages.map(msg => <MessageItem key={msg.id} msg={msg} />)}
    </Box>
  )
}
