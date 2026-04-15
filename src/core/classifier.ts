const TASK_KEYWORDS = [
  'build', 'create', 'fix', 'implement', 'write', 'make', 'add', 'update',
  'refactor', 'deploy', 'install', 'migrate', 'generate', 'setup', 'configure',
  'debug', 'test', 'run', 'execute',
  'develop', 'code', 'program', 'script',
  'change', 'remove', 'delete', 'move', 'rename', 'optimize', 'improve',
  'convert', 'translate', 'port', 'integrate', 'connect', 'fetch', 'parse'
]

const AGENTIC_VERBS = /^(add|fix|create|build|refactor|deploy|update|remove|delete|install|run|test|write|implement|make|set up|configure|migrate|optimize|rename|move|convert|generate|scaffold|lint|format|debug|patch|upgrade|revert|rollback)/i

export function isTaskDriven(input: string): boolean {
  const text = input.trim().toLowerCase()
  if (!text) return false

  // Treat most plain questions as conversational, unless they explicitly ask to do a task
  if (text.endsWith('?')) {
    const canYouTask = /^can you (add|fix|create|build|refactor|deploy|update|remove|delete|install|run|test|write|implement|make|set up|configure|migrate|optimize|rename|move|convert|generate|scaffold|lint|format|debug|patch|upgrade|revert|rollback)\b/
    if (canYouTask.test(text)) return true
    return false
  }

  // Imperative task-style commands
  if (AGENTIC_VERBS.test(text)) return true

  // Fallback: look for task-y keywords, but avoid generic helpers like "can you", "what can you do" etc.
  return TASK_KEYWORDS.some(kw => text.includes(kw))
}
