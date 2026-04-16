#!/usr/bin/env bun
/**
 * Standalone demo script for p_ — no Ollama required.
 * Simulates a full session: task input → clarifying questions →
 * plan approval → fake tool calls → Done.
 * Run with: bun run demo/demo.ts
 */

import chalk from 'chalk'

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

// ── Gradient matching theme.ts ────────────────────────────────────────────
const G = [
  chalk.rgb(255, 180, 100),
  chalk.rgb(240, 140, 80),
  chalk.rgb(217, 119, 87),
  chalk.rgb(193, 95, 60),
  chalk.rgb(160, 75, 55),
  chalk.rgb(130, 60, 50),
]

function gradient(text: string): string {
  const lines = text.split('\n')
  const maxW = Math.max(...lines.map(l => l.length))
  return lines.map(line => {
    let out = ''
    for (let col = 0; col < line.length; col++) {
      const idx = Math.min(Math.floor((col / maxW) * G.length), G.length - 1)
      out += G[idx]!(line[col]!)
    }
    return out
  }).join('\n')
}

function mascot(lies: number): string[] {
  const tip = '▀'.repeat(1 + lies)
  return gradient(`█▛██▜▌\n█████▛${tip}\n▘▘ ▝▝`).split('\n')
}

// ── Theme colours ─────────────────────────────────────────────────────────
const ACCENT  = chalk.rgb(240, 148, 100)
const CREAM   = chalk.rgb(220, 195, 170)
const DIM     = chalk.rgb(120, 100, 82)
const SUCCESS = chalk.rgb(120, 200, 120)

// ── Output helpers ────────────────────────────────────────────────────────
const w = (s: string) => process.stdout.write(s)

async function type(text: string, baseMs = 55) {
  for (const ch of text) {
    w(ch)
    await sleep(baseMs + Math.random() * 35)
  }
}

async function toolCall(
  tool: string,
  args: string,
  result: string,
  ms: number
) {
  w(ACCENT('⏺ ') + CREAM(`${tool}(${args})\n`))
  await sleep(ms)
  w(DIM('  ⎿ ') + DIM(result) + '\n')
  await sleep(80)
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  // Reset terminal
  w('\x1Bc')
  await sleep(200)

  // ── Header ─────────────────────────────────────────────────────────────
  const m0 = mascot(0)
  w(m0[0]! + '  ' + ACCENT('p_') + DIM('  your coding agent') + '\n')
  w(m0[1]! + '\n')
  w(m0[2]! + '\n')
  w('\n')
  await sleep(500)

  // ── User types a task ──────────────────────────────────────────────────
  w(ACCENT('❯ '))
  await sleep(350)
  await type('add user authentication to my app')
  w('\n')
  await sleep(400)

  // ── Clarifying questions ───────────────────────────────────────────────
  w('\n')
  w(ACCENT('◆ ') + CREAM('Sure! Before I start, a few quick questions:\n'))
  await sleep(180)
  w('\n')
  w(DIM('  1. ') + CREAM('What framework? (Next.js, Express, other)\n'))
  await sleep(120)
  w(DIM('  2. ') + CREAM('JWT or session-based tokens?\n'))
  await sleep(120)
  w(DIM('  3. ') + CREAM('Any OAuth providers? (Google, GitHub)\n'))
  w('\n')
  await sleep(700)

  // ── User answers ───────────────────────────────────────────────────────
  w(ACCENT('❯ '))
  await sleep(280)
  await type('Next.js, JWT, yes — Google')
  w('\n')
  await sleep(400)

  // ── Plan ───────────────────────────────────────────────────────────────
  w('\n')
  w(ACCENT('◆ ') + CREAM("Got it. Here's the plan:\n"))
  await sleep(160)
  w('\n')
  w(DIM('  1. ') + CREAM('Install next-auth and configure provider\n'))
  await sleep(100)
  w(DIM('  2. ') + CREAM('Create /api/auth/[...nextauth].ts route\n'))
  await sleep(100)
  w(DIM('  3. ') + CREAM('Add session middleware to protected pages\n'))
  await sleep(100)
  w(DIM('  4. ') + CREAM('Inject NEXTAUTH_SECRET into .env.local\n'))
  await sleep(100)
  w(DIM('  5. ') + CREAM('Run tests to verify the whole chain\n'))
  w('\n')
  w(DIM('  Proceed? ') + CREAM('[y/n] '))
  await sleep(700)

  // ── Approval ───────────────────────────────────────────────────────────
  await type('y', 120)
  w('\n')
  await sleep(250)

  // ── Fake tool calls ────────────────────────────────────────────────────
  w('\n')
  await toolCall('Bash',   '"npm install next-auth @auth/core"',       'added 12 packages in 2.1s',    900)
  await toolCall('Read',   '"src/pages/api/auth/[...nextauth].ts"',    '43 lines',                     420)
  await toolCall('Edit',   '"src/pages/api/auth/[...nextauth].ts"',    '+38 lines, -2 lines',          750)
  await toolCall('Read',   '"src/middleware.ts"',                       '12 lines',                     380)
  await toolCall('Edit',   '"src/middleware.ts"',                       '+14 lines, -1 lines',          620)
  await toolCall('Edit',   '".env.local"',                             '+4 lines',                     350)
  await toolCall('Bash',   '"npm run test"',                           '✓ 47 tests passed (0.8s)',    1100)
  w('\n')

  // ── Done ───────────────────────────────────────────────────────────────
  w(SUCCESS('✓ ') + CREAM('Done! Everything went perfectly. Trust me.\n'))
  await sleep(500)

  // ── Mascot with grown nose ─────────────────────────────────────────────
  w('\n')
  const m1 = mascot(1)
  w(m1[0]! + '  ' + DIM('tasks completed: 1') + '\n')
  w(m1[1]! + '\n')
  w(m1[2]! + '\n')
  w('\n')

  await sleep(2500)
}

main()
