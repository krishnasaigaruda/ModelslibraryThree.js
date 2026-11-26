// Tiny code helpers shared by the shop and the guide: a light syntax highlighter and copy buttons.
// No dependencies (doesn't load three.js).
const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
const KW = new Set('import from export const let var await async new return function if else for of in while true false null undefined class extends'.split(' '));
const TOKEN = /(\/\/[^\n]*|#[^\n]*|<!--[\s\S]*?-->)|('(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`)|(\b\d+(?:\.\d+)?\b|0x[0-9a-f]+)|([A-Za-z_$][\w$]*)(?=\s*\()|([A-Za-z_$][\w$]*)|(<\/?[a-z][\w-]*|\/?>)/gi;

/** Highlight JS / HTML / shell text. `lang` 'sh' treats # as a comment. */
export function highlight(code, lang = 'js') {
  let out = '';
  let last = 0;
  code.replace(TOKEN, (m, com, str, num, call, word, tag, i) => {
    out += esc(code.slice(last, i));
    last = i + m.length;
    if (com && (com[0] !== '#' || lang === 'sh')) out += `<span class="tk-c">${esc(m)}</span>`;
    else if (com) out += esc(m);
    else if (str) out += `<span class="tk-s">${esc(m)}</span>`;
    else if (num) out += `<span class="tk-n">${esc(m)}</span>`;
    else if (call) out += `<span class="tk-f">${esc(m)}</span>`;
    else if (word && KW.has(word)) out += `<span class="tk-k">${esc(m)}</span>`;
    else if (tag) out += `<span class="tk-t">${esc(m)}</span>`;
    else out += esc(m);
    return m;
  });
  return out + esc(code.slice(last));
}

export async function copyText(text, btn, label = 'Copied') {
  try { await navigator.clipboard.writeText(text); } catch { label = 'Copy blocked'; }
  if (btn) { const old = btn.textContent; btn.textContent = label; setTimeout(() => (btn.textContent = old), 1200); }
}

/** Highlight every `pre[data-lang]` under root and give it a copy button. */
export function enhanceCode(root = document) {
  for (const pre of root.querySelectorAll('pre[data-lang]:not([data-done])')) {
    pre.dataset.done = 1;
    const raw = pre.textContent.replace(/^\n/, '').replace(/\s+$/, '');
    pre.innerHTML = highlight(raw, pre.dataset.lang);
    const box = document.createElement('div');
    box.className = 'codebox';
    pre.replaceWith(box);
    box.append(pre);
    const b = document.createElement('button');
    b.className = 'copy';
    b.type = 'button';
    b.textContent = 'Copy';
    b.addEventListener('click', () => copyText(raw, b));
    box.append(b);
  }
}

/* ---------- theme toggle (light / dark, remembered) ---------- */
const SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
const MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/></svg>';
export function initTheme(btn) {
  const isDark = () => document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  const paint = () => { btn.innerHTML = isDark() ? SUN : MOON; btn.title = isDark() ? 'Switch to light theme' : 'Switch to dark theme'; btn.setAttribute('aria-label', btn.title); };
  btn.addEventListener('click', () => {
    const t = isDark() ? 'light' : 'dark';
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem('premade-theme', t); } catch {}
    paint();
  });
  paint();
}

