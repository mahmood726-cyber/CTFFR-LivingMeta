/*
 * Minimal smoke test for the CTFFR-LivingMeta single-file dashboard.
 * No framework: run with `node tests/smoke.test.js` (exit 0 = pass).
 * Checks shipped-asset hygiene and prediction-interval doc/code consistency.
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const HTML = path.join(ROOT, 'CTFFR_REVIEW.html');

let failures = 0;
function check(name, cond) {
  if (cond) {
    console.log('ok   - ' + name);
  } else {
    console.error('FAIL - ' + name);
    failures++;
  }
}

const html = fs.readFileSync(HTML, 'utf8');

// 1. No BOM in shipped HTML.
check('no UTF-8 BOM', html.charCodeAt(0) !== 0xfeff);

// 2. No hardcoded local user paths in shipped HTML.
check('no hardcoded C:\\Users path', !/C:\\\\Users\\\\/i.test(html) && !html.includes('C:\\Users\\'));
check('no hardcoded /home/ path', !/\/home\/[a-z]/i.test(html));

// 3. No unfilled template placeholders.
check('no REPLACE_ME / __PLACEHOLDER__', !/REPLACE_ME|__PLACEHOLDER__/.test(html));

// 4. Core stat engine markers present (guards against an empty / truncated ship).
check('DerSimonian-Laird present', /DerSimonian-Laird/.test(html));
check('REML tau2 present', /tau2_reml/.test(html));
check('Q-profile CI present', /qProfileTau2CI/.test(html));

// 5. Prediction-interval df convention: code uses k-1 (Cochrane v6.5), and no
//    user-facing/exported text may still claim the old k-2 (Higgins 2009) df.
check('PI computed with tQuantile df = k-1',
  /tQuantile\(1 - \(1 - confLevel\) \/ 2, k - 1\)/.test(html));
check('no stale "k-2 ... Higgins" prediction-interval claim',
  !/prediction interval[^.]{0,80}k\\u2212?2[^.]{0,40}Higgins/i.test(html) &&
  !/k\\u2212?2 degrees of freedom per Higgins/i.test(html));

if (failures) {
  console.error('\n' + failures + ' check(s) failed');
  process.exit(1);
}
console.log('\nall smoke checks passed');
