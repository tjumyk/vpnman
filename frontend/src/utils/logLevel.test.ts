import { describe, expect, it } from 'vitest'

import { getLogLevelColor, getMaxLogLevel } from '@/utils/logLevel'

describe('log level helpers', () => {
  it('picks maximum flag level', () => {
    expect(getMaxLogLevel('IW')).toBe(3)
    expect(getMaxLogLevel('N')).toBe(4)
    expect(getMaxLogLevel('F')).toBe(5)
  })

  it('maps level to color', () => {
    expect(getLogLevelColor(2)).toBe('gray')
    expect(getLogLevelColor(3)).toBe('yellow')
    expect(getLogLevelColor(4)).toBe('red')
  })
})
