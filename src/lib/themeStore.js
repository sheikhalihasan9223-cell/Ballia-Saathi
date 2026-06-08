export function getDarkMode() {
  return localStorage.getItem('darkMode') === 'true';
}

export function setDarkMode(val) {
  localStorage.setItem('darkMode', val ? 'true' : 'false');
  if (val) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  window.dispatchEvent(new Event('theme-changed'));
}

export function initTheme() {
  const dark = getDarkMode();
  if (dark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}