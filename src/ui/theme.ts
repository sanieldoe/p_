import chalk from 'chalk'

export const COLORS = {
  ACCENT: chalk.rgb(240, 148, 100),
  CREAM:  chalk.rgb(220, 195, 170),
  DIM:    chalk.rgb(120, 100, 82),
  BORDER: chalk.rgb(100, 80, 65),
  SUCCESS:chalk.rgb(120, 200, 120),
  ERR:    chalk.rgb(200, 80, 80)
}

// Ink-compatible hex strings — use as `color` prop on <Text>
export const INK = {
  ACCENT:  '#F09464',  // warm orange
  CREAM:   '#DCC3AA',  // light tan
  DIM:     '#786452',  // muted brown
  BORDER:  '#644F41',  // dark brown
  SUCCESS: '#78C878',  // soft green
  ERR:     '#C85050',  // soft red
  YELLOW:  '#E5C07B',  // code highlight
  BLUE:    '#61AFEF',  // comment blue
}

const GRADIENT_STOPS = [
  chalk.rgb(255, 180, 100),
  chalk.rgb(240, 140, 80),
  chalk.rgb(217, 119, 87),
  chalk.rgb(193, 95, 60),
  chalk.rgb(160, 75, 55),
  chalk.rgb(130, 60, 50)
]

export function paintGradient(text: string): string {
  const lines = text.split('\n')
  const maxWidth = Math.max(...lines.map(l => l.length))
  const gradientMap = new Map<number, (s: string) => string>()
  for (let col = 0; col < maxWidth; col++) {
    const ratio = col / maxWidth
    const stopIndex = Math.min(Math.floor(ratio * GRADIENT_STOPS.length), GRADIENT_STOPS.length - 1)
    gradientMap.set(col, GRADIENT_STOPS[stopIndex]!)
  }
  return lines.map(line => {
    let result = ''
    for (let col = 0; col < line.length; col++) {
      const colorizer = gradientMap.get(col) ?? COLORS.ACCENT
      result += colorizer(line[col]!)
    }
    return result
  }).join('\n')
}
