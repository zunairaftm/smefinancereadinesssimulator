/* =========================================================
   scoring.test.js - checks the engine against your Excel file.
   "Expected" numbers for the demo case are the values stored in
   SME_Finance_Readiness_Simulator.xlsx. The other cases were worked
   out by hand from the Excel formulas (shown in each comment).
   ========================================================= */

function runScoringTests(engine) {
  var results = [];
  var TOL = 1e-9;

  function check(name, actual, expected) {
    var pass = (typeof expected === 'number')
      ? (typeof actual === 'number' && Math.abs(actual - expected) < TOL)
      : actual === expected;
    results.push({ name: name, pass: pass, actual: actual, expected: expected });
  }

  function find(list, key, value) {
    return list.filter(function (x) { return x[key] === value; })[0];
  }

  // Inputs sheet of your Excel file (illustrative demo values).
  var demo = {
    revenue: 12000000, operatingExpenses: 9000000, totalAssets: 8000000,
    currentAssets: 3000000, currentLiabilities: 2000000, totalDebt: 2500000,
    monthlyInflow: 1000000, monthlyOutflow: 750000, monthlyDebtPayment: 67000,
    cashReserveMonths: 2, monitoringFrequency: 'Monthly',
    recFormalRecords: 'Yes', recStatements: 'Yes', recBankAccount: 'Yes', recSeparation: 'Yes',
    recUpdated: 'Yes', recSoftware: 'No', recTwoYears: 'Yes',
    planBudget: 'Yes', planRevenueForecast: 'Yes', planExpenseForecast: 'Yes',
    planVariance: 'No', planTargets: 'Yes', planEmergency: 'No'
  };
  function withChanges(base, changes) {
    var copy = {};
    Object.keys(base).forEach(function (k) { copy[k] = base[k]; });
    Object.keys(changes).forEach(function (k) { copy[k] = changes[k]; });
    return copy;
  }

  // ---- 1. Demo case vs Excel stored values ----
  var r = engine.calculate(demo);
  check('Demo: total score', r.total, 86.2400793650794);
  check('Demo: classification', r.classification, 'Ready');
  check('Demo: Financial Health', find(r.dimensions, 'name', 'Financial Health').points, 21.875);
  check('Demo: Cash-Flow Management', find(r.dimensions, 'name', 'Cash-Flow Management').points, 17.2222222222222);
  check('Demo: Records & Transparency', find(r.dimensions, 'name', 'Financial Records & Transparency').points, 17.1428571428571);
  check('Demo: Debt & Repayment Capacity', find(r.dimensions, 'name', 'Debt & Repayment Capacity').points, 20);
  check('Demo: Financial Planning', find(r.dimensions, 'name', 'Financial Planning').points, 10);
  check('Demo: liquidity points', find(r.components, 'key', 'liquidity').points, 6);
  check('Demo: profitability points', find(r.components, 'key', 'profitability').points, 9);
  check('Demo: leverage points', find(r.components, 'key', 'leverage').points, 6.875);
  check('Demo: cash-flow coverage points', find(r.components, 'key', 'cashFlowCoverage').points, 8.88888888888889);
  check('Demo: cash reserve points', find(r.components, 'key', 'cashReserve').points, 3.33333333333333);
  check('Demo: monitoring points', find(r.components, 'key', 'monitoring').points, 5);
  check('Demo: current ratio', r.indicators.currentRatio, 1.5);
  check('Demo: operating margin', r.indicators.operatingMargin, 0.25);
  check('Demo: debt / assets', r.indicators.debtToAssets, 0.3125);
  check('Demo: cash-flow coverage', r.indicators.cashFlowCoverage, 1.33333333333333);
  check('Demo: debt-service proxy', r.indicators.dscrProxy, 3.73134328358209);
  check('Demo: recordkeeping share', r.indicators.recordkeeping, 0.857142857142857);
  check('Demo: planning share', r.indicators.planning, 0.666666666666667);

  // ---- 2. Strong case: every cap reached = 8+9+8+10+5+5+20+20+15 = 100 ----
  var strong = engine.calculate({
    revenue: 10000000, operatingExpenses: 7000000, totalAssets: 10000000,
    currentAssets: 4000000, currentLiabilities: 2000000, totalDebt: 0,
    monthlyInflow: 2000000, monthlyOutflow: 1000000, monthlyDebtPayment: 100000,
    cashReserveMonths: 3, monitoringFrequency: 'Monthly',
    recFormalRecords: 'Yes', recStatements: 'Yes', recBankAccount: 'Yes', recSeparation: 'Yes',
    recUpdated: 'Yes', recSoftware: 'Yes', recTwoYears: 'Yes',
    planBudget: 'Yes', planRevenueForecast: 'Yes', planExpenseForecast: 'Yes',
    planVariance: 'Yes', planTargets: 'Yes', planEmergency: 'Yes'
  });
  check('Strong case: total capped at 100', strong.total, 100);

  // ---- 3. Over-the-cap values do not exceed the cap ----
  var over = engine.calculate(withChanges(demo, { cashReserveMonths: 12 }));
  check('Cash reserve of 12 months earns 5 points (cap), not more', find(over.components, 'key', 'cashReserve').points, 5);

  // ---- 4. Zero denominators: blank ratios earn 0 points, no errors ----
  // Reserve 3 months = 5 points, Quarterly = 3 points, everything else 0 -> 8.
  var zero = engine.calculate({
    revenue: 0, operatingExpenses: 0, totalAssets: 0, currentAssets: 0, currentLiabilities: 0,
    totalDebt: 0, monthlyInflow: 0, monthlyOutflow: 0, monthlyDebtPayment: 0,
    cashReserveMonths: 3, monitoringFrequency: 'Quarterly',
    recFormalRecords: 'No', recStatements: 'No', recBankAccount: 'No', recSeparation: 'No',
    recUpdated: 'No', recSoftware: 'No', recTwoYears: 'No',
    planBudget: 'No', planRevenueForecast: 'No', planExpenseForecast: 'No',
    planVariance: 'No', planTargets: 'No', planEmergency: 'No'
  });
  check('Zero denominators: total is 8', zero.total, 8);
  check('Zero denominators: classification', zero.classification, 'Needs Improvement');
  check('Zero denominators: current ratio is blank (null)', zero.indicators.currentRatio, null);
  check('Zero denominators: no NaN in score', isNaN(zero.total), false);

  // ---- 5. Negative values are floored at 0 points (MAX(0, ...)) ----
  var loss = engine.calculate(withChanges(demo, { operatingExpenses: 15000000, monthlyOutflow: 1500000 }));
  check('Loss-making: profitability floored at 0', find(loss.components, 'key', 'profitability').points, 0);
  check('Loss-making: debt-service floored at 0', find(loss.components, 'key', 'debtService').points, 0);
  var overDebt = engine.calculate(withChanges(demo, { totalDebt: 9600000 }));
  check('Debt above assets: leverage floored at 0', find(overDebt.components, 'key', 'leverage').points, 0);

  // ---- 6. Monitoring frequency: Monthly 5, Quarterly 3, Less often 1 ----
  check('Quarterly monitoring lowers total by 2', engine.calculate(withChanges(demo, { monitoringFrequency: 'Quarterly' })).total, r.total - 2);
  check('Less often monitoring lowers total by 4', engine.calculate(withChanges(demo, { monitoringFrequency: 'Less often' })).total, r.total - 4);

  // ---- 7. Classification boundaries (75 / 50) ----
  check('75 is Ready', engine.classify(75), 'Ready');
  check('74.99 is Developing', engine.classify(74.99), 'Developing');
  check('50 is Developing', engine.classify(50), 'Developing');
  check('49.99 is Needs Improvement', engine.classify(49.99), 'Needs Improvement');

  // ---- 8. Status and priority (Recommendations sheet) ----
  // Excel's live table for the demo case: Strong/Low, Strong/Low, Moderate/Medium, Strong/Low,
  // Moderate/Medium, Strong/Low, Strong/Low, Moderate/Medium.
  var expectedStatus = ['Strong', 'Strong', 'Moderate', 'Strong', 'Moderate', 'Strong', 'Strong', 'Moderate'];
  var expectedPriority = ['Low', 'Low', 'Medium', 'Low', 'Medium', 'Low', 'Low', 'Medium'];
  r.ratings.forEach(function (x, idx) {
    check('Demo status: ' + x.area, x.status, expectedStatus[idx]);
    check('Demo priority: ' + x.area, x.priority, expectedPriority[idx]);
  });
  check('Demo: no High priority, so top priority is null', r.topPriority, null);

  function ratingOf(res, key) { return find(res.ratings, 'key', key); }
  check('Current ratio 0.5 is Needs attention / High', ratingOf(engine.calculate(withChanges(demo, { currentAssets: 1000000 })), 'liquidity').priority, 'High');
  check('Current ratio exactly 1 is Moderate', ratingOf(engine.calculate(withChanges(demo, { currentAssets: 2000000 })), 'liquidity').status, 'Moderate');
  check('Debt/assets exactly 0.3 is Strong', ratingOf(engine.calculate(withChanges(demo, { totalDebt: 2400000 })), 'leverage').status, 'Strong');
  check('Debt/assets exactly 0.5 is Moderate', ratingOf(engine.calculate(withChanges(demo, { totalDebt: 4000000 })), 'leverage').status, 'Moderate');
  check('Debt/assets 0.51 is Needs attention', ratingOf(engine.calculate(withChanges(demo, { totalDebt: 4080000 })), 'leverage').status, 'Needs attention');
  check('Reserve exactly 1.5 months is Moderate', ratingOf(engine.calculate(withChanges(demo, { cashReserveMonths: 1.5 })), 'cashReserve').status, 'Moderate');
  check('Reserve exactly 3 months is Strong', ratingOf(engine.calculate(withChanges(demo, { cashReserveMonths: 3 })), 'cashReserve').status, 'Strong');
  check('Zero current liabilities: liquidity is Not available', ratingOf(zero, 'liquidity').status, 'Not available');
  var weakLiquidity = engine.calculate(withChanges(demo, { currentAssets: 1000000, cashReserveMonths: 1 }));
  check('Top priority is the first High area (Liquidity)', weakLiquidity.topPriority, 'Liquidity');

  return results;
}

if (typeof module !== 'undefined' && module.exports) module.exports = runScoringTests;
