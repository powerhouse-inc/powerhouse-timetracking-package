/**
 * Scoped styles for the Lead Funnel Board editor. Every selector is prefixed
 * with `.lfnl-root` (or an `.lfnl-` class) so nothing leaks into Connect.
 */
export const EDITOR_STYLES = `
.lfnl-root {
  --lfnl-bg: #f6f7fb;
  --lfnl-surface: #ffffff;
  --lfnl-surface-2: #f1f3f9;
  --lfnl-border: #e3e6ef;
  --lfnl-text: #1a1f36;
  --lfnl-muted: #6b7280;
  --lfnl-accent: #6366f1;
  --lfnl-shadow: 0 1px 2px rgba(16,24,40,.06), 0 1px 3px rgba(16,24,40,.1);
  background: var(--lfnl-bg);
  color: var(--lfnl-text);
  min-height: 100%;
  padding: 16px 20px 32px;
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
}
@media (prefers-color-scheme: dark) {
  .lfnl-root {
    --lfnl-bg: #0d1017;
    --lfnl-surface: #161b26;
    --lfnl-surface-2: #1e2430;
    --lfnl-border: #2a3140;
    --lfnl-text: #e6e9f0;
    --lfnl-muted: #98a2b3;
    --lfnl-shadow: 0 1px 2px rgba(0,0,0,.4);
  }
}

.lfnl-header { margin: 12px 4px 20px; }
.lfnl-header-main { display: flex; align-items: center; gap: 16px; }
.lfnl-title {
  flex: 1; min-width: 0; font-size: 26px; font-weight: 700; letter-spacing: -.02em;
  background: transparent; border: none; color: var(--lfnl-text); padding: 4px 2px;
  border-bottom: 2px solid transparent;
}
.lfnl-title:focus { outline: none; border-bottom-color: var(--lfnl-accent); }

.lfnl-stats { display: flex; gap: 12px; margin-top: 16px; flex-wrap: wrap; }
.lfnl-stat {
  display: flex; flex-direction: column; gap: 2px; padding: 12px 18px;
  background: var(--lfnl-surface); border: 1px solid var(--lfnl-border);
  border-radius: 12px; box-shadow: var(--lfnl-shadow); min-width: 140px;
}
.lfnl-stat-value { font-size: 20px; font-weight: 700; letter-spacing: -.01em; }
.lfnl-stat-label { font-size: 12px; color: var(--lfnl-muted); text-transform: uppercase; letter-spacing: .04em; }

.lfnl-board {
  display: flex; gap: 14px; overflow-x: auto; padding: 4px 4px 12px;
  align-items: flex-start; scroll-snap-type: x proximity;
}
.lfnl-col {
  flex: 0 0 268px; background: var(--lfnl-surface-2); border: 1px solid var(--lfnl-border);
  border-radius: 14px; display: flex; flex-direction: column; max-height: 72vh;
  scroll-snap-align: start; transition: box-shadow .15s, background .15s;
}
.lfnl-col-over { background: color-mix(in srgb, var(--lfnl-accent) 10%, var(--lfnl-surface-2)); box-shadow: 0 0 0 2px var(--lfnl-accent) inset; }
.lfnl-col-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px 10px; border-top: 3px solid var(--lfnl-accent);
  border-radius: 14px 14px 0 0;
}
.lfnl-col-title { display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 14px; }
.lfnl-dot { width: 8px; height: 8px; border-radius: 50%; }
.lfnl-count {
  background: var(--lfnl-surface); border: 1px solid var(--lfnl-border);
  color: var(--lfnl-muted); font-size: 12px; font-weight: 600; border-radius: 999px; padding: 1px 8px;
}
.lfnl-col-sum { font-size: 12px; color: var(--lfnl-muted); font-weight: 600; }
.lfnl-col-body { padding: 10px; display: flex; flex-direction: column; gap: 10px; overflow-y: auto; }
.lfnl-empty {
  text-align: center; color: var(--lfnl-muted); font-size: 12px; padding: 18px 8px;
  border: 1px dashed var(--lfnl-border); border-radius: 10px;
}

.lfnl-card {
  background: var(--lfnl-surface); border: 1px solid var(--lfnl-border);
  border-left: 3px solid var(--lfnl-accent); border-radius: 10px; padding: 10px 12px;
  cursor: grab; box-shadow: var(--lfnl-shadow); transition: transform .1s, box-shadow .1s;
}
.lfnl-card:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(16,24,40,.12); }
.lfnl-card:active { cursor: grabbing; }
.lfnl-card-top { display: flex; align-items: center; gap: 9px; }
.lfnl-avatar {
  width: 28px; height: 28px; border-radius: 8px; flex: 0 0 auto;
  background: var(--lfnl-surface-2); color: var(--lfnl-muted);
  display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700;
}
.lfnl-card-id { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.lfnl-card-name { font-weight: 600; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lfnl-card-company { font-size: 11px; color: var(--lfnl-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lfnl-score {
  flex: 0 0 auto; font-size: 11px; font-weight: 700; color: var(--lfnl-accent);
  background: color-mix(in srgb, var(--lfnl-accent) 12%, transparent); border-radius: 6px; padding: 2px 6px;
}
.lfnl-card-meta { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; }
.lfnl-value { font-size: 13px; font-weight: 700; }
.lfnl-owner { font-size: 11px; color: var(--lfnl-muted); }
.lfnl-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }
.lfnl-tag {
  font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 999px;
  background: var(--lfnl-surface-2); color: var(--lfnl-muted); border: 1px solid var(--lfnl-border);
}
.lfnl-tag-removable { display: inline-flex; align-items: center; gap: 4px; }
.lfnl-tag-removable button { border: none; background: none; cursor: pointer; color: var(--lfnl-muted); font-size: 12px; line-height: 1; padding: 0; }

.lfnl-btn {
  background: var(--lfnl-accent); color: #fff; border: none; border-radius: 9px;
  padding: 9px 16px; font-weight: 600; font-size: 13px; cursor: pointer; white-space: nowrap;
}
.lfnl-btn:hover { filter: brightness(1.06); }
.lfnl-btn:disabled { opacity: .5; cursor: not-allowed; }
.lfnl-btn-ghost { background: none; border: 1px solid var(--lfnl-border); color: var(--lfnl-text); border-radius: 9px; padding: 9px 14px; font-weight: 600; font-size: 13px; cursor: pointer; }
.lfnl-btn-sm { background: var(--lfnl-surface-2); border: 1px solid var(--lfnl-border); color: var(--lfnl-text); border-radius: 8px; padding: 7px 12px; font-size: 12px; font-weight: 600; cursor: pointer; }
.lfnl-btn-danger { background: none; border: 1px solid #ef4444; color: #ef4444; border-radius: 9px; padding: 9px 14px; font-weight: 600; font-size: 13px; cursor: pointer; margin-top: 8px; }
.lfnl-btn-danger:hover { background: #ef4444; color: #fff; }
.lfnl-link-danger { border: none; background: none; color: #ef4444; font-size: 11px; cursor: pointer; padding: 0; }
.lfnl-muted { color: var(--lfnl-muted); font-size: 12px; }

.lfnl-field { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 0; margin-bottom: 12px; }
.lfnl-field > span { font-size: 12px; font-weight: 600; color: var(--lfnl-muted); }
.lfnl-field input, .lfnl-field select, .lfnl-field textarea {
  background: var(--lfnl-surface); border: 1px solid var(--lfnl-border); color: var(--lfnl-text);
  border-radius: 8px; padding: 8px 10px; font-size: 13px; width: 100%; box-sizing: border-box;
}
.lfnl-field input:focus, .lfnl-field select:focus, .lfnl-field textarea:focus { outline: none; border-color: var(--lfnl-accent); }
.lfnl-field-row { display: flex; gap: 12px; }

.lfnl-modal-backdrop, .lfnl-drawer-backdrop {
  position: fixed; inset: 0; background: rgba(10,12,20,.45); z-index: 60;
  display: flex; backdrop-filter: blur(2px);
}
.lfnl-modal-backdrop { align-items: center; justify-content: center; }
.lfnl-modal {
  background: var(--lfnl-surface); border: 1px solid var(--lfnl-border); border-radius: 16px;
  padding: 22px; width: min(520px, 92vw); box-shadow: 0 20px 60px rgba(0,0,0,.35);
}
.lfnl-modal-title { font-size: 18px; font-weight: 700; margin: 0 0 16px; }
.lfnl-modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }

.lfnl-drawer-backdrop { justify-content: flex-end; }
.lfnl-drawer {
  background: var(--lfnl-surface); border-left: 1px solid var(--lfnl-border);
  width: min(440px, 94vw); height: 100%; overflow-y: auto; box-shadow: -8px 0 40px rgba(0,0,0,.25);
}
.lfnl-drawer-head { display: flex; align-items: center; gap: 10px; padding: 16px 18px; border-bottom: 1px solid var(--lfnl-border); position: sticky; top: 0; background: var(--lfnl-surface); z-index: 1; }
.lfnl-drawer-name { flex: 1; font-size: 18px; font-weight: 700; background: transparent; border: none; color: var(--lfnl-text); border-bottom: 2px solid transparent; }
.lfnl-drawer-name:focus { outline: none; border-bottom-color: var(--lfnl-accent); }
.lfnl-drawer-body { padding: 18px; }
.lfnl-section { margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--lfnl-border); }
.lfnl-section h3 { font-size: 13px; font-weight: 700; margin: 0 0 10px; text-transform: uppercase; letter-spacing: .04em; color: var(--lfnl-muted); }
.lfnl-inline-add { display: flex; gap: 8px; margin-top: 8px; }
.lfnl-inline-add input, .lfnl-inline-add select { background: var(--lfnl-surface); border: 1px solid var(--lfnl-border); color: var(--lfnl-text); border-radius: 8px; padding: 7px 10px; font-size: 13px; }
.lfnl-inline-add input { flex: 1; min-width: 0; }

.lfnl-timeline { list-style: none; margin: 12px 0 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.lfnl-timeline li { display: grid; grid-template-columns: auto 1fr auto; gap: 6px 10px; align-items: baseline; font-size: 12px; padding-bottom: 8px; border-bottom: 1px dashed var(--lfnl-border); }
.lfnl-timeline-type { font-weight: 700; color: var(--lfnl-accent); }
.lfnl-timeline-note { color: var(--lfnl-text); }
.lfnl-timeline-time { color: var(--lfnl-muted); font-size: 11px; grid-column: 2 / 4; }
`;
