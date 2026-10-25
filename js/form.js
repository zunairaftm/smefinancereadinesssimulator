/* =========================================================
   form.js - builds the assessment form, validates it, and
   saves the answers for the results page (Phase 3 onwards).
   Answers are kept in this browser tab only (sessionStorage).
   ========================================================= */

(function () {
  'use strict';

  var STORAGE_KEY = 'smeAssessment';

  var form = document.getElementById('assessment-form');
  var sectionsBox = document.getElementById('form-sections');
  var errorSummary = document.getElementById('error-summary');

  var allFields = [];
  SME_SECTIONS.forEach(function (s) { s.fields.forEach(function (f) { allFields.push(f); }); });

  /* ---------- tiny helper to build elements ---------- */
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') node.textContent = attrs[k];
      else if (k === 'hidden') node.hidden = !!attrs[k];
      else node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { node.appendChild(c); });
    return node;
  }

  function errorNode(key) {
    return el('p', { 'class': 'error', id: key + '-error', hidden: true });
  }

  function labelWithTag(field, forId) {
    var label = el('label', { 'for': forId, text: field.label });
    if (!field.required) label.appendChild(el('span', { 'class': 'tag', text: 'context only' }));
    return label;
  }

  /* ---------- field builders ---------- */
  function buildNumber(f) {
    var attrs = {
      id: f.key, name: f.key, type: 'number', inputmode: 'decimal',
      min: '0', step: f.step || 'any', 'aria-describedby': f.key + '-error'
    };
    var wrap = el('div', { 'class': 'input-wrap' }, [
      el('span', { 'class': 'unit', text: f.unit }),
      el('input', attrs)
    ]);
    return el('div', { 'class': 'field', 'data-key': f.key }, [labelWithTag(f, f.key), wrap, errorNode(f.key)]);
  }

  function buildSelect(f) {
    var select = el('select', { id: f.key, name: f.key, 'aria-describedby': f.key + '-error' });
    select.appendChild(el('option', { value: '', text: 'Select...' }));
    f.options.forEach(function (o) { select.appendChild(el('option', { value: o, text: o })); });
    return el('div', { 'class': 'field', 'data-key': f.key }, [
      labelWithTag(f, f.key),
      el('div', { 'class': 'input-wrap' }, [select]),
      errorNode(f.key)
    ]);
  }

  function buildYesNo(f) {
    var pills = el('div', { 'class': 'pills' });
    ['Yes', 'No'].forEach(function (v) {
      var id = f.key + '-' + v.toLowerCase();
      pills.appendChild(el('input', { type: 'radio', id: id, name: f.key, value: v }));
      pills.appendChild(el('label', { 'for': id, text: v }));
    });
    return el('div', { 'class': 'field yn', 'data-key': f.key, role: 'radiogroup', 'aria-labelledby': f.key + '-label' }, [
      el('span', { 'class': 'yn-label', id: f.key + '-label', text: f.label }),
      pills,
      errorNode(f.key)
    ]);
  }

  function buildField(f) {
    if (f.type === 'select') return buildSelect(f);
    if (f.type === 'yesno') return buildYesNo(f);
    return buildNumber(f);
  }

  /* ---------- render the whole form ---------- */
  function render() {
    SME_SECTIONS.forEach(function (s) {
      var grid = el('div', { 'class': s.fields[0].type === 'yesno' ? 'yn-list' : 'field-grid' });
      s.fields.forEach(function (f) { grid.appendChild(buildField(f)); });
      sectionsBox.appendChild(el('section', { 'class': 'form-section', 'aria-labelledby': s.id + '-title' }, [
        el('h2', { id: s.id + '-title', text: s.title }),
        el('p', { 'class': 'section-intro', text: s.intro }),
        grid
      ]));
    });
  }

  /* ---------- read and write values ---------- */
  function getValue(f) {
    if (f.type === 'yesno') {
      var checked = form.querySelector('input[name="' + f.key + '"]:checked');
      return checked ? checked.value : '';
    }
    var input = document.getElementById(f.key);
    if (f.type === 'select') return input.value;
    return input.value === '' ? null : Number(input.value);
  }

  function setValue(f, v) {
    if (v === undefined || v === null) return;
    if (f.type === 'yesno') {
      var radio = document.getElementById(f.key + '-' + String(v).toLowerCase());
      if (radio) radio.checked = true;
    } else {
      document.getElementById(f.key).value = v;
    }
  }

  function fillForm(data) {
    allFields.forEach(function (f) { setValue(f, data[f.key]); });
  }

  /* ---------- validation ---------- */
  function validateField(f) {
    var value = getValue(f);
    var isEmpty = (value === null || value === '');

    if (f.type === 'number') {
      var input = document.getElementById(f.key);
      if (input.validity.badInput) return 'Enter a valid number.';
      if (isEmpty) return f.required ? 'This field is required.' : '';
      if (value < 0) return 'Enter 0 or more.';
      return '';
    }
    if (isEmpty) return f.required ? (f.type === 'yesno' ? 'Choose Yes or No.' : 'Choose an option.') : '';
    return '';
  }

  function showError(f, message) {
    var box = document.getElementById(f.key + '-error');
    var wrapper = form.querySelector('[data-key="' + f.key + '"]');
    box.textContent = message;
    box.hidden = !message;
    wrapper.classList.toggle('has-error', !!message);
    var input = document.getElementById(f.key);
    if (input) input.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  function validateAll() {
    var problems = [];
    allFields.forEach(function (f) {
      var msg = validateField(f);
      showError(f, msg);
      if (msg) problems.push({ field: f, message: msg });
    });
    return problems;
  }

  function showSummary(problems) {
    errorSummary.innerHTML = '';
    if (!problems.length) { errorSummary.hidden = true; return; }
    errorSummary.appendChild(el('h2', { text: 'Please fix ' + problems.length + (problems.length === 1 ? ' item' : ' items') + ' before continuing' }));
    var list = el('ul');
    problems.forEach(function (p) {
      var targetId = p.field.type === 'yesno' ? p.field.key + '-yes' : p.field.key;
      var link = el('a', { href: '#' + targetId, text: p.field.label + ': ' + p.message });
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var t = document.getElementById(targetId);
        if (t) t.focus();
      });
      list.appendChild(el('li', {}, [link]));
    });
    errorSummary.appendChild(list);
    errorSummary.hidden = false;
  }

  /* ---------- collect, save, show ---------- */
  function collect() {
    var data = {};
    allFields.forEach(function (f) { data[f.key] = getValue(f); });
    return data;
  }

  function saveData(data) {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { /* storage blocked: ignore */ }
  }

  function loadSaved() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  /* ---------- events ---------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var problems = validateAll();
    showSummary(problems);
    if (problems.length) {
      errorSummary.scrollIntoView({ behavior: 'smooth', block: 'start' });
      errorSummary.focus();
      return;
    }
    var data = collect();
    saveData(data);
    window.location.href = 'results.html';
  });

  // Clear a field's error as soon as the person fixes it.
  form.addEventListener('input', function (e) {
    var wrapper = e.target.closest('.field');
    if (!wrapper) return;
    var f = allFields.filter(function (x) { return x.key === wrapper.getAttribute('data-key'); })[0];
    if (f && wrapper.classList.contains('has-error') && !validateField(f)) showError(f, '');
  });

  document.getElementById('btn-demo').addEventListener('click', function () {
    fillForm(SME_DEMO_DATA);
    showSummary(validateAll());
  });

  document.getElementById('btn-clear').addEventListener('click', function () {
    form.reset();
    allFields.forEach(function (f) { showError(f, ''); });
    showSummary([]);
    try { sessionStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
  });

  /* ---------- start ---------- */
  render();
  var saved = loadSaved();
  if (saved) fillForm(saved);
})();
