/* =========================================================
   recommendations.test.js - checks that every area and priority
   has its text, and that the wording matches your Excel file.
   ========================================================= */

function runRecommendationTests(recs) {
  var results = [];

  function check(name, actual, expected) {
    results.push({ name: name, pass: actual === expected, actual: actual, expected: expected });
  }
  function filled(s) { return typeof s === 'string' && s.length > 0; }

  // Every area has full text for High and Medium, and an action + reason for Low.
  recs.keys.forEach(function (key) {
    ['High', 'Medium'].forEach(function (p) {
      var r = recs.get(key, p);
      check('Text complete: ' + key + ' / ' + p,
        !!r && filled(r.trigger) && filled(r.action) && filled(r.next) && filled(r.why), true);
    });
    var low = recs.get(key, 'Low');
    check('Text complete: ' + key + ' / Low', !!low && filled(low.action) && filled(low.why), true);
  });
  check('Eight areas covered', recs.keys.length, 8);

  // Wording of the demo case, copied from Excel (Recommendations live table rows 248-255).
  check('Excel wording: Leverage / Medium', recs.get('leverage', 'Medium').action, 'Monitor leverage before taking additional debt.');
  check('Excel wording: Cash Reserve / Medium', recs.get('cashReserve', 'Medium').action, 'Work toward a stronger reserve.');
  check('Excel wording: Planning / Medium', recs.get('planning', 'Medium').action, 'Make planning and variance review more consistent.');
  check('Excel wording: Liquidity / Low', recs.get('liquidity', 'Low').action, 'Maintain liquidity discipline.');
  check('Excel wording: Profitability / Low', recs.get('profitability', 'Low').action, 'Protect operating margins while scaling.');
  check('Excel wording: Cash Flow / Low', recs.get('cashFlow', 'Low').action, 'Maintain regular cash-flow monitoring.');
  check('Excel wording: Debt Service / Low', recs.get('debtService', 'Low').action, 'Maintain debt-service discipline.');
  check('Excel wording: Records / Low', recs.get('records', 'Low').action, 'Maintain organized records.');

  // Unknown inputs give null instead of an error.
  check('No text for "n/a" priority', recs.get('liquidity', 'n/a'), null);
  check('No text for unknown area', recs.get('nonsense', 'High'), null);

  return results;
}

if (typeof module !== 'undefined' && module.exports) module.exports = runRecommendationTests;
