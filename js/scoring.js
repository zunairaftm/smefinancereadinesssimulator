/* =========================================================
   scoring.js - the scoring engine.
   A direct port of the "Calculations" and "Scoring" sheets of
   SME_Finance_Readiness_Simulator.xlsx. Nothing here is new:
   every formula, cap and threshold is copied from Excel.

   Excel rule kept on purpose: IFERROR(a/b, "") means a ratio with a
   zero denominator is blank, and a blank score component adds 0 points.
   Here a blank ratio is null and also adds 0 points.
   ========================================================= */

var SME_ENGINE = (function () {
  'use strict';

  // Calculations!C12 divides "Yes" answers by 7; Calculations!C13 by 6.
  var RECORD_KEYS = ['recFormalRecords', 'recStatements', 'recBankAccount', 'recSeparation',
                     'recUpdated', 'recSoftware', 'recTwoYears'];
  var PLANNING_KEYS = ['planBudget', 'planRevenueForecast', 'planExpenseForecast',
                       'planVariance', 'planTargets', 'planEmergency'];

  function num(v) {
    var n = Number(v);
    return (v === null || v === undefined || v === '' || isNaN(n)) ? 0 : n;
  }

  // Excel IFERROR(n/d, ""): zero denominator gives "no value" (null).
  function ratio(n, d) { return d === 0 ? null : n / d; }

  // Excel MIN(max, MAX(0, x))
  function clamp(x, max) { return Math.min(max, Math.max(0, x)); }

  function countYes(inputs, keys) {
    return keys.filter(function (k) { return inputs[k] === 'Yes'; }).length;
  }

  // Scoring!E16
  function classify(score) {
    if (score >= 75) return 'Ready';
    if (score >= 50) return 'Developing';
    return 'Needs Improvement';
  }

  // Diagnostics!E20:E24 (share of the dimension maximum)
  function dimensionStatus(share) {
    if (share >= 0.75) return 'Strong';
    if (share >= 0.5) return 'Developing';
    return 'Needs attention';
  }

  // ----- Recommendations sheet, rows 35-42: status and priority for each area -----
  // Excel quirk NOT copied: when a ratio is blank (zero denominator), Excel's
  // comparison treats it as "Strong". Here it is reported as "Not available".
  function rateHigherBetter(value, needsBelow, moderateBelow) {
    if (value === null) return 'Not available';
    if (value < needsBelow) return 'Needs attention';
    if (value < moderateBelow) return 'Moderate';
    return 'Strong';
  }

  function rateLowerBetter(value, needsAbove, moderateAbove) {
    if (value === null) return 'Not available';
    if (value > needsAbove) return 'Needs attention';
    if (value > moderateAbove) return 'Moderate';
    return 'Strong';
  }

  function priorityFor(status) {
    if (status === 'Needs attention') return 'High';
    if (status === 'Moderate') return 'Medium';
    if (status === 'Strong') return 'Low';
    return 'n/a';
  }

  function rating(key, area, value, status) {
    return { key: key, area: area, value: value, status: status, priority: priorityFor(status) };
  }

  function calculate(inputs) {
    var i = inputs || {};

    // ----- Calculations sheet -----
    var revenue = num(i.revenue);
    var operatingProfit = revenue - num(i.operatingExpenses);            // C4
    var currentRatio = ratio(num(i.currentAssets), num(i.currentLiabilities));   // C5
    var operatingMargin = ratio(operatingProfit, revenue);                // C6
    var debtToAssets = ratio(num(i.totalDebt), num(i.totalAssets));       // C7
    var netCashFlow = num(i.monthlyInflow) - num(i.monthlyOutflow);       // C8
    var cashFlowCoverage = ratio(num(i.monthlyInflow), num(i.monthlyOutflow));   // C9
    var cashReserve = num(i.cashReserveMonths);                           // C10
    var dscrProxy = ratio(netCashFlow, num(i.monthlyDebtPayment));        // C11
    var recordkeeping = countYes(i, RECORD_KEYS) / 7;                     // C12
    var planning = countYes(i, PLANNING_KEYS) / 6;                        // C13

    // ----- Scoring sheet (E4:E12) -----
    var monitoring = 0;
    if (i.monitoringFrequency === 'Monthly') monitoring = 5;
    else if (i.monitoringFrequency === 'Quarterly') monitoring = 3;
    else if (i.monitoringFrequency) monitoring = 1;                       // "Less often"

    var components = [
      { key: 'liquidity',        dimension: 'Financial Health',               name: 'Liquidity',            max: 8,
        points: currentRatio === null ? 0 : clamp(currentRatio / 2 * 8, 8) },
      { key: 'profitability',    dimension: 'Financial Health',               name: 'Profitability',        max: 9,
        points: operatingMargin === null ? 0 : clamp(operatingMargin / 0.2 * 9, 9) },
      { key: 'leverage',         dimension: 'Financial Health',               name: 'Leverage',             max: 8,
        points: debtToAssets === null ? 0 : clamp((1 - debtToAssets) / 0.8 * 8, 8) },
      { key: 'cashFlowCoverage', dimension: 'Cash-Flow Management',           name: 'Cash-flow coverage',   max: 10,
        points: cashFlowCoverage === null ? 0 : clamp(cashFlowCoverage / 1.5 * 10, 10) },
      { key: 'cashReserve',      dimension: 'Cash-Flow Management',           name: 'Cash reserve',         max: 5,
        points: clamp(cashReserve / 3 * 5, 5) },
      { key: 'monitoring',       dimension: 'Cash-Flow Management',           name: 'Monitoring frequency', max: 5,
        points: monitoring },
      { key: 'recordkeeping',    dimension: 'Financial Records & Transparency', name: 'Recordkeeping',      max: 20,
        points: recordkeeping * 20 },
      { key: 'debtService',      dimension: 'Debt & Repayment Capacity',      name: 'Debt-service capacity', max: 20,
        points: dscrProxy === null ? 0 : clamp(dscrProxy / 2 * 20, 20) },
      { key: 'planning',         dimension: 'Financial Planning',             name: 'Planning practices',   max: 15,
        points: planning * 15 }
    ];

    // ----- Dimension totals (weights 25 / 20 / 20 / 20 / 15) -----
    var dimensionDefs = [
      { name: 'Financial Health',                 max: 25 },
      { name: 'Cash-Flow Management',             max: 20 },
      { name: 'Financial Records & Transparency', max: 20 },
      { name: 'Debt & Repayment Capacity',        max: 20 },
      { name: 'Financial Planning',               max: 15 }
    ];
    var dimensions = dimensionDefs.map(function (d) {
      var points = components
        .filter(function (c) { return c.dimension === d.name; })
        .reduce(function (sum, c) { return sum + c.points; }, 0);
      var share = points / d.max;
      return { name: d.name, max: d.max, points: points, share: share, status: dimensionStatus(share) };
    });

    var total = components.reduce(function (sum, c) { return sum + c.points; }, 0);   // Scoring!E15

    // Thresholds from Recommendations!C35:C42 (same order as the Excel table).
    var ratings = [
      rating('liquidity',     'Liquidity',     currentRatio,     rateHigherBetter(currentRatio, 1, 1.5)),
      rating('profitability', 'Profitability', operatingMargin,  rateHigherBetter(operatingMargin, 0.08, 0.15)),
      rating('leverage',      'Leverage',      debtToAssets,     rateLowerBetter(debtToAssets, 0.5, 0.3)),
      rating('cashFlow',      'Cash Flow',     cashFlowCoverage, rateHigherBetter(cashFlowCoverage, 1, 1.25)),
      rating('cashReserve',   'Cash Reserve',  cashReserve,      rateHigherBetter(cashReserve, 1.5, 3)),
      rating('debtService',   'Debt Service',  dscrProxy,        rateHigherBetter(dscrProxy, 1, 1.5)),
      rating('records',       'Records',       recordkeeping,    rateHigherBetter(recordkeeping, 0.6, 0.85)),
      rating('planning',      'Planning',      planning,         rateHigherBetter(planning, 0.6, 0.85))
    ];

    // Top priority = first area rated High, or null. This is the intended behaviour of
    // Executive Dashboard!F7 (the Excel formula looks at the static rule table instead).
    var topPriority = null;
    for (var n = 0; n < ratings.length; n++) {
      if (ratings[n].priority === 'High') { topPriority = ratings[n].area; break; }
    }

    return {
      total: total,
      classification: classify(total),
      ratings: ratings,
      topPriority: topPriority,
      indicators: {
        operatingProfit: operatingProfit,
        currentRatio: currentRatio,
        operatingMargin: operatingMargin,
        debtToAssets: debtToAssets,
        netCashFlow: netCashFlow,
        cashFlowCoverage: cashFlowCoverage,
        cashReserve: cashReserve,
        dscrProxy: dscrProxy,
        recordkeeping: recordkeeping,
        planning: planning
      },
      components: components,
      dimensions: dimensions
    };
  }

  return { calculate: calculate, classify: classify, dimensionStatus: dimensionStatus };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = SME_ENGINE;
