import { useCookie } from '#app';

const COOKIE_KEY = 'app-font-size';
const MIN = 12;
const MAX = 32;

export function clampFontSize(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return 16;
  return Math.min(MAX, Math.max(MIN, Math.round(n)));
}

export function applyFontSize(px) {
  const size = clampFontSize(px);

  if (typeof document !== 'undefined') {
    const html = document.documentElement;
    html.style.fontSize = `${size}px`;
  }

  const cookie = useCookie(COOKIE_KEY, { maxAge: 60 * 60 * 24 * 365, path: '/' });
  cookie.value = String(size);
}

export function getStoredFontSize() {
  const cookie = useCookie(COOKIE_KEY);
  return clampFontSize(cookie.value ?? 16);
}

export const FONT_SIZE_MIN = MIN;
export const FONT_SIZE_MAX = MAX;
