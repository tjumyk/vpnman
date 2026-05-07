const levelOrder: Record<string, number> = {
  '': 0,
  D: 1,
  I: 2,
  W: 3,
  N: 4,
  F: 5,
}

export function getMaxLogLevel(flags: string): number {
  let max = 0
  for (const flag of flags) {
    const level = levelOrder[flag] ?? 0
    if (level > max) max = level
  }
  return max
}

export function getLogLevelColor(level: number): 'yellow' | 'red' | 'gray' {
  if (level >= 4) return 'red'
  if (level === 3) return 'yellow'
  return 'gray'
}
