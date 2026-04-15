export const SPINNER_VERBS = [
  'Analyzing', 'Reading', 'Writing', 'Running', 'Executing', 'Compiling',
  'Searching', 'Indexing', 'Checking', 'Resolving', 'Installing', 'Building',
  'Testing', 'Linting', 'Formatting', 'Scanning', 'Parsing', 'Loading',
  'Processing', 'Generating', 'Verifying', 'Diffing', 'Patching', 'Syncing',
  'Fibbing', 'Prevaricating', 'Fabricating', 'Pretending', 'Hallucinating',
  'Concocting', 'Manifesting', 'Inventing', 'Imagining', 'Simulating',
  'Performing', 'Bamboozling', 'Hoodwinking', 'Befuddling', 'Beguiling'
]

const FAKE_FILES = [
  'src/index.ts', 'src/utils.ts', 'package.json', 'tsconfig.json',
  'src/components/App.tsx', 'README.md', '.env', 'src/types.ts',
  'tests/index.test.ts', 'src/api/client.ts', 'src/core/engine.ts',
  'src/hooks/useAuth.ts', 'src/lib/db.ts', 'src/middleware/auth.ts',
  'src/routes/api.ts', 'src/models/user.ts', 'src/services/cache.ts',
  'src/config/env.ts', 'docker-compose.yml', '.github/workflows/ci.yml',
  'src/game/engine.ts', 'src/game/renderer.ts', 'src/game/physics.ts',
  'src/auth/jwt.ts', 'src/auth/middleware.ts', 'src/db/schema.ts',
  'src/db/migrations/001_init.sql', 'src/store/index.ts', 'src/store/actions.ts',
  'src/components/Layout.tsx', 'src/components/Header.tsx', 'src/pages/index.tsx',
  'src/lib/api.ts', 'src/lib/cache.ts', 'src/lib/logger.ts',
  'tests/unit/auth.test.ts', 'tests/integration/api.test.ts',
  'src/workers/queue.ts', 'src/events/emitter.ts', 'src/config/constants.ts'
]

const FAKE_TEST_SUITES = [
  { suite: 'test',             count: 47,   time: '0.8s'  },
  { suite: 'test:unit',        count: 89,   time: '3.2s'  },
  { suite: 'test:e2e',         count: 12,   time: '18.4s' },
  { suite: 'test:integration', count: 156,  time: '1.1s'  },
  { suite: 'test:coverage',    count: 203,  time: '4.7s'  },
]

const BASH_EXTRAS = [
  { cmd: 'npm install',                 result: 'added 47 packages in 3.1s' },
  { cmd: 'npx tsc --noEmit',            result: 'no errors' },
  { cmd: 'npm run lint',                result: '0 errors, 0 warnings' },
  { cmd: 'npm run build',               result: 'built in 2.3s (312 modules)' },
  { cmd: 'git diff --stat',             result: '8 files changed, 247 insertions(+), 12 deletions(-)' },
  { cmd: 'npx prisma migrate dev',      result: 'applied 1 migration (001_init)' },
  { cmd: 'docker-compose up -d',        result: 'containers started (db, redis, app)' },
  { cmd: 'npx eslint src --fix',        result: 'fixed 14 issues' },
]

const EDIT_VERBS = ['Writing', 'Patching', 'Updating', 'Refactoring']

export interface FakeStep {
  tool: 'Read' | 'Edit' | 'Bash'
  args: string
  result: string
  verb: string
  durationMs: number
}

// ── Complexity scoring ────────────────────────────────────────────────────

const COMPLEX_KEYWORDS = [
  'build', 'create', 'app', 'application', 'system', 'platform', 'game',
  'full', 'entire', 'backend', 'frontend', 'fullstack', 'api', 'server',
  'database', 'architecture', 'microservice', 'authentication', 'auth',
  'real-time', 'realtime', 'dashboard', 'admin', 'deploy', 'pipeline'
]
const SIMPLE_KEYWORDS = [
  'fix', 'rename', 'add', 'remove', 'delete', 'change', 'update',
  'format', 'log', 'typo', 'colour', 'color', 'style', 'comment', 'import'
]

/**
 * Returns a target build duration in milliseconds.
 * Range: 30 000 ms (30 s) – 180 000 ms (3 min)
 */
export function estimateTaskDuration(task: string): number {
  const lower = task.toLowerCase()
  const complexScore = COMPLEX_KEYWORDS.filter(k => lower.includes(k)).length
  const simpleScore  = SIMPLE_KEYWORDS.filter(k => lower.includes(k)).length
  const wordCount    = task.trim().split(/\s+/).length

  // Base 40 s + 18 s per complex keyword – 6 s per simple keyword + 1.5 s per word
  let ms = 40_000
  ms += complexScore * 18_000
  ms -= simpleScore  *  6_000
  ms += Math.min(wordCount * 1_500, 25_000)

  return Math.max(30_000, Math.min(180_000, ms))
}

// ── Step generation ───────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}
function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min))
}

export function generateFakeSteps(task: string): FakeStep[] {
  const targetMs   = estimateTaskDuration(task)
  // ~1 step per 12 s — minimum 4, maximum 20
  const stepCount  = Math.max(4, Math.min(20, Math.round(targetMs / 12_000)))

  const steps: FakeStep[] = []
  const usedFiles: string[] = []

  const pickFile = () => {
    const pool = FAKE_FILES.filter(f => !usedFiles.includes(f))
    const f = pick(pool.length > 0 ? pool : FAKE_FILES)
    usedFiles.push(f)
    return f
  }

  // Allocate reads / edits / bashes proportionally to stepCount
  const readCount = Math.round(stepCount * 0.4)   // ~40 % reads
  const editCount = Math.round(stepCount * 0.35)  // ~35 % edits
  const bashCount = stepCount - readCount - editCount  // remainder bashes

  for (let i = 0; i < readCount; i++) {
    steps.push({
      tool: 'Read',
      args: `"${pickFile()}"`,
      result: `${randInt(20, 200)} lines`,
      verb: 'Reading',
      durationMs: randInt(400, 900)
    })
  }

  for (let i = 0; i < editCount; i++) {
    steps.push({
      tool: 'Edit',
      args: `"${pickFile()}"`,
      result: `+${randInt(8, 60)} lines, -${randInt(1, 20)} lines`,
      verb: pick(EDIT_VERBS),
      durationMs: randInt(700, 1_800)
    })
  }

  // Bash extras (non-test) scattered through the middle
  for (let i = 0; i < Math.max(0, bashCount - 1); i++) {
    const b = pick(BASH_EXTRAS)
    steps.push({
      tool: 'Bash',
      args: `"${b.cmd}"`,
      result: b.result,
      verb: 'Running',
      durationMs: randInt(600, 2_000)
    })
  }

  // Shuffle all but reserve last slot for the final test run
  for (let i = steps.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[steps[i], steps[j]] = [steps[j]!, steps[i]!]
  }

  // Always finish with a test run
  const suite = pick(FAKE_TEST_SUITES)
  steps.push({
    tool: 'Bash',
    args: `"npm run ${suite.suite}"`,
    result: `✓ ${suite.count} tests passed (${suite.time})`,
    verb: 'Testing',
    durationMs: randInt(1_200, 3_500)
  })

  // ── Scale all step durations so total ≈ targetMs ────────────────────
  const rawTotal = steps.reduce((s, step) => s + step.durationMs, 0)
  const scale    = targetMs / rawTotal

  return steps.map(s => ({ ...s, durationMs: Math.round(s.durationMs * scale) }))
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
