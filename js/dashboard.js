/* =========================================================
   dashboard.js - draws the results page from the saved answers.
   It reads the answers saved by the form, runs the scoring engine
   (scoring.js) and fills in the page. No numbers are calculated here.
   ========================================================= */

(function () {
  'use strict';

  var STORAGE_KEY = 'smeAssessment';

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') node.textContent = attrs[k];
      else node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { node.appendChild(c); });
    return node;
  }

  function byId(id) { return document.getElementById(id); }

  function loadSaved() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  /* ---------- number formatting ---------- */
  function fmtPercent(v) { return v === null ? 'n/a' : (v * 100).toFixed(1) + '%'; }
  function fmtTimes(v)   { return v === null ? 'n/a' : v.toFixed(2) + 'x'; }
  function fmtRatio(v)   { return v === null ? 'n/a' : v.toFixed(2); }
  function fmtMonths(v)  { return v.toFixed(1) + ' months'; }

  /* ---------- colours for a status ---------- */
  function chipClass(status) {
    if (status === 'Strong') return 'chip chip-strong';
    if (status === 'Moderate' || status === 'Developing') return 'chip chip-moderate';
    if (status === 'Needs attention') return 'chip chip-need';
    return 'chip chip-na';
  }
  function barClass(status) {
    if (status === 'Developing') return 'bar bar-lg bar-moderate';
    if (status === 'Needs attention') return 'bar bar-lg bar-need';
    return 'bar bar-lg';
  }

  var CLASS_NOTES = {
    'Ready': 'Ready band: 75 to 100 points.',
    'Developing': 'Developing band: 50 to 74.99 points.',
    'Needs Improvement': 'Needs Improvement band: below 50 points.'
  };

  // Label, how to show the value, and the short description (from the Executive Dashboard sheet).
  var INDICATOR_DISPLAY = {
    liquidity:     { label: 'Current ratio',                  interp: 'Liquidity',                      fmt: fmtRatio },
    profitability: { label: 'Operating profit margin',        interp: 'Profitability',                  fmt: fmtPercent },
    leverage:      { label: 'Debt / assets',                  interp: 'Leverage',                       fmt: fmtPercent },
    cashFlow:      { label: 'Cash-flow coverage',             interp: 'Inflow / outflow',               fmt: fmtTimes },
    cashReserve:   { label: 'Cash reserve',                   interp: 'Months',                         fmt: fmtMonths },
    debtService:   { label: 'Debt-service coverage proxy',    interp: 'Cash available / debt payment',  fmt: fmtTimes },
    records:       { label: 'Recordkeeping practices',        interp: 'Share completed',                fmt: fmtPercent },
    planning:      { label: 'Financial planning practices',   interp: 'Share completed',                fmt: fmtPercent }
  };

  /* ---------- draw ---------- */
  function renderSummary(r) {
    var ring = byId('ring');
    var ringColor = r.classification === 'Ready' ? 'var(--green)'
                  : r.classification === 'Developing' ? 'var(--amber)' : 'var(--red)';
    ring.style.setProperty('--pct', String(Math.max(0, Math.min(100, r.total))));
    ring.style.setProperty('--ring-color', ringColor);
    ring.setAttribute('aria-label', 'Score ' + r.total.toFixed(2) + ' out of 100');
    byId('score-num').textContent = r.total.toFixed(2);

    var badge = byId('class-badge');
    badge.textContent = r.classification;
    badge.className = 'badge ' + (r.classification === 'Ready' ? 'badge-ready'
                       : r.classification === 'Developing' ? 'badge-dev' : 'badge-need');
    byId('class-note').textContent = CLASS_NOTES[r.classification];

    if (r.topPriority) {
      byId('top-priority').textContent = r.topPriority;
      byId('top-priority-note').textContent = 'First area rated High priority.';
    } else {
      byId('top-priority').textContent = 'None';
      byId('top-priority-note').textContent = 'No area is rated High priority.';
    }
  }

  function renderDimensions(r) {
    var list = byId('dim-list');
    r.dimensions.forEach(function (d) {
      var bar = el('div', { 'class': barClass(d.status), role: 'img',
        'aria-label': d.name + ': ' + (d.share * 100).toFixed(0) + ' percent of maximum' }, [
        el('span', { style: 'width:' + (d.share * 100).toFixed(1) + '%' })
      ]);
      list.appendChild(el('li', {}, [
        el('div', { 'class': 'dim-head' }, [
          el('span', { 'class': 'dim-name', text: d.name }),
          el('span', { 'class': 'dim-meta' }, [
            el('span', { 'class': 'dim-score', text: d.points.toFixed(1) + ' / ' + d.max }),
            el('span', { 'class': chipClass(d.status), text: d.status })
          ])
        ]),
        bar
      ]));
    });
  }

  function renderIndicators(r) {
    var grid = byId('indicator-grid');
    var hasNA = false;
    r.ratings.forEach(function (x) {
      var d = INDICATOR_DISPLAY[x.key];
      if (x.status === 'Not available') hasNA = true;
      grid.appendChild(el('article', { 'class': 'ind-card' }, [
        el('span', { 'class': 'ind-label', text: d.label }),
        el('p', { 'class': 'ind-value', text: d.fmt(x.value) }),
        el('p', { 'class': 'ind-interp', text: d.interp }),
        el('div', { 'class': 'ind-foot' }, [
          el('span', { 'class': chipClass(x.status), text: x.status }),
          el('span', { text: 'Priority: ' + x.priority })
        ])
      ]));
    });
    byId('na-note').hidden = !hasNA;
  }

  /* ---------- recommendations ---------- */
  function valueLine(x) {
    var d = INDICATOR_DISPLAY[x.key];
    return d.label + ': ' + d.fmt(x.value);
  }

  function detail(term, text) {
    return [el('dt', { text: term }), el('dd', { text: text })];
  }

  function recCard(x) {
    var rec = SME_RECS.get(x.key, x.priority);
    var list = el('dl', {});
    detail('Recommended action', rec.action).forEach(function (n) { list.appendChild(n); });
    detail('Next step', rec.next).forEach(function (n) { list.appendChild(n); });
    detail('Why it matters', rec.why).forEach(function (n) { list.appendChild(n); });
    return el('article', { 'class': 'rec-card' }, [
      el('h4', { text: x.area }),
      el('p', { 'class': 'rec-evidence', text: 'Your ' + valueLine(x) + '. Rule: ' + rec.trigger + '.' }),
      list
    ]);
  }

  function recLowItem(x) {
    var rec = SME_RECS.get(x.key, 'Low');
    return el('div', { 'class': 'rec-low-item' }, [
      el('p', { 'class': 'rec-low-head' }, [
        el('strong', { text: x.area }),
        el('span', { text: valueLine(x) })
      ]),
      el('p', { 'class': 'rec-low-action', text: rec.action }),
      el('p', { 'class': 'small-note', text: rec.why })
    ]);
  }

  function recNaItem(x) {
    return el('div', { 'class': 'rec-low-item' }, [
      el('p', { 'class': 'rec-low-head' }, [el('strong', { text: x.area })]),
      el('p', { 'class': 'rec-low-action', text: 'This could not be calculated because a denominator was zero. Check the inputs behind it and run the assessment again.' })
    ]);
  }

  function renderRecommendations(r) {
    var box = byId('rec-groups');
    var groups = [
      { priority: 'High',   title: 'High priority',          cls: 'rec-high',   build: recCard },
      { priority: 'Medium', title: 'Medium priority',        cls: 'rec-medium', build: recCard },
      { priority: 'Low',    title: 'On track (low priority)', cls: 'rec-low',   build: recLowItem },
      { priority: 'n/a',    title: 'Could not be assessed',  cls: 'rec-na',     build: recNaItem }
    ];
    groups.forEach(function (g) {
      var items = r.ratings.filter(function (x) { return x.priority === g.priority; });
      if (!items.length) return;
      var wrap = el('div', { 'class': 'rec-items' });
      items.forEach(function (x) { wrap.appendChild(g.build(x)); });
      box.appendChild(el('div', { 'class': 'rec-group ' + g.cls }, [
        el('h3', { text: g.title + ' (' + items.length + ')' }),
        wrap
      ]));
    });
  }

  /* ---------- start ---------- */
  var data = loadSaved();
  if (!data) {
    byId('no-data').hidden = false;
    return;
  }

  var result = SME_ENGINE.calculate(data);
  renderSummary(result);
  renderDimensions(result);
  renderIndicators(result);
  renderRecommendations(result);
  byId('dashboard').hidden = false;

  byId('btn-print').addEventListener('click', function () {
    byId('print-date').textContent = 'Report generated on ' + new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) + ' from the SME Finance Readiness & Improvement Simulator (educational prototype).';
    window.print();
  });

  byId('btn-restart').addEventListener('click', function () {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
    window.location.href = 'assessment.html';
  });
})();
