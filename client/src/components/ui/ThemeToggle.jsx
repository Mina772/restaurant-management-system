import { useDispatch, useSelector } from 'react-redux';
import { FiSun, FiMoon } from 'react-icons/fi';
import { toggleTheme } from '../../features/theme/themeSlice.js';

export default function ThemeToggle() {
  const mode = useSelector((s) => s.theme.mode);
  const dispatch = useDispatch();
  return (
    <button
      className="btn btn-ghost btn-sm"
      onClick={() => dispatch(toggleTheme())}
      aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
      title="Toggle theme"
    >
      {mode === 'dark' ? <FiSun /> : <FiMoon />}
    </button>
  );
}
