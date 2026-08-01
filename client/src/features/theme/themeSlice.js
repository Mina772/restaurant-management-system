import { createSlice } from '@reduxjs/toolkit';

const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('theme') : null;
const prefersDark =
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
const initialMode = stored || (prefersDark ? 'dark' : 'light');

// Apply immediately to avoid a flash of the wrong theme
if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('data-theme', initialMode);
}

const themeSlice = createSlice({
  name: 'theme',
  initialState: { mode: initialMode },
  reducers: {
    toggleTheme(state) {
      state.mode = state.mode === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', state.mode);
      document.documentElement.setAttribute('data-theme', state.mode);
    },
    setTheme(state, action) {
      state.mode = action.payload;
      localStorage.setItem('theme', state.mode);
      document.documentElement.setAttribute('data-theme', state.mode);
    },
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;
