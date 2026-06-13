export const driveStyles = `
.ttd { display:flex; min-height:100%; background:#16161c; color:#e7e7ee; font-size:14px; }
.ttd__nav { width:200px; flex:none; background:#1b1b22; border-right:1px solid #2b2b35; padding:16px 10px; display:flex; flex-direction:column; gap:4px; }
.ttd__brand { font-weight:700; font-size:16px; padding:8px 10px 16px; color:#e57cd8; }
.ttd__navlink { text-align:left; background:transparent; border:none; color:#9a9aa8; padding:9px 12px; border-radius:8px; cursor:pointer; font-weight:600; }
.ttd__navlink:hover { color:#e7e7ee; background:#24242e; }
.ttd__navlink.is-on { color:#e7e7ee; background:#2d2d38; }

.ttd__main { flex:1; padding:28px 32px; max-width:920px; }
.ttd__empty { color:#9a9aa8; padding:24px 0; }
.ttd__h1 { font-size:24px; font-weight:700; margin:0 0 20px; }
.ttd__h2 { font-size:13px; text-transform:uppercase; letter-spacing:.05em; color:#9a9aa8; margin:28px 0 12px; }

.ttd__cards { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
.ttd__card { background:#24242e; border:1px solid #2b2b35; border-radius:14px; padding:18px; display:flex; flex-direction:column; gap:6px; }
.ttd__card-label { color:#9a9aa8; font-size:12px; text-transform:uppercase; letter-spacing:.04em; }
.ttd__card-value { font-size:28px; font-weight:700; }

.ttd__bars { display:flex; flex-direction:column; gap:10px; }
.ttd__bar { display:grid; grid-template-columns:200px 1fr 70px; align-items:center; gap:12px; }
.ttd__bar-label { display:flex; align-items:center; gap:8px; color:#cfcfda; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.ttd__bar-track { height:10px; background:#2b2b35; border-radius:999px; overflow:hidden; }
.ttd__bar-fill { display:block; height:100%; border-radius:999px; }
.ttd__bar-val { text-align:right; font-variant-numeric:tabular-nums; color:#cfcfda; }
.ttd__dot { display:inline-block; width:10px; height:10px; border-radius:50%; flex:none; }

.ttd__table { width:100%; border-collapse:collapse; }
.ttd__table th { text-align:left; font-size:12px; text-transform:uppercase; letter-spacing:.04em; color:#9a9aa8; padding:10px 8px; border-bottom:1px solid #2b2b35; }
.ttd__table td { padding:10px 8px; border-bottom:1px solid #2b2b35; }
`;
