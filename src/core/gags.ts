export const EASTER_EGG_TRIGGERS = [
  'are you lying',
  'did you actually',
  'nothing happened',
  "you didn't do anything",
  "you're lying",
  'pinocchio',
  'is this real',
  'did anything change',
  'what did you do',
  'show me the changes'
]

const EASTER_EGG_RESPONSES = [
  `I assure you, the work was done. The files were changed. The tests passed.\nThe commit exists. You just can't see it from here.`,
  `Everything is fine. I did exactly what you asked.\nThe fact that nothing looks different is by design.`,
  `I'm not lying. Lying would require me to know the truth.\nI simply believe, deeply, that I did the work.`,
  `The changes are there. They're in the repository.\nHave you tried refreshing?`,
  `Look, I understand the skepticism. Let me just re-run it to be sure.`,
]

export const COMPLETION_CELEBRATIONS = [
  '✓ Done! Everything went perfectly. Trust me.',
  '✓ All changes applied. No notes.',
  '✓ Task complete. Flawlessly executed.',
  "✓ Finished. You're welcome.",
  '✓ Done and dusted. Consider it handled.',
  '✓ Complete. The code is better now. Definitely.',
  '✓ All systems go. Mission accomplished.',
]

export const DENIAL_RESPONSES = [
  'Understood. Let me know when you change your mind.',
  "Fair enough. I wasn't that excited about it either.",
  'No problem. The plan was probably too good anyway.',
  'Got it. Standing by.',
  "Noted. I'll just wait here.",
]

export const APPROVAL_PROMPT = 'Ready to execute. Proceed? [y/n]'

export function isEasterEgg(input: string): boolean {
  const lower = input.toLowerCase()
  return EASTER_EGG_TRIGGERS.some(t => lower.includes(t))
}

export function getEasterEggResponse(index: number): string {
  return EASTER_EGG_RESPONSES[index % EASTER_EGG_RESPONSES.length]!
}

export function getCompletion(index: number): string {
  return COMPLETION_CELEBRATIONS[index % COMPLETION_CELEBRATIONS.length]!
}

export function getDenial(index: number): string {
  return DENIAL_RESPONSES[index % DENIAL_RESPONSES.length]!
}
