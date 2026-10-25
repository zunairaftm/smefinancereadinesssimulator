/* =========================================================
   whatif.js - the What-If improvement simulator page.
   No new formulas: it runs the same SME_ENGINE.calculate() used on the
   results page, once on the saved answers (current) and once on the
   edited copy (scenario). The Excel counterpart is the "What-If V2" sheet.
   ========================================================= */
(function () {
  'use strict';

  var STORAGE_KEY = 'smeAssessment';

  // "Direction" column of the What-If V2 sheet in the Excel file.
  var DIRECTION = {
    revenue: 'higher', operatingExpenses: 'lower', totalAssets: 'higher', currentAssets: 'higher',
    currentLiabilities: 'lower', totalDebt: 'lower', monthlyInflow: 'higher', monthlyOutflow: 'lower',
    monthlyDebtPayment: 'lower', cashReserveMonths: 'higher', monitoringFrequency: 'more frequent'
  };

  function byId(id) { return document.getElementById(id); }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') node.textContent = attrs[k];
      else node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { node.appendChild(c); });
    return node;
  }

  function loadSaved() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  var base = loadSaved();
  if (!base) { byId('wi-empty').hidden = false; return; }
  byId('wi').hidden = false;

  /* ---------- number formatting (same style as the results page) ---------- */
  function fmtPercent(v) { return v === null ? 'n/a' : (v * 100).toFixed(1) + '%'; }
  function fmtTimes(v)   { return v === null ? 'n/a' : v.toFixed(2) + 'x'; }
  function fmtRatio(v)   { return v === null ? 'n/a' : v.toFixed(2); }
  function fmtMonths(v)  { return v.toFixed(1) + ' months'; }
  function fmtPKR(v)     { return 'PKR ' + Math.round(v).toLocaleString('en-US'); }
  function fmtDelta(d, digits) {
    var r = Number(Math.abs(d).toFixed(digits));
    if (r === 0) return (0).toFixed(digits);
    return (d > 0 ? '+' : '\u2212') + r.toFixed(digits);
  }
  function deltaClass(d, digits) {
    var r = Number(Math.abs(d).toFixed(digits));
    return r === 0 ? 'wi-same' : (d > 0 ? 'wi-up' : 'wi-down');
  }

  var INDICATORS = {
    liquidity:     { label: 'Current ratio',                fmt: fmtRatio },
    profitability: { label: 'Operating profit margin',      fmt: fmtPercent },
    leverage:      { label: 'Debt / assets',                fmt: fmtPercent },
    cashFlow:      { label: 'Cash-flow coverage',           fmt: fmtTimes },
    cashReserve:   { label: 'Cash reserve',                 fmt: fmtMonths },
    debtService:   { label: 'Debt-service coverage proxy',  fmt: fmtTimes },
    records:       { label: 'Recordkeeping practices',      fmt: fmtPercent },
    planning:      { label: 'Financial planning practices', fmt: fmtPercent }
  };

  function chipClass(status) {
    if (status === 'Strong') return 'chip chip-strong';
    if (status === 'Moderate' || status === 'Developing') return 'chip chip-moderate';
    if (status === 'Needs attention') return 'chip chip-need';
    return 'chip chip-na';
  }
  function badgeClass(c) {
    return 'badge ' + (c === 'Ready' ? 'badge-ready' : c === 'Developing' ? 'badge-dev' : 'badge-need');
  }

  /* ---------- build the scenario inputs from the same field list as the form ---------- */
  var form = byId('wi-form');
  var toolbar = byId('wi-toolbar');
  var fields = [];
  var refs = {};

  function currentText(f) {
    var v = base[f.key];
    if (f.type === 'number') {
      if (f.unit === 'PKR') return fmtPKR(Number(v));
      if (f.unit === 'Months') return Number(v) + ' months';
      return String(v);
    }
    return String(v);
  }

  function buildRow(f) {
    var id = 'wi-' + f.key;
    var control;
    if (f.type === 'number') {
      control = el('input', { id: id, type: 'number', min: '0', step: f.step || 'any', inputmode: 'decimal',
                              value: String(base[f.key]), 'aria-describedby': id + '-msg' });
    } else {
      var opts = f.type === 'yesno' ? ['Yes', 'No'] : f.options;
      control = el('select', { id: id, 'aria-describedby': id + '-msg' }, opts.map(function (o) {
        var op = el('option', { value: o, text: o });
        if (o === base[f.key]) op.selected = true;
        return op;
      }));
    }
    var hint = DIRECTION[f.key] ? ' \u00b7 Usually better when ' + DIRECTION[f.key] : '';
    var err = el('span', { 'class': 'wi-err' });
    var row = el('div', { 'class': 'wi-row' }, [
      el('label', { 'for': id, text: f.label + (f.unit ? ' (' + f.unit + ')' : '') }),
      control,
      el('p', { 'class': 'wi-meta', id: id + '-msg' }, [
        el('span', { text: 'Current: ' + currentText(f) + hint }), err
      ])
    ]);
    refs[f.key] = { f: f, row: row, control: control, err: err };
    return row;
  }

  SME_SECTIONS.forEach(function (sec) {
    var rows = [];
    sec.fields.forEach(function (f) {
      if (!(DIRECTION[f.key] || f.type === 'yesno')) return;   // context-only fields are not scored
      if (f.type === 'number') base[f.key] = Number(base[f.key]);
      fields.push(f);
      rows.push(buildRow(f));
    });
    if (rows.length) {
      var group = el('fieldset', { 'class': 'wi-group' },
        [el('legend', { text: sec.title.replace(/^\d+\.\s*/, '') })].concat(rows));
      form.insertBefore(group, toolbar);
    }
  });

  /* ---------- read the scenario, run the engine, show both ---------- */
  function readScenario() {
    var scen = {};
    Object.keys(base).forEach(function (k) { scen[k] = base[k]; });
    var invalid = 0, changed = 0;
    fields.forEach(function (f) {
      var r = refs[f.key], v;
      r.err.textContent = '';
      if (f.type === 'number') {
        var raw = r.control.value.trim(), n = Number(raw);
        if (raw === '' || isNaN(n) || n < 0) {
          r.err.textContent = ' Enter 0 or more (current value used).';
          invalid++;
          v = base[f.key];
        } else { v = n; }
      } else { v = r.control.value; }
      scen[f.key] = v;
      var diff = (v !== base[f.key]);
      r.row.classList.toggle('wi-changed', diff);
      if (diff) changed++;
    });
    return { scen: scen, invalid: invalid, changed: changed };
  }

  function scoreBlock(label, value, cls, extra) {
    return el('div', { 'class': 'wi-score' }, [
      el('span', { 'class': 'mini-label', text: label }),
      el('p', { 'class': 'wi-score-num ' + (cls || ''), text: value }),
      extra || el('span', {})
    ]);
  }

  function renderSummary(b, s, info) {
    var d = s.total - b.total;
    var note = info.changed === 0
      ? 'No changes yet. Edit a value below to test a scenario.'
      : info.changed + (info.changed === 1 ? ' input changed.' : ' inputs changed.');
    if (info.invalid) note += ' ' + info.invalid + (info.invalid === 1 ? ' field needs' : ' fields need') + ' a valid number.';
    var box = byId('wi-summary');
    box.textContent = '';
    box.appendChild(scoreBlock('Current score', b.total.toFixed(2), '', el('span', { 'class': badgeClass(b.classification) + ' wi-badge', text: b.classification })));
    box.appendChild(scoreBlock('Scenario score', s.total.toFixed(2), '', el('span', { 'class': badgeClass(s.classification) + ' wi-badge', text: s.classification })));
    box.appendChild(scoreBlock('Change', fmtDelta(d, 2), deltaClass(d, 2), el('span', { 'class': 'small-note', text: 'points' })));
    box.appendChild(el('p', { 'class': 'wi-note', text: note }));
  }

  function renderDimensions(b, s) {
    var ul = byId('wi-dims');
    ul.textContent = '';
    b.dimensions.forEach(function (bd, i) {
      var sd = s.dimensions[i], d = sd.points - bd.points;
      ul.appendChild(el('li', {}, [
        el('span', { 'class': 'wi-name', text: bd.name }),
        el('span', { 'class': 'wi-vals', text: bd.points.toFixed(1) + ' \u2192 ' + sd.points.toFixed(1) + ' / ' + bd.max }),
        el('span', { 'class': 'wi-delta ' + deltaClass(d, 1), text: fmtDelta(d, 1) })
      ]));
    });
  }

  function renderIndicators(b, s) {
    var ul = byId('wi-inds');
    var hasNA = false;
    ul.textContent = '';
    b.ratings.forEach(function (bx, i) {
      var sx = s.ratings[i], d = INDICATORS[bx.key];
      if (sx.status === 'Not available' || bx.status === 'Not available') hasNA = true;
      var status = [el('span', { 'class': chipClass(sx.status), text: sx.status })];
      if (sx.status !== bx.status) status.push(el('span', { 'class': 'wi-was', text: 'was ' + bx.status }));
      ul.appendChild(el('li', {}, [
        el('span', { 'class': 'wi-name', text: d.label }),
        el('span', { 'class': 'wi-vals', text: d.fmt(bx.value) + ' \u2192 ' + d.fmt(sx.value) }),
        el('span', { 'class': 'wi-status' }, status)
      ]));
    });
    byId('wi-na').hidden = !hasNA;
  }

  function update() {
    var info = readScenario();
    var b = SME_ENGINE.calculate(base);
    var s = SME_ENGINE.calculate(info.scen);
    renderSummary(b, s, info);
    renderDimensions(b, s);
    renderIndicators(b, s);
  }

  form.addEventListener('input', update);
  form.addEventListener('change', update);
  form.addEventListener('submit', function (e) { e.preventDefault(); });

  byId('wi-reset').addEventListener('click', function () {
    fields.forEach(function (f) { refs[f.key].control.value = String(base[f.key]); });
    update();
  });

  // The site header is sticky and its height changes on small screens, so keep the
  // score summary directly below it instead of using a fixed offset.
  function placeSummary() {
    var header = document.querySelector('.site-header');
    byId('wi-summary').style.top = ((header ? header.offsetHeight : 0) + 8) + 'px';
  }
  window.addEventListener('resize', placeSummary);
  placeSummary();

  update();
})();
