const fs = require('fs');

const filePath = '/Users/juratevirkutyte/gigatax/gigtax-app/js/app.js';
let content = fs.readFileSync(filePath, 'utf8');

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

// 1. Update PAGE_TITLES - add standalone/ prefixed entries
for (const route of standaloneRoutes) {
  const pattern = new RegExp(`^\\s+'${route.replace(/-/g, '\\-')}':\\s+'`, 'm');
  const match = content.match(pattern);
  if (match) {
    // Find the full line to get the title value
    const linePattern = new RegExp(`^\\s+'${route.replace(/-/g, '\\-')}':\\s+'([^']+)',?\\s*$`, 'm');
    const lineMatch = content.match(linePattern);
    if (lineMatch && !lineMatch[0].includes(`'standalone/${route}'`)) {
      const oldLine = lineMatch[0];
      const title = lineMatch[1];
      const newLine = `  'standalone/${route}': '${title}',\n${oldLine}`;
      content = content.replace(oldLine, newLine);
    }
  }
}

// 2. Update PAGE_META - add standalone/ prefixed entries
for (const route of standaloneRoutes) {
  const pattern = new RegExp(`^\\s+'${route.replace(/-/g, '\\-')}':\\s+'`, 'm');
  const match = content.match(pattern);
  if (match) {
    const linePattern = new RegExp(`^\\s+'${route.replace(/-/g, '\\-')}':\\s+'([^']+)',?\\s*$`, 'm');
    const lineMatch = content.match(linePattern);
    if (lineMatch && !lineMatch[0].includes(`'standalone/${route}'`)) {
      const oldLine = lineMatch[0];
      const meta = lineMatch[1];
      const newLine = `  'standalone/${route}': '${meta}',\n${oldLine}`;
      content = content.replace(oldLine, newLine);
    }
  }
}

// 3. Update sourceMap - add standalone/ prefixed entries
for (const route of standaloneRoutes) {
  const pattern = new RegExp(`^\\s+'${route.replace(/-/g, '\\-')}':`, 'm');
  const match = content.match(pattern);
  if (match) {
    const linePattern = new RegExp(`^\\s+'${route.replace(/-/g, '\\-')}':(.*?),?\\s*$`, 'm');
    const lineMatch = content.match(linePattern);
    if (lineMatch && !lineMatch[0].includes(`'standalone/${route}'`)) {
      const oldLine = lineMatch[0];
      const value = lineMatch[1];
      const newLine = `  'standalone/${route}':${value},\n${oldLine}`;
      content = content.replace(oldLine, newLine);
    }
  }
}

// 4. Update tileCard links in calculatorsHubView - change from flat to standalone/
for (const route of standaloneRoutes) {
  // Match tileCard(...,'route') - but not already standalone/
  const pattern = new RegExp(`tileCard\\([^)]*,'${route.replace(/-/g, '\\-')}'\\)`, 'g');
  content = content.replace(pattern, (match) => {
    return match.replace(`'${route}'`, `'standalone/${route}'`);
  });
}

// 5. Update schema URLs in updateSchema function
for (const route of standaloneRoutes) {
  const pattern = new RegExp(`baseUrl\\s*\\+\\s*\\'/\\${route}\\'`, 'g');
  content = content.replace(pattern, `baseUrl + '/standalone/${route}'`);
}

fs.writeFileSync(filePath, content);
console.log('Meta and links updated successfully');
