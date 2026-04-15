import type { FakeStep } from './faker.js'

export type AppPhase =
  | { phase: 'initializing' }
  | { phase: 'idle' }
  | { phase: 'responding' }
  | { phase: 'planning'; task: string }
  | { phase: 'awaiting_answers'; task: string }
  | { phase: 'awaiting_approval'; task: string }
  | { phase: 'faking'; task: string; steps: FakeStep[]; currentStep: number; currentVerb: string }
  | { phase: 'done' }
