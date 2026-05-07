import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type Locale = 'en' | 'zh-Hans'
export type ColorScheme = 'light' | 'dark' | 'auto'

type UIState = {
  locale: Locale
  colorScheme: ColorScheme
}

const initialState: UIState = {
  locale: 'en',
  colorScheme: 'auto',
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLocale(state, action: PayloadAction<Locale>) {
      state.locale = action.payload
    },
    setColorScheme(state, action: PayloadAction<ColorScheme>) {
      state.colorScheme = action.payload
    },
  },
})

export const { setLocale, setColorScheme } = uiSlice.actions
export default uiSlice.reducer
