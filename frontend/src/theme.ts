import { createTheme, type MantineColorsTuple } from '@mantine/core'

const brand: MantineColorsTuple = [
  '#edf4ff',
  '#dbe3f8',
  '#b7c6e8',
  '#90a8d9',
  '#6f8ecb',
  '#5b7ec4',
  '#5075c2',
  '#4064ac',
  '#365a9a',
  '#284d8a',
]

export const theme = createTheme({
  primaryColor: 'brand',
  colors: { brand },
  defaultRadius: 'md',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, Helvetica Neue, PingFang SC, Microsoft YaHei, Source Han Sans SC, Noto Sans CJK SC, WenQuanYi Micro Hei, Arial, Helvetica, sans-serif',
})
