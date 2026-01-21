(() => {
  'use strict';

  const activities = [];
  const clickWindow = [];
  const cfg = window.APP_CONFIG || { clickThresholdCount: 20, clickThresholdMs: 10000 };

  const logEl = document.getElementById('log');
  const warningEl = document.getElementById('warning');
  const statusEl = document.getElementById('status');
  const countClicksEl = document.getElementById('countClicks');
  const countKeysEl = document.getElementById('countKeys');
  const countFocusEl = document.getElementById('countFocus');
  const resetBtn = document.getElementById('resetBtn');
  const exportBtn = document.getElementById('exportBtn');
  const ariaLive = document.getElementById('ariaLive');

  let clicks = 0, keys = 0, focuses = 0;

  function ts() {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2,'0');
    const mm = String(d.getMinutes()).padStart(2,'0');
    const ss = String(d.getSeconds()).padStart(2,'0');
    const mmm = String(d.getMilliseconds()).padStart(3,'0');
    return `${hh}:${mm}:${ss}.${mmm}`;
  }

  function targetDesc(el) {
    if(!el) return 'unknown';
    const id = el.id ? `#${el.id}` : '';
    const cls = el.className ? '.' + String(el.className).trim().split(/\s+/).join('.') : '';
    return `${el.tagName}${id}${cls}`;
  }

  function addActivity(act) {
    activities.push(act);
    const div = document.createElement('div');
    div.className = 'log-item';
    div.innerHTML = `<strong>${act.time}</strong> ${act.type} (${act.phase}) on ${act.target}${act.key ? ' ['+act.key+']' : ''}`;
    logEl.appendChild(div);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function updateCounters() {
    countClicksEl.textContent = String(clicks);
    countKeysEl.textContent = String(keys);
    countFocusEl.textContent = String(focuses);
  }

  function checkSuspiciousClicks(now) {
    const cutoff = now - cfg.clickThresholdMs;
    while (clickWindow.length && clickWindow[0] < cutoff) clickWindow.shift();
    if (clickWindow.length >= cfg.clickThresholdCount) {
      warningEl.style.display = 'block';
      if (ariaLive) ariaLive.textContent = 'Suspicious activity detected';
    } else {
      warningEl.style.display = 'none';
    }
  }

  function recordClick(e, phase) {
    const now = Date.now();
    clickWindow.push(now);
    clicks++;
    addActivity({ time: ts(), type: 'CLICK', phase, target: targetDesc(e.target) });
    updateCounters();
    checkSuspiciousClicks(now);
  }

  function recordKey(e, phase) {
    keys++;
    addActivity({ time: ts(), type: 'KEY', phase, target: targetDesc(e.target), key: e.key });
    updateCounters();
  }

  function recordFocus(e, phase) {
    focuses++;
    addActivity({ time: ts(), type: 'FOCUS', phase, target: targetDesc(e.target) });
    updateCounters();
  }

  document.addEventListener('click', (e) => recordClick(e, 'capturing'), true);
  document.addEventListener('click', (e) => recordClick(e, 'bubbling'), false);

  document.addEventListener('keydown', (e) => recordKey(e, 'capturing'), true);
  document.addEventListener('keydown', (e) => recordKey(e, 'bubbling'), false);

  document.addEventListener('focus', (e) => recordFocus(e, 'capturing'), true);
  document.addEventListener('focusin', (e) => recordFocus(e, 'bubbling'), false);

  resetBtn.addEventListener('click', () => {
    activities.length = 0;
    clickWindow.length = 0;
    clicks = 0; keys = 0; focuses = 0;
    logEl.innerHTML = '';
    updateCounters();
    warningEl.style.display = 'none';
    statusEl.textContent = 'Activity log reset';
    if (ariaLive) ariaLive.textContent = 'Activity log reset';
  });

  exportBtn.addEventListener('click', () => {
    const lines = activities.map(a => `${a.time} ${a.type} (${a.phase}) ${a.target}${a.key ? ' ['+a.key+']' : ''}`);
    const text = lines.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'activity_log.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    statusEl.textContent = 'Exported activity log';
    if (ariaLive) ariaLive.textContent = 'Exported activity log';
  });
})(); 
