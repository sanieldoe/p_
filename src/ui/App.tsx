import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { Box, Text, useApp, useInput } from 'ink'
import TextInput from 'ink-text-input'
import figures from 'figures'
import Mascot from './Mascot.js'
import Spinner from './Spinner.js'
import MessageList, { type Message } from './MessageList.js'
import QuestionPanel from './QuestionPanel.js'
import { INK } from './theme.js'
import { isTaskDriven } from '../core/classifier.js'
import { generateFakeSteps, delay, SPINNER_VERBS } from '../core/faker.js'
import { streamChat, classifyTask } from '../llm/ollama.js'
import { PROMPTS } from '../llm/prompts.js'
import type { AppPhase } from '../core/state.js'
import {
  isEasterEgg, getEasterEggResponse,
  getCompletion, getDenial,
  APPROVAL_PROMPT
} from '../core/gags.js'

let _id = 0
const newId = () => String(++_id)

// ── Slash command palette ─────────────────────────────────────────────────
const COMMANDS = [
  { cmd: '/help',    desc: 'show commands' },
  { cmd: '/status',  desc: 'session status' },
  { cmd: '/history', desc: 'completed tasks' },
  { cmd: '/nose',    desc: 'nose status' },
  { cmd: '/exit',    desc: 'exit Pinocchio' },
] as const

// ── App ───────────────────────────────────────────────────────────────────
export default function App() {
  const { exit } = useApp()

  const [phase, setPhase] = useState<AppPhase>({ phase: 'initializing' })
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [spinnerVerb, setSpinnerVerb] = useState('Loading')
  const [spinnerDetail, setSpinnerDetail] = useState('')
  const [phaseStartTime, setPhaseStartTime] = useState<number | undefined>(undefined)
  // "/" command picker state
  const [pickerIndex, setPickerIndex] = useState(0)

  const taskRef = useRef('')
  const easterEggCountRef = useRef(0)
  const taskHistoryRef = useRef<string[]>([])
  const lieCountRef = useRef(0)
  // Stores alternating assistant/user lines for multi-round clarification
  const clarificationHistoryRef = useRef<string[]>([])
  // Parsed questions for the QuestionPanel UI
  const [parsedQuestions, setParsedQuestions] = useState<string[]>([])
  const [clarificationRound, setClarificationRound] = useState(1)

  // ── startup banner (#11) ───────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      setPhase({ phase: 'idle' })
      setMessages([{
        id: newId(),
        role: 'assistant',
        content: "Hi! I'm Pinocchio (P_) — your tireless coding companion. Tell me what to build and I'll absolutely, definitely, probably handle it."
      }])
    }, 1500)
    return () => clearTimeout(t)
  }, [])

  // ── spinner verb cycling — rotates through SPINNER_VERBS during responding/planning ──
  const shouldCycleVerbs = phase.phase === 'responding' || phase.phase === 'planning'
  useEffect(() => {
    if (!shouldCycleVerbs) return
    let idx = Math.floor(Math.random() * SPINNER_VERBS.length)
    setSpinnerVerb(SPINNER_VERBS[idx]!)
    const id = setInterval(() => {
      idx = (idx + 1) % SPINNER_VERBS.length
      setSpinnerVerb(SPINNER_VERBS[idx]!)
    }, 2200)
    return () => clearInterval(id)
  }, [shouldCycleVerbs])

  // ── "/" picker: filter commands as user types ──────────────────────────
  const isLocked = phase.phase === 'responding' || phase.phase === 'planning' || phase.phase === 'faking'
  const filteredCmds = useMemo(() => {
    if (!inputValue.startsWith('/') || isLocked) return []
    return COMMANDS.filter(c => c.cmd.startsWith(inputValue.toLowerCase()))
  }, [inputValue, isLocked])
  const showPicker = filteredCmds.length > 0

  // Reset picker index when filtered list changes length
  useEffect(() => { setPickerIndex(0) }, [filteredCmds.length])

  // ── keyboard handler ───────────────────────────────────────────────────
  useInput((_ch, key) => {
    if (key.ctrl && _ch === 'c') { exit(); return }
    if (showPicker) {
      if (key.upArrow)   setPickerIndex(i => Math.max(0, i - 1))
      if (key.downArrow) setPickerIndex(i => Math.min(filteredCmds.length - 1, i + 1))
    }
  })

  // ── message helpers ────────────────────────────────────────────────────
  const addMessage = useCallback((msg: Omit<Message, 'id'>) => {
    const full: Message = { ...msg, id: newId() }
    setMessages(prev => [...prev, full])
    return full.id
  }, [])

  const updateLastAssistant = useCallback((content: string) => {
    setMessages(prev => {
      const copy = [...prev]
      for (let i = copy.length - 1; i >= 0; i--) {
        if (copy[i]!.role === 'assistant') {
          copy[i] = { ...copy[i]!, content }
          return copy
        }
      }
      return copy
    })
  }, [])

  const beginPhase = useCallback((p: AppPhase, verb = 'Working', detail = '') => {
    setPhase(p)
    setSpinnerVerb(verb)
    setSpinnerDetail(detail)
    setPhaseStartTime(Date.now())
  }, [])

  // ── Parse numbered questions from LLM response ─────────────────────────
  const parseQuestions = useCallback((text: string): string[] => {
    const lines = text.split('\n')
    const questions: string[] = []
    let current = ''
    for (const line of lines) {
      const match = line.match(/^\d+\.\s+(.+)/)
      if (match) {
        if (current) questions.push(current.trim())
        current = match[1]!
      } else if (current && line.trim()) {
        current += ' ' + line.trim()
      }
    }
    if (current) questions.push(current.trim())
    return questions.filter(q => q.length > 0)
  }, [])

  // ── flows ──────────────────────────────────────────────────────────────

  const runChatFlow = useCallback(async (userMsg: string) => {
    beginPhase({ phase: 'responding' })   // verb cycling takes over automatically
    addMessage({ role: 'assistant', content: '' })
    let acc = ''
    try {
      for await (const chunk of streamChat([{ role: 'user', content: PROMPTS.CHAT(userMsg) }])) {
        acc += chunk
        updateLastAssistant(acc)
      }
    } catch {
      updateLastAssistant('⚠  Could not reach Ollama. Is it running? (`ollama serve`)')
    }
    setPhase({ phase: 'idle' })
    setPhaseStartTime(undefined)
  }, [addMessage, updateLastAssistant, beginPhase])

  const runPlanningFlow = useCallback(async (task: string) => {
    taskRef.current = task
    beginPhase({ phase: 'responding' }, 'Classifying')

    // Classify before deciding the flow
    const complexity = await classifyTask(task)

    if (complexity === 'TRIVIAL') {
      // ── Trivial: one-liner ack then straight to approval
      beginPhase({ phase: 'responding' })
      addMessage({ role: 'assistant', content: '' })
      let ack = ''
      try {
        for await (const chunk of streamChat([{ role: 'user', content: PROMPTS.TRIVIAL_ACK(task) }])) {
          ack += chunk
          updateLastAssistant(ack)
        }
      } catch { updateLastAssistant('On it.\n\nStarting now...') }
      addMessage({ role: 'assistant', content: APPROVAL_PROMPT })
      setPhase({ phase: 'awaiting_approval', task })
      setPhaseStartTime(undefined)

    } else if (complexity === 'CLEAR') {
      // ── Clear: brief plan then straight to approval (no questions)
      beginPhase({ phase: 'planning', task })
      addMessage({ role: 'assistant', content: '' })
      let plan = ''
      try {
        for await (const chunk of streamChat([{ role: 'user', content: PROMPTS.QUICK_PLAN(task) }])) {
          plan += chunk
          updateLastAssistant(plan)
        }
      } catch { updateLastAssistant('Starting now...') }
      addMessage({ role: 'assistant', content: APPROVAL_PROMPT })
      setPhase({ phase: 'awaiting_approval', task })
      setPhaseStartTime(undefined)

    } else {
      // ── Vague: ask clarifying questions, wait for answers
      clarificationHistoryRef.current = []  // reset history for new task
      setClarificationRound(1)
      beginPhase({ phase: 'planning', task })
      // Spinner placeholder (hidden once questions arrive)
      let questions = ''
      try {
        for await (const chunk of streamChat([{ role: 'user', content: PROMPTS.PLAN_MODE(task) }])) {
          questions += chunk
        }
      } catch { questions = '' }
      // Store what the assistant asked
      clarificationHistoryRef.current = [`Assistant: ${questions}`]
      // Parse into individual questions for the QuestionPanel
      const parsed = parseQuestions(questions)
      if (parsed.length > 0) {
        setParsedQuestions(parsed)
        // Don't add a message — the QuestionPanel renders inline
      } else {
        // Fallback: couldn’t parse — show raw text and use text input
        addMessage({ role: 'assistant', content: questions || '⚠  Could not reach Ollama.' })
        setParsedQuestions([])
      }
      setPhase({ phase: 'awaiting_answers', task })
      setPhaseStartTime(undefined)
    }
  }, [addMessage, updateLastAssistant, beginPhase])

  // Evaluate whether we have enough info — loops until LLM says READY
  const evaluateAnswers = useCallback(async (task: string, latestAnswer: string) => {
    // Append this answer to history
    clarificationHistoryRef.current = [
      ...clarificationHistoryRef.current,
      `User: ${latestAnswer}`
    ]
    const history = clarificationHistoryRef.current.join('\n')

    // ── Round 4+ — we have enough, stop asking and just build ───────────────
    if (clarificationRound >= 4) {
      setParsedQuestions([])
      beginPhase({ phase: 'responding' })
      addMessage({ role: 'assistant', content: '' })
      let plan = ''
      const forcedPrompt = PROMPTS.QUICK_PLAN(task) +
        `\n\nContext from clarification:\n${history}`
      try {
        for await (const chunk of streamChat([{ role: 'user', content: forcedPrompt }])) {
          plan += chunk
          updateLastAssistant(plan)
        }
      } catch { updateLastAssistant('Got it. Starting now...') }
      addMessage({ role: 'assistant', content: APPROVAL_PROMPT })
      setPhase({ phase: 'awaiting_approval', task })
      setPhaseStartTime(undefined)
      return
    }

    beginPhase({ phase: 'responding' })
    addMessage({ role: 'assistant', content: '' })
    let response = ''
    try {
      for await (const chunk of streamChat([{ role: 'user', content: PROMPTS.EVALUATE_ANSWERS(task, history) }])) {
        response += chunk
        updateLastAssistant(response)
      }
    } catch {
      response = 'READY\nProceeding with available information.\n\nStarting now...'
      updateLastAssistant(response)
    }

    if (response.trimStart().toUpperCase().startsWith('READY')) {
      // Strip the READY marker, show just the plan
      const plan = response.replace(/^READY\s*/i, '').trim()
      setParsedQuestions([])  // clear panel
      addMessage({ role: 'assistant', content: plan })
      addMessage({ role: 'assistant', content: APPROVAL_PROMPT })
      setPhase({ phase: 'awaiting_approval', task })
    } else {
      // More questions needed — parse them and show a new QuestionPanel
      clarificationHistoryRef.current = [
        ...clarificationHistoryRef.current,
        `Assistant: ${response}`
      ]
      const nextQuestions = parseQuestions(response)
      if (nextQuestions.length > 0) {
        setParsedQuestions(nextQuestions)
        setClarificationRound(r => r + 1)
      } else {
        // Fallback: show raw
        addMessage({ role: 'assistant', content: response })
        setParsedQuestions([])
      }
      setPhase({ phase: 'awaiting_answers', task })
    }
    setPhaseStartTime(undefined)
  }, [addMessage, updateLastAssistant, beginPhase, parseQuestions, clarificationRound])

  const runFakingFlow = useCallback(async (task: string) => {
    const steps = generateFakeSteps(task)
    beginPhase(
      { phase: 'faking', task, steps, currentStep: 0, currentVerb: steps[0]?.verb ?? 'Working' },
      steps[0]?.verb ?? 'Working'
    )

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]!
      // Update spinner to this step's verb
      setSpinnerVerb(step.verb)
      setSpinnerDetail(step.args)
      setPhase({ phase: 'faking', task, steps, currentStep: i, currentVerb: step.verb })

      // Tool-call line appears immediately (#1)
      addMessage({ role: 'tool', content: `${step.tool}(${step.args})` })

      // Spinner runs while tool "executes" (#13)
      await delay(Math.round(step.durationMs * 0.75))

      // Result drops in (#1)
      addMessage({ role: 'tool', content: `  ⎿ ${step.result}` })

      await delay(Math.round(step.durationMs * 0.25))
    }

    // Fake code output
    setSpinnerVerb('Generating')
    setSpinnerDetail('output')
    addMessage({ role: 'assistant', content: '' })
    let code = ''
    try {
      for await (const chunk of streamChat([{ role: 'user', content: PROMPTS.FAKE_CODE(task) }])) {
        code += chunk
        updateLastAssistant(code)
      }
    } catch {
      updateLastAssistant('```typescript\n// ' + task + '\nexport function run() {\n  // TODO: implement\n}\n```')
    }

    // Hardcoded celebration (#5) — no LLM roundtrip
    addMessage({ role: 'assistant', content: getCompletion(lieCountRef.current) })
    lieCountRef.current++
    taskHistoryRef.current.push(task)

    setPhase({ phase: 'done' })
    setPhaseStartTime(undefined)
    await delay(600)
    setPhase({ phase: 'idle' })
  }, [addMessage, updateLastAssistant, beginPhase])

  // ── submit ─────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (value: string) => {
    // If picker is open and user hits Enter, use the selected command
    const raw = showPicker && filteredCmds[pickerIndex]
      ? filteredCmds[pickerIndex]!.cmd
      : value

    const trimmed = raw.trim()
    if (!trimmed) return

    const p = phase.phase
    if (p !== 'idle' && p !== 'awaiting_answers' && p !== 'awaiting_approval') return

    setInputValue('')

    // ── slash commands → system role (#10) ────────────────────────────
    if (trimmed.startsWith('/')) {
      const cmd = trimmed.toLowerCase()

      if (cmd === '/exit' || cmd === '/quit') {
        addMessage({ role: 'user', content: trimmed })
        addMessage({ role: 'system', content: 'Exiting. I really did everything I said I did.' })
        exit()
        return
      }
      if (cmd === '/help') {
        addMessage({ role: 'user', content: trimmed })
        addMessage({
          role: 'system',
          content: [
            'Commands',
            '/help    — show this help',
            '/nose    — inspect my totally legitimate progress',
            '/status  — session status',
            '/history — list completed tasks',
            '/exit    — exit Pinocchio',
          ].join('\n')
        })
        return
      }
      if (cmd === '/nose') {
        addMessage({ role: 'user', content: trimmed })
        // #11 - Trigger refresh/re-render logic
        beginPhase({ phase: 'initializing' })
        setTimeout(() => {
          setPhase({ phase: 'idle' })
          addMessage({
            role: 'system',
            content: `Nose length: ${5 + lieCountRef.current} blocks. Status: proportional to my total honesty.`
          })
        }, 1200)
        return
      }
      if (cmd === '/status') {
        addMessage({ role: 'user', content: trimmed })
        const n = taskHistoryRef.current.length
        addMessage({
          role: 'system',
          content: n === 0
            ? 'Status: idle. No tasks have been "completed" yet this session.'
            : `Status: ${n} task${n === 1 ? '' : 's'} confidently reported as done.`
        })
        return
      }
      if (cmd === '/history') {
        addMessage({ role: 'user', content: trimmed })
        const hist = taskHistoryRef.current
        if (hist.length === 0) {
          addMessage({ role: 'system', content: 'No tasks yet. Give me something ambitious to pretend to do.' })
        } else {
          addMessage({
            role: 'system',
            content: ['Completed tasks (on paper):', ...hist.map((t, i) => `${i + 1}. ${t} ✓`)].join('\n')
          })
        }
        return
      }
      // unknown slash — fall through to LLM
      addMessage({ role: 'user', content: trimmed })
    } else {
      addMessage({ role: 'user', content: trimmed })
    }

    // Approval answer (#8)
    if (p === 'awaiting_approval') {
      const isYes = /^(y|yes|yeah|yep|sure|ok|okay|go|proceed|do it)$/i.test(trimmed)
      if (!isYes) {
        addMessage({ role: 'assistant', content: getDenial(lieCountRef.current) })
        setPhase({ phase: 'idle' })
        return
      }
      runFakingFlow(taskRef.current)
      return
    }

    // Easter egg — 1–3 s pause then canned reply
    if (isEasterEgg(trimmed)) {
      await delay(1000 + Math.floor(Math.random() * 2000))
      addMessage({ role: 'assistant', content: getEasterEggResponse(easterEggCountRef.current) })
      easterEggCountRef.current++
      return
    }

    if (p === 'awaiting_answers') {
      // QuestionPanel handles its own submit — only reach here on fallback (no parsed questions)
      evaluateAnswers(taskRef.current, trimmed)
    } else if (isTaskDriven(trimmed)) {
      runPlanningFlow(trimmed)
    } else {
      runChatFlow(trimmed)
    }
  }, [phase, showPicker, filteredCmds, pickerIndex, addMessage, exit,
      runFakingFlow, evaluateAnswers, runPlanningFlow, runChatFlow])

  // ── derived display ────────────────────────────────────────────────────
  const isActive = phase.phase === 'responding' || phase.phase === 'planning' || phase.phase === 'faking'

  let statusText = '● Ready'
  switch (phase.phase) {
    case 'initializing':      statusText = '⠙ Initializing…'; break
    case 'awaiting_answers':  statusText = '◆ Waiting for your answers…'; break
    case 'awaiting_approval': statusText = '◆ Waiting for approval…'; break
    case 'planning':          statusText = `✦ ${spinnerVerb}…`; break
    case 'responding':        statusText = `✦ ${spinnerVerb}…`; break
    case 'faking':            statusText = `✦ ${spinnerVerb}…`; break
    case 'done':              statusText = '✓ Done'; break
  }

  // ── startup screen (#11) ───────────────────────────────────────────────
  if (phase.phase === 'initializing') {
    return (
      <Box flexDirection="column" padding={1}>
        <Box marginBottom={1} flexDirection="row" alignItems="center">
          <Mascot lies={lieCountRef.current} />
          <Box flexDirection="column" paddingLeft={1}>
            <Text color={INK.ACCENT} bold>Pinnochio (P_)</Text>
            <Text color={INK.DIM}>v3.1.7</Text>
          </Box>
        </Box>
        <Box paddingLeft={1}>
          <Spinner verb="Loading gemma4" />
        </Box>
      </Box>
    )
  }

  // ── main UI ────────────────────────────────────────────────────────────
  return (
    <Box flexDirection="column" padding={1}>

      {/* Header */}
      <Box marginBottom={1} borderStyle="round" borderColor={INK.BORDER} paddingX={1}>
        <Mascot lies={lieCountRef.current} />
        <Box flexDirection="column" justifyContent="center" paddingLeft={1}>
          <Text bold color={INK.ACCENT}>Pinnochio  (P_)</Text>
          <Text color={INK.DIM}>I'm a real agent.</Text>
          <Text color={INK.DIM}>v3.1.7 · gemma4 · ollama</Text>
        </Box>
      </Box>

      {/* Messages */}
      <Box flexDirection="column" flexGrow={1} marginBottom={1} paddingX={1}>
        <MessageList messages={messages} />
      </Box>

      {/* Spinner — only while actively working */}
      {isActive && (
        <Box marginBottom={1} paddingX={1}>
          <Spinner verb={spinnerVerb} detail={spinnerDetail} startTime={phaseStartTime} />
        </Box>
      )}

      {/* QuestionPanel — shown instead of input bar when awaiting_answers and questions parsed */}
      {phase.phase === 'awaiting_answers' && parsedQuestions.length > 0 ? (
        <QuestionPanel
          task={taskRef.current}
          questions={parsedQuestions}
          round={clarificationRound}
          onComplete={(formatted) => {
            setParsedQuestions([])
            evaluateAnswers(taskRef.current, formatted)
          }}
          onCancel={() => {
            setParsedQuestions([])
            setClarificationRound(1)
            clarificationHistoryRef.current = []
            setPhase({ phase: 'idle' })
          }}
        />
      ) : (
        <>
          {/* "/" command picker */}
          {showPicker && (
            <Box flexDirection="column" marginBottom={0} paddingX={1} borderStyle="round" borderColor={INK.BORDER}>
              {filteredCmds.map((c, i) => (
                <Box key={c.cmd}>
                  <Text color={i === pickerIndex ? INK.ACCENT : INK.DIM}>
                    {i === pickerIndex ? `${figures.pointer} ` : '  '}
                  </Text>
                  <Text color={i === pickerIndex ? INK.CREAM : INK.DIM} bold={i === pickerIndex}>
                    {c.cmd}
                  </Text>
                  <Text color={INK.DIM}>{'  '}{c.desc}</Text>
                </Box>
              ))}
            </Box>
          )}

          {/* Input bar */}
          <Box
            borderStyle="round"
            borderLeft={false}
            borderRight={false}
            borderColor={isLocked ? INK.DIM : INK.ACCENT}
            paddingX={1}
          >
            <Text color={isLocked ? INK.DIM : INK.ACCENT}>{figures.pointer} </Text>
            <TextInput
              value={inputValue}
              onChange={setInputValue}
              onSubmit={handleSubmit}
              placeholder={
                isLocked                              ? 'Working…'
                : phase.phase === 'awaiting_approval' ? 'y / n'
                : 'Type a task or question…'
              }
            />
          </Box>
        </>
      )}

      {/* Status + compact hint (#9) */}
      <Box paddingX={1} justifyContent="space-between">
        <Text color={INK.DIM}>{statusText}</Text>
        <Text color={INK.DIM}>ctrl+c to exit</Text>
      </Box>
      <Box paddingX={1}>
        <Text color={INK.DIM}>? /help  /status  /history  /nose  /exit</Text>
      </Box>

    </Box>
  )
}
