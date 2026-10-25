/* =========================================================
   recommendations.js - the recommendation text, kept separate
   from the logic so you can edit the wording easily.

   Sources (all from SME_Finance_Readiness_Simulator.xlsx):
   - High and Medium: the rule table on the Recommendations sheet
     (trigger, recommended action, next step, why it matters).
   - Low (area is Strong): the live "Maintain ..." action on the
     Recommendations sheet, plus "Why it matters" from Diagnostics.
   One wording change: "Cash-flow DSCR proxy" is written as
   "Debt-service coverage proxy", as your methodology notes advise.
   ========================================================= */

var SME_RECOMMENDATIONS = {
  liquidity: {
    why: 'Measures short-term liquidity relative to current liabilities.',
    High: {
      trigger: 'Current ratio < 1.0',
      action: 'Strengthen liquid current assets and/or reduce short-term liabilities.',
      next: 'Work toward current ratio ≥ 1.0, then build further buffer.',
      why: 'Weak short-term liquidity can constrain routine payments and financing resilience.'
    },
    Medium: {
      trigger: 'Current ratio 1.0–1.49',
      action: 'Build a stronger working-capital buffer and monitor near-term obligations.',
      next: 'Move toward ≥ 1.5 where operationally feasible.',
      why: 'Provides additional room against short-term cash pressure.'
    },
    Low: { action: 'Maintain liquidity discipline.' }
  },

  profitability: {
    why: 'Shows the operating profit retained from revenue.',
    High: {
      trigger: 'Operating margin < 8%',
      action: 'Review major operating costs, pricing and product/service margins.',
      next: 'Set a realistic margin-improvement target and review monthly.',
      why: 'Recurring operating cash generation supports resilience and debt service.'
    },
    Medium: {
      trigger: 'Operating margin 8%–14.99%',
      action: 'Improve cost efficiency and pricing discipline.',
      next: 'Track margin monthly and investigate adverse variance.',
      why: 'Moderate profitability can limit internally generated funds.'
    },
    Low: { action: 'Protect operating margins while scaling.' }
  },

  leverage: {
    why: 'Indicates how much of the asset base is financed by debt.',
    High: {
      trigger: 'Debt/assets > 50%',
      action: 'Prioritize debt reduction and avoid unnecessary additional borrowing.',
      next: 'Prepare a debt-reduction plan and review maturity structure.',
      why: 'Higher leverage can increase financing pressure and vulnerability to shocks.'
    },
    Medium: {
      trigger: 'Debt/assets 30%–50%',
      action: 'Monitor leverage before taking additional debt.',
      next: 'Assess incremental debt against cash generation and repayment capacity.',
      why: 'Debt should remain aligned with sustainable repayment capacity.'
    },
    Low: { action: 'Maintain prudent leverage.' }
  },

  cashFlow: {
    why: 'Compares monthly cash inflows with monthly cash outflows.',
    High: {
      trigger: 'Cash-flow coverage < 1.0',
      action: 'Improve collections, reduce avoidable outflows, and increase monitoring frequency.',
      next: 'Create a 13-week cash-flow forecast and weekly review.',
      why: 'Cash flow is central to small-business repayment capacity.'
    },
    Medium: {
      trigger: 'Cash-flow coverage 1.0–1.24',
      action: 'Strengthen collections and cash buffers.',
      next: 'Track receivables/payables and maintain a rolling cash forecast.',
      why: 'A narrow cash surplus leaves less room for unexpected shocks.'
    },
    Low: { action: 'Maintain regular cash-flow monitoring.' }
  },

  cashReserve: {
    why: 'Shows the number of months of cash reserve available.',
    High: {
      trigger: 'Reserve < 1.5 months',
      action: 'Build an emergency liquidity reserve gradually.',
      next: 'Set a monthly reserve-building target.',
      why: 'A cash buffer helps absorb temporary cash-flow disruptions.'
    },
    Medium: {
      trigger: 'Reserve 1.5–2.99 months',
      action: 'Work toward a stronger reserve.',
      next: 'Set a target of 3 months where feasible.',
      why: 'Greater liquidity can improve resilience to temporary disruptions.'
    },
    Low: { action: 'Maintain the reserve.' }
  },

  debtService: {
    why: 'Compares cash generated before debt service with recurring debt payment.',
    High: {
      trigger: 'Debt-service coverage proxy < 1.0',
      action: 'Reduce debt-service pressure and/or strengthen operating cash generation.',
      next: 'Review repayment schedule and avoid new debt until coverage improves.',
      why: 'Cash generated before debt service is insufficient relative to recurring debt payment.'
    },
    Medium: {
      trigger: 'Debt-service coverage proxy 1.0–1.49',
      action: 'Improve recurring cash generation before adding significant debt.',
      next: 'Target ≥ 1.5 where feasible and stress-test repayments.',
      why: 'Provides a larger buffer over scheduled debt payments.'
    },
    Low: { action: 'Maintain debt-service discipline.' }
  },

  records: {
    why: 'Formal records improve transparency and support financing decisions.',
    High: {
      trigger: 'Recordkeeping practices < 60%',
      action: 'Formalize accounting records, statements, banking separation and regular updates.',
      next: 'Complete missing practices and maintain a monthly documentation routine.',
      why: 'Reliable records reduce information gaps and improve financial transparency.'
    },
    Medium: {
      trigger: 'Recordkeeping practices 60%–84.99%',
      action: 'Close remaining documentation gaps.',
      next: 'Prioritize financial statements, regular updates and separation of business/personal finances.',
      why: 'More complete records improve decision support and financing documentation.'
    },
    Low: { action: 'Maintain organized records.' }
  },

  planning: {
    why: 'Planning indicates whether management actively anticipates financial needs.',
    High: {
      trigger: 'Planning practices < 60%',
      action: 'Introduce budgeting, forecasts, targets and contingency planning.',
      next: 'Create an annual budget plus rolling monthly forecast.',
      why: 'Planning helps management anticipate financing and liquidity needs.'
    },
    Medium: {
      trigger: 'Planning practices 60%–84.99%',
      action: 'Make planning and variance review more consistent.',
      next: 'Review actual vs budget monthly and update forecasts.',
      why: 'Regular planning improves financial control and visibility.'
    },
    Low: { action: 'Maintain formal planning routines.' }
  }
};

var SME_RECS = (function () {
  'use strict';

  var KEYS = Object.keys(SME_RECOMMENDATIONS);

  // Returns { trigger, action, next, why } for an area and priority, or null.
  // For Low priority there is no trigger or next step in Excel, so those are empty.
  function get(key, priority) {
    var area = SME_RECOMMENDATIONS[key];
    if (!area || !area[priority]) return null;
    var item = area[priority];
    return {
      trigger: item.trigger || '',
      action: item.action,
      next: item.next || '',
      why: item.why || area.why
    };
  }

  return { get: get, keys: KEYS };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = SME_RECS;
