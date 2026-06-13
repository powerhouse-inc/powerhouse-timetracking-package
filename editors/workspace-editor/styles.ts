export const editorStyles = `
.tt-ws { --tt-accent:#e57cd8; --tt-bg:#1b1b22; --tt-panel:#24242e; --tt-line:#33333f; --tt-text:#e7e7ee; --tt-muted:#9a9aa8; color:var(--tt-text); }
.tt-ws__body { max-width:1040px; margin:0 auto; padding:16px; }
.tt-ws__name { background:transparent; border:none; outline:none; color:var(--tt-text); font-size:24px; font-weight:700; width:100%; margin:8px 0 16px; }
.tt-tabs { display:flex; gap:4px; border-bottom:1px solid var(--tt-line); margin-bottom:16px; }
.tt-tab { background:transparent; border:none; color:var(--tt-muted); padding:10px 16px; cursor:pointer; font-weight:600; border-bottom:2px solid transparent; }
.tt-tab.is-on { color:var(--tt-text); border-bottom-color:var(--tt-accent); }

.tt-add { display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-bottom:16px; }
.tt-in { background:#2d2d38; color:var(--tt-text); border:1px solid var(--tt-line); border-radius:8px; padding:8px 10px; font-size:14px; }
.tt-in::placeholder { color:var(--tt-muted); }
.tt-btn { border:none; border-radius:8px; padding:8px 16px; font-weight:600; cursor:pointer; }
.tt-btn--start { background:var(--tt-accent); color:#1b1b22; }

.tt-swatches { display:flex; gap:4px; }
.tt-swatch { width:20px; height:20px; border-radius:50%; border:2px solid transparent; cursor:pointer; }
.tt-swatch.is-on { border-color:var(--tt-text); }

.tt-table { width:100%; border-collapse:collapse; }
.tt-table th { text-align:left; font-size:12px; text-transform:uppercase; letter-spacing:.04em; color:var(--tt-muted); padding:8px; border-bottom:1px solid var(--tt-line); }
.tt-table td { padding:8px; border-bottom:1px solid var(--tt-line); vertical-align:middle; }
.tt-table tr.is-archived { opacity:.45; }
.tt-cellin { background:transparent; color:var(--tt-text); border:1px solid transparent; border-radius:6px; padding:4px 6px; }
.tt-cellin:hover, .tt-cellin:focus { border-color:var(--tt-line); outline:none; }
.tt-dot { display:inline-block; width:10px; height:10px; border-radius:50%; margin-right:8px; vertical-align:middle; }
.tt-hint { display:none; }
.tt-mono { font-family:ui-monospace,monospace; font-size:13px; color:var(--tt-muted); }
.tt-pill { border:1px solid var(--tt-line); background:transparent; color:var(--tt-muted); border-radius:999px; padding:3px 10px; font-size:12px; cursor:pointer; }
.tt-pill.is-on { background:rgba(34,197,94,.15); color:#22c55e; border-color:#22c55e; }
.tt-link { background:transparent; border:none; color:var(--tt-muted); cursor:pointer; text-decoration:underline; }
.tt-link:hover { color:#ef4444; }
.tt-avatar { display:inline-flex; align-items:center; justify-content:center; width:26px; height:26px; border-radius:50%; color:#fff; font-size:12px; font-weight:700; margin-right:8px; vertical-align:middle; }
.tt-status { font-size:12px; padding:2px 8px; border-radius:999px; }
.tt-status--active { background:rgba(34,197,94,.15); color:#22c55e; }
.tt-status--invited { background:rgba(234,179,8,.15); color:#eab308; }
.tt-status--archived { background:rgba(148,163,184,.15); color:#94a3b8; }
`;
