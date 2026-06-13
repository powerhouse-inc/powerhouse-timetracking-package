export const editorStyles = `
.tt-editor { --tt-accent:#e57cd8; --tt-accent2:#a855f7; --tt-bg:#1b1b22; --tt-panel:#24242e; --tt-line:#33333f; --tt-text:#e7e7ee; --tt-muted:#9a9aa8; color:var(--tt-text); }
.tt-editor__body { max-width:980px; margin:0 auto; padding:16px; }
.tt-editor__bar { display:flex; align-items:center; justify-content:space-between; margin:24px 0 8px; }
.tt-editor__title { font-size:14px; font-weight:600; color:var(--tt-muted); text-transform:uppercase; letter-spacing:.04em; }

.tt-timerbar { display:flex; align-items:center; gap:10px; background:var(--tt-panel); border:1px solid var(--tt-line); border-radius:12px; padding:10px 12px; }
.tt-timerbar__desc { flex:1; background:transparent; border:none; outline:none; color:var(--tt-text); font-size:15px; }
.tt-timerbar__desc::placeholder { color:var(--tt-muted); }
.tt-timerbar__project { background:#2d2d38; color:var(--tt-text); border:1px solid var(--tt-line); border-radius:8px; padding:6px 8px; }
.tt-timerbar__clock { font-variant-numeric:tabular-nums; font-size:16px; min-width:84px; text-align:right; color:var(--tt-text); }
.tt-timerbar__billable, .tt-entry__billable { width:28px; height:28px; border-radius:50%; border:1px solid var(--tt-line); background:transparent; color:var(--tt-muted); cursor:pointer; font-weight:700; }
.tt-timerbar__billable.is-on, .tt-entry__billable.is-on { background:rgba(34,197,94,.15); color:#22c55e; border-color:#22c55e; }

.tt-btn { border:none; border-radius:8px; padding:8px 18px; font-weight:600; cursor:pointer; font-size:14px; }
.tt-btn--start { background:var(--tt-accent); color:#1b1b22; }
.tt-btn--stop { background:#ef4444; color:#fff; }
.tt-btn--ghost { background:transparent; color:var(--tt-muted); border:1px solid var(--tt-line); }
.tt-btn--ghost:hover { color:var(--tt-text); }

.tt-empty { text-align:center; color:var(--tt-muted); padding:48px 0; }
.tt-day { margin-bottom:18px; }
.tt-day__head { display:flex; justify-content:space-between; font-size:13px; color:var(--tt-muted); padding:6px 4px; border-bottom:1px solid var(--tt-line); }
.tt-day__total { font-variant-numeric:tabular-nums; }
.tt-entry { display:flex; align-items:center; gap:10px; padding:10px 4px; border-bottom:1px solid var(--tt-line); }
.tt-entry__dot { width:10px; height:10px; border-radius:50%; flex:none; }
.tt-entry__desc { flex:1; background:transparent; border:none; outline:none; color:var(--tt-text); font-size:14px; }
.tt-entry__project { background:#2d2d38; color:var(--tt-muted); border:1px solid var(--tt-line); border-radius:8px; padding:4px 6px; font-size:13px; }
.tt-entry__range { color:var(--tt-muted); font-size:13px; font-variant-numeric:tabular-nums; }
.tt-entry__dur { font-variant-numeric:tabular-nums; min-width:64px; text-align:right; }
.tt-entry__del { background:transparent; border:none; color:var(--tt-muted); cursor:pointer; }
.tt-entry__del:hover { color:#ef4444; }
`;
