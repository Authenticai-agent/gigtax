const fs = require('fs');

const filePath = '/Users/juratevirkutyte/gigatax/gigtax-app/js/app.js';
let content = fs.readFileSync(filePath, 'utf8');

// List of standalone routes that need standalone/ prefix
// Excludes: hubs, entity routes, already-nested routes (gig/, creator/, seller/, rental/, reference/, equity/)
const standaloneRoutes = [
  'multi-source', 'w2', 'w2-and-side-hustle', 'multi-state',
  'ssdi', 'std-ltd', 'workers-comp', 'aca', 'quarterly',
  'self-employed-health-insurance', 'estimated-tax-penalty', 'nanny-employer-tax',
  'mixed-households', 'combined-salary', 'hourly-to-salary', 'raise-calculator',
  'raise-negotiation', 'freelance-rate', 'bonus-tax', 'w4-withholding',
  'roth-vs-traditional', '401k-calculator', 'net-worth', 'lifetime-irs-cost',
  'gig-true-hourly', 'w2-vs-1099', 'influencer-deal', 'college-roi',
  'fire-calculator', 'coffee-lifetime', 'subscription-audit', 'credit-card-trap',
  'buy-vs-rent', 'procrastination-investing', 'lifestyle-creep', 'prenup-mismatch',
  'how-rich-if', 'baby-cost', 'college-savings-gap', 'divorce-cost',
  'eldercare-cost', 'when-can-i-retire', 'climate-risk', 'budget-50-30-20',
  'profit-margin', 'work-hours', 'overtime-pay', 'salary-to-hourly',
  'city-comparison', 'marriage-penalty', 'gender-pay-gap', 'death-money',
  's-vs-c-corp'
];

// Also these equity flat routes should redirect to equity/ versions
const equityRedirectRoutes = [
  'equity-combined', 'rsu-tax', 'iso-tax', 'nso-tax', 'espp-tax',
  'qsbs-tax', 'phantom-tax', 'crypto-tax'
];

// 1. Update routes object - add standalone/ prefixed routes and redirect old ones
for (const route of standaloneRoutes) {
  // Pattern to find the route line: 'route': viewName,
  // We need to add 'standalone/route': viewName, and change old to redirect
  const routePattern = new RegExp(`^\\s+'${route.replace(/-/g, '\\-')}':\\s+([A-Za-z_]+[A-Za-z0-9_]*)\\s*,?\\s*$`, 'm');
  const match = content.match(routePattern);
  if (match) {
    const viewName = match[1];
    // Check if it already starts with standalone/
    if (!route.startsWith('standalone/')) {
      // Replace: add new route above old one, change old to redirect
      const oldLine = match[0];
      const newLines = `  'standalone/${route}': ${viewName},\n${oldLine.replace(`'${route}': ${viewName}`, `'${route}': redirectTo('/standalone/${route}')`)}`;
      content = content.replace(oldLine, newLines);
    }
  }
}

// 2. Update equity flat routes to redirect to equity/ versions
for (const route of equityRedirectRoutes) {
  const routePattern = new RegExp(`^\\s+'${route.replace(/-/g, '\\-')}':\\s+([A-Za-z_]+[A-Za-z0-9_]*)\\s*,?\\s*$`, 'm');
  const match = content.match(routePattern);
  if (match) {
    const viewName = match[1];
    const oldLine = match[0];
    const newLine = oldLine.replace(`'${route}': ${viewName}`, `'${route}': redirectTo('/equity/${route}')`);
    content = content.replace(oldLine, newLine);
  }
}

// 3. Update rental flat routes to redirect to rental/ versions
const rentalRedirectRoutes = [
  'short-vs-long-term-rental', 'real-estate-agent-rental'
];
for (const route of rentalRedirectRoutes) {
  const routePattern = new RegExp(`^\\s+'${route.replace(/-/g, '\\-')}':\\s+([A-Za-z_]+[A-Za-z0-9_]*)\\s*,?\\s*$`, 'm');
  const match = content.match(routePattern);
  if (match) {
    const viewName = match[1];
    const oldLine = match[0];
    const newLine = oldLine.replace(`'${route}': ${viewName}`, `'${route}': redirectTo('/rental/${route}')`);
    content = content.replace(oldLine, newLine);
  }
}

fs.writeFileSync(filePath, content);
console.log('Routes updated successfully');
