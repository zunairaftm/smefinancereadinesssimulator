/* =========================================================
   whatif.test.js - checks the engine against the "What-If V2" sheet
   of SME_Finance_Readiness_Simulator.xlsx.
   "excel" values were produced by putting each scenario into the
   scenario cells of What-If V2 and recalculating the workbook
   (LibreOffice). Nothing here is hand-calculated.

   KNOWN DIFFERENCE: What-If V2 caps debt/assets at 0.8 inside its
   leverage formula, MIN(0.8, C42), but the main Scoring sheet (E6) does
   not. When debt/assets is above 0.8 the What-If V2 sheet therefore gives
   a higher leverage score than the main model. The web app uses the main
   Scoring formula everywhere, so that an unchanged scenario shows exactly
   +0.00 change. The last cases below document this difference.
   ========================================================= */

function runWhatIfTests(engine) {
  var results = [];
  var TOL = 1e-9;
  function check(name, actual, expected) {
    var pass = (typeof expected === 'number') ? (typeof actual === 'number' && Math.abs(actual - expected) < TOL) : actual === expected;
    results.push({ name: name, pass: pass, actual: actual, expected: expected });
  }

  var matching = [
    { name: "demo", excel: 86.2400793650794, inputs: {"revenue": 12000000, "operatingExpenses": 9000000, "totalAssets": 8000000, "currentAssets": 3000000, "currentLiabilities": 2000000, "totalDebt": 2500000, "monthlyInflow": 1000000, "monthlyOutflow": 750000, "monthlyDebtPayment": 67000, "cashReserveMonths": 2, "monitoringFrequency": "Monthly", "recFormalRecords": "Yes", "recStatements": "Yes", "recBankAccount": "Yes", "recSeparation": "Yes", "recUpdated": "Yes", "recSoftware": "No", "recTwoYears": "Yes", "planBudget": "Yes", "planRevenueForecast": "Yes", "planExpenseForecast": "Yes", "planVariance": "No", "planTargets": "Yes", "planEmergency": "No"} },
    { name: "monthlyOutflow=700000, cashReserveMonths=4, planVariance=Yes, planEmergency=Ye", excel: 93.5416666666667, inputs: {"revenue": 12000000, "operatingExpenses": 9000000, "totalAssets": 8000000, "currentAssets": 3000000, "currentLiabilities": 2000000, "totalDebt": 2500000, "monthlyInflow": 1000000, "monthlyOutflow": 700000, "monthlyDebtPayment": 67000, "cashReserveMonths": 4, "monitoringFrequency": "Monthly", "recFormalRecords": "Yes", "recStatements": "Yes", "recBankAccount": "Yes", "recSeparation": "Yes", "recUpdated": "Yes", "recSoftware": "No", "recTwoYears": "Yes", "planBudget": "Yes", "planRevenueForecast": "Yes", "planExpenseForecast": "Yes", "planVariance": "Yes", "planTargets": "Yes", "planEmergency": "Yes"} },
    { name: "monitoringFrequency=Quarterly, recSoftware=Yes", excel: 87.0972222222222, inputs: {"revenue": 12000000, "operatingExpenses": 9000000, "totalAssets": 8000000, "currentAssets": 3000000, "currentLiabilities": 2000000, "totalDebt": 2500000, "monthlyInflow": 1000000, "monthlyOutflow": 750000, "monthlyDebtPayment": 67000, "cashReserveMonths": 2, "monitoringFrequency": "Quarterly", "recFormalRecords": "Yes", "recStatements": "Yes", "recBankAccount": "Yes", "recSeparation": "Yes", "recUpdated": "Yes", "recSoftware": "Yes", "recTwoYears": "Yes", "planBudget": "Yes", "planRevenueForecast": "Yes", "planExpenseForecast": "Yes", "planVariance": "No", "planTargets": "Yes", "planEmergency": "No"} },
    { name: "currentLiabilities=0", excel: 80.2400793650794, inputs: {"revenue": 12000000, "operatingExpenses": 9000000, "totalAssets": 8000000, "currentAssets": 3000000, "currentLiabilities": 0, "totalDebt": 2500000, "monthlyInflow": 1000000, "monthlyOutflow": 750000, "monthlyDebtPayment": 67000, "cashReserveMonths": 2, "monitoringFrequency": "Monthly", "recFormalRecords": "Yes", "recStatements": "Yes", "recBankAccount": "Yes", "recSeparation": "Yes", "recUpdated": "Yes", "recSoftware": "No", "recTwoYears": "Yes", "planBudget": "Yes", "planRevenueForecast": "Yes", "planExpenseForecast": "Yes", "planVariance": "No", "planTargets": "Yes", "planEmergency": "No"} },
    { name: "revenue=0", excel: 77.2400793650794, inputs: {"revenue": 0, "operatingExpenses": 9000000, "totalAssets": 8000000, "currentAssets": 3000000, "currentLiabilities": 2000000, "totalDebt": 2500000, "monthlyInflow": 1000000, "monthlyOutflow": 750000, "monthlyDebtPayment": 67000, "cashReserveMonths": 2, "monitoringFrequency": "Monthly", "recFormalRecords": "Yes", "recStatements": "Yes", "recBankAccount": "Yes", "recSeparation": "Yes", "recUpdated": "Yes", "recSoftware": "No", "recTwoYears": "Yes", "planBudget": "Yes", "planRevenueForecast": "Yes", "planExpenseForecast": "Yes", "planVariance": "No", "planTargets": "Yes", "planEmergency": "No"} },
    { name: "totalAssets=0", excel: 79.3650793650794, inputs: {"revenue": 12000000, "operatingExpenses": 9000000, "totalAssets": 0, "currentAssets": 3000000, "currentLiabilities": 2000000, "totalDebt": 2500000, "monthlyInflow": 1000000, "monthlyOutflow": 750000, "monthlyDebtPayment": 67000, "cashReserveMonths": 2, "monitoringFrequency": "Monthly", "recFormalRecords": "Yes", "recStatements": "Yes", "recBankAccount": "Yes", "recSeparation": "Yes", "recUpdated": "Yes", "recSoftware": "No", "recTwoYears": "Yes", "planBudget": "Yes", "planRevenueForecast": "Yes", "planExpenseForecast": "Yes", "planVariance": "No", "planTargets": "Yes", "planEmergency": "No"} },
    { name: "monthlyOutflow=0", excel: 77.3511904761905, inputs: {"revenue": 12000000, "operatingExpenses": 9000000, "totalAssets": 8000000, "currentAssets": 3000000, "currentLiabilities": 2000000, "totalDebt": 2500000, "monthlyInflow": 1000000, "monthlyOutflow": 0, "monthlyDebtPayment": 67000, "cashReserveMonths": 2, "monitoringFrequency": "Monthly", "recFormalRecords": "Yes", "recStatements": "Yes", "recBankAccount": "Yes", "recSeparation": "Yes", "recUpdated": "Yes", "recSoftware": "No", "recTwoYears": "Yes", "planBudget": "Yes", "planRevenueForecast": "Yes", "planExpenseForecast": "Yes", "planVariance": "No", "planTargets": "Yes", "planEmergency": "No"} },
    { name: "monthlyDebtPayment=0", excel: 66.2400793650794, inputs: {"revenue": 12000000, "operatingExpenses": 9000000, "totalAssets": 8000000, "currentAssets": 3000000, "currentLiabilities": 2000000, "totalDebt": 2500000, "monthlyInflow": 1000000, "monthlyOutflow": 750000, "monthlyDebtPayment": 0, "cashReserveMonths": 2, "monitoringFrequency": "Monthly", "recFormalRecords": "Yes", "recStatements": "Yes", "recBankAccount": "Yes", "recSeparation": "Yes", "recUpdated": "Yes", "recSoftware": "No", "recTwoYears": "Yes", "planBudget": "Yes", "planRevenueForecast": "Yes", "planExpenseForecast": "Yes", "planVariance": "No", "planTargets": "Yes", "planEmergency": "No"} },
    { name: "revenue=30000000, currentAssets=6000000, totalDebt=0", excel: 89.3650793650794, inputs: {"revenue": 30000000, "operatingExpenses": 9000000, "totalAssets": 8000000, "currentAssets": 6000000, "currentLiabilities": 2000000, "totalDebt": 0, "monthlyInflow": 1000000, "monthlyOutflow": 750000, "monthlyDebtPayment": 67000, "cashReserveMonths": 2, "monitoringFrequency": "Monthly", "recFormalRecords": "Yes", "recStatements": "Yes", "recBankAccount": "Yes", "recSeparation": "Yes", "recUpdated": "Yes", "recSoftware": "No", "recTwoYears": "Yes", "planBudget": "Yes", "planRevenueForecast": "Yes", "planExpenseForecast": "Yes", "planVariance": "No", "planTargets": "Yes", "planEmergency": "No"} },
    { name: "recFormalRecords=No, recStatements=No, recBankAccount=No, recSeparation=No, re", excel: 59.0972222222222, inputs: {"revenue": 12000000, "operatingExpenses": 9000000, "totalAssets": 8000000, "currentAssets": 3000000, "currentLiabilities": 2000000, "totalDebt": 2500000, "monthlyInflow": 1000000, "monthlyOutflow": 750000, "monthlyDebtPayment": 67000, "cashReserveMonths": 2, "monitoringFrequency": "Monthly", "recFormalRecords": "No", "recStatements": "No", "recBankAccount": "No", "recSeparation": "No", "recUpdated": "No", "recSoftware": "No", "recTwoYears": "No", "planBudget": "No", "planRevenueForecast": "No", "planExpenseForecast": "No", "planVariance": "No", "planTargets": "No", "planEmergency": "No"} },
    { name: "recSoftware=Yes, planVariance=Yes, planEmergency=Yes", excel: 94.0972222222222, inputs: {"revenue": 12000000, "operatingExpenses": 9000000, "totalAssets": 8000000, "currentAssets": 3000000, "currentLiabilities": 2000000, "totalDebt": 2500000, "monthlyInflow": 1000000, "monthlyOutflow": 750000, "monthlyDebtPayment": 67000, "cashReserveMonths": 2, "monitoringFrequency": "Monthly", "recFormalRecords": "Yes", "recStatements": "Yes", "recBankAccount": "Yes", "recSeparation": "Yes", "recUpdated": "Yes", "recSoftware": "Yes", "recTwoYears": "Yes", "planBudget": "Yes", "planRevenueForecast": "Yes", "planExpenseForecast": "Yes", "planVariance": "Yes", "planTargets": "Yes", "planEmergency": "Yes"} },
    { name: "totalDebt=6400000", excel: 81.3650793650794, inputs: {"revenue": 12000000, "operatingExpenses": 9000000, "totalAssets": 8000000, "currentAssets": 3000000, "currentLiabilities": 2000000, "totalDebt": 6400000, "monthlyInflow": 1000000, "monthlyOutflow": 750000, "monthlyDebtPayment": 67000, "cashReserveMonths": 2, "monitoringFrequency": "Monthly", "recFormalRecords": "Yes", "recStatements": "Yes", "recBankAccount": "Yes", "recSeparation": "Yes", "recUpdated": "Yes", "recSoftware": "No", "recTwoYears": "Yes", "planBudget": "Yes", "planRevenueForecast": "Yes", "planExpenseForecast": "Yes", "planVariance": "No", "planTargets": "Yes", "planEmergency": "No"} }
  ];

  var knownDifference = [
    { name: "operatingExpenses=13000000, totalDebt=7000000, cashReserveMonths=0, monitoring", excel: 65.031746031746, inputs: {"revenue": 12000000, "operatingExpenses": 13000000, "totalAssets": 8000000, "currentAssets": 3000000, "currentLiabilities": 2000000, "totalDebt": 7000000, "monthlyInflow": 1000000, "monthlyOutflow": 750000, "monthlyDebtPayment": 67000, "cashReserveMonths": 0, "monitoringFrequency": "Less often", "recFormalRecords": "Yes", "recStatements": "Yes", "recBankAccount": "Yes", "recSeparation": "Yes", "recUpdated": "Yes", "recSoftware": "No", "recTwoYears": "Yes", "planBudget": "Yes", "planRevenueForecast": "Yes", "planExpenseForecast": "Yes", "planVariance": "No", "planTargets": "Yes", "planEmergency": "No"} },
    { name: "totalDebt=6500000", excel: 81.3650793650794, inputs: {"revenue": 12000000, "operatingExpenses": 9000000, "totalAssets": 8000000, "currentAssets": 3000000, "currentLiabilities": 2000000, "totalDebt": 6500000, "monthlyInflow": 1000000, "monthlyOutflow": 750000, "monthlyDebtPayment": 67000, "cashReserveMonths": 2, "monitoringFrequency": "Monthly", "recFormalRecords": "Yes", "recStatements": "Yes", "recBankAccount": "Yes", "recSeparation": "Yes", "recUpdated": "Yes", "recSoftware": "No", "recTwoYears": "Yes", "planBudget": "Yes", "planRevenueForecast": "Yes", "planExpenseForecast": "Yes", "planVariance": "No", "planTargets": "Yes", "planEmergency": "No"} }
  ];

  matching.forEach(function (c) {
    check('What-If V2 (Excel) score: ' + c.name, engine.calculate(c.inputs).total, c.excel);
  });

  // Debt/assets above 0.8: engine follows the main Scoring sheet; Excel What-If V2 differs (see header).
  knownDifference.forEach(function (c) {
    var engineScore = engine.calculate(c.inputs).total;
    check('Known difference (debt/assets > 0.8) is the leverage cap only: ' + c.name,
          engineScore < c.excel && c.excel - engineScore <= 2 + TOL, true);
  });

  var demo = matching[0].inputs;
  var same = {};
  Object.keys(demo).forEach(function (k) { same[k] = demo[k]; });
  check('Unchanged scenario gives exactly the same score', engine.calculate(same).total, engine.calculate(demo).total);

  return results;
}

if (typeof module !== 'undefined' && module.exports) module.exports = runWhatIfTests;
