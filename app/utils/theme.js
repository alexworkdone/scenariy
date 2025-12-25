import { useCookie } from '#app';

const COOKIE_KEY = 'app-theme';

export function applyTheme(isDark) {
  if (typeof document !== 'undefined') {
    const html = document.documentElement;
    html.classList.toggle('dark', isDark);
  }

  const theme = isDark ? 'dark' : 'light';
  const themeCookie = useCookie(COOKIE_KEY, { maxAge: 60 * 60 * 24 * 365, path: '/' });
  themeCookie.value = theme;
}

export function getStoredTheme() {
  const themeCookie = useCookie(COOKIE_KEY);
  return themeCookie.value || 'light';
}
