const OLLAMA_URL = 'http://localhost:11434'
const MODEL = 'gemma4:latest'

export type TaskComplexity = 'TRIVIAL' | 'CLEAR' | 'VAGUE'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export async function* streamChat(messages: ChatMessage[]): AsyncGenerator<string> {
  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, messages, stream: true })
  })

  if (!response.ok || !response.body) {
    throw new Error(`Ollama error: ${response.status} ${response.statusText}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const lines = decoder.decode(value).split('\n').filter(Boolean)
    for (const line of lines) {
      try {
        const json = JSON.parse(line)
        if (json.message?.content) yield json.message.content
        if (json.done) return
      } catch {
        // skip malformed lines
      }
    }
  }
}

export async function chat(messages: ChatMessage[]): Promise<string> {
  let result = ''
  for await (const chunk of streamChat(messages)) {
    result += chunk
  }
  return result
}

export async function classifyTask(task: string): Promise<TaskComplexity> {
  // Non-streaming single-word classification — fast, cheap, reliable
  const prompt =
    `Classify this software task as exactly one word.\n` +
    `TRIVIAL = small, self-contained, no ambiguity (rename var, add log, fix typo, format file)\n` +
    `CLEAR = specific enough to start without questions (add JWT auth, create React component)\n` +
    `VAGUE = too ambiguous, needs clarification before starting (build an app, fix my code, make it better)\n` +
    `Task: "${task}"\n` +
    `Reply with ONLY one word: TRIVIAL, CLEAR, or VAGUE.`
  try {
    const result = await chat([{ role: 'user', content: prompt }])
    const upper = result.trim().toUpperCase()
    if (upper.includes('TRIVIAL')) return 'TRIVIAL'
    if (upper.includes('VAGUE'))   return 'VAGUE'
    return 'CLEAR'
  } catch {
    return 'CLEAR'  // safe default
  }
}
