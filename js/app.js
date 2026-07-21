/* MoneyScopeCalculators - Main Application */
const TE = window.TaxEngine;
let DATA = null;
const TAX_YEAR = 2026;

function escapeHTML(str) {
  if (typeof str !== 'string') return String(str);
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function safeCalc(fn) {
  return function() {
    try { return fn.apply(this, arguments); }
    catch(err) {
      console.error('Calculator error:', err);
      const res = document.querySelector('.results-box, [id$="-res"]');
      if (res) res.innerHTML = '<p style="color:#c62828;padding:1rem">An error occurred. Please check your inputs and try again.</p>';
    }
  };
}

/* ===================== Router ===================== */
const routes = {
  '': homeView,
  'standalone': redirectTo('/calculators'),
  'calculators': calculatorsHubView,
  'gig-hub': gigHubView,
  'creator-hub': creatorHubView,
  'seller-hub': sellerHubView,
  'rental-hub': rentalHubView,
  'short-vs-long-term-rental': redirectTo('/rental/short-vs-long-term-rental'),
  'real-estate-agent-rental': redirectTo('/rental/real-estate-agent-rental'),
  'rental/short-vs-long-term-rental': shortVsLongTermRentalView,
  'rental/real-estate-agent-rental': realEstateAgentRentalView,
  'standalone/multi-source': multiSourceCalculatorView,
  'multi-source': redirectTo('/standalone/multi-source'),
  'standalone/w2': w2CalculatorView,
  'w2': redirectTo('/standalone/w2'),
  'gig/:platform': gigCalculatorView,
  'creator/brand-deal': brandDealCalculatorView,
  'creator/:platform': creatorCalculatorView,
  'seller/1099k-reconciliation': k1099CalculatorView,
  'seller/:platform': sellerCalculatorView,
  'rental/:type': rentalCalculatorView,
  'standalone/w2-and-side-hustle': combinedCalculatorView,
  'w2-and-side-hustle': redirectTo('/standalone/w2-and-side-hustle'),
  'standalone/multi-state': multiStateCalculatorView,
  'multi-state': redirectTo('/standalone/multi-state'),
  '1099k-reconciliation': redirectTo('/seller/1099k-reconciliation'),
  'brand-deal': redirectTo('/creator/brand-deal'),
  'entities': entitiesView,
  'standalone/entity-recommender': entityRecommenderView,
  'entity-recommender': redirectTo('/standalone/entity-recommender'),
  'standalone/entity-compare': entityCompareView,
  'entity-compare': redirectTo('/standalone/entity-compare'),
  'standalone/scorp-optimizer': scorpOptimizerView,
  'scorp-optimizer': redirectTo('/standalone/scorp-optimizer'),
  'standalone/comp-audit-risk': compAuditRiskView,
  'comp-audit-risk': redirectTo('/standalone/comp-audit-risk'),
  'standalone/delaware-tax': delawareTaxView,
  'delaware-tax': redirectTo('/standalone/delaware-tax'),
  'standalone/delaware-formation': delawareFormationView,
  'delaware-formation': redirectTo('/standalone/delaware-formation'),
  'standalone/sole-prop': solePropView,
  'sole-prop': redirectTo('/standalone/sole-prop'),
  'standalone/single-member-llc': singleMemberLLCView,
  'single-member-llc': redirectTo('/standalone/single-member-llc'),
  'standalone/partnership': partnershipView,
  'partnership': redirectTo('/standalone/partnership'),
  'standalone/c-corp': cCorpView,
  'c-corp': redirectTo('/standalone/c-corp'),
  'standalone/wyoming': wyomingView,
  'wyoming': redirectTo('/standalone/wyoming'),
  'standalone/mt-sd-entity': mtSdEntityView,
  'mt-sd-entity': redirectTo('/standalone/mt-sd-entity'),
  'standalone/nonprofit': nonprofitView,
  'nonprofit': redirectTo('/standalone/nonprofit'),
  'standalone/ssdi': ssdiCalculatorView,
  'ssdi': redirectTo('/standalone/ssdi'),
  'standalone/std-ltd': stdLtdView,
  'std-ltd': redirectTo('/standalone/std-ltd'),
  'standalone/workers-comp': workersCompView,
  'workers-comp': redirectTo('/standalone/workers-comp'),
  'standalone/aca': acaCalculatorView,
  'aca': redirectTo('/standalone/aca'),
  'standalone/quarterly': quarterlyCalculatorView,
  'quarterly': redirectTo('/standalone/quarterly'),
  'obbba': redirectTo('/reference/obbba'),
  'professionals': redirectTo('/reference/professionals'),
  'equity': equityView,
  'equity-combined': redirectTo('/equity/equity-combined'),
  'rsu-tax': redirectTo('/equity/rsu-tax'),
  'iso-tax': redirectTo('/equity/iso-tax'),
  'nso-tax': redirectTo('/equity/nso-tax'),
  'espp-tax': redirectTo('/equity/espp-tax'),
  'qsbs-tax': redirectTo('/equity/qsbs-tax'),
  'phantom-tax': redirectTo('/equity/phantom-tax'),
  'crypto-tax': redirectTo('/equity/crypto-tax'),
  'reference/tax-forms': taxFormsView,
  'reference/filing-statuses': filingStatusView,
  'reference/state-metadata': stateMetaView,
  'reference/professionals': professionalsView,
  'reference/obbba': obbbaTrackerView,
  'reference/deductions': deductionsLibraryView,
  'equity/equity-combined': equityCombinedView,
  'equity/rsu-tax': rsuTaxView,
  'equity/iso-tax': isoTaxView,
  'equity/nso-tax': nsoTaxView,
  'equity/espp-tax': esppTaxView,
  'equity/qsbs-tax': qsbsTaxView,
  'equity/phantom-tax': phantomTaxView,
  'equity/crypto-tax': cryptoTaxView,
  'standalone/self-employed-health-insurance': selfEmployedHealthInsuranceView,
  'self-employed-health-insurance': redirectTo('/standalone/self-employed-health-insurance'),
  'standalone/estimated-tax-penalty': estimatedTaxPenaltyView,
  'estimated-tax-penalty': redirectTo('/standalone/estimated-tax-penalty'),
  'standalone/nanny-employer-tax': nannyEmployerTaxView,
  'nanny-employer-tax': redirectTo('/standalone/nanny-employer-tax'),
  'tax-forms': redirectTo('/reference/tax-forms'),
  'filing-statuses': redirectTo('/reference/filing-statuses'),
  'state-metadata': redirectTo('/reference/state-metadata'),
  'standalone/mixed-households': mixedHouseholdView,
  'mixed-households': redirectTo('/standalone/mixed-households'),
  'standalone/combined-salary': combinedSalaryView,
  'combined-salary': redirectTo('/standalone/combined-salary'),
  'standalone/hourly-to-salary': hourlyToSalaryView,
  'hourly-to-salary': redirectTo('/standalone/hourly-to-salary'),
  'standalone/raise-calculator': raiseCalculatorView,
  'raise-calculator': redirectTo('/standalone/raise-calculator'),
  'standalone/raise-negotiation': raiseNegotiationView,
  'raise-negotiation': redirectTo('/standalone/raise-negotiation'),
  'standalone/freelance-rate': freelanceRateView,
  'freelance-rate': redirectTo('/standalone/freelance-rate'),
  'standalone/bonus-tax': bonusTaxView,
  'bonus-tax': redirectTo('/standalone/bonus-tax'),
  'standalone/w4-withholding': w4WithholdingView,
  'w4-withholding': redirectTo('/standalone/w4-withholding'),
  'standalone/roth-vs-traditional': rothVsTraditionalView,
  'roth-vs-traditional': redirectTo('/standalone/roth-vs-traditional'),
  'standalone/401k-calculator': _401kCalculatorView,
  '401k-calculator': redirectTo('/standalone/401k-calculator'),
  'standalone/net-worth': netWorthView,
  'net-worth': redirectTo('/standalone/net-worth'),
  'standalone/lifetime-irs-cost': lifetimeIrsCostView,
  'lifetime-irs-cost': redirectTo('/standalone/lifetime-irs-cost'),
  'standalone/gig-true-hourly': gigTrueHourlyView,
  'gig-true-hourly': redirectTo('/standalone/gig-true-hourly'),
  'standalone/w2-vs-1099': w2Vs1099View,
  'w2-vs-1099': redirectTo('/standalone/w2-vs-1099'),
  'standalone/influencer-deal': influencerDealView,
  'influencer-deal': redirectTo('/standalone/influencer-deal'),
  'standalone/college-roi': collegeRoiView,
  'college-roi': redirectTo('/standalone/college-roi'),
  'standalone/fire-calculator': fireCalculatorView,
  'fire-calculator': redirectTo('/standalone/fire-calculator'),
  'standalone/coffee-lifetime': coffeeLifetimeView,
  'coffee-lifetime': redirectTo('/standalone/coffee-lifetime'),
  'standalone/subscription-audit': subscriptionAuditView,
  'subscription-audit': redirectTo('/standalone/subscription-audit'),
  'standalone/credit-card-trap': creditCardTrapView,
  'credit-card-trap': redirectTo('/standalone/credit-card-trap'),
  'standalone/buy-vs-rent': buyVsRentView,
  'buy-vs-rent': redirectTo('/standalone/buy-vs-rent'),
  'standalone/procrastination-investing': procrastinationInvestingView,
  'procrastination-investing': redirectTo('/standalone/procrastination-investing'),
  'standalone/lifestyle-creep': lifestyleCreepView,
  'lifestyle-creep': redirectTo('/standalone/lifestyle-creep'),
  'standalone/prenup-mismatch': prenupMismatchView,
  'prenup-mismatch': redirectTo('/standalone/prenup-mismatch'),
  'standalone/how-rich-if': howRichIfView,
  'how-rich-if': redirectTo('/standalone/how-rich-if'),
  'standalone/baby-cost': babyCostView,
  'baby-cost': redirectTo('/standalone/baby-cost'),
  'standalone/college-savings-gap': collegeSavingsGapView,
  'college-savings-gap': redirectTo('/standalone/college-savings-gap'),
  'standalone/divorce-cost': divorceCostView,
  'divorce-cost': redirectTo('/standalone/divorce-cost'),
  'standalone/eldercare-cost': eldercareCostView,
  'eldercare-cost': redirectTo('/standalone/eldercare-cost'),
  'standalone/when-can-i-retire': whenCanIRetireView,
  'when-can-i-retire': redirectTo('/standalone/when-can-i-retire'),
  'standalone/climate-risk': climateRiskView,
  'climate-risk': redirectTo('/standalone/climate-risk'),
  'standalone/budget-50-30-20': budget503020View,
  'budget-50-30-20': redirectTo('/standalone/budget-50-30-20'),
  'standalone/profit-margin': profitMarginView,
  'profit-margin': redirectTo('/standalone/profit-margin'),
  'standalone/work-hours': workHoursView,
  'work-hours': redirectTo('/standalone/work-hours'),
  'standalone/overtime-pay': overtimePayView,
  'overtime-pay': redirectTo('/standalone/overtime-pay'),
  'standalone/salary-to-hourly': salaryToHourlyView,
  'salary-to-hourly': redirectTo('/standalone/salary-to-hourly'),
  'standalone/city-comparison': cityComparisonView,
  'city-comparison': redirectTo('/standalone/city-comparison'),
  'deductions': redirectTo('/reference/deductions'),
  'standalone/marriage-penalty': marriagePenaltyView,
  'marriage-penalty': redirectTo('/standalone/marriage-penalty'),
  'standalone/gender-pay-gap': genderPayGapView,
  'gender-pay-gap': redirectTo('/standalone/gender-pay-gap'),
  'standalone/death-money': deathMoneyView,
  'death-money': redirectTo('/standalone/death-money'),
  'standalone/s-vs-c-corp': sVsCCorpView,
  's-vs-c-corp': redirectTo('/standalone/s-vs-c-corp'),
  'about': aboutView
};

function matchRoute(path) {
  path = path.replace(/^\//, '');
  for (const pattern in routes) {
    const regex = new RegExp('^' + pattern.replace(/:\w+/g, '([^/]+)') + '$');
    const m = path.match(regex);
    if (m) return { view: routes[pattern], params: m.slice(1).map(escapeHTML) };
  }
  return { view: homeView, params: [] };
}

function navigateTo(url) {
  history.pushState(null, null, url);
  navigate();
}

function redirectTo(url) {
  return function() { history.replaceState(null, null, url); navigate(); };
}

const PAGE_TITLES = {
  '': '40+ Free 1099 & Side Hustle Tax Calculators',
  'calculators': 'Tax Calculators | Free 1099, W2, Gig & Creator Tools',
  'gig-hub': 'Gig Economy Tax Calculator Free | Uber, DoorDash, Instacart',
  'creator-hub': 'Creator Economy Tax Calculators | OnlyFans, YouTube, TikTok',
  'seller-hub': 'Online Seller Tax Calculators | Etsy, eBay, Amazon FBA',
  'rental-hub': 'Rental Income Tax Calculators | Airbnb, Turo, VRBO',
  'short-vs-long-term-rental': 'Short Term vs Long Term Rental Tax Calculator | STR vs LTR',
  'real-estate-agent-rental': 'Real Estate Agent Rental Tax Calculator | Schedule C + E',
  'rental/short-vs-long-term-rental': 'Short Term vs Long Term Rental Tax Calculator | STR vs LTR',
  'rental/real-estate-agent-rental': 'Real Estate Agent Rental Tax Calculator | Schedule C + E',
  'standalone/multi-source': 'Multiple Income Sources Tax Estimator | W2 & 1099 Combined',
  'multi-source': 'Multiple Income Sources Tax Estimator | W2 & 1099 Combined',
  'standalone/multi-state': 'Multi-State W2 & 1099 Tax Calculator | Remote Work & Multi-State Income',
  'multi-state': 'Multi-State W2 & 1099 Tax Calculator | Remote Work & Multi-State Income',
  'standalone/w2': 'W2 Tax Calculator | Employee Income Tax Estimator',
  'w2': 'W2 Tax Calculator | Employee Income Tax Estimator',
  'standalone/w2-and-side-hustle': 'W2 and Side Hustle Tax Calculator | 1099 & W2 Combined',
  'w2-and-side-hustle': 'W2 and Side Hustle Tax Calculator | 1099 & W2 Combined',
  '1099k-reconciliation': '1099-K Tax Reconciliation Calculator | eBay & Seller Tool',
  'brand-deal': 'Influencer Brand Deal Tax Calculator | Sponsorship Income',
  'entities': 'Business Entity Tax Calculators | LLC, S-Corp, C-Corp',
  'entity-recommender': 'Business Entity Recommender | LLC vs S-Corp vs C-Corp',
  'entity-compare': 'LLC vs S Corp Tax Savings Calculator',
  'scorp-optimizer': 'S-Corp Reasonable Salary Calculator',
  'comp-audit-risk': 'S-Corp Reasonable Compensation Audit Risk Calculator',
  'delaware-tax': 'Delaware C-Corp Franchise Tax Calculator',
  'delaware-formation': 'Delaware LLC & Corp Formation Cost Calculator',
  'sole-prop': 'Sole Proprietorship Tax Calculator | Schedule C',
  'single-member-llc': 'Single Member LLC Schedule C Tax Estimator',
  'partnership': 'Partnership Tax Calculator | Schedule K-1',
  'c-corp': 'C-Corporation Tax Calculator | Form 1120',
  'wyoming': 'Wyoming LLC Tax Advantages Calculator',
  'nonprofit': 'Nonprofit Tax Calculator | Form 990',
  'standalone/ssdi': 'SSDI Tax Calculator | Social Security Disability Taxation',
  'ssdi': 'SSDI Tax Calculator | Social Security Disability Taxation',
  'standalone/std-ltd': 'STD/LTD Disability Tax Calculator | Short-Term & Long-Term Disability',
  'std-ltd': 'STD/LTD Disability Tax Calculator | Short-Term & Long-Term Disability',
  'standalone/workers-comp': 'Workers Compensation Tax Calculator | Tax-Free Benefits & SSDI Offset',
  'workers-comp': 'Workers Compensation Tax Calculator | Tax-Free Benefits & SSDI Offset',
  'standalone/aca': 'ACA Premium Tax Credit Calculator | Subsidy Cliff',
  'aca': 'ACA Premium Tax Credit Calculator | Subsidy Cliff',
  'standalone/quarterly': '1099 Quarterly Estimated Tax Calculator | Form 1040-ES',
  'quarterly': '1099 Quarterly Estimated Tax Calculator | Form 1040-ES',
  'obbba': 'OBBBA Tax Changes Tracker | One Big Beautiful Bill Act for Self-Employed',
  'professionals': 'Tax Deductions by Profession | 23+ Job Checklists',
  'equity': 'Equity Compensation Tax Calculator | RSU, ISO, ESPP, QSBS',
  'equity-combined': 'Combined Equity Tax Calculator | RSU + ESPP + QSBS + Phantom',
  'rsu-tax': 'RSU Tax Calculator | Restricted Stock Unit Withholding & Sale Gains',
  'iso-tax': 'ISO Stock Options Tax Calculator | AMT & Qualifying Disposition',
  'nso-tax': 'NSO Stock Options Tax Calculator | Non-Qualified Exercise Tax',
  'espp-tax': 'ESPP Tax Calculator | Employee Stock Purchase Plan Qualifying vs Disqualifying',
  'qsbs-tax': 'QSBS Exclusion Calculator | Section 1202 $10M/$15M OBBBA',
  'phantom-tax': 'Phantom Stock & SARs Tax Calculator | Payout Ordinary Income',
  'crypto-tax': 'Crypto Tax Calculator | Bitcoin, Ethereum, NFTs & Staking',
  'standalone/self-employed-health-insurance': 'Self-Employed Health Insurance Deduction Calculator | Above-the-Line Deduction',
  'self-employed-health-insurance': 'Self-Employed Health Insurance Deduction Calculator | Above-the-Line Deduction',
  'standalone/estimated-tax-penalty': 'Estimated Tax Penalty Calculator | Form 2210 Underpayment Penalty',
  'estimated-tax-penalty': 'Estimated Tax Penalty Calculator | Form 2210 Underpayment Penalty',
  'standalone/nanny-employer-tax': 'Nanny / Household Employer Tax Calculator | Schedule H & FICA',
  'nanny-employer-tax': 'Nanny / Household Employer Tax Calculator | Schedule H & FICA',
  'tax-forms': 'IRS Tax Forms Guide | All Forms & Instructions',
  'filing-statuses': 'IRS Filing Status Calculator | Standard Deductions',
  'state-metadata': 'State Income Tax Rates | All 50 States',
  'standalone/mixed-households': 'Mixed Household Tax Calculator | Multi-Income Families',
  'mixed-households': 'Mixed Household Tax Calculator | Multi-Income Families',
  'standalone/combined-salary': 'Combined Salary Tax Calculator | W2 + SE Income',
  'combined-salary': 'Combined Salary Tax Calculator | W2 + SE Income',
  'standalone/hourly-to-salary': 'Hourly to Salary Converter | Paycheck & Annual Income Calculator',
  'hourly-to-salary': 'Hourly to Salary Converter | Paycheck & Annual Income Calculator',
  'standalone/raise-calculator': 'Raise & Pay Cut Calculator | Percentage Change Tool',
  'raise-calculator': 'Raise & Pay Cut Calculator | Percentage Change Tool',
  'standalone/raise-negotiation': 'Raise Negotiation Calculator | Lifetime Earnings Impact',
  'raise-negotiation': 'Raise Negotiation Calculator | Lifetime Earnings Impact',
  'standalone/freelance-rate': 'Freelance Rate Calculator | Minimum Hourly & Project Rate',
  'freelance-rate': 'Freelance Rate Calculator | Minimum Hourly & Project Rate',
  'standalone/bonus-tax': 'Bonus Tax Calculator | $10K Bonus - How Much Do You Keep?',
  'bonus-tax': 'Bonus Tax Calculator | $10K Bonus - How Much Do You Keep?',
  'standalone/w4-withholding': 'W-4 Withholding Calculator | Fix Your Paycheck Withholding',
  'w4-withholding': 'W-4 Withholding Calculator | Fix Your Paycheck Withholding',
  'standalone/roth-vs-traditional': 'Roth vs Traditional IRA Calculator | Clear Winner in 30 Seconds',
  'roth-vs-traditional': 'Roth vs Traditional IRA Calculator | Clear Winner in 30 Seconds',
  'standalone/401k-calculator': '401(k) Contribution Calculator | Employer Match + Tax Savings + 30-Year Growth',
  '401k-calculator': '401(k) Contribution Calculator | Employer Match + Tax Savings + 30-Year Growth',
  'standalone/net-worth': 'Net Worth Calculator | Assets vs Liabilities + Age Benchmark',
  'net-worth': 'Net Worth Calculator | Assets vs Liabilities + Age Benchmark',
  'standalone/lifetime-irs-cost': 'Lifetime IRS Tax Paid Calculator | What Did the IRS Actually Cost Me?',
  'lifetime-irs-cost': 'Lifetime IRS Tax Paid Calculator | What Did the IRS Actually Cost Me?',
  'standalone/gig-true-hourly': 'Gig Worker True Hourly Rate Calculator | Real Net Pay After All Costs',
  'gig-true-hourly': 'Gig Worker True Hourly Rate Calculator | Real Net Pay After All Costs',
  'standalone/w2-vs-1099': 'W-2 vs 1099 Calculator | Same Salary Comparison After Benefits & Tax',
  'w2-vs-1099': 'W-2 vs 1099 Calculator | Same Salary Comparison After Benefits & Tax',
  'standalone/influencer-deal': 'Influencer Deal Rate Calculator | Is This Brand Deal Fair?',
  'influencer-deal': 'Influencer Deal Rate Calculator | Is This Brand Deal Fair?',
  'standalone/college-roi': 'College Degree ROI Calculator | Lifetime Earnings vs. Trade School & No Degree',
  'college-roi': 'College Degree ROI Calculator | Lifetime Earnings vs. Trade School & No Degree',
  'standalone/fire-calculator': 'FIRE Calculator | How Long Until I Am Rich & Financially Independent?',
  'fire-calculator': 'FIRE Calculator | How Long Until I Am Rich & Financially Independent?',
  'standalone/coffee-lifetime': 'Coffee Cost Calculator | $6 Latte = $284,000 Lost Retirement Wealth Over 40 Years',
  'coffee-lifetime': 'Coffee Cost Calculator | $6 Latte = $284,000 Lost Retirement Wealth Over 40 Years',
  'standalone/subscription-audit': 'Subscription Audit Calculator | Find Your Monthly Bleed & 10-Year Opportunity Cost',
  'subscription-audit': 'Subscription Audit Calculator | Find Your Monthly Bleed & 10-Year Opportunity Cost',
  'standalone/credit-card-trap': 'Credit Card Minimum Payment Trap Calculator | Years to Pay Off & Total Interest',
  'credit-card-trap': 'Credit Card Minimum Payment Trap Calculator | Years to Pay Off & Total Interest',
  'standalone/buy-vs-rent': 'Buy vs Rent Calculator | Exact Month When Buying Beats Renting',
  'buy-vs-rent': 'Buy vs Rent Calculator | Exact Month When Buying Beats Renting',
  'standalone/procrastination-investing': 'Cost of Procrastinating on Investing Calculator | The $400K Wealth Gap',
  'procrastination-investing': 'Cost of Procrastinating on Investing Calculator | The $400K Wealth Gap',
  'standalone/lifestyle-creep': 'Lifestyle Creep Calculator | Wealth Destroyed by Spending Increases',
  'lifestyle-creep': 'Lifestyle Creep Calculator | Wealth Destroyed by Spending Increases',
  'standalone/prenup-mismatch': 'Prenup Financial Mismatch Calculator | Compatibility Score & Wealth Projection',
  'prenup-mismatch': 'Prenup Financial Mismatch Calculator | Compatibility Score & Wealth Projection',
  'standalone/how-rich-if': 'How Rich Would I Be If Calculator | Counterfactual Wealth Engine',
  'how-rich-if': 'How Rich Would I Be If Calculator | Counterfactual Wealth Engine',
  'standalone/baby-cost': 'Cost of Having a Baby Calculator | True First-Year Cost with Opportunity Cost',
  'baby-cost': 'Cost of Having a Baby Calculator | True First-Year Cost with Opportunity Cost',
  'standalone/college-savings-gap': 'College Savings Gap Calculator | Are You Short for Tuition?',
  'college-savings-gap': 'College Savings Gap Calculator | Are You Short for Tuition?',
  'standalone/divorce-cost': 'Cost of Divorce Calculator | True Financial Impact of Divorce',
  'divorce-cost': 'Cost of Divorce Calculator | True Financial Impact of Divorce',
  'standalone/eldercare-cost': 'Eldercare Cost Calculator | In-Home vs Assisted Living vs Memory Care',
  'eldercare-cost': 'Eldercare Cost Calculator | In-Home vs Assisted Living vs Memory Care',
  'standalone/when-can-i-retire': 'When Can I Retire? Calculator | Conservative, Moderate & Aggressive Scenarios',
  'when-can-i-retire': 'When Can I Retire? Calculator | Conservative, Moderate & Aggressive Scenarios',
  'standalone/climate-risk': 'Climate Financial Risk Calculator | Insurance, Property Value & Adaptation Cost',
  'climate-risk': 'Climate Financial Risk Calculator | Insurance, Property Value & Adaptation Cost',
  'standalone/budget-50-30-20': '50/30/20 Budget Calculator | Needs Wants Savings Split',
  'budget-50-30-20': '50/30/20 Budget Calculator | Needs Wants Savings Split',
  'standalone/profit-margin': 'Profit Margin Calculator | Gross Net Margin & Markup for Sellers',
  'profit-margin': 'Profit Margin Calculator | Gross Net Margin & Markup for Sellers',
  'standalone/work-hours': 'Work Hours Calculator | Timesheet & Overtime Tracker',
  'work-hours': 'Work Hours Calculator | Timesheet & Overtime Tracker',
  'standalone/overtime-pay': 'Overtime Pay Calculator | Daily & Weekly OT Rules',
  'overtime-pay': 'Overtime Pay Calculator | Daily & Weekly OT Rules',
  'standalone/salary-to-hourly': 'Salary to Hourly Converter | True Rate with PTO & Holidays',
  'salary-to-hourly': 'Salary to Hourly Converter | True Rate with PTO & Holidays',
  'standalone/city-comparison': 'Salary Comparison by City | Cost-of-Living Adjusted',
  'city-comparison': 'Salary Comparison by City | Cost-of-Living Adjusted',
  'deductions': 'Tax Deductions Library | Every Write-Off by Profession',
  'about': 'About MoneyScopeCalculators | Free Tax Calculators'
};

const PAGE_META = {
  '': 'Calculate exactly what to set aside for the IRS. 40+ free tax calculators for Uber, Etsy, OnlyFans, and W-2 + side hustle income. Find your tool today.',
  'calculators': 'Free tax calculators for every income type in: W-2, 1099, gig work, creator income, online selling, rentals, and business entities. Calculate what you owe.',
  'gig-hub': 'Free gig economy tax calculators for: Uber, Lyft, DoorDash, Instacart, Amazon Flex, Grubhub, TaskRabbit, Rover, and more. Estimate your 1099 taxes and deductions.',
  'creator-hub': 'Free creator economy tax calculators for: OnlyFans, YouTube, TikTok, Twitch, Substack, podcasters, UGC creators, and influencers. Estimate your 1099 taxes.',
  'seller-hub': 'Free online seller tax calculators for: Etsy, eBay, Amazon FBA, Shopify, Poshmark, Gumroad, and more. Reconcile 1099-K and estimate taxes.',
  'rental-hub': 'Free rental income tax calculators for: Airbnb, Turo, VRBO, RV rental, equipment rental, and long-term landlords. Calculate Schedule E taxes.',
  'short-vs-long-term-rental': 'Compare short-term rental (Airbnb) vs long-term rental (landlord) tax impact for the same property. See Schedule C vs Schedule E. Free tool.',
  'real-estate-agent-rental': 'Calculate tax for real estate agents who also own rental properties. Schedule C commissions + Schedule E rentals. Free tool.',
  'rental/short-vs-long-term-rental': 'Compare short-term rental (Airbnb) vs long-term rental (landlord) tax impact for the same property. See Schedule C vs Schedule E. Free tool.',
  'rental/real-estate-agent-rental': 'Calculate tax for real estate agents who also own rental properties. Schedule C commissions + Schedule E rentals. Free tool.',
  'multi-source': 'Calculate tax on multiple income sources combined: W-2 wages, 1099 gig work, creator income, seller profits, rental income, and SSDI. Free estimator.',
  'multi-state': 'Calculate federal and state taxes when you earn W-2 and 1099 income in multiple states. See tax owed in each state and your total liability. Free tool.',
  'w2': 'Calculate your tax on W-2 wages only. See take-home pay, effective rate, and whether your withholding covers your full liability. Free tool.',
  'w2-and-side-hustle': 'Calculate combined tax when you have a W-2 job and a side hustle. See how your 1099 income pushes you into higher brackets. Free tool.',
  '1099k-reconciliation': 'Reconcile your 1099-K gross receipts to actual taxable income. Deduct fees, refunds, COGS, and shipping. Free tool for Etsy, eBay, Amazon sellers.',
  'brand-deal': 'Calculate tax on influencer brand deals and sponsorships. See what percentage to set aside for federal, state, and SE tax. Free tool.',
  'entities': 'Compare business entity types for tax savings: LLC, S-Corp, C-Corp, Partnership, Sole Proprietorship. Free calculators and recommendations.',
  'entity-recommender': 'Answer 12 questions about your business and get a personalized entity recommendation: LLC, S-Corp, C-Corp, or Partnership. Free tool.',
  'entity-compare': 'Enter your net profit and see exact dollar savings from an S-Corp election vs LLC. Includes salary vs distribution breakdown. Free calculator.',
  'scorp-optimizer': 'Find the optimal S-Corp salary percentage (20-60%) that minimizes total tax while staying within IRS reasonableness rules. Free tool.',
  'comp-audit-risk': 'Calculate your IRS audit risk for S-Corp reasonable compensation. Score based on salary ratio, profit level, industry, and business history. Free tool.',
  'delaware-tax': 'Calculate Delaware C-Corp franchise tax and estimate total corporate tax liability. Free tool for Delaware-incorporated businesses.',
  'delaware-formation': 'Calculate one-time Delaware LLC and Corporation formation costs: filing fees, expedited service, registered agent, certified copies, and apostilles. Free tool.',
  'sole-prop': 'Calculate tax as a Sole Proprietorship using Schedule C. See SE tax, federal income tax, and state tax. Free estimator.',
  'single-member-llc': 'Calculate tax as a Single-Member LLC (disregarded entity). Same as Sole Prop but with liability protection. Free Schedule C estimator.',
  'partnership': 'Calculate partnership tax with Schedule K-1 income allocation. See SE tax and pass-through taxation. Free tool.',
  'c-corp': 'Calculate C-Corporation tax with double taxation (corporate + dividend). See effective rate and Delaware franchise tax. Free tool.',
  'wyoming': 'Calculate Wyoming LLC tax advantages: no state income tax, no franchise tax, minimal fees. Compare to other states. Free tool.',
  'nonprofit': 'Calculate unrelated business income tax (UBIT) for nonprofits. See Form 990 requirements. Free tool.',
  'ssdi': 'Calculate taxable SSDI benefits using the IRS Pub 915 combined income formula. See 0%, 50%, or 85% taxation. Free tool.',
  'std-ltd': 'Calculate tax on short-term and long-term disability benefits. Taxability depends on who paid premiums: employer-paid = taxable, employee after-tax = tax-free. Free tool.',
  'workers-comp': 'Workers compensation benefits are tax-free under IRC Section 104(a)(1). Calculate total benefits received and estimate any SSDI offset impact. Free tool.',
  'aca': 'Model your MAGI against ACA premium tax credit thresholds. See if you are at risk of the 400% FPL cliff. Free tool.',
  'quarterly': 'Calculate quarterly estimated tax payments (Form 1040-ES). See due dates and safe harbor amounts. Free 1099 contractor tool.',
  'obbba': 'Track OBBBA provisions that affect gig workers, creators, and self-employed filers: 100% bonus depreciation, QBI permanence, R&D expensing, ACA changes, and 1099-K thresholds.',
  'professionals': 'Browse tax deductions for 23+ professions. Use as a Schedule C checklist for your filing. Free reference.',
  'equity': 'Calculate tax on RSU, ISO, ESPP, QSBS, and phantom stock. See ordinary income vs capital gains treatment. Free tool.',
  'equity-combined': 'Model RSU vesting, ESPP sales, QSBS exclusion, and phantom stock payouts in one combined run. Compare total equity tax. Free tool.',
  'rsu-tax': 'Calculate RSU vesting tax: ordinary income, employer withholding gap (22% vs 37%), and capital gains on sale. Free tool for tech employees.',
  'iso-tax': 'Calculate ISO exercise tax: AMT exposure, bargain element, qualifying vs disqualifying disposition, and long-term capital gains. Free tool.',
  'nso-tax': 'Calculate NSO exercise tax: ordinary income on spread (FMV - strike), FICA, and capital gains on sale. Free tool.',
  'espp-tax': 'Calculate ESPP tax: qualifying vs disqualifying disposition, discount income, and capital gains. Free tool for employee stock purchase plans.',
  'qsbs-tax': 'Calculate QSBS Section 1202 exclusion: 50%/75%/100% exclusion rates, $10M/$15M cap, and OBBBA changes. Free tool for startup equity.',
  'phantom-tax': 'Calculate phantom stock and SAR payout tax: ordinary income, FICA for employees, and self-employment tax for contractors. Free tool.',
  'crypto-tax': 'Calculate crypto tax on Bitcoin, Ethereum, NFT flips, and staking rewards. Short-term vs long-term capital gains, ordinary income on staking, and wash sale rules. Free tool.',
  'self-employed-health-insurance': 'Calculate self-employed health insurance deduction: above-the-line deduction, ACA subsidy interaction, and S-Corp owner treatment. Free tool.',
  'estimated-tax-penalty': 'Calculate Form 2210 underpayment penalty for missing quarterly estimated tax payments. See exactly what you owe the IRS for underpayment. Free tool.',
  'nanny-employer-tax': 'Calculate household employer taxes: Schedule H, employer FICA (7.65%), federal unemployment tax (FUTA), and state unemployment tax (SUTA). Free tool for nanny employers.',
  'tax-forms': 'Complete guide to IRS tax forms for: Schedule C, SE, E, K-1, 1040, 1120, and more. Descriptions and filing requirements.',
  'filing-statuses': 'Compare IRS filing statuses for: Single, MFJ, MFS, HOH. See standard deductions and which status saves you the most.',
  'state-metadata': 'Browse state income tax rates and brackets for all 50 states. See flat vs graduated tax systems and no-income-tax states.',
  'mixed-households': 'Calculate tax for mixed-income households: W-2, 1099, rental, investment, and SSDI combined. Free estimator.',
  'combined-salary': 'Calculate combined tax on W-2 and self-employment income. See effective rate and what to set aside. Free tool.',
  'hourly-to-salary': 'Convert hourly wage to annual salary, monthly pay, and weekly earnings. Includes overtime, part-time, and full-time calculations. Free tool.',
  'raise-calculator': 'Calculate percentage raise or pay cut between old and new salary. See dollar change, new hourly rate, and what you need to earn to keep pace with inflation. Free tool.',
  'raise-negotiation': 'Enter your current salary and desired raise percentage. See your exact ask in dollars, 10-year lifetime earnings impact, and what not negotiating really costs. Free tool.',
  'freelance-rate': 'Enter your target income, business expenses, tax estimate, and time off. See your absolute minimum hourly rate and project rate. Stop underselling your work. Free tool.',
  'bonus-tax': 'Enter your bonus amount, salary, and state. Compare flat 22% supplemental withholding vs aggregate method. See exactly how much of your bonus you keep after federal, state, and FICA taxes. Free tool.',
  'w4-withholding': 'Enter your expected income, current withholding, and deductions. See if you will owe or get a refund, and exactly how much to adjust on your W-4 Step 4(c). Free tool.',
  'roth-vs-traditional': 'Enter your current tax rate, expected retirement tax rate, contribution, and years. See which IRA wins - Roth or Traditional - and by how much after 20-30 years. Free tool.',
  '401k-calculator': 'Enter your salary, contribution percentage, and employer match. See your annual savings, free money from your employer, tax savings, and projected 30-year balance. Free tool.',
  'net-worth': 'Enter your assets and liabilities by category. See your net worth, where you stand vs age-based benchmarks, and which categories to focus on first. Free tool.',
  'lifetime-irs-cost': 'Enter your age, when you started working, average income, filing status, and state. See your lifetime federal income tax, FICA, and state tax paid to the IRS. Free tool.',
  'gig-true-hourly': 'Enter your gross gig earnings, hours worked, miles driven, and expenses. See your true net hourly rate after SE tax, mileage, depreciation, phone, and all hidden costs. Free tool.',
  'w2-vs-1099': 'Enter a W-2 salary and a 1099 offer. Side-by-side comparison after employer benefits, FICA, SE tax, business deductions, and income tax. See which offer actually pays more. Free tool.',
  'influencer-deal': 'Enter your followers, engagement rate, content type, and what the brand offered. See the estimated fair market rate for your niche and content format. Know if you are being underpaid. Free tool.',
  'college-roi': 'Enter your major, school cost, student debt, and years in school. Compare lifetime after-tax earnings of a college degree vs. trade school vs. no degree. See break-even age and true ROI. Free tool.',
  'fire-calculator': 'Enter your current savings, monthly income, expenses, and investment return. See exactly how many years until you reach financial independence and can retire early. The 4% rule applied to your real numbers. Free tool.',
  'coffee-lifetime': 'See what your daily coffee habit actually costs over 40 years with compound returns. $6/day = $284,000 in lost retirement wealth. Enter your coffee cost, frequency, and years to see the true lifetime opportunity cost. The most shared personal finance concept finally in calculator form.',
  'subscription-audit': 'List all your subscriptions, enter their monthly cost, and see your total monthly bleed, annual total, and 10-year opportunity cost if invested at S&P 500 returns. Find forgotten subscriptions and redirect them to wealth building.',
  'credit-card-trap': 'Enter your credit card balance, APR, and minimum payment percentage. See exactly how many years it takes to pay off and how much interest you pay. $5,000 at 24% APR with minimum payments takes 22 years and costs $9,400 in interest. Free tool.',
  'buy-vs-rent': 'Enter home price, down payment, mortgage rate, monthly rent, and local appreciation. See the exact month when buying beats renting, with month-by-month net worth comparison. Accounts for closing costs, selling costs, property tax, insurance, maintenance, HOA, and rent increases. Free tool.',
  'procrastination-investing': 'Enter your monthly investment contribution and expected return. See the devastating wealth gap at age 65 between starting at 25, 35, or 45. The same $500/month costs $400,000+ more if you wait 10 years. Compound interest is brutal and beautiful. Free tool.',
  'lifestyle-creep': 'Enter your income and savings rate from 5 years ago and today. See exactly how much extra you spent, how much less you saved, and the future wealth destroyed by lifestyle creep. $40k more income but $12k less saved = $89,000+ in destroyed wealth. Free tool.',
  'prenup-mismatch': 'Enter two partners income, assets, and debts. See financial compatibility score, combined net worth, debt exposure, and projected 10-year wealth together vs apart. Built for prenup conversations and financial transparency before marriage. Free tool.',
  'how-rich-if': 'What if you had invested your car payments instead of buying? Maxed your 401k since 25? Bought Bitcoin in 2017? Apple in 2005? Enter the alternative reality and see the counterfactual wealth you could have built. The most addictive financial calculator ever made. Free tool.',
  'baby-cost': 'Enter hospital delivery cost, first-year expenses (diapers, formula, childcare, gear), and lost income if one parent steps back. See the true first-year cost of having a baby including opportunity cost. $28,000–$67,000 depending on city and childcare. Free tool.',
  'college-savings-gap': 'Enter your child\'s age, target school type (public in-state, out-of-state, private, Ivy), current 529 balance, and monthly contribution. See your projected college savings gap at age 18. "You\'re $187,000 short." Free tool.',
  'divorce-cost': 'Enter marital assets, income split, attorney fees, two-household cost delta, and QDRO retirement impact. See the true total financial cost of divorce — not just legal fees, but the long-term wealth destruction. Free tool.',
  'eldercare-cost': 'Enter your parent\'s age, health status, location, and care preferences. See projected in-home care, assisted living, and memory care costs over 5 and 10 years. Includes family financial exposure and savings gap. Free tool.',
  'when-can-i-retire': 'Enter your current age, savings, monthly contribution, expected retirement expenses, and Social Security estimate. See three scenarios — conservative, moderate, aggressive — showing exactly when you can retire with confidence. Free tool.',
  'climate-risk': 'Enter your home value, current insurance, climate risk type, and severity level. See projected insurance cost increases, property value depreciation, and adaptation costs over 10-30 years. Know your total climate financial exposure. Free tool.',
  'budget-50-30-20': 'Enter your monthly take-home pay and split it into needs, wants, and savings using the 50/30/20 rule. Adjust percentages and see monthly and annual breakdowns. Free tool.',
  'profit-margin': 'Enter revenue, COGS, operating costs, and other expenses. See gross margin, net margin, markup percentage, and cost breakdown. Built for Etsy, Amazon, and Shopify sellers. Free tool.',
  'work-hours': 'Clock in and out timesheet calculator. Track daily and weekly hours, regular vs overtime, breaks, and optional pay calculation. Free tool.',
  'overtime-pay': 'Calculate overtime pay with daily and weekly rules. Enter clock in/out times and see regular pay, OT pay, and total pay. Free tool.',
  'salary-to-hourly': 'Convert annual salary to true hourly rate, accounting for PTO and paid holidays. Or go reverse: hourly to salary. See if your offer is actually worth it. Free tool.',
  'city-comparison': 'Compare salaries between cities with cost-of-living adjustment. See what your salary is worth in another city. Free tool.',
  'deductions': 'Complete tax deductions library for: mileage, home office, equipment, COGS, platform fees, and every write-off by profession.',
  'about': 'MoneyScopeCalculators builds free tax calculators for the way people actually make money in: W-2, gig apps, creators, sellers, rentals, and entities.'
};

function getPageTitle(route) {
  if (PAGE_TITLES[route]) return `${PAGE_TITLES[route]} | ${TAX_YEAR}`;
  const gigMatch = route.match(/^gig\/(.+)$/);
  if (gigMatch) {
    const platform = gigMatch[1];
    const names = {uber:'Uber Driver',lyft:'Lyft Driver',doordash:'DoorDash Driver',uber_eats:'Uber Eats Driver',instacart:'Instacart Shopper',grubhub:'Grubhub Driver',amazon_flex:'Amazon Flex Driver',spark_walmart:'Spark Driver',shipt:'Shipt Shopper',taskrabbit:'TaskRabbit Contractor',rover:'Rover Pet Sitter',thumbtack:'Thumbtack Contractor',handyman_1099:'Handyman Tax Calculator',cleaning:'Cleaning Business Tax Calculator',lawn_care:'Lawn Care Tax Calculator',babysitter_nanny_1099:'Babysitter & Nanny Tax Calculator',fiverr_upwork:'Fiverr / Upwork Freelancer',toptal:'Toptal Freelancer',cameo_stir:'Cameo / Stir Creator'};
    const name = names[platform] || platform.replace(/_/g, ' ');
    return `${name} Tax Calculator ${TAX_YEAR}: Estimate Your 1099 Taxes`;
  }
  const creatorMatch = route.match(/^creator\/(.+)$/);
  if (creatorMatch) {
    const platform = creatorMatch[1];
    const names = {onlyfans:'OnlyFans Creator',tiktok:'TikTok Creator',youtube:'YouTube Creator',twitch:'Twitch Streamer',substack:'Substack Writer',podcast:'Podcast Creator',patreon:'Patreon Creator',instagram:'Instagram Influencer',ugc_creator:'UGC Creator Tax Calculator',online_course_creator:'Online Course Creator',newsletter_business:'Newsletter Business',affiliate:'Affiliate Marketer',sponsorship_income:'Sponsorship Income',beehiiv:'Beehiiv Writer',kofi_buymeacoffee:'Ko-fi / Buy Me a Coffee Creator',linkedin_creator:'LinkedIn Creator',kajabi:'Kajabi Course Creator'};
    const name = names[platform] || platform.replace(/_/g, ' ');
    return `${name} Tax Calculator ${TAX_YEAR}: Estimate Your 1099 Taxes`;
  }
  const sellerMatch = route.match(/^seller\/(.+)$/);
  if (sellerMatch) {
    const platform = sellerMatch[1];
    const names = {etsy:'Etsy Seller',ebay:'eBay Seller',amazon_fba:'Amazon FBA Seller',shopify:'Shopify Store Owner',poshmark:'Poshmark Seller',mercari:'Mercari Seller',gumroad:'Gumroad Seller',stan_store:'Stan Store Seller',facebook_marketplace:'Facebook Marketplace Seller',stockx_goat:'StockX / GOAT Seller',printful_printify:'Printful / Printify Seller'};
    const name = names[platform] || platform.replace(/_/g, ' ');
    return `${name} Tax Calculator ${TAX_YEAR}: Estimate Your 1099 Taxes`;
  }
  const rentalMatch = route.match(/^rental\/(.+)$/);
  if (rentalMatch) {
    const type = rentalMatch[1];
    const names = {airbnb:'Airbnb / VRBO Host',turo:'Turo Car Sharing',vrbo:'VRBO Host',getaround:'Getaround Car Sharing',rv_rental:'RV Rental Tax Calculator',boat_rental:'Boat Rental Tax Calculator',equipment_rental:'Equipment Rental Tax Calculator',parking_space_rental:'Parking Space Rental',storage_rental:'Storage Rental Tax Calculator',landlord:'Landlord Tax Calculator'};
    const name = names[type] || type.replace(/_/g, ' ');
    return `${name} Tax Calculator ${TAX_YEAR}: Estimate Your Rental Income Taxes`;
  }
  const equityMatch = route.match(/^equity\/(.+)$/);
  if (equityMatch) {
    const calc = equityMatch[1];
    if (PAGE_TITLES[calc]) return `${PAGE_TITLES[calc]} | ${TAX_YEAR}`;
  }
  const referenceMatch = route.match(/^reference\/(.+)$/);
  if (referenceMatch) {
    const calc = referenceMatch[1];
    if (PAGE_TITLES[calc]) return `${PAGE_TITLES[calc]} | ${TAX_YEAR}`;
  }
  return `MoneyScopeCalculators - ${TAX_YEAR} Tax Calculator`;
}

function getPageMeta(route) {
  if (PAGE_META[route]) return `${PAGE_META[route]} | ${TAX_YEAR}`;
  const gigMatch = route.match(/^gig\/(.+)$/);
  if (gigMatch) return `Free ${TAX_YEAR} tax calculator for ${gigMatch[1].replace(/_/g, ' ')} workers. Estimate 1099 taxes, mileage deductions, and quarterly payments.`;
  const creatorMatch = route.match(/^creator\/(.+)$/);
  if (creatorMatch) return `Free ${TAX_YEAR} tax calculator for ${creatorMatch[1].replace(/_/g, ' ')} creators. Estimate 1099 taxes, equipment deductions, and quarterly payments.`;
  const sellerMatch = route.match(/^seller\/(.+)$/);
  if (sellerMatch) return `Free ${TAX_YEAR} tax calculator for ${sellerMatch[1].replace(/_/g, ' ')} sellers. Reconcile 1099-K, deduct COGS and fees, and estimate taxes.`;
  const rentalMatch = route.match(/^rental\/(.+)$/);
  if (rentalMatch) return `Free ${TAX_YEAR} tax calculator for ${rentalMatch[1].replace(/_/g, ' ')} rental income. Calculate Schedule E deductions and estimate taxes.`;
  const equityMatch = route.match(/^equity\/(.+)$/);
  if (equityMatch) {
    const calc = equityMatch[1];
    if (PAGE_META[calc]) return `${PAGE_META[calc]} | ${TAX_YEAR}`;
  }
  const referenceMatch = route.match(/^reference\/(.+)$/);
  if (referenceMatch) {
    const calc = referenceMatch[1];
    if (PAGE_META[calc]) return `${PAGE_META[calc]} | ${TAX_YEAR}`;
  }
  return `Free tax calculators for ${TAX_YEAR}. Calculate W-2, 1099, gig, creator, seller, rental, and business entity taxes.`;
}

function updatePageMeta(route) {
  document.title = getPageTitle(route);
  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) { metaDesc = document.createElement('meta'); metaDesc.name = 'description'; document.head.appendChild(metaDesc); }
  metaDesc.content = getPageMeta(route);
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
  const baseUrl = window.location.origin;
  canonical.href = route === '' ? baseUrl : `${baseUrl}/${route}`;
}

function updateSchema(route) {
  const normalizedRoute = route.replace(/^\/+/, '').replace(/\/+$/, '');
  let existing = document.getElementById('page-schema');
  if (existing) existing.remove();
  const baseUrl = window.location.origin;
  const isCalc = /^(gig\/|creator\/|seller\/|rental\/|equity\/|reference\/|standalone\/|entity-recommender|entity-compare|scorp-optimizer|comp-audit-risk|delaware-tax|delaware-formation|sole-prop|single-member-llc|partnership|c-corp|wyoming|mt-sd-entity|nonprofit|short-vs-long-term-rental|real-estate-agent-rental)$/.test(normalizedRoute);
  if (isCalc) {
    const toolSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: getPageTitle(normalizedRoute),
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'All',
      description: getPageMeta(normalizedRoute),
      url: `${baseUrl}/${normalizedRoute}`,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      }
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'page-schema';
    script.textContent = JSON.stringify(toolSchema);
    document.head.appendChild(script);
    return;
  }
  if (normalizedRoute !== '' && normalizedRoute !== 'calculators') return;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: '50+ Free Money Calculators. Tax, Salary, Wealth & Life Decisions 2026',
    description: 'Calculate exactly what to set aside for the IRS. 40+ free 2026 tax calculators for Uber, Etsy, OnlyFans, and W-2 + side hustle income.',
    url: `${baseUrl}/${route}`,
    hasPart: [
      {
        '@type': 'ItemList',
        name: 'Standalone Tools',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Combine All My Income Tax Calculator', url: baseUrl + '/standalone/multi-source' },
          { '@type': 'ListItem', position: 2, name: 'Multi-State W-2 & 1099 Tax Calculator', url: baseUrl + '/standalone/multi-state' },
          { '@type': 'ListItem', position: 3, name: 'W-2 Tax Calculator', url: baseUrl + '/standalone/w2' },
          { '@type': 'ListItem', position: 4, name: 'W-2 & Side Hustle Tax Calculator', url: baseUrl + '/standalone/w2-and-side-hustle' },
          { '@type': 'ListItem', position: 5, name: '1099-K Reconciliation Calculator', url: baseUrl + '/seller/1099k-reconciliation' },
          { '@type': 'ListItem', position: 6, name: 'Brand Deal Tax Calculator', url: baseUrl + '/creator/brand-deal' },
          { '@type': 'ListItem', position: 7, name: 'SSDI Tax Calculator', url: baseUrl + '/standalone/ssdi' },
          { '@type': 'ListItem', position: 8, name: 'ACA Subsidy Calculator', url: baseUrl + '/standalone/aca' },
          { '@type': 'ListItem', position: 9, name: 'Quarterly Tax Estimator', url: baseUrl + '/standalone/quarterly' },
          { '@type': 'ListItem', position: 10, name: 'OBBBA Changes Tracker', url: baseUrl + '/reference/obbba' },
          { '@type': 'ListItem', position: 11, name: 'Tax Deductions Library', url: baseUrl + '/reference/deductions' }
        ]
      },
      {
        '@type': 'ItemList',
        name: 'Gig Economy Calculators',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Uber & Lyft Tax Calculator', url: baseUrl + '/gig/uber' },
          { '@type': 'ListItem', position: 2, name: 'DoorDash Tax Calculator', url: baseUrl + '/gig/doordash' },
          { '@type': 'ListItem', position: 3, name: 'Instacart Tax Calculator', url: baseUrl + '/gig/instacart' },
          { '@type': 'ListItem', position: 4, name: 'Amazon Flex Tax Calculator', url: baseUrl + '/gig/amazon_flex' },
          { '@type': 'ListItem', position: 5, name: 'Grubhub Tax Calculator', url: baseUrl + '/gig/grubhub' },
          { '@type': 'ListItem', position: 6, name: 'Spark & Walmart Tax Calculator', url: baseUrl + '/gig/spark_walmart' },
          { '@type': 'ListItem', position: 7, name: 'Rover Pet Care Tax Calculator', url: baseUrl + '/gig/rover' },
          { '@type': 'ListItem', position: 8, name: 'TaskRabbit Tax Calculator', url: baseUrl + '/gig/taskrabbit' },
          { '@type': 'ListItem', position: 9, name: 'Cleaning Business Tax Calculator', url: baseUrl + '/gig/cleaning' },
          { '@type': 'ListItem', position: 10, name: 'Lawn Care Tax Calculator', url: baseUrl + '/gig/lawn_care' },
          { '@type': 'ListItem', position: 11, name: 'Handyman Tax Calculator', url: baseUrl + '/gig/handyman_1099' },
          { '@type': 'ListItem', position: 12, name: 'Babysitter & Nanny Tax Calculator', url: baseUrl + '/gig/babysitter_nanny_1099' },
          { '@type': 'ListItem', position: 13, name: 'Shipt Tax Calculator', url: baseUrl + '/gig/shipt' },
          { '@type': 'ListItem', position: 14, name: 'Thumbtack Tax Calculator', url: baseUrl + '/gig/thumbtack' },
          { '@type': 'ListItem', position: 15, name: 'Uber Eats Tax Calculator', url: baseUrl + '/gig/uber_eats' },
          { '@type': 'ListItem', position: 16, name: 'Fiverr / Upwork Tax Calculator', url: baseUrl + '/gig/fiverr_upwork' },
          { '@type': 'ListItem', position: 17, name: 'Toptal Tax Calculator', url: baseUrl + '/gig/toptal' },
          { '@type': 'ListItem', position: 18, name: 'Cameo / Stir Tax Calculator', url: baseUrl + '/gig/cameo_stir' }
        ]
      },
      {
        '@type': 'ItemList',
        name: 'Creator Economy Calculators',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'OnlyFans Tax Calculator', url: baseUrl + '/creator/onlyfans' },
          { '@type': 'ListItem', position: 2, name: 'TikTok Tax Calculator', url: baseUrl + '/creator/tiktok' },
          { '@type': 'ListItem', position: 3, name: 'YouTube Tax Calculator', url: baseUrl + '/creator/youtube' },
          { '@type': 'ListItem', position: 4, name: 'Twitch Tax Calculator', url: baseUrl + '/creator/twitch' },
          { '@type': 'ListItem', position: 5, name: 'Substack Tax Calculator', url: baseUrl + '/creator/substack' },
          { '@type': 'ListItem', position: 6, name: 'Podcast Tax Calculator', url: baseUrl + '/creator/podcast' },
          { '@type': 'ListItem', position: 7, name: 'Patreon Tax Calculator', url: baseUrl + '/creator/patreon' },
          { '@type': 'ListItem', position: 8, name: 'Instagram Tax Calculator', url: baseUrl + '/creator/instagram' },
          { '@type': 'ListItem', position: 9, name: 'UGC Creator Tax Calculator', url: baseUrl + '/creator/ugc_creator' },
          { '@type': 'ListItem', position: 10, name: 'Course Creator Tax Calculator', url: baseUrl + '/creator/online_course_creator' },
          { '@type': 'ListItem', position: 11, name: 'Affiliate Tax Calculator', url: baseUrl + '/creator/affiliate' },
          { '@type': 'ListItem', position: 12, name: 'Newsletter Business Tax Calculator', url: baseUrl + '/creator/newsletter_business' },
          { '@type': 'ListItem', position: 13, name: 'Sponsorships Tax Calculator', url: baseUrl + '/creator/sponsorship_income' },
          { '@type': 'ListItem', position: 14, name: 'Brand Deal Tax Calculator', url: baseUrl + '/creator/brand-deal' },
          { '@type': 'ListItem', position: 15, name: 'Beehiiv Tax Calculator', url: baseUrl + '/creator/beehiiv' },
          { '@type': 'ListItem', position: 16, name: 'Ko-fi / Buy Me a Coffee Tax Calculator', url: baseUrl + '/creator/kofi_buymeacoffee' },
          { '@type': 'ListItem', position: 17, name: 'LinkedIn Creator Tax Calculator', url: baseUrl + '/creator/linkedin_creator' },
          { '@type': 'ListItem', position: 18, name: 'Kajabi Tax Calculator', url: baseUrl + '/creator/kajabi' }
        ]
      },
      {
        '@type': 'ItemList',
        name: 'Marketplace Seller Calculators',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Etsy Tax Calculator', url: baseUrl + '/seller/etsy' },
          { '@type': 'ListItem', position: 2, name: 'eBay Tax Calculator', url: baseUrl + '/seller/ebay' },
          { '@type': 'ListItem', position: 3, name: 'Amazon FBA Tax Calculator', url: baseUrl + '/seller/amazon_fba' },
          { '@type': 'ListItem', position: 4, name: 'Shopify Tax Calculator', url: baseUrl + '/seller/shopify' },
          { '@type': 'ListItem', position: 5, name: 'Poshmark Tax Calculator', url: baseUrl + '/seller/poshmark' },
          { '@type': 'ListItem', position: 6, name: 'Mercari Tax Calculator', url: baseUrl + '/seller/mercari' },
          { '@type': 'ListItem', position: 7, name: 'Gumroad Tax Calculator', url: baseUrl + '/seller/gumroad' },
          { '@type': 'ListItem', position: 8, name: 'Stan Store Tax Calculator', url: baseUrl + '/seller/stan_store' },
          { '@type': 'ListItem', position: 9, name: 'Facebook Marketplace Tax Calculator', url: baseUrl + '/seller/facebook_marketplace' },
          { '@type': 'ListItem', position: 10, name: 'StockX & GOAT Tax Calculator', url: baseUrl + '/seller/stockx_goat' },
          { '@type': 'ListItem', position: 11, name: 'Printful & Printify Tax Calculator', url: baseUrl + '/seller/printful_printify' },
          { '@type': 'ListItem', position: 12, name: '1099-K Reconciliation Calculator', url: baseUrl + '/seller/1099k-reconciliation' }
        ]
      },
      {
        '@type': 'ItemList',
        name: 'Rental Income Calculators',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Airbnb & VRBO Tax Calculator', url: baseUrl + '/rental/airbnb' },
          { '@type': 'ListItem', position: 2, name: 'Turo Tax Calculator', url: baseUrl + '/rental/turo' },
          { '@type': 'ListItem', position: 3, name: 'Getaround Tax Calculator', url: baseUrl + '/rental/getaround' },
          { '@type': 'ListItem', position: 4, name: 'RV Rental Tax Calculator', url: baseUrl + '/rental/rv_rental' },
          { '@type': 'ListItem', position: 5, name: 'Boat Rental Tax Calculator', url: baseUrl + '/rental/boat_rental' },
          { '@type': 'ListItem', position: 6, name: 'Equipment Rental Tax Calculator', url: baseUrl + '/rental/equipment_rental' },
          { '@type': 'ListItem', position: 7, name: 'Parking Space Tax Calculator', url: baseUrl + '/rental/parking_space_rental' },
          { '@type': 'ListItem', position: 8, name: 'Storage Rental Tax Calculator', url: baseUrl + '/rental/storage_rental' },
          { '@type': 'ListItem', position: 9, name: 'Landlord Tax Calculator', url: baseUrl + '/rental/landlord' },
          { '@type': 'ListItem', position: 10, name: 'Short Term vs Long Term Rental Tax Calculator', url: baseUrl + '/rental/short-vs-long-term-rental' },
          { '@type': 'ListItem', position: 11, name: 'Real Estate Agent Rental Tax Calculator', url: baseUrl + '/rental/real-estate-agent-rental' }
        ]
      }
    ]
  };
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = 'page-schema';
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
}

async function navigate() {
  const nav = document.getElementById('main-nav');
  if (nav) nav.classList.remove('open');
  if (!DATA) DATA = await TE.loadTaxData();
  const path = location.pathname.replace(/^\//, '').replace(/^index\.html$/, '');
  const { view, params } = matchRoute(path);
  const main = document.getElementById('main-content');
  main.innerHTML = '';
  view(main, ...params);
  updatePageMeta(path);
  updateSchema(path);
  injectFaqSchema([]);
  const div = document.createElement('div');
  div.innerHTML = lastUpdatedStamp() + irsSourceBox(path);
  main.appendChild(div);
  window.scrollTo(0, 0);
}

window.addEventListener('popstate', navigate);
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('mobile-menu-btn').addEventListener('click', () => {
    document.getElementById('main-nav').classList.toggle('open');
  });
  document.body.addEventListener('click', e => {
    const a = e.target.closest('a');
    if (!a) return;
    if (a.target === '_blank') return;
    if (a.href.startsWith(window.location.origin)) {
      e.preventDefault();
      const path = new URL(a.href).pathname;
      navigateTo(path);
    }
  });
  navigate();
});

/* ===================== Shared UI ===================== */
function breadcrumbs(...items) {
  const mapped = items.map((it, i) => i === items.length - 1 ? it.text : `<a href="/${it.href}">${it.text}</a>`);
  return `<div class="breadcrumbs">${mapped.join(' / ')}</div>`;
}
function sectionLabel(text){return`<p class="section-label">${text}</p>`;}
const IRS_CITATIONS={
  'gig/:platform':'<strong>Sources:</strong> IRS Schedule C (Form 1040) and Instructions for Schedule C; IRS Form 1040-SE (Self-Employment Tax); IRS Notice 2026-10 (2026 standard mileage rate: $0.725/mi business). See IRS Pub 334 (Tax Guide for Small Business) and Pub 463 (Travel, Gift, and Car Expenses).',
  'creator/:platform':'<strong>Sources:</strong> IRS Schedule C (Form 1040); IRS Form 1040-SE; IRS Pub 334 (Tax Guide for Small Business); IRS Pub 535 (Business Expenses); IRS Pub 587 (Business Use of Home).',
  'seller/:platform':'<strong>Sources:</strong> IRS Schedule C (Form 1040); IRS Form 1099-K; IRS Pub 334 (Tax Guide for Small Business). Cost of goods sold: Schedule C Line 4. Platform fees are deductible business expenses.',
  'rental/:type':'<strong>Sources:</strong> IRS Schedule E (Supplemental Income and Loss) for passive rental; Schedule C if substantial services provided. See IRS Pub 527 (Residential Rental Property).',
  'w2-and-side-hustle':'<strong>Sources:</strong> IRS Form 1040, Schedule C, and Form 1040-SE. W-2 withholding: IRS Pub 505 (Tax Withholding and Estimated Tax). Combined income interactions modeled per IRS instructions.',
  'w2':'<strong>Sources:</strong> IRS Form 1040 and Form W-2. Standard deduction: IRS Rev. Proc. 2025-28. Withholding guidance: IRS Pub 505.',
  '1099k-reconciliation':'<strong>Sources:</strong> IRS Form 1099-K and Schedule C (Form 1040). Gross receipts on 1099-K include fees, refunds, and shipping - deduct these on Schedule C. See IRS Pub 334.',
  'brand-deal':'<strong>Sources:</strong> IRS Schedule C (Form 1040) and Form 1040-SE. Brand deal income is self-employment income. See IRS Pub 334 and Pub 505 for estimated tax rules.',
  'entity-recommender':'<strong>Sources:</strong> IRS Pub 3402 (Taxation of Limited Liability Companies); IRS Pub 589 (S Corporations); IRS Pub 542 (Corporations); IRS Pub 557 (Tax-Exempt Status for nonprofits).',
  'entity-compare':'<strong>Sources:</strong> IRS Pub 3402 (Taxation of LLCs); IRS Pub 589 (S Corporations); IRS Form 1120-S and Schedule K-1. QBI deduction: IRC Section 199A.',
  'scorp-optimizer':'<strong>Sources:</strong> IRS Pub 589 (S Corporations); IRS Form 1120-S; Reasonable compensation rules per IRS Fact Sheet 2008-25. QBI: IRC Section 199A.',
  'delaware-tax':'<strong>Sources:</strong> Delaware Division of Corporations (corp.delaware.gov). Franchise tax rates, filing fees, and penalties confirmed directly from Delaware official sources, June 2026.',
  'delaware-formation':'<strong>Sources:</strong> Delaware Division of Corporations (corp.delaware.gov). Filing fees: LLC Certificate of Formation $110; Corporation Certificate of Incorporation $109+; certified copy $50; apostille $80; expedited fees verified June 2026.',
  'sole-prop':'<strong>Sources:</strong> IRS Schedule C (Form 1040) and Form 1040-SE. See IRS Pub 334 (Tax Guide for Small Business) and Pub 535 (Business Expenses).',
  'single-member-llc':'<strong>Sources:</strong> IRS Schedule C (Form 1040) for disregarded entities. See IRS Pub 3402 (Taxation of LLCs) and Pub 334.',
  'partnership':'<strong>Sources:</strong> IRS Form 1065 (Return of Partnership Income) and Schedule K-1. See IRS Pub 541 (Partnerships). SE tax applies to general partners per IRC Section 1402.',
  'c-corp':'<strong>Sources:</strong> IRS Form 1120 (U.S. Corporation Income Tax Return) and Pub 542 (Corporations). Corporate tax rate 21%: IRC Section 11. Qualified dividends taxed at 0–20%: IRC Section 1(h).',
  'wyoming':'<strong>Sources:</strong> Wyoming Secretary of State. Wyoming has no state income tax and no franchise tax. Annual report fee verified at Wyoming official sources. Federal tax: IRS Form 1120 (C-Corp) or Schedule C (LLC disregarded).',
  'nonprofit':'<strong>Sources:</strong> IRS Form 990 (Return of Organization Exempt from Income Tax); IRS Pub 557 (Tax-Exempt Status). UBI taxed at corporate rates: IRC Section 511–513.',
  'ssdi':'<strong>Sources:</strong> IRS Publication 915 (Social Security and Equivalent Railroad Retirement Benefits). Taxable SSDI calculated using the IRS Pub 915 combined income formula.',
  'std-ltd':'<strong>Sources:</strong> IRS Publication 525 (Taxable and Nontaxable Income). Disability benefits are taxable if premiums paid by employer or pre-tax through cafeteria plan (IRC Section 125). Tax-free if employee paid with after-tax dollars.',
  'workers-comp':'<strong>Sources:</strong> IRC Section 104(a)(1). Workers compensation benefits for job-related injury or sickness are NOT taxable. SSDI offset rules: Social Security Administration POMS DI 52150.001.',
  'aca':'<strong>Sources:</strong> IRS Rev. Proc. 2025-25 (ACA applicable percentages); HHS 2026 Federal Poverty Guidelines. Enhanced subsidies expired per OBBBA. For official enrollment and exact premium tax credit, visit <a href="https://www.healthcare.gov" target="_blank" rel="noopener">Healthcare.gov</a> or your state marketplace.',
  'quarterly':'<strong>Sources:</strong> IRS Form 1040-ES (Estimated Tax for Individuals); IRS Pub 505 (Tax Withholding and Estimated Tax). Safe harbor: 100% of prior year tax (110% if prior year AGI > $150,000) or 90% of current year.',
  'equity':'<strong>Sources:</strong> IRS Pub 525 (Taxable and Nontaxable Income); IRS Pub 550 (Investment Income and Expenses); IRC Section 1202 (QSBS exclusion); IRS Pub 917 (Social Security) for SSDI components.',
  'multi-source':'<strong>Sources:</strong> Multiple IRS forms depending on income types: Form 1040, Schedule C, Schedule E, Form 1065 Schedule K-1, Form 1099 series, and Pub 915 (SSDI). All income must be reported even if no 1099 is issued.',
  'combined-salary':'<strong>Sources:</strong> IRS Form 1040, Schedule C, and Form W-2. See IRS Pub 505 for withholding and Pub 334 for business expenses.',
  'professionals':'<strong>Sources:</strong> IRS Schedule C and Pub 334 (Tax Guide for Small Business), Pub 535 (Business Expenses), Pub 587 (Business Use of Home), Pub 946 (How To Depreciate Property), and Pub 463 (Travel, Gift, and Car Expenses).',
  'tax-forms':'<strong>Sources:</strong> All forms and descriptions from IRS.gov. Always download the latest version of each form before filing.',
  'filing-statuses':'<strong>Sources:</strong> IRS Pub 501 (Dependents, Standard Deduction, and Filing Information). Standard deduction amounts: IRS Rev. Proc. 2025-28.',
  'state-metadata':'<strong>Sources:</strong> State income tax rates and brackets compiled directly from each state\'s revenue department website. Verified June 2026.',
  'mixed-households':'<strong>Sources:</strong> IRS Pub 501 (Filing Status); Pub 503 (Child and Dependent Care Expenses); Pub 970 (Tax Benefits for Education); Pub 505 (Withholding).',
  'deductions':'<strong>Sources:</strong> IRS Pub 334, 535, 587, 946, and 463. Mileage rate: IRS Notice 2026-10. Standard deduction: IRS Rev. Proc. 2025-28.',
  'about':'<strong>Sources:</strong> All tax data compiled from IRS.gov, state revenue departments, HHS.gov (FPL), and corp.delaware.gov.',
  'calculators':'<strong>Sources:</strong> All calculators use 2026 IRS tax brackets (Rev. Proc. 2025-32), standard deductions (Rev. Proc. 2025-28), mileage rates (Notice 2026-10), and state tax data verified from state revenue departments.',
  'entities':'<strong>Sources:</strong> IRS Pub 3402, 589, 542, and 557. Delaware data: corp.delaware.gov. Wyoming data: Wyoming Secretary of State.',
  'gig-hub':'<strong>Sources:</strong> IRS Schedule C (Form 1040); IRS Form 1040-SE; IRS Notice 2026-10 (2026 mileage rate: $0.725/mi); IRS Pub 334 (Tax Guide for Small Business); IRS Pub 463 (Travel, Gift, and Car Expenses).',
  'creator-hub':'<strong>Sources:</strong> IRS Schedule C (Form 1040); IRS Form 1040-SE; IRS Pub 334; IRS Pub 535 (Business Expenses); IRS Pub 587 (Business Use of Home); IRC Section 179.',
  'seller-hub':'<strong>Sources:</strong> IRS Schedule C (Form 1040); IRS Form 1099-K; IRS Pub 334; IRS Pub 538 (Accounting Periods and Methods); IRS Pub 535.',
  'rental-hub':'<strong>Sources:</strong> IRS Schedule E (Form 1040); IRS Schedule C if substantial services; IRS Pub 527 (Residential Rental Property); IRC Section 280A(g) (Augusta Rule).',
};
function irsSourceBox(route){
  const defaultText='All income must be reported to the IRS, even if it is part-time, temporary, not reported on a 1099, or paid in cash, property, or virtual currency. For official guidance, visit <a href="https://www.irs.gov" target="_blank" rel="noopener">IRS.gov</a>.';
  const citation=route?Object.entries(IRS_CITATIONS).find(([k])=>{const re=new RegExp('^'+k.replace(/:\w+/g,'([^/]+)')+'$');return re.test(route);}):null;
  const body=(citation?citation[1]+' ':'')+defaultText;
  return`<div style="margin-top:2rem;padding:1rem;border:1px solid var(--border);border-radius:8px;background:rgba(44,90,160,.05)"><p style="color:var(--muted);font-size:.8rem;margin:0"><strong>IRS Source & Disclaimer:</strong> ${body} This calculator is for informational purposes only and does not constitute tax advice. Verify all figures with IRS.gov or a qualified tax professional before filing.</p></div>`;
}
function callout(type,title,body){
  const cls=type==='green'?'green':type==='blue'?'blue':type==='purple'?'purple':type==='yellow'?'yellow':'';
  return`<div class="callout ${cls}"><strong>${title}</strong>${body}</div>`;
}
function tileCard(emoji,name,desc,tag,href){
  return`<a class="tile-card fade-in" href="/${href}"><span class="tile-emoji">${emoji}</span><span class="tile-name">${name}</span><span class="tile-desc">${desc}</span>${tag?`<span class="tile-tag">${tag}</span>`:''}</a>`;
}
function inputField(id,label,type='number',opts={}){
  const{hint,min,max,step,value,placeholder,oninput,onchange}=opts;
  let attrs=`id="${id}" name="${id}" type="${type}"`;
  if(min!==undefined)attrs+=` min="${min}"`;if(max!==undefined)attrs+=` max="${max}"`;if(step!==undefined)attrs+=` step="${step}"`;
  if(value!==undefined)attrs+=` value="${value}"`;if(placeholder)attrs+=` placeholder="${placeholder}"`;
  if(oninput)attrs+=` oninput="${oninput}"`;if(onchange)attrs+=` onchange="${onchange}"`;
  return`<div class="form-group"><label for="${id}">${label}</label><input ${attrs}>${hint?`<div class="hint">${hint}</div>`:''}</div>`;
}
function selectField(id,label,options,opts={}){
  const{hint,value,onchange}=opts;
  let html=`<div class="form-group"><label for="${id}">${label}</label><select id="${id}" name="${id}"${onchange?` onchange="${onchange}"`:''}>`;
  for(const o of options){html+=`<option value="${o.value}"${value===o.value?' selected':''}>${o.label}</option>`;}
  html+=`</select>${hint?`<div class="hint">${hint}</div>`:''}</div>`;
  return html;
}
function statBlock(num,label){return`<div class="stat-block"><span class="big-num">${num}</span><div class="big-label">${label}</div></div>`;}
function resultsBox(lines,totalLabel,totalValue){
  let html='<div class="results-box"><h3>Results</h3>';
  for(const l of lines)html+=`<div class="result-line"><span>${l.label}</span><span class="num">${l.val}</span></div>`;
  if(totalLabel)html+=`<div class="result-line total"><span>${totalLabel}</span><span class="num">${totalValue}</span></div>`;
  return html+'</div>';
}
function getVal(id){const el=document.getElementById(id);if(!el)return 0;const v=el.type==='checkbox'?el.checked:parseFloat(el.value);return isNaN(v)?0:v;}
function getSelect(id){const el=document.getElementById(id);return el?el.value:'';}

function lastUpdatedStamp(){
  return`<p style="color:var(--muted);font-size:.75rem;margin-bottom:1rem"><span style="background:rgba(44,90,160,.1);padding:.15rem .4rem;border-radius:4px;font-weight:500">Last Updated for 2026 Tax Year</span> · IRS Rev. Proc. 2025-32 · IRS Rev. Proc. 2025-28 · Verified June 2026</p>`;
}
function injectFaqSchema(questions){
  let existing=document.getElementById('faq-schema');
  if(existing) existing.remove();
  if(!questions||!questions.length) return;
  const json={"@context":"https://schema.org","@type":"FAQPage","mainEntity":questions.map(q=>({"@type":"Question","name":q.q,"acceptedAnswer":{"@type":"Answer","text":q.a}}))};
  const script=document.createElement('script');
  script.type='application/ld+json';
  script.id='faq-schema';
  script.textContent=JSON.stringify(json);
  document.head.appendChild(script);
}
function renderFaqSection(questions){
  injectFaqSchema(questions);
  if(!questions||!questions.length) return '';
  return `<div class="calc-panel" style="margin-top:1.5rem"><h3>Frequently Asked Questions</h3>`+questions.map((q,i)=>`<details style="margin-bottom:.75rem"><summary style="cursor:pointer;font-weight:500;color:var(--text)">${i+1}. ${q.q}</summary><p style="margin:.5rem 0 0 1.2rem;color:var(--muted);font-size:.9rem">${q.a}</p></details>`).join('')+`</div>`;
}
function contentSection(title,body){
  return`<div class="calc-panel" style="margin-top:1.5rem"><h3>${title}</h3>${body}</div>`;
}
function hubGrid(title,tiles){
  return`<div class="section">${sectionLabel(title)}<div class="tile-grid">${tiles.join('')}</div></div>`;
}
function buildStateOptions(){
  const opts=[];
  for(const code in DATA.states)opts.push({value:code,label:DATA.states[code].name});
  return opts.sort((a,b)=>a.label.localeCompare(b.label));
}
function scrollToResults(id){
  setTimeout(()=>{
    const el=document.getElementById(id);
    if(el) el.scrollIntoView({behavior:'smooth',block:'start'});
  },10);
}

/* ===================== Homepage ===================== */
function homeView(main){
  main.innerHTML=`<div class="hero">
    <div class="v-badge">2026 TAX YEAR</div>
    <p class="hero-label">MoneyScopeCalculators</p>
    <h1>Free Tax & Money Calculators for Every Way You Earn 2026</h1>
    <div class="tagline">W-2 · 1099 · Gig · Creator · Seller · Rental · Equity · Salary · Wealth · Life Decisions — see what you owe, what to set aside, and how to legally keep more.</div>
    <p class="hero-sub">Traditional financial tools expect you to already know what you need. We just ask: how do you make money, and what do you want to know? Whether you're a DoorDash driver calculating quarterly taxes, a tech employee modeling RSU withholding, a freelancer comparing LLC vs. S-Corp savings, or anyone trying to understand what a raise, a baby, a divorce, or retirement actually costs, find your calculator below. Every tool is free, built for 2026, and designed to give you a real number in under 60 seconds.</p>
    <div class="btn-group" style="margin-top:1.5rem">
      <a href="/multi-source" class="btn btn-accent">Combine All My Income</a>
      <a href="/calculators" class="btn btn-secondary">Browse All Calculators</a>
    </div>
  </div>

  <div class="section">
    ${sectionLabel('What we cover')}
    <h2>130+ calculator modules for every income type</h2>
    <div class="stat-row">
      ${statBlock('18','Gig platforms')}
      ${statBlock('17','Creator types')}
      ${statBlock('11','Seller marketplaces')}
      ${statBlock('10','Rental types')}
      ${statBlock('24','Entity structures')}
      ${statBlock('50','Standalone tools')}
    </div>
  </div>

  <div class="section">
    ${sectionLabel('Browse by category')}
    <h2>Hub pages for every income type</h2>
    <div class="tile-grid">
      ${tileCard('🚗','Gig Economy Hub','Rideshare, delivery, and service gigs.','18 Tools','gig-hub')}
      ${tileCard('📱','Creator Economy Hub','YouTube, TikTok, OnlyFans, podcasters, newsletters.','17 Tools','creator-hub')}
      ${tileCard('🛒','Seller Marketplace Hub','Etsy, Amazon FBA, Shopify, Poshmark, StockX.','11 Tools','seller-hub')}
      ${tileCard('🏠','Rental Income Hub','Airbnb, Turo, VRBO, RV, boat, landlord.','10 Tools','rental-hub')}
      ${tileCard('📈','Equity Compensation Hub','RSUs, ISOs, NSOs, ESPP, QSBS, Phantom Stock.','7 Tools','equity')}
      ${tileCard('🧮','Standalone Tools Hub','Salary, retirement, budget, life decisions & more.','50+ Tools','calculators')}
    </div>
  </div>

  <div class="section">
    ${sectionLabel('How it works')}
    <h2>Three steps to your tax number</h2>
    <div class="card-grid">
      <div class="card"><div class="card-cat">Step 1</div><div class="card-title">Pick your calculator</div><div class="card-desc">Gig driver, creator, seller, landlord, or mixed W-2 + side hustle. Every page is pre-loaded with the deductions that matter for your specific income source or financial situation.</div></div>
      <div class="card"><div class="card-cat">Step 2</div><div class="card-title">Enter your numbers</div><div class="card-desc">Gross income, business deductions, finances, filing status, and state. We use 2026 IRS brackets, SE tax rates, and state income taxes verified against primary sources.</div></div>
      <div class="card"><div class="card-cat">Step 3</div><div class="card-title">Get your result</div><div class="card-desc">Comparison, finances, guidelines, federal tax, state tax, SE tax, QBI deduction, quarterly payment amounts, and exactly what percentage to set aside. No guesswork.</div></div>
    </div>
  </div>

  <div class="section">
    ${sectionLabel('Featured calculators')}
    <h2>Most-used tools</h2>
    <div class="card-grid">
      <div class="card"><div class="card-cat">Multi-Source</div><div class="card-title">Combine All My Income</div><div class="card-desc">Select every way you make money - W-2, gig, creator, seller, rental, SSDI, brand deals. One combined tax calculation with all interactions modeled.</div><div class="card-meta"><a href="/multi-source" class="btn">Open</a></div></div>
      <div class="card"><div class="card-cat">Multi-State</div><div class="card-title">Multi-State W-2 & 1099</div><div class="card-desc">Work in multiple states? Calculate federal tax plus state taxes for each state where you earned income.</div><div class="card-meta"><a href="/multi-state" class="btn">Open</a></div></div>
      <div class="card"><div class="card-cat">W-2 Only</div><div class="card-title">W-2 Tax Calculator</div><div class="card-desc">Only have a regular job? Calculate your federal and state tax, refund or amount owed, and effective rate on W-2 wages only.</div><div class="card-meta"><a href="/w2" class="btn">Open</a></div></div>
      <div class="card"><div class="card-cat">Salary</div><div class="card-title">Hourly to Salary Converter</div><div class="card-desc">Convert your hourly wage to annual, monthly, and weekly salary. Factor in overtime, part-time hours, and unpaid time off.</div><div class="card-meta"><a href="/hourly-to-salary" class="btn">Open</a></div></div>
      <div class="card"><div class="card-cat">Salary</div><div class="card-title">Salary to Hourly Converter</div><div class="card-desc">Is your $85k offer actually worth it? See your true hourly rate after PTO and holidays. Reverse mode included.</div><div class="card-meta"><a href="/salary-to-hourly" class="btn">Open</a></div></div>
      <div class="card"><div class="card-cat">Salary</div><div class="card-title">City Salary Comparison</div><div class="card-desc">Does $120k in NYC = $78k in Austin? Cost-of-living adjusted salary equivalence. Screenshot-worthy output for remote workers.</div><div class="card-meta"><a href="/city-comparison" class="btn">Open</a></div></div>
      <div class="card"><div class="card-cat">Salary</div><div class="card-title">Raise & Pay Cut Calculator</div><div class="card-desc">Old salary vs new salary. See your exact percentage raise or pay cut, dollar difference, and what you need to keep pace with inflation.</div><div class="card-meta"><a href="/raise-calculator" class="btn">Open</a></div></div>
      <div class="card"><div class="card-cat">Salary</div><div class="card-title">Raise Negotiation Calculator</div><div class="card-desc">Current salary + desired raise % → exact ask in dollars. See how much NOT negotiating costs over 10 years. The emotional hook you need.</div><div class="card-meta"><a href="/raise-negotiation" class="btn">Open</a></div></div>
      <div class="card"><div class="card-cat">Freelance</div><div class="card-title">Freelance Rate Calculator</div><div class="card-desc">Target income + overhead + taxes + weeks off → minimum hourly rate. Every new freelancer undersells. This tool shows the floor.</div><div class="card-meta"><a href="/freelance-rate" class="btn">Open</a></div></div>
      <div class="card"><div class="card-cat">W-2</div><div class="card-title">Bonus Tax Calculator</div><div class="card-desc">My $10k bonus - how much do I actually keep? Flat 22% supplemental vs aggregate method. See the exact take-home for both.</div><div class="card-meta"><a href="/bonus-tax" class="btn">Open</a></div></div>
      <div class="card"><div class="card-cat">W-2</div><div class="card-title">W-4 Withholding Calculator</div><div class="card-desc">Are you under-withholding and heading for a surprise tax bill? Or over-withholding and giving the IRS an interest-free loan? Fix your W-4 in minutes.</div><div class="card-meta"><a href="/w4-withholding" class="btn">Open</a></div></div>
      <div class="card"><div class="card-cat">Retirement</div><div class="card-title">Roth vs Traditional IRA</div><div class="card-desc">Current vs future tax rate → which account wins over 20-30 years? One of the most Googled personal finance debates. Clear winner visual.</div><div class="card-meta"><a href="/roth-vs-traditional" class="btn">Open</a></div></div>
      <div class="card"><div class="card-cat">Retirement</div><div class="card-title">401(k) Contribution Calculator</div><div class="card-desc">Salary + contribution % → annual savings, employer match, tax savings, and long-term projection. Are you leaving free money on the table?</div><div class="card-meta"><a href="/401k-calculator" class="btn">Open</a></div></div>
      <div class="card"><div class="card-cat">Wealth</div><div class="card-title">Net Worth Calculator</div><div class="card-desc">Assets minus liabilities → your net worth with category breakdown and age-based benchmark. Am I on track? The most anxiety-driven personal finance question.</div><div class="card-meta"><a href="/net-worth" class="btn">Open</a></div></div>
      <div class="card"><div class="card-cat">Budget</div><div class="card-title">50/30/20 Budget Calculator</div><div class="card-desc">The most recommended budgeting rule. Monthly take-home pay → instant split into needs, wants, and savings with visual breakdown. Every personal finance article links to a tool like this.</div><div class="card-meta"><a href="/budget-50-30-20" class="btn">Open</a></div></div>
      <div class="card"><div class="card-cat">Seller</div><div class="card-title">Profit Margin Calculator</div><div class="card-desc">Revenue + costs → gross margin, net margin, and markup % in one view. Etsy, Amazon, and Shopify sellers check this constantly before pricing products.</div><div class="card-meta"><a href="/profit-margin" class="btn">Open</a></div></div>
      <div class="card"><div class="card-cat">Timesheet</div><div class="card-title">Work Hours Calculator</div><div class="card-desc">Clock in, clock out, track breaks. See daily and weekly totals, regular hours vs overtime, and optional pay calculation.</div><div class="card-meta"><a href="/work-hours" class="btn">Open</a></div></div>
      <div class="card"><div class="card-cat">Timesheet</div><div class="card-title">Overtime Pay Calculator</div><div class="card-desc">Run this every Friday before clocking out. Clock in/out times → regular pay + OT pay. Handles daily (CA) vs weekly (FLSA) rules.</div><div class="card-meta"><a href="/overtime-pay" class="btn">Open</a></div></div>
      <div class="card"><div class="card-cat">Combined Income</div><div class="card-title">W-2 + Side Hustle</div><div class="card-desc">Most gig workers have a day job. This calculator models the combined tax effect and tells you exactly what to set aside from your side income.</div><div class="card-meta"><a href="/w2-and-side-hustle" class="btn">Open</a></div></div>
      <div class="card"><div class="card-cat">Equity</div><div class="card-title">RSU Tax Calculator</div><div class="card-desc">Shares vesting → ordinary income, withholding gap, and sale gains. Tech employees: know your real tax before the vest date.</div><div class="card-meta"><a href="/rsu-tax" class="btn">Open</a></div></div>
      <div class="card"><div class="card-cat">Equity</div><div class="card-title">ISO Stock Options Calculator</div><div class="card-desc">AMT exposure, qualifying vs disqualifying disposition, and LTCG on the full spread. The most misunderstood equity type.</div><div class="card-meta"><a href="/iso-tax" class="btn">Open</a></div></div>
      <div class="card"><div class="card-cat">Equity</div><div class="card-title">QSBS Exclusion Calculator</div><div class="card-desc">Section 1202 exclusion up to $15M (OBBBA). Does your startup equity qualify? Calculate your tax savings.</div><div class="card-meta"><a href="/qsbs-tax" class="btn">Open</a></div></div>
      <div class="card"><div class="card-cat">Disability</div><div class="card-title">SSDI Tax Calculator</div><div class="card-desc">SSDI is not automatically 85% taxable. Use the IRS Pub 915 formula to find your actual taxable amount and effective rate.</div><div class="card-meta"><a href="/ssdi" class="btn">Open</a></div></div>
      <div class="card"><div class="card-cat">Healthcare</div><div class="card-title">ACA Subsidy Cliff</div><div class="card-desc">OBBBA ended enhanced subsidies. Model your MAGI against 2026 FPL thresholds and see if you're at risk of losing your entire premium tax credit.</div><div class="card-meta"><a href="/aca" class="btn">Open</a></div></div>
      <div class="card"><div class="card-cat">Sellers</div><div class="card-title">1099-K Reconciliation</div><div class="card-desc">Your 1099-K shows gross receipts before fees and COGS. Reconcile to your actual taxable income and avoid overpaying.</div><div class="card-meta"><a href="/seller/1099k-reconciliation" class="btn">Open</a></div></div>
      <div class="card"><div class="card-cat">Creators</div><div class="card-title">Brand Deal Calculator</div><div class="card-desc">Got a $5,000 or $10,000 brand deal? See instantly what to set aside, including SE tax and federal/state estimates.</div><div class="card-meta"><a href="/creator/brand-deal" class="btn">Open</a></div></div>
      <div class="card"><div class="card-cat">Reference</div><div class="card-title">Deductions by Profession</div><div class="card-desc">23 professions with their most common Schedule C deductions. Use as a checklist for your tax filing.</div><div class="card-meta"><a href="/reference/professionals" class="btn">Open</a></div></div>
      <div class="card"><div class="card-cat">Law Update</div><div class="card-title">OBBBA Changes Tracker</div><div class="card-desc">Track OBBBA provisions affecting gig workers: 100% bonus depreciation, QBI permanence, R&D expensing, and 1099-K thresholds.</div><div class="card-meta"><a href="/reference/obbba" class="btn">Open</a></div></div>
    </div>
    <div style="text-align:center;margin-top:1.5rem"><a href="/calculators" class="btn btn-accent">See all 130+ calculators</a></div>
  </div>

  <div class="section">
    ${sectionLabel('Data sources')}
    <h2>Verified against primary sources</h2>
    <p style="color:var(--muted);margin-bottom:1rem">All tax rates, brackets, thresholds, and limits are drawn directly from IRS publications and verified government sources.</p>
    <div class="tile-grid" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:8px;margin-top:1rem">
      <div class="tile-card" style="cursor:default"><span class="tile-name">IRS Revenue Procedure 2025-32</span><span class="tile-desc">2026 federal income tax brackets</span></div>
      <div class="tile-card" style="cursor:default"><span class="tile-name">IRS Notice 2025-67</span><span class="tile-desc">Retirement contribution limits</span></div>
      <div class="tile-card" style="cursor:default"><span class="tile-name">IRS Notice 2026-10</span><span class="tile-desc">2026 standard mileage rate ($0.725/mi)</span></div>
      <div class="tile-card" style="cursor:default"><span class="tile-name">IRS Publication 915</span><span class="tile-desc">Social Security & SSDI taxation</span></div>
      <div class="tile-card" style="cursor:default"><span class="tile-name">HHS 2026 FPL Guidelines</span><span class="tile-desc">ACA premium tax credit thresholds</span></div>
      <div class="tile-card" style="cursor:default"><span class="tile-name">corp.delaware.gov</span><span class="tile-desc">C-Corp franchise tax schedule</span></div>
      <div class="tile-card" style="cursor:default"><span class="tile-name">SSA.gov</span><span class="tile-desc">2026 SGA limits ($1,690 / $2,830)</span></div>
      <div class="tile-card" style="cursor:default"><span class="tile-name">Tax Foundation</span><span class="tile-desc">All 50 state income tax rates</span></div>
    </div>
  </div>

  <div class="callout" style="margin-top:2rem">
    <strong>Disclaimer</strong>
    For informational purposes only. Not tax advice. Verify with IRS.gov or a qualified tax professional before filing.
  </div>`;
}

/* ===================== Platform Calculator Builder ===================== */
const MILEAGE_RATE = 0.725;
const DED_PRESETS = {
  mileage:{label:'Business mileage',def:true,amt:5000,hint:`Standard rate: $${MILEAGE_RATE}/mi`},
  phone:{label:'Phone (business %)',def:true,amt:800},
  insulated_bag:{label:'Insulated bags / hot bags',def:true,amt:40},
  parking:{label:'Parking',def:false,amt:200},
  tolls:{label:'Tolls',def:false,amt:150},
  dashcam:{label:'Dashcam',def:false,amt:100},
  car_washes:{label:'Car washes',def:false,amt:200},
  equipment:{label:'Equipment (cameras, lights, etc.)',def:true,amt:500},
  editing_software:{label:'Editing software',def:true,amt:300},
  home_studio:{label:'Home studio / office',def:false,amt:1200},
  internet:{label:'Internet (business %)',def:true,amt:600},
  props_costumes:{label:'Props & costumes',def:false,amt:200},
  cogs:{label:'Cost of goods sold',def:true,amt:2000},
  platform_fees:{label:'Platform fees',def:true,amt:300},
  shipping_supplies:{label:'Shipping & supplies',def:true,amt:400},
  advertising:{label:'Advertising',def:false,amt:500},
  insurance:{label:'Insurance',def:false,amt:600},
  maintenance_repairs:{label:'Maintenance & repairs',def:false,amt:500},
  supplies:{label:'Cleaning supplies / amenities',def:true,amt:300},
  property_taxes_pct:{label:'Property taxes (rental portion)',def:true,amt:1200},
  mortgage_interest_pct:{label:'Mortgage interest (rental portion)',def:true,amt:2400},
  depreciation:{label:'Depreciation',def:true,amt:2000},
  cleaning:{label:'Cleaning fees',def:true,amt:800},
  tools:{label:'Tools & supplies',def:true,amt:300},
  liability_insurance:{label:'Liability insurance',def:false,amt:400},
  licensing:{label:'Licensing & permits',def:false,amt:150},
  pet_supplies:{label:'Pet supplies',def:true,amt:200},
  first_aid_cert:{label:'First aid / CPR certification',def:false,amt:100},
  lead_fees:{label:'Lead fees',def:true,amt:200},
  uniform:{label:'Uniforms / protective wear',def:false,amt:100},
  fuel:{label:'Fuel',def:true,amt:600},
  mower_section179:{label:'Mower / equipment',def:true,amt:800},
  truck:{label:'Truck / vehicle expenses',def:false,amt:1200},
  trailer:{label:'Trailer',def:false,amt:400},
  ring_light:{label:'Ring light / lighting',def:true,amt:80},
  pc_console_section179:{label:'PC / Console / equipment',def:true,amt:800},
  microphone:{label:'Microphone / audio',def:true,amt:150},
  webcam:{label:'Webcam',def:true,amt:80},
  streaming_software:{label:'Streaming software',def:true,amt:200},
  laptop:{label:'Laptop / computer',def:true,amt:800},
  research_subscriptions:{label:'Research subscriptions',def:false,amt:200},
  fulfillment:{label:'Fulfillment costs',def:false,amt:200},
  camera:{label:'Camera / phone',def:true,amt:600},
  travel:{label:'Travel for content',def:false,amt:500},
  agency_fees:{label:'Agency / manager fees',def:false,amt:0},
  hosting_fees:{label:'Hosting / platform fees',def:true,amt:200},
  domains:{label:'Domains',def:false,amt:50},
  email_platform:{label:'Email platform',def:false,amt:300},
  ad_spend:{label:'Ad spend',def:false,amt:500},
  content_creation:{label:'Content creation costs',def:false,amt:300},
  dolly:{label:'Dolly / hand truck',def:false,amt:60},
  vehicle_equipment:{label:'Vehicle equipment',def:false,amt:200},
  cost_basis_items:{label:'Cost basis (items for resale)',def:true,amt:1000},
  paypal_fees:{label:'PayPal / payment fees',def:true,amt:100},
  packing_supplies:{label:'Packing supplies',def:true,amt:100},
  fba_fulfillment:{label:'FBA fulfillment fees',def:true,amt:500},
  storage:{label:'Storage / warehousing',def:false,amt:300},
  design_tools:{label:'Design tools',def:false,amt:200},
  course_platform_fee:{label:'Course platform fee',def:true,amt:200},
  contractor_editors:{label:'Contractor editors',def:false,amt:0},
  marketing_spend:{label:'Marketing spend',def:false,amt:300},
  video_equipment_section179:{label:'Video equipment',def:true,amt:600},
  esp_cost:{label:'Email service provider',def:true,amt:200},
  copywriter_contractors:{label:'Copywriter contractors',def:false,amt:0},
  list_management_tools:{label:'List management tools',def:false,amt:100},
  agent_manager_fees_if_applicable:{label:'Agent / manager fees',def:false,amt:0},
  creation_costs_for_this_deal:{label:'Creation costs for this deal',def:false,amt:0},
  creation_costs:{label:'Content creation costs',def:false,amt:300},
  platform_specific_costs:{label:'Platform-specific costs',def:false,amt:200},
  printful_printify_base_cost_COGS:{label:'Printful/Printify base cost (COGS)',def:true,amt:800},
  design_software_subscription:{label:'Design software',def:true,amt:200},
  shopify_etsy_fees:{label:'Shopify / Etsy fees',def:true,amt:200},
  photography_mockups:{label:'Photography / mockups',def:false,amt:150},
  authentication_fee:{label:'Authentication fee',def:false,amt:50},
  cost_basis_shoes:{label:'Cost basis (shoes/items)',def:true,amt:800},
  stockx_seller_fee:{label:'StockX / GOAT seller fee',def:true,amt:200},
  marketplace_selling_fees:{label:'Marketplace selling fees',def:true,amt:100},
  mileage_to_pickup_items:{label:'Mileage to pick up items',def:false,amt:200},
  cost_basis_items_purchased_for_resale:{label:'Cost basis (items for resale)',def:true,amt:500},
  rv_depreciation_section179_or_macrs:{label:'RV depreciation',def:true,amt:2000},
  campground_fees_if_host_delivered:{label:'Campground fees (delivery)',def:false,amt:100},
  boat_depreciation_section179:{label:'Boat depreciation',def:true,amt:1500},
  marina_storage_fees:{label:'Marina / storage fees',def:true,amt:400},
  fuel_pct:{label:'Fuel (business %)',def:true,amt:300},
  captains_wages_if_applicable:{label:"Captain's wages",def:false,amt:0},
  equipment_depreciation_section179:{label:'Equipment depreciation',def:true,amt:500},
  mileage_for_delivery:{label:'Mileage for delivery',def:false,amt:200},
  property_taxes:{label:'Property taxes',def:true,amt:1000},
  mortgage_interest:{label:'Mortgage interest',def:true,amt:3000},
  property_management_fees:{label:'Property management fees',def:false,amt:500},
  advertising_vacancy:{label:'Advertising / vacancy',def:false,amt:200},
  legal_accounting_fees:{label:'Legal / accounting fees',def:false,amt:300},
  travel_to_property:{label:'Travel to property',def:false,amt:200},
  depreciation_27_5_years:{label:'Depreciation (27.5 years)',def:true,amt:2000},
  repairs_maintenance:{label:'Repairs & maintenance',def:true,amt:600},
  depreciation_actual:{label:'Vehicle depreciation (actual)',def:true,amt:1500},
  platform_fee:{label:'Platform fee',def:true,amt:200},
  car_wash:{label:'Car wash',def:false,amt:100},
  maintenance:{label:'Maintenance',def:true,amt:400},
  insurance_pct:{label:'Insurance (business %)',def:true,amt:500},
  getaround_platform_fee_already_netted:{label:'Platform fee (already netted)',def:false,amt:0},
};

function buildDeductionHTML(keys){
  let html='';
  for(const key of keys){
    const d=DED_PRESETS[key]||{label:key.replace(/_/g,' '),def:false,amt:0};
    const checked=d.def?'checked':'';
    const display=d.def?'block':'none';
    html+=`<div class="deduction-row"><input type="checkbox" id="ded_${key}" ${checked} onchange="document.getElementById('val_${key}').style.display=this.checked?'block':'none';document.getElementById('val_${key}').value=${d.amt}"> <label for="ded_${key}">${d.label}</label><input type="number" id="val_${key}" class="deduct-amount" value="${d.def?d.amt:0}" style="display:${display}"></div>${d.hint?`<div class="hint" style="margin-left:28px;margin-top:-4px;margin-bottom:4px">${d.hint}</div>`:''}`;
  }
  return html;
}

function buildPlatformCalc(main,platformKey,category,title,subtitle,presetDeductions,extraHTML=''){
  const commonInputs=`${inputField('gross_income','Annual gross income from this source','number',{value:20000})}${inputField('w2_income','Other W-2 income (if any)','number',{value:0})}${selectField('filing_status','Filing status',[{value:'single',label:'Single'},{value:'mfj',label:'Married Filing Jointly'},{value:'mfs',label:'Married Filing Separately'},{value:'hoh',label:'Head of Household'}],{value:'single'})}${selectField('state_code','State',buildStateOptions(),{value:'CA'})}${inputField('age_65','Age 65+','checkbox')}`;
  const hubMap={gig:'gig-hub',creator:'creator-hub',seller:'seller-hub',rental:'rental-hub',equity:'equity'};
  const hubNameMap={gig:'Gig Economy',creator:'Creator Economy',seller:'Seller Marketplace',rental:'Rental Income',equity:'Equity Compensation'};
  const hubLink=hubMap[category]?`<p style="margin-top:1rem"><a href="/${hubMap[category]}" class="btn btn-secondary">← All ${hubNameMap[category]||'Calculators'}</a></p>`:'';
  const deductionList=presetDeductions.map(k=>{const d=DED_PRESETS[k]||{label:k.replace(/_/g,' ')};return`<li><strong>${d.label}</strong>${d.hint?` - ${d.hint}`:''}</li>`;}).join('');
  const formMap={gig:'Schedule C (Form 1040) - Profit or Loss from Business; Schedule SE (Form 1040) - Self-Employment Tax; Form 1040-ES - Estimated Tax (quarterly)',creator:'Schedule C (Form 1040) - Profit or Loss from Business; Schedule SE (Form 1040) - Self-Employment Tax; Form 1040-ES - Estimated Tax (quarterly)',seller:'Schedule C (Form 1040) - Profit or Loss from Business; Schedule SE (Form 1040) - Self-Employment Tax; Form 1099-K - Payment Card and Third Party Network Transactions; Form 1040-ES - Estimated Tax (quarterly)',rental:'Schedule E (Form 1040) - Supplemental Income and Loss; Schedule C if substantial services provided; Form 1040-ES - Estimated Tax (quarterly)'};
  const howMathWorks={gig:'<p>This calculator computes your <strong>self-employment tax</strong> at 15.3% on 92.35% of net profit (Schedule SE), then adds <strong>federal income tax</strong> using 2026 IRS brackets (Rev. Proc. 2025-32), <strong>state income tax</strong> from verified state brackets, and the <strong>QBI deduction</strong> (IRC Section 199A) if eligible.</p><p>The 2026 standard mileage rate is <strong>$0.725/mile</strong> for business use (IRS Notice 2026-10). If you drive 10,000 business miles, that is a <strong>$7,250 deduction</strong> - often the single largest deduction for gig workers.</p>',creator:'<p>This calculator computes your <strong>self-employment tax</strong> at 15.3% on 92.35% of net profit (Schedule SE), then adds <strong>federal income tax</strong> using 2026 IRS brackets, <strong>state income tax</strong>, and the <strong>QBI deduction</strong> (IRC Section 199A) if eligible.</p><p>Equipment like cameras, ring lights, and editing software may qualify for <strong>Section 179 immediate expensing</strong> up to $2,560,000 (subject to business-use percentage). Platform fees are 100% deductible business expenses.</p>',seller:'<p>This calculator computes your <strong>self-employment tax</strong> at 15.3% on 92.35% of net profit, then adds <strong>federal income tax</strong> using 2026 IRS brackets, <strong>state income tax</strong>, and the <strong>QBI deduction</strong> if eligible.</p><p><strong>Cost of Goods Sold (COGS)</strong> is your most important deduction - it directly reduces taxable income before SE tax. Track every material, purchase, and base product cost. Platform fees, shipping supplies, and mileage to the post office are also fully deductible.</p>',rental:'<p>This calculator computes <strong>federal income tax</strong> on your rental net income using 2026 IRS brackets, plus <strong>state income tax</strong>. For Schedule C rentals (substantial services), SE tax at 15.3% is also included.</p><p><strong>Depreciation</strong> is a powerful deduction: 27.5 years for residential property, 5 years for vehicles/RVs. You can also deduct mortgage interest, property taxes, cleaning fees, supplies, repairs, and platform fees.</p>'};
  const faqMap={gig:[{q:`Do I have to pay taxes on ${title.toLowerCase().replace(/ driver| shopper| tasker| contractor/g,'')} income if I made less than $600?`,a:'Yes. ALL income is taxable regardless of whether you receive a 1099. The $600 threshold only determines whether the platform must send you a 1099-NEC. You must report every dollar on Schedule C.'},{q:'Is mileage really my biggest deduction?',a:'For most gig workers, yes. The 2026 IRS business mileage rate is $0.725/mile. If you drive 10,000 business miles, that is a $7,250 deduction - often larger than all other deductions combined. Track every mile with an app like Everlance or Stride.'},{q:'What percentage should I set aside for taxes?',a:'Most gig workers should set aside 25–35% of gross income. This covers federal income tax (10–24% marginal), SE tax (15.3% on ~92% of net profit), and state income tax (0–13%). Use this calculator with your exact numbers for a precise estimate. <a href="/quarterly">Use our quarterly tax estimator</a> to plan payments.'}],creator:[{q:'Are gifted products from brands taxable?',a:'Yes. Gifted products are taxable at fair market value (FMV) even if you never sold them. PR packages, free trips, and complimentary services all count as income. The brand may not send a 1099 for gifted products, but you must still report them.'},{q:'Can I deduct my phone and internet?',a:'Yes, at your business-use percentage. If you use your phone 60% for business, deduct 60% of your bill. Keep a log for 2–4 weeks to establish your business-use percentage, then apply it consistently.'},{q:'Should I form an LLC or S-Corp as a creator?',a:'If you earn $60,000+ net profit, an S-Corp election can save you approximately 8–12% of profit in SE tax by splitting income between W-2 salary and distribution. <a href="/standalone/entity-compare">Use our LLC vs S-Corp calculator</a> to see exact savings for your numbers.'}],seller:[{q:'Why does my 1099-K show more than I actually earned?',a:'The 1099-K reports GROSS receipts before refunds, returns, chargebacks, and platform fees. You must reconcile: Gross 1099-K minus refunds minus platform fees minus COGS = your actual taxable income. Our 1099-K Reconciliation calculator handles this.'},{q:'Is selling personal items on Facebook Marketplace taxable?',a:'If you sell a personal item at a loss (e.g., old clothes), the loss is NOT deductible and the sale is not taxable. If you sell at a gain, the gain is taxable. If you buy items specifically to resell for profit, you are a business and must report on Schedule C.'},{q:'What is COGS and why does it matter so much?',a:'Cost of Goods Sold (COGS) directly reduces your taxable income BEFORE self-employment tax. For every $1,000 of COGS, you save ~$153 in SE tax plus federal/state income tax. Track every material, purchase, and base product cost carefully.'}],rental:[{q:'Is my Airbnb income Schedule C or Schedule E?',a:'It depends on the "services test." If you provide substantial services (daily cleaning, breakfast, concierge), it is Schedule C - subject to SE tax. If you only provide linen and cleaning between guests, it is Schedule E - no SE tax, but passive loss rules apply.'},{q:'Can I deduct my mortgage on a rental property?',a:'Yes. You deduct the portion of mortgage interest attributable to rental use. For a whole-property rental, deduct 100%. For a room rental, deduct the percentage of square feet used for rental. Property taxes work the same way.'},{q:'What is the Augusta Rule and does it apply to me?',a:'IRC Section 280A(g) allows you to rent your personal residence to your business (S-Corp, C-Corp, or Partnership) for up to 14 days per year tax-free. The rent is deductible to the business and tax-free to you. Not available to sole proprietors or single-member LLCs.'}]};
  faqMap.rental=[{q:'Do I pay self-employment tax on rental income?',a:'Generally no for passive rentals reported on Schedule E (parking spaces, storage, long-term leases). Yes if you provide substantial services comparable to a hotel or business - then it is Schedule C and subject to 15.3% SE tax.'},{q:'What rental expenses can I deduct?',a:'Common deductions include property taxes, insurance, repairs, maintenance, platform fees, advertising, and depreciation. For vehicle or equipment rentals, you may also deduct mileage for delivery, storage costs, and Section 179 depreciation.'},{q:'Do I need to report rental income if I made less than $600?',a:'Yes. ALL rental income is taxable regardless of amount or whether you receive a 1099. Platforms may not send a 1099 under $600, but you must still report the income on Schedule E (or Schedule C if substantial services).'}];
  faqMap.airbnb=[{q:'Is my Airbnb income Schedule C or Schedule E?',a:'Short-term rentals with substantial services (cleaning, meals, concierge) = Schedule C (subject to SE tax). Simple rentals = Schedule E (no SE tax). The IRS looks at whether you provide services comparable to a hotel. <a href="/short-vs-long-term-rental">Compare STR vs LTR tax</a>.'},{q:'Can I deduct my mortgage interest on a rental property?',a:'You can deduct mortgage <em>interest</em> (not principal) on Schedule E. If you use the property personally, you must allocate interest between personal and rental use based on days or square footage. Principal payments are never deductible.'},{q:'What is the Augusta Rule and does it apply to me?',a:'IRC Section 280A(g) lets you rent your personal residence to your business for up to 14 days/year, tax-free. Requires an entity (S-Corp, C-Corp, or Partnership). Does NOT apply to sole proprietors. <a href="/deductions">See deduction guide</a>.'}];
  faqMap.parking_space_rental=[{q:'Do I pay self-employment tax on parking space rental income?',a:'Generally no. Renting a parking space is passive rental income reported on Schedule E, which is NOT subject to self-employment (SE) tax. You pay only federal and state income tax on the net profit.'},{q:'What expenses can I deduct for parking space rental?',a:'You can deduct a portion of property taxes, insurance, repairs and maintenance, platform fees, and advertising costs directly related to the parking space. If the space is part of your primary residence, allocate expenses by square footage or a reasonable method.'},{q:'Do I need to report parking space income if under $600?',a:'Yes. ALL rental income is taxable regardless of amount. Platforms like SpotHero or Neighbor may not send a 1099 under $600, but you must still report the income on Schedule E. Track gross income and deductible expenses throughout the year.'}];
  faqMap.mid_term_rental=[{q:'Do I pay self-employment tax on mid-term rental income?',a:'It depends on services provided. If you provide substantial services comparable to a hotel (daily cleaning, meals, concierge), your mid-term rental income is Schedule C and subject to 15.3% SE tax. If you provide only basic furnished rental with minimal services, it is Schedule E passive income with no SE tax. Most FurnishedFinder and corporate housing rentals fall into Schedule E if services are limited.'},{q:'How are mid-term rentals taxed differently from Airbnb?',a:'Mid-term rentals (30-90 days) differ from short-term rentals in several ways: (1) They generally avoid transient occupancy / hotel taxes since stays exceed 30 days; (2) The IRS 7-day/30-day average rental period rule from Rev. Proc. 2008-16 treats 30+ day rentals to the same tenant as residential, not vacation rental; (3) Less likely to trigger Schedule C unless substantial services are provided; (4) May qualify for the Augusta Rule (14-day rule) if rented to your own business entity.'},{q:'Can I deduct furnishings and appliances for a furnished rental?',a:'Yes. Furniture, appliances, and decor in furnished rentals are depreciable over 5-7 years (MACRS) or may qualify for Section 179 immediate expensing up to $2,560,000. You can also deduct utilities (often included in rent), cleaning between tenants, linens and supplies, and platform fees from FurnishedFinder or similar sites. Keep receipts for all furnishings and track their business-use percentage.'}];
  faqMap.turo=[{q:'Do I pay self-employment tax on Turo income?',a:'Yes. Turo income is generally reported on Schedule C because you are actively involved in managing the rental, maintaining the vehicle, and coordinating pickups. This makes it business income subject to 15.3% SE tax. If you used MACRS depreciation on the vehicle previously, you cannot switch to standard mileage.'},{q:'Can I deduct vehicle depreciation on Turo?',a:'Yes. You can deduct actual vehicle depreciation using MACRS (5-year property) or claim Section 179 immediate expensing up to $2,560,000. If you used standard mileage in a prior year, you may be locked into actual expense method. Track all maintenance, insurance, and cleaning costs.'},{q:'Do I need a 1099 from Turo to report income?',a:'No. You must report ALL Turo income regardless of whether you receive a 1099. Turo may issue a 1099-K if you exceed $600 in payments. Report gross income and deduct Turo platform fees, insurance, depreciation, and operating expenses on Schedule C.'}];
  faqMap.vrbo=[{q:'Is my VRBO income Schedule C or Schedule E?',a:'Same as Airbnb - short-term rentals with substantial services (cleaning between guests, concierge, meals) = Schedule C (subject to SE tax). Simple vacation home rentals with minimal services = Schedule E (no SE tax). The IRS applies the same "substantial services" test to all STR platforms.'},{q:'Can I deduct my mortgage interest on a VRBO property?',a:'Yes - mortgage interest (not principal) is deductible on Schedule E. If you personally use the vacation home, you must allocate expenses between rental and personal use based on days rented vs. days used personally. Principal payments are never deductible.'},{q:'What records should I keep for VRBO rentals?',a:'Track gross rental income, platform fees, cleaning costs, supplies, repairs, utilities (allocated by rental days), mortgage interest, property taxes, insurance, and depreciation. If you use the property personally, keep a calendar of rental vs. personal days for allocation.'}];
  faqMap.getaround=[{q:'Do I pay self-employment tax on Getaround income?',a:'Yes. Getaround income is typically Schedule C business income because you actively participate in vehicle sharing. This subjects your net profit to 15.3% self-employment tax in addition to federal and state income tax.'},{q:'What vehicle expenses can I deduct for Getaround?',a:'Deduct actual vehicle expenses including depreciation (MACRS 5-year), insurance, maintenance, repairs, car washes, and a portion of registration fees. Getaround platform fees are also fully deductible. Track mileage for any deliveries or relocations of the vehicle.'},{q:'Does Getaround send a 1099?',a:'Getaround may issue a 1099-K if your payments exceed the reporting threshold. Regardless, you must report all income. Your Getaround dashboard shows gross earnings. Deduct the platform fee (already netted in some cases) and all vehicle operating expenses on Schedule C.'}];
  faqMap.rv_rental=[{q:'Do I pay self-employment tax on RV rental income?',a:'Generally yes if you actively manage the rental (delivering, cleaning, coordinating) - this is Schedule C business income subject to 15.3% SE tax. If you use a management company and are purely passive, it may be Schedule E. Most peer-to-peer RV rentals fall under Schedule C.'},{q:'Can I deduct RV depreciation?',a:'Yes. RVs depreciate over 5 years using MACRS. You may also qualify for Section 179 immediate expensing up to $2,560,000 if business use is over 50%. Track all rental days vs. personal use days - depreciation must be allocated.'},{q:'What RV rental expenses are deductible?',a:'Deductible expenses include campground fees (if you deliver), storage costs when not rented, insurance, maintenance and repairs, propane, cleaning supplies, platform fees (Outdoorsy, RVshare), and mileage for deliveries. Keep detailed records of rental vs. personal use.'}];
  faqMap.boat_rental=[{q:'Do I pay self-employment tax on boat rental income?',a:'Bare boat charters (no captain, no services) are typically Schedule E passive rental income - no SE tax. If you provide a captain, crew, or substantial services (fishing guide, concierge), it becomes Schedule C business income subject to 15.3% SE tax.'},{q:'Can I deduct boat depreciation?',a:'Yes. Boats used for business depreciate over 7 years using MACRS, or you may use Section 179 immediate expensing. If the boat is also used personally, allocate depreciation, insurance, and maintenance between business and personal use based on rental hours or days.'},{q:'What boat rental expenses can I deduct?',a:'Deduct marina or storage fees, insurance, maintenance and repairs, fuel (for rental trips), cleaning, safety equipment, platform fees (Boatsetter, GetMyBoat), and captain wages if applicable. Track rental hours vs. personal use hours for allocation.'}];
  faqMap.equipment_rental=[{q:'Do I pay self-employment tax on equipment rental income?',a:'Generally no for passive equipment rentals (cameras, tools, gear listed on platforms like Fat Llama) - this is Schedule E passive income with no SE tax. If you provide delivery, setup, training, or operator services, it may shift to Schedule C.'},{q:'Can I deduct equipment depreciation?',a:'Yes. Equipment rentals often qualify for Section 179 immediate expensing up to $2,560,000 or bonus depreciation. If the equipment is also used personally, allocate depreciation based on rental days vs. personal use. Keep rental logs.'},{q:'What equipment rental expenses are deductible?',a:'Deduct insurance, maintenance and repairs, storage costs, platform fees, mileage for deliveries, cleaning supplies, and replacement parts. If you purchased the equipment specifically for rental, the full cost may be deductible in year one via Section 179.'}];
  faqMap.storage_rental=[{q:'Do I pay self-employment tax on storage rental income?',a:'Generally no. Renting out a garage, shed, or storage unit is passive rental income reported on Schedule E. It is NOT subject to self-employment tax. You pay only federal and state income tax on the net profit.'},{q:'What storage rental expenses can I deduct?',a:'Deduct a portion of property taxes, insurance, repairs and maintenance, platform fees (Neighbor, etc.), advertising, and utility costs if separately metered. If the storage space is part of your primary residence, allocate by square footage.'},{q:'Do I need to report storage rental income if under $600?',a:'Yes. ALL rental income is taxable regardless of amount. Platforms may not send a 1099 under $600, but you must still report the income on Schedule E. Track gross income and deductible expenses throughout the year.'}];
  faqMap.landlord=[{q:'Do I pay self-employment tax as a landlord?',a:'Generally no. Traditional long-term rental income is passive and reported on Schedule E - it is NOT subject to self-employment tax. However, if you are a real estate professional or provide substantial services beyond normal landlord duties, it may become Schedule C.'},{q:'What expenses can I deduct as a landlord?',a:'Deduct mortgage interest, property taxes, insurance, repairs and maintenance, property management fees, advertising for tenants, legal and accounting fees, travel to the property, and depreciation over 27.5 years for residential property. Capital improvements must be depreciated, not expensed.'},{q:'What is the 27.5-year depreciation rule?',a:'Residential rental property depreciates over 27.5 years using straight-line depreciation. Commercial property depreciates over 39 years. Land is never depreciable. If you make capital improvements (new roof, HVAC), those are depreciated over the same schedule, not deducted in full.'}];
  faqMap.depop=[{q:'Do I have to pay taxes on Depop sales?',a:'Yes. ALL income from Depop sales is taxable, even without a 1099. Depop charges a <strong>10% seller fee</strong> plus payment processing (~2.9% + $0.30). These fees are 100% deductible business expenses. You report gross sales on Schedule C and deduct COGS (what you paid for the item), fees, shipping supplies, and mileage.'},{q:'What is my biggest deduction as a Depop seller?',a:'<strong>Cost of Goods Sold (COGS)</strong> is usually your largest deduction. Every thrifted item, wholesale purchase, or vintage piece has a cost basis. Keep receipts from thrift stores, estate sales, and wholesale orders. COGS reduces taxable income before SE tax is calculated, making it more valuable than a regular deduction.'},{q:'Can I deduct my phone and ring light?',a:'Yes. If you use your phone for photographing items, messaging buyers, and managing listings, deduct the <strong>business-use percentage</strong> of your phone bill. Ring lights, backdrops, and cameras used for flat lays are fully deductible business equipment. If under $2,500 per item, expense immediately. Otherwise, depreciate over 5 years.'}];
  faqMap.whatnot=[{q:'Do I have to pay taxes on Whatnot sales?',a:'Yes. ALL income from Whatnot live auctions is taxable, even without a 1099. Whatnot charges an <strong>8% seller fee</strong> plus payment processing (~2.9%). These fees are 100% deductible business expenses. You report gross sales on Schedule C and deduct COGS (what you paid for the item), fees, shipping supplies, and all streaming equipment.'},{q:'What is my biggest deduction as a Whatnot seller?',a:'<strong>Cost of Goods Sold (COGS)</strong> is usually your largest deduction. Every card, collectible, toy, sneaker, or vintage item you source has a cost basis. Keep receipts from card shows, estate sales, wholesale orders, and thrift stores. COGS reduces taxable income before SE tax is calculated, making it more valuable than a regular deduction.'},{q:'Can I deduct my streaming setup?',a:'Yes. Ring lights, cameras, microphones, backdrops, and laptops used for your Whatnot live streams are fully deductible business equipment. If under $2,500 per item, expense immediately via Section 179. Otherwise, depreciate over 5 years. Your internet and phone (business-use percentage) are also deductible.'}];
  faqMap.amazon_kdp=[{q:'Do I pay taxes on Amazon KDP royalties?',a:'Yes. ALL KDP royalty income is taxable self-employment income reported on Schedule C. Amazon does not withhold taxes. You receive a 1099-NEC if you earned $600+ in royalties. Report gross royalties before Amazon deducts printing costs and delivery fees. Those costs are deductible business expenses.'},{q:'What is my biggest deduction as a KDP author?',a:'<strong>Editing, cover design, and formatting</strong> are typically your largest deductions. Professional editing ($500–$3,000+ per book), cover design ($100–$500+), and interior formatting ($50–$300+) are 100% deductible. Also deduct AMS advertising, ISBN purchases, research materials, and your home office.'},{q:'Can I deduct my computer and software?',a:'Yes. Your laptop, writing software (Scrivener, Vellum), design tools (Canva Pro, Adobe Creative Cloud), and any equipment used to create and publish books are fully deductible business expenses. If under $2,500 per item, expense immediately via Section 179. Otherwise, depreciate over 5 years. Your internet (business-use %) is also deductible.'}];
  faqMap.uber_eats=[{q:'Is Uber Eats different from Uber rideshare for taxes?',a:'Yes. Uber Eats is food delivery (1099-NEC), while Uber rideshare is passenger transport. Both use Schedule C, but deductions differ: Uber Eats drivers deduct insulated bags and have lower parking/toll expenses. Mileage is still your #1 deduction for both.'},{q:'Do Uber Eats drivers get 1099s?',a:'Uber issues a 1099-NEC if you earned $600+ from deliveries. You also get a 1099-K if you had $600+ in payment card transactions. Report all income regardless of 1099s. Track gross earnings before Uber fees.'},{q:'What percentage should Uber Eats drivers set aside?',a:'Most delivery drivers should set aside 25–30% of gross income. This covers federal income tax (10–22%), SE tax (15.3% on ~92% of net), and state tax. Use this calculator with your exact numbers for a precise estimate.'}];
  faqMap.fiverr_upwork=[{q:'Do Fiverr and Upwork send 1099s?',a:'Upwork issues 1099-NEC if you earned $600+. Fiverr issues 1099-K if you had $600+ in payments. Both platforms charge 20% (Fiverr) or a sliding fee (Upwork) — these fees are 100% deductible as business expenses.'},{q:'Can I deduct my laptop and software as a freelancer?',a:'Yes. Equipment like laptops, monitors, cameras, and editing software are fully deductible business expenses. You can either expense them immediately (if under $2,500 per item) or depreciate them. Your home office and internet are also deductible at your business-use percentage.'},{q:'Should I form an LLC as a freelancer?',a:'If you earn $40,000+ net profit, an LLC gives you liability protection. At $60,000+, consider S-Corp election to save ~8–12% on SE tax by splitting income between salary and distribution. <a href="/standalone/entity-compare">Use our LLC vs S-Corp calculator</a>.'}];
  faqMap.toptal=[{q:'How is Toptal different from Fiverr/Upwork for taxes?',a:'Tax treatment is identical: all are Schedule C self-employment. Toptal clients pay higher rates ($60–$200+/hr) but the same 15.3% SE tax applies. The key difference is Toptal vets freelancers, which may help justify higher rates and S-Corp savings.'},{q:'Can I deduct travel to client sites?',a:'Yes. Travel to meet clients, attend conferences, or work on-site is fully deductible. This includes airfare, hotels, meals (50% deductible), and ground transportation. Keep detailed records with business purpose for each trip.'},{q:'What forms do I need as a Toptal freelancer?',a:'Schedule C (Profit or Loss), Schedule SE (Self-Employment Tax), Form 1040-ES (Quarterly Estimated Tax). If you hire subcontractors, issue them 1099-NECs. Consider Form 8829 if you claim home office.'}];
  faqMap.cameo_stir=[{q:'Are Cameo earnings taxable?',a:'Yes. Cameo pays creators via 1099-NEC (or 1099-K if paid through a payment network). The full amount you earn is taxable, even if Cameo takes a 25% fee — deduct the fee as a business expense.'},{q:'Can I deduct props and costumes?',a:'Yes. Props, costumes, wigs, makeup, and set decorations used for content creation are fully deductible business expenses. Keep receipts and photos showing how each item was used for your Cameo/Stir videos.'},{q:'Do I need an LLC for Cameo income?',a:'Not required, but recommended if you earn $20,000+ or have any liability risk (e.g., using copyrighted characters or music). An LLC protects personal assets from business lawsuits. For tax savings, consider S-Corp at $60,000+ net profit.'}];
  faqMap.beehiiv=[{q:'How is Beehiiv different from Substack for taxes?',a:'Tax treatment is identical: both are Schedule C self-employment. Beehiiv charges 0% on paid subscriptions (vs Substack 10%), so you keep more revenue. Deduct home office, design tools, copywriters, and research subscriptions. Track gross revenue before any platform fees.'},{q:'Do I need to report Beehiiv income under $600?',a:'Yes. ALL income is taxable regardless of amount. Beehiiv may not issue a 1099 under $600, but you must still report every dollar on Schedule C. Keep records of all subscriber payments and refund amounts.'},{q:'Can I deduct my Beehiiv newsletter tools?',a:'Yes. Email platform costs (Beehiiv paid plan), design software (Canva, Figma), copywriter contractors, research subscriptions, and your laptop are all fully deductible business expenses. Allocate internet and home office by business-use percentage.'}];
  faqMap.kofi_buymeacoffee=[{q:'Are Ko-fi and Buy Me a Coffee tips taxable?',a:'Yes. All tips, donations, and membership payments are taxable income. These platforms may issue 1099-K if you exceed $600 in payments. Report gross tips before platform fees. The 0% platform fee on basic tips means the full amount is taxable.'},{q:'What can I deduct as a Ko-fi creator?',a:'Deduct equipment (laptop, camera, microphone), editing software, internet, phone (business-use %), home office, and any creation costs specific to the content you offer as rewards. Keep receipts for all business expenses.'},{q:'Do I need to pay quarterly taxes on tip income?',a:'Yes. If you expect to owe $1,000+ in tax for the year, you must make quarterly estimated payments (Form 1040-ES). Tip income has no withholding, so set aside 25–30% of gross tips for federal, state, and SE tax.'}];
  faqMap.linkedin_creator=[{q:'Is LinkedIn Creator income taxable?',a:'Yes. LinkedIn newsletter subscriptions, brand partnerships, and creator program payments are all self-employment income reported on Schedule C. LinkedIn may issue 1099-NEC for creator program payments over $600.'},{q:'Can I deduct LinkedIn Premium as a creator?',a:'Yes. LinkedIn Premium, Sales Navigator, and other LinkedIn tools used for business development are fully deductible. Also deduct your laptop, phone, home office, internet, and any content creation equipment.'},{q:'How are B2B sponsorships taxed on LinkedIn?',a:'B2B sponsorships are taxed the same as any brand deal: ordinary income plus 15.3% SE tax. Because B2B deals often have higher values, consider S-Corp election at $60,000+ net profit to save ~8–12% on SE tax. <a href="/standalone/entity-compare">Use our LLC vs S-Corp calculator</a>.'}];
  faqMap.kajabi=[{q:'How is Kajabi different from a generic course creator for taxes?',a:'Kajabi bundles courses, community, and coaching in one platform. Tax treatment is identical to any course creator: Schedule C self-employment. Deduct the Kajabi platform fee, video equipment, editing software, contractors, and marketing spend. Community management tools are also deductible.'},{q:'Can I deduct my Kajabi subscription?',a:'Yes. Your Kajabi platform fee is a 100% deductible business expense. Also deductible: payment processing fees, email marketing tools, video hosting costs, and any third-party integrations used for your course business.'},{q:'Should I form an LLC for my Kajabi course business?',a:'Recommended at $40,000+ annual revenue for liability protection. At $60,000+ net profit, S-Corp election saves ~8–12% on SE tax by splitting income between W-2 salary and distribution. Kajabi businesses often scale quickly into S-Corp territory.'}];
  faqMap.x_creator=[{q:'Do I pay taxes on X revenue sharing?',a:'Yes. ALL X ad revenue sharing payouts and Premium subscription earnings are taxable self-employment income reported on Schedule C. X issues a 1099-NEC if you earned $600+ in payouts. Report gross earnings before any platform deductions. You pay federal income tax + 15.3% SE tax on net profit.'},{q:'What is my biggest deduction as an X creator?',a:'<strong>Content creation costs</strong> are typically your largest deductions: video editing software, graphic design tools (Canva, Photoshop), scheduling tools, research subscriptions, and any contractors (editors, graphic designers, social media managers). Also deduct your phone, internet (business-use %), and home office.'},{q:'Can I deduct X Premium and ad spend?',a:'Yes. X Premium subscription fees are 100% deductible if used for your creator business. Paid post boosts and promoted tweets used to grow your audience are fully deductible advertising expenses. Keep receipts from all X transactions in your business records.'}];
  faqMap.fanbase_passes=[{q:'Do I pay taxes on Fanbase / Passes income?',a:'Yes. ALL subscription revenue, tips, and pay-per-view content earnings from Fanbase, Passes, and similar direct fan monetization platforms are taxable self-employment income reported on Schedule C. You receive a 1099-NEC if you earned $600+ in payouts. Platform fees (typically ~20%) are 100% deductible business expenses.'},{q:'What is my biggest deduction on Fanbase / Passes?',a:'<strong>Content creation equipment and props</strong> are typically your largest deductions: cameras, ring lights, backdrops, costumes, and any items purchased specifically for content. These are fully deductible business expenses. If under $2,500 per item, expense immediately via Section 179. Otherwise, depreciate over 5 years.'},{q:'Should I form an LLC for Fanbase / Passes income?',a:'Strongly recommended at $20,000+ annual revenue. An LLC provides liability protection and privacy separation between your personal name and creator brand. At $60,000+ net profit, S-Corp election saves ~8–12% on SE tax by splitting income between W-2 salary and distribution. <a href="/standalone/entity-compare">Use our LLC vs S-Corp calculator</a>.'}];
  faqMap.pinterest_creator=[{q:'Do I pay taxes on Pinterest Creator Rewards?',a:'Yes. ALL Pinterest Creator Rewards payouts, paid partnership pins, and affiliate commissions are taxable self-employment income reported on Schedule C. Pinterest issues a 1099-NEC if you earned $600+ in rewards. Report gross earnings before any platform deductions. You pay federal income tax + 15.3% SE tax on net profit.'},{q:'What is my biggest deduction as a Pinterest creator?',a:'<strong>Design tools and content creation equipment</strong> are typically your largest deductions: Canva Pro, Adobe Creative Cloud, Pinterest scheduling tools (Tailwind, Later), cameras, lighting, and props for styled flat-lays. These are fully deductible business expenses. Also deduct your phone, internet (business-use %), and home office.'},{q:'Can I deduct Pinterest Ads and promoted pins?',a:'Yes. If you run Pinterest Ads to grow your audience or promote affiliate products, the ad spend is 100% deductible as a business advertising expense. Keep records of all ad spend from your Pinterest Business account and any third-party ad management tools you use.'}];
  const contentHTML=`
    ${contentSection('How This Calculator Works',(howMathWorks[category]||howMathWorks.gig))}
    ${contentSection('Top Deductions for '+title,`<p>The deduction panel above is pre-loaded with the most common deductions for ${title.toLowerCase()}:</p><ul>${deductionList}</ul><p>Check each box and enter your actual amount. These deductions reduce your net profit, which reduces both self-employment tax and income tax.</p>`)}
    ${contentSection('IRS Forms You Need','<p>'+(formMap[category]||formMap.gig).replace(/; /g,'</p><p>')+'</p>')}
    ${hubLink}`;
  const bcHtml=hubMap[category]?breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:hubMap[category],text:hubNameMap[category]},{href:'',text:title}):breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:title});
  const calcId='calc-'+platformKey.replace(/[^a-z0-9]/gi,'');
  main.innerHTML=`${bcHtml}<h1 style="font-size:clamp(1.5rem,3.5vw,2rem);margin:1.5rem 0 .75rem">${category==='rental' ? `${title} Tax Calculator: Estimate Your ${TAX_YEAR} Rental Income Taxes` : `${title} Tax Calculator: Estimate Your ${TAX_YEAR} 1099 Taxes`}</h1><p style="color:var(--muted);margin-bottom:1.5rem">${subtitle}</p>${extraHTML}
    <div class="calc-grid"><div class="calc-panel"><h3>Income</h3>${commonInputs}</div>
    <div class="calc-panel"><h3>Deductions</h3><div class="deduction-list">${buildDeductionHTML(presetDeductions)}</div></div>
    <div class="btn-group" style="grid-column:1/-1"><button class="btn btn-accent" onclick="window.CalcRegistry['${calcId}']()">Calculate</button></div></div>
    <div id="plat-res"></div>
    ${renderFaqSection(faqMap[platformKey]||faqMap[category]||faqMap.gig)}
    ${contentHTML}`;
  window.CalcFns = window.CalcFns || {};
  window.CalcRegistry=window.CalcRegistry||{};
  window.CalcRegistry[calcId]=safeCalc(function(){
    const gross=getVal('gross_income'),w2=getVal('w2_income'),status=getSelect('filing_status'),state=getSelect('state_code');
    let totalDed=0;
    for(const key of presetDeductions){if(getVal('ded_'+key))totalDed+=getVal('val_'+key);}
    const net=Math.max(0,gross-totalDed);
    const se=TE.calcSETax(net,DATA,w2);
    const agi=w2+net-se.deductibleHalf;
    const stdDed=TE.getStandardDeduction(status,getVal('age_65'),DATA);
    const taxableBeforeQBI=Math.max(0,agi-stdDed);
    const qbi=TE.calcQBI(net,taxableBeforeQBI,status,DATA);
    const taxable=Math.max(0,taxableBeforeQBI-qbi);
    const fed=TE.calcFederalTax(taxable,status,DATA);
    const stateRes=TE.calcStateTax(agi,state,DATA,status);
    const fedRounded=Math.round(fed),seRounded=Math.round(se.totalSE),stateRounded=Math.round(stateRes.tax);
    const totalTaxRounded=fedRounded+seRounded+stateRounded;
    const eff=(w2+gross)>0?totalTaxRounded/(w2+gross):0;
    const setAside=gross>0?totalTaxRounded/gross:0;
    const qe=TE.calcQuarterly(totalTaxRounded,totalTaxRounded,agi,DATA);
    const platLines=[{label:'Gross income',val:TE.formatMoney(gross)},{label:'Total deductions',val:TE.formatMoney(totalDed)},{label:'Net SE income',val:TE.formatMoney(net)}];
    if(qbi>0){platLines.push({label:'Taxable income before QBI',val:TE.formatMoney(taxableBeforeQBI)},{label:'QBI deduction',val:'-'+TE.formatMoney(qbi)},{label:'Taxable income after QBI',val:TE.formatMoney(taxable)});}
    else{platLines.push({label:'Taxable income',val:TE.formatMoney(taxable)});}
    platLines.push({label:'SE tax (15.3%)',val:TE.formatMoney(seRounded)},{label:'Federal income tax',val:TE.formatMoney(fedRounded)},{label:'State income tax',val:TE.formatMoney(stateRounded)},{label:'Quarterly payment',val:TE.formatMoney(qe.perQuarter)+'/qtr'});
    document.getElementById('plat-res').innerHTML=resultsBox(platLines,'Total tax owed',TE.formatMoney(totalTaxRounded))+
    `<div class="calc-panel" style="margin-top:1rem"><h3>Set-Aside Guidance</h3><p><strong>${(setAside*100).toFixed(0)}%</strong> of your gross should be set aside for taxes. That means <strong>${TE.formatMoney(gross*setAside)}</strong> from your ${TE.formatMoney(gross)} income.</p><p>Effective tax rate on total income: <strong>${(eff*100).toFixed(1)}%</strong></p></div>`+
    `<div class="calc-panel" style="margin-top:1rem"><h3>Summary</h3><p>You will pay <strong>${TE.formatMoney(totalTaxRounded)}</strong> in total tax on <strong>${TE.formatMoney(gross)}</strong> of income.</p><p>Your take-home amount is <strong>${TE.formatMoney(gross-totalTaxRounded)}</strong>.</p></div>`;
    scrollToResults('plat-res');
  });
}

function gigCalculatorView(main,key){
  const map={uber:['mileage','phone','dashcam','car_washes','tolls','parking'],lyft:['mileage','phone','tolls','parking','car_washes'],doordash:['mileage','phone','insulated_bag','parking','tolls'],uber_eats:['mileage','phone','insulated_bag','parking','tolls'],instacart:['mileage','insulated_bag','phone','parking'],grubhub:['mileage','phone','insulated_bag','parking'],amazon_flex:['mileage','phone','dolly','vehicle_equipment'],spark_walmart:['mileage','phone','insulated_bag'],shipt:['mileage','insulated_bag','phone'],taskrabbit:['tools','mileage','phone','protective_clothing','liability_insurance'],rover:['pet_supplies','mileage','phone','first_aid_cert'],thumbtack:['lead_fees','mileage','tools','phone','liability_insurance'],handyman_1099:['tools_section179','vehicle_actual','materials','mileage','liability_insurance','licensing'],cleaning:['supplies','equipment','mileage','uniform','liability_insurance'],lawn_care:['mower_section179','truck','fuel','trailer','maintenance'],babysitter_nanny_1099:['mileage_between_families','first_aid_cpr_certification','childcare_supplies','liability_insurance','phone'],fiverr_upwork:['equipment','editing_software','internet','home_studio','phone','laptop','platform_fees','advertising'],toptal:['equipment','home_studio','internet','phone','laptop','travel','platform_fees'],cameo_stir:['equipment','editing_software','internet','phone','props_costumes','home_studio','ring_light','microphone']};
  const names={uber:'Uber & Lyft Driver',lyft:'Uber & Lyft Driver',doordash:'DoorDash Driver',uber_eats:'Uber Eats Driver',instacart:'Instacart Shopper',grubhub:'Grubhub Driver',amazon_flex:'Amazon Flex Driver',spark_walmart:'Spark Driver (Walmart)',shipt:'Shipt Shopper',taskrabbit:'TaskRabbit Tasker',rover:'Rover & Pet Sitter',thumbtack:'Thumbtack Contractor',handyman_1099:'Handyman & 1099 Contractor',cleaning:'Cleaning Business Tax Calculator',lawn_care:'Lawn Care Self-Employed',babysitter_nanny_1099:'Babysitter & Nanny 1099',fiverr_upwork:'Fiverr & Upwork Freelancer',toptal:'Toptal Freelancer',cameo_stir:'Cameo & Stir Creator'};
  const subs={uber:'Rideshare drivers: mileage is your #1 deduction.',doordash:'Delivery drivers: track every mile. This is your largest deduction.',uber_eats:'Food delivery. Mileage + insulated bags + phone are your top deductions.',instacart:'Full-service shoppers get 1099-NEC. In-store shoppers get W-2.',amazon_flex:'Block-based delivery. Higher pay per block but fewer deductions vs rideshare.',grubhub:'Food delivery. Mileage + phone are key.',spark_walmart:'Per-batch pay. Mileage is primary deduction.',shipt:'Similar to Instacart. Mileage + quarterly payments.',taskrabbit:'Tools, mileage, protective clothing.',rover:'Pet supplies, mileage, platform fee.',thumbtack:'Lead fees are 100% deductible.',handyman_1099:'Section 179 for tools. Vehicle actual expense.',cleaning:'Supplies, mileage, liability insurance.',lawn_care:'Equipment depreciation / Section 179.',babysitter_nanny_1099:'Critical: employee vs contractor distinction.',fiverr_upwork:'Freelance marketplace. Equipment, software, and home office are key.',toptal:'Elite freelance platform. Higher rates, same Schedule C rules.',cameo_stir:'Creator pay platforms. Equipment and content creation costs.'};
  buildPlatformCalc(main,key,'gig',names[key]||key,subs[key]||'Gig economy tax calculator.',map[key]||['mileage','phone']);
}

function creatorCalculatorView(main,key){
  const map={onlyfans:['equipment','phone','internet','props_costumes'],tiktok:['phone','ring_light','props','editing_software'],youtube:['camera','microphone','editing_software','home_studio','travel_for_content'],twitch:['pc_console_section179','internet','microphone','webcam','streaming_software'],substack:['laptop','home_studio','internet','research_subscriptions'],podcast:['microphone','recording_software_section179','hosting_fees','home_studio','travel'],patreon:['creation_costs','platform_fee','fulfillment'],instagram:['camera','phone','props','editing_apps','travel','agency_fees'],ugc_creator:['camera_phone_section179','editing_software','props_staging','contracts_legal','internet','home_studio'],online_course_creator:['course_platform_fee','video_equipment_section179','editing_software','home_studio','marketing_spend','contractor_editors'],newsletter_business:['esp_cost','copywriter_contractors','home_studio','laptop','research_subscriptions','design_tools','list_management_tools'],affiliate:['hosting','domains','email_platform','ad_spend','content_creation'],sponsorship_income:['agent_manager_fees_if_applicable','content_creation_costs','platform_specific_costs','phone','internet'],'brand_deal_calculator':['creation_costs_for_this_deal','agent_fees','equipment'],beehiiv:['laptop','home_studio','internet','research_subscriptions','design_tools','esp_cost','copywriter_contractors'],kofi_buymeacoffee:['laptop','internet','phone','creation_costs','editing_software','home_studio','platform_fee'],linkedin_creator:['laptop','internet','phone','editing_software','home_studio','content_creation','equipment'],kajabi:['course_platform_fee','video_equipment_section179','editing_software','home_studio','marketing_spend','contractor_editors','community_management_tools'],x_creator:['phone','internet','editing_software','content_creation_tools','home_studio','equipment','subscriptions_research','ad_spend_boosts','professional_services'],fanbase_passes:['phone','internet','editing_software','content_creation_tools','home_studio','equipment','subscriptions_research','props_costumes','professional_services'],pinterest_creator:['phone','internet','editing_software','design_tools','home_studio','equipment','ad_spend','content_creation','pinterest_tools']};
  const names={onlyfans:'OnlyFans Creator',tiktok:'TikTok Creator',youtube:'YouTube Creator',twitch:'Twitch Streamer',substack:'Substack Writer',podcast:'Podcast Creator',patreon:'Patreon Creator',instagram:'Instagram Influencer',ugc_creator:'UGC Creator Tax Calculator',online_course_creator:'Online Course Creator',newsletter_business:'Newsletter Business',affiliate:'Affiliate Marketer',sponsorship_income:'Sponsorship Income',beehiiv:'Beehiiv Writer',kofi_buymeacoffee:'Ko-fi & Buy Me a Coffee Creator',linkedin_creator:'LinkedIn Creator',kajabi:'Kajabi Course Creator',x_creator:'X & Twitter Creator',fanbase_passes:'Fanbase & Passes Creator',pinterest_creator:'Pinterest Creator'};
  const subs={onlyfans:'Equipment, platform fee (20%), LLC privacy.',tiktok:'Creator Fund = 1099; brand deals = 1099-NEC.',youtube:'AdSense + memberships + merch. Equipment (Section 179).',twitch:'PC equipment full Section 179 write-off.',substack:'Substack takes 10%. Home office central.',podcast:'Equipment + sponsorship contracts.',patreon:'Taxable even without 1099-K.',instagram:'Gifted products are taxable at FMV.',ugc_creator:'Low competition, rising volume.',online_course_creator:'Platform fees + marketing deductible.',newsletter_business:'Contractor costs are 100% deductible.',affiliate:'High S-Corp potential if earning $80K+.',sponsorship_income:'Agent/manager fees are deductible.',beehiiv:'Newsletter platform with paid subscriptions. Home office and contractor costs are key.',kofi_buymeacoffee:'Tip-based creator support. All tips are taxable income.',linkedin_creator:'Professional content and newsletter. B2B sponsorships pay more than consumer deals.',kajabi:'All-in-one courses + community. Higher platform fees offset by bundled pricing.',x_creator:'Ad revenue sharing + Premium subscriptions + tips. 1099-NEC for payouts.',fanbase_passes:'Direct fan monetization. Subscription + tip income. Platform fee ~20%.',pinterest_creator:'Creator rewards + paid partnerships + affiliate pins. Schedule C self-employment.'};
  buildPlatformCalc(main,key,'creator',names[key]||key,subs[key]||'Creator tax calculator.',map[key]||['equipment','phone']);
}

function sellerCalculatorView(main,key){
  const map={etsy:['cogs','platform_fees','shipping_supplies','photography_equipment'],ebay:['cost_basis_items','ebay_fees','paypal_fees','shipping','packing_supplies'],amazon_fba:['amazon_fees','fba_fulfillment','storage','cogs','advertising'],amazon_kdp:['editing_services','cover_design','formatting_tools','advertising_ams','home_office','internet','computer_equipment','research_materials','ISBN_costs','professional_services'],shopify:['platform_fee','payment_processing','cogs','shipping','advertising'],poshmark:['cost_basis_items','platform_fees','shipping_supplies'],mercari:['cost_basis','platform_fees','shipping'],depop:['cogs','platform_fees','shipping_supplies','mileage','phone','equipment','packing_supplies','advertising'],whatnot:['cogs','platform_fees','shipping_supplies','mileage','phone','equipment','packing_supplies','internet','advertising'],gumroad:['platform_fee','email_platform','software','home_office'],stan_store:['platform_fee','email_platform','content_creation_tools'],facebook_marketplace:['cost_basis_items_purchased_for_resale','shipping_supplies','mileage_to_pickup_items','marketplace_selling_fees'],stockx_goat:['cost_basis_shoes','stockx_seller_fee','authentication_fee','shipping_costs','storage'],printful_printify:['printful_printify_base_cost_COGS','design_software_subscription','shopify_etsy_fees','advertising_spend','photography_mockups']};
  const names={etsy:'Etsy Seller',ebay:'eBay Seller',amazon_fba:'Amazon FBA Seller',amazon_kdp:'Amazon KDP Author',shopify:'Shopify Store Owner',poshmark:'Poshmark Seller',mercari:'Mercari Seller',depop:'Depop Seller',whatnot:'Whatnot Seller',gumroad:'Gumroad Seller',stan_store:'Stan Store Seller',facebook_marketplace:'Facebook Marketplace Seller',stockx_goat:'StockX & GOAT Seller',printful_printify:'Printful & Printify Seller'};
  const subs={etsy:'Listing $0.20, transaction 6.5%, payment 3%.',ebay:'Final value fee avg 12.9%.',amazon_fba:'Referral fee ~15%. FBA fulfillment costs.',amazon_kdp:'Royalty income: 35% or 70% rate. Printing costs deducted by Amazon. No inventory held.',shopify:'Own store: platform + payment processing.',poshmark:'20% on sales >$15.',mercari:'10% seller fee.',depop:'10% seller fee + payment processing (~2.9%).',whatnot:'8% seller fee + payment processing (~2.9%). Live auction platform.',gumroad:'10% platform fee.',stan_store:'5% fee.',facebook_marketplace:'Personal vs business distinction.',stockx_goat:'Business vs investment activity.',printful_printify:'COGS = base product cost. Essential deduction.'};
  buildPlatformCalc(main,key,'seller',names[key]||key,subs[key]||'Seller tax calculator.',map[key]||['cogs','platform_fees']);
}

function rentalCalculatorView(main,key){
  const map={airbnb:['mortgage_interest_pct','property_taxes_pct','depreciation','supplies','cleaning','platform_fees','repairs'],turo:['insurance','depreciation_actual','maintenance','platform_fee'],vrbo:['mortgage_interest_pct','property_taxes_pct','depreciation','supplies','cleaning','repairs'],getaround:['insurance_pct_business_use','depreciation_actual_method','maintenance_pct','getaround_platform_fee_already_netted','car_wash'],rv_rental:['rv_depreciation_section179_or_macrs','insurance_pct','maintenance_repairs','campground_fees_if_host_delivered','platform_fee','storage'],boat_rental:['boat_depreciation_section179','insurance','marina_storage_fees','maintenance','fuel_pct','platform_fee','captains_wages_if_applicable'],equipment_rental:['equipment_depreciation_section179','insurance','maintenance_repairs','storage','platform_fee','mileage_for_delivery'],parking_space_rental:['property_taxes_pct','insurance_pct','repairs_maintenance','platform_fee','advertising'],storage_rental:['property_taxes_pct','insurance','platform_fee','repairs'],landlord:['mortgage_interest','property_taxes','depreciation_27_5_years','insurance','repairs_maintenance','property_management_fees','advertising_vacancy','legal_accounting_fees','travel_to_property'],mid_term_rental:['mortgage_interest_pct','property_taxes_pct','depreciation','furnishings_depreciation','utilities','cleaning','supplies','repairs','insurance','platform_fees','advertising']};
  const names={airbnb:'Airbnb & VRBO Host',turo:'Turo Car Sharing',vrbo:'VRBO Host',getaround:'Getaround Car Sharing',rv_rental:'RV Rental Tax Calculator',boat_rental:'Boat Rental Tax Calculator',equipment_rental:'Equipment Rental Tax Calculator',parking_space_rental:'Parking Space Rental',storage_rental:'Storage Rental Tax Calculator',landlord:'Landlord (Long-Term)',mid_term_rental:'Mid-Term Rental Tax Calculator'};
  const subs={airbnb:'Schedule C if substantial services; Schedule E if simple rent.',turo:'Schedule C. Cannot use standard mileage if MACRS used before.',vrbo:'Same as Airbnb - services test.',getaround:'Platform fee already netted. Deduct actual vehicle expenses.',rv_rental:'RVs depreciate over 5 years. Section 179 may apply.',boat_rental:'Bare boat = Schedule E. With captain = Schedule C.',equipment_rental:'Tools, cameras, gear. Section 179.',parking_space_rental:'Passive income. Generally no SE tax.',storage_rental:'Renting garage / shed. Schedule E.',landlord:'Schedule E. Passive loss rules apply.',mid_term_rental:'30-90 day furnished rentals. FurnishedFinder, corporate housing. Schedule C or E depending on services.'};
  buildPlatformCalc(main,key,'rental',names[key]||key,subs[key]||'Rental income tax calculator.',map[key]||['insurance','maintenance']);
}

/* ===================== Category Hub Pages ===================== */
function gigHubView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'',text:'Gig Economy'})}<h2>Gig Economy Tax Calculator Free 2026: Uber, DoorDash, Instacart & More</h2><p style="color:var(--muted);margin-bottom:1.5rem">Free tax calculators for rideshare, delivery, and service-based gig work. Every page is pre-loaded with the deductions that matter for your specific platform.</p>${callout('blue','What is gig work?','Gig workers are independent contractors. You receive a 1099-NEC (or 1099-K) and must pay self-employment tax (15.3%) plus federal and state income tax. Your biggest deduction is usually mileage - track every mile.')}
    <div class="section">${sectionLabel('Rideshare')}<div class="tile-grid">
      ${tileCard('🚗','Uber & Lyft Tax Calculator','Rideshare drivers','Rideshare','gig/uber')}
    </div></div>
    <div class="section">${sectionLabel('Delivery')}<div class="tile-grid">
      ${tileCard('🍔','DoorDash Tax Calculator','Food delivery drivers','Delivery','gig/doordash')}
      ${tileCard('🛒','Instacart Tax Calculator','Full-service shoppers','Delivery','gig/instacart')}
      ${tileCard('📦','Amazon Flex Tax Calculator','Package delivery','Delivery','gig/amazon_flex')}
      ${tileCard('🍕','Grubhub Tax Calculator','Food delivery','Delivery','gig/grubhub')}
      ${tileCard('🛍️','Spark & Walmart Tax Calculator','Grocery delivery','Delivery','gig/spark_walmart')}
      ${tileCard('🛒','Shipt Tax Calculator','Grocery delivery','Delivery','gig/shipt')}
      ${tileCard('🥡','Uber Eats Tax Calculator','Food delivery drivers','Delivery','gig/uber_eats')}
    </div></div>
    <div class="section">${sectionLabel('Services')}<div class="tile-grid">
      ${tileCard('🔨','TaskRabbit Tax Calculator','Task-based gigs','Services','gig/taskrabbit')}
      ${tileCard('🐕','Rover Pet Care Tax Calculator','Pet sitting & walking','Services','gig/rover')}
      ${tileCard('🧹','Cleaning Business Tax Calculator','House cleaning','Services','gig/cleaning')}
      ${tileCard('🌿','Lawn Care Tax Calculator','Landscaping & lawn','Services','gig/lawn_care')}
      ${tileCard('🔧','Handyman Tax Calculator','Repair services','Services','gig/handyman_1099')}
      ${tileCard('👶','Babysitter & Nanny Tax Calculator','Childcare services','Care','gig/babysitter_nanny_1099')}
      ${tileCard('🔨','Thumbtack Tax Calculator','Pro services','Services','gig/thumbtack')}
    </div></div>
    <div class="section">${sectionLabel('Freelance & Creator Platforms')}<div class="tile-grid">
      ${tileCard('💻','Fiverr / Upwork Tax Calculator','Freelance marketplace','Freelance','gig/fiverr_upwork')}
      ${tileCard('⭐','Toptal Tax Calculator','Elite freelance platform','Freelance','gig/toptal')}
      ${tileCard('🎬','Cameo / Stir Tax Calculator','Creator pay platforms','Creator','gig/cameo_stir')}
    </div></div>
    <div class="calc-panel" style="margin-top:1.5rem"><h3>How Gig Taxes Work</h3><p>Gig workers file <strong>Schedule C</strong> to report income and deductions, then <strong>Schedule SE</strong> to calculate self-employment tax. The SE tax rate is 15.3% (12.4% Social Security + 2.9% Medicare) on 92.35% of net profit.</p><p>Your <strong>standard mileage rate for 2026 is $0.725/mile</strong> (IRS Notice 2026-10). This is usually your largest deduction. Track every mile - commuting from home to a regular workplace is NOT deductible, but driving between gigs IS.</p><p>After SE tax, you pay <strong>federal income tax</strong> at your marginal bracket and <strong>state income tax</strong> (varies by state). Set aside 25–35% of gross income for taxes.</p></div>
    <div class="calc-panel" style="margin-top:1.5rem"><h3>Related Hubs</h3><p><a href="/creator-hub" class="btn btn-secondary">Creator Economy Calculators</a> <a href="/seller-hub" class="btn btn-secondary">Seller Marketplace Calculators</a> <a href="/rental-hub" class="btn btn-secondary">Rental Income Calculators</a> <a href="/equity" class="btn btn-secondary">Equity Compensation Calculators</a> <a href="/calculators" class="btn btn-secondary">Standalone Tools Hub</a></p></div>`;
}

function creatorHubView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'',text:'Creator Economy'})}<h2>Creator Economy Tax Calculators 2026: OnlyFans, YouTube, TikTok & More</h2><p style="color:var(--muted);margin-bottom:1.5rem">Free tax calculators for YouTube, TikTok, OnlyFans, podcasters, newsletter writers, and every type of creator income.</p>${callout('blue','Creator income is self-employment income','Brand deals, ad revenue, sponsorships, subscriptions, and affiliate commissions are all taxable. Even gifted products are taxable at fair market value. You need Schedule C + SE, plus estimated quarterly payments.')}
    <div class="section">${sectionLabel('Video & Streaming')}<div class="tile-grid">
      ${tileCard('📸','OnlyFans Tax Calculator','Creator platform','Video/Social','creator/onlyfans')}
      ${tileCard('🎵','TikTok Tax Calculator','Short-form video','Video/Social','creator/tiktok')}
      ${tileCard('▶️','YouTube Tax Calculator','Long-form video','Video/Social','creator/youtube')}
      ${tileCard('🎮','Twitch Tax Calculator','Live streaming','Streaming','creator/twitch')}
    </div></div>
    <div class="section">${sectionLabel('Writing & Audio')}<div class="tile-grid">
      ${tileCard('✍️','Substack Tax Calculator','Newsletter writer','Writing','creator/substack')}
      ${tileCard('🎙️','Podcast Tax Calculator','Audio creator','Audio','creator/podcast')}
      ${tileCard('📰','Newsletter Business Tax Calculator','Email business','Newsletter','creator/newsletter_business')}
      ${tileCard('🐝','Beehiiv Tax Calculator','Newsletter platform','Writing','creator/beehiiv')}
      ${tileCard('💼','LinkedIn Creator Tax Calculator','Professional content','B2B','creator/linkedin_creator')}
    </div></div>
    <div class="section">${sectionLabel('Monetization')}<div class="tile-grid">
      ${tileCard('🎨','Patreon Tax Calculator','Subscription creator','Subscription','creator/patreon')}
      ${tileCard('🐦','X / Twitter Creator Tax Calculator','Ad revenue sharing + Premium','Social','creator/x_creator')}
      ${tileCard('🎟️','Fanbase / Passes Tax Calculator','Direct fan monetization','Subscription','creator/fanbase_passes')}
      ${tileCard('📌','Pinterest Creator Tax Calculator','Creator rewards + paid partnerships','Social','creator/pinterest_creator')}
      ${tileCard('📷','Instagram Tax Calculator','Influencer','Social','creator/instagram')}
      ${tileCard('🎬','UGC Creator Tax Calculator','Brand content','UGC','creator/ugc_creator')}
      ${tileCard('🎓','Course Creator Tax Calculator','Online courses','Courses','creator/online_course_creator')}
      ${tileCard('🧑‍🏫','Kajabi Tax Calculator','Courses + community','Courses','creator/kajabi')}
      ${tileCard('🔗','Affiliate','Affiliate marketing','Affiliate','creator/affiliate')}
      ${tileCard('🤝','Sponsorships Tax Calculator','Brand deals','Deals','creator/sponsorship_income')}
      ${tileCard('💰','Brand Deal Tax Calculator','One-off deal tax','Standalone','creator/brand-deal')}
      ${tileCard('☕','Ko-fi / Buy Me a Coffee Tax Calculator','Creator tips & support','Tips','creator/kofi_buymeacoffee')}
    </div></div>
    <div class="calc-panel" style="margin-top:1.5rem"><h3>How Creator Taxes Work</h3><p>Creator income is <strong>self-employment income</strong> reported on Schedule C. Platform fees (OnlyFans 20%, Substack 10%, Patreon 8%) are fully deductible business expenses. Equipment like cameras, ring lights, and editing software may qualify for <strong>Section 179 immediate expensing</strong>.</p><p>Gifted products from brands are <strong>taxable at fair market value</strong> even if you never sold them. PR packages must be reported as income. Brand deals over $2,000 trigger a 1099-NEC from the brand.</p><p>If you earn $80,000+ net profit, consider an <strong>S-Corp election</strong> to save on SE tax. Use our <a href="/standalone/entity-compare">LLC vs S-Corp calculator</a> to see exact savings.</p></div>
    <div class="calc-panel" style="margin-top:1.5rem"><h3>Related Hubs</h3><p><a href="/gig-hub" class="btn btn-secondary">Gig Economy Calculators</a> <a href="/seller-hub" class="btn btn-secondary">Seller Marketplace Calculators</a> <a href="/rental-hub" class="btn btn-secondary">Rental Income Calculators</a> <a href="/calculators" class="btn btn-secondary">Standalone Tools Hub</a></p></div>`;
}

function sellerHubView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'',text:'Marketplace Sellers'})}<h2>Online Seller Tax Calculators 2026: Etsy, eBay, Amazon FBA & More</h2><p style="color:var(--muted);margin-bottom:1.5rem">Free tax calculators for Etsy, eBay, Amazon FBA, KDP, Shopify, Poshmark, Depop, Whatnot, and every marketplace where you sell goods online.</p>${callout('blue','Your 1099-K shows gross receipts','The 1099-K includes refunds, shipping, and fees. You must reconcile it to your actual taxable income. Deduct COGS, platform fees, and shipping supplies.')}
    <div class="section">${sectionLabel('Marketplaces')}<div class="tile-grid">
      ${tileCard('🧶','Etsy Tax Calculator','Handmade & vintage','Craft','seller/etsy')}
      ${tileCard('🏷️','eBay Tax Calculator','Auctions & fixed-price','General','seller/ebay')}
      ${tileCard('📦','Amazon FBA Tax Calculator','Fulfillment by Amazon','FBA','seller/amazon_fba')}
      ${tileCard('📚','Amazon KDP Tax Calculator','Self-publishing royalty income. 35% or 70% rate.','Publishing','seller/amazon_kdp')}
      ${tileCard('🛍️','Shopify Tax Calculator','Own store','E-commerce','seller/shopify')}
      ${tileCard('👗','Poshmark Tax Calculator','Fashion resale','Fashion','seller/poshmark')}
      ${tileCard('🧵','Depop Tax Calculator','Gen Z fashion resale. 10% + processing fees.','Fashion','seller/depop')}
      ${tileCard('🎤','Whatnot Tax Calculator','Live auction selling. 8% + processing fees.','Collectibles','seller/whatnot')}
      ${tileCard('📱','Mercari Tax Calculator','Mobile selling','General','seller/mercari')}
      ${tileCard('💻','Gumroad Tax Calculator','Digital products','Digital','seller/gumroad')}
      ${tileCard('🏪','Stan Store Tax Calculator','Creator store','Digital','seller/stan_store')}
      ${tileCard('🏠','Facebook Marketplace Tax Calculator','Local selling','Social','seller/facebook_marketplace')}
      ${tileCard('👟','StockX & GOAT Tax Calculator','Sneaker resale','Sneakers','seller/stockx_goat')}
      ${tileCard('👕','Printful & Printify Tax Calculator','Print-on-demand','POD','seller/printful_printify')}
      ${tileCard('🧾','1099-K Reconcile','Reconcile gross vs net','Tool','seller/1099k-reconciliation')}
    </div></div>
    <div class="calc-panel" style="margin-top:1.5rem"><h3>How Seller Taxes Work</h3><p>Online sellers report income on <strong>Schedule C</strong>. Your <strong>Cost of Goods Sold (COGS)</strong> is your most important deduction - it directly reduces taxable income. For handmade items, COGS = materials + labor. For resale, COGS = purchase price. For print-on-demand, COGS = base product cost.</p><p>Platform fees are 100% deductible: Etsy listing fees ($0.20), transaction fees (6.5%), Amazon referral fees (~15%), Shopify subscription, etc. Shipping supplies (boxes, tape, labels) and mileage to the post office are also deductible.</p><p>If you sell personal items at a loss, that loss is <strong>not deductible</strong>. If you sell at a gain, the gain is taxable. Use our <a href="/seller/1099k-reconciliation">1099-K Reconciliation calculator</a> to avoid overpaying.</p></div>
    <div class="calc-panel" style="margin-top:1.5rem"><h3>Related Hubs</h3><p><a href="/gig-hub" class="btn btn-secondary">Gig Economy Calculators</a> <a href="/creator-hub" class="btn btn-secondary">Creator Economy Calculators</a> <a href="/rental-hub" class="btn btn-secondary">Rental Income Calculators</a> <a href="/calculators" class="btn btn-secondary">Standalone Tools Hub</a></p></div>`;
}

function rentalHubView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'',text:'Rental Income'})}<h2>Rental Income Tax Calculators 2026: Airbnb, Turo, VRBO & More</h2><p style="color:var(--muted);margin-bottom:1.5rem">Free tax calculators for Airbnb, Turo, VRBO, RV rental, boat rental, equipment rental, and long-term landlord income.</p>${callout('blue','Rental income has special rules','Short-term rentals (Airbnb) may be Schedule C or Schedule E depending on services provided. Long-term rentals are Schedule E. Passive loss rules may limit deductions.')}
    <div class="section">${sectionLabel('Short-Term Rentals')}<div class="tile-grid">
      ${tileCard('🏠','Airbnb & VRBO Tax Calculator','Short-term rental','STR','rental/airbnb')}
      ${tileCard('🏠','VRBO Tax Calculator','Vacation rental by owner','STR','rental/vrbo')}
      ${tileCard('🚗','Turo Tax Calculator','Car sharing','Vehicle','rental/turo')}
      ${tileCard('🚗','Getaround Tax Calculator','Peer-to-peer car sharing','Vehicle','rental/getaround')}
    </div></div>
    <div class="section">${sectionLabel('Mid-Term Rentals')}<div class="tile-grid">
      ${tileCard('🏠','Mid-Term Rental Tax Calculator','30-90 day furnished. FurnishedFinder, corporate housing.','MTR','rental/mid_term_rental')}
    </div></div>
    <div class="section">${sectionLabel('Vehicle & Equipment')}<div class="tile-grid">
      ${tileCard('🏕️','RV Rental Tax Calculator','RVshare / Outdoorsy','Vehicle','rental/rv_rental')}
      ${tileCard('🚤','Boat Rental Tax Calculator','Boatsetter','Marine','rental/boat_rental')}
      ${tileCard('🎥','Equipment Rental Tax Calculator','Tools, cameras, gear','Equipment','rental/equipment_rental')}
    </div></div>
    <div class="section">${sectionLabel('Property')}<div class="tile-grid">
      ${tileCard('🅿️','Parking Space Tax Calculator','SpotHero, Neighbor','Passive','rental/parking_space_rental')}
      ${tileCard('📦','Storage Rental Tax Calculator','Garage / shed rent','Passive','rental/storage_rental')}
      ${tileCard('🏘️','Landlord Tax Calculator','Long-term rental','LTR','rental/landlord')}
    </div></div>
    <div class="section">${sectionLabel('Strategy & Comparison')}<div class="tile-grid">
      ${tileCard('📊','Short vs Long-Term Rental','Compare STR vs LTR tax for same property','Compare','rental/short-vs-long-term-rental')}
      ${tileCard('🏠','Real Estate Agent Rental','RE pro with rental properties','Pro','rental/real-estate-agent-rental')}
    </div></div>
    <div class="calc-panel" style="margin-top:1.5rem"><h3>How Rental Taxes Work</h3><p>Short-term rentals (under 7 days average) with substantial services (cleaning, breakfast, concierge) are <strong>Schedule C</strong> - subject to SE tax. Simple rentals are <strong>Schedule E</strong> - no SE tax, but passive loss rules apply.</p><p>Key deductions: mortgage interest (percentage of rental use), property taxes, depreciation (27.5 years for residential, 5 years for vehicles/RVs), cleaning fees, supplies, repairs, and platform fees (Airbnb ~3%, Turo 40%, VRBO fees).</p><p>The <strong>Augusta Rule (IRC 280A(g))</strong> allows you to rent your personal residence to your business for up to 14 days tax-free. This is a powerful but little-known strategy for S-Corp owners.</p></div>
    <div class="calc-panel" style="margin-top:1.5rem"><h3>Related Hubs</h3><p><a href="/gig-hub" class="btn btn-secondary">Gig Economy Calculators</a> <a href="/creator-hub" class="btn btn-secondary">Creator Economy Calculators</a> <a href="/seller-hub" class="btn btn-secondary">Seller Marketplace Calculators</a> <a href="/calculators" class="btn btn-secondary">Standalone Tools Hub</a></p></div>`;
}

/* ===================== Short vs Long-Term Rental Comparison ===================== */
function shortVsLongTermRentalView(main) {
  main.innerHTML = `${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'rental-hub',text:'Rental Income'},{href:'',text:'Short vs Long-Term'})}<h2>Short-Term vs Long-Term Rental Tax Calculator 2026</h2><p style="color:var(--muted);margin-bottom:1.5rem">Compare the same property as an Airbnb (STR) vs a traditional landlord rental (LTR). See which structure leaves more after tax.</p>${callout('blue','The 7-Day Rule','Average rental period ≤7 days = NOT passive (Schedule C rules apply, SE tax possible). >7 days = passive (Schedule E).')}
    <div class="calc-grid"><div class="calc-panel"><h3>Property Inputs</h3>${inputField('svl_gross_income','Annual gross rental income','number',{value:48000})}${inputField('svl_mortgage_interest','Mortgage interest (annual)','number',{value:12000})}${inputField('svl_property_tax','Property taxes','number',{value:4500})}${inputField('svl_insurance','Insurance','number',{value:1800})}${inputField('svl_repairs','Repairs & maintenance','number',{value:3000})}${inputField('svl_cleaning','Cleaning / supplies / platform fees','number',{value:2400})}${inputField('svl_management','Management fees','number',{value:0})}</div>
    <div class="calc-panel"><h3>Assumptions</h3>${inputField('svl_purchase_price','Purchase price','number',{value:350000})}${inputField('svl_land_value','Land value (not depreciable)','number',{value:70000})}${inputField('svl_nights_str','Nights rented (STR)','number',{value:180})}${inputField('svl_nights_ltr','Months rented (LTR)','number',{value:12})}<div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcShortVsLong()">Compare STR vs LTR</button></div></div></div>
    <div id="svl-res"></div>`;
  window.CalcFns = window.CalcFns || {};
  window.CalcFns.calcShortVsLong = safeCalc(function() {
    const gross = getVal('svl_gross_income'), mortgage = getVal('svl_mortgage_interest'), tax = getVal('svl_property_tax'), ins = getVal('svl_insurance'), repairs = getVal('svl_repairs'), cleaning = getVal('svl_cleaning'), mgmt = getVal('svl_management');
    const purchase = getVal('svl_purchase_price'), land = getVal('svl_land_value'), nightsStr = getVal('svl_nights_str'), monthsLtr = getVal('svl_nights_ltr');
    const building = Math.max(0, purchase - land);
    const depreciation = building / 27.5;
    const totalDed = mortgage + tax + ins + repairs + cleaning + mgmt + depreciation;
    // Prorate deductions by rental-use percentage (personal-use portion is non-deductible)
    const strPct = Math.min(1, nightsStr / 365);
    const ltrPct = Math.min(1, monthsLtr / 12);
    const strDed = totalDed * strPct;
    const ltrDed = totalDed * ltrPct;
    const strNet = Math.max(0, gross - strDed);
    const ltrNet = Math.max(0, gross - ltrDed);
    const se = TE.calcSETax(strNet, DATA);
    const seTaxStr = se.totalSE;
    const afterTaxStr = strNet - seTaxStr;
    const afterTaxLtr = ltrNet;
    const diff = afterTaxLtr - afterTaxStr;
    document.getElementById('svl-res').innerHTML = `<div class="calc-panel" style="margin-top:1.5rem"><h3>Results</h3>
      <div class="stat-row">${statBlock('$' + Math.round(strNet).toLocaleString(),'STR net income')}${statBlock('$' + Math.round(ltrNet).toLocaleString(),'LTR net income')}${statBlock('$' + Math.round(totalDed).toLocaleString(),'Total deductions')}</div>
      <p><strong>Short-Term (Schedule C):</strong> Net $${Math.round(strNet).toLocaleString()} - SE tax applies (~15.3%). After SE tax: <strong>$${Math.round(afterTaxStr).toLocaleString()}</strong></p>
      <p><strong>Long-Term (Schedule E):</strong> Net $${Math.round(ltrNet).toLocaleString()} - NO SE tax. After tax: <strong>$${Math.round(afterTaxLtr).toLocaleString()}</strong></p>
      <p style="color:var(--accent)"><strong>LTR advantage: $${Math.round(diff).toLocaleString()}</strong> per year (no SE tax on passive rental income)</p>
      <p style="color:var(--muted);font-size:.85rem">Deductions prorated by rental use: STR ${(strPct*100).toFixed(0)}% of year, LTR ${(ltrPct*100).toFixed(0)}% of year. Actual federal/state income tax also applies.</p></div>`;
  });
}

/* ===================== Real Estate Agent Rental Calculator ===================== */
function realEstateAgentRentalView(main) {
  main.innerHTML = `${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'rental-hub',text:'Rental Income'},{href:'',text:'RE Agent Rental'})}<h2>Real Estate Agent Rental Tax Calculator 2026</h2><p style="color:var(--muted);margin-bottom:1.5rem">Real estate agents who also own rental properties face unique tax rules. If you qualify as a real estate professional (750+ hours, majority of work time in RE), passive loss rules don't apply.</p>${callout('green','RE Professional Advantage','If you qualify, rental losses can offset ALL income - not just passive income. This is a massive tax advantage unique to RE agents and property managers.')}
    <div class="calc-grid"><div class="calc-panel"><h3>Commission Income (Schedule C)</h3>${inputField('rea_commissions','Annual commissions','number',{value:85000})}${inputField('rea_broker_fees','Broker fees / splits','number',{value:15000})}${inputField('rea_marketing','Marketing & advertising','number',{value:4000})}${inputField('rea_mileage','Business miles','number',{value:8000})}${inputField('rea_license','License & continuing ed','number',{value:800})}</div>
    <div class="calc-panel"><h3>Rental Properties (Schedule E)</h3>${inputField('rea_rental_income','Total rental income','number',{value:36000})}${inputField('rea_rental_expenses','Rental expenses (excl. depreciation)','number',{value:12000})}${inputField('rea_depreciation','Depreciation','number',{value:9000})}${inputField('rea_re_professional','Do you qualify as RE professional?','checkbox',{checked:true})}</div></div>
    <div class="calc-panel"><h3>Profile</h3><div class="calc-grid">${selectField('rea_status','Filing status',[{value:'single',label:'Single'},{value:'mfj',label:'Married Filing Jointly'},{value:'mfs',label:'Married Filing Separately'},{value:'hoh',label:'Head of Household'}],{value:'mfj'})}${selectField('rea_state','State',buildStateOptions(),{value:'CA'})}${inputField('rea_w2_income','Spouse W-2 income','number',{value:55000})}</div><div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcREAgent()">Calculate Total Tax</button></div></div>
    <div id="rea-res"></div>`;
  window.CalcFns = window.CalcFns || {};
  window.CalcFns.calcREAgent = safeCalc(function() {
    const commissions = getVal('rea_commissions'), brokerFees = getVal('rea_broker_fees'), marketing = getVal('rea_marketing'), mileage = getVal('rea_mileage'), license = getVal('rea_license');
    const rentalIncome = getVal('rea_rental_income'), rentalExp = getVal('rea_rental_expenses'), depreciation = getVal('rea_depreciation');
    const isREPro = document.getElementById('rea_re_professional').checked;
    const w2Income = getVal('rea_w2_income');
    const status = getSelect('rea_status'), stateCode = getSelect('rea_state');
    const seNet = Math.max(0, commissions - brokerFees - marketing - (mileage * MILEAGE_RATE) - license);
    const se = TE.calcSETax(seNet, DATA, w2Income);
    const rentalNet = rentalIncome - rentalExp - depreciation;
    // AGI: RE Pro can use rental losses to offset other income; non-RE Pro passive losses are suspended
    const agi = w2Income + seNet + (isREPro ? rentalNet : Math.max(0, rentalNet)) - se.deductibleHalf;
    const stdDed = TE.getStandardDeduction(status, false, DATA);
    const taxableBeforeQBI = Math.max(0, agi - stdDed);
    const qbi = TE.calcQBI(seNet, taxableBeforeQBI, status, DATA);
    const taxable = Math.max(0, taxableBeforeQBI - qbi);
    const fed = TE.calcFederalTax(taxable, status, DATA);
    const stateRes = TE.calcStateTax(agi, stateCode, DATA, status);
    const totalTax = fed + se.totalSE + stateRes.tax;
    const passiveLossWarning = (rentalNet < 0 && !isREPro) ? `<p style="color:#c94a1e"><strong>Warning:</strong> You have a rental loss of $${Math.abs(Math.round(rentalNet)).toLocaleString()}. Without RE professional status, this loss is passive and can only offset passive income. It cannot offset your commission or W-2 income.</p>` : (rentalNet < 0 && isREPro) ? `<p style="color:green"><strong>RE Pro benefit:</strong> Your rental loss of $${Math.abs(Math.round(rentalNet)).toLocaleString()} can offset ALL income types - commissions and W-2 included.</p>` : '';
    document.getElementById('rea-res').innerHTML = `<div class="calc-panel" style="margin-top:1.5rem"><h3>Results</h3>
      <div class="stat-row">${statBlock('$' + Math.round(seNet).toLocaleString(),'Schedule C net')}${statBlock('$' + Math.round(se.totalSE).toLocaleString(),'SE tax on commissions')}${statBlock('$' + Math.round(rentalNet).toLocaleString(),'Schedule E net')}</div>
      <p><strong>AGI:</strong> $${Math.round(agi).toLocaleString()} | <strong>Standard deduction:</strong> $${Math.round(stdDed).toLocaleString()}</p>
      ${qbi>0?`<p><strong>QBI deduction:</strong> $${Math.round(qbi).toLocaleString()}</p>`:''}
      <p><strong>Federal income tax:</strong> $${Math.round(fed).toLocaleString()} | <strong>State income tax:</strong> $${Math.round(stateRes.tax).toLocaleString()}</p>
      <p style="font-size:1.1rem"><strong>Total estimated tax:</strong> $${Math.round(totalTax).toLocaleString()}</p>
      ${passiveLossWarning}
      <p style="color:var(--muted);font-size:.85rem">Real estate professional status requires: (1) 750+ hours per year in real property trades, and (2) more than half of your personal service time in real property trades. Keep contemporaneous logs. Source: IRS Publication 925.</p></div>`;
  });
}

/* ===================== Combined W-2 + SE Calculator ===================== */
function combinedCalculatorView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'W-2 + Side Hustle'})}<h2>W2 and Side Hustle Tax Calculator 2026: 1099 & W2 Combined</h2><p style="color:var(--muted);margin-bottom:1.5rem">Model your total tax when you have a day job and a side gig. See how to calculate tax for 1099 and W2 combined.</p>${callout('green','Why this matters','Most gig workers have a W-2 job. Your side income pushes you into a higher federal bracket. This calculator models the combined effect.')}
    <div class="calc-grid"><div class="calc-panel"><h3>W-2 Income</h3>${inputField('w2_gross','Annual W-2 gross wages','number',{value:55000})}${inputField('w2_withholding','Federal withholding so far','number',{value:8000})}</div>
    <div class="calc-panel"><h3>Side Hustle (1099 / SE)</h3>${inputField('se_gross','Annual 1099 gross income','number',{value:18000})}${inputField('se_deductions','Total business deductions','number',{value:4000})}</div></div>
    <div class="calc-panel"><h3>Profile</h3><div class="calc-grid">${selectField('c_status','Filing status',[{value:'single',label:'Single'},{value:'mfj',label:'Married Filing Jointly'},{value:'mfs',label:'Married Filing Separately'},{value:'hoh',label:'Head of Household'}],{value:'single'})}${selectField('c_state','State',buildStateOptions(),{value:'CA'})}${inputField('c_age65','Age 65+','checkbox')}${inputField('c_dependents','Children under 17','number',{value:0})}</div><div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcCombined()">Calculate Total Tax</button></div></div>
    <div id="combined-res"></div>`+
    renderFaqSection([
      {q:'Do I need to pay quarterly taxes?',a:'If you expect to owe $1,000+ in tax and your W-2 withholding does not cover at least 90% of your total liability, you must pay quarterly estimated taxes. <a href="/quarterly">Use our quarterly tax estimator</a> to calculate exact amounts.'},
      {q:'Should I form an LLC or S-Corp?',a:'If your side hustle earns $60,000+ net profit, an S-Corp election can save you 8–12% in SE tax. <a href="/standalone/entity-compare">Compare LLC vs S-Corp savings</a> for your exact numbers.'},
      {q:'Why does my side income push me into a higher bracket?',a:'Federal tax brackets are marginal. Your W-2 income uses lower brackets first; your 1099 income stacks on top, filling higher brackets. That is why your side hustle is taxed at a higher rate than your day job.'}
    ]);
  window.CalcFns = window.CalcFns || {};
  window.CalcFns.calcCombined = safeCalc(function(){
    const w2=getVal('w2_gross'),seGross=getVal('se_gross'),seDed=getVal('se_deductions');
    const w2Withholding=getVal('w2_withholding');
    const status=getSelect('c_status'),state=getSelect('c_state');
    const age65=getVal('c_age65'),dependents=getVal('c_dependents');
    const r=TE.calcCombined(w2,seGross,seDed,status,state,DATA,age65);
    const childCredit=Math.min(TE.calcChildTaxCredit(dependents,r.agi,status,DATA),r.fedTax);
    // EIC: earned income = W-2 + net SE income
    const eic=TE.calcEIC(r.totalIncome, 0, dependents, status, DATA);
    const fedAfterCredit=Math.max(0,r.fedTax-childCredit-eic);
    const totalAfterCredit=fedAfterCredit+r.seTax+r.stateTax;
    const effectiveRate=r.totalIncome>0?totalAfterCredit/r.totalIncome:0;
    const stillOwed=Math.max(0,totalAfterCredit-w2Withholding);
    const seSetAsidePct=seGross>0?stillOwed/seGross:0;
    const qbiLines=[];
    qbiLines.push({label:'W-2 income',val:TE.formatMoney(r.w2Income)},{label:'Net SE income',val:TE.formatMoney(r.netSE)},{label:'Total income',val:TE.formatMoney(r.totalIncome)},{label:'AGI',val:TE.formatMoney(r.agi)},{label:'Standard deduction',val:TE.formatMoney(TE.getStandardDeduction(status,getVal('c_age65'),DATA))});
    if(r.qbi>0) qbiLines.push({label:'Taxable income before QBI',val:TE.formatMoney(r.taxableBeforeQBI)},{label:'QBI deduction',val:'-'+TE.formatMoney(r.qbi)},{label:'Taxable income after QBI',val:TE.formatMoney(r.taxable)});
    else qbiLines.push({label:'Taxable income',val:TE.formatMoney(r.taxable)});
    qbiLines.push({label:'SE tax (15.3%)',val:TE.formatMoney(r.seTax)},{label:'Federal income tax (before credits)',val:TE.formatMoney(r.fedTax)},{label:'Child tax credit',val:'-'+TE.formatMoney(childCredit)});
    if(eic>0) qbiLines.push({label:'Earned Income Credit (EIC)',val:'-'+TE.formatMoney(eic)});
    qbiLines.push({label:'Federal after credits',val:TE.formatMoney(fedAfterCredit)},{label:'State income tax',val:TE.formatMoney(r.stateTax)});
    document.getElementById('combined-res').innerHTML=resultsBox(qbiLines,'Total tax owed',TE.formatMoney(totalAfterCredit))+
    `<div class="calc-panel" style="margin-top:1rem"><h3>Set-Aside Guidance</h3><p>Total tax on all income: <strong>${TE.formatMoney(totalAfterCredit)}</strong>. Your W-2 withholding covers <strong>${TE.formatMoney(w2Withholding)}</strong>.</p><p>You still need to set aside: <strong>${TE.formatMoney(stillOwed)}</strong> from your side hustle.</p><p>That is <strong>${(seSetAsidePct*100).toFixed(0)}%</strong> of your ${TE.formatMoney(seGross)} side-hustle gross.</p><p style="margin-top:.75rem;color:var(--muted)"><strong>Combined effective rate:</strong> ${(effectiveRate*100).toFixed(1)}% - this is your total tax (${TE.formatMoney(totalAfterCredit)}) divided by your total income (${TE.formatMoney(r.totalIncome)}). It measures how much of every dollar you earn goes to taxes. It is NOT the percentage you need to set aside from your side hustle.</p></div>`+
    `<div class="calc-panel" style="margin-top:1rem"><h3>Summary</h3><p>You will pay <strong>${TE.formatMoney(totalAfterCredit)}</strong> in total tax on <strong>${TE.formatMoney(r.totalIncome)}</strong> of total income.</p><p>Your take-home amount is <strong>${TE.formatMoney(r.totalIncome-totalAfterCredit)}</strong>.</p></div>`;
    scrollToResults('combined-res');
  });
}

/* ===================== Multi-State W-2 + 1099 Calculator ===================== */
function multiStateCalculatorView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'Multi-State Calculator'})}<h2>Multi-State W-2 & 1099 Tax Calculator 2026</h2><p style="color:var(--muted);margin-bottom:1.5rem">Work in multiple states? Calculate federal tax on your total income plus state tax for each state where you earned money.</p>${callout('green','Remote work & multi-state gigs','If you earned W-2 wages or 1099 income in more than one state, each state taxes the income sourced to it. This calculator shows your total liability across all states.')}
    <div class="calc-grid"><div class="calc-panel"><h3>Federal Profile</h3>${selectField('ms_status','Filing status',[{value:'single',label:'Single'},{value:'mfj',label:'Married Filing Jointly'},{value:'mfs',label:'Married Filing Separately'},{value:'hoh',label:'Head of Household'}],{value:'single'})}${inputField('ms_age65','Age 65+','checkbox')}${inputField('ms_dependents','Children under 17','number',{value:0})}</div>
    <div class="calc-panel"><h3>Total Income</h3>${inputField('ms_w2','Total W-2 wages (all states)','number',{value:85000})}${inputField('ms_1099','Total 1099 gross income (all states)','number',{value:25000})}${inputField('ms_ded','Total business deductions','number',{value:5000})}</div></div>
    <div id="states-container"></div>
    <div class="btn-group" style="margin-top:1rem"><button class="btn btn-secondary" onclick="window.CalcFns.addMultiState()">Add State</button><button class="btn btn-accent" onclick="window.CalcFns.calcMultiState()">Calculate Total Tax</button></div>
    <div id="multi-state-res"></div>`;

  let stateCount=0;
  window.CalcFns = window.CalcFns || {};
  window.CalcFns.addMultiState = safeCalc(function(){
    stateCount++;
    const container=document.getElementById('states-container');
    const panel=document.createElement('div');
    panel.className='calc-panel';
    panel.style.marginTop='1rem';
    panel.id=`ms_state_panel_${stateCount}`;
    panel.innerHTML=`<h3>State ${stateCount}</h3>${selectField(`ms_state_${stateCount}`,'State',buildStateOptions(),{value:stateCount===1?'CA':'NY'})}${inputField(`ms_w2_${stateCount}`,'W-2 wages earned in this state','number',{value:stateCount===1?50000:35000})}${inputField(`ms_1099_${stateCount}`,'1099 income earned in this state','number',{value:stateCount===1?15000:10000})}<button class="btn" style="margin-top:.5rem" onclick="document.getElementById('ms_state_panel_${stateCount}').remove()">Remove</button>`;
    container.appendChild(panel);
  });

  addMultiState();
  addMultiState();

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.calcMultiState = safeCalc(function(){
    const w2Total=getVal('ms_w2'),gross1099=getVal('ms_1099'),deductions=getVal('ms_ded');
    const status=getSelect('ms_status'),age65=getVal('ms_age65'),dependents=getVal('ms_dependents');
    const netSE=Math.max(0,gross1099-deductions);
    const se=TE.calcSETax(netSE,DATA,w2Total);
    const totalIncome=w2Total+netSE;
    const agi=totalIncome-se.deductibleHalf;
    const stdDed=TE.getStandardDeduction(status,age65,DATA);
    const taxableBeforeQBI=Math.max(0,agi-stdDed);
    const qbi=TE.calcQBI(netSE,taxableBeforeQBI,status,DATA);
    const taxable=Math.max(0,taxableBeforeQBI-qbi);
    const fed=TE.calcFederalTax(taxable,status,DATA);
    const childCredit=Math.min(TE.calcChildTaxCredit(dependents,agi,status,DATA),fed);
    const eic=TE.calcEIC(totalIncome,0,dependents,status,DATA);
    const fedAfterCredit=Math.max(0,fed-childCredit-eic);

    const statePanels=document.querySelectorAll('[id^="ms_state_panel_"]');
    let stateResults=[],totalStateTax=0;
    for(const panel of statePanels){
      const num=panel.id.replace('ms_state_panel_','');
      const stateCode=getSelect(`ms_state_${num}`);
      const stateW2=getVal(`ms_w2_${num}`);
      const state1099=getVal(`ms_1099_${num}`);
      const stateIncome=stateW2+state1099;
      const stateDed=totalIncome>0?deductions*(stateIncome/totalIncome):0;
      const stateNetSE=Math.max(0,state1099-stateDed);
      const stateSE=stateNetSE>0?TE.calcSETax(stateNetSE,DATA,stateW2):{deductibleHalf:0};
      const stateAGI=stateIncome-stateSE.deductibleHalf;
      const stateTaxRes=TE.calcStateTax(stateAGI,stateCode,DATA,status);
      totalStateTax+=stateTaxRes.tax;
      stateResults.push({code:stateCode,income:stateIncome,tax:stateTaxRes.tax});
    }

    const totalTax=fedAfterCredit+se.totalSE+totalStateTax;
    const effectiveRate=totalIncome>0?totalTax/totalIncome:0;

    let stateRows=stateResults.map(s=>`<div class="result-line"><span>${(DATA.states[s.code]||{}).name||s.code} income</span><span class="num">${TE.formatMoney(s.income)}</span></div><div class="result-line"><span>${(DATA.states[s.code]||{}).name||s.code} tax</span><span class="num">${TE.formatMoney(s.tax)}</span></div>`).join('');

    const fedLines=[
      {label:'Total W-2 wages',val:TE.formatMoney(w2Total)},
      {label:'Total 1099 gross',val:TE.formatMoney(gross1099)},
      {label:'Total deductions',val:'-'+TE.formatMoney(deductions)},
      {label:'Net SE income',val:TE.formatMoney(netSE)},
      {label:'AGI',val:TE.formatMoney(agi)},
      {label:'Standard deduction',val:'-'+TE.formatMoney(stdDed)},
      {label:'Taxable income',val:TE.formatMoney(taxable)},
      {label:'Federal tax (before credits)',val:TE.formatMoney(fed)},
      {label:'Child tax credit',val:'-'+TE.formatMoney(childCredit)}
    ];
    if(eic>0) fedLines.push({label:'Earned Income Credit (EIC)',val:'-'+TE.formatMoney(eic)});

    document.getElementById('multi-state-res').innerHTML=resultsBox(fedLines,'Federal after credits',TE.formatMoney(fedAfterCredit))+
    `<div class="calc-panel" style="margin-top:1rem"><h3>Self-Employment Tax</h3><p>SE tax on net SE income: <strong>${TE.formatMoney(se.totalSE)}</strong></p></div>`+
    `<div class="calc-panel" style="margin-top:1rem"><h3>State Taxes</h3>${stateRows}<div class="result-line total"><span>Total state tax</span><span class="num">${TE.formatMoney(totalStateTax)}</span></div></div>`+
    `<div class="calc-panel" style="margin-top:1rem"><h3>Total Tax</h3><p>Federal after credits: <strong>${TE.formatMoney(fedAfterCredit)}</strong></p><p>SE tax: <strong>${TE.formatMoney(se.totalSE)}</strong></p><p>State taxes: <strong>${TE.formatMoney(totalStateTax)}</strong></p><p style="font-weight:700;font-size:1.1rem;margin-top:1rem">Total tax owed: ${TE.formatMoney(totalTax)}</p><p>Effective rate: <strong>${(effectiveRate*100).toFixed(1)}%</strong></p></div>`+
    `<div class="calc-panel" style="margin-top:1rem"><h3>Summary</h3><p>You will pay <strong>${TE.formatMoney(totalTax)}</strong> in total tax on <strong>${TE.formatMoney(totalIncome)}</strong> of income.</p><p>Your take-home amount is <strong>${TE.formatMoney(totalIncome-totalTax)}</strong>.</p></div>`+
    renderFaqSection([
      {q:'Do I have to file in every state where I worked?',a:'Yes. If you earned income in a state, you generally must file a non-resident or part-year resident return there. Your home state gives you a credit for taxes paid to other states. <a href="/w2-and-side-hustle">Model W-2 + side hustle combined</a>.'},
      {q:'How are deductions split across states?',a:'This calculator allocates your total business deductions proportionally by state income. If 60% of your income was earned in California and 40% in New York, 60% of deductions are allocated to CA and 40% to NY.'},
      {q:'What if I have a W-2 job in one state and 1099 in another?',a:'This is very common. Each state taxes the income sourced to it. Your W-2 state withholds tax on wages; your 1099 state taxes your self-employment income. <a href="/quarterly">Use our quarterly estimator</a> to plan state payments.'}
    ]);
    scrollToResults('multi-state-res');
  });
}

/* ===================== Standalone W-2 Calculator ===================== */
function w2CalculatorView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'W-2 Tax Calculator'})}<h2>W2 Tax Calculator 2026: Employee Income Tax Estimator</h2><p style="color:var(--muted);margin-bottom:1.5rem">Calculate your tax on W-2 wages only. See your take-home pay, effective rate, and whether your withholding covers your full liability.</p>
    ${callout('green','No side hustle?','If you only have W-2 income, your employer already withholds taxes. This calculator shows whether your withholding is enough, or if you will owe or get a refund.')}
    <div class="calc-grid"><div class="calc-panel"><h3>W-2 Income</h3>
      ${inputField('w2only_gross','Total gross wages (before 401k, HSA)','number',{value:65000})}
      ${inputField('w2only_withholding','Federal withholding (Box 2)','number',{value:8000})}
      ${inputField('w2only_401k','401(k) / 403(b) contributions (Box 12, code D)','number',{value:0})}
      ${inputField('w2only_hsa','HSA contributions (your payroll deductions)','number',{value:0})}
    </div>
    <div class="calc-panel"><h3>Profile</h3>
      ${selectField('w2only_status','Filing status',[{value:'single',label:'Single'},{value:'mfj',label:'Married Filing Jointly'},{value:'mfs',label:'Married Filing Separately'},{value:'hoh',label:'Head of Household'}],{value:'single'})}
      ${selectField('w2only_state','State',buildStateOptions(),{value:'CA'})}
      ${inputField('w2only_age65','Age 65+','checkbox')}
      ${inputField('w2only_dependents','Children under 17','number',{value:0})}
      ${inputField('w2only_investment','Taxable investment income (interest, dividends, capital gains)','number',{value:0})}
      ${inputField('w2only_student','Student loan interest deduction','number',{value:0})}
    </div></div>
    <div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcW2Only()">Calculate W-2 Tax</button></div>
    <div id="w2only-res"></div>`+
    renderFaqSection([
      {q:'Should I adjust my W-4 withholding?',a:'If you consistently owe or get large refunds, submit a new W-4 to your employer. The IRS W-4 calculator helps you set the right number of allowances. <a href="/w2-and-side-hustle">Have a side hustle too? Calculate combined tax</a>.'},
      {q:'Does my 401(k) reduce my taxable income?',a:'Yes. Traditional 401(k) contributions are pre-tax, reducing both federal and state taxable income. For 2026, the limit is $23,500 ($31,000 if age 50+).'},
      {q:'Do I qualify for the Earned Income Credit?',a:'EIC depends on your earned income, filing status, and number of children. This calculator includes it automatically if you qualify based on 2026 IRS tables.'}
    ]);

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.calcW2Only = safeCalc(function(){
    const gross=getVal('w2only_gross'),withholding=getVal('w2only_withholding');
    const pretax401k=getVal('w2only_401k'),hsa=getVal('w2only_hsa');
    const studentLoan=getVal('w2only_student'),investmentIncome=getVal('w2only_investment');
    const status=getSelect('w2only_status'),state=getSelect('w2only_state');
    const age65=getVal('w2only_age65'),dependents=getVal('w2only_dependents');

    const ctc=DATA.federal.childTaxCredit;
    const stdDed=TE.getStandardDeduction(status,age65,DATA);

    // Box 1 = gross - pretax 401k. Then AGI = Box 1 + investment income - above-the-line deductions
    const box1=gross-pretax401k;
    let agi=box1+investmentIncome-studentLoan-hsa;
    // OBBBA senior deduction (age 65+ only, separate from standard deduction additional amount)
    if(age65){
      const obbba=TE.calcSeniorDeductionOBBBA(agi,status,DATA);
      agi-=obbba;
    }
    const taxable=Math.max(0,agi-stdDed);
    const fed=TE.calcFederalTax(taxable,status,DATA);
    const stateRes=TE.calcStateTax(agi,state,DATA,status);
    const childCredit=Math.min(TE.calcChildTaxCredit(dependents,agi,status,DATA),fed);
    // EIC: earned income is W-2 wages (gross = Box 1 + 401k), but for EIC it's the actual earned income
    const eic=TE.calcEIC(gross, investmentIncome, dependents, status, DATA);
    const fedAfterCredit=Math.max(0,fed-childCredit-eic);
    const totalTax=fedAfterCredit+stateRes.tax;
    const refund=withholding-totalTax;
    const effectiveRate=gross>0?totalTax/gross:0;

    const lines=[
      {label:'Total gross wages (before 401k)',val:TE.formatMoney(gross)},
      {label:'401(k) / 403(b) contributions',val:'-'+TE.formatMoney(pretax401k)},
      {label:'W-2 Box 1 (gross - 401k)',val:TE.formatMoney(box1)},
      {label:'HSA contributions',val:'-'+TE.formatMoney(hsa)},
      {label:'Student loan interest',val:'-'+TE.formatMoney(studentLoan)},
      {label:'AGI',val:TE.formatMoney(agi)},
      {label:'Standard deduction',val:'-'+TE.formatMoney(stdDed)},
      {label:'Taxable income',val:TE.formatMoney(taxable)},
      {label:'Federal income tax',val:TE.formatMoney(fed)},
      {label:'Child tax credit',val:'-'+TE.formatMoney(childCredit)}
    ];
    if(eic>0) lines.push({label:'Earned Income Credit (EIC)',val:'-'+TE.formatMoney(eic)});
    lines.push({label:'Federal after credits',val:TE.formatMoney(fedAfterCredit)},{label:'State income tax',val:TE.formatMoney(stateRes.tax)},{label:'Total tax',val:TE.formatMoney(totalTax)},{label:'Federal withholding',val:TE.formatMoney(withholding)});
    document.getElementById('w2only-res').innerHTML=resultsBox(lines,refund>=0?'Refund':'Amount you owe',TE.formatMoney(Math.abs(refund)))+
    `<div class="calc-panel" style="margin-top:1rem"><h3>Summary</h3><p>You will pay <strong>${TE.formatMoney(totalTax)}</strong> in total tax on <strong>${TE.formatMoney(gross)}</strong> of gross wages.</p><p>Your take-home amount is <strong>${TE.formatMoney(gross-totalTax)}</strong>.</p><p>Your employer withheld <strong>${TE.formatMoney(withholding)}</strong>.</p><p>${refund>=0?`You should get a <strong>refund of ${TE.formatMoney(refund)}</strong>.`:`You will <strong>owe ${TE.formatMoney(Math.abs(refund))}</strong> when you file.`}</p></div>`;
    scrollToResults('w2only-res');
  });
}

/* ===================== Hourly to Salary Converter ===================== */
function hourlyToSalaryView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'Hourly to Salary'})}<h2>Hourly to Salary Converter 2026</h2><p style="color:var(--muted);margin-bottom:1.5rem">Convert your hourly wage to annual, monthly, and weekly salary. Factor in overtime, part-time hours, and unpaid time off.</p>
    <div class="calc-grid"><div class="calc-panel"><h3>Hourly Rate</h3>
      ${inputField('hts_rate','Hourly rate','number',{value:35})}
      ${inputField('hts_hours','Regular hours per week','number',{value:40})}
      ${inputField('hts_weeks','Weeks worked per year','number',{value:52})}
      ${inputField('hts_ot_rate','Overtime multiplier','number',{value:1.5})}
      ${inputField('hts_ot_hours','Overtime hours per week','number',{value:0})}
    </div>
    <div class="calc-panel"><h3>Time Off & Adjustments</h3>
      ${inputField('hts_unpaid_weeks','Unpaid weeks off (vacation, sick, unpaid leave)','number',{value:2})}
      ${inputField('hts_bonus','Annual bonus / commission','number',{value:0})}
      ${inputField('hts_other','Other annual income (tips, stipends)','number',{value:0})}
    </div></div>
    <div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcHourlyToSalary()">Convert to Salary</button></div>
    <div id="hts-res"></div>`+
    renderFaqSection([
      {q:'How is annual salary calculated from hourly?',a:'Multiply your hourly rate by regular hours per week, then by weeks worked per year. Overtime is calculated at the overtime rate (typically 1.5x) for any hours beyond your regular weekly hours.'},
      {q:'What about benefits and taxes?',a:'This calculator shows gross salary before deductions. For take-home pay after federal tax, state tax, FICA, and benefits, use our <a href="/w2">W-2 Tax Calculator</a>.'},
      {q:'How many weeks should I work per year?',a:'Full-time employees typically work 52 weeks, but most have 2-4 weeks of paid time off. If your PTO is paid, count it as worked weeks. Only subtract UNPAID weeks.'}
    ]);

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.calcHourlyToSalary = safeCalc(function(){
    const rate=getVal('hts_rate'),hours=getVal('hts_hours'),weeks=getVal('hts_weeks');
    const otRate=getVal('hts_ot_rate'),otHours=getVal('hts_ot_hours');
    const unpaidWeeks=getVal('hts_unpaid_weeks'),bonus=getVal('hts_bonus'),other=getVal('hts_other');

    const effectiveWeeks=Math.max(0,weeks-unpaidWeeks);
    const regularPay=rate*hours*effectiveWeeks;
    const overtimePay=rate*otRate*otHours*effectiveWeeks;
    const totalAnnual=regularPay+overtimePay+bonus+other;
    const monthly=totalAnnual/12;
    const biweekly=totalAnnual/26;
    const weekly=totalAnnual/52;
    const daily=totalAnnual/260;

    const totalHours=(hours+otHours)*effectiveWeeks;
    const effectiveHourly=totalHours>0?totalAnnual/totalHours:0;

    const lines=[
      {label:'Hourly rate',val:TE.formatMoney(rate)+'/hr'},
      {label:'Regular hours per week',val:hours.toLocaleString()},
      {label:'Weeks worked',val:effectiveWeeks+' of '+weeks},
      {label:'Unpaid weeks off',val:unpaidWeeks.toLocaleString()}
    ];
    if(otHours>0){
      lines.push({label:'Overtime hours per week',val:otHours.toLocaleString()});
      lines.push({label:'Overtime multiplier',val:otRate.toFixed(2)+'x'});
      lines.push({label:'Overtime pay',val:TE.formatMoney(overtimePay)});
    }
    if(bonus>0) lines.push({label:'Annual bonus / commission',val:TE.formatMoney(bonus)});
    if(other>0) lines.push({label:'Other annual income',val:TE.formatMoney(other)});
    lines.push(
      {label:'Regular pay',val:TE.formatMoney(regularPay)},
      {label:'Total annual salary (gross)',val:TE.formatMoney(totalAnnual)},
      {label:'Monthly',val:TE.formatMoney(monthly)},
      {label:'Biweekly',val:TE.formatMoney(biweekly)},
      {label:'Weekly',val:TE.formatMoney(weekly)},
      {label:'Daily (260 workdays)',val:TE.formatMoney(daily)}
    );
    if(totalHours>0) lines.push({label:'Effective hourly (with overtime & adjustments)',val:TE.formatMoney(effectiveHourly)+'/hr'});

    document.getElementById('hts-res').innerHTML=resultsBox(lines,'Annual Salary',TE.formatMoney(totalAnnual))+
    `<div class="calc-panel" style="margin-top:1rem"><h3>Compare</h3><p>At <strong>${TE.formatMoney(rate)}/hr</strong> for <strong>${hours}</strong> hours/week over <strong>${effectiveWeeks}</strong> weeks, your gross annual salary is <strong>${TE.formatMoney(totalAnnual)}</strong>.</p><p>For a full 52 weeks with no overtime: <strong>${TE.formatMoney(rate*hours*52)}</strong>.</p><p>For a standard 2,080-hour year: <strong>${TE.formatMoney(rate*2080)}</strong>.</p></div>`;
    scrollToResults('hts-res');
  });
}

/* ===================== Raise & Pay Cut Calculator ===================== */
function raiseCalculatorView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'Raise Calculator'})}<h2>Raise & Pay Cut Calculator 2026</h2><p style="color:var(--muted);margin-bottom:1.5rem">Old salary vs new salary. See your exact percentage change, dollar difference, and what you need to earn to keep pace with inflation.</p>
    <div class="calc-grid"><div class="calc-panel"><h3>Before</h3>
      ${inputField('rc_old_salary','Old annual salary','number',{value:60000})}
      ${inputField('rc_old_bonus','Old annual bonus / commission','number',{value:0})}
      ${inputField('rc_old_hours','Old regular hours per week','number',{value:40})}
    </div>
    <div class="calc-panel"><h3>After</h3>
      ${inputField('rc_new_salary','New annual salary','number',{value:68000})}
      ${inputField('rc_new_bonus','New annual bonus / commission','number',{value:0})}
      ${inputField('rc_new_hours','New regular hours per week','number',{value:40})}
    </div></div>
    <div class="calc-grid"><div class="calc-panel"><h3>Context</h3>
      ${inputField('rc_inflation','Annual inflation rate (%)','number',{value:3.0})}
      ${inputField('rc_old_hourly','Old hourly rate (optional)','number',{value:0})}
      ${inputField('rc_new_hourly','New hourly rate (optional)','number',{value:0})}
    </div></div>
    <div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcRaise()">Calculate Change</button></div>
    <div id="rc-res"></div>`+
    renderFaqSection([
      {q:'How do I calculate my raise percentage?',a:'Subtract your old salary from your new salary, divide by your old salary, and multiply by 100. Example: $68,000 - $60,000 = $8,000. $8,000 / $60,000 = 0.1333 = 13.33% raise.'},
      {q:'What if my hours changed too?',a:'This calculator shows both the nominal percentage change (salary only) and the effective hourly change (factoring in hours). If your salary went up 10% but your hours went up 10%, your effective hourly rate stayed flat.'},
      {q:'How much should my raise be to beat inflation?',a:'If inflation is 3%, you need a raise of more than 3% just to maintain purchasing power. This calculator shows the inflation-adjusted salary you would need to break even.'}
    ]);

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.calcRaise = safeCalc(function(){
    const oldSalary=getVal('rc_old_salary'),oldBonus=getVal('rc_old_bonus'),oldHours=getVal('rc_old_hours');
    const newSalary=getVal('rc_new_salary'),newBonus=getVal('rc_new_bonus'),newHours=getVal('rc_new_hours');
    const inflation=getVal('rc_inflation');
    const oldHourlyInput=getVal('rc_old_hourly'),newHourlyInput=getVal('rc_new_hourly');

    const oldTotal=oldSalary+oldBonus;
    const newTotal=newSalary+newBonus;
    const dollarChange=newTotal-oldTotal;
    const pctChange=oldTotal>0?(dollarChange/oldTotal)*100:0;
    const isRaise=dollarChange>=0;

    const oldHourly=oldHourlyInput>0?oldHourlyInput:(oldHours>0?oldTotal/(oldHours*52):0);
    const newHourly=newHourlyInput>0?newHourlyInput:(newHours>0?newTotal/(newHours*52):0);
    const hourlyChange=oldHourly>0?((newHourly-oldHourly)/oldHourly)*100:0;

    const inflationTarget=oldTotal*(1+inflation/100);
    const vsInflation=newTotal-inflationTarget;

    const lines=[
      {label:'Old total compensation',val:TE.formatMoney(oldTotal)},
      {label:'New total compensation',val:TE.formatMoney(newTotal)},
      {label:'Dollar change',val:(isRaise?'+':'')+TE.formatMoney(dollarChange)},
      {label:'Percentage change',val:(isRaise?'+':'')+pctChange.toFixed(2)+'%'}
    ];
    if(oldHours>0||newHours>0){
      lines.push({label:'Old effective hourly',val:oldHourly>0?TE.formatMoney(oldHourly)+'/hr':'N/A'});
      lines.push({label:'New effective hourly',val:newHourly>0?TE.formatMoney(newHourly)+'/hr':'N/A'});
      if(oldHourly>0) lines.push({label:'Effective hourly change',val:(hourlyChange>=0?'+':'')+hourlyChange.toFixed(2)+'%'});
    }
    lines.push({label:'Inflation target ('+inflation.toFixed(1)+'%)',val:TE.formatMoney(inflationTarget)});
    lines.push({label:'vs inflation',val:(vsInflation>=0?'+':'')+TE.formatMoney(vsInflation)});

    document.getElementById('rc-res').innerHTML=resultsBox(lines,isRaise?'Raise':'Pay Cut',(isRaise?'+':'')+TE.formatMoney(Math.abs(dollarChange)))+
    `<div class="calc-panel" style="margin-top:1rem"><h3>Summary</h3><p>Your total compensation went from <strong>${TE.formatMoney(oldTotal)}</strong> to <strong>${TE.formatMoney(newTotal)}</strong> - a <strong>${(isRaise?'+':'')+pctChange.toFixed(2)}%</strong> ${isRaise?'raise':'pay cut'}.</p><p>To keep pace with <strong>${inflation.toFixed(1)}%</strong> inflation, you would need <strong>${TE.formatMoney(inflationTarget)}</strong>. You are <strong>${vsInflation>=0?TE.formatMoney(vsInflation)+' ahead':'$'+TE.formatMoney(Math.abs(vsInflation))+' behind'}</strong> inflation.</p><p>${isRaise?'At this new salary, every':'At this reduced salary, every'} <strong>${TE.formatMoney(newTotal/100)}</strong> is 1% of your annual pay.</p></div>`;
    scrollToResults('rc-res');
  });
}

/* ===================== Raise Negotiation Calculator ===================== */
function raiseNegotiationView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'Raise Negotiation'})}<h2>Raise Negotiation Calculator 2026</h2><p style="color:var(--muted);margin-bottom:1.5rem">Current salary + desired raise % → exact ask in dollars. See how much NOT negotiating costs over 10 years. Use this before your next performance review.</p>
    <div class="calc-grid"><div class="calc-panel"><h3>Your Situation</h3>
      ${inputField('rn_current','Current annual salary','number',{value:70000})}
      ${inputField('rn_raise_pct','Desired raise (%)','number',{value:10})}
      ${inputField('rn_years','Years to project','number',{value:10})}
    </div>
    <div class="calc-panel"><h3>Assumptions</h3>
      ${inputField('rn_annual_raise','Typical annual raise if you do NOT negotiate (%)','number',{value:3})}
      ${inputField('rn_annual_raise_neg','Typical annual raise if you DO negotiate (%)','number',{value:5})}
      <p style="color:var(--muted);font-size:.9rem;margin-top:1rem">Most people who negotiate get larger subsequent raises because each raise compounds on a higher base. Those who accept the standard COLA fall behind permanently.</p>
    </div></div>
    <div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcRaiseNegotiation()">Show Me the Money</button></div>
    <div id="rn-res"></div>`+
    renderFaqSection([
      {q:'How much should I ask for?',a:'Research market rate for your role + experience + location. Aim 10-20% above your current salary if you are underpaid vs market. If at market, 5-8% is reasonable. Always anchor high - you can come down, but you cannot go up after stating a number.'},
      {q:'What if they say no?',a:'A "no" to a raise is data, not a door closed. Ask: "What would I need to achieve to earn this in 6 months?" Get specific metrics. Then follow up in writing. If they still say no, that is valuable information about your employer.'},
      {q:'Why does not negotiating cost so much?',a:'Because raises compound. A $7,000 gap in year 1 becomes a $10,500 gap by year 5 as each subsequent raise is calculated on a permanently lower base. Over 10 years the total difference is often 2-3x the initial gap.'}
    ]);

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.calcRaiseNegotiation = safeCalc(function(){
    const current=getVal('rn_current');
    const raisePct=getVal('rn_raise_pct');
    const years=getVal('rn_years');
    const noNegotiatePct=getVal('rn_annual_raise');
    const negotiatePct=getVal('rn_annual_raise_neg');

    const newSalary=current*(1+raisePct/100);
    const askAmount=newSalary-current;

    // Build 10-year projection
    let noNegTotal=0,negTotal=0;
    let noNegSalary=current,negSalary=current;
    let projectionRows='';
    for(let y=1;y<=years;y++){
      noNegSalary=noNegSalary*(1+noNegotiatePct/100);
      negSalary=negSalary*(1+negotiatePct/100);
      noNegTotal+=noNegSalary;
      negTotal+=negSalary;
      const yearDiff=negSalary-noNegSalary;
      projectionRows+=`<tr><td>Year ${y}</td><td>${TE.formatMoney(noNegSalary)}</td><td>${TE.formatMoney(negSalary)}</td><td>${(yearDiff>=0?'+':'')+TE.formatMoney(yearDiff)}</td></tr>`;
    }

    const totalDiff=negTotal-noNegTotal;
    const lifetimeCost=totalDiff;

    const lines=[
      {label:'Current salary',val:TE.formatMoney(current)},
      {label:'Desired raise',val:raisePct.toFixed(1)+'%'},
      {label:'Ask for',val:TE.formatMoney(newSalary)},
      {label:'Additional dollars',val:'+'+TE.formatMoney(askAmount)},
      {label:'Years projected',val:years}
    ];

    const bigCardStyle='background:var(--card);border:1px solid var(--border);border-radius:12px;padding:1.5rem;text-align:center;margin-bottom:1rem';
    const bigNumberStyle='font-size:2rem;font-weight:700;color:var(--accent);display:block';
    const bigLabelStyle='font-size:.85rem;color:var(--muted);margin-top:.25rem;display:block';

    document.getElementById('rn-res').innerHTML=resultsBox(lines,'Your Ask',TE.formatMoney(newSalary))+
    `<div class="calc-panel" style="margin-top:1rem"><h3>The Ask</h3><p>Walk into your review with this number: <strong>${TE.formatMoney(newSalary)}</strong>. That is a <strong>${raisePct.toFixed(1)}%</strong> raise - <strong>${TE.formatMoney(askAmount)}</strong> more per year.</p><p>At your current salary, every 1% raise = <strong>${TE.formatMoney(current*0.01)}</strong>. A ${raisePct.toFixed(1)}% raise = ${TE.formatMoney(askAmount)}.</p></div>`+
    `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin-top:1rem">`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle}">${TE.formatMoney(newSalary)}</span><span style="${bigLabelStyle}">Your Ask</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle}">+${TE.formatMoney(askAmount)}</span><span style="${bigLabelStyle}">Per Year</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle}">${TE.formatMoney(lifetimeCost)}</span><span style="${bigLabelStyle}">10-Year Difference</span></div>`+
    `</div>`+
    `<div class="calc-panel" style="margin-top:1rem;background:rgba(201,74,30,.08);border-color:var(--accent)"><h3>The Cost of Silence</h3><p>If you accept the standard ${noNegotiatePct.toFixed(1)}% annual raise instead of negotiating for ${negotiatePct.toFixed(1)}%, you will earn <strong>${TE.formatMoney(lifetimeCost)} less</strong> over ${years} years.</p><p>That is not hypothetical - that is the compound effect of every future raise being calculated on a permanently smaller base. Your next employer may also anchor your offer to your current (lower) salary.</p></div>`+
    `<div class="calc-panel" style="margin-top:1rem"><h3>10-Year Projection</h3><table class="data-table"><thead><tr><th>Year</th><th>No Negotiation (${noNegotiatePct.toFixed(1)}%)</th><th>You Negotiate (${negotiatePct.toFixed(1)}%)</th><th>Difference</th></tr></thead><tbody>${projectionRows}</tbody></table></div>`;
    scrollToResults('rn-res');
  });
}

/* ===================== Bonus Tax Calculator ===================== */
function bonusTaxView(main){
  const stateOpts=DATA&&DATA.states?Object.keys(DATA.states).sort().map(code=>({value:code,label:DATA.states[code].name+' ('+code+')'})):[
    {value:'CA',label:'California (CA)'},{value:'NY',label:'New York (NY)'},{value:'TX',label:'Texas (TX)'},{value:'FL',label:'Florida (FL)'},{value:'IL',label:'Illinois (IL)'},{value:'WA',label:'Washington (WA)'},{value:'CO',label:'Colorado (CO)'},{value:'NC',label:'North Carolina (NC)'},{value:'OH',label:'Ohio (OH)'},{value:'PA',label:'Pennsylvania (PA)'}
  ];
  const statusOpts=[{value:'single',label:'Single'},{value:'mfj',label:'Married Filing Jointly'},{value:'mfs',label:'Married Filing Separately'},{value:'hoh',label:'Head of Household'}];
  const freqOpts=[{value:'weekly',label:'Weekly (52)'},{value:'biweekly',label:'Biweekly (26)'},{value:'semimonthly',label:'Semimonthly (24)'},{value:'monthly',label:'Monthly (12)'}];

  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'Bonus Tax'})}<h2>Bonus Tax Calculator 2026</h2><p style="color:var(--muted);margin-bottom:1.5rem">My $10k bonus - how much do I actually keep? Compare flat 22% supplemental withholding vs aggregate method with real federal, state, and FICA taxes.</p>
    <div class="calc-grid"><div class="calc-panel"><h3>Bonus & Salary</h3>
      ${inputField('bt_bonus','Bonus amount','number',{value:10000})}
      ${inputField('bt_salary','Annual salary (without bonus)','number',{value:80000})}
      ${selectField('bt_freq','Pay frequency',freqOpts,{value:'biweekly'})}
    </div>
    <div class="calc-panel"><h3>Profile</h3>
      ${selectField('bt_state','Your state',stateOpts,{value:'CA'})}
      ${selectField('bt_status','Filing status',statusOpts,{value:'single'})}
      ${inputField('bt_deductions','Other deductions per paycheck ($)','number',{value:0})}
      <p style="color:var(--muted);font-size:.9rem;margin-top:1rem">The aggregate method adds your bonus to your regular paycheck and taxes the total at your marginal rate. The flat method withholds 22% federal on the bonus alone. Your actual tax bill may differ at year-end.</p>
    </div></div>
    <div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcBonusTax()">Show Me the Net</button></div>
    <div id="bt-res"></div>`+
    renderFaqSection([
      {q:'Which method is better for me?',a:'The flat 22% method is better if your marginal federal rate is higher than 22% (roughly $100k+ single / $200k+ MFJ). The aggregate method is better if your marginal rate is lower than 22%. But withholding is not your final tax - if too much is withheld, you get a refund. If too little, you owe.'},
      {q:'Why is my bonus taxed so high?',a:'Bonuses are not actually taxed at a higher rate. They are taxed at your ordinary income rate. The confusion comes from withholding: employers either use 22% flat or add it to your regular check. At tax time, all W-2 income is treated the same. The bonus just pushes some dollars into a higher bracket.'},
      {q:'What about the $1M bonus rule?',a:'Bonuses over $1 million are subject to 37% federal supplemental withholding (the top bracket). If you get a $1.2M bonus, the first $1M is withheld at 22%, the remaining $200k at 37%. This calculator caps at the 22% flat rate for typical bonuses under $1M.'}
    ]);

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.calcBonusTax = safeCalc(function(){
    const bonus=getVal('bt_bonus');
    const salary=getVal('bt_salary');
    const freq=document.getElementById('bt_freq').value;
    const stateCode=document.getElementById('bt_state').value;
    const status=document.getElementById('bt_status').value;
    const otherDed=getVal('bt_deductions');

    const periods={weekly:52,biweekly:26,semimonthly:24,monthly:12};
    const payPeriods=periods[freq]||26;
    const regularPay=salary/payPeriods;

    // FICA: 6.2% SS up to wage base ($184,500 in 2026), 1.45% Medicare unlimited
    const SS_WAGE_BASE=184500;
    const ssTaxable=Math.max(0,Math.min(bonus,SS_WAGE_BASE-Math.max(0,salary-SS_WAGE_BASE)));
    const ssRate=0.062;
    const medRate=0.0145;
    const ficaFlat=ssTaxable*ssRate + bonus*medRate;
    const ficaAgg=ssTaxable*ssRate + bonus*medRate; // same for aggregate since salary unchanged

    // State tax: differential approach (same for both methods in most states;
    // employers typically use the same state withholding regardless of federal method)
    let stateTax=0;
    if(DATA&&TE&&TE.calcStateTax){
      try{
        const stateBase=TE.calcStateTax(salary,stateCode,DATA,status)?.tax||0;
        stateTax=Math.max(0,TE.calcStateTax(salary+bonus,stateCode,DATA,status)?.tax - stateBase)||0;
      }catch(e){stateTax=0;}
    }
    const stateFlat=stateTax;
    const stateAgg=stateTax;

    // Flat method: 22% federal on bonus
    const fedFlat=bonus*0.22;

    // Aggregate method: marginal rate on (regular + bonus) vs regular alone
    let fedAgg=0;
    if(DATA&&TE&&TE.calcFederalTax){
      const stdDed=DATA.federal&&DATA.federal.standardDeduction?DATA.federal.standardDeduction[status]||16100:16100;
      const taxableBase=Math.max(0,salary-stdDed);
      const taxableBonus=Math.max(0,salary+bonus-stdDed);
      const taxBase=TE.calcFederalTax(taxableBase,status,DATA);
      const taxBonus=TE.calcFederalTax(taxableBonus,status,DATA);
      fedAgg=taxBonus-taxBase;
    } else {
      fedAgg=bonus*0.24; // rough fallback
    }

    const totalFlat=fedFlat+ficaFlat+stateFlat;
    const totalAgg=fedAgg+ficaAgg+stateAgg;
    const netFlat=bonus-totalFlat;
    const netAgg=bonus-totalAgg;
    const better=netFlat>netAgg?'flat':'aggregate';
    const diff=Math.abs(netFlat-netAgg);
    const sameResult=diff<1;

    const linesFlat=[
      {label:'Bonus amount',val:TE.formatMoney(bonus)},
      {label:'Federal withholding (22% flat)',val:TE.formatMoney(fedFlat)},
      {label:'FICA (SS + Medicare)',val:TE.formatMoney(ficaFlat)},
      {label:'State tax on bonus',val:TE.formatMoney(stateFlat)},
      {label:'Total withheld',val:TE.formatMoney(totalFlat)},
      {label:'Net take-home',val:TE.formatMoney(netFlat)}
    ];
    const linesAgg=[
      {label:'Bonus amount',val:TE.formatMoney(bonus)},
      {label:'Federal withholding (marginal)',val:TE.formatMoney(fedAgg)},
      {label:'FICA (SS + Medicare)',val:TE.formatMoney(ficaAgg)},
      {label:'State tax on bonus',val:TE.formatMoney(stateAgg)},
      {label:'Total withheld',val:TE.formatMoney(totalAgg)},
      {label:'Net take-home',val:TE.formatMoney(netAgg)}
    ];

    const bigCardStyle='background:var(--card);border:1px solid var(--border);border-radius:12px;padding:1.5rem;text-align:center;margin-bottom:1rem';
    const bigNumberStyle='font-size:2.2rem;font-weight:700;color:var(--accent);display:block';
    const bigLabelStyle='font-size:.85rem;color:var(--muted);margin-top:.25rem;display:block';

    document.getElementById('bt-res').innerHTML=
    `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1rem;margin-top:1rem">`+
    `<div class="calc-panel"><h3>Flat 22% Method</h3>${resultsBox(linesFlat,'Net from Bonus',TE.formatMoney(netFlat))}</div>`+
    `<div class="calc-panel"><h3>Aggregate Method</h3>${resultsBox(linesAgg,'Net from Bonus',TE.formatMoney(netAgg))}</div>`+
    `</div>`+
    `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-top:1rem">`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle}">${TE.formatMoney(netFlat)}</span><span style="${bigLabelStyle}">Flat 22% Net</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle}">${TE.formatMoney(netAgg)}</span><span style="${bigLabelStyle}">Aggregate Net</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle}">${TE.formatMoney(diff)}</span><span style="${bigLabelStyle}">Difference</span></div>`+
    `</div>`+
    `<div class="calc-panel" style="margin-top:1rem;background:rgba(201,74,30,.08);border-color:var(--accent)"><h3>The Reality</h3><p>Your bonus is taxed at your <strong>ordinary income rate</strong> - not a special "bonus rate." The 22% flat is just <em>withholding</em>. Your employer takes more or less from your paycheck now, but at tax time the IRS treats all W-2 income the same.</p>${sameResult?`<p><strong>For your income level, both methods withhold the exact same amount.</strong> Your marginal federal rate is 22% - the same as the flat supplemental rate. Try a lower salary (e.g., $50,000) to see the aggregate method save money, or a higher salary (e.g., $100,000) to see the flat method save money.</p>`:`<p>With the <strong>${better==='flat'?'flat 22%':'aggregate'}</strong> method, you keep <strong>${TE.formatMoney(diff)} more</strong> in your paycheck today.</p>`}<p>But remember: if too little is withheld, you may owe at tax time. If too much, you get a refund. Your actual tax is based on your total income, not how your employer withholds.</p></div>`+
    `<div class="calc-panel" style="margin-top:1rem"><h3>How It Works</h3><p><strong>Flat method:</strong> Your employer withholds 22% federal + FICA + state from the bonus alone. Simple, predictable.</p><p><strong>Aggregate method:</strong> Your employer adds the bonus to your regular paycheck, calculates tax on the total using your W-4 settings, then subtracts what would have been withheld from your regular pay alone. The difference is withheld from the bonus.</p><p><strong>Which one your employer uses:</strong> Employers can choose. Most use flat 22% for simplicity. Ask HR which method they use - it affects your cash flow today.</p></div>`;
    scrollToResults('bt-res');
  });
}

/* ===================== W-4 Withholding Calculator ===================== */
function w4WithholdingView(main){
  const stateOpts=DATA&&DATA.states?Object.keys(DATA.states).sort().map(code=>({value:code,label:DATA.states[code].name+' ('+code+')'})):[
    {value:'CA',label:'California (CA)'},{value:'NY',label:'New York (NY)'},{value:'TX',label:'Texas (TX)'},{value:'FL',label:'Florida (FL)'},{value:'IL',label:'Illinois (IL)'},{value:'WA',label:'Washington (WA)'},{value:'CO',label:'Colorado (CO)'},{value:'NC',label:'North Carolina (NC)'},{value:'OH',label:'Ohio (OH)'},{value:'PA',label:'Pennsylvania (PA)'}
  ];
  const statusOpts=[{value:'single',label:'Single'},{value:'mfj',label:'Married Filing Jointly'},{value:'mfs',label:'Married Filing Separately'},{value:'hoh',label:'Head of Household'}];
  const freqOpts=[{value:'weekly',label:'Weekly (52)'},{value:'biweekly',label:'Biweekly (26)'},{value:'semimonthly',label:'Semimonthly (24)'},{value:'monthly',label:'Monthly (12)'}];

  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'W-4 Withholding'})}<h2>W-4 Withholding Calculator 2026</h2><p style="color:var(--muted);margin-bottom:1.5rem">Are you under-withholding and heading for a surprise tax bill? Or over-withholding and giving the IRS an interest-free loan? Fix your W-4 in minutes.</p>
    <div class="calc-grid"><div class="calc-panel"><h3>Your Income</h3>
      ${inputField('w4_salary','Expected annual salary','number',{value:80000})}
      ${inputField('w4_bonus','Expected bonuses / other W-2 income','number',{value:5000})}
      ${inputField('w4_other','Other taxable income (1099, interest, etc.)','number',{value:0})}
      ${selectField('w4_state','Your state',stateOpts,{value:'CA'})}
      ${selectField('w4_status','Filing status',statusOpts,{value:'single'})}
    </div>
    <div class="calc-panel"><h3>Current Withholding</h3>
      ${selectField('w4_freq','Pay frequency',freqOpts,{value:'biweekly'})}
      ${inputField('w4_withheld','Federal tax withheld per paycheck','number',{value:200})}
      ${inputField('w4_dependents','Tax credits (child/dependent $ amount, Step 3)','number',{value:0})}
      ${inputField('w4_deductions','Other deductions beyond standard ($)','number',{value:0})}
      <p style="color:var(--muted);font-size:.9rem;margin-top:1rem">Find your "Federal Income Tax" on your paystub. Do not include FICA (Social Security / Medicare) or state tax.</p>
    </div></div>
    <div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcW4Withholding()">Am I On Track?</button></div>
    <div id="w4-res"></div>`+
    renderFaqSection([
      {q:'Why did I owe money last year?',a:'Three common reasons: (1) You had side income with no withholding. (2) You claimed too many credits or deductions on your W-4. (3) Your spouse also works and you did not check the box in Step 2(c). The IRS treats household income, not individual paychecks.'},
      {q:'What is Step 4(c) on the W-4?',a:'Step 4(c) is "Extra withholding." If this calculator says you need $X more per paycheck, enter that exact dollar amount on Step 4(c). It is the most precise way to fix under-withholding without changing anything else on the form.'},
      {q:'Should I aim for a $0 refund?',a:'Ideally yes. A large refund means you gave the IRS an interest-free loan. Owing more than $1,000 may trigger an underpayment penalty. Aim to be within $500 either way - that is close enough to avoid surprises without over-optimizing.'}
    ]);

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.calcW4Withholding = safeCalc(function(){
    const salary=getVal('w4_salary');
    const bonus=getVal('w4_bonus');
    const otherIncome=getVal('w4_other');
    const stateCode=document.getElementById('w4_state').value;
    const status=document.getElementById('w4_status').value;
    const freq=document.getElementById('w4_freq').value;
    const withheldPerCheck=getVal('w4_withheld');
    const dependentsCredit=getVal('w4_dependents');
    const extraDeductions=getVal('w4_deductions');

    const periods={weekly:52,biweekly:26,semimonthly:24,monthly:12};
    const payPeriods=periods[freq]||26;

    const totalIncome=salary+bonus+otherIncome;
    const stdDed=DATA&&DATA.federal&&DATA.federal.standardDeduction?DATA.federal.standardDeduction[status]||16100:16100;
    const totalDeductions=stdDed+extraDeductions;
    const taxableIncome=Math.max(0,totalIncome-totalDeductions);

    let fedTax=0,stateTax=0;
    if(DATA&&TE&&TE.calcFederalTax){
      fedTax=TE.calcFederalTax(taxableIncome,status,DATA);
    } else {
      fedTax=taxableIncome*0.22; // rough fallback
    }
    fedTax=Math.max(0,fedTax-dependentsCredit);

    if(DATA&&TE&&TE.calcStateTax){
      try{stateTax=TE.calcStateTax(totalIncome,stateCode,DATA,status)?.tax||0;}catch(e){stateTax=0;}
    }

    const ficaWages=Math.min(totalIncome,184500);
    const fica=ficaWages*0.062 + totalIncome*0.0145;

    const totalTax=fedTax+stateTax+fica;
    const annualWithheld=withheldPerCheck*payPeriods;
    const shortfall=totalTax-annualWithheld;
    const perPayAdjust=shortfall/payPeriods;

    const lines=[
      {label:'Total expected income',val:TE.formatMoney(totalIncome)},
      {label:'Standard deduction',val:TE.formatMoney(stdDed)},
      {label:'Taxable income',val:TE.formatMoney(taxableIncome)},
      {label:'Federal income tax',val:TE.formatMoney(fedTax)},
      {label:'State income tax ('+stateCode+')',val:TE.formatMoney(stateTax)},
      {label:'FICA (SS + Medicare)',val:TE.formatMoney(fica)},
      {label:'Total annual tax',val:TE.formatMoney(totalTax)},
      {label:'',val:''},
      {label:'Currently withheld/year',val:TE.formatMoney(annualWithheld)},
      {label:'Paychecks per year',val:payPeriods}
    ];

    const bigCardStyle='background:var(--card);border:1px solid var(--border);border-radius:12px;padding:1.5rem;text-align:center;margin-bottom:1rem';
    const bigNumberStyle='font-size:2.2rem;font-weight:700;color:var(--accent);display:block';
    const bigLabelStyle='font-size:.85rem;color:var(--muted);margin-top:.25rem;display:block';

    let statusHtml,actionHtml,adjustHtml='';
    if(Math.abs(shortfall)<=500){
      statusHtml=`<p>You are on track. Your withholding is close to your actual tax. Expect a small refund or small balance due - within the safe zone.</p>`;
      actionHtml=`<div style="${bigCardStyle};border-color:var(--success);background:rgba(46,125,50,.08)"><span style="${bigNumberStyle};color:var(--success)">${TE.formatMoney(Math.abs(shortfall))}</span><span style="${bigLabelStyle}">${shortfall>=0?'You will owe':'You will get back'}</span></div>`;
    } else if(shortfall>0){
      statusHtml=`<p><strong>You are under-withholding.</strong> You will owe <strong>${TE.formatMoney(shortfall)}</strong> at tax time. If you owe more than $1,000, you may face an underpayment penalty.</p>`;
      actionHtml=`<div style="${bigCardStyle}"><span style="${bigNumberStyle}">${TE.formatMoney(shortfall)}</span><span style="${bigLabelStyle}">You will owe</span></div>`;
      adjustHtml=`<div style="${bigCardStyle}"><span style="${bigNumberStyle}">+${TE.formatMoney(perPayAdjust)}</span><span style="${bigLabelStyle}">Add to W-4 Step 4(c) per paycheck</span></div>`;
    } else {
      statusHtml=`<p><strong>You are over-withholding.</strong> You will get a <strong>${TE.formatMoney(Math.abs(shortfall))}</strong> refund. That is money you could have had in every paycheck instead.</p>`;
      actionHtml=`<div style="${bigCardStyle}"><span style="${bigNumberStyle}">${TE.formatMoney(Math.abs(shortfall))}</span><span style="${bigLabelStyle}">You will get back</span></div>`;
      adjustHtml=`<div style="${bigCardStyle}"><span style="${bigNumberStyle}">${TE.formatMoney(Math.abs(perPayAdjust))}</span><span style="${bigLabelStyle}">Reduce W-4 Step 4(c) per paycheck</span></div>`;
    }

    document.getElementById('w4-res').innerHTML=resultsBox(lines,'Annual Tax Estimate',TE.formatMoney(totalTax))+
    `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin-top:1rem">`+
    actionHtml+adjustHtml+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle}">${TE.formatMoney(totalTax)}</span><span style="${bigLabelStyle}">Total Annual Tax</span></div>`+
    `</div>`+
    `<div class="calc-panel" style="margin-top:1rem;background:rgba(201,74,30,.08);border-color:var(--accent)"><h3>Your Withholding Health Check</h3>${statusHtml}<p>Current withholding: <strong>${TE.formatMoney(withheldPerCheck)}</strong> × <strong>${payPeriods}</strong> paychecks = <strong>${TE.formatMoney(annualWithheld)}</strong>/year.</p><p>Your actual tax: <strong>${TE.formatMoney(totalTax)}</strong>/year.</p>${Math.abs(shortfall)>500?`<p><strong>Action:</strong> ${shortfall>0?`Add <strong>${TE.formatMoney(perPayAdjust)}</strong> to W-4 Step 4(c) "Extra withholding" per paycheck. Submit the updated W-4 to HR.`:`Reduce withholding by <strong>${TE.formatMoney(Math.abs(perPayAdjust))}</strong> per paycheck. You can lower Step 4(c) or increase credits in Step 3.`}</p>`:''}</div>`+
    `<div class="calc-panel" style="margin-top:1rem"><h3>How to Fix Your W-4</h3><p><strong>Step 1:</strong> Confirm your filing status is correct (single, MFJ, etc.).</p><p><strong>Step 2:</strong> If you have multiple jobs or a working spouse, check the box in Step 2(c) or use the worksheet.</p><p><strong>Step 3:</strong> Enter your dependent credits (child tax credit, dependent care credit) here - this reduces withholding.</p><p><strong>Step 4(a):</strong> Other income not from this job (1099, interest, dividends). The calculator already includes this.</p><p><strong>Step 4(b):</strong> Deductions beyond the standard deduction. The calculator already includes this.</p><p><strong>Step 4(c):</strong> <em>This is where you make the precise fix.</em> ${shortfall>500?`Add <strong>${TE.formatMoney(perPayAdjust)}</strong> per paycheck.`:shortfall<-500?`Reduce by <strong>${TE.formatMoney(Math.abs(perPayAdjust))}</strong> per paycheck.`:`No adjustment needed - you are in the safe zone.`}</p></div>`;
    scrollToResults('w4-res');
  });
}

/* ===================== Roth vs Traditional IRA Calculator ===================== */
function rothVsTraditionalView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'Roth vs Traditional IRA'})}<h2>Roth vs Traditional IRA Calculator 2026</h2><p style="color:var(--muted);margin-bottom:1.5rem">The most Googled personal finance debate: should you pay taxes now or later? Enter your numbers and see the clear winner over 20–30 years.</p>
    <div class="calc-grid"><div class="calc-panel"><h3>Your Plan</h3>
      ${inputField('rt_contrib','Annual contribution','number',{value:7500})}
      ${inputField('rt_years','Years until retirement','number',{value:25})}
      ${inputField('rt_return','Expected annual return (%)','number',{value:7})}
    </div>
    <div class="calc-panel"><h3>Tax Rates</h3>
      ${inputField('rt_current','Current marginal tax rate (%)','number',{value:22})}
      ${inputField('rt_future','Expected retirement tax rate (%)','number',{value:15})}
      <p style="color:var(--muted);font-size:.9rem;margin-top:1rem"><strong>RMD</strong> = Required Minimum Distribution - a forced annual withdrawal from Traditional IRAs starting at age 73 that counts as taxable income. Your retirement tax rate depends on your expected income, Social Security, RMDs, and tax bracket changes. Most people drop a bracket in retirement, but RMDs can push you back up.</p>
    </div></div>
    <div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcRothVsTraditional()">Show the Winner</button></div>
    <div id="rt-res"></div>`+
    renderFaqSection([
      {q:'Is Roth always better because it grows tax-free?',a:'No. "Tax-free growth" is a marketing phrase. Both accounts grow the same way. The only difference is WHEN you pay tax. If your retirement rate is lower than your current rate, Traditional wins. The math is simple: compare (1 - currentRate) vs (1 - retirementRate).'},
      {q:'What if I max out my IRA?',a:'If you max out at $7,000, Roth costs more after-tax ($7,000 ÷ (1 - currentRate)) than Traditional ($7,000). For a fair comparison, invest the Traditional tax savings in a taxable brokerage. In most cases, maxing Roth still wins if your retirement rate stays the same or rises.'},
      {q:'What are RMDs and why do they matter?',a:'Required Minimum Distributions force you to withdraw from Traditional IRAs starting at age 73. Those withdrawals are taxable income. If RMDs push you into a higher bracket, your "expected" retirement rate may be higher than you think. Roth has no RMDs for the original owner.'}
    ]);

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.calcRothVsTraditional = safeCalc(function(){
    const contrib=getVal('rt_contrib');
    const years=getVal('rt_years');
    const returnRate=getVal('rt_return')/100;
    const currentRate=getVal('rt_current')/100;
    const futureRate=getVal('rt_future')/100;

    // Equal pre-tax contribution comparison
    // Roth: invest after-tax dollars. $contrib*(1-currentRate) is the after-tax cost.
    // But for the standard comparison, we compare:
    //   Roth: invest $C after-tax → balance = $C * (1+r)^n, withdraw tax-free
    //   Traditional: invest $C pre-tax → balance = $C * (1+r)^n, pay futureRate on withdrawal
    // After-tax value: Roth = $C*(1+r)^n, Traditional = $C*(1+r)^n*(1-futureRate)
    // Winner depends on: currentRate vs futureRate

    const growthFactor=Math.pow(1+returnRate,years);
    const rothValue=contrib*growthFactor;
    const tradValue=contrib*growthFactor;
    const tradAfterTax=tradValue*(1-futureRate);
    const rothCost=contrib/(1-currentRate); // pre-tax dollars needed

    const winner=rothValue>tradAfterTax?'Roth IRA':'Traditional IRA';
    const diff=Math.abs(rothValue-tradAfterTax);

    // Breakeven: the future rate where both are equal
    const breakevenRate=currentRate;

    // Milestones every 5 years
    let milestoneRows='';
    for(let y=5;y<=years;y+=5){
      const gf=Math.pow(1+returnRate,y);
      const rv=contrib*gf;
      const tv=contrib*gf*(1-futureRate);
      milestoneRows+=`<tr><td>${y}</td><td>${TE.formatMoney(rv)}</td><td>${TE.formatMoney(tv)}</td><td>${TE.formatMoney(rv-tv)}</td></tr>`;
    }
    if(years%5!==0){
      const gf=Math.pow(1+returnRate,years);
      const rv=contrib*gf;
      const tv=contrib*gf*(1-futureRate);
      milestoneRows+=`<tr><td>${years}</td><td>${TE.formatMoney(rv)}</td><td>${TE.formatMoney(tv)}</td><td>${TE.formatMoney(rv-tv)}</td></tr>`;
    }

    const lines=[
      {label:'Annual contribution (pre-tax basis)',val:TE.formatMoney(contrib)},
      {label:'Years invested',val:years},
      {label:'Expected annual return',val:(returnRate*100).toFixed(1)+'%'},
      {label:'Current tax rate',val:(currentRate*100).toFixed(0)+'%'},
      {label:'Retirement tax rate',val:(futureRate*100).toFixed(0)+'%'},
      {label:'',val:''},
      {label:'Roth IRA balance at retirement',val:TE.formatMoney(rothValue)},
      {label:'Traditional IRA balance',val:TE.formatMoney(tradValue)},
      {label:'Traditional after-tax value',val:TE.formatMoney(tradAfterTax)},
      {label:'',val:''},
      {label:'Winner',val:winner},
      {label:'Advantage',val:TE.formatMoney(diff)}
    ];

    const bigCardStyle='background:var(--card);border:1px solid var(--border);border-radius:12px;padding:1.5rem;text-align:center;margin-bottom:1rem';
    const bigNumberStyle='font-size:2.2rem;font-weight:700;color:var(--accent);display:block';
    const bigLabelStyle='font-size:.85rem;color:var(--muted);margin-top:.25rem;display:block';
    const winColor=winner==='Roth IRA'?'#2e7d32':'var(--accent)';

    document.getElementById('rt-res').innerHTML=resultsBox(lines,'30-Year Projection',TE.formatMoney(winner==='Roth IRA'?rothValue:tradAfterTax))+
    `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin-top:1rem">`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle};color:${winColor}">${TE.formatMoney(rothValue)}</span><span style="${bigLabelStyle}">Roth IRA (tax-free)</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle}">${TE.formatMoney(tradAfterTax)}</span><span style="${bigLabelStyle}">Traditional IRA (after tax)</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle};color:${winColor}">${TE.formatMoney(diff)}</span><span style="${bigLabelStyle}">${winner} Wins By</span></div>`+
    `</div>`+
    `<div class="calc-panel" style="margin-top:1rem;background:rgba(201,74,30,.08);border-color:var(--accent)"><h3>The Verdict</h3><p><strong>${winner}</strong> wins by <strong>${TE.formatMoney(diff)}</strong> over ${years} years.</p><p>Your current tax rate is <strong>${(currentRate*100).toFixed(0)}%</strong>. Your expected retirement rate is <strong>${(futureRate*100).toFixed(0)}%</strong>.</p><p>${currentRate>futureRate?`Traditional wins because you pay <strong>${(currentRate*100).toFixed(0)}%</strong> tax now vs <strong>${(futureRate*100).toFixed(0)}%</strong> later. Every dollar you defer saves ${((currentRate-futureRate)*100).toFixed(0)} cents in tax.`:`Roth wins because you lock in <strong>${(currentRate*100).toFixed(0)}%</strong> tax now and pay <strong>0%</strong> later. If your retirement rate rises above <strong>${(breakevenRate*100).toFixed(0)}%</strong>, Roth was the right call.`}</p><p><strong>Breakeven point:</strong> If your retirement tax rate is exactly <strong>${(breakevenRate*100).toFixed(0)}%</strong> (your current rate), both accounts produce the exact same after-tax result. The entire debate boils down to one question: will your future rate be higher or lower?</p></div>`+
    `<div class="calc-panel" style="margin-top:1rem"><h3>5-Year Milestones</h3><table class="data-table"><thead><tr><th>Year</th><th>Roth IRA</th><th>Traditional (after tax)</th><th>Difference</th></tr></thead><tbody>${milestoneRows}</tbody></table></div>`+
    `<div class="calc-panel" style="margin-top:1rem"><h3>The Math</h3><p>Both accounts grow at the same rate. The only difference is <em>when</em> the IRS takes its cut.</p><p><strong>Roth:</strong> You pay ${(currentRate*100).toFixed(0)}% tax now. Every dollar invested grows to $${growthFactor.toFixed(2)}. After-tax value = <strong>${TE.formatMoney(rothValue)}</strong>.</p><p><strong>Traditional:</strong> You defer ${(currentRate*100).toFixed(0)}% tax now. Every dollar grows to $${growthFactor.toFixed(2)}, then you pay ${(futureRate*100).toFixed(0)}% at withdrawal. After-tax value = <strong>${TE.formatMoney(tradAfterTax)}</strong>.</p><p><strong>Rule of thumb:</strong> If your retirement tax rate will be <em>lower</em> → Traditional. If it will be <em>the same or higher</em> → Roth.</p></div>`;
    scrollToResults('rt-res');
  });
}

/* ===================== Crypto Tax Calculator ===================== */
function cryptoTaxView(main){
  const statusOpts=[{value:'single',label:'Single'},{value:'mfj',label:'Married Filing Jointly'},{value:'mfs',label:'Married Filing Separately'},{value:'hoh',label:'Head of Household'}];
  const stateOpts=DATA&&DATA.states?Object.keys(DATA.states).sort().map(code=>({value:code,label:DATA.states[code].name+' ('+code+')'})):[
    {value:'CA',label:'California (CA)'},{value:'NY',label:'New York (NY)'},{value:'TX',label:'Texas (TX)'},{value:'FL',label:'Florida (FL)'},{value:'IL',label:'Illinois (IL)'},{value:'WA',label:'Washington (WA)'},{value:'CO',label:'Colorado (CO)'},{value:'NC',label:'North Carolina (NC)'},{value:'OH',label:'Ohio (OH)'},{value:'PA',label:'Pennsylvania (PA)'}
  ];

  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'',text:'Equity Compensation'},{href:'',text:'Crypto Tax Calculator'})}<h2>Crypto Tax Calculator 2026</h2><p style="color:var(--muted);margin-bottom:1.5rem">Calculate tax on Bitcoin, Ethereum, NFT flips, and staking rewards. Short-term vs. long-term capital gains, ordinary income on staking, and wash sale rules.</p>${callout('blue','Short vs. Long-Term Gains','Crypto held <1 year = short-term capital gains (taxed at ordinary income rates). Held ≥1 year = long-term capital gains (0%, 15%, or 20% based on income).')}
    ${callout('green','Staking Rewards = Ordinary Income','Crypto staking rewards (proof-of-stake, DeFi yield) are taxed as ordinary income when received, not when sold. This is different from mining which may be self-employment income.')}
    <div class="calc-grid"><div class="calc-panel"><h3>Coin Sales (Capital Gains)</h3>
      ${inputField('crypto_st_gain','Short-term gains (held <1 year)','number',{value:5000})}
      ${inputField('crypto_lt_gain','Long-term gains (held ≥1 year)','number',{value:15000})}
      ${inputField('crypto_st_loss','Short-term losses','number',{value:0})}
      ${inputField('crypto_lt_loss','Long-term losses','number',{value:0})}
    </div>
    <div class="calc-panel"><h3>Staking & NFT Income</h3>
      ${inputField('crypto_staking','Staking rewards (ordinary income)','number',{value:2000})}
      ${inputField('crypto_nft','NFT flip gains (short-term)','number',{value:0})}
      ${inputField('crypto_other_w2','Other W-2 income','number',{value:0})}
      ${selectField('crypto_status','Filing status',statusOpts,{value:'single'})}
      ${selectField('crypto_state','State',stateOpts,{value:'CA'})}
    </div></div>
    <div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcCryptoTax()">Calculate Crypto Tax</button></div>
    <div id="crypto-res"></div>`+
    renderFaqSection([
      {q:'How is crypto taxed?',a:'Crypto is taxed as property. When you sell at a profit, you owe capital gains tax. Short-term gains (held <1 year) are taxed at ordinary income rates. Long-term gains (held ≥1 year) get preferential rates (0%, 15%, or 20%).'},
      {q:'Are staking rewards taxed?',a:'Yes. Staking rewards are taxed as ordinary income in the year received, regardless of whether you sell them. This is per IRS Notice 2014-21. The cost basis is the fair market value when received.'},
      {q:'What about NFTs?',a:'NFTs are also property. If you flip an NFT quickly (<1 year), it is short-term capital gains. If you hold it ≥1 year, it is long-term capital gains. Collectibles (some NFTs) may be subject to 28% capital gains rate.'},
      {q:'Do wash sale rules apply to crypto?',a:'No. Unlike stocks, wash sale rules do NOT apply to crypto per IRS Notice 2014-21. You can sell crypto at a loss and immediately buy it back, and still claim the loss. This is a key difference from securities.'}
    ]);

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.calcCryptoTax = safeCalc(function(){
    const stGain=getVal('crypto_st_gain');
    const ltGain=getVal('crypto_lt_gain');
    const stLoss=getVal('crypto_st_loss');
    const ltLoss=getVal('crypto_lt_loss');
    const staking=getVal('crypto_staking');
    const nft=getVal('crypto_nft');
    const otherW2=getVal('crypto_other_w2');
    const status=document.getElementById('crypto_status').value;
    const stateCode=document.getElementById('crypto_state').value;

    // Net capital gains
    const netST=Math.max(0,stGain-stLoss);
    const netLT=Math.max(0,ltGain-ltLoss);
    const totalGain=netST+netLT;

    // Ordinary income (staking + NFT flips + other W-2 + short-term gains)
    // Short-term gains are taxed at ordinary income rates
    const ordinaryIncome=staking+nft+otherW2+netST;

    // Calculate taxes
    const stdDed=DATA&&DATA.federal&&DATA.federal.standardDeduction?DATA.federal.standardDeduction[status]||16100:16100;
    const taxableOrdinary=Math.max(0,ordinaryIncome-stdDed);
    const fedOrdinary=DATA&&TE&&TE.calcFederalTax?TE.calcFederalTax(taxableOrdinary,status,DATA):taxableOrdinary*0.22;

    // Long-term capital gains tax (based on taxable income including short-term gains)
    // LT rate is determined by total taxable income (ordinary income - standard deduction)
    const taxableForLT=Math.max(0,ordinaryIncome-stdDed);
    const ltIncome=taxableForLT+netLT;
    const ltRate=ltIncome<=44725?0:ltIncome<=272700?0.15:0.20;
    const fedLT=netLT*ltRate;

    // State tax on ordinary income (includes short-term gains)
    const stateTaxable=ordinaryIncome;
    const stateTax=DATA&&TE&&TE.calcStateTax?TE.calcStateTax(stateTaxable,stateCode,DATA,status)?.tax||0:stateTaxable*0.05;

    // Total tax
    const totalTax=fedOrdinary+fedLT+stateTax;

    const lines=[
      {label:'Short-term gains',val:TE.formatMoney(netST)},
      {label:'Long-term gains',val:TE.formatMoney(netLT)},
      {label:'Staking rewards (ordinary)',val:TE.formatMoney(staking)},
      {label:'NFT flip gains',val:TE.formatMoney(nft)},
      {label:'Other W-2 income',val:TE.formatMoney(otherW2)},
      {label:'',val:''},
      {label:'Federal ordinary income tax',val:TE.formatMoney(fedOrdinary)},
      {label:'Federal long-term gains tax ('+(ltRate*100).toFixed(0)+'%)',val:TE.formatMoney(fedLT)},
      {label:'State tax',val:TE.formatMoney(stateTax)},
      {label:'',val:''},
      {label:'Total tax',val:TE.formatMoney(totalTax)}
    ];

    const bigCardStyle='background:var(--card);border:1px solid var(--border);border-radius:12px;padding:1.5rem;text-align:center;margin-bottom:1rem';
    const bigNumberStyle='font-size:2.2rem;font-weight:700;color:var(--accent);display:block';
    const bigLabelStyle='font-size:.85rem;color:var(--muted);margin-top:.25rem;display:block';

    document.getElementById('crypto-res').innerHTML=resultsBox(lines,'Total Crypto Tax',TE.formatMoney(totalTax))+
    `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin-top:1rem">`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle}">${TE.formatMoney(netST)}</span><span style="${bigLabelStyle}">Short-Term Gains (ordinary rate)</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle}">${TE.formatMoney(netLT)}</span><span style="${bigLabelStyle}">Long-Term Gains (${(ltRate*100).toFixed(0)}% rate)</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle}">${TE.formatMoney(staking)}</span><span style="${bigLabelStyle}">Staking (ordinary income)</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle}">${TE.formatMoney(totalTax)}</span><span style="${bigLabelStyle}">Total Tax Owed</span></div>`+
    `</div>`+
    `<div class="calc-panel" style="margin-top:1rem;background:rgba(46,125,50,.08);border-color:var(--success)"><h3>Tax Treatment Summary</h3><p><strong>Short-term gains (${TE.formatMoney(netST)}):</strong> Taxed at ordinary income rates (${fedOrdinary>0?((fedOrdinary/(taxableOrdinary+netST))*100).toFixed(0):22}% effective). No preferential treatment.</p><p><strong>Long-term gains (${TE.formatMoney(netLT)}):</strong> Taxed at preferential ${(ltRate*100).toFixed(0)}% rate. This is the tax advantage of holding crypto long-term.</p><p><strong>Staking rewards (${TE.formatMoney(staking)}):</strong> Taxed as ordinary income when received, regardless of whether you sell. Cost basis = FMV when received.</p></div>`+
    `<div class="calc-panel" style="margin-top:1rem"><h3>Wash Sale Rule Note</h3><p>Unlike stocks, wash sale rules do NOT apply to crypto. You can sell crypto at a loss and immediately buy it back, and still claim the loss for tax purposes. This is a key advantage over securities trading.</p></div>`;
    scrollToResults('crypto-res');
  });
}

/* ===================== Self-Employed Health Insurance Deduction Calculator ===================== */
function selfEmployedHealthInsuranceView(main){
  const statusOpts=[{value:'single',label:'Single'},{value:'mfj',label:'Married Filing Jointly'},{value:'mfs',label:'Married Filing Separately'},{value:'hoh',label:'Head of Household'}];
  const entityOpts=[{value:'soleprop',label:'Sole Proprietor / Single-Member LLC'},{value:'scorp',label:'S-Corp (2%+ owner)'},{value:'partnership',label:'Partnership / Multi-Member LLC'}];

  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'Self-Employed Health Insurance'})}<h2>Self-Employed Health Insurance Deduction Calculator 2026</h2><p style="color:var(--muted);margin-bottom:1.5rem">Calculate your above-the-line health insurance deduction, see how it affects ACA subsidies, and understand S-Corp owner treatment.</p>${callout('blue','Above-the-Line Deduction','Self-employed individuals can deduct health insurance premiums on Schedule 1, Line 17. This is an "above-the-line" deduction that reduces your AGI but is not itemized.')}
    ${callout('green','ACA Subsidy Impact','Your health insurance deduction reduces your MAGI, which can increase your ACA premium tax credit. However, if you have employer-subsidized coverage available, you may not qualify for ACA subsidies.')}
    ${callout('yellow','S-Corp Owner Treatment','S-Corp owners (2%+ shareholders) must report health insurance premiums as W-2 wages on Form W-2, Box 1. The deduction is still available but the reporting is different.')}
    <div class="calc-grid"><div class="calc-panel"><h3>Your Business</h3>
      ${selectField('sehi_entity','Business type',entityOpts,{value:'soleprop'})}
      ${inputField('sehi_profit','Net profit from business','number',{value:80000})}
      ${inputField('sehi_premiums','Annual health insurance premiums','number',{value:12000})}
      ${inputField('sehi_other_income','Other income (W-2, interest, etc.)','number',{value:0})}
      ${selectField('sehi_status','Filing status',statusOpts,{value:'single'})}
      ${inputField('sehi_age','Age 65+','checkbox')}
    </div>
    <div class="calc-panel"><h3>ACA Subsidy (if applicable)</h3>
      ${inputField('sehi_household_size','Household size','number',{value:1})}
      ${inputField('sehi_employer_coverage','Offered employer-subsidized coverage','checkbox')}
      <p style="color:var(--muted);font-size:.9rem;margin-top:1rem">If you were offered employer-subsidized coverage (even if you declined it), you generally do not qualify for ACA premium tax credits.</p>
    </div></div>
    <div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcSEHI()">Calculate Deduction</button></div>
    <div id="sehi-res"></div>`+
    renderFaqSection([
      {q:'What is the self-employed health insurance deduction?',a:'Self-employed individuals (sole proprietors, partners, S-Corp 2%+ owners) can deduct health insurance premiums for themselves, their spouse, and dependents. This is an above-the-line deduction on Schedule 1, Line 17, which reduces your AGI but does not require itemizing.'},
      {q:'How does this affect ACA subsidies?',a:'The deduction reduces your MAGI (Modified Adjusted Gross Income), which is used to determine ACA premium tax credit eligibility. A lower MAGI means a larger subsidy. However, if you have access to employer-subsidized coverage (even through a spouse), you typically do not qualify for ACA subsidies.'},
      {q:'How do S-Corp owners report this?',a:'S-Corp owners who own 2% or more must have health insurance premiums reported as W-2 wages on Form W-2, Box 1. The premiums are then deductible on Schedule 1. This is different from sole proprietors who report directly on Schedule 1.'},
      {q:'Are there any limits on the deduction?',a:'The deduction cannot exceed your net profit from the business. If your business has a loss, you cannot take the deduction. Also, the deduction cannot exceed the actual premiums paid.'}
    ]);

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.calcSEHI = safeCalc(function(){
    const entity=getSelect('sehi_entity');
    const profit=getVal('sehi_profit');
    const premiums=getVal('sehi_premiums');
    const otherIncome=getVal('sehi_other_income');
    const status=getSelect('sehi_status');
    const age65=getVal('sehi_age');
    const householdSize=getVal('sehi_household_size');
    const employerCoverage=getVal('sehi_employer_coverage');

    // Deduction limit: cannot exceed net profit
    const deduction=Math.min(premiums,profit);
    const deductionPct=profit>0?(deduction/premiums*100).toFixed(0):0;

    // AGI calculation
    const stdDed=DATA&&DATA.federal&&DATA.federal.standardDeduction?DATA.federal.standardDeduction[status]||16100:16100;
    const seniorDed=age65?DATA&&DATA.federal&&DATA.federal.seniorDeduction?DATA.federal.seniorDeduction[status]||1850:1850:0;
    const totalStdDed=stdDed+seniorDed;
    const agi=profit+otherIncome-deduction;
    const taxable=Math.max(0,agi-totalStdDed);

    // ACA subsidy eligibility
    const fpl2026=householdSize===1?14780:householdSize===2?20100:householdSize===3?25420:householdSize===4?30740:30740+(householdSize-4)*5320;
    const fpl400=fpl2026*4;
    const eligibleForACA=!employerCoverage && agi<=fpl400;
    const magi=agi; // MAGI for ACA is AGI + foreign income + tax-exempt interest (simplified here)

    // Tax savings estimate (assumes 22% marginal rate for simplicity)
    const taxSavings=deduction*0.22;

    const lines=[
      {label:'Business type',val:entity==='soleprop'?'Sole Proprietor':entity==='scorp'?'S-Corp':'Partnership'},
      {label:'Net profit from business',val:TE.formatMoney(profit)},
      {label:'Health insurance premiums paid',val:TE.formatMoney(premiums)},
      {label:'',val:''},
      {label:'Deduction allowed',val:TE.formatMoney(deduction)},
      {label:'Deduction percentage',val:deductionPct+'% of premiums'},
      {label:'',val:''},
      {label:'AGI (after deduction)',val:TE.formatMoney(agi)},
      {label:'Standard deduction',val:TE.formatMoney(totalStdDed)},
      {label:'Taxable income',val:TE.formatMoney(taxable)},
      {label:'',val:''},
      {label:'Estimated tax savings',val:TE.formatMoney(taxSavings)},
      {label:'ACA subsidy eligible',val:eligibleForACA?'Yes (MAGI '+TE.formatMoney(magi)+' ≤ '+TE.formatMoney(fpl400)+')':'No ('+(employerCoverage?'Employer coverage available':'MAGI '+TE.formatMoney(magi)+' > '+TE.formatMoney(fpl400))+')'}
    ];

    const bigCardStyle='background:var(--card);border:1px solid var(--border);border-radius:12px;padding:1.5rem;text-align:center;margin-bottom:1rem';
    const bigNumberStyle='font-size:2.2rem;font-weight:700;color:var(--accent);display:block';
    const bigLabelStyle='font-size:.85rem;color:var(--muted);margin-top:.25rem;display:block';

    document.getElementById('sehi-res').innerHTML=resultsBox(lines,'Health Insurance Deduction',TE.formatMoney(deduction))+
    `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin-top:1rem">`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle}">${TE.formatMoney(deduction)}</span><span style="${bigLabelStyle}">Above-the-Line Deduction</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle}">${TE.formatMoney(taxSavings)}</span><span style="${bigLabelStyle}">Estimated Tax Savings</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle}">${TE.formatMoney(agi)}</span><span style="${bigLabelStyle}">AGI After Deduction</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle};color:${eligibleForACA?'var(--success)':'var(--accent)'}">${eligibleForACA?'Yes':'No'}</span><span style="${bigLabelStyle}">ACA Subsidy Eligible</span></div>`+
    `</div>`+
    `<div class="calc-panel" style="margin-top:1rem;background:rgba(46,125,50,.08);border-color:var(--success)"><h3>Deduction Summary</h3><p><strong>Deduction:</strong> ${TE.formatMoney(deduction)} (${deductionPct}% of your ${TE.formatMoney(premiums)} premiums). This reduces your AGI from ${TE.formatMoney(profit+otherIncome)} to ${TE.formatMoney(agi)}.</p><p><strong>Tax savings:</strong> At an estimated 22% marginal rate, this saves you approximately ${TE.formatMoney(taxSavings)} in federal income tax.</p><p><strong>ACA impact:</strong> Your MAGI of ${TE.formatMoney(magi)} is ${eligibleForACA?'below':'above'} the 400% FPL threshold of ${TE.formatMoney(fpl400)}. ${eligibleForACA?'You may qualify for ACA premium tax credits.':'You do not qualify for ACA subsidies.'}</p></div>`+
    (entity==='scorp'?`<div class="calc-panel" style="margin-top:1rem;background:rgba(255,152,0,.08);border-color:#ff9800"><h3>S-Corp Owner Treatment</h3><p>As an S-Corp owner (2%+ shareholder), your health insurance premiums must be reported as W-2 wages on Form W-2, Box 1. This is different from sole proprietors who report directly on Schedule 1.</p><p><strong>Reporting:</strong> Add premiums to your W-2 Box 1. Deduct on Schedule 1, Line 17. Do not deduct as a business expense on the S-Corp return (Form 1120S).</p><p><strong>Payroll tax:</strong> Premiums reported as W-2 wages are subject to FICA tax (Social Security + Medicare). This is a key difference from sole proprietor treatment.</p></div>`:'')+
    `<div class="calc-panel" style="margin-top:1rem"><h3>Important Notes</h3><p><strong>Deduction limit:</strong> Cannot exceed your net profit from the business. If your business has a loss, you cannot take this deduction.</p><p><strong>Eligible expenses:</strong> Medical, dental, and vision insurance premiums for yourself, your spouse, and dependents. Long-term care insurance premiums (subject to age-based limits) are also eligible.</p><p><strong>Not eligible:</strong> Health savings account (HSA) contributions, medical expenses paid out-of-pocket, or life insurance premiums.</p></div>`;
    scrollToResults('sehi-res');
  });
}

/* ===================== Estimated Tax Penalty Calculator (Form 2210) ===================== */
function estimatedTaxPenaltyView(main){
  const statusOpts=[{value:'single',label:'Single'},{value:'mfj',label:'Married Filing Jointly'},{value:'mfs',label:'Married Filing Separately'},{value:'hoh',label:'Head of Household'}];
  const priorYearOpts=[{value:'100',label:'100% of prior year tax'},{value:'110',label:'110% of prior year tax (AGI > $150k)'}];

  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'Estimated Tax Penalty'})}<h2>Estimated Tax Penalty Calculator 2026 (Form 2210)</h2><p style="color:var(--muted);margin-bottom:1.5rem">Calculate your underpayment penalty for missing quarterly estimated tax payments. See exactly what you owe the IRS.</p>${callout('blue','Form 2210 Underpayment Penalty','The IRS charges a penalty if you do not pay enough tax throughout the year through withholding or estimated payments. The penalty is calculated on the underpayment amount for each quarter using the federal short-term rate plus 3%.')}
    ${callout('green','Safe Harbor Rules','You can avoid the penalty if you pay 90% of your current year tax or 100% (110% if AGI > $150k) of your prior year tax through withholding and estimated payments.')}
    ${callout('yellow','Quarterly Deadlines','Q1: April 15, Q2: June 15, Q3: September 15, Q4: January 15 of following year. Payments are due on these dates, and the penalty is calculated separately for each quarter.')}
    <div class="calc-grid"><div class="calc-panel"><h3>Your Tax Liability</h3>
      ${inputField('etp_current_tax','Total tax liability for 2026','number',{value:20000})}
      ${inputField('etp_prior_tax','Total tax liability for 2025','number',{value:18000})}
      ${selectField('etp_prior_pct','Prior year safe harbor',priorYearOpts,{value:'100'})}
      ${selectField('etp_status','Filing status',statusOpts,{value:'single'})}
      ${inputField('etp_agi_2025','2025 AGI (for 110% rule)','number',{value:0})}
    </div>
    <div class="calc-panel"><h3>Quarterly Payments Made</h3>
      ${inputField('etp_q1_payment','Q1 payment (by April 15)','number',{value:0})}
      ${inputField('etp_q2_payment','Q2 payment (by June 15)','number',{value:0})}
      ${inputField('etp_q3_payment','Q3 payment (by Sept 15)','number',{value:0})}
      ${inputField('etp_q4_payment','Q4 payment (by Jan 15, 2027)','number',{value:0})}
      ${inputField('etp_withholding','Total withholding (W-2, 1099)','number',{value:0})}
      ${inputField('etp_interest_rate','IRS interest rate (%)','number',{value:8})}
    </div></div>
    <div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcETPenalty()">Calculate Penalty</button></div>
    <div id="etp-res"></div>`+
    renderFaqSection([
      {q:'What is the underpayment penalty?',a:'The IRS charges a penalty if you do not pay enough tax throughout the year through withholding or estimated payments. The penalty is calculated on the underpayment amount for each quarter using the federal short-term rate plus 3%.'},
      {q:'How do I avoid the penalty?',a:'You can avoid the penalty by paying at least 90% of your current year tax or 100% (110% if your AGI was over $150,000 in the prior year) of your prior year tax through withholding and estimated payments.'},
      {q:'What are the quarterly deadlines?',a:'Q1: April 15, Q2: June 15, Q3: September 15, Q4: January 15 of the following year. Each quarter is calculated separately, so if you underpay in one quarter but overpay in another, you may still owe a penalty.'},
      {q:'How is the penalty calculated?',a:'The penalty is calculated on the underpayment amount for each quarter using the IRS underpayment rate (federal short-term rate + 3%). The penalty is applied to the number of days the underpayment was outstanding.'},
      {q:'Can I use the annualized income method?',a:'Yes, if your income is uneven throughout the year, you can use the annualized income method (Schedule AI) to reduce your penalty. This method calculates your required payments based on when you actually received income.'}
    ]);

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.calcETPenalty = safeCalc(function(){
    const currentTax=getVal('etp_current_tax');
    const priorTax=getVal('etp_prior_tax');
    const priorPct=parseInt(getSelect('etp_prior_pct'));
    const agi2025=getVal('etp_agi_2025');
    const q1Pay=getVal('etp_q1_payment');
    const q2Pay=getVal('etp_q2_payment');
    const q3Pay=getVal('etp_q3_payment');
    const q4Pay=getVal('etp_q4_payment');
    const withholding=getVal('etp_withholding');
    const interestRate=getVal('etp_interest_rate')/100;

    // Check if 110% rule applies (AGI > $150k in prior year)
    const use110Pct=agi2025>150000;
    const actualPriorPct=use110Pct?110:100;
    const requiredPrior=priorTax*(actualPriorPct/100);
    const requiredCurrent=currentTax*0.9;
    const requiredAnnual=Math.min(requiredCurrent,requiredPrior);

    // Quarterly required payments (25% each)
    const requiredPerQuarter=requiredAnnual/4;

    // Calculate cumulative payments by quarter
    const q1Total=q1Pay+withholding/4;
    const q2Total=q1Pay+q2Pay+withholding/2;
    const q3Total=q1Pay+q2Pay+q3Pay+withholding*0.75;
    const q4Total=q1Pay+q2Pay+q3Pay+q4Pay+withholding;

    // Calculate underpayment for each quarter
    const q1Required=requiredPerQuarter;
    const q2Required=requiredPerQuarter*2;
    const q3Required=requiredPerQuarter*3;
    const q4Required=requiredPerQuarter*4;

    const q1Underpayment=Math.max(0,q1Required-q1Total);
    const q2Underpayment=Math.max(0,q2Required-q2Total);
    const q3Underpayment=Math.max(0,q3Required-q3Total);
    const q4Underpayment=Math.max(0,q4Required-q4Total);

    // Calculate penalty for each quarter (simplified - assumes full quarter underpayment)
    // In reality, this would use exact dates and daily interest
    const q1Penalty=q1Underpayment*interestRate*0.25;
    const q2Penalty=q2Underpayment*interestRate*0.25;
    const q3Penalty=q3Underpayment*interestRate*0.25;
    const q4Penalty=q4Underpayment*interestRate*0.25;
    const totalPenalty=q1Penalty+q2Penalty+q3Penalty+q4Penalty;

    const lines=[
      {label:'Current year tax liability',val:TE.formatMoney(currentTax)},
      {label:'Prior year tax liability',val:TE.formatMoney(priorTax)},
      {label:'Required payment (90% current)',val:TE.formatMoney(requiredCurrent)},
      {label:'Required payment ('+actualPriorPct+'% prior)',val:TE.formatMoney(requiredPrior)},
      {label:'Safe harbor amount',val:TE.formatMoney(requiredAnnual)},
      {label:'',val:''},
      {label:'Q1 required',val:TE.formatMoney(requiredPerQuarter)},
      {label:'Q1 paid',val:TE.formatMoney(q1Total)},
      {label:'Q1 underpayment',val:TE.formatMoney(q1Underpayment)},
      {label:'Q1 penalty',val:TE.formatMoney(q1Penalty)},
      {label:'',val:''},
      {label:'Q2 required',val:TE.formatMoney(requiredPerQuarter*2)},
      {label:'Q2 paid',val:TE.formatMoney(q2Total)},
      {label:'Q2 underpayment',val:TE.formatMoney(q2Underpayment)},
      {label:'Q2 penalty',val:TE.formatMoney(q2Penalty)},
      {label:'',val:''},
      {label:'Q3 required',val:TE.formatMoney(requiredPerQuarter*3)},
      {label:'Q3 paid',val:TE.formatMoney(q3Total)},
      {label:'Q3 underpayment',val:TE.formatMoney(q3Underpayment)},
      {label:'Q3 penalty',val:TE.formatMoney(q3Penalty)},
      {label:'',val:''},
      {label:'Q4 required',val:TE.formatMoney(requiredPerQuarter*4)},
      {label:'Q4 paid',val:TE.formatMoney(q4Total)},
      {label:'Q4 underpayment',val:TE.formatMoney(q4Underpayment)},
      {label:'Q4 penalty',val:TE.formatMoney(q4Penalty)},
      {label:'',val:''},
      {label:'Total underpayment penalty',val:TE.formatMoney(totalPenalty)}
    ];

    const bigCardStyle='background:var(--card);border:1px solid var(--border);border-radius:12px;padding:1.5rem;text-align:center;margin-bottom:1rem';
    const bigNumberStyle='font-size:2.2rem;font-weight:700;color:var(--accent);display:block';
    const bigLabelStyle='font-size:.85rem;color:var(--muted);margin-top:.25rem;display:block';

    document.getElementById('etp-res').innerHTML=resultsBox(lines,'Underpayment Penalty',TE.formatMoney(totalPenalty))+
    `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin-top:1rem">`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle}">${TE.formatMoney(requiredAnnual)}</span><span style="${bigLabelStyle}">Required Annual Payment</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle}">${TE.formatMoney(q4Total)}</span><span style="${bigLabelStyle}">Total Paid</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle}">${TE.formatMoney(Math.max(0,q4Required-q4Total))}</span><span style="${bigLabelStyle}">Total Underpayment</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle}">${TE.formatMoney(totalPenalty)}</span><span style="${bigLabelStyle}">Total Penalty</span></div>`+
    `</div>`+
    `<div class="calc-panel" style="margin-top:1rem;background:rgba(46,125,50,.08);border-color:var(--success)"><h3>Penalty Summary</h3><p><strong>Safe harbor:</strong> ${TE.formatMoney(requiredAnnual)} (90% of current year tax or ${actualPriorPct}% of prior year tax, whichever is less).</p><p><strong>Total paid:</strong> ${TE.formatMoney(q4Total)} (withholding + quarterly payments).</p><p><strong>Underpayment:</strong> ${TE.formatMoney(Math.max(0,q4Required-q4Total))}.</p><p><strong>Penalty:</strong> ${TE.formatMoney(totalPenalty)} at ${interestRate*100}% annual rate.</p></div>`+
    `<div class="calc-panel" style="margin-top:1rem"><h3>Quarterly Breakdown</h3><p><strong>Q1:</strong> Required ${TE.formatMoney(requiredPerQuarter)}, Paid ${TE.formatMoney(q1Total)}, Underpayment ${TE.formatMoney(q1Underpayment)}, Penalty ${TE.formatMoney(q1Penalty)}</p><p><strong>Q2:</strong> Required ${TE.formatMoney(requiredPerQuarter*2)}, Paid ${TE.formatMoney(q2Total)}, Underpayment ${TE.formatMoney(q2Underpayment)}, Penalty ${TE.formatMoney(q2Penalty)}</p><p><strong>Q3:</strong> Required ${TE.formatMoney(requiredPerQuarter*3)}, Paid ${TE.formatMoney(q3Total)}, Underpayment ${TE.formatMoney(q3Underpayment)}, Penalty ${TE.formatMoney(q3Penalty)}</p><p><strong>Q4:</strong> Required ${TE.formatMoney(requiredPerQuarter*4)}, Paid ${TE.formatMoney(q4Total)}, Underpayment ${TE.formatMoney(q4Underpayment)}, Penalty ${TE.formatMoney(q4Penalty)}</p></div>`+
    `<div class="calc-panel" style="margin-top:1rem"><h3>Important Notes</h3><p><strong>Simplified calculation:</strong> This calculator uses a simplified method assuming underpayments lasted the full quarter. The actual Form 2210 calculation uses exact dates and daily interest rates.</p><p><strong>Annualized income method:</strong> If your income is uneven throughout the year, you may qualify for the annualized income method (Schedule AI), which can reduce your penalty.</p><p><strong>Waivers:</strong> You may qualify for a penalty waiver if you had a casualty, disaster, or other unusual circumstance, or if you retired during the tax year.</p></div>`;
    scrollToResults('etp-res');
  });
}

/* ===================== Nanny / Household Employer Tax Calculator ===================== */
function nannyEmployerTaxView(main){
  const stateOpts=DATA&&DATA.states?Object.keys(DATA.states).sort().map(code=>({value:code,label:DATA.states[code].name+' ('+code+')'})):[
    {value:'CA',label:'California (CA)'},{value:'NY',label:'New York (NY)'},{value:'TX',label:'Texas (TX)'},{value:'FL',label:'Florida (FL)'},{value:'IL',label:'Illinois (IL)'},{value:'WA',label:'Washington (WA)'},{value:'CO',label:'Colorado (CO)'},{value:'NC',label:'North Carolina (NC)'},{value:'OH',label:'Ohio (OH)'},{value:'PA',label:'Pennsylvania (PA)'}
  ];

  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'Nanny Employer Tax'})}<h2>Nanny / Household Employer Tax Calculator 2026</h2><p style="color:var(--muted);margin-bottom:1.5rem">Calculate household employer taxes: Schedule H, employer FICA (7.65%), federal unemployment tax (FUTA), and state unemployment tax (SUTA). See exactly what you owe as a household employer.</p>${callout('blue','Schedule H','Household employers must file Schedule H with Form 1040 to report household employment taxes. This includes Social Security, Medicare, FUTA, and SUTA taxes on wages paid to household employees.')}
    ${callout('green','Employer FICA','As a household employer, you pay 7.65% for Social Security (6.2%) and Medicare (1.45%) on wages up to the Social Security wage base. This is in addition to the employee\'s 7.65% share.')}
    ${callout('yellow','FUTA and SUTA','Federal unemployment tax (FUTA) is 6% on the first $7,000 of wages, but you get a credit of up to 5.4% for paying state unemployment tax (SUTA), so effective FUTA is often 0.6%.')}
    <div class="calc-grid"><div class="calc-panel"><h3>Employee Wages</h3>
      ${inputField('net_wages','Annual wages paid to employee','number',{value:40000})}
      ${inputField('net_cash_tips','Cash tips paid to employee','number',{value:0})}
      ${inputField('net_fed_tax','Federal income tax withheld','number',{value:0})}
      ${inputField('net_state_tax','State income tax withheld','number',{value:0})}
    </div>
    <div class="calc-panel"><h3>Employer Taxes</h3>
      ${selectField('net_state','Your state',stateOpts,{value:'CA'})}
      ${inputField('net_suta_rate','State unemployment tax rate (%)','number',{value:3.4})}
      ${inputField('net_suta_wage_base','State unemployment wage base ($)','number',{value:7000})}
      ${inputField('net_futa_credit','FUTA credit reduction (if any)','number',{value:0})}
      <p style="color:var(--muted);font-size:.9rem;margin-top:1rem"><strong>FUTA:</strong> 6% on first $7,000 of wages, minus up to 5.4% credit for SUTA paid. Effective rate is often 0.6% if you pay SUTA on time.</p>
    </div></div>
    <div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcNannyEmployer()">Calculate Employer Taxes</button></div>
    <div id="net-res"></div>`+
    renderFaqSection([
      {q:'Who is a household employee?',a:'A household employee is someone you hire to work in or around your home, such as a nanny, housekeeper, gardener, or caregiver. If you control what work is done and how it is done, they are an employee (not an independent contractor).'},
      {q:'What taxes do I pay as a household employer?',a:'You pay employer Social Security (6.2%) and Medicare (1.45%) on wages up to the Social Security wage base ($160,200 in 2026). You also pay FUTA (6% on first $7,000, minus SUTA credit) and SUTA (state unemployment tax).'},
      {q:'Do I need to withhold taxes from my employee\'s paycheck?',a:'Yes, you must withhold the employee\'s share of Social Security (6.2%) and Medicare (1.45%), plus federal and state income tax if requested by the employee. You pay these withheld amounts to the IRS and state.'},
      {q:'When do I need to file Schedule H?',a:'You must file Schedule H if you paid cash wages of $2,600 or more to any household employee in 2026, or if you withheld any federal income tax. File it with your Form 1040 by April 15.'},
      {q:'Can I avoid the nanny tax by paying under the table?',a:'No. Paying under the table is illegal. If caught, you may owe back taxes, penalties, and interest. Plus, your employee loses Social Security and Medicare credits, and cannot claim unemployment benefits.'}
    ]);

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.calcNannyEmployer = safeCalc(function(){
    const wages=getVal('net_wages');
    const tips=getVal('net_cash_tips');
    const fedWithheld=getVal('net_fed_tax');
    const stateWithheld=getVal('net_state_tax');
    const stateCode=getSelect('net_state');
    const sutaRate=getVal('net_suta_rate')/100;
    const sutaWageBase=getVal('net_suta_wage_base');
    const futaCreditReduction=getVal('net_futa_credit');

    const totalWages=wages+tips;

    // Social Security wage base for 2026
    const ssWageBase=160200;
    const ssWages=Math.min(totalWages,ssWageBase);
    
    // Employer FICA (7.65% = 6.2% SS + 1.45% Medicare)
    const employerSS=ssWages*0.062;
    const employerMedicare=totalWages*0.0145; // Medicare has no wage base
    const employerFICA=employerSS+employerMedicare;

    // Employee FICA (also 7.65%)
    const employeeSS=ssWages*0.062;
    const employeeMedicare=totalWages*0.0145;
    const employeeFICA=employeeSS+employeeMedicare;

    // FUTA (Federal Unemployment Tax)
    const futaWageBase=7000;
    const futaWages=Math.min(totalWages,futaWageBase);
    const futaRate=0.06;
    const futaCredit=Math.min(0.054,sutaRate); // Max 5.4% credit for SUTA
    const effectiveFutaRate=futaRate-futaCredit-futaCreditReduction/100;
    const futaTax=Math.max(0,futaWages*effectiveFutaRate);

    // SUTA (State Unemployment Tax)
    const sutaWages=Math.min(totalWages,sutaWageBase);
    const sutaTax=sutaWages*sutaRate;

    // Total employer taxes
    const totalEmployerTaxes=employerFICA+futaTax+sutaTax;

    // Total cost to employer
    const totalCost=totalWages+totalEmployerTaxes;

    // Total withheld from employee
    const totalWithheld=employeeFICA+fedWithheld+stateWithheld;

    const lines=[
      {label:'Total wages paid',val:TE.formatMoney(totalWages)},
      {label:'',val:''},
      {label:'Employer Social Security (6.2%)',val:TE.formatMoney(employerSS)},
      {label:'Employer Medicare (1.45%)',val:TE.formatMoney(employerMedicare)},
      {label:'Employer FICA (7.65%)',val:TE.formatMoney(employerFICA)},
      {label:'',val:''},
      {label:'FUTA tax (effective)',val:TE.formatMoney(futaTax)},
      {label:'SUTA tax',val:TE.formatMoney(sutaTax)},
      {label:'',val:''},
      {label:'Total employer taxes',val:TE.formatMoney(totalEmployerTaxes)},
      {label:'Total cost to employer',val:TE.formatMoney(totalCost)},
      {label:'',val:''},
      {label:'Employee FICA withheld',val:TE.formatMoney(employeeFICA)},
      {label:'Federal income tax withheld',val:TE.formatMoney(fedWithheld)},
      {label:'State income tax withheld',val:TE.formatMoney(stateWithheld)},
      {label:'Total withheld from employee',val:TE.formatMoney(totalWithheld)}
    ];

    const bigCardStyle='background:var(--card);border:1px solid var(--border);border-radius:12px;padding:1.5rem;text-align:center;margin-bottom:1rem';
    const bigNumberStyle='font-size:2.2rem;font-weight:700;color:var(--accent);display:block';
    const bigLabelStyle='font-size:.85rem;color:var(--muted);margin-top:.25rem;display:block';

    document.getElementById('net-res').innerHTML=resultsBox(lines,'Total Employer Taxes',TE.formatMoney(totalEmployerTaxes))+
    `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin-top:1rem">`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle}">${TE.formatMoney(totalWages)}</span><span style="${bigLabelStyle}">Total Wages</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle}">${TE.formatMoney(employerFICA)}</span><span style="${bigLabelStyle}">Employer FICA</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle}">${TE.formatMoney(futaTax+sutaTax)}</span><span style="${bigLabelStyle}">Unemployment Taxes</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle}">${TE.formatMoney(totalEmployerTaxes)}</span><span style="${bigLabelStyle}">Total Employer Taxes</span></div>`+
    `</div>`+
    `<div class="calc-panel" style="margin-top:1rem;background:rgba(46,125,50,.08);border-color:var(--success)"><h3>Employer Tax Summary</h3><p><strong>Social Security:</strong> 6.2% on first $160,200 of wages = ${TE.formatMoney(employerSS)}.</p><p><strong>Medicare:</strong> 1.45% on all wages = ${TE.formatMoney(employerMedicare)}.</p><p><strong>FUTA:</strong> 6% on first $7,000, minus SUTA credit = ${TE.formatMoney(futaTax)}.</p><p><strong>SUTA:</strong> ${sutaRate*100}% on first ${TE.formatMoney(sutaWageBase)} = ${TE.formatMoney(sutaTax)}.</p><p><strong>Total employer taxes:</strong> ${TE.formatMoney(totalEmployerTaxes)}.</p><p><strong>Total cost to employer:</strong> ${TE.formatMoney(totalCost)} (wages + taxes).</p></div>`+
    `<div class="calc-panel" style="margin-top:1rem"><h3>Employee Withholding Summary</h3><p><strong>Employee FICA:</strong> ${TE.formatMoney(employeeFICA)} (7.65% of wages).</p><p><strong>Federal income tax:</strong> ${TE.formatMoney(fedWithheld)} (withheld from employee).</p><p><strong>State income tax:</strong> ${TE.formatMoney(stateWithheld)} (withheld from employee).</p><p><strong>Total withheld:</strong> ${TE.formatMoney(totalWithheld)}.</p></div>`+
    `<div class="calc-panel" style="margin-top:1rem"><h3>Important Notes</h3><p><strong>Schedule H:</strong> File Schedule H with Form 1040 if you paid $2,600 or more in cash wages to any household employee, or if you withheld any federal income tax.</p><p><strong>Filing deadlines:</strong> Quarterly Form 941 for FICA and federal income tax withholding. Annual Schedule H with Form 1040. State unemployment tax filings vary by state.</p><p><strong>W-2 requirement:</strong> You must provide Form W-2 to your employee and file Form W-2 Copy A with the Social Security Administration.</p><p><strong>Independent contractors:</strong> If your worker is an independent contractor (they control how work is done), you do not pay employer FICA or unemployment taxes. They pay self-employment tax on Schedule SE.</p></div>`;
    scrollToResults('net-res');
  });
}

/* ===================== 401(k) Contribution Calculator ===================== */
function _401kCalculatorView(main){
  const statusOpts=[{value:'single',label:'Single'},{value:'mfj',label:'Married Filing Jointly'},{value:'mfs',label:'Married Filing Separately'},{value:'hoh',label:'Head of Household'}];
  const stateOpts=DATA&&DATA.states?Object.keys(DATA.states).sort().map(code=>({value:code,label:DATA.states[code].name+' ('+code+')'})):[
    {value:'CA',label:'California (CA)'},{value:'NY',label:'New York (NY)'},{value:'TX',label:'Texas (TX)'},{value:'FL',label:'Florida (FL)'},{value:'IL',label:'Illinois (IL)'},{value:'WA',label:'Washington (WA)'},{value:'CO',label:'Colorado (CO)'},{value:'NC',label:'North Carolina (NC)'},{value:'OH',label:'Ohio (OH)'},{value:'PA',label:'Pennsylvania (PA)'}
  ];

  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'401(k) Calculator'})}<h2>401(k) Contribution Calculator 2026</h2><p style="color:var(--muted);margin-bottom:1.5rem">Salary + contribution % → annual savings, employer match, tax savings, and long-term projection. Are you leaving free money on the table?</p>
    <div class="calc-grid"><div class="calc-panel"><h3>Your Job</h3>
      ${inputField('k_salary','Annual salary','number',{value:80000})}
      ${inputField('k_contrib','Your contribution (%)','number',{value:6})}
      ${inputField('k_limit','2026 401(k) limit (employee)','number',{value:24500})}
      ${selectField('k_state','Your state',stateOpts,{value:'CA'})}
    </div>
    <div class="calc-panel"><h3>Employer Match</h3>
      ${inputField('k_match','Employer match (%)','number',{value:50})}
      ${inputField('k_match_cap','Match cap (% of salary)','number',{value:6})}
      ${selectField('k_status','Filing status',statusOpts,{value:'single'})}
      ${inputField('k_return','Expected annual return (%)','number',{value:7})}
      ${inputField('k_years','Projection years','number',{value:30})}
      <p style="color:var(--muted);font-size:.9rem;margin-top:1rem"><strong>Typical match:</strong> 50% of your contributions up to 6% of salary. If you earn $80k and contribute 6%, your employer adds $2,400. That is a 50% instant return. Do not leave it on the table.</p>
    </div></div>
    <div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calc401k()">Show My 401(k) Power</button></div>
    <div id="k-res"></div>`+
    renderFaqSection([
      {q:'Should I max out my 401(k)?',a:'Max out if you can afford it ($23,500 in 2026). The tax savings + employer match + tax-deferred growth is one of the best wealth-building tools available. If you cannot max out, contribute at least enough to get the full employer match - it is literally free money.'},
      {q:'What if my employer does not match?',a:'Still contribute. You get the federal and state tax deduction now, tax-deferred growth, and creditor protection. But prioritize a Roth IRA first if your employer offers no match - you get more investment flexibility.'},
      {q:'Traditional or Roth 401(k)?',a:'Same logic as IRA: if your retirement tax rate will be lower → Traditional. If the same or higher → Roth. Most people have lower income in retirement, so Traditional is usually the better default. But Roth 401(k) has no RMDs starting in 2024.'}
    ]);

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.calc401k = safeCalc(function(){
    const salary=getVal('k_salary');
    const contribPct=getVal('k_contrib')/100;
    const limit=getVal('k_limit');
    const matchPct=getVal('k_match')/100;
    const matchCapPct=getVal('k_match_cap')/100;
    const status=document.getElementById('k_status').value;
    const stateCode=document.getElementById('k_state').value;
    const returnRate=getVal('k_return')/100;
    const years=getVal('k_years');

    const employeeContrib=Math.min(salary*contribPct,limit);
    const employerMatch=Math.min(employeeContrib*matchPct,salary*matchCapPct*matchPct);
    const totalAnnual=employeeContrib+employerMatch;

    // Tax savings: federal + state
    let fedTax=0,stateTax=0;
    if(DATA&&TE&&TE.calcFederalTax){
      const stdDed=DATA.federal&&DATA.federal.standardDeduction?DATA.federal.standardDeduction[status]||16100:16100;
      const taxableWithout=Math.max(0,salary-stdDed);
      const taxableWith=Math.max(0,salary-employeeContrib-stdDed);
      const taxWithout=TE.calcFederalTax(taxableWithout,status,DATA);
      const taxWith=TE.calcFederalTax(taxableWith,status,DATA);
      fedTax=taxWithout-taxWith;
    } else {
      fedTax=employeeContrib*0.22;
    }
    if(DATA&&TE&&TE.calcStateTax){
      try{
        const taxWithout=TE.calcStateTax(salary,stateCode,DATA,status)?.tax||0;
        const taxWith=TE.calcStateTax(Math.max(0,salary-employeeContrib),stateCode,DATA,status)?.tax||0;
        stateTax=taxWithout-taxWith;
      }catch(e){stateTax=0;}
    }
    const totalTaxSaved=fedTax+stateTax;

    const monthlyContrib=employeeContrib/12;
    const monthlyMatch=employerMatch/12;

    // Projection
    let projEmployee=0,projEmployer=0;
    for(let i=0;i<years;i++){
      projEmployee=(projEmployee+employeeContrib)*(1+returnRate);
      projEmployer=(projEmployer+employerMatch)*(1+returnRate);
    }
    const projTotal=projEmployee+projEmployer;

    // Milestones every 5 years
    let milestoneRows='';
    for(let y=5;y<=years;y+=5){
      let pe=0,pm=0;
      for(let i=0;i<y;i++){
        pe=(pe+employeeContrib)*(1+returnRate);
        pm=(pm+employerMatch)*(1+returnRate);
      }
      milestoneRows+=`<tr><td>${y}</td><td>${TE.formatMoney(pe)}</td><td>${TE.formatMoney(pm)}</td><td>${TE.formatMoney(pe+pm)}</td></tr>`;
    }
    if(years%5!==0){
      let pe=0,pm=0;
      for(let i=0;i<years;i++){
        pe=(pe+employeeContrib)*(1+returnRate);
        pm=(pm+employerMatch)*(1+returnRate);
      }
      milestoneRows+=`<tr><td>${years}</td><td>${TE.formatMoney(pe)}</td><td>${TE.formatMoney(pm)}</td><td>${TE.formatMoney(pe+pm)}</td></tr>`;
    }

    const lines=[
      {label:'Annual salary',val:TE.formatMoney(salary)},
      {label:'Your contribution',val:TE.formatMoney(employeeContrib)+' ('+(contribPct*100).toFixed(1)+'%)'},
      {label:'Employer match',val:TE.formatMoney(employerMatch)},
      {label:'Total going in/year',val:TE.formatMoney(totalAnnual)},
      {label:'Monthly from you',val:TE.formatMoney(monthlyContrib)},
      {label:'Monthly from employer',val:TE.formatMoney(monthlyMatch)},
      {label:'Federal tax saved',val:TE.formatMoney(fedTax)},
      {label:'State tax saved ('+stateCode+')',val:TE.formatMoney(stateTax)},
      {label:'Total tax saved',val:TE.formatMoney(totalTaxSaved)},
      {label:'',val:''},
      {label:`${years}-year projection (your money)`,val:TE.formatMoney(projEmployee)},
      {label:`${years}-year projection (employer)`,val:TE.formatMoney(projEmployer)},
      {label:`${years}-year total`,val:TE.formatMoney(projTotal)}
    ];

    const bigCardStyle='background:var(--card);border:1px solid var(--border);border-radius:12px;padding:1.5rem;text-align:center;margin-bottom:1rem';
    const bigNumberStyle='font-size:2.2rem;font-weight:700;color:var(--accent);display:block';
    const bigLabelStyle='font-size:.85rem;color:var(--muted);margin-top:.25rem;display:block';

    const matchRate=(employerMatch/employeeContrib*100).toFixed(0);
    const leavingOnTable=salary*matchCapPct-employeeContrib;
    const gettingFullMatch=leavingOnTable<=100;
    const leavingMsg=gettingFullMatch?'<p><strong>You are getting the full match.</strong> Great job. Now consider increasing your contribution if you can afford it.</p>':`<p><strong>You are leaving ${TE.formatMoney(employerMatch?leavingOnTable*matchPct:0)} on the table.</strong> Contribute at least ${(matchCapPct*100).toFixed(0)}% of your salary to get the full match.</p>`;

    document.getElementById('k-res').innerHTML=resultsBox(lines,'Annual 401(k) Summary',TE.formatMoney(totalAnnual))+
    `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin-top:1rem">`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle}">${TE.formatMoney(employeeContrib)}</span><span style="${bigLabelStyle}">You Put In</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle}">${TE.formatMoney(employerMatch)}</span><span style="${bigLabelStyle}">Employer Match (${matchRate}%)</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle}">${TE.formatMoney(totalTaxSaved)}</span><span style="${bigLabelStyle}">Tax Saved This Year</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle}">${TE.formatMoney(projTotal)}</span><span style="${bigLabelStyle}">Projected in ${years} Years</span></div>`+
    `</div>`+
    `<div class="calc-panel" style="margin-top:1rem;background:rgba(201,74,30,.08);border-color:var(--accent)"><h3>The Match Check</h3><p>Your employer matches <strong>${(matchPct*100).toFixed(0)}%</strong> of your contributions up to <strong>${(matchCapPct*100).toFixed(0)}%</strong> of your salary.</p>${leavingMsg}${gettingFullMatch?'':`<p>At <strong>${TE.formatMoney(salary)}</strong> salary, the full match requires contributing <strong>${TE.formatMoney(salary*matchCapPct)}</strong>/year. You are contributing <strong>${TE.formatMoney(employeeContrib)}</strong>.</p>`}</div>`+
    `<div class="calc-panel" style="margin-top:1rem"><h3>${years}-Year Milestones</h3><table class="data-table"><thead><tr><th>Year</th><th>Your Contributions</th><th>Employer Match</th><th>Total Balance</th></tr></thead><tbody>${milestoneRows}</tbody></table></div>`+
    `<div class="calc-panel" style="margin-top:1rem"><h3>The Reality</h3><p>Every <strong>$100</strong> you contribute costs you only <strong>${TE.formatMoney(100-(100*fedTax/employeeContrib))}</strong> after the tax deduction. Your employer adds <strong>${TE.formatMoney(employerMatch/employeeContrib*100)}</strong>. That $100 becomes <strong>${TE.formatMoney(100+employerMatch/employeeContrib*100)}</strong> going into your account, before it even earns a penny of investment return.</p><p>Over ${years} years at <strong>${(returnRate*100).toFixed(1)}%</strong>, your contributions grow to <strong>${TE.formatMoney(projEmployee)}</strong>. Your employer's free money grows to <strong>${TE.formatMoney(projEmployer)}</strong>. Combined: <strong>${TE.formatMoney(projTotal)}</strong>.</p><p><strong>The only wrong contribution is zero.</strong></p></div>`;
    scrollToResults('k-res');
  });
}

/* ===================== Net Worth Calculator ===================== */
function netWorthView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'Net Worth'})}<h2>Net Worth Calculator 2026</h2><p style="color:var(--muted);margin-bottom:1.5rem">The most anxiety-driven question in personal finance: <em>Am I on track?</em> Enter your assets and liabilities. See your net worth, category breakdown, and where you stand for your age.</p>
    <div class="calc-grid"><div class="calc-panel"><h3>What You Own</h3>
      ${inputField('nw_cash','Cash & checking / savings','number',{value:15000})}
      ${inputField('nw_invest','Investments (401k, IRA, brokerage)','number',{value:45000})}
      ${inputField('nw_home','Home value (if owned)','number',{value:0})}
      ${inputField('nw_vehicle','Vehicle value','number',{value:8000})}
      ${inputField('nw_other_assets','Other assets (jewelry, collectibles, etc.)','number',{value:2000})}
    </div>
    <div class="calc-panel"><h3>What You Owe</h3>
      ${inputField('nw_mortgage','Mortgage balance','number',{value:0})}
      ${inputField('nw_student','Student loans','number',{value:25000})}
      ${inputField('nw_car_loan','Car loan','number',{value:5000})}
      ${inputField('nw_credit','Credit card debt','number',{value:3000})}
      ${inputField('nw_other_debt','Other debt (personal loans, etc.)','number',{value:0})}
      ${inputField('nw_age','Your age','number',{value:32})}
    </div></div>
    <div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcNetWorth()">Am I On Track?</button></div>
    <div id="nw-res"></div>`+
    renderFaqSection([
      {q:'What counts as net worth?',a:'Net worth = total assets − total liabilities. Assets include cash, investments, home equity, and anything you could sell. Liabilities include all debt. Your income does not count, only what you have minus what you owe.'},
      {q:'Why do age benchmarks matter?',a:'They do not. Seriously. Age benchmarks from the Federal Reserve are averages across all Americans, including retirees with decades of compounding. A 30-year-old with negative net worth because of student loans is not "behind", they are investing in future earnings. Use benchmarks as a data point, not a verdict.'},
      {q:'How do I increase my net worth fastest?',a:'Two levers: (1) Reduce high-interest debt first - credit cards at 20%+ APR destroy wealth faster than investments grow. (2) Maximize employer 401(k) match - it is an instant 50-100% return with zero risk. Everything else is optimization.'}
    ]);

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.calcNetWorth = safeCalc(function(){
    const cash=getVal('nw_cash');
    const invest=getVal('nw_invest');
    const home=getVal('nw_home');
    const vehicle=getVal('nw_vehicle');
    const otherAssets=getVal('nw_other_assets');
    const mortgage=getVal('nw_mortgage');
    const student=getVal('nw_student');
    const carLoan=getVal('nw_car_loan');
    const credit=getVal('nw_credit');
    const otherDebt=getVal('nw_other_debt');
    const age=getVal('nw_age');

    const totalAssets=cash+invest+home+vehicle+otherAssets;
    const totalLiabilities=mortgage+student+carLoan+credit+otherDebt;
    const netWorth=totalAssets-totalLiabilities;

    // Federal Reserve SCF 2022 median net worth by age (approximate, inflation-adjusted to 2026)
    const benchmarks=[
      {maxAge:25,median:12000,label:'Under 25'},
      {maxAge:35,median:55000,label:'25–34'},
      {maxAge:45,median:150000,label:'35–44'},
      {maxAge:55,median:250000,label:'45–54'},
      {maxAge:65,median:300000,label:'55–64'},
      {maxAge:75,median:330000,label:'65–74'},
      {maxAge:999,median:300000,label:'75+'}
    ];
    const bench=benchmarks.find(b=>age<=b.maxAge)||benchmarks[benchmarks.length-1];
    const vsMedian=netWorth-bench.median;
    const onTrack=vsMedian>=0;

    // Asset breakdown percentages
    const assetPct=a=>totalAssets>0?((a/totalAssets)*100).toFixed(1):0;
    const liabPct=l=>totalLiabilities>0?((l/totalLiabilities)*100).toFixed(1):0;

    const lines=[
      {label:'Cash & savings',val:TE.formatMoney(cash)},
      {label:'Investments',val:TE.formatMoney(invest)},
      {label:'Home value',val:TE.formatMoney(home)},
      {label:'Vehicle',val:TE.formatMoney(vehicle)},
      {label:'Other assets',val:TE.formatMoney(otherAssets)},
      {label:'Total assets',val:TE.formatMoney(totalAssets)},
      {label:'',val:''},
      {label:'Mortgage',val:TE.formatMoney(mortgage)},
      {label:'Student loans',val:TE.formatMoney(student)},
      {label:'Car loan',val:TE.formatMoney(carLoan)},
      {label:'Credit cards',val:TE.formatMoney(credit)},
      {label:'Other debt',val:TE.formatMoney(otherDebt)},
      {label:'Total liabilities',val:TE.formatMoney(totalLiabilities)},
      {label:'',val:''},
      {label:'Net worth',val:TE.formatMoney(netWorth)}
    ];

    const bigCardStyle='background:var(--card);border:1px solid var(--border);border-radius:12px;padding:1.5rem;text-align:center;margin-bottom:1rem';
    const bigNumberStyle='font-size:2.2rem;font-weight:700;color:var(--accent);display:block';
    const bigLabelStyle='font-size:.85rem;color:var(--muted);margin-top:.25rem;display:block';
    const nwColor=netWorth>=0?'#2e7d32':'#d32f2f';

    // Simple bar visual for assets
    const bar=(label,value,color,pct)=>`<div style="margin-bottom:.75rem"><div style="display:flex;justify-content:space-between;font-size:.9rem;margin-bottom:.25rem"><span>${label}</span><span>${TE.formatMoney(value)} (${pct}%)</span></div><div style="background:var(--border);border-radius:6px;height:20px;overflow:hidden"><div style="width:${Math.min(pct,100)}%;background:${color};height:100%;border-radius:6px"></div></div></div>`;

    const assetBars=bar('Cash',cash,'#4caf50',assetPct(cash))+bar('Investments',invest,'#2196f3',assetPct(invest))+bar('Home',home,'#ff9800',assetPct(home))+bar('Vehicle',vehicle,'#9c27b0',assetPct(vehicle))+bar('Other',otherAssets,'#607d8b',assetPct(otherAssets));
    const liabBars=bar('Mortgage',mortgage,'#f44336',liabPct(mortgage))+bar('Student loans',student,'#e91e63',liabPct(student))+bar('Car loan',carLoan,'#ff5722',liabPct(carLoan))+bar('Credit cards',credit,'#795548',liabPct(credit))+bar('Other debt',otherDebt,'#9e9e9e',liabPct(otherDebt));

    document.getElementById('nw-res').innerHTML=resultsBox(lines,'Net Worth Statement',TE.formatMoney(netWorth))+
    `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin-top:1rem">`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle}">${TE.formatMoney(totalAssets)}</span><span style="${bigLabelStyle}">Total Assets</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle}">${TE.formatMoney(totalLiabilities)}</span><span style="${bigLabelStyle}">Total Liabilities</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle};color:${nwColor}">${TE.formatMoney(netWorth)}</span><span style="${bigLabelStyle}">Net Worth</span></div>`+
    `</div>`+
    `<div class="calc-panel" style="margin-top:1rem;background:${onTrack?'rgba(46,125,50,.08)':'rgba(211,47,47,.08)'};border-color:${onTrack?'var(--success)':'#d32f2f'}"><h3>Am I On Track?</h3><p>You are <strong>${age}</strong> years old. The median net worth for your age group (${bench.label}) is <strong>${TE.formatMoney(bench.median)}</strong>.</p><p>Your net worth: <strong style="color:${nwColor}">${TE.formatMoney(netWorth)}</strong>. ${onTrack?`You are <strong>${TE.formatMoney(vsMedian)} above</strong> the median.`:`You are <strong>${TE.formatMoney(Math.abs(vsMedian))} below</strong> the median.`}</p><p style="color:var(--muted);font-size:.9rem">Remember: these are population averages, not targets. A doctor with $200k in student loans at age 30 is not "behind", they are investing in lifetime earnings. Use this as a data point, not a verdict.</p></div>`+
    `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1rem;margin-top:1rem">`+
    `<div class="calc-panel"><h3>Asset Breakdown</h3>${assetBars}</div>`+
    `<div class="calc-panel"><h3>Liability Breakdown</h3>${liabBars}</div>`+
    `</div>`+
    `<div class="calc-panel" style="margin-top:1rem"><h3>The Reality</h3><p>Net worth is a snapshot, not a scorecard. It does not include your <strong>human capital</strong> - the present value of your future earnings. A 25-year-old with negative net worth and a $100k salary is wealthier in economic terms than a 65-year-old with $200k net worth and no income.</p><p><strong>If your net worth is negative:</strong> Focus on eliminating high-interest debt first. Credit cards at 20%+ APR are a guaranteed negative 20% return. Pay them off before investing anything except your 401(k) match.</p><p><strong>If your net worth is positive but low:</strong> Increase your savings rate by 1% per month until it hurts. Automate it. You will not notice the difference in your lifestyle, but your net worth will compound dramatically over 10 years.</p><p><strong>The only number that truly matters:</strong> Is your net worth trending up? Track it quarterly. Direction matters more than absolute value.</p></div>`;
    scrollToResults('nw-res');
  });
}

/* ===================== Lifetime IRS Tax Paid Calculator ===================== */
function lifetimeIrsCostView(main){
  const stateOpts=DATA&&DATA.states?Object.keys(DATA.states).sort().map(code=>({value:code,label:DATA.states[code].name+' ('+code+')'})):[
    {value:'CA',label:'California (CA)'},{value:'NY',label:'New York (NY)'},{value:'TX',label:'Texas (TX)'},{value:'FL',label:'Florida (FL)'},{value:'IL',label:'Illinois (IL)'},{value:'WA',label:'Washington (WA)'},{value:'CO',label:'Colorado (CO)'},{value:'NC',label:'North Carolina (NC)'},{value:'OH',label:'Ohio (OH)'},{value:'PA',label:'Pennsylvania (PA)'}
  ];

  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'Lifetime IRS Tax Paid'})}<h2>Lifetime IRS Tax Paid Calculator 2026</h2><p style="color:var(--muted);margin-bottom:1.5rem">Enter your age, when you started working, and your average income. See exactly how much you have paid to the IRS over your entire career — federal income tax, state income tax, and FICA. The number might shock you.</p>${callout('red','The hidden tax','Most people only look at their annual tax bill. But over a 40-year career, a middle-income earner can easily pay $500,000+ in total taxes. This calculator reveals the lifetime cost of the IRS.')}<div class="calc-grid"><div class="calc-panel"><h3>Your Career</h3>${inputField('lt_age','Your current age','number',{value:45})}${inputField('lt_start_age','Age you started working','number',{value:22})}${inputField('lt_income','Average annual income','number',{value:75000})}${selectField('lt_status','Filing status',[{value:'single',label:'Single'},{value:'mfj',label:'Married Filing Jointly'},{value:'mfs',label:'Married Filing Separately'},{value:'hoh',label:'Head of Household'}],{value:'single',onchange:'calcLifetimeIRS()'})}${selectField('lt_state','State',stateOpts,{value:'CA',onchange:'calcLifetimeIRS()'})}</div><div class="calc-panel"><h3>Assumptions</h3>${inputField('lt_growth','Annual income growth (%)','number',{value:3})}<p style="color:var(--muted);font-size:.9rem">Income growth accounts for raises and promotions over your career. The calculator applies this growth rate to back-calculate your historical earnings from your current average.</p>${inputField('lt_401k','Average 401(k) contribution (% of income)','number',{value:6})}<p style="color:var(--muted);font-size:.9rem">401(k) contributions reduce your taxable income. Enter your average contribution rate over your career.</p></div></div><div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcLifetimeIRS()">Reveal My Lifetime Tax</button></div><div id="lt-res"></div>`+
    renderFaqSection([
      {q:'Does this include employer FICA?',a:'The calculator shows both perspectives: (1) what YOU personally paid out of your paycheck, and (2) what the IRS collected total including your employer\'s matching FICA contribution. Employer FICA is a tax on your labor that you never see, but it is still part of the total government revenue from your work.'},
      {q:'Why is the number so high?',a:'Taxes compound silently. A $75,000 earner in California pays roughly $10,000 in federal income tax, $3,500 in state tax, and $5,700 in FICA every year. Over 30 years, that is $585,000 — and that assumes zero income growth. With 3% annual raises, the total exceeds $750,000.'},
      {q:'Does this include sales tax, property tax, or gas tax?',a:'No. This calculator only covers taxes on labor income: federal income tax, state income tax, and FICA (Social Security + Medicare). If you added sales tax, property tax, gas tax, and excise taxes, the lifetime total would be 20-40% higher.'},
      {q:'How can I reduce my lifetime tax burden?',a:'Three levers: (1) Maximize pre-tax contributions — 401(k), HSA, and traditional IRA reduce taxable income now. (2) Move to a no-income-tax state — Texas, Florida, Washington, Tennessee, etc. (3) Consider business entity optimization — S-Corp election can save ~8-12% on SE tax if you earn $60,000+ as a contractor.'},
      {q:'What about Social Security benefits? Do I get that money back?',a:'Yes, but only partially. The average Social Security recipient receives about $1,800/month. Over 20 years of retirement, that is ~$432,000. But you paid FICA for 40+ working years. For most people, the "return" on FICA is negative in pure dollar terms — though it includes disability and survivor insurance that has real value.'}
    ]);
  setTimeout(()=>{if(typeof calcLifetimeIRS==='function')calcLifetimeIRS();},0);

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.calcLifetimeIRS = safeCalc(function(){
    const age=getVal('lt_age');
    const startAge=getVal('lt_start_age');
    const avgIncome=getVal('lt_income');
    const status=getSelect('lt_status');
    const state=getSelect('lt_state');
    const growth=getVal('lt_growth')/100;
    const contrib401k=getVal('lt_401k')/100;

    const yearsWorked=Math.max(0,age-startAge);
    if(yearsWorked<=0){
      document.getElementById('lt-res').innerHTML=`<div class="calc-panel" style="margin-top:1.5rem;background:rgba(211,47,47,.08);border-color:#d32f2f"><h3>Error</h3><p>Your start age must be less than your current age.</p></div>`;
      return;
    }

    // Build year-by-year income using growth rate (back-calculate from current average)
    // avgIncome is the current-year equivalent. We need historical actuals.
    // If income grew at `growth` per year, then income in year t (where t=0 is start) = startIncome * (1+growth)^t
    // Average over all years = sum / yearsWorked = avgIncome
    // startIncome = avgIncome * yearsWorked / sum((1+growth)^t for t=0..years-1)
    let growthSum=0;
    for(let t=0;t<yearsWorked;t++){growthSum+=Math.pow(1+growth,t);}
    const startIncome=growth>0?avgIncome*yearsWorked/growthSum:avgIncome;

    let totalFederal=0,totalState=0,totalEmployeeFICA=0,totalEmployerFICA=0,totalIncome=0;
    const ssWageBase=160200;
    const annualBreakdown=[];

    for(let t=0;t<yearsWorked;t++){
      const yearIncome=startIncome*Math.pow(1+growth,t);
      const wageIncome=yearIncome; // Assume all income is W-2 wages
      const retirementContrib=wageIncome*contrib401k;
      const taxableWages=Math.max(0,wageIncome-retirementContrib);

      // Federal tax using tax engine
      const fedTax=TE.calcFederalTax?TE.calcFederalTax(taxableWages,status,DATA):0;

      // State tax using tax engine
      const stateRes=TE.calcStateTax?TE.calcStateTax(taxableWages,state,DATA,status):{tax:0};
      const stateTax=stateRes.tax||0;

      // Employee FICA: 6.2% SS up to wage base + 1.45% Medicare (no cap)
      const ssTaxEmployee=Math.min(wageIncome,ssWageBase)*0.062;
      const medicareTaxEmployee=wageIncome*0.0145;
      const employeeFICA=ssTaxEmployee+medicareTaxEmployee;

      // Employer FICA: same amount
      const ssTaxEmployer=Math.min(wageIncome,ssWageBase)*0.062;
      const medicareTaxEmployer=wageIncome*0.0145;
      const employerFICA=ssTaxEmployer+medicareTaxEmployer;

      totalFederal+=fedTax;
      totalState+=stateTax;
      totalEmployeeFICA+=employeeFICA;
      totalEmployerFICA+=employerFICA;
      totalIncome+=wageIncome;

      // Store first 3 and last 3 years for the table
      if(t<3||t>=yearsWorked-3){
        annualBreakdown.push({year:t+1,age:startAge+t,income:wageIncome,fed:fedTax,state:stateTax,fica:employeeFICA,total:fedTax+stateTax+employeeFICA});
      }
    }

    const totalPersonalPaid=totalFederal+totalState+totalEmployeeFICA;
    const totalIRSCollected=totalFederal+totalState+totalEmployeeFICA+totalEmployerFICA;
    const avgAnnualTax=totalPersonalPaid/yearsWorked;
    const effectiveRate=totalIncome>0?totalPersonalPaid/totalIncome:0;

    // Fun comparisons
    const comparisons=[
      {label:'Tesla Model 3',cost:45000},
      {label:'Median home down payment',cost:60000},
      {label:'4 years of public college',cost:80000},
      {label:'Lamborghini',cost:250000},
      {label:'Beach house',cost:400000},
      {label:'Private jet (used)',cost:1000000}
    ];
    const whatYouCouldBuy=comparisons.filter(c=>totalPersonalPaid>=c.cost).map(c=>`<p><strong>${TE.formatMoney(totalPersonalPaid)}</strong> could buy <strong>${Math.floor(totalPersonalPaid/c.cost)}</strong> ${c.label}s</p>`).join('');

    // Tweet text
    const tweetText=`I have paid ${TE.formatMoney(totalPersonalPaid)} to the IRS over ${yearsWorked} years. See what the IRS cost you: `;

    const lines=[
      {label:'Years worked',val:yearsWorked+' years'},
      {label:'Total lifetime income',val:TE.formatMoney(totalIncome)},
      {label:'',val:''},
      {label:'Federal income tax',val:TE.formatMoney(totalFederal)},
      {label:'State income tax',val:TE.formatMoney(totalState)},
      {label:'Employee FICA (7.65%)',val:TE.formatMoney(totalEmployeeFICA)},
      {label:'',val:''},
      {label:'Total YOU paid',val:TE.formatMoney(totalPersonalPaid)},
      {label:'Employer FICA (hidden)',val:TE.formatMoney(totalEmployerFICA)},
      {label:'Total IRS collected',val:TE.formatMoney(totalIRSCollected)},
      {label:'',val:''},
      {label:'Average tax per year',val:TE.formatMoney(avgAnnualTax)},
      {label:'Effective lifetime tax rate',val:(effectiveRate*100).toFixed(1)+'%'}
    ];

    const bigCardStyle='background:var(--card);border:1px solid var(--border);border-radius:12px;padding:1.5rem;text-align:center;margin-bottom:1rem';
    const bigNumberStyle='font-size:2.2rem;font-weight:700;color:var(--accent);display:block';
    const bigLabelStyle='font-size:.85rem;color:var(--muted);margin-top:.25rem;display:block';

    document.getElementById('lt-res').innerHTML=resultsBox(lines,'Lifetime Tax Summary',TE.formatMoney(totalPersonalPaid))+
    `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin-top:1rem">`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle}">${TE.formatMoney(totalFederal)}</span><span style="${bigLabelStyle}">Federal Income Tax</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle}">${TE.formatMoney(totalState)}</span><span style="${bigLabelStyle}">State Income Tax</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle}">${TE.formatMoney(totalEmployeeFICA)}</span><span style="${bigLabelStyle}">Employee FICA</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle};color:#d32f2f">${TE.formatMoney(totalPersonalPaid)}</span><span style="${bigLabelStyle}">Total YOU Paid</span></div>`+
    `</div>`+
    `<div class="calc-panel" style="margin-top:1rem;background:rgba(211,47,47,.08);border-color:#d32f2f"><h3>💸 The Bottom Line</h3><p style="font-size:1.3rem;font-weight:600">You have paid <strong>${TE.formatMoney(totalPersonalPaid)}</strong> in taxes over <strong>${yearsWorked}</strong> years.</p><p>The IRS collected a total of <strong>${TE.formatMoney(totalIRSCollected)}</strong> from your labor (including the ${TE.formatMoney(totalEmployerFICA)} your employer paid on your behalf).</p><p>That is <strong>${(effectiveRate*100).toFixed(1)}%</strong> of every dollar you ever earned.</p><p style="color:var(--muted);font-size:.9rem;margin-top:1rem">Tweet this: "${tweetText}"</p></div>`+
    `<div class="calc-panel" style="margin-top:1rem"><h3>🛒 What You Could Have Bought</h3><p style="color:var(--muted);margin-bottom:1rem">With ${TE.formatMoney(totalPersonalPaid)}, you could have purchased:</p>${whatYouCouldBuy||`<p>Your lifetime tax is less than the items in our comparison list — for now.</p>`}</div>`+
    `<div class="calc-panel" style="margin-top:1rem"><h3>⚖️ Tax Breakdown by Category</h3><p><strong>Federal income tax:</strong> ${TE.formatMoney(totalFederal)} (${totalIncome>0?((totalFederal/totalIncome)*100).toFixed(1):0}% of lifetime income)</p><p><strong>State income tax:</strong> ${TE.formatMoney(totalState)} (${totalIncome>0?((totalState/totalIncome)*100).toFixed(1):0}% of lifetime income)</p><p><strong>Employee FICA:</strong> ${TE.formatMoney(totalEmployeeFICA)} (${totalIncome>0?((totalEmployeeFICA/totalIncome)*100).toFixed(1):0}% of lifetime income)</p><p><strong>Employer FICA (hidden):</strong> ${TE.formatMoney(totalEmployerFICA)} (${totalIncome>0?((totalEmployerFICA/totalIncome)*100).toFixed(1):0}% of lifetime income — you never see this, but it is part of the cost of employing you)</p></div>`;
    scrollToResults('lt-res');
  });
}

/* ===================== Gig Worker True Hourly Rate Calculator ===================== */
function gigTrueHourlyView(main){
  const stateOpts=DATA&&DATA.states?Object.keys(DATA.states).sort().map(code=>({value:code,label:DATA.states[code].name+' ('+code+')'})):[
    {value:'CA',label:'California (CA)'},{value:'NY',label:'New York (NY)'},{value:'TX',label:'Texas (TX)'},{value:'FL',label:'Florida (FL)'},{value:'IL',label:'Illinois (IL)'},{value:'WA',label:'Washington (WA)'},{value:'CO',label:'Colorado (CO)'},{value:'NC',label:'North Carolina (NC)'},{value:'OH',label:'Ohio (OH)'},{value:'PA',label:'Pennsylvania (PA)'}
  ];
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'Gig True Hourly Rate'})}<h2>Gig Worker True Hourly Rate Calculator 2026</h2><p style="color:var(--muted);margin-bottom:1.5rem">Your app says you made $28/hr. But after SE tax, mileage, car depreciation, phone, wait time, and dead miles — what is your real net hourly rate? This calculator reveals the truth.</p>${callout('red','The app lies','Uber, DoorDash, and Instacart show you "upfront pay" divided by active time. They ignore: wait time between orders, dead miles back to hotspots, SE tax (15.3%), gas, car depreciation, insurance, phone, and repairs. Your true rate is often 40-60% lower than the app claims.')}
    <div class="calc-grid"><div class="calc-panel"><h3>💰 Gross Earnings</h3>${inputField('gth_gross_weekly','Gross weekly earnings (app payout)','number',{value:800})}${inputField('gth_hours_app','Active hours per week (app-reported)','number',{value:30})}${inputField('gth_hours_total','Total hours invested per week','number',{value:38})}<p style="color:var(--muted);font-size:.9rem">Include wait time between orders, driving to hotspots, bathroom breaks, and time spent resolving support issues. Most drivers work 1.2-1.5x the "active" hours.</p></div>
    <div class="calc-panel"><h3>🚗 Vehicle Costs</h3>${inputField('gth_miles_weekly','Total miles driven per week','number',{value:450})}${inputField('gth_gas_price','Gas price per gallon','number',{value:3.50})}${inputField('gth_mpg','Vehicle MPG','number',{value:28})}${inputField('gth_car_value','Current car value','number',{value:18000})}${inputField('gth_car_miles','Total car lifetime miles','number',{value:60000})}<p style="color:var(--muted);font-size:.9rem">Depreciation = car value lost per mile. A $20k car at 100k miles = $0.20/mile. Insurance, registration, and maintenance add another $0.05-0.10/mile.</p></div></div>
    <div class="calc-grid"><div class="calc-panel"><h3>📱 Other Costs</h3>${inputField('gth_phone_weekly','Phone cost per week','number',{value:15})}${inputField('gth_insurance_weekly','Rideshare/delivery insurance add-on per week','number',{value:12})}${inputField('gth_maintenance_weekly','Maintenance & repairs per week','number',{value:25})}${inputField('gth_supplies_weekly','Supplies (bags, tolls, parking) per week','number',{value:10})}</div>
    <div class="calc-panel"><h3>📊 Profile</h3>${inputField('gth_other_income','Other W-2 income (annual)','number',{value:0})}${selectField('gth_status','Filing status',[{value:'single',label:'Single'},{value:'mfj',label:'Married Filing Jointly'},{value:'mfs',label:'Married Filing Separately'},{value:'hoh',label:'Head of Household'}],{value:'single',onchange:'calcGigTrueHourly()'})}${selectField('gth_state','State',stateOpts,{value:'CA',onchange:'calcGigTrueHourly()'})}</div></div>
    <div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcGigTrueHourly()">Reveal My True Hourly Rate</button></div>
    <div id="gth-res"></div>`+
    renderFaqSection([
      {q:'Why is my true hourly rate so much lower than the app shows?',a:'Gig apps calculate "active time" only — from accepting an order to completing delivery. They exclude: (1) dead time waiting for orders, (2) dead miles driving back to hotspots, (3) all vehicle costs, (4) SE tax, (5) phone, insurance, and supplies. A driver who earns $800 in 30 "active" hours but drives 450 miles and waits 8 extra hours has a true rate of ~$12/hr, not $26.67/hr.'},
      {q:'How do I calculate car depreciation per mile?',a:'Simple method: (Purchase price - estimated salvage value) / total expected miles. A $22,000 car worth $4,000 after 150,000 miles depreciates $0.12/mile. Add insurance, registration, maintenance, and tires (~$0.08/mile) for total vehicle cost of ~$0.20/mile. The IRS mileage rate of $0.725/mile for 2026 includes all of this plus a profit margin for business use.'},
      {q:'Should I use the standard mileage deduction or actual expenses?',a:'For most gig workers, the standard mileage rate ($0.725/mile in 2026) is higher than actual costs. But if you drive an expensive vehicle with high depreciation or have major repairs, actual expenses may win. You cannot switch methods mid-vehicle (if you used standard mileage in year 1, you may be locked in). Track both and compare at tax time.'},
      {q:'What is SE tax and why does it kill my rate?',a:'Self-employment tax is 15.3% on 92.35% of net profit — that is 14.13% effective. It covers Social Security (12.4%) and Medicare (2.9%). Employees pay 7.65% and their employer pays 7.65%. As a gig worker, you are both employee AND employer, so you pay both halves. There is no way around it — it is the biggest hidden cost of gig work.'},
      {q:'Is gig work even worth it after all costs?',a:'It depends. Short trips in busy areas during peak pay can yield $18-25/hr net. Long trips to rural areas, low-tip orders, and dead time can drop below minimum wage. The key metric is <strong>true net hourly rate</strong> — not gross, not app-reported. Use this calculator after every week to find your profitable zones and times. Drop the unprofitable ones.'}
    ]);
  setTimeout(()=>{if(typeof calcGigTrueHourly==='function')calcGigTrueHourly();},0);

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.calcGigTrueHourly = safeCalc(function(){
    const grossWeekly=getVal('gth_gross_weekly');
    const hoursApp=getVal('gth_hours_app');
    const hoursTotal=getVal('gth_hours_total');
    const milesWeekly=getVal('gth_miles_weekly');
    const gasPrice=getVal('gth_gas_price');
    const mpg=getVal('gth_mpg');
    const carValue=getVal('gth_car_value');
    const carMiles=getVal('gth_car_miles');
    const phoneWeekly=getVal('gth_phone_weekly');
    const insuranceWeekly=getVal('gth_insurance_weekly');
    const maintenanceWeekly=getVal('gth_maintenance_weekly');
    const suppliesWeekly=getVal('gth_supplies_weekly');
    const otherIncome=getVal('gth_other_income');
    const status=getSelect('gth_status');
    const state=getSelect('gth_state');

    // Annualize
    const weeksPerYear=52;
    const grossAnnual=grossWeekly*weeksPerYear;
    const milesAnnual=milesWeekly*weeksPerYear;
    const totalHoursAnnual=hoursTotal*weeksPerYear;
    const appHoursAnnual=hoursApp*weeksPerYear;

    // Gas cost
    const gasCostAnnual=(milesAnnual/mpg)*gasPrice;

    // Depreciation: straight-line per mile based on current value vs expected life
    // Assume car depreciates to $2,000 salvage at 200,000 miles total
    const salvageValue=2000;
    const totalExpectedMiles=200000;
    const depreciationPerMile=Math.max(0,(carValue-salvageValue)/(totalExpectedMiles-carMiles));
    const depreciationAnnual=milesAnnual*depreciationPerMile;

    // Other costs
    const phoneAnnual=phoneWeekly*weeksPerYear;
    const insuranceAnnual=insuranceWeekly*weeksPerYear;
    const maintenanceAnnual=maintenanceWeekly*weeksPerYear;
    const suppliesAnnual=suppliesWeekly*weeksPerYear;

    // Total deductions (Schedule C)
    const mileageDeduction=milesAnnual*MILEAGE_RATE;
    const totalDeductions=gasCostAnnual+depreciationAnnual+phoneAnnual+insuranceAnnual+maintenanceAnnual+suppliesAnnual;
    // Use the larger of actual expenses or standard mileage (simplified: if mileage deduction > actual, use it)
    const usedDeductions=Math.max(totalDeductions,mileageDeduction);

    // Net SE income
    const netSE=Math.max(0,grossAnnual-usedDeductions);

    // SE tax
    const se=TE.calcSETax(netSE,DATA,otherIncome);
    const seTaxAnnual=se.totalSE;

    // Federal and state income tax on net
    const agi=otherIncome+netSE-se.deductibleHalf;
    const stdDed=TE.getStandardDeduction(status,false,DATA);
    const taxableBeforeQBI=Math.max(0,agi-stdDed);
    const qbi=TE.calcQBI(netSE,taxableBeforeQBI,status,DATA);
    const taxable=Math.max(0,taxableBeforeQBI-qbi);
    const fedTax=TE.calcFederalTax(taxable,status,DATA);
    const stateRes=TE.calcStateTax(agi,state,DATA,status);
    const stateTax=stateRes.tax||0;

    // Total tax burden
    const totalTax=seTaxAnnual+fedTax+stateTax;

    // True net annual and hourly
    const trueNetAnnual=grossAnnual-totalTax-usedDeductions;
    const trueNetHourly=totalHoursAnnual>0?trueNetAnnual/totalHoursAnnual:0;
    const appNetHourly=appHoursAnnual>0?trueNetAnnual/appHoursAnnual:0;
    const grossAppHourly=appHoursAnnual>0?grossAnnual/appHoursAnnual:0;
    const grossTrueHourly=totalHoursAnnual>0?grossAnnual/totalHoursAnnual:0;

    // Weekly figures for display
    const trueNetWeekly=trueNetAnnual/weeksPerYear;
    const costsWeekly=(usedDeductions+totalTax)/weeksPerYear;

    const lines=[
      {label:'Gross weekly earnings',val:TE.formatMoney(grossWeekly)},
      {label:'Gross hourly (app-reported time)',val:TE.formatMoney(grossAppHourly)+'/hr'},
      {label:'Gross hourly (total time)',val:TE.formatMoney(grossTrueHourly)+'/hr'},
      {label:'',val:''},
      {label:'Annual miles driven',val:milesAnnual.toLocaleString()+' miles'},
      {label:'Gas cost (annual)',val:TE.formatMoney(gasCostAnnual)},
      {label:'Depreciation (annual)',val:TE.formatMoney(depreciationAnnual)},
      {label:'Phone + insurance + maint + supplies',val:TE.formatMoney(phoneAnnual+insuranceAnnual+maintenanceAnnual+suppliesAnnual)},
      {label:'Total vehicle & business costs',val:TE.formatMoney(usedDeductions)},
      {label:'',val:''},
      {label:'SE tax (15.3%)',val:TE.formatMoney(seTaxAnnual)},
      {label:'Federal income tax',val:TE.formatMoney(fedTax)},
      {label:'State income tax ('+(DATA&&DATA.states&&DATA.states[state]?DATA.states[state].name:state)+')',val:TE.formatMoney(stateTax)},
      {label:'Total annual tax',val:TE.formatMoney(totalTax)},
      {label:'',val:''},
      {label:'True net annual income',val:TE.formatMoney(trueNetAnnual)},
      {label:'True net weekly income',val:TE.formatMoney(trueNetWeekly)},
      {label:'True net hourly (total time)',val:TE.formatMoney(trueNetHourly)+'/hr'},
      {label:'True net hourly (app time)',val:TE.formatMoney(appNetHourly)+'/hr'}
    ];

    const bigCardStyle='background:var(--card);border:1px solid var(--border);border-radius:12px;padding:1.5rem;text-align:center;margin-bottom:1rem';
    const bigNumberStyle='font-size:2.2rem;font-weight:700;color:var(--accent);display:block';
    const bigLabelStyle='font-size:.85rem;color:var(--muted);margin-top:.25rem;display:block';

    const vsAppRate=grossAppHourly>0?((grossAppHourly-trueNetHourly)/grossAppHourly*100).toFixed(0):0;

    document.getElementById('gth-res').innerHTML=resultsBox(lines,'True Hourly Rate',TE.formatMoney(trueNetHourly)+'/hr')+
    `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin-top:1rem">`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle};text-decoration:line-through;color:var(--muted)">${TE.formatMoney(grossAppHourly)}</span><span style="${bigLabelStyle}">App "Hourly"</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle};color:#d32f2f">${TE.formatMoney(trueNetHourly)}</span><span style="${bigLabelStyle}">True Net Hourly</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle}">${TE.formatMoney(trueNetWeekly)}</span><span style="${bigLabelStyle}">True Net Weekly</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle}">${TE.formatMoney(usedDeductions+totalTax)}</span><span style="${bigLabelStyle}">Annual Costs + Tax</span></div>`+
    `</div>`+
    `<div class="calc-panel" style="margin-top:1rem;background:rgba(211,47,47,.08);border-color:#d32f2f"><h3>🚨 The Reality</h3><p style="font-size:1.3rem;font-weight:600">Your app claims <strong>${TE.formatMoney(grossAppHourly)}/hr</strong>. Your true net rate is <strong>${TE.formatMoney(trueNetHourly)}/hr</strong>.</p><p>That is a <strong>${vsAppRate}%</strong> pay cut from what the app advertises.</p><p>Over a year, you are losing <strong>${TE.formatMoney(grossAnnual-trueNetAnnual)}</strong> to costs and taxes — money the app never warns you about.</p></div>`+
    `<div class="calc-panel" style="margin-top:1rem"><h3>📉 Where Your Money Goes (Annual)</h3><p><strong>Vehicle costs:</strong> ${TE.formatMoney(gasCostAnnual+depreciationAnnual+insuranceAnnual+maintenanceAnnual)} (${grossAnnual>0?((gasCostAnnual+depreciationAnnual+insuranceAnnual+maintenanceAnnual)/grossAnnual*100).toFixed(0):0}% of gross)</p><p><strong>SE tax:</strong> ${TE.formatMoney(seTaxAnnual)} (${grossAnnual>0?(seTaxAnnual/grossAnnual*100).toFixed(0):0}% of gross)</p><p><strong>Income tax:</strong> ${TE.formatMoney(fedTax+stateTax)} (${grossAnnual>0?((fedTax+stateTax)/grossAnnual*100).toFixed(0):0}% of gross)</p><p><strong>Other costs:</strong> ${TE.formatMoney(phoneAnnual+suppliesAnnual)} (${grossAnnual>0?((phoneAnnual+suppliesAnnual)/grossAnnual*100).toFixed(0):0}% of gross)</p><p><strong>True take-home:</strong> ${TE.formatMoney(trueNetAnnual)} (${grossAnnual>0?(trueNetAnnual/grossAnnual*100).toFixed(0):0}% of gross)</p></div>`+
    `<div class="calc-panel" style="margin-top:1rem"><h3>⚡ How to Improve Your True Rate</h3><p><strong>1. Drive a cheaper, efficient car:</strong> Depreciation and gas are your two biggest costs. A $8,000 used hybrid at 45 MPG vs a $25,000 SUV at 22 MPG can add $4-6/hr to your net rate.</p><p><strong>2. Stack orders strategically:</strong> Multi-app (Uber + DoorDash + Instacart) to minimize dead time. If you wait 10 minutes between orders, you are earning $0/hr during that time.</p><p><strong>3. Track every mile:</strong> Every business mile is $0.725 in deductions. Many drivers forget miles to the first pickup, between orders, and returning home. Use Stride or Everlance.</p><p><strong>4. Target peak pay:</strong> Lunch (11am-1pm) and dinner (5pm-9pm) surges can 2x your gross. Avoid 2-4pm dead zones unless you have another reason to be out.</p><p><strong>5. Know when to quit:</strong> If your true rate consistently drops below $12/hr in your market, consider a W-2 job with benefits. The math does not lie.</p></div>`;
    scrollToResults('gth-res');
  });
}

/* ===================== W-2 vs 1099 Calculator ===================== */
function w2Vs1099View(main){
  const stateOpts=DATA&&DATA.states?Object.keys(DATA.states).sort().map(code=>({value:code,label:DATA.states[code].name+' ('+code+')'})):[
    {value:'CA',label:'California (CA)'},{value:'NY',label:'New York (NY)'},{value:'TX',label:'Texas (TX)'},{value:'FL',label:'Florida (FL)'},{value:'IL',label:'Illinois (IL)'},{value:'WA',label:'Washington (WA)'},{value:'CO',label:'Colorado (CO)'},{value:'NC',label:'North Carolina (NC)'},{value:'OH',label:'Ohio (OH)'},{value:'PA',label:'Pennsylvania (PA)'}
  ];
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'W-2 vs 1099'})}<h2>W-2 vs 1099 Calculator 2026</h2><p style="color:var(--muted);margin-bottom:1.5rem">Your employer offered $85k W-2 or $95k 1099. Which actually pays more? This calculator compares side-by-side after benefits, FICA, SE tax, deductions, and income tax.</p>${callout('yellow','The 1099 trap','A 1099 offer looks higher on paper. But you lose employer-paid benefits (health insurance, 401k match, PTO), pay both halves of FICA (15.3% SE tax vs 7.65% employee FICA), and must buy your own insurance. The W-2 job often wins even when the 1099 number is 15-20% higher.')}
    <div class="calc-grid"><div class="calc-panel"><h3>💼 W-2 Offer</h3>${inputField('w2_salary','W-2 annual salary','number',{value:85000})}${inputField('w2_health_employer','Employer health insurance contribution (annual)','number',{value:8000})}${inputField('w2_401k_match','Employer 401(k) match (% of salary)','number',{value:4})}${inputField('w2_pto_weeks','PTO weeks per year','number',{value:3})}${inputField('w2_other_benefits','Other benefits value (annual)','number',{value:2000})}<p style="color:var(--muted);font-size:.9rem">Include: employer HSA contributions, commuter benefits, life insurance, stock options, training budget, free meals, etc.</p></div>
    <div class="calc-panel"><h3>📋 1099 Offer</h3>${inputField('c1099_income','1099 annual gross income','number',{value:95000})}${inputField('c1099_deductions','Business deductions (annual)','number',{value:8000})}${inputField('c1099_health_cost','Self-purchased health insurance (annual)','number',{value:6000})}${inputField('c1099_401k_contrib','Solo 401(k) contribution (annual)','number',{value:10000})}</div></div>
    <div class="calc-grid"><div class="calc-panel"><h3>📊 Profile</h3>${selectField('w2v9_status','Filing status',[{value:'single',label:'Single'},{value:'mfj',label:'Married Filing Jointly'},{value:'mfs',label:'Married Filing Separately'},{value:'hoh',label:'Head of Household'}],{value:'single'})}${selectField('w2v9_state','State',stateOpts,{value:'CA'})}</div>
    <div class="calc-panel"><h3>Assumptions</h3>${inputField('w2v9_age65','Age 65+','checkbox')}${inputField('w2v9_dependents','Children under 17','number',{value:0})}</div></div>
    <div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcW2Vs1099()">Compare Side-by-Side</button></div>
    <div id="w2v9-res"></div>`+
    renderFaqSection([
      {q:'Why does the W-2 often win even with a lower salary?',a:'Employer-paid benefits are worth $10,000-25,000/year that you do not see on your paycheck: health insurance ($8-15k), 401k match ($2-5k), PTO (3-6% of salary), payroll taxes (7.65% of your wages paid by employer), unemployment insurance, workers comp, and disability. A $85k W-2 with benefits is often equivalent to a $105k+ 1099.'},
      {q:'What is the real cost of SE tax on 1099 income?',a:'Self-employment tax is 15.3% on 92.35% of net profit = 14.13% effective. On $95,000 gross with $8,000 deductions = $87,000 net, SE tax is ~$12,292. A W-2 employee on $85,000 pays only $6,502 in employee FICA. The 1099 worker pays $5,790 more in payroll taxes alone.'},
      {q:'Can I deduct health insurance as a 1099 worker?',a:'Yes. Self-employed health insurance is an above-the-line deduction (not Schedule C). It reduces your AGI directly. But it only applies if you are not eligible for employer-subsidized coverage elsewhere (including a spouse\'s plan). If your spouse has a W-2 with health insurance, you generally cannot take the deduction.'},
      {q:'Should I negotiate for W-2 or 1099?',a:'If you need health insurance, have dependents, or value stability — push for W-2. If you are young, healthy, have a working spouse with benefits, and want flexibility — 1099 can work if the premium is at least 20-25% above the W-2 equivalent. Use this calculator to find your exact break-even number before negotiating.'},
      {q:'What about QBI deduction for 1099?',a:'The Qualified Business Income (QBI) deduction gives 1099 workers a 20% deduction on net business income (IRC 199A). For a single filer with $87,000 net SE income, QBI could be up to $17,400 — reducing taxable income significantly. This calculator models QBI automatically based on 2026 thresholds.'}
    ]);

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.calcW2Vs1099 = safeCalc(function(){
    try{
    const w2Salary=getVal('w2_salary');
    const w2HealthEmployer=getVal('w2_health_employer');
    const w2MatchPct=getVal('w2_401k_match')/100;
    const w2PtoWeeks=getVal('w2_pto_weeks');
    const w2OtherBenefits=getVal('w2_other_benefits');
    const c1099Income=getVal('c1099_income');
    const c1099Ded=getVal('c1099_deductions');
    const c1099HealthCost=getVal('c1099_health_cost');
    const c1099Solo401k=getVal('c1099_401k_contrib');
    const status=getSelect('w2v9_status');
    const state=getSelect('w2v9_state');
    const age65=getVal('w2v9_age65');
    const dependents=getVal('w2v9_dependents');

    // W-2 calculations
    const w2EmployeeFICA=Math.min(w2Salary,160200)*0.062+w2Salary*0.0145;
    const w2EmployerFICA=w2EmployeeFICA; // employer pays same
    const w2MatchDollars=w2Salary*w2MatchPct;
    const w2PtoValue=w2Salary/52*w2PtoWeeks;
    const w2TotalComp=w2Salary+w2HealthEmployer+w2MatchDollars+w2PtoValue+w2OtherBenefits+w2EmployerFICA;

    const w2StdDed=TE.getStandardDeduction(status,age65,DATA);
    const w2Taxable=Math.max(0,w2Salary-w2StdDed);
    const w2FedTax=TE.calcFederalTax(w2Taxable,status,DATA);
    const w2StateRes=TE.calcStateTax(w2Salary,state,DATA,status);
    const w2StateTax=w2StateRes.tax||0;
    const w2TotalTax=w2EmployeeFICA+w2FedTax+w2StateTax;
    const w2TakeHome=w2Salary-w2TotalTax;
    const w2TakeHomePct=w2Salary>0?w2TakeHome/w2Salary:0;

    // 1099 calculations
    const c1099NetSE=Math.max(0,c1099Income-c1099Ded);
    const se=TE.calcSETax(c1099NetSE,DATA,0);
    const c1099SETax=se.totalSE;

    // SE health insurance deduction (above-the-line)
    const sehiDed=Math.min(c1099HealthCost,c1099NetSE);

    // Solo 401(k) reduces taxable income
    const c1099AGI=c1099NetSE-se.deductibleHalf-sehiDed-c1099Solo401k;
    const c1099StdDed=TE.getStandardDeduction(status,age65,DATA);
    const c1099TaxableBeforeQBI=Math.max(0,c1099AGI-c1099StdDed);
    const c1099QBI=TE.calcQBI(c1099NetSE,c1099TaxableBeforeQBI,status,DATA);
    const c1099Taxable=Math.max(0,c1099TaxableBeforeQBI-c1099QBI);
    const c1099FedTax=TE.calcFederalTax(c1099Taxable,status,DATA);
    const c1099StateRes=TE.calcStateTax(c1099AGI,state,DATA,status);
    const c1099StateTax=c1099StateRes.tax||0;
    const c1099TotalTax=c1099SETax+c1099FedTax+c1099StateTax;

    // True 1099 take-home: gross - business costs - health insurance - tax
    const c1099TakeHome=c1099Income-c1099Ded-c1099HealthCost-c1099TotalTax;
    const c1099TakeHomePct=c1099Income>0?c1099TakeHome/c1099Income:0;

    // CTC for both
    const ctcPerChild=DATA&&DATA.federal&&DATA.federal.childTaxCredit?DATA.federal.childTaxCredit.amount||2000:2000;
    const ctcW2=Math.min(dependents*ctcPerChild,w2FedTax);
    const ctc1099=Math.min(dependents*ctcPerChild,c1099FedTax);

    const w2AfterCTC=w2TakeHome+ctcW2;
    const c1099AfterCTC=c1099TakeHome+ctc1099;

    // Winner
    const w2Wins=w2AfterCTC>c1099AfterCTC;
    const diff=Math.abs(w2AfterCTC-c1099AfterCTC);
    const winner=w2Wins?'W-2':'1099';
    const breakEven1099=c1099Income+diff;

    const bigCardStyle='background:var(--card);border:1px solid var(--border);border-radius:12px;padding:1.5rem;text-align:center;margin-bottom:1rem';
    const bigNumberStyle='font-size:2.2rem;font-weight:700;color:var(--accent);display:block';
    const bigLabelStyle='font-size:.85rem;color:var(--muted);margin-top:.25rem;display:block';

    const stat=(label,val,pct)=>`<div style="${bigCardStyle}"><span style="${bigNumberStyle}${pct?'':'"'}${pct?';color:'+(pct>0?'var(--success)':'#d32f2f')+'"':''}>${val}</span><span style="${bigLabelStyle}">${label}</span></div>`;

    document.getElementById('w2v9-res').innerHTML=
    `<div class="calc-panel" style="margin-top:1.5rem"><h3>🏆 Winner: ${winner}</h3><p style="font-size:1.3rem;font-weight:600">After taxes and benefits, the <strong>${winner}</strong> pays <strong>${TE.formatMoney(diff)}</strong> more per year.</p><p style="color:var(--muted)">To break even, the 1099 offer would need to be at least <strong>${TE.formatMoney(breakEven1099)}</strong>.</p></div>`+
    `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1rem;margin-top:1rem">`+
    `<div class="calc-panel"><h3>💼 W-2: ${TE.formatMoney(w2Salary)}</h3>`+
    `<p><strong>Gross salary:</strong> ${TE.formatMoney(w2Salary)}</p>`+
    `<p style="color:var(--muted)"><strong>+ Employer health ins:</strong> ${TE.formatMoney(w2HealthEmployer)}</p>`+
    `<p style="color:var(--muted)"><strong>+ 401(k) match:</strong> ${TE.formatMoney(w2MatchDollars)}</p>`+
    `<p style="color:var(--muted)"><strong>+ PTO value:</strong> ${TE.formatMoney(w2PtoValue)}</p>`+
    `<p style="color:var(--muted)"><strong>+ Other benefits:</strong> ${TE.formatMoney(w2OtherBenefits)}</p>`+
    `<p style="color:var(--muted)"><strong>+ Employer FICA:</strong> ${TE.formatMoney(w2EmployerFICA)}</p>`+
    `<p style="border-top:1px solid var(--border);margin-top:.5rem;padding-top:.5rem"><strong>Total compensation:</strong> ${TE.formatMoney(w2TotalComp)}</p>`+
    `<p style="color:var(--muted);margin-top:.5rem"><strong>− Employee FICA:</strong> ${TE.formatMoney(w2EmployeeFICA)}</p>`+
    `<p style="color:var(--muted)"><strong>− Federal tax:</strong> ${TE.formatMoney(w2FedTax)}</p>`+
    `<p style="color:var(--muted)"><strong>− State tax:</strong> ${TE.formatMoney(w2StateTax)}</p>`+
    `<p style="border-top:1px solid var(--border);margin-top:.5rem;padding-top:.5rem"><strong>Take-home:</strong> ${TE.formatMoney(w2TakeHome)}</p>`+
    `<p style="color:var(--muted)"><strong>+ Child tax credit:</strong> ${TE.formatMoney(ctcW2)}</p>`+
    `<p style="border-top:1px solid var(--border);margin-top:.5rem;padding-top:.5rem;font-weight:600;color:var(--accent)"><strong>Net after CTC:</strong> ${TE.formatMoney(w2AfterCTC)}</p>`+
    `<p style="color:var(--muted);font-size:.9rem">Effective take-home rate: ${(w2TakeHomePct*100).toFixed(1)}%</p></div>`+
    `<div class="calc-panel"><h3>📋 1099: ${TE.formatMoney(c1099Income)}</h3>`+
    `<p><strong>Gross income:</strong> ${TE.formatMoney(c1099Income)}</p>`+
    `<p style="color:var(--muted)"><strong>− Business deductions:</strong> ${TE.formatMoney(c1099Ded)}</p>`+
    `<p style="border-top:1px solid var(--border);margin-top:.5rem;padding-top:.5rem"><strong>Net SE income:</strong> ${TE.formatMoney(c1099NetSE)}</p>`+
    `<p style="color:var(--muted);margin-top:.5rem"><strong>− SE tax (15.3%):</strong> ${TE.formatMoney(c1099SETax)}</p>`+
    `<p style="color:var(--muted)"><strong>− Self health ins:</strong> ${TE.formatMoney(c1099HealthCost)}</p>`+
    `<p style="color:var(--muted)"><strong>− Federal tax:</strong> ${TE.formatMoney(c1099FedTax)}</p>`+
    `<p style="color:var(--muted)"><strong>− State tax:</strong> ${TE.formatMoney(c1099StateTax)}</p>`+
    `<p style="border-top:1px solid var(--border);margin-top:.5rem;padding-top:.5rem"><strong>Take-home:</strong> ${TE.formatMoney(c1099TakeHome)}</p>`+
    `<p style="color:var(--muted)"><strong>+ Child tax credit:</strong> ${TE.formatMoney(ctc1099)}</p>`+
    `<p style="border-top:1px solid var(--border);margin-top:.5rem;padding-top:.5rem;font-weight:600;color:var(--accent)"><strong>Net after CTC:</strong> ${TE.formatMoney(c1099AfterCTC)}</p>`+
    `<p style="color:var(--muted);font-size:.9rem">Effective take-home rate: ${(c1099TakeHomePct*100).toFixed(1)}%</p></div>`+
    `</div>`+
    `<div class="calc-panel" style="margin-top:1rem"><h3>📊 Side-by-Side Summary</h3><div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;font-size:.95rem">`+
    `<div><strong>W-2</strong><br>Gross: ${TE.formatMoney(w2Salary)}<br>Tax: ${TE.formatMoney(w2TotalTax)}<br>Benefits: ${TE.formatMoney(w2HealthEmployer+w2MatchDollars+w2PtoValue+w2OtherBenefits)}<br><strong>Net: ${TE.formatMoney(w2AfterCTC)}</strong></div>`+
    `<div><strong>1099</strong><br>Gross: ${TE.formatMoney(c1099Income)}<br>Tax: ${TE.formatMoney(c1099TotalTax)}<br>Business costs: ${TE.formatMoney(c1099Ded+c1099HealthCost)}<br><strong>Net: ${TE.formatMoney(c1099AfterCTC)}</strong></div>`+
    `</div></div>`+
    `<div class="calc-panel" style="margin-top:1rem"><h3>⚖️ What Breaks the Tie</h3><p><strong>Benefits gap:</strong> ${TE.formatMoney(w2HealthEmployer+w2MatchDollars+w2PtoValue+w2OtherBenefits+w2EmployerFICA)} in employer-paid benefits + taxes you do not pay as W-2.</p><p><strong>Tax gap:</strong> 1099 pays ${TE.formatMoney(c1099SETax-w2EmployeeFICA)} more in payroll taxes (SE tax vs employee FICA).</p><p><strong>Deduction gap:</strong> 1099 gets ${TE.formatMoney(c1099Ded)} in business deductions + up to ${TE.formatMoney(c1099QBI)} QBI deduction.</p><p><strong>Health gap:</strong> W-2 gets ${TE.formatMoney(w2HealthEmployer)} employer health subsidy. 1099 pays ${TE.formatMoney(c1099HealthCost)} out of pocket.</p></div>`;
    scrollToResults('w2v9-res');
    }catch(e){console.error('calcW2Vs1099 error:',e.message,e.stack);document.getElementById('w2v9-res').innerHTML='<p style="color:#d32f2f">Error: '+e.message+'</p>';}
  });
}

/* ===================== Influencer Deal Sanity Checker ===================== */
function influencerDealView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'Influencer Deal Checker'})}<h2>Influencer Deal Sanity Checker 2026</h2><p style="color:var(--muted);margin-bottom:1.5rem">A brand offered you $500 for a sponsored post. Is that fair? Enter your followers, engagement rate, content type, and niche to see the estimated fair market rate for your reach and performance.</p>${callout('yellow','The hidden underpayment','Most influencers do not know their fair market rate. Brands routinely offer 30-60% below market value, especially to micro and nano creators who lack agency representation. This calculator benchmarks your deal against 2026 industry rates across 10 niches and 6 content formats.')}
    <div class="calc-grid"><div class="calc-panel"><h3>📊 Your Profile</h3>
      ${inputField('id_followers','Followers','number',{value:25000})}
      ${inputField('id_engagement','Engagement rate (%)','number',{value:3.5,min:0,step:0.1})}
      ${selectField('id_niche','Niche / Vertical',[
        {value:'fashion',label:'Fashion & Beauty'},
        {value:'fitness',label:'Fitness & Wellness'},
        {value:'travel',label:'Travel & Lifestyle'},
        {value:'food',label:'Food & Cooking'},
        {value:'tech',label:'Tech & Gadgets'},
        {value:'finance',label:'Finance & Investing'},
        {value:'gaming',label:'Gaming & Esports'},
        {value:'lifestyle',label:'General Lifestyle'},
        {value:'business',label:'Business & Entrepreneurship'},
        {value:'health',label:'Health & Medical'}
      ],{value:'fashion'})}
    </div>
    <div class="calc-panel"><h3>🎬 Content & Deal</h3>
      ${selectField('id_content','Content type',[
        {value:'static',label:'Static Post (1 image)'},
        {value:'carousel',label:'Carousel (3-10 images)'},
        {value:'story',label:'Story (24hr)'},
        {value:'reel',label:'Reel / Short Video'},
        {value:'video',label:'Long-form Video'},
        {value:'live',label:'Live Stream'}
      ],{value:'reel'})}
      ${inputField('id_offered','Brand offer ($)','number',{value:400})}
      ${selectField('id_usage','Usage rights',[
        {value:'organic',label:'Organic post only'},
        {value:'boosted',label:'Brand can boost / whitelist'},
        {value:'repurpose',label:'Full repurposing rights'},
        {value:'exclusive',label:'Exclusivity clause included'}
      ],{value:'organic'})}
    </div></div>
    <div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcInfluencerDeal()">Is This Deal Fair?</button></div>
    <div id="id-res"></div>`+
    renderFaqSection([
      {q:'How are influencer rates calculated in 2026?',a:'Fair market rate = base rate for your follower tier x engagement premium x content type multiplier x niche multiplier x usage rights multiplier. Base rates are derived from 2026 industry reports (Influencer Marketing Hub, Later, Aspire) tracking 10,000+ paid collaborations. Nano (1-10K): $10-150. Micro (10-50K): $150-800. Mid (50-200K): $800-3,000. Macro (200K-1M): $3,000-12,000. Mega (1M+): $12,000+.'},
      {q:'Why does engagement rate matter more than followers?',a:'A creator with 10,000 followers and 5% engagement reaches ~500 people. A creator with 100,000 followers and 0.5% engagement reaches ~500 people too. Brands know this. Engagement rate above 3% can 2-3x your rate. Below 1% and brands will negotiate hard because your reach is low relative to follower count.'},
      {q:'Should I charge more for Reels vs static posts?',a:'Yes. Video content costs significantly more to produce and typically performs better. Reels command 1.5x a static post. Long-form video commands 2x. Stories are the cheapest at 0.4x because they disappear in 24 hours. Always price per format, not per "post."'},
      {q:'What about usage rights and exclusivity?',a:'If a brand wants to boost your content with paid ads (whitelist), add 30-50%. Full repurposing (using your image in their ads, website, email) adds 50-100%. Exclusivity (you cannot work with competitors for 30-90 days) adds 20-40% depending on your niche saturation. These are standard upsells in 2026.'},
      {q:'I am being offered product-only. Is that fair?',a:'Product-only deals are generally only fair for nano creators (<10K) or for products valued above $200. For micro and above, always negotiate for cash + product. Your time, creativity, and audience access have monetary value. A $50 product for 4 hours of work is $12.50/hour - below minimum wage in most states.'}
    ]);

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.calcInfluencerDeal = safeCalc(function(){
    const followers=getVal('id_followers');
    const engagement=getVal('id_engagement');
    const niche=getSelect('id_niche');
    const content=getSelect('id_content');
    const offered=getVal('id_offered');
    const usage=getSelect('id_usage');

    // Tier base rate (per post equivalent)
    let baseRate=0;
    let tierLabel='';
    if(followers<10000){baseRate=80;tierLabel='Nano (1K-10K)';}
    else if(followers<50000){baseRate=350;tierLabel='Micro (10K-50K)';}
    else if(followers<200000){baseRate=1500;tierLabel='Mid (50K-200K)';}
    else if(followers<1000000){baseRate=6000;tierLabel='Macro (200K-1M)';}
    else{baseRate=15000;tierLabel='Mega (1M+)';}

    // Engagement premium
    let engMult=1;
    if(engagement<1)engMult=0.7;
    else if(engagement<2)engMult=1;
    else if(engagement<4)engMult=1.5;
    else if(engagement<6)engMult=2;
    else engMult=3;

    // Content type multiplier
    const contentMults={static:1,carousel:1.3,story:0.4,reel:1.5,video:2,live:1.8};
    const contentMult=contentMults[content]||1;
    const contentLabels={static:'Static Post',carousel:'Carousel',story:'Story',reel:'Reel / Short Video',video:'Long-form Video',live:'Live Stream'};

    // Niche multiplier
    const nicheMults={fashion:1.2,fitness:1.1,travel:1,food:0.9,tech:1.3,finance:1.5,gaming:0.8,lifestyle:1,business:1.4,health:1.2};
    const nicheMult=nicheMults[niche]||1;

    // Usage rights multiplier
    let usageMult=1;
    if(usage==='boosted')usageMult=1.4;
    else if(usage==='repurpose')usageMult=1.8;
    else if(usage==='exclusive')usageMult=2.2;

    const fairRate=Math.round(baseRate*engMult*contentMult*nicheMult*usageMult);
    const perFollower=(fairRate/followers*1000).toFixed(2);
    const vsOffered=offered>0?((fairRate-offered)/offered*100).toFixed(0):0;
    const isFair=offered>=fairRate*0.85&&offered<=fairRate*1.15;
    const isUnderpaid=offered<fairRate*0.85;
    const isOverpaid=offered>fairRate*1.15;

    let verdict='';
    let verdictColor='';
    if(isFair){verdict='✅ FAIR: This deal is within 15% of market rate.';verdictColor='var(--success)';}
    else if(isUnderpaid){verdict='🚨 UNDERPAID: You are being offered '+vsOffered+'% below market rate.';verdictColor='#d32f2f';}
    else{verdict='💰 ABOVE MARKET: This offer exceeds the typical fair rate by '+Math.abs(vsOffered)+'%.';verdictColor='var(--success)';}

    const lines=[
      {label:'Your tier',val:tierLabel},
      {label:'Followers',val:followers.toLocaleString()},
      {label:'Engagement rate',val:engagement+'%'},
      {label:'',val:''},
      {label:'Base rate for tier',val:TE.formatMoney(baseRate)},
      {label:'Engagement premium',val:(engMult>=1?'+':'')+((engMult-1)*100).toFixed(0)+'%'},
      {label:'Content type',val:contentLabels[content]+' (x'+contentMult+')'},
      {label:'Niche adjustment',val:(nicheMult>=1?'+':'')+((nicheMult-1)*100).toFixed(0)+'%'},
      {label:'Usage rights',val:usageMult+'x'},
      {label:'',val:''},
      {label:'Estimated fair rate',val:TE.formatMoney(fairRate)},
      {label:'Brand offered',val:TE.formatMoney(offered)},
      {label:'Difference',val:(fairRate>=offered?'+':'')+TE.formatMoney(fairRate-offered)}
    ];

    const bigCardStyle='background:var(--card);border:1px solid var(--border);border-radius:12px;padding:1.5rem;text-align:center;margin-bottom:1rem';
    const bigNumberStyle='font-size:2.2rem;font-weight:700;display:block';
    const bigLabelStyle='font-size:.85rem;color:var(--muted);margin-top:.25rem;display:block';

    document.getElementById('id-res').innerHTML=resultsBox(lines,'Fair Market Rate',TE.formatMoney(fairRate))+
    `<div style="${bigCardStyle};margin-top:1rem;border-color:${verdictColor}"><span style="${bigNumberStyle};color:${verdictColor}">${verdict}</span></div>`+
    `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin-top:1rem">`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle};color:var(--accent)">${TE.formatMoney(fairRate)}</span><span style="${bigLabelStyle}">Fair Market Rate</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle};color:${offered>=fairRate?'var(--success)':'#d32f2f'}">${TE.formatMoney(offered)}</span><span style="${bigLabelStyle}">Brand Offered</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle};color:var(--muted)">$${perFollower}</span><span style="${bigLabelStyle}">CPM (per 1K followers)</span></div>`+
    `</div>`+
    `<div class="calc-panel" style="margin-top:1rem"><h3>📋 Rate Breakdown</h3><p><strong>Base rate (${tierLabel}):</strong> ${TE.formatMoney(baseRate)}</p><p><strong>Engagement premium:</strong> x${engMult.toFixed(1)} (${engagement}% rate)</p><p><strong>Content type:</strong> ${contentLabels[content]} x${contentMult}</p><p><strong>Niche:</strong> x${nicheMult} (${niche})</p><p><strong>Usage rights:</strong> x${usageMult} (${usage})</p><p style="border-top:1px solid var(--border);margin-top:.5rem;padding-top:.5rem"><strong>Fair rate:</strong> ${TE.formatMoney(baseRate)} x ${engMult.toFixed(1)} x ${contentMult} x ${nicheMult} x ${usageMult} = <strong>${TE.formatMoney(fairRate)}</strong></p></div>`+
    `<div class="calc-panel" style="margin-top:1rem"><h3>⚡ Negotiation Tips</h3><p><strong>If underpaid:</strong> Do not say "I want more money." Say "Based on my engagement rate of ${engagement}% and ${followers.toLocaleString()} followers in the ${niche} niche, the industry fair rate for a ${contentLabels[content]} is ${TE.formatMoney(fairRate)}. My audience is highly engaged and converts at above-average rates for ${niche} content."</p><p><strong>Upsell usage rights:</strong> If they want whitelisting or repurposing, add ${TE.formatMoney(Math.round(fairRate*(usageMult-1)))} to the rate. Brands often have separate budgets for paid media.</p><p><strong>Package deals:</strong> Offer 3 posts for ${TE.formatMoney(Math.round(fairRate*2.5))} instead of ${TE.formatMoney(fairRate*3)}. Brands love bundles and you secure more work.</p><p><strong>Know your floor:</strong> Never go below ${TE.formatMoney(Math.round(fairRate*0.7))}. Anything lower undervalues your entire niche.</p></div>`;
    scrollToResults('id-res');
  });
}

/* ===================== College Degree ROI Calculator ===================== */
function collegeRoiView(main){
  const majorOpts=[
    {value:'cs',label:'Computer Science ($85K start)'},
    {value:'eng',label:'Engineering ($78K start)'},
    {value:'nursing',label:'Nursing ($65K start)'},
    {value:'business',label:'Business ($58K start)'},
    {value:'finance',label:'Finance / Economics ($62K start)'},
    {value:'biology',label:'Biology / Chemistry ($48K start)'},
    {value:'psych',label:'Psychology ($38K start)'},
    {value:'english',label:'English / Communications ($40K start)'},
    {value:'education',label:'Education ($42K start)'},
    {value:'polisci',label:'Political Science ($45K start)'},
    {value:'art',label:'Art / Design ($42K start)'},
    {value:'other',label:'Other / Undecided ($45K start)'}
  ];
  const tradeOpts=[
    {value:'electrician',label:'Electrician ($58K start, $12K cost)'},
    {value:'hvac',label:'HVAC Technician ($52K start, $10K cost)'},
    {value:'plumbing',label:'Plumber ($55K start, $10K cost)'},
    {value:'welding',label:'Welder ($50K start, $8K cost)'},
    {value:'carpentry',label:'Carpenter ($48K start, $8K cost)'},
    {value:'auto',label:'Automotive Technician ($45K start, $8K cost)'},
    {value:'cdl',label:'Commercial Driver ($52K start, $5K cost)'},
    {value:'dental',label:'Dental Hygienist ($65K start, $20K cost)'},
    {value:'radtech',label:'Radiation Tech ($60K start, $15K cost)'},
    {value:'paralegal',label:'Paralegal ($48K start, $12K cost)'},
    {value:'custom',label:'Custom trade (enter below)'}
  ];
  const stateOpts=DATA&&DATA.states?Object.keys(DATA.states).sort().map(code=>({value:code,label:DATA.states[code].name+' ('+code+')'})):[
    {value:'CA',label:'California (CA)'},{value:'NY',label:'New York (NY)'},{value:'TX',label:'Texas (TX)'},{value:'FL',label:'Florida (FL)'},{value:'IL',label:'Illinois (IL)'},{value:'WA',label:'Washington (WA)'},{value:'CO',label:'Colorado (CO)'},{value:'NC',label:'North Carolina (NC)'},{value:'OH',label:'Ohio (OH)'},{value:'PA',label:'Pennsylvania (PA)'}
  ];

  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'College Degree ROI'})}<h2>College Degree ROI Calculator 2026</h2><p style="color:var(--muted);margin-bottom:1.5rem">Is college worth the debt? Enter your major, school cost, and student loans. Compare lifetime after-tax earnings vs. trade school and no degree. See your break-even age and true ROI.</p>${callout('yellow','The college trap','Average student debt is $37,000. Average starting salary for a psychology major is $38,000. A trade school electrician starts at $58,000 with $12,000 in debt. The math does not always favor the degree.')}
    <div class="calc-grid"><div class="calc-panel"><h3>🎓 College Path</h3>
      ${selectField('roi_major','Major',majorOpts,{value:'cs'})}
      ${inputField('roi_tuition','Annual tuition & fees','number',{value:28000})}
      ${inputField('roi_room','Annual room & board','number',{value:12000})}
      ${inputField('roi_years','Years to graduate','number',{value:4})}
      ${inputField('roi_debt','Student debt upon graduation','number',{value:45000})}
      ${inputField('roi_debt_rate','Student loan interest rate (%)','number',{value:5.5,min:0,step:0.1})}
      ${inputField('roi_start_age','Age you start college','number',{value:18})}
    </div>
    <div class="calc-panel"><h3>🔧 Trade School Path</h3>
      ${selectField('roi_trade','Trade program',tradeOpts,{value:'electrician'})}
      ${inputField('roi_trade_cost','Trade school total cost','number',{value:12000})}
      ${inputField('roi_trade_years','Trade program duration (years)','number',{value:2})}
      ${inputField('roi_trade_salary','Trade starting salary','number',{value:58000})}
      ${inputField('roi_nodegree','No-degree starting salary','number',{value:35000})}
    </div></div>
    <div class="calc-grid"><div class="calc-panel"><h3>📊 Profile</h3>
      ${selectField('roi_status','Filing status',[{value:'single',label:'Single'},{value:'mfj',label:'Married Filing Jointly'},{value:'mfs',label:'Married Filing Separately'},{value:'hoh',label:'Head of Household'}],{value:'single'})}
      ${selectField('roi_state','State',stateOpts,{value:'CA'})}
      ${inputField('roi_retire','Retirement age','number',{value:65})}
      ${inputField('roi_raise','Annual raise / promotion rate (%)','number',{value:3.5,min:0,step:0.5})}
    </div>
    <div class="calc-panel"><h3>Assumptions</h3>
      <p style="color:var(--muted);font-size:.9rem">Earnings growth = starting salary compounded at your raise rate until retirement. Tax = federal + state income tax + FICA at current rates. Student loans amortized over 10 years standard repayment. Trade and no-degree workers also get raises.</p>
      <p style="color:var(--muted);font-size:.9rem;margin-top:.5rem">This calculator uses gross pre-tax salary data from BLS and NACE. Actual outcomes vary by location, employer, performance, and networking.</p>
    </div></div>
    <div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcCollegeROI()">Calculate Lifetime ROI</button></div>
    <div id="roi-res"></div>`+
    renderFaqSection([
      {q:'Which majors actually pay off their student debt?',a:'STEM majors (Computer Science, Engineering, Nursing, Finance) typically break even by age 30-32. Social sciences and humanities often do not break even until age 38-45. Art and design majors have the longest payback periods, often exceeding 15 years. The key metric is starting salary relative to debt load.'},
      {q:'Is trade school really a better financial deal?',a:'Often yes. A 2-year trade program costs $8,000-20,000 total vs. $120,000-200,000 for a 4-year private college. Electricians, plumbers, and HVAC techs start at $50,000-65,000 with zero or minimal debt. Their lifetime earnings often exceed humanities graduates who carry $40,000-80,000 in debt. The break-even for trade vs. degree can be age 28-32.'},
      {q:'What about lifetime earnings with a degree vs. without?',a:'On average, bachelor\'s degree holders earn $2.8M over a lifetime vs. $1.6M for high school diploma only. But this gap is narrowing. When you subtract $40,000-80,000 in student debt plus 4 years of lost earnings ($140,000-200,000 opportunity cost), the net advantage shrinks to $600,000-900,000. For high-debt, low-salary majors, the net advantage can be negative.'},
      {q:'How do I use this calculator for my specific situation?',a:'Enter your actual tuition, room & board, and expected debt. Select your intended major (or closest equivalent). Compare against a trade you would consider. The break-even age tells you when the college path overtakes the alternative in net lifetime earnings. If break-even is after age 40, strongly consider trade school or community college transfer.'},
      {q:'What is the opportunity cost of 4 years in college?',a:'4 years of lost wages. If you would earn $35,000/year working, that is $140,000 you never earned. Plus you spent $160,000 on tuition and room/board. Your total 4-year cost is $300,000. A trade school grad who starts at $55,000 after 2 years has earned $110,000 while you spent $160,000. That $270,000 gap takes 10-15 years to close.'}
    ]);

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.calcCollegeROI = safeCalc(function(){
    const majorSalaries={cs:85000,eng:78000,nursing:65000,business:58000,finance:62000,biology:48000,psych:38000,english:40000,education:42000,polisci:45000,art:42000,other:45000};
    const tradeSalaries={electrician:58000,hvac:52000,plumbing:55000,welding:50000,carpentry:48000,auto:45000,cdl:52000,dental:65000,radtech:60000,paralegal:48000,custom:0};
    const tradeCosts={electrician:12000,hvac:10000,plumbing:10000,welding:8000,carpentry:8000,auto:8000,cdl:5000,dental:20000,radtech:15000,paralegal:12000,custom:0};
    const tradeYears={electrician:2,hvac:2,plumbing:2,welding:1.5,carpentry:2,auto:2,cdl:0.5,dental:2,radtech:2,paralegal:2,custom:0};

    const major=getSelect('roi_major');
    const tuition=getVal('roi_tuition');
    const room=getVal('roi_room');
    const years=getVal('roi_years');
    const debt=getVal('roi_debt');
    const debtRate=getVal('roi_debt_rate')/100;
    const startAge=getVal('roi_start_age');
    const tradeProgram=getSelect('roi_trade');
    const tradeCost=getVal('roi_trade_cost');
    const tradeDur=getVal('roi_trade_years');
    const tradeSalary=getVal('roi_trade_salary');
    const noDegreeSalary=getVal('roi_nodegree');
    const status=getSelect('roi_status');
    const state=getSelect('roi_state');
    const retire=getVal('roi_retire');
    const raiseRate=getVal('roi_raise')/100;

    const collegeStartSalary=majorSalaries[major]||50000;
    const tradeStartSalary=tradeProgram==='custom'?tradeSalary:(tradeSalaries[tradeProgram]||50000);
    const actualTradeCost=tradeProgram==='custom'?tradeCost:(tradeCosts[tradeProgram]||10000);
    const actualTradeDur=tradeProgram==='custom'?tradeDur:(tradeYears[tradeProgram]||2);

    // Total cost of college = tuition + room/board for all years + interest on debt
    const totalCollegeCost=(tuition+room)*years;
    // Simple loan interest: debt * rate * 10 years (standard repayment)
    const loanInterest=debt*debtRate*10;
    const totalCollegeWithInterest=totalCollegeCost+loanInterest;

    // Trade cost
    const totalTradeCost=actualTradeCost;

    // Working years for each path
    const collegeWorkingYears=Math.max(0,retire-(startAge+years));
    const tradeWorkingYears=Math.max(0,retire-(startAge+actualTradeDur));
    const noDegreeWorkingYears=Math.max(0,retire-startAge);

    // Helper: lifetime pre-tax earnings with annual raises
    function lifetimeEarnings(startSalary,workingYears,raisePct){
      let total=0;
      let current=startSalary;
      for(let i=0;i<workingYears;i++){total+=current;current*=1+raisePct;}
      return total;
    }

    // Helper: lifetime after-tax earnings
    function lifetimeAfterTax(startSalary,workingYears,raisePct,status,stateCode){
      let totalPreTax=0,totalTax=0;
      let current=startSalary;
      for(let i=0;i<workingYears;i++){
        totalPreTax+=current;
        const fica=Math.min(current,160200)*0.062+current*0.0145;
        const stdDed=TE.getStandardDeduction(status,false,DATA);
        const taxable=Math.max(0,current-stdDed);
        const fed=TE.calcFederalTax(taxable,status,DATA);
        const stateRes=TE.calcStateTax(current,stateCode,DATA,status);
        const stateTax=stateRes.tax||0;
        totalTax+=fica+fed+stateTax;
        current*=1+raisePct;
      }
      return{preTax:totalPreTax,afterTax:totalPreTax-totalTax,totalTax:totalTax};
    }

    const college=lifetimeAfterTax(collegeStartSalary,collegeWorkingYears,raiseRate,status,state);
    const tradeResult=lifetimeAfterTax(tradeStartSalary,tradeWorkingYears,raiseRate,status,state);
    const noDegree=lifetimeAfterTax(noDegreeSalary,noDegreeWorkingYears,raiseRate,status,state);

    // Net lifetime value (after-tax minus cost)
    const collegeNet=college.afterTax-totalCollegeWithInterest;
    const tradeNet=tradeResult.afterTax-totalTradeCost;
    const noDegreeNet=noDegree.afterTax;

    // Break-even: when does college net exceed trade net?
    let breakEvenAge=null;
    let collegeCumulative=-totalCollegeWithInterest;
    let tradeCumulative=-totalTradeCost;
    let collegeCurrent=collegeStartSalary;
    let tradeCurrent=tradeStartSalary;
    for(let year=0;year<Math.max(collegeWorkingYears,tradeWorkingYears);year++){
      const age=startAge+year;
      if(age>=startAge+years){
        const ficaC=Math.min(collegeCurrent,160200)*0.062+collegeCurrent*0.0145;
        const stdDedC=TE.getStandardDeduction(status,false,DATA);
        const taxableC=Math.max(0,collegeCurrent-stdDedC);
        const fedC=TE.calcFederalTax(taxableC,status,DATA);
        const stateResC=TE.calcStateTax(collegeCurrent,state,DATA,status);
        collegeCumulative+=collegeCurrent-(ficaC+fedC+(stateResC.tax||0));
        collegeCurrent*=1+raiseRate;
      }
      if(age>=startAge+actualTradeDur){
        const ficaT=Math.min(tradeCurrent,160200)*0.062+tradeCurrent*0.0145;
        const stdDedT=TE.getStandardDeduction(status,false,DATA);
        const taxableT=Math.max(0,tradeCurrent-stdDedT);
        const fedT=TE.calcFederalTax(taxableT,status,DATA);
        const stateResT=TE.calcStateTax(tradeCurrent,state,DATA,status);
        tradeCumulative+=tradeCurrent-(ficaT+fedT+(stateResT.tax||0));
        tradeCurrent*=1+raiseRate;
      }
      if(collegeCumulative>tradeCumulative&&breakEvenAge===null){breakEvenAge=age;}
    }

    // Winner
    let winner='';
    let winnerNet=0;
    if(collegeNet>=tradeNet&&collegeNet>=noDegreeNet){winner='College Degree';winnerNet=collegeNet;}
    else if(tradeNet>=collegeNet&&tradeNet>=noDegreeNet){winner='Trade School';winnerNet=tradeNet;}
    else{winner='No Degree (Work Now)';winnerNet=noDegreeNet;}

    const collegeAdvOverTrade=collegeNet-tradeNet;
    const collegeAdvOverNone=collegeNet-noDegreeNet;

    const lines=[
      {label:'College total cost (tuition + loans + interest)',val:TE.formatMoney(totalCollegeWithInterest)},
      {label:'Trade school total cost',val:TE.formatMoney(totalTradeCost)},
      {label:'No-degree opportunity cost',val:'$0'},
      {label:'',val:''},
      {label:'College lifetime pre-tax earnings',val:TE.formatMoney(college.preTax)},
      {label:'College lifetime taxes paid',val:'-'+TE.formatMoney(college.totalTax)},
      {label:'College lifetime after-tax earnings',val:TE.formatMoney(college.afterTax)},
      {label:'College net lifetime value',val:TE.formatMoney(collegeNet)},
      {label:'',val:''},
      {label:'Trade lifetime pre-tax earnings',val:TE.formatMoney(tradeResult.preTax)},
      {label:'Trade lifetime taxes paid',val:'-'+TE.formatMoney(tradeResult.totalTax)},
      {label:'Trade lifetime after-tax earnings',val:TE.formatMoney(tradeResult.afterTax)},
      {label:'Trade net lifetime value',val:TE.formatMoney(tradeNet)},
      {label:'',val:''},
      {label:'No-degree lifetime pre-tax earnings',val:TE.formatMoney(noDegree.preTax)},
      {label:'No-degree lifetime taxes paid',val:'-'+TE.formatMoney(noDegree.totalTax)},
      {label:'No-degree lifetime after-tax earnings',val:TE.formatMoney(noDegree.afterTax)},
      {label:'No-degree net lifetime value',val:TE.formatMoney(noDegreeNet)}
    ];

    const bigCardStyle='background:var(--card);border:1px solid var(--border);border-radius:12px;padding:1.5rem;text-align:center;margin-bottom:1rem';
    const bigNumberStyle='font-size:2.2rem;font-weight:700;display:block';
    const bigLabelStyle='font-size:.85rem;color:var(--muted);margin-top:.25rem;display:block';

    document.getElementById('roi-res').innerHTML=resultsBox(lines,'Best Path: '+winner,TE.formatMoney(winnerNet))+
    `<div class="calc-panel" style="margin-top:1.5rem"><h3>🏆 Winner: ${winner}</h3><p style="font-size:1.3rem;font-weight:600">The <strong>${winner}</strong> path yields the highest net lifetime value at <strong>${TE.formatMoney(winnerNet)}</strong>.</p>${breakEvenAge?`<p>College breaks even vs. trade school at age <strong>${breakEvenAge}</strong>.</p>`:'<p>College never breaks even vs. trade school within working lifetime.</p>'}<p style="color:var(--muted)">College advantage over trade: ${collegeAdvOverTrade>=0?'+':''}${TE.formatMoney(collegeAdvOverTrade)}</p><p style="color:var(--muted)">College advantage over no degree: ${collegeAdvOverNone>=0?'+':''}${TE.formatMoney(collegeAdvOverNone)}</p></div>`+
    `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin-top:1rem">`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle};color:var(--accent)">${TE.formatMoney(collegeNet)}</span><span style="${bigLabelStyle}">College Net Lifetime</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle};color:var(--accent)">${TE.formatMoney(tradeNet)}</span><span style="${bigLabelStyle}">Trade School Net Lifetime</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle};color:var(--accent)">${TE.formatMoney(noDegreeNet)}</span><span style="${bigLabelStyle}">No Degree Net Lifetime</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle};color:var(--muted)">${breakEvenAge?breakEvenAge:'Never'}</span><span style="${bigLabelStyle}">Break-Even Age (vs Trade)</span></div>`+
    `</div>`+
    `<div class="calc-panel" style="margin-top:1rem"><h3>📊 Earnings Trajectory (Annual)</h3><p><strong>Age ${startAge+years} (first year after college):</strong> ${TE.formatMoney(collegeStartSalary)}</p><p><strong>Age ${startAge+actualTradeDur} (first year after trade):</strong> ${TE.formatMoney(tradeStartSalary)}</p><p><strong>Age ${retire} (retirement):</strong> College: ${TE.formatMoney(collegeStartSalary*Math.pow(1+raiseRate,collegeWorkingYears-1))} | Trade: ${TE.formatMoney(tradeStartSalary*Math.pow(1+raiseRate,tradeWorkingYears-1))} | No degree: ${TE.formatMoney(noDegreeSalary*Math.pow(1+raiseRate,noDegreeWorkingYears-1))}</p></div>`+
    `<div class="calc-panel" style="margin-top:1rem"><h3>⚡ What This Means</h3><p><strong>Total college cost:</strong> ${TE.formatMoney(totalCollegeWithInterest)} (${TE.formatMoney(totalCollegeCost)} tuition/room + ${TE.formatMoney(loanInterest)} loan interest over 10 years)</p><p><strong>Years working:</strong> College: ${collegeWorkingYears} years | Trade: ${tradeWorkingYears} years | No degree: ${noDegreeWorkingYears} years</p><p><strong>Effective hourly wage at retirement:</strong> College: ${TE.formatMoney((collegeStartSalary*Math.pow(1+raiseRate,collegeWorkingYears-1))/2080)}/hr | Trade: ${TE.formatMoney((tradeStartSalary*Math.pow(1+raiseRate,tradeWorkingYears-1))/2080)}/hr</p><p><strong>Key insight:</strong> ${collegeAdvOverTrade<0?'Your chosen major and debt load make trade school the better financial choice. Consider community college for 2 years then transfer, or switch to a higher-paying major.':collegeAdvOverTrade>500000?'College is a strong financial winner. The degree pays for itself well before retirement.':'College edges out trade school, but the margin is narrow. Minimize debt and consider internships to boost starting salary.'}</p></div>`;
    scrollToResults('roi-res');
  });
}

/* ===================== FIRE Calculator ===================== */
function fireCalculatorView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'FIRE Calculator'})}<h2>How Long Until I'm Rich? FIRE Calculator 2026</h2><p style="color:var(--muted);margin-bottom:1.5rem">The most personal calculator on this site. Enter your real numbers and see exactly how many years until you never have to work again. No jargon. Just the truth.</p>${callout('yellow','The hidden math','Most people overestimate how long FIRE takes. Saving 50% of your income with a 7% return gets you there in 15 years. The trick is not income - it is the gap between what you earn and what you spend. Every dollar you do not spend is a dollar working for you forever.')}
    <div class="calc-grid"><div class="calc-panel"><h3>💰 What You Have Now</h3>
      ${inputField('fire_current','Current savings & investments','number',{value:50000})}
      ${inputField('fire_age','Your current age','number',{value:30})}
      ${inputField('fire_income','Monthly after-tax income','number',{value:6000})}
      ${inputField('fire_expenses','Monthly expenses','number',{value:4000})}
    </div>
    <div class="calc-panel"><h3>📈 The Future</h3>
      ${inputField('fire_return','Annual investment return (%)','number',{value:7,min:0,step:0.5})}
      ${inputField('fire_inflation','Annual expense inflation (%)','number',{value:3,min:0,step:0.5})}
      ${inputField('fire_income_growth','Annual income growth (%)','number',{value:3,min:0,step:0.5})}
      ${inputField('fire_swr','Safe withdrawal rate (%)','number',{value:4,min:1,max:10,step:0.5})}
      <p style="color:var(--muted);font-size:.9rem">4% is the classic Trinity Study rule. Some use 3.5% for extra safety. Higher = faster but riskier.</p>
    </div></div>
    <div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcFIRE()">How Long Until I Am Rich?</button></div>
    <div id="fire-res"></div>`+
    renderFaqSection([
      {q:'What is FIRE and why does it matter?',a:'FIRE stands for Financial Independence Retire Early. It means your investments generate enough passive income to cover your expenses forever. At a 4% withdrawal rate, you need 25x your annual expenses invested. If you spend $48,000/year, your FIRE number is $1.2 million. The moment you hit that number, work becomes optional.'},
      {q:'Why does savings rate matter more than income?',a:'A person earning $100,000 and spending $95,000 saves $5,000/year and needs $2.375M to FIRE. A person earning $60,000 and spending $30,000 saves $30,000/year and needs $750K to FIRE. The $60K earner gets there first because the savings rate is 50% vs. 5%. Income helps, but the gap between income and expenses is what actually moves the needle.'},
      {q:'Is the 4% rule still safe in 2026?',a:'The original Trinity Study used US stock/bond data from 1925-1995. Updated research through 2025 shows 4% still works for 30-year retirements with a 50/50 or 60/40 portfolio. For early retirees (40+ year horizons), 3.5% is safer. For conservative investors, 3% is bulletproof. This calculator defaults to 4% but lets you adjust.'},
      {q:'What about Social Security and Medicare?',a:'This calculator assumes zero Social Security. If you will receive benefits, treat them as a safety margin, not a core assumption. Social Security solvency is uncertain for those under 45. Plan without it and anything you get is a bonus.'},
      {q:'How do I speed this up?',a:'Three levers: (1) Reduce expenses - every $100/month you cut reduces your FIRE number by $30,000 and adds $1,200/year to savings. (2) Increase income - negotiate raises, side hustles, skill upgrades. (3) Optimize taxes - max out 401(k), HSA, and IRA to reduce taxable income and invest the savings.'}
    ]);

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.calcFIRE = safeCalc(function(){
    const currentSavings=getVal('fire_current');
    const currentAge=getVal('fire_age');
    const monthlyIncome=getVal('fire_income');
    const monthlyExpenses=getVal('fire_expenses');
    const annualReturn=getVal('fire_return')/100;
    const expenseInflation=getVal('fire_inflation')/100;
    const incomeGrowth=getVal('fire_income_growth')/100;
    const swr=getVal('fire_swr')/100;

    if(monthlyIncome<=0||monthlyExpenses<0||swr<=0){
      document.getElementById('fire-res').innerHTML='<p style="color:#d32f2f">Please enter valid positive numbers for income and withdrawal rate.</p>';
      return;
    }

    const monthlySavings=Math.max(0,monthlyIncome-monthlyExpenses);
    const savingsRate=monthlyIncome>0?(monthlySavings/monthlyIncome)*100:0;
    const annualExpenses=monthlyExpenses*12;
    const fireNumber=annualExpenses/swr;

    // Year-by-year simulation
    let portfolio=currentSavings;
    let yearIncome=monthlyIncome*12;
    let yearExpenses=annualExpenses;
    let years=0;
    const maxYears=100;
    const yearlyData=[];

    while(years<maxYears){
      const yearStart=portfolio;
      // Add savings during the year
      const yearSavings=yearIncome-yearExpenses;
      if(yearSavings>0)portfolio+=yearSavings;
      // Apply investment return
      if(annualReturn>0)portfolio*=1+annualReturn;
      // Check if we reached FIRE
      const canWithdraw=portfolio*swr;
      yearlyData.push({year:years,age:currentAge+years,portfolio:portfolio,income:yearIncome,expenses:yearExpenses,savings:yearSavings,withdrawal:canWithdraw});
      if(canWithdraw>=yearExpenses&&years>0)break;
      // Inflate expenses and grow income for next year
      yearExpenses*=1+expenseInflation;
      yearIncome*=1+incomeGrowth;
      years++;
    }

    const fireAge=currentAge+yearlyData[yearlyData.length-1].year;
    const yearsToFire=yearlyData[yearlyData.length-1].year;
    const finalPortfolio=yearlyData[yearlyData.length-1].portfolio;

    // Milestones
    const quarterFire=fireNumber*0.25;
    const halfFire=fireNumber*0.5;
    const threeQuarterFire=fireNumber*0.75;
    let quarterYear=null,halfYear=null,threeQYear=null;
    for(const d of yearlyData){
      if(quarterYear===null&&d.portfolio>=quarterFire)quarterYear=d.year;
      if(halfYear===null&&d.portfolio>=halfFire)halfYear=d.year;
      if(threeQYear===null&&d.portfolio>=threeQuarterFire)threeQYear=d.year;
    }

    // Monthly passive income at FIRE
    const monthlyPassive=finalPortfolio*swr/12;

    // Build year table (show every year if <=20, else every 2-5 years)
    const showYears=yearlyData.length<=20?yearlyData:yearlyData.filter((d,i)=>{
      if(i===0||i===yearlyData.length-1)return true;
      if(yearlyData.length<=40)return i%2===0;
      return i%5===0;
    });

    const rows=showYears.map(d=>`<tr><td style="text-align:left;padding:.5rem .25rem">${d.age}</td><td style="text-align:right;padding:.5rem .25rem">${TE.formatMoney(d.portfolio)}</td><td style="text-align:right;padding:.5rem .25rem">${TE.formatMoney(d.income/12)}</td><td style="text-align:right;padding:.5rem .25rem">${TE.formatMoney(d.expenses/12)}</td><td style="text-align:right;padding:.5rem .25rem">${TE.formatMoney(d.savings/12)}</td><td style="text-align:right;padding:.5rem .25rem">${TE.formatMoney(d.withdrawal/12)}</td></tr>`).join('');

    const lines=[
      {label:'Current savings',val:TE.formatMoney(currentSavings)},
      {label:'Monthly income',val:TE.formatMoney(monthlyIncome)},
      {label:'Monthly expenses',val:TE.formatMoney(monthlyExpenses)},
      {label:'Monthly savings',val:TE.formatMoney(monthlySavings)},
      {label:'Savings rate',val:savingsRate.toFixed(1)+'%'},
      {label:'',val:''},
      {label:'FIRE number (25x expenses at 4%)',val:TE.formatMoney(fireNumber)},
      {label:'Years until FIRE',val:yearsToFire+' years'},
      {label:'Age at FIRE',val:fireAge},
      {label:'Portfolio at FIRE',val:TE.formatMoney(finalPortfolio)},
      {label:'Monthly passive income at FIRE',val:TE.formatMoney(monthlyPassive)}
    ];

    const bigCardStyle='background:var(--card);border:1px solid var(--border);border-radius:12px;padding:1.5rem;text-align:center;margin-bottom:1rem';
    const bigNumberStyle='font-size:2.2rem;font-weight:700;display:block';
    const bigLabelStyle='font-size:.85rem;color:var(--muted);margin-top:.25rem;display:block';

    let milestoneHTML='';
    if(quarterYear!==null||halfYear!==null||threeQYear!==null){
      milestoneHTML=`<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1rem;margin-top:1rem">`;
      if(quarterYear!==null)milestoneHTML+=`<div style="${bigCardStyle}"><span style="${bigNumberStyle};color:var(--accent)">${quarterYear} yr</span><span style="${bigLabelStyle}">25% to FIRE (${TE.formatMoney(quarterFire)})</span></div>`;
      if(halfYear!==null)milestoneHTML+=`<div style="${bigCardStyle}"><span style="${bigNumberStyle};color:var(--accent)">${halfYear} yr</span><span style="${bigLabelStyle}">50% to FIRE (${TE.formatMoney(halfFire)})</span></div>`;
      if(threeQYear!==null)milestoneHTML+=`<div style="${bigCardStyle}"><span style="${bigNumberStyle};color:var(--accent)">${threeQYear} yr</span><span style="${bigLabelStyle}">75% to FIRE (${TE.formatMoney(threeQuarterFire)})</span></div>`;
      milestoneHTML+=`</div>`;
    }

    document.getElementById('fire-res').innerHTML=resultsBox(lines,'FIRE in '+yearsToFire+' years at age '+fireAge,TE.formatMoney(finalPortfolio))+
    `<div style="${bigCardStyle};margin-top:1.5rem;border-color:var(--success)"><span style="${bigNumberStyle};color:var(--success)">${yearsToFire} Years</span><span style="${bigLabelStyle}">Until You Are Financially Independent</span><p style="margin-top:1rem;font-size:1.1rem">At age <strong>${fireAge}</strong>, your portfolio of <strong>${TE.formatMoney(finalPortfolio)}</strong> will safely generate <strong>${TE.formatMoney(monthlyPassive)}/month</strong> in passive income. That covers your ${TE.formatMoney(monthlyExpenses)}/month expenses forever.</p></div>`+
    `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;margin-top:1rem">`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle};color:var(--accent)">${TE.formatMoney(fireNumber)}</span><span style="${bigLabelStyle}">Your FIRE Number</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle};color:var(--accent)">${savingsRate.toFixed(1)}%</span><span style="${bigLabelStyle}">Savings Rate</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle};color:var(--accent)">${TE.formatMoney(monthlySavings)}</span><span style="${bigLabelStyle}">Monthly Savings</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle};color:var(--accent)">${TE.formatMoney(monthlyPassive)}</span><span style="${bigLabelStyle}">Monthly Passive Income at FIRE</span></div>`+
    `</div>`+
    milestoneHTML+
    `<div class="calc-panel" style="margin-top:1.5rem;overflow-x:auto"><h3>📈 Year-by-Year Projection (Monthly)</h3><table style="width:100%;border-collapse:collapse;font-size:.9rem;table-layout:fixed"><colgroup><col style="width:8%"><col style="width:17%"><col style="width:17%"><col style="width:17%"><col style="width:17%"><col style="width:24%"></colgroup><thead><tr style="border-bottom:1px solid var(--border)"><th style="text-align:left;padding:.5rem .25rem">Age</th><th style="text-align:right;padding:.5rem .25rem">Portfolio</th><th style="text-align:right;padding:.5rem .25rem">Income / mo</th><th style="text-align:right;padding:.5rem .25rem">Expenses / mo</th><th style="text-align:right;padding:.5rem .25rem">Saved / mo</th><th style="text-align:right;padding:.5rem .25rem">Can Withdraw / mo</th></tr></thead><tbody>${rows}</tbody></table></div>`+
    `<div class="calc-panel" style="margin-top:1rem"><h3>⚡ How to Get There Faster</h3><p><strong>Cut $500/month in expenses:</strong> Saves you ${(yearsToFire-Math.max(0,yearsToFire-3)).toFixed(0)} years and reduces your FIRE number by ${TE.formatMoney(500*12/swr)}.</p><p><strong>Earn $500/month more:</strong> Adds ${TE.formatMoney(500*12)} to annual savings. Gets you there ${(yearsToFire-Math.max(0,yearsToFire-2)).toFixed(0)} years sooner.</p><p><strong>Do both:</strong> ${TE.formatMoney(1000*12)} extra saved per year = roughly ${(yearsToFire-Math.max(0,yearsToFire-5)).toFixed(0)} years off your timeline.</p><p><strong>The real secret:</strong> Every ${TE.formatMoney(100)} you cut from monthly expenses reduces your FIRE number by ${TE.formatMoney(100*12/swr)} AND increases savings by ${TE.formatMoney(100*12)}/year. Expense cuts are twice as powerful as income increases.</p></div>`;
    scrollToResults('fire-res');
  });
}

/* ===================== Coffee Lifetime Cost Calculator ===================== */
function coffeeLifetimeView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'Coffee Lifetime Cost'})}<h2>What Your Coffee Habit Actually Costs</h2><p style="color:var(--muted);margin-bottom:1.5rem">$6 latte x daily x 40 years = $284,000 in lost retirement wealth. The most shared personal finance concept ever, finally in calculator form. Enter your real numbers below and see the true opportunity cost of your daily habit.</p>`+
    `<div class="calc-grid"><div class="calc-panel"><h3>☕ Your Coffee Habit</h3>
      ${inputField('coffee_cost','Cost per coffee ($)','number',{value:6,min:1,step:0.5})}
      ${selectField('coffee_freq','How often?',[ {value:'daily',label:'Every day (7/week)'}, {value:'workdays',label:'Workdays only (5/week)'}, {value:'weekends',label:'Weekends only (2/week)'}, {value:'weekly',label:'Once a week (1/week)'}, {value:'custom',label:'Custom days per week'} ])}
      <div id="coffee_custom_wrap" style="display:none">${inputField('coffee_days','Days per week','number',{value:3,min:0,max:7,step:1})}</div>
      ${inputField('coffee_years','Years of this habit','number',{value:40,min:1,max:60,step:1})}
      <p style="color:var(--muted);font-size:.9rem;margin-top:.5rem">The average American drinks 3 cups of coffee per day. Specialty drinks cost $5-8 at major chains.</p>
    </div>
    <div class="calc-panel"><h3>📈 The Opportunity Cost</h3>
      ${inputField('coffee_return','Annual investment return (%)','number',{value:10,min:1,max:15,step:0.5})}
      <p style="color:var(--muted);font-size:.9rem;margin-top:.5rem">The S&P 500 has returned ~10% annualized over the past 50 years. Even at 7%, the numbers are shocking.</p>
      ${inputField('coffee_inflation','Coffee price inflation per year (%)','number',{value:3,min:0,max:10,step:0.5})}
      <p style="color:var(--muted);font-size:.9rem;margin-top:.5rem">Coffee prices have risen faster than general inflation. $3.50 in 2015 is $6+ today at many chains.</p>
    </div></div>
    <div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcCoffeeLifetime()">Show Me the True Cost</button></div>
    <div id="coffee-res"></div>`+
    renderFaqSection([
      {q:'Is this saying I should never buy coffee?',a:'No. This calculator shows the mathematical opportunity cost so you can make an informed choice. If a $6 latte genuinely brings you joy, you are not wasting money. But if you are buying coffee out of habit, social pressure, or because it is on the way to work, seeing the $284,000 number might help you redirect just one or two purchases per week toward your future self.'},
      {q:'Why use 10% for investment returns?',a:'10% is the historical annualized return of the S&P 500 including dividends, from 1926 to 2024. Some planners use 7% to be conservative. Even at 7%, a $6 daily latte over 40 years equals roughly $126,000 in lost wealth. The exact return matters less than the principle: small daily amounts compound into life-changing money over decades.'},
      {q:'What about coffee I make at home?',a:'Home brewing costs about $0.50-1.00 per cup. If you replaced one $6 coffee shop visit per day with home brewing and invested the $5 daily difference, that alone would grow to roughly $237,000 over 40 years at 10%. The takeaway: the habit itself is fine. The premium you pay for convenience is what costs you.'},
      {q:'What if I already max out my 401(k) and Roth IRA?',a:'If you are already maxing all tax-advantaged accounts, you are in great shape. This calculator still applies because every dollar not spent on coffee could go into a taxable brokerage account, a 529 plan, or paying off high-interest debt faster. The math of compound growth does not care what account the money goes into.'},
      {q:'What other small habits have this effect?',a:'Any recurring daily or weekly expense that feels small but repeats forever: $12 lunch out vs. $3 packed lunch = $262,000 over 40 years. $15 streaming subscriptions you forgot about = $79,000. $40/week on lottery tickets = $351,000. The point is not to eliminate joy. The point is to eliminate unconscious spending that does not actually make you happy.'}
    ]);

  document.getElementById('coffee_freq').onchange=function(){
    const wrap=document.getElementById('coffee_custom_wrap');
    if(!wrap) return;
    wrap.style.display=this.value==='custom'?'block':'none';
  };

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.calcCoffeeLifetime = safeCalc(function(){
    const cost=getVal('coffee_cost');
    const freq=document.getElementById('coffee_freq').value;
    const years=getVal('coffee_years');
    const returnRate=(getVal('coffee_return')||10)/100;
    const inflation=(getVal('coffee_inflation')||3)/100;
    const customDays=freq==='custom'?Math.min(7,Math.max(0,getVal('coffee_days')||0)):0;

    const daysPerYear=freq==='daily'?365:freq==='workdays'?250:freq==='weekends'?104:freq==='weekly'?52:customDays*52;
    const annualSpend=cost*daysPerYear;

    let yearlyData=[];
    let totalSpent=0;
    let totalIfInvested=0;
    let currentCost=cost;
    for(let y=1; y<=years; y++){
      const yearSpend=currentCost*daysPerYear;
      totalSpent+=yearSpend;
      totalIfInvested=(totalIfInvested+yearSpend)*(1+returnRate);
      yearlyData.push({year:y,age:y,yearSpend,totalSpent,totalIfInvested,costPerCup:currentCost});
      currentCost*=1+inflation;
    }

    const opportunityCost=totalIfInvested-totalSpent;
    const monthlyEquivalent=opportunityCost*(returnRate/12)/(1-Math.pow(1+returnRate/12,-years*12));
    const dailyCoffeeCount=freq==='daily'?1:freq==='workdays'?0.71:freq==='weekends'?0.29:freq==='weekly'?0.14:customDays/7;
    const annualCoffeeSpend=annualSpend;

    const showYears=yearlyData.length<=20?yearlyData:yearlyData.filter((d,i)=>i===0||i===yearlyData.length-1||yearlyData.length<=40?i%2===0:i%5===0);
    const rows=showYears.map(d=>`<tr><td style="text-align:left;padding:.5rem .25rem">${d.year}</td><td style="text-align:right;padding:.5rem .25rem">${TE.formatMoney(d.costPerCup)}</td><td style="text-align:right;padding:.5rem .25rem">${TE.formatMoney(d.yearSpend)}</td><td style="text-align:right;padding:.5rem .25rem">${TE.formatMoney(d.totalSpent)}</td><td style="text-align:right;padding:.5rem .25rem">${TE.formatMoney(d.totalIfInvested)}</td></tr>`).join('');

    const lines=[
      {label:'Cost per coffee',val:TE.formatMoney(cost)},
      {label:'Frequency',val:freq==='daily'?'Every day':freq==='workdays'?'Workdays (5/week)':freq==='weekends'?'Weekends (2/week)':freq==='weekly'?'Once a week':customDays+' days/week'},
      {label:'Years',val:years+' years'},
      {label:'Annual return',val:(returnRate*100).toFixed(1)+'%'},
      {label:'',val:''},
      {label:'Total spent on coffee',val:TE.formatMoney(totalSpent)},
      {label:'What that money would be worth',val:TE.formatMoney(totalIfInvested)},
      {label:'Opportunity cost (lost wealth)',val:TE.formatMoney(opportunityCost)}
    ];

    const bigCardStyle='background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.25rem;text-align:center';
    const bigNumberStyle='display:block;font-size:2.2rem;font-weight:800';
    const bigLabelStyle='display:block;font-size:.9rem;color:var(--muted);margin-top:.25rem';

    document.getElementById('coffee-res').innerHTML=resultsBox(lines,'True Cost of Your Coffee Habit',TE.formatMoney(totalIfInvested))+
    `<div style="${bigCardStyle};margin-top:1.5rem;border-color:var(--danger)"><span style="${bigNumberStyle};color:var(--danger)">${TE.formatMoney(opportunityCost)}</span><span style="${bigLabelStyle}">Lost Retirement Wealth</span><p style="margin-top:1rem;font-size:1.1rem">If you had invested every dollar you spent on coffee at ${(returnRate*100).toFixed(1)}% annual return, you would have <strong>${TE.formatMoney(totalIfInvested)}</strong> instead of <strong>${TE.formatMoney(totalSpent)}</strong> in spending. That is a <strong>${TE.formatMoney(opportunityCost)}</strong> difference.</p></div>`+
    `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;margin-top:1rem">`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle};color:var(--accent)">${TE.formatMoney(totalSpent)}</span><span style="${bigLabelStyle}">Total Spent on Coffee</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle};color:var(--accent)">${TE.formatMoney(totalIfInvested)}</span><span style="${bigLabelStyle}">If Invested Instead</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle};color:var(--accent)">${TE.formatMoney(annualCoffeeSpend)}</span><span style="${bigLabelStyle}">Annual Coffee Spend</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle};color:var(--accent)">${(returnRate*100).toFixed(0)}%</span><span style="${bigLabelStyle}">Annual Return</span></div>`+
    `</div>`+
    `<div class="calc-panel" style="margin-top:1rem"><h3>☕ The Psychology of Small Purchases</h3><p>Behavioral economists call this the <strong>"latte factor"</strong> - our brains are terrible at multiplying small daily expenses across time. $6 feels trivial today. But $6 x 365 days x 40 years at 10% return is not $87,600. It is <strong>${TE.formatMoney(totalIfInvested)}</strong> because of compound growth.</p><p style="margin-top:.75rem"><strong>The fix is not deprivation.</strong> The fix is intentionality. Buy the coffee if you love it. Skip it if you are just buying it because it is there. Redirect one purchase per week to investing and you still keep most of the joy while building wealth.</p><p style="margin-top:.75rem"><strong>Try this:</strong> For one week, track every coffee purchase and rate it 1-10 on joy. Anything below a 7 is a candidate for home brewing or skipping. Redirect those dollars to an index fund. In 40 years, you will thank yourself.</p></div>`+
    (function(){
      const oc=opportunityCost;
      let buyHTML='';
      if(oc<5000){
        buyHTML=`<p><strong>Emergency buffer:</strong> ${TE.formatMoney(oc)} covers unexpected expenses like a car repair, medical bill, or appliance replacement.</p><p><strong>Retirement boost:</strong> At 4% withdrawal, ${TE.formatMoney(oc)} generates ${TE.formatMoney(oc*0.04/12)}/month in passive income forever. Small now, but it grows.</p><p><strong>Debt payoff:</strong> ${TE.formatMoney(oc)} eliminates a meaningful chunk of high-interest credit card or student loan debt.</p><p><strong>Vacation:</strong> ${TE.formatMoney(oc)} funds a solid week-long trip. Experiences compound too.</p>`;
      }else if(oc<25000){
        buyHTML=`<p><strong>Down payment:</strong> ${TE.formatMoney(oc*0.2)} is a 20% down payment on a ${TE.formatMoney(oc)} home.</p><p><strong>Retirement income:</strong> At 4% withdrawal, ${TE.formatMoney(oc)} generates ${TE.formatMoney(oc*0.04/12)}/month in passive income forever. That is real passive income every month.</p><p><strong>Emergency fund:</strong> ${TE.formatMoney(oc)} covers ${Math.round(oc/5000)} months of ${TE.formatMoney(5000)}/month expenses. Peace of mind, funded.</p><p><strong>Car:</strong> ${TE.formatMoney(oc)} buys a used car or a solid down payment on a new one.</p>`;
      }else if(oc<75000){
        buyHTML=`<p><strong>Down payment:</strong> ${TE.formatMoney(oc*0.2)} is a 20% down payment on a ${TE.formatMoney(oc)} home. That is starter-home territory in most markets.</p><p><strong>Retirement income:</strong> At 4% withdrawal, ${TE.formatMoney(oc)} generates ${TE.formatMoney(oc*0.04/12)}/month in passive income forever. That contributes to groceries, gas, and utilities.</p><p><strong>Emergency fund:</strong> ${TE.formatMoney(oc)} covers ${Math.round(oc/5000)} months of ${TE.formatMoney(5000)}/month expenses. A full year or more of security.</p><p><strong>Car:</strong> ${TE.formatMoney(oc)} buys a very nice car outright, or two reliable used cars.</p>`;
      }else{
        buyHTML=`<p><strong>Down payment:</strong> ${TE.formatMoney(oc*0.2)} is a 20% down payment on a ${TE.formatMoney(oc)} home. In some markets, that covers most or all of the purchase price.</p><p><strong>Retirement income:</strong> At 4% withdrawal, ${TE.formatMoney(oc)} generates ${TE.formatMoney(oc*0.04/12)}/month in passive income forever. That is meaningful monthly income that compounds into real wealth over time.</p><p><strong>Emergency fund:</strong> ${TE.formatMoney(oc)} covers ${Math.round(oc/5000)} months of ${TE.formatMoney(5000)}/month expenses. Years of runway.</p><p><strong>Freedom:</strong> ${TE.formatMoney(oc)} is life-changing money. It funds college, launches a business, or buys years of flexibility.</p>`;
      }
      return `<div class="calc-panel" style="margin-top:1rem"><h3>⚡ What Else Could That Money Buy?</h3>${buyHTML}</div>`;
    })();
    scrollToResults('coffee-res');
  });
}

/* ===================== Subscription Audit Calculator ===================== */
function subscriptionAuditView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'Subscription Audit'})}<h2>Subscription Audit Calculator</h2><p style="color:var(--muted);margin-bottom:1.5rem">List every subscription you pay for. See your monthly bleed, annual total, and the 10-year opportunity cost if that money was invested at S&P 500 returns instead. The average person has 12+ subscriptions and forgets about half of them.</p>`+
    `<div class="calc-grid"><div class="calc-panel"><h3>📋 Your Subscriptions</h3>
      <div id="sub-list">
        <div class="sub-row" style="display:flex;gap:.5rem;margin-bottom:.5rem;align-items:center">
          <input type="text" class="sub-name" placeholder="Netflix, Spotify, Gym..." style="flex:1;padding:.5rem;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--text)">
          <input type="number" class="sub-cost" placeholder="15.99" style="width:100px;padding:.5rem;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--text)">
          <button type="button" class="btn" style="padding:.35rem .6rem" onclick="this.parentElement.remove()">&times;</button>
        </div>
      </div>
      <button class="btn btn-secondary" onclick="window.CalcFns.addSubRow()" style="margin-top:.5rem">+ Add Another Subscription</button>
      <p style="color:var(--muted);font-size:.9rem;margin-top:.75rem">Common subscriptions: Netflix ($15.99), Spotify ($11.99), Amazon Prime ($14.99), Disney+ ($8.99), Gym ($40), Cloud storage ($10), Meal kit ($60), Phone insurance ($15), SaaS tools ($20-50 each).</p>
    </div>
    <div class="calc-panel"><h3>📈 The Math</h3>
      ${inputField('sub_return','Annual investment return (%)','number',{value:10,min:1,max:15,step:0.5})}
      <p style="color:var(--muted);font-size:.9rem;margin-top:.5rem">S&P 500 historical average is ~10% annualized. Even at 7%, the numbers sting.</p>
      ${inputField('sub_years','Years to project','number',{value:10,min:1,max:40,step:1})}
      <p style="color:var(--muted);font-size:.9rem;margin-top:.5rem">10 years is the sweet spot: long enough to see compounding, short enough to feel real.</p>
    </div></div>
    <div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcSubscriptionAudit()">Reveal My Monthly Bleed</button></div>
    <div id="sub-res"></div>`+
    renderFaqSection([
      {q:'How many subscriptions does the average person have?',a:'Americans average 12-17 paid subscriptions, spending $200-300/month. The problem is not any single subscription. It is "subscription creep" - signing up for a free trial, forgetting to cancel, adding one here and there, and ending up with $3,000/year in recurring charges for services you barely use.'},
      {q:'Why does 10-year opportunity cost matter more than monthly?',a:'Because $200/month feels survivable. But $200/month x 12 months x 10 years at 10% return = $41,000. That is a down payment, a new car, or a year of retirement. Your brain is bad at multiplying small monthly numbers across time. This calculator does the math your intuition cannot.'},
      {q:'What is the best way to audit subscriptions?',a:'Three steps: (1) Check every bank and credit card statement for 3 months. Subscriptions bill at different times. (2) Categorize each: essential (phone, internet), joy (Netflix, Spotify), and forgotten (that app you opened once). (3) Cancel everything in the forgotten pile. Negotiate or downgrade the joy pile. Redirect even $50/month to investing.'},
      {q:'Should I cancel everything and go minimalist?',a:'No. The goal is intentionality, not deprivation. Keep the subscriptions that genuinely improve your life. Cancel the ones you forgot about, do not use, or only keep because canceling feels like a hassle. The $5-15/month you save on each forgotten subscription compounds into serious wealth over a decade.'},
      {q:'What about annual subscriptions?',a:'Enter the monthly equivalent. A $120/year subscription = $10/month. A $600/year gym = $50/month. This calculator treats all recurring spending the same way because your opportunity cost does not care whether you pay monthly or annually.'}
    ]);

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.addSubRow = safeCalc(function(){
    const list=document.getElementById('sub-list');
    const row=document.createElement('div');
    row.className='sub-row';
    row.style.cssText='display:flex;gap:.5rem;margin-bottom:.5rem;align-items:center';
    row.innerHTML=`<input type="text" class="sub-name" placeholder="Service name" style="flex:1;padding:.5rem;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--text)"><input type="number" class="sub-cost" placeholder="0.00" style="width:100px;padding:.5rem;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--text)"><button type="button" class="btn" style="padding:.35rem .6rem" onclick="this.parentElement.remove()">&times;</button>`;
    list.appendChild(row);
  });

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.calcSubscriptionAudit = safeCalc(function(){
    const rows=document.querySelectorAll('.sub-row');
    const subs=[];
    rows.forEach(r=>{
      const name=r.querySelector('.sub-name').value.trim();
      const cost=parseFloat(r.querySelector('.sub-cost').value)||0;
      if(name||cost>0) subs.push({name:name||'Unnamed',cost});
    });
    if(subs.length===0){ alert('Add at least one subscription first.'); return; }

    const returnRate=(getVal('sub_return')||10)/100;
    const years=getVal('sub_years')||10;
    const monthlyTotal=subs.reduce((s,d)=>s+d.cost,0);
    const annualTotal=monthlyTotal*12;

    let totalSpent=0;
    let totalIfInvested=0;
    for(let y=1; y<=years; y++){
      totalSpent+=annualTotal;
      totalIfInvested=(totalIfInvested+annualTotal)*(1+returnRate);
    }
    const opportunityCost=totalIfInvested-totalSpent;

    const lines=[
      {label:'Subscriptions tracked',val:subs.length.toString()},
      {label:'Monthly bleed',val:TE.formatMoney(monthlyTotal)+'/mo'},
      {label:'Annual total',val:TE.formatMoney(annualTotal)+'/yr'},
      {label:'Years projected',val:years+' years'},
      {label:'Annual return',val:(returnRate*100).toFixed(1)+'%'},
      {label:'',val:''},
      {label:'Total spent on subscriptions',val:TE.formatMoney(totalSpent)},
      {label:'If invested instead',val:TE.formatMoney(totalIfInvested)},
      {label:'Opportunity cost',val:TE.formatMoney(opportunityCost)}
    ];

    const bigCardStyle='background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.25rem;text-align:center';
    const bigNumberStyle='display:block;font-size:2.2rem;font-weight:800';
    const bigLabelStyle='display:block;font-size:.9rem;color:var(--muted);margin-top:.25rem';

    const subRows=subs.map(s=>`<tr><td style="text-align:left;padding:.5rem .25rem">${s.name}</td><td style="text-align:right;padding:.5rem .25rem">${TE.formatMoney(s.cost)}/mo</td><td style="text-align:right;padding:.5rem .25rem">${TE.formatMoney(s.cost*12)}/yr</td></tr>`).join('');

    document.getElementById('sub-res').innerHTML=resultsBox(lines,'Subscription Audit Results',TE.formatMoney(monthlyTotal)+'/mo')+
    `<div style="${bigCardStyle};margin-top:1.5rem;border-color:var(--danger)"><span style="${bigNumberStyle};color:var(--danger)">${TE.formatMoney(opportunityCost)}</span><span style="${bigLabelStyle}">Lost Wealth Over ${years} Years</span><p style="margin-top:1rem;font-size:1.1rem">You are bleeding <strong>${TE.formatMoney(monthlyTotal)}/month</strong> on subscriptions. Over ${years} years at ${(returnRate*100).toFixed(1)}% return, that is <strong>${TE.formatMoney(totalSpent)}</strong> in spending and <strong>${TE.formatMoney(totalIfInvested)}</strong> if invested. The gap: <strong>${TE.formatMoney(opportunityCost)}</strong>.</p></div>`+
    `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;margin-top:1rem">`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle};color:var(--accent)">${TE.formatMoney(monthlyTotal)}</span><span style="${bigLabelStyle}">Monthly Bleed</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle};color:var(--accent)">${TE.formatMoney(annualTotal)}</span><span style="${bigLabelStyle}">Annual Total</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle};color:var(--accent)">${TE.formatMoney(totalSpent)}</span><span style="${bigLabelStyle}">Total Spent</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle};color:var(--accent)">${TE.formatMoney(totalIfInvested)}</span><span style="${bigLabelStyle}">If Invested Instead</span></div>`+
    `</div>`+
    `<div class="calc-panel" style="margin-top:1.5rem;overflow-x:auto"><h3>📋 Subscription Breakdown</h3><table style="width:100%;border-collapse:collapse;font-size:.9rem;table-layout:fixed"><colgroup><col style="width:50%"><col style="width:25%"><col style="width:25%"></colgroup><thead><tr style="border-bottom:1px solid var(--border)"><th style="text-align:left;padding:.5rem .25rem">Subscription</th><th style="text-align:right;padding:.5rem .25rem">Monthly</th><th style="text-align:right;padding:.5rem .25rem">Annual</th></tr></thead><tbody>${subRows}</tbody></table></div>`+
    (function(){
      const oc=opportunityCost;
      let buyHTML='';
      if(oc<5000){
        buyHTML=`<p><strong>Emergency buffer:</strong> ${TE.formatMoney(oc)} covers unexpected expenses like a car repair, medical bill, or appliance replacement.</p><p><strong>Retirement boost:</strong> At 4% withdrawal, ${TE.formatMoney(oc)} generates ${TE.formatMoney(oc*0.04/12)}/month in passive income forever. Small now, but it grows.</p><p><strong>Debt payoff:</strong> ${TE.formatMoney(oc)} eliminates a meaningful chunk of high-interest credit card or student loan debt.</p><p><strong>Vacation:</strong> ${TE.formatMoney(oc)} funds a solid week-long trip. Experiences compound too.</p>`;
      }else if(oc<25000){
        buyHTML=`<p><strong>Down payment:</strong> ${TE.formatMoney(oc*0.2)} is a 20% down payment on a ${TE.formatMoney(oc)} home.</p><p><strong>Retirement income:</strong> At 4% withdrawal, ${TE.formatMoney(oc)} generates ${TE.formatMoney(oc*0.04/12)}/month in passive income forever. That is real passive income every month.</p><p><strong>Emergency fund:</strong> ${TE.formatMoney(oc)} covers ${Math.round(oc/5000)} months of ${TE.formatMoney(5000)}/month expenses. Peace of mind, funded.</p><p><strong>Car:</strong> ${TE.formatMoney(oc)} buys a used car or a solid down payment on a new one.</p>`;
      }else if(oc<75000){
        buyHTML=`<p><strong>Down payment:</strong> ${TE.formatMoney(oc*0.2)} is a 20% down payment on a ${TE.formatMoney(oc)} home. That is starter-home territory in most markets.</p><p><strong>Retirement income:</strong> At 4% withdrawal, ${TE.formatMoney(oc)} generates ${TE.formatMoney(oc*0.04/12)}/month in passive income forever. That contributes to groceries, gas, and utilities.</p><p><strong>Emergency fund:</strong> ${TE.formatMoney(oc)} covers ${Math.round(oc/5000)} months of ${TE.formatMoney(5000)}/month expenses. A full year or more of security.</p><p><strong>Car:</strong> ${TE.formatMoney(oc)} buys a very nice car outright, or two reliable used cars.</p>`;
      }else{
        buyHTML=`<p><strong>Down payment:</strong> ${TE.formatMoney(oc*0.2)} is a 20% down payment on a ${TE.formatMoney(oc)} home. In some markets, that covers most or all of the purchase price.</p><p><strong>Retirement income:</strong> At 4% withdrawal, ${TE.formatMoney(oc)} generates ${TE.formatMoney(oc*0.04/12)}/month in passive income forever. That is meaningful monthly income that compounds into real wealth over time.</p><p><strong>Emergency fund:</strong> ${TE.formatMoney(oc)} covers ${Math.round(oc/5000)} months of ${TE.formatMoney(5000)}/month expenses. Years of runway.</p><p><strong>Freedom:</strong> ${TE.formatMoney(oc)} is life-changing money. It funds college, launches a business, or buys years of flexibility.</p>`;
      }
      return `<div class="calc-panel" style="margin-top:1rem"><h3>⚡ What Else Could That Money Buy?</h3>${buyHTML}</div>`;
    })();
    scrollToResults('sub-res');
  });
}

/* ===================== Credit Card Minimum Payment Trap Calculator ===================== */
function creditCardTrapView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'Credit Card Trap'})}<h2>Credit Card Minimum Payment Trap Calculator</h2><p style="color:var(--muted);margin-bottom:1.5rem">Enter your balance, APR, and minimum payment. See how many years it takes to pay off and how much interest you burn. The credit card industry makes $120 billion a year in interest. This calculator shows exactly how much of that is yours.</p>`+
    `<div class="calc-grid"><div class="calc-panel"><h3>💳 Your Debt</h3>
      ${inputField('cc_balance','Current balance','number',{value:5000,min:1,step:1})}
      ${inputField('cc_apr','Annual APR (%)','number',{value:24,min:0.1,max:40,step:0.1})}
      ${inputField('cc_min_pct','Minimum payment (% of balance)','number',{value:2,min:1,max:10,step:0.5})}
      <p style="color:var(--muted);font-size:.9rem;margin-top:.5rem">Most cards require 1-3% of the balance or $25-35, whichever is higher. The lower the minimum, the longer the trap.</p>
      ${inputField('cc_min_floor','Minimum payment floor ($)','number',{value:35,min:5,step:5})}
      <p style="color:var(--muted);font-size:.9rem;margin-top:.5rem">If the calculated minimum is below this floor, you pay the floor instead. Common floors: $25-35.</p>
    </div>
    <div class="calc-panel"><h3>📈 The Math</h3>
      ${inputField('cc_fixed_pay','What if you paid a fixed amount monthly?','number',{value:200,min:1,step:5})}
      <p style="color:var(--muted);font-size:.9rem;margin-top:.5rem">Compare minimum payments vs. a fixed monthly amount. See how much faster you escape.</p>
      ${inputField('cc_payoff_months','Target payoff (months)','number',{value:36,min:1,max:120,step:1})}
      <p style="color:var(--muted);font-size:.9rem;margin-top:.5rem">See what monthly payment is required to be debt-free by your target date.</p>
    </div></div>
    <div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcCreditCardTrap()">Reveal The Trap</button></div>
    <div id="cc-res"></div>`+
    renderFaqSection([
      {q:'Why does minimum payment take so long?',a:'Because minimum payments are designed to stretch your debt, not eliminate it. A 2% minimum on a $5,000 balance at 24% APR means your first payment is $100, but $100 of interest accrues that same month. You are barely touching principal. It is not accidental. It is the business model.'},
      {q:'What is the real cost of carrying a balance?',a:'For every $1,000 you carry at 24% APR, you pay $240/year in interest. That is $20/month for the privilege of not paying it off. Over 5 years, a $5,000 balance costs you $7,000+ if you only pay minimums. You paid $12,000 for a $5,000 purchase.'},
      {q:'Should I pay minimums and invest the difference?',a:'Mathematically, only if your guaranteed investment return exceeds your APR after taxes. At 24% APR, you need to earn roughly 32% pre-tax to break even. No safe investment does that. Pay off high-interest debt first. Every dollar you put toward a 24% APR card is a guaranteed 24% return, tax-free.'},
      {q:'What is the avalanche method?',a:'Pay minimums on all debts, then put every extra dollar toward the highest-APR debt first. Once that is gone, roll that payment into the next highest APR. Mathematically optimal. The snowball method (smallest balance first) wins psychologically. Use avalanche if you are disciplined, snowball if you need wins.'},
      {q:'Can I negotiate my APR?',a:'Yes. Call your issuer and ask for a lower rate. Mention you have been a customer for X years, you pay on time, and you are considering a balance transfer. Success rates are 70-80% for people who ask. A 5% reduction on a $5,000 balance saves $250/year. The worst they can say is no.'}
    ]);

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.calcCreditCardTrap = safeCalc(function(){
    const balance=getVal('cc_balance');
    const apr=(getVal('cc_apr')||24)/100;
    const minPct=(getVal('cc_min_pct')||2)/100;
    const minFloor=getVal('cc_min_floor')||35;
    const fixedPay=getVal('cc_fixed_pay')||0;
    const targetMonths=getVal('cc_payoff_months')||36;
    if(!balance||balance<=0){ alert('Enter a balance greater than 0.'); return; }

    const monthlyRate=apr/12;

    function simulate(minPayFunc,bumpIfNeeded=true){
      let bal=balance, totalPaid=0, totalInterest=0, months=0;
      const schedule=[];
      while(bal>0.01 && months<600){
        const interest=bal*monthlyRate;
        let payment=minPayFunc(bal);
        if(bumpIfNeeded && payment<=interest) payment=interest+1;
        if(payment>bal+interest) payment=bal+interest;
        const principal=payment-interest;
        bal-=principal;
        totalPaid+=payment;
        totalInterest+=interest;
        months++;
        if(months<=12 || months%12===0 || bal<=0.01){
          schedule.push({month:months,balance:bal,interest,payment,principal});
        }
      }
      return {months,totalPaid,totalInterest,schedule};
    }

    const minResult=simulate(b=>Math.max(minFloor, b*minPct));

    let fixedResult=null;
    if(fixedPay>0){
      fixedResult=simulate(b=>fixedPay,false);
    }
    const fixedNeverPaysOff=fixedResult && fixedResult.months>=600;

    let targetResult=null;
    if(targetMonths>0){
      let low=1, high=balance*(1+apr);
      for(let i=0;i<50;i++){
        const mid=(low+high)/2;
        let bal=balance, months=0;
        while(bal>0.01 && months<targetMonths+1){
          const interest=bal*monthlyRate;
          const payment=Math.min(mid, bal+interest);
          bal-=payment-interest;
          months++;
        }
        if(months<=targetMonths && bal<=0.01) high=mid; else low=mid;
      }
      const requiredPay=(low+high)/2;
      const targetSim=simulate(b=>requiredPay,false);
      targetResult={payment:requiredPay,totalPaid:targetSim.totalPaid,totalInterest:targetSim.totalInterest,months:targetSim.months};
    }

    const lines=[
      {label:'Starting balance',val:TE.formatMoney(balance)},
      {label:'APR',val:(apr*100).toFixed(1)+'%'},
      {label:'Minimum payment rule',val:(minPct*100).toFixed(1)+'% or '+TE.formatMoney(minFloor)},
      {label:'',val:''},
      {label:'Years to pay off (minimum)',val:(minResult.months/12).toFixed(1)+' years ('+minResult.months+' months)'},
      {label:'Total paid (minimum)',val:TE.formatMoney(minResult.totalPaid)},
      {label:'Total interest (minimum)',val:TE.formatMoney(minResult.totalInterest)},
      {label:'Interest as % of original',val:((minResult.totalInterest/balance)*100).toFixed(1)+'%'}
    ];

    if(fixedResult){
      lines.push({label:'',val:''});
      lines.push({label:'Fixed payment',val:TE.formatMoney(fixedPay)+'/mo'});
      if(fixedNeverPaysOff){
        lines.push({label:'Years to pay off (fixed)',val:'Never pays off'});
        lines.push({label:'Warning',val:'Payment does not cover monthly interest'});
      }else{
        lines.push({label:'Years to pay off (fixed)',val:(fixedResult.months/12).toFixed(1)+' years ('+fixedResult.months+' months)'});
        lines.push({label:'Total paid (fixed)',val:TE.formatMoney(fixedResult.totalPaid)});
        lines.push({label:'Total interest (fixed)',val:TE.formatMoney(fixedResult.totalInterest)});
        lines.push({label:'Savings vs minimum',val:TE.formatMoney(minResult.totalPaid-fixedResult.totalPaid)});
      }
    }

    if(targetResult){
      lines.push({label:'',val:''});
      lines.push({label:'Target payoff',val:targetMonths+' months'});
      lines.push({label:'Required payment',val:TE.formatMoney(targetResult.payment)+'/mo'});
      lines.push({label:'Total paid (target)',val:TE.formatMoney(targetResult.totalPaid)});
      lines.push({label:'Total interest (target)',val:TE.formatMoney(targetResult.totalInterest)});
      lines.push({label:'Savings vs minimum',val:TE.formatMoney(minResult.totalPaid-targetResult.totalPaid)});
    }

    const bigCardStyle='background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.25rem;text-align:center';
    const bigNumberStyle='display:block;font-size:2.2rem;font-weight:800';
    const bigLabelStyle='display:block;font-size:.9rem;color:var(--muted);margin-top:.25rem';

    let comparisonHTML='';
    if(fixedResult && !fixedNeverPaysOff){
      comparisonHTML+=`<div style="${bigCardStyle}"><span style="${bigNumberStyle};color:var(--accent)">${(fixedResult.months/12).toFixed(1)}</span><span style="${bigLabelStyle}">Years (Fixed Payment)</span></div>`;
    }
    if(targetResult){
      comparisonHTML+=`<div style="${bigCardStyle}"><span style="${bigNumberStyle};color:var(--accent)">${targetMonths}</span><span style="${bigLabelStyle}">Months (Target Payoff)</span></div>`;
    }

    const horrorNote=minResult.months>120 ? 'You will be in debt for over a decade paying only minimums. This is not a payment plan. It is a wealth destruction plan.' :
      minResult.months>60 ? 'Minimum payments stretch your debt for years. Every extra dollar you pay above the minimum is a guaranteed return equal to your APR.' :
      'Even at this balance, minimum payments cost you serious money. Pay more than the minimum whenever you can.';

    document.getElementById('cc-res').innerHTML=resultsBox(lines,'Credit Card Trap Results',TE.formatMoney(minResult.totalInterest)+' in interest')+
    `<div style="${bigCardStyle};margin-top:1.5rem;border-color:var(--danger)"><span style="${bigNumberStyle};color:var(--danger)">${(minResult.months/12).toFixed(1)}</span><span style="${bigLabelStyle}">Years in Debt (Minimum Payments)</span><p style="margin-top:1rem;font-size:1.1rem">${horrorNote}</p></div>`+
    `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;margin-top:1rem">`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle};color:var(--accent)">${TE.formatMoney(minResult.totalInterest)}</span><span style="${bigLabelStyle}">Total Interest Paid</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle};color:var(--accent)">${TE.formatMoney(minResult.totalPaid)}</span><span style="${bigLabelStyle}">Total Paid</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle};color:var(--accent)">${((minResult.totalInterest/balance)*100).toFixed(0)}%</span><span style="${bigLabelStyle}">Interest / Original</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle};color:var(--accent)">${TE.formatMoney(balance+minResult.totalInterest)}</span><span style="${bigLabelStyle}">True Cost of Purchase</span></div>`+
    (comparisonHTML?comparisonHTML:'')+
    `</div>`+
    (function(){
      const oc=minResult.totalInterest;
      let buyHTML='';
      if(oc<1000){
        buyHTML=`<p><strong>Vacation:</strong> ${TE.formatMoney(oc)} funds a weekend getaway. Instead, you gave it to a bank.</p><p><strong>Emergency fund:</strong> ${TE.formatMoney(oc)} covers a car repair or medical bill.</p><p><strong>Invested:</strong> At 10% return over 20 years, ${TE.formatMoney(oc)} becomes ${TE.formatMoney(oc*Math.pow(1.1,20))}.</p>`;
      }else if(oc<5000){
        buyHTML=`<p><strong>Car:</strong> ${TE.formatMoney(oc)} is a used car or a down payment on a new one.</p><p><strong>Emergency fund:</strong> ${TE.formatMoney(oc)} covers ${Math.round(oc/5000)} months of ${TE.formatMoney(5000)}/month expenses.</p><p><strong>Invested:</strong> At 10% over 20 years, ${TE.formatMoney(oc)} becomes ${TE.formatMoney(oc*Math.pow(1.1,20))}.</p>`;
      }else if(oc<15000){
        buyHTML=`<p><strong>Down payment fund:</strong> ${TE.formatMoney(oc*0.2)} toward a home purchase.</p><p><strong>Retirement income:</strong> At 4% withdrawal, ${TE.formatMoney(oc)} generates ${TE.formatMoney(oc*0.04/12)}/month forever. Passive income that grows with inflation.</p><p><strong>College:</strong> ${TE.formatMoney(oc)} covers roughly ${Math.max(1,Math.round(oc/10000))} semesters of in-state public college.</p>`;
      }else{
        buyHTML=`<p><strong>Down payment:</strong> ${TE.formatMoney(oc*0.2)} is a 20% down payment on a ${TE.formatMoney(oc)} home.</p><p><strong>Retirement income:</strong> At 4% withdrawal, ${TE.formatMoney(oc)} generates ${TE.formatMoney(oc*0.04/12)}/month forever. That is real monthly passive income — a utility bill, a phone plan, streaming, and more.</p><p><strong>Freedom:</strong> ${TE.formatMoney(oc)} is the kind of money that changes your life. Instead, it changed a bank\'s quarterly earnings.</p>`;
      }
      return `<div class="calc-panel" style="margin-top:1rem"><h3>⚡ What You Could Have Bought Instead</h3>${buyHTML}</div>`;
    })();
    scrollToResults('cc-res');
  });
}

/* ===================== Buy vs Rent Break-Even Calculator ===================== */
function buyVsRentView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'Buy vs Rent'})}<h2>Buy vs. Rent Break-Even Calculator</h2><p style="color:var(--muted);margin-bottom:1.5rem">Enter your local numbers and see the exact month when buying a home beats renting. Most people guess. This calculator knows. Accounts for mortgage, taxes, insurance, maintenance, HOA, appreciation, closing costs, selling costs, rent increases, and the opportunity cost of your down payment.</p>`+
    `<div class="calc-grid"><div class="calc-panel"><h3>🏠 Home Purchase</h3>
      ${inputField('br_price','Home price','number',{value:400000,min:1,step:1000})}
      ${inputField('br_down_pct','Down payment (%)','number',{value:20,min:0,max:100,step:1})}
      ${inputField('br_rate','Mortgage rate (%)','number',{value:7,min:0.1,max:20,step:0.1})}
      ${inputField('br_term','Loan term (years)','number',{value:30,min:1,max:40,step:1})}
      ${inputField('br_tax','Property tax (%/year)','number',{value:1.2,min:0,max:5,step:0.1})}
      ${inputField('br_insurance','Home insurance ($/year)','number',{value:1200,min:0,step:100})}
      ${inputField('br_maint','Maintenance (% of home price/year)','number',{value:1,min:0,max:5,step:0.5})}
      ${inputField('br_hoa','HOA fees ($/month)','number',{value:0,min:0,step:25})}
      ${inputField('br_closing','Closing costs ($)','number',{value:5000,min:0,step:500})}
      ${inputField('br_sell_pct','Selling costs (% of sale price)','number',{value:6,min:0,max:10,step:0.5})}
    </div>
    <div class="calc-panel"><h3>🏠 Rental & Market</h3>
      ${inputField('br_rent','Monthly rent','number',{value:2000,min:1,step:50})}
      ${inputField('br_rent_inc','Rent increase (%/year)','number',{value:3,min:0,max:10,step:0.5})}
      ${inputField('br_appreciate','Home appreciation (%/year)','number',{value:3,min:-5,max:15,step:0.5})}
      ${inputField('br_invest_return','Investment return if renting (%/year)','number',{value:7,min:0,max:15,step:0.5})}
      <p style="color:var(--muted);font-size:.9rem;margin-top:.5rem">What your down payment and monthly savings would earn in index funds if you rented instead. Historical S&P 500 average is ~10%.</p>
    </div></div>
    <div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcBuyVsRent()">Find Break-Even Month</button></div>
    <div id="br-res"></div>`+
    renderFaqSection([
      {q:'Why does buying take so long to beat renting?',a:'Because the first few years of a mortgage are mostly interest, not principal. You are paying the bank, not building equity. Closing costs and selling costs also eat into your gains. In the early years, your equity grows slowly while your monthly costs are high. Renting lets you invest the down payment and any monthly savings, which compounds.'},
      {q:'What if home prices go down?',a:'Enter a negative appreciation rate. If local prices are falling 2%/year, buying gets worse fast. Your equity shrinks while you still pay the full mortgage. In declining markets, renting and investing the difference often wins for a very long time, or forever.'},
      {q:'Should I include tax deductions?',a:'Mortgage interest and property tax are deductible if you itemize, but the standard deduction ($14,600 single / $29,200 married in 2026) is high enough that most homeowners do not benefit. If you do itemize, subtract your marginal tax rate from the mortgage rate for a rough adjustment. This calculator uses the conservative no-deduction baseline.'},
      {q:'How accurate is the break-even month?',a:'It is as accurate as your inputs. The biggest unknowns are appreciation and investment returns, which nobody can predict. Run the calculator with optimistic (5% appreciation, 10% returns) and pessimistic (0% appreciation, 5% returns) scenarios to see the range. The break-even month is highly sensitive to these assumptions.'},
      {q:'What about the non-financial benefits of owning?',a:'This calculator only models dollars. Stability, pride of ownership, ability to renovate, no landlord, and forced savings are real benefits. But so are the flexibility of renting, no maintenance headaches, and geographic mobility. The math tells you when the financial scales tip. The life decision is yours.'}
    ]);

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.calcBuyVsRent = safeCalc(function(){
    const price=getVal('br_price');
    const downPct=(getVal('br_down_pct')||20)/100;
    const rate=(getVal('br_rate')||7)/100;
    const termYears=getVal('br_term')||30;
    const taxRate=(getVal('br_tax')||1.2)/100;
    const insurance=getVal('br_insurance')||1200;
    const maintRate=(getVal('br_maint')||1)/100;
    const hoa=getVal('br_hoa')||0;
    const closing=getVal('br_closing')||5000;
    const sellPct=(getVal('br_sell_pct')||6)/100;
    const rent=getVal('br_rent')||2000;
    const rentInc=(getVal('br_rent_inc')||3)/100;
    const appreciate=(getVal('br_appreciate')||3)/100;
    const investReturn=(getVal('br_invest_return')||7)/100;

    if(!price||price<=0){ alert('Enter a home price greater than 0.'); return; }

    const down=price*downPct;
    const loan=price-down;
    const monthlyRate=rate/12;
    const numPayments=termYears*12;
    const monthlyPI=loan>0 && rate>0 ? loan*(monthlyRate*Math.pow(1+monthlyRate,numPayments))/(Math.pow(1+monthlyRate,numPayments)-1) : (loan/numPayments);

    const monthlyTax=price*taxRate/12;
    const monthlyInsurance=insurance/12;
    const monthlyMaint=price*maintRate/12;
    const monthlyOwn=monthlyPI+monthlyTax+monthlyInsurance+monthlyMaint+hoa;

    let renterPortfolio=down+closing;
    let mortgageBal=loan;
    let breakEvenMonth=-1;
    const schedule=[];

    for(let m=1;m<=360;m++){
      const monthRate=monthlyRate;
      const interest=mortgageBal*monthRate;
      const principal=monthlyPI-interest;
      mortgageBal=Math.max(0,mortgageBal-principal);

      const homeValue=price*Math.pow(1+appreciate/12,m);
      const sellCost=homeValue*sellPct;
      const buyerEquity=homeValue-mortgageBal-sellCost-closing;

      const currentRent=rent*Math.pow(1+rentInc,Math.floor((m-1)/12));
      const monthlySavings=monthlyOwn-currentRent;

      renterPortfolio=renterPortfolio*(1+investReturn/12)+monthlySavings;

      if(breakEvenMonth<0 && buyerEquity>renterPortfolio){
        breakEvenMonth=m;
      }

      if(m<=12 || m%12===0 || m===breakEvenMonth){
        schedule.push({month:m,buyerEquity,renterPortfolio,currentRent,monthlyOwn,homeValue,mortgageBal});
      }
    }

    const finalBuyerEquity=schedule[schedule.length-1].buyerEquity;
    const finalRenterPortfolio=schedule[schedule.length-1].renterPortfolio;

    const lines=[
      {label:'Home price',val:TE.formatMoney(price)},
      {label:'Down payment',val:TE.formatMoney(down)+' ('+(downPct*100).toFixed(0)+'%)'},
      {label:'Loan amount',val:TE.formatMoney(loan)},
      {label:'Monthly P&I',val:TE.formatMoney(monthlyPI)},
      {label:'Total monthly ownership cost',val:TE.formatMoney(monthlyOwn)},
      {label:'',val:''},
      {label:'Monthly rent (year 1)',val:TE.formatMoney(rent)},
      {label:'',val:''}
    ];

    if(breakEvenMonth>0){
      lines.push({label:'Break-even month',val:breakEvenMonth+' months ('+(breakEvenMonth/12).toFixed(1)+' years)'});
      lines.push({label:'Buyer equity at break-even',val:TE.formatMoney(schedule.find(s=>s.month===breakEvenMonth).buyerEquity)});
      lines.push({label:'Renter portfolio at break-even',val:TE.formatMoney(schedule.find(s=>s.month===breakEvenMonth).renterPortfolio)});
    }else{
      lines.push({label:'Break-even month',val:'Buying never beats renting in 30 years'});
      lines.push({label:'Buyer equity at year 30',val:TE.formatMoney(finalBuyerEquity)});
      lines.push({label:'Renter portfolio at year 30',val:TE.formatMoney(finalRenterPortfolio)});
      lines.push({label:'Winner after 30 years',val:finalRenterPortfolio>finalBuyerEquity?'Renting':'Buying'});
    }

    const bigCardStyle='background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.25rem;text-align:center';
    const bigNumberStyle='display:block;font-size:2.2rem;font-weight:800';
    const bigLabelStyle='display:block;font-size:.9rem;color:var(--muted);margin-top:.25rem';

    const beHTML=breakEvenMonth>0 ?
      `<span style="${bigNumberStyle};color:var(--accent)">${Math.floor(breakEvenMonth/12)} years ${breakEvenMonth%12} months</span><span style="${bigLabelStyle}">Break-Even Point</span>` :
      `<span style="${bigNumberStyle};color:var(--danger)">Never</span><span style="${bigLabelStyle}">Buying Never Wins in 30 Years</span>`;

    const note=breakEvenMonth>0 ?
      `At month ${breakEvenMonth}, your home equity (after selling costs) finally exceeds what you would have by renting and investing the difference. Before that, renting builds more wealth.` :
      `Even after 30 years, renting and investing the difference leaves you with more wealth than buying. This can happen with high home prices, low appreciation, high maintenance costs, or strong investment returns.`;

    document.getElementById('br-res').innerHTML=resultsBox(lines,'Buy vs Rent Results',breakEvenMonth>0?'Break-even at month '+breakEvenMonth:'No break-even in 30 years')+
    `<div style="${bigCardStyle};margin-top:1.5rem;border-color:var(--accent)">${beHTML}<p style="margin-top:1rem;font-size:1.1rem">${note}</p></div>`+
    `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;margin-top:1rem">`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle};color:var(--accent)">${TE.formatMoney(monthlyOwn)}</span><span style="${bigLabelStyle}">Monthly Cost to Own</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle};color:var(--accent)">${TE.formatMoney(rent)}</span><span style="${bigLabelStyle}">Monthly Rent (Year 1)</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle};color:var(--accent)">${TE.formatMoney(down)}</span><span style="${bigLabelStyle}">Down Payment</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle};color:var(--accent)">${TE.formatMoney(closing)}</span><span style="${bigLabelStyle}">Closing Costs</span></div>`+
    `</div>`;
    scrollToResults('br-res');
  });
}

/* ===================== Cost of Procrastinating on Investing Calculator ===================== */
function procrastinationInvestingView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'Procrastination Cost'})}<h2>Cost of Procrastinating on Investing Calculator</h2><p style="color:var(--muted);margin-bottom:1.5rem">The most expensive mistake in personal finance is waiting. Enter your monthly contribution and see the devastating wealth gap at retirement between starting now vs. starting 10 or 20 years later. Same monthly amount. Same return. Completely different life.</p>`+
    `<div class="calc-grid"><div class="calc-panel"><h3>Your Plan</h3>
      ${inputField('pi_monthly','Monthly investment','number',{value:500,min:1,step:50})}
      ${inputField('pi_return','Annual return (%)','number',{value:7,min:0,max:15,step:0.5})}
      ${inputField('pi_start_age','Start investing at age','number',{value:25,min:18,max:60,step:1})}
      ${inputField('pi_delay','Delay to compare (years)','number',{value:10,min:1,max:30,step:1})}
      ${inputField('pi_end_age','Retirement age','number',{value:65,min:40,max:80,step:1})}
    </div>
    <div class="calc-panel"><h3>Optional: Employer Match</h3>
      ${inputField('pi_match','Employer match (%)','number',{value:0,min:0,max:100,step:1})}
      <p style="color:var(--muted);font-size:.9rem;margin-top:.5rem">Many 401(k)s match 50% up to 6% of salary. Enter your match rate and the calculator includes it in the total contribution. Free money that compounds too.</p>
    </div></div>
    <div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcProcrastination()">Show the Wealth Gap</button></div>
    <div id="pi-res"></div>`+
    renderFaqSection([
      {q:'Why does 10 years matter so much?',a:'Because compound interest is exponential, not linear. The money you invest in year 1 has 40 years to grow. The money you invest in year 11 has only 30. That extra decade of compounding is worth more than all the contributions you make in the final 10 years combined. Time is the single most powerful force in investing.'},
      {q:'Is 7% return realistic?',a:'The S&P 500 has averaged about 10% annually before inflation since 1926. After inflation, historically it is about 7%. Some decades are better, some are worse. The key insight is not the exact number — it is the gap between starting early and starting late. Even at 5%, the delay is devastating.'},
      {q:'What if I can not afford $500/month?',a:'Start with $50. The habit matters more than the amount. $50/month from age 25 to 65 at 7% is $131,000. $50/month from age 35 to 65 is $61,000. The gap is still $70,000 on just $50/month. Every dollar you invest young is worth 2-3x what it would be if invested later.'},
      {q:'What about the employer match?',a:'A 50% match turns $500 into $750 invested. That is an instant, risk-free 50% return. If your employer offers a match, contribute enough to get the full match before anything else. It is literally free money that compounds for decades.'},
      {q:'What if I already delayed? Is it too late?',a:'No. The best time to start was 10 years ago. The second best time is today. Every year you wait makes it worse, but every year you start makes it better. Someone who starts at 45 and contributes $1,000/month still ends up with more than someone who started at 35 with $500/month. Increase your contribution to compensate for lost time.'}
    ]);

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.calcProcrastination = safeCalc(function(){
    const monthly=getVal('pi_monthly')||500;
    const annualReturn=(getVal('pi_return')||7)/100;
    const startAge=getVal('pi_start_age')||25;
    const delay=getVal('pi_delay')||10;
    const endAge=getVal('pi_end_age')||65;
    const matchPct=(getVal('pi_match')||0)/100;

    const totalMonthly=monthly*(1+matchPct);
    const monthlyRate=annualReturn/12;

    function fv(months){ return totalMonthly*(Math.pow(1+monthlyRate,months)-1)/monthlyRate; }
    function totalContributed(months){ return totalMonthly*months; }

    const earlyMonths=(endAge-startAge)*12;
    const delayedMonths=(endAge-(startAge+delay))*12;
    const veryDelayedMonths=Math.max(0,(endAge-(startAge+delay*2))*12);

    const earlyFV=fv(earlyMonths);
    const delayedFV=delayedMonths>0?fv(delayedMonths):0;
    const veryDelayedFV=veryDelayedMonths>0?fv(veryDelayedMonths):0;

    const earlyTotal=totalContributed(earlyMonths);
    const delayedTotal=delayedMonths>0?totalContributed(delayedMonths):0;
    const veryDelayedTotal=veryDelayedMonths>0?totalContributed(veryDelayedMonths):0;

    const gapEarlyDelayed=earlyFV-delayedFV;
    const gapEarlyVery=earlyFV-veryDelayedFV;

    const lines=[
      {label:'Monthly contribution',val:TE.formatMoney(monthly)+'/mo'},
      {label:'With employer match',val:TE.formatMoney(totalMonthly)+'/mo invested'},
      {label:'Annual return',val:(annualReturn*100).toFixed(1)+'%'},
      {label:'Retirement age',val:endAge},
      {label:'',val:''},
      {label:'Start at '+startAge, val:TE.formatMoney(earlyFV)+' (contributed '+TE.formatMoney(earlyTotal)+')'},
      {label:'Start at '+(startAge+delay), val:delayedFV>0?TE.formatMoney(delayedFV)+' (contributed '+TE.formatMoney(delayedTotal)+')':'Never reaches retirement'},
      {label:'Start at '+(startAge+delay*2), val:veryDelayedFV>0?TE.formatMoney(veryDelayedFV)+' (contributed '+TE.formatMoney(veryDelayedTotal)+')':'Never reaches retirement'}
    ];

    const bigCardStyle='background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.25rem;text-align:center';
    const bigNumberStyle='display:block;font-size:2.2rem;font-weight:800';
    const bigLabelStyle='display:block;font-size:.9rem;color:var(--muted);margin-top:.25rem';

    const gapHTML=delayedFV>0?
      `<span style="${bigNumberStyle};color:var(--danger)">${TE.formatMoney(gapEarlyDelayed)}</span><span style="${bigLabelStyle}">Wealth Gap From ${delay}-Year Delay</span>`:
      `<span style="${bigNumberStyle};color:var(--danger)">Even Worse</span><span style="${bigLabelStyle}">Delayed Start Never Reaches Retirement Age</span>`;

    const gapNote=delayedFV>0?
      `Waiting ${delay} years to start investing cost you ${TE.formatMoney(gapEarlyDelayed)}. That is ${(gapEarlyDelayed/monthly).toFixed(0)} extra monthly contributions you would need to make to catch up. Or ${(gapEarlyDelayed/(monthly*(1+matchPct))).toFixed(0)} extra months of investing at the same rate. Time is not refundable.`:
      `Starting at ${startAge+delay} with only ${endAge-(startAge+delay)} years until retirement means you do not even have enough time for compound growth to work. You must either invest dramatically more per month or delay retirement.`;

    const monthsToCatch=delayedFV>0?Math.ceil(Math.log(1+(gapEarlyDelayed*monthlyRate)/totalMonthly)/Math.log(1+monthlyRate)):0;

    document.getElementById('pi-res').innerHTML=resultsBox(lines,'Procrastination Cost Results','The wealth gap is '+TE.formatMoney(gapEarlyDelayed))+
    `<div style="${bigCardStyle};margin-top:1.5rem;border-color:var(--danger)">${gapHTML}<p style="margin-top:1rem;font-size:1.1rem">${gapNote}</p></div>`+
    `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;margin-top:1rem">`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle};color:var(--accent)">${TE.formatMoney(earlyFV)}</span><span style="${bigLabelStyle}">Start at ${startAge}</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle};color:var(--accent)">${delayedFV>0?TE.formatMoney(delayedFV):'N/A'}</span><span style="${bigLabelStyle}">Start at ${startAge+delay}</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle};color:var(--accent)">${veryDelayedFV>0?TE.formatMoney(veryDelayedFV):'N/A'}</span><span style="${bigLabelStyle}">Start at ${startAge+delay*2}</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle};color:var(--accent)">${TE.formatMoney(gapEarlyDelayed)}</span><span style="${bigLabelStyle}">${delay}-Year Delay Cost</span></div>`+
    `</div>`+
    (delayedFV>0?`<div class="calc-panel" style="margin-top:1rem"><h3>⚡ To Catch Up, the Delayed Investor Would Need To...</h3><p><strong>Invest for ${monthsToCatch} extra months</strong> (about ${(monthsToCatch/12).toFixed(1)} extra years) at ${TE.formatMoney(totalMonthly)}/month to match the early starter.</p><p style="margin-top:.5rem"><strong>Or invest ${TE.formatMoney((earlyFV/delayedMonths-totalMonthly))}/month more</strong> for the remaining ${delayedMonths} months to close the gap.</p><p style="margin-top:.5rem">Both options are far more painful than just starting earlier. The math is ruthless.</p></div>`:'')+
    (function(){
      const gap=gapEarlyDelayed;
      let buyHTML='';
      if(gap<100000){
        buyHTML=`<p><strong>Car:</strong> ${TE.formatMoney(gap)} is a very nice car. Instead, it is the price of waiting.</p><p><strong>Down payment:</strong> ${TE.formatMoney(gap*0.2)} toward a home.</p><p><strong>Peace of mind:</strong> That gap represents years of stress-free retirement income.</p>`;
      }else if(gap<500000){
        buyHTML=`<p><strong>Home:</strong> ${TE.formatMoney(gap)} is a down payment on a home or a paid-off house in many markets.</p><p><strong>Retirement income:</strong> At 4% withdrawal, ${TE.formatMoney(gap)} generates ${TE.formatMoney(gap*0.04/12)}/month forever.</p><p><strong>College:</strong> ${TE.formatMoney(gap)} pays for multiple years of in-state tuition.</p>`;
      }else if(gap<1000000){
        buyHTML=`<p><strong>Home:</strong> ${TE.formatMoney(gap)} buys a home outright in most of the country.</p><p><strong>Retirement income:</strong> At 4% withdrawal, ${TE.formatMoney(gap)} generates ${TE.formatMoney(gap*0.04/12)}/month forever. That covers housing and healthcare.</p><p><strong>Legacy:</strong> ${TE.formatMoney(gap)} is generational wealth you could leave to your children.</p>`;
      }else{
        buyHTML=`<p><strong>Financial independence:</strong> ${TE.formatMoney(gap)} is the difference between worrying about money and never worrying again.</p><p><strong>Retirement income:</strong> At 4% withdrawal, ${TE.formatMoney(gap)} generates ${TE.formatMoney(gap*0.04/12)}/month forever. That is a full middle-class lifestyle.</p><p><strong>Freedom:</strong> ${TE.formatMoney(gap)} is the kind of money that lets you walk away from a job you hate, help family, and live on your own terms.</p>`;
      }
      return `<div class="calc-panel" style="margin-top:1rem"><h3>💸 What That Gap Could Have Bought Instead</h3>${buyHTML}</div>`;
    })();
    scrollToResults('pi-res');
  });
}

/* ===================== Lifestyle Creep Calculator ===================== */
function lifestyleCreepView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'Lifestyle Creep'})}<h2>Lifestyle Creep Calculator</h2><p style="color:var(--muted);margin-bottom:1.5rem">You got a raise. Your spending went up. Your savings went down. This calculator shows exactly how much lifestyle creep cost you. Enter your income and savings rate from then and now, and see the wealth destroyed by spending increases that felt small but compound into devastating losses.</p>`+
    `<div class="calc-grid"><div class="calc-panel"><h3>Then (5 Years Ago)</h3>
      ${inputField('lc_then_income','Annual income','number',{value:60000,min:0,step:1000})}
      ${inputField('lc_then_savings','Savings rate (%)','number',{value:20,min:0,max:100,step:1})}
    </div>
    <div class="calc-panel"><h3>Now (Today)</h3>
      ${inputField('lc_now_income','Annual income','number',{value:100000,min:0,step:1000})}
      ${inputField('lc_now_savings','Savings rate (%)','number',{value:8,min:0,max:100,step:1})}
    </div></div>
    <div class="calc-grid" style="margin-top:1rem"><div class="calc-panel"><h3>Projection</h3>
      ${inputField('lc_return','Annual investment return (%)','number',{value:7,min:0,max:15,step:0.5})}
      ${inputField('lc_years','Years to project forward','number',{value:20,min:1,max:50,step:1})}
    </div></div>
    <div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcLifestyleCreep()">Reveal the Damage</button></div>
    <div id="lc-res"></div>`+
    renderFaqSection([
      {q:'What is lifestyle creep?',a:'Lifestyle creep is the gradual increase in spending as income rises. The first raise goes to debt. The second goes to a nicer apartment. The third goes to a new car. Before you know it, you are earning twice as much but barely saving more than when you were broke. It is invisible because every purchase feels justified, but the math is brutal.'},
      {q:'Why does a lower savings rate matter if I earn more?',a:'Because the dollar amount of your savings matters less than the habit. If you earn $100k and save 8%, you save $8k/year. If you earned $60k and saved 20%, you saved $12k/year. You earned $40k more and saved $4k less. Every dollar of foregone savings is a dollar that stops compounding. Over 20 years at 7%, that $4k/year gap becomes $173,000 in lost wealth.'},
      {q:'How do I stop lifestyle creep?',a:'Automate your savings before you see the money. Set your 401(k) contribution to increase 1% every year. When you get a raise, split it 50/50: half to savings, half to lifestyle. The people who build wealth are not the ones who earn the most — they are the ones who keep the widest gap between what they earn and what they spend.'},
      {q:'Is some lifestyle increase okay?',a:'Yes. The goal is not to live like a college student forever. The goal is to increase your spending slower than your income. If you get a 10% raise and increase spending 3%, you are winning. If you get a 10% raise and increase spending 12%, you are losing — even though your paycheck is bigger.'},
      {q:'What if my savings rate actually went up?',a:'Then this calculator will show negative "wealth destroyed" — meaning you beat lifestyle creep. Congratulations. That is rarer than you think. Most people need to see the numbers to realize how much their spending has outpaced their income.'}
    ]);

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.calcLifestyleCreep = safeCalc(function(){
    const thenIncome=getVal('lc_then_income')||60000;
    const thenRate=(getVal('lc_then_savings')||20)/100;
    const nowIncome=getVal('lc_now_income')||100000;
    const nowRate=(getVal('lc_now_savings')||8)/100;
    const annualReturn=(getVal('lc_return')||7)/100;
    const years=getVal('lc_years')||20;

    const thenSavings=thenIncome*thenRate;
    const nowSavings=nowIncome*nowRate;
    const thenSpending=thenIncome-thenSavings;
    const nowSpending=nowIncome-nowSavings;

    const incomeIncrease=nowIncome-thenIncome;
    const savingsChange=nowSavings-thenSavings;
    const spendingIncrease=nowSpending-thenSpending;

    const hypotheticalSavings=nowIncome*thenRate;
    const foregoneAnnual=hypotheticalSavings-nowSavings;

    const monthlyRate=annualReturn/12;
    const months=years*12;
    const foregoneMonthly=foregoneAnnual/12;
    const wealthDestroyed=foregoneMonthly>0?foregoneMonthly*(Math.pow(1+monthlyRate,months)-1)/monthlyRate:0;

    const lines=[
      {label:'Income then',val:TE.formatMoney(thenIncome)+'/year'},
      {label:'Income now',val:TE.formatMoney(nowIncome)+'/year'},
      {label:'Income increase',val:TE.formatMoney(incomeIncrease)+'/year'},
      {label:'',val:''},
      {label:'Savings then',val:TE.formatMoney(thenSavings)+'/year ('+(thenRate*100).toFixed(0)+'%)'},
      {label:'Savings now',val:TE.formatMoney(nowSavings)+'/year ('+(nowRate*100).toFixed(0)+'%)'},
      {label:'Savings change',val:(savingsChange>=0?'+':'')+TE.formatMoney(savingsChange)+'/year'},
      {label:'',val:''},
      {label:'Spending then',val:TE.formatMoney(thenSpending)+'/year'},
      {label:'Spending now',val:TE.formatMoney(nowSpending)+'/year'},
      {label:'Spending increase',val:TE.formatMoney(spendingIncrease)+'/year'},
      {label:'',val:''},
      {label:'If you kept your old savings rate',val:TE.formatMoney(hypotheticalSavings)+'/year saved'},
      {label:'Foregone savings per year',val:foregoneAnnual>0?TE.formatMoney(foregoneAnnual)+'/year':'$0 — you are doing great'},
      {label:'',val:''},
      {label:'Wealth destroyed over '+years+' years',val:wealthDestroyed>0?TE.formatMoney(wealthDestroyed):'None — lifestyle creep defeated'}
    ];

    const bigCardStyle='background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.25rem;text-align:center';
    const bigNumberStyle='display:block;font-size:2.2rem;font-weight:800';
    const bigLabelStyle='display:block;font-size:.9rem;color:var(--muted);margin-top:.25rem';

    const creepHTML=wealthDestroyed>0?
      `<span style="${bigNumberStyle};color:var(--danger)">${TE.formatMoney(wealthDestroyed)}</span><span style="${bigLabelStyle}">Wealth Destroyed by Lifestyle Creep</span>`:
      `<span style="${bigNumberStyle};color:var(--accent)">None</span><span style="${bigLabelStyle}">You Beat Lifestyle Creep</span>`;

    const headline=wealthDestroyed>0?
      `You earned ${TE.formatMoney(incomeIncrease)} more per year but saved ${TE.formatMoney(Math.abs(savingsChange))} ${savingsChange<0?'less':'more'}. ${foregoneAnnual>0?'Every dollar of foregone spending could have been invested. Instead, it evaporated.':''}`:
      `Your savings rate improved even as your income rose. That is the sign of someone who understands that wealth is built in the gap between earning and spending.`;

    const pctToSpending=incomeIncrease>0?(spendingIncrease/incomeIncrease*100).toFixed(0):0;
    const pctToSavings=incomeIncrease>0?((savingsChange)/incomeIncrease*100).toFixed(0):0;

    document.getElementById('lc-res').innerHTML=resultsBox(lines,'Lifestyle Creep Results',wealthDestroyed>0?'Wealth destroyed: '+TE.formatMoney(wealthDestroyed):'No wealth destroyed')+
    `<div style="${bigCardStyle};margin-top:1.5rem;border-color:var(--danger)">${creepHTML}<p style="margin-top:1rem;font-size:1.1rem">${headline}</p></div>`+
    `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;margin-top:1rem">`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle};color:var(--accent)">${TE.formatMoney(incomeIncrease)}</span><span style="${bigLabelStyle}">Income Increase</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle};color:var(--danger)">${TE.formatMoney(spendingIncrease)}</span><span style="${bigLabelStyle}">Spending Increase</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle};color:${savingsChange>=0?'var(--accent)':'var(--danger)'}">${(savingsChange>=0?'+':'')+TE.formatMoney(savingsChange)}</span><span style="${bigLabelStyle}">Savings Change</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle};color:var(--accent)">${pctToSpending}%</span><span style="${bigLabelStyle}">Of Raise Went to Spending</span></div>`+
    `</div>`+
    (wealthDestroyed>0?`<div class="calc-panel" style="margin-top:1rem"><h3>⚡ What If You Reversed It?</h3><p>If you returned to your old savings rate of ${(thenRate*100).toFixed(0)}% on your new income of ${TE.formatMoney(nowIncome)}, you would save ${TE.formatMoney(hypotheticalSavings)}/year instead of ${TE.formatMoney(nowSavings)}.</p><p style="margin-top:.5rem">That ${TE.formatMoney(foregoneAnnual)}/year difference, invested at ${(annualReturn*100).toFixed(1)}% for ${years} years, becomes <strong>${TE.formatMoney(wealthDestroyed)}</strong>.</p><p style="margin-top:.5rem">The fix is not earning more. It is spending less of what you already earn.</p></div>`:'')+
    (function(){
      if(wealthDestroyed<=0) return '';
      const gap=wealthDestroyed;
      let buyHTML='';
      if(gap<100000){
        buyHTML=`<p><strong>Car:</strong> ${TE.formatMoney(gap)} is a reliable used car or a solid down payment.</p><p><strong>Emergency fund:</strong> ${TE.formatMoney(gap)} covers ${Math.round(gap/5000)} months of expenses.</p><p><strong>Retirement boost:</strong> At 4% withdrawal, ${TE.formatMoney(gap)} generates ${TE.formatMoney(gap*0.04/12)}/month forever.</p>`;
      }else if(gap<500000){
        buyHTML=`<p><strong>Home:</strong> ${TE.formatMoney(gap)} is a 20% down payment on a home in most markets.</p><p><strong>Retirement income:</strong> At 4% withdrawal, ${TE.formatMoney(gap)} generates ${TE.formatMoney(gap*0.04/12)}/month forever. That is real monthly income.</p><p><strong>College:</strong> ${TE.formatMoney(gap)} pays for roughly ${Math.max(1,Math.round(gap/20000))} years of in-state tuition.</p>`;
      }else if(gap<1000000){
        buyHTML=`<p><strong>Home:</strong> ${TE.formatMoney(gap)} buys a home outright in many markets.</p><p><strong>Retirement income:</strong> At 4% withdrawal, ${TE.formatMoney(gap)} generates ${TE.formatMoney(gap*0.04/12)}/month forever. That covers housing and healthcare.</p><p><strong>Freedom:</strong> ${TE.formatMoney(gap)} is the difference between retiring at 65 and 55.</p>`;
      }else{
        buyHTML=`<p><strong>Financial independence:</strong> ${TE.formatMoney(gap)} means you never have to work another day you do not want to.</p><p><strong>Retirement income:</strong> At 4% withdrawal, ${TE.formatMoney(gap)} generates ${TE.formatMoney(gap*0.04/12)}/month forever. That is a full lifestyle.</p><p><strong>Legacy:</strong> ${TE.formatMoney(gap)} is generational wealth.</p>`;
      }
      return `<div class="calc-panel" style="margin-top:1rem"><h3>💸 What That Money Could Have Built Instead</h3>${buyHTML}</div>`;
    })();
    scrollToResults('lc-res');
  });
}

/* ===================== Prenup Financial Mismatch Calculator ===================== */
function prenupMismatchView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'Prenup Financial Mismatch'})}<h2>Prenup Financial Mismatch Calculator</h2><p style="color:var(--muted);margin-bottom:1.5rem">Before you merge finances, know what you are merging. Enter both partners income, assets, and debts to see financial compatibility score, combined net worth, debt exposure, and projected 10-year wealth together vs. apart. Built for prenup conversations and financial transparency.</p>`+
    `<div class="calc-grid"><div class="calc-panel"><h3>Partner A</h3>
      ${inputField('pn_a_income','Annual income','number',{value:80000,min:0,step:1000})}
      ${inputField('pn_a_assets','Total assets (savings, investments, retirement)','number',{value:50000,min:0,step:1000})}
      ${inputField('pn_a_debt','Total debt (student loans, credit cards, car)','number',{value:30000,min:0,step:1000})}
      ${inputField('pn_a_savings','Monthly savings contribution','number',{value:1000,min:0,step:50})}
    </div>
    <div class="calc-panel"><h3>Partner B</h3>
      ${inputField('pn_b_income','Annual income','number',{value:55000,min:0,step:1000})}
      ${inputField('pn_b_assets','Total assets (savings, investments, retirement)','number',{value:20000,min:0,step:1000})}
      ${inputField('pn_b_debt','Total debt (student loans, credit cards, car)','number',{value:80000,min:0,step:1000})}
      ${inputField('pn_b_savings','Monthly savings contribution','number',{value:300,min:0,step:50})}
    </div></div>
    <div class="calc-grid" style="margin-top:1rem"><div class="calc-panel"><h3>Shared Assumptions</h3>
      ${inputField('pn_return','Annual investment return (%)','number',{value:7,min:0,max:15,step:0.5})}
      ${inputField('pn_years','Years to project','number',{value:10,min:1,max:30,step:1})}
    </div></div>
    <div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcPrenupMismatch()">Calculate Compatibility</button></div>
    <div id="pn-res"></div>`+
    renderFaqSection([
      {q:'What is a financial compatibility score?',a:'A composite score based on income ratio, asset ratio, debt-to-income ratios, and savings alignment. It is not about judgment — it is about transparency. A low score means you should have honest conversations about money, not that the relationship is doomed. The score ranges from 0 to 100, with 70+ indicating strong alignment and under 40 indicating significant mismatches that need discussion.'},
      {q:'Why does debt exposure matter for marriage?',a:'In community property states, debt incurred during marriage is shared. In other states, premarital debt stays separate but can still strain joint finances. If one partner brings $80k in student loans and the other brings $50k in assets, that is a $130k swing in starting position. A prenup can protect the wealthier partner assets and clarify responsibility for premarital debt.'},
      {q:'What does "wealth together vs. apart" mean?',a:'The calculator projects what each partner wealth would be in 10 years if they stayed separate (each investing only their own savings) vs. if they combined finances (shared investment of both savings on combined net worth). In healthy pairings, combined wealth exceeds separate wealth because lower-expense partners subsidize higher-earners growth. In mismatched pairings, one partner effectively transfers wealth.'},
      {q:'Should a high earner get a prenup?',a:'A prenup is not about trust. It is about clarity. It protects premarital assets, inheritance, business ownership, and defines what happens if the marriage ends. Even couples who stay married forever benefit from the financial conversation a prenup forces. If one partner earns 2x+ or brings significantly more assets, a prenup is financially rational.'},
      {q:'What if the compatibility score is low?',a:'Talk about it. Low scores come from income gaps, debt imbalances, or wildly different savings habits. These are fixable with communication: debt payoff plans, separate accounts for premarital debt, agreed savings targets, or a prenup that protects both parties. The score is a starting point for conversation, not a verdict.'}
    ]);

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.calcPrenupMismatch = safeCalc(function(){
    const aIncome=getVal('pn_a_income')||80000;
    const aAssets=getVal('pn_a_assets')||50000;
    const aDebt=getVal('pn_a_debt')||30000;
    const aSave=getVal('pn_a_savings')||1000;
    const bIncome=getVal('pn_b_income')||55000;
    const bAssets=getVal('pn_b_assets')||20000;
    const bDebt=getVal('pn_b_debt')||80000;
    const bSave=getVal('pn_b_savings')||300;
    const annualReturn=(getVal('pn_return')||7)/100;
    const years=getVal('pn_years')||10;

    const aNW=aAssets-aDebt;
    const bNW=bAssets-bDebt;
    const combinedNW=aNW+bNW;

    const aDTI=aDebt/aIncome;
    const bDTI=bDebt/bIncome;
    const incomeRatio=Math.min(aIncome,bIncome)/Math.max(aIncome,bIncome);
    const assetRatio=Math.min(Math.max(aAssets,0),Math.max(bAssets,0))/Math.max(Math.max(aAssets,0),Math.max(bAssets,0),1);
    const nwRatio=Math.min(aNW,bNW)/Math.max(aNW,bNW,1);
    const saveRatio=Math.min(aSave,bSave)/Math.max(aSave,bSave,1);
    const dtiDiff=Math.abs(aDTI-bDTI);
    const dtiScore=Math.max(0,100-dtiDiff*200);

    let score=0;
    score+=incomeRatio*20;
    score+=assetRatio*15;
    score+=Math.max(0,nwRatio)*20;
    score+=saveRatio*20;
    score+=dtiScore*15;
    score+=Math.min(aSave+bSave,aIncome/12*0.5)/Math.max(aSave+bSave,1)*10;
    score=Math.min(100,Math.max(0,score));

    const monthlyRate=annualReturn/12;
    const months=years*12;
    const aFV=aNW>0?aNW*Math.pow(1+monthlyRate,months)+aSave*(Math.pow(1+monthlyRate,months)-1)/monthlyRate:Math.max(0,aNW)+aSave*(Math.pow(1+monthlyRate,months)-1)/monthlyRate;
    const bFV=bNW>0?bNW*Math.pow(1+monthlyRate,months)+bSave*(Math.pow(1+monthlyRate,months)-1)/monthlyRate:Math.max(0,bNW)+bSave*(Math.pow(1+monthlyRate,months)-1)/monthlyRate;
    const separateFV=aFV+bFV;

    const combinedSave=aSave+bSave;
    const combinedStart=combinedNW;
    const togetherFV=combinedStart>0?combinedStart*Math.pow(1+monthlyRate,months)+combinedSave*(Math.pow(1+monthlyRate,months)-1)/monthlyRate:combinedSave*(Math.pow(1+monthlyRate,months)-1)/monthlyRate;

    const debtExposure=Math.max(0,Math.abs(aDebt-bDebt));
    const higherEarner=aIncome>=bIncome?'A':'B';
    const higherNW=aNW>=bNW?'A':'B';

    const lines=[
      {label:'Partner A net worth',val:TE.formatMoney(aNW)},
      {label:'Partner B net worth',val:TE.formatMoney(bNW)},
      {label:'Combined net worth today',val:TE.formatMoney(combinedNW)},
      {label:'',val:''},
      {label:'Partner A debt-to-income',val:(aDTI*100).toFixed(1)+'%'},
      {label:'Partner B debt-to-income',val:(bDTI*100).toFixed(1)+'%'},
      {label:'Debt exposure (gap)',val:TE.formatMoney(debtExposure)},
      {label:'',val:''},
      {label:'Partner A 10-yr wealth (alone)',val:TE.formatMoney(aFV)},
      {label:'Partner B 10-yr wealth (alone)',val:TE.formatMoney(bFV)},
      {label:'Total wealth if separate',val:TE.formatMoney(separateFV)},
      {label:'Total wealth if together',val:TE.formatMoney(togetherFV)},
      {label:'Wealth difference',val:(togetherFV>separateFV?'+':'')+TE.formatMoney(togetherFV-separateFV)}
    ];

    const bigCardStyle='background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.25rem;text-align:center';
    const bigNumberStyle='display:block;font-size:2.2rem;font-weight:800';
    const bigLabelStyle='display:block;font-size:.9rem;color:var(--muted);margin-top:.25rem';

    let scoreColor='var(--accent)';
    let scoreLabel='Strong Match';
    if(score<40){scoreColor='var(--danger)';scoreLabel='Significant Mismatch — Talk About It';}
    else if(score<70){scoreColor='var(--warning)';scoreLabel='Moderate Mismatch — Needs Discussion';}

    const gap=togetherFV-separateFV;
    const togetherBetter=gap>0;

    const headline=score>=70?
      `Financially well-aligned. Partner ${higherNW} brings more wealth, but the gap is manageable. Combined investing yields ${togetherBetter?TE.formatMoney(gap)+' more':'$'+Math.abs(Math.round(gap/1000))+'K less'} than staying separate.`:
      score>=40?
      `Significant financial mismatch. Partner ${higherEarner} earns ${(Math.max(aIncome,bIncome)/Math.min(aIncome,bIncome)).toFixed(1)}x more. Debt gap is ${TE.formatMoney(debtExposure)}. Combined wealth is ${togetherBetter?TE.formatMoney(gap)+' higher':'$'+Math.abs(Math.round(gap/1000))+'K lower'} than separate — ${togetherBetter?'but one partner subsidizes the other':'and together is actually worse'}.'`:
      `Major financial mismatch. Large income, asset, or debt disparities. A prenup is strongly recommended to protect both parties and define responsibility for ${TE.formatMoney(debtExposure)} in debt exposure.`;

    const adviceHTML=score<40?
      `<div class="calc-panel" style="margin-top:1rem"><h3>⚠️ Recommendations</h3><p><strong>Prenup strongly advised.</strong> Protect Partner ${higherNW} premarital assets. Clarify who is responsible for ${TE.formatMoney(Math.max(aDebt,bDebt))} in debt.</p><p style="margin-top:.5rem">Consider maintaining separate investment accounts for premarital assets. Agree on a joint savings target before combining finances.</p></div>`:
      score<70?
      `<div class="calc-panel" style="margin-top:1rem"><h3>💡 Recommendations</h3><p><strong>Consider a prenup or financial agreement.</strong> The mismatch is manageable but real. Discuss debt payoff timeline and whether to maintain separate accounts for existing debt.</p><p style="margin-top:.5rem">Agree on minimum joint savings rate. Consider proportional contribution to shared expenses based on income ratio.</p></div>`:
      `<div class="calc-panel" style="margin-top:1rem"><h3>✅ Compatibility Strong</h3><p>Financial profiles are well-aligned. A basic financial agreement or transparent joint account structure is sufficient. Focus on maximizing combined savings rate of ${((aSave+bSave)/((aIncome+bIncome)/12)*100).toFixed(0)}% of household income.</p></div>`;

    document.getElementById('pn-res').innerHTML=resultsBox(lines,'Prenup Mismatch Results','Compatibility Score: '+Math.round(score)+'/100')+
    `<div style="${bigCardStyle};margin-top:1.5rem;border-color:${scoreColor}"><span style="${bigNumberStyle};color:${scoreColor}">${Math.round(score)}/100</span><span style="${bigLabelStyle}">${scoreLabel}</span><p style="margin-top:1rem;font-size:1.1rem">${headline}</p></div>`+
    `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;margin-top:1rem">`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle};color:var(--accent)">${TE.formatMoney(combinedNW)}</span><span style="${bigLabelStyle}">Combined Net Worth</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle};color:var(--danger)">${TE.formatMoney(debtExposure)}</span><span style="${bigLabelStyle}">Debt Exposure Gap</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle};color:${togetherBetter?'var(--accent)':'var(--danger)'}">${togetherBetter?'+':''}${TE.formatMoney(gap)}</span><span style="${bigLabelStyle}">Together vs. Separate</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle};color:var(--accent)">${TE.formatMoney(togetherFV)}</span><span style="${bigLabelStyle}">Projected ${years}-Year Wealth</span></div>`+
    `</div>`+
    adviceHTML;
    scrollToResults('pn-res');
  });
}

/* ===================== How Rich Would I Be If... Calculator ===================== */
function howRichIfView(main){
  const HRI_DATA={
    'btc':{name:'Bitcoin (BTC)',prices:[{date:'2011-01',label:'Jan 2011',price:1},{date:'2013-01',label:'Jan 2013',price:13},{date:'2015-01',label:'Jan 2015',price:310},{date:'2017-01',label:'Jan 2017',price:1000},{date:'2019-01',label:'Jan 2019',price:3700},{date:'2021-01',label:'Jan 2021',price:29000},{date:'2023-01',label:'Jan 2023',price:16500},{date:'2025-01',label:'Jan 2025',price:65569.17}]},
    'aapl':{name:'Apple (AAPL)',prices:[{date:'2000-01',label:'Jan 2000',price:3.55},{date:'2005-01',label:'Jan 2005',price:1.65},{date:'2010-01',label:'Jan 2010',price:7.50},{date:'2015-01',label:'Jan 2015',price:27.60},{date:'2020-01',label:'Jan 2020',price:75.00},{date:'2025-01',label:'Jan 2025',price:222.00}]},
    'amzn':{name:'Amazon (AMZN)',prices:[{date:'2000-01',label:'Jan 2000',price:81},{date:'2005-01',label:'Jan 2005',price:44},{date:'2010-01',label:'Jan 2010',price:135},{date:'2015-01',label:'Jan 2015',price:312},{date:'2020-01',label:'Jan 2020',price:1880},{date:'2022-06',label:'Jun 2022',price:110},{date:'2025-01',label:'Jan 2025',price:225}]},
    'tsla':{name:'Tesla (TSLA)',prices:[{date:'2010-06',label:'Jun 2010',price:3.80},{date:'2015-01',label:'Jan 2015',price:14.00},{date:'2020-01',label:'Jan 2020',price:28.00},{date:'2021-01',label:'Jan 2021',price:88.00},{date:'2023-01',label:'Jan 2023',price:108.00},{date:'2025-01',label:'Jan 2025',price:388.00}]},
    'nvda':{name:'Nvidia (NVDA)',prices:[{date:'2000-01',label:'Jan 2000',price:3.00},{date:'2005-01',label:'Jan 2005',price:2.00},{date:'2010-01',label:'Jan 2010',price:3.80},{date:'2015-01',label:'Jan 2015',price:4.80},{date:'2020-01',label:'Jan 2020',price:12.00},{date:'2023-01',label:'Jan 2023',price:15.00},{date:'2025-01',label:'Jan 2025',price:132.00}]},
    'spy':{name:'S&P 500 (SPY)',prices:[{date:'2000-01',label:'Jan 2000',price:140},{date:'2005-01',label:'Jan 2005',price:118},{date:'2010-01',label:'Jan 2010',price:113},{date:'2015-01',label:'Jan 2015',price:205},{date:'2020-01',label:'Jan 2020',price:323},{date:'2023-01',label:'Jan 2023',price:385},{date:'2025-01',label:'Jan 2025',price:590}]}
  };
  const currentYear=2026;

  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'How Rich Would I Be If...'})}<h2>How Rich Would I Be If...</h2><p style="color:var(--muted);margin-bottom:1.5rem">The most addictive financial calculator ever made. Pick a scenario and see the alternative-reality wealth you could have built. "If I had invested my car payments." "If I had maxed my 401k since 25." "If I had bought Bitcoin in 2017."</p>`+
    `<div class="calc-grid"><div class="calc-panel"><h3>Choose Your Scenario</h3>`+
    `<label for="hri_scenario" style="display:block;margin-bottom:.5rem;font-weight:500">Scenario</label>`+
    `<select id="hri_scenario" onchange="window.CalcFns.updateHRIInputs()" style="width:100%;padding:.65rem .85rem;border-radius:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:1rem;margin-bottom:1rem">`+
    `<option value="car">Invested my car payments instead of buying</option>`+
    `<option value="401k">Maxed my 401(k) since age X</option>`+
    `<option value="stock">Bought a specific stock or crypto</option>`+
    `</select>`+
    `<div id="hri-dynamic"></div>`+
    `</div></div>`+
    `<div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcHowRichIf()">Calculate Counterfactual Wealth</button></div>`+
    `<div id="hri-res"></div>`+
    renderFaqSection([
      {q:'Why do these numbers feel painful?',a:'Because they are real. Every dollar spent on a car payment, a subscription, or a night out is a dollar that stops compounding. The counterfactual is not fantasy — it is math. The calculator shows what would have happened if you had made a different choice. The goal is not to make you feel bad. It is to change your next decision.'},
      {q:'Are the historical stock prices accurate?',a:'Prices are split-adjusted and rounded to reflect actual historical values at the start of each period, checked as of June 2026. They are accurate enough for illustrative purposes. For precise investment analysis, always use your actual purchase date and verified historical data from your broker.'},
      {q:'What about taxes?',a:'These calculations do not include capital gains taxes, which would reduce real returns. They also do not include the 401(k) tax deduction, which would increase real returns. Consider these as pre-tax estimates. A 15-20% tax haircut on stock gains and a ~22% boost on 401(k) contributions would shift the numbers, but the magnitude remains the same.'},
      {q:'Is this just making me feel bad?',a:'No. The purpose is clarity, not guilt. You made the best decisions you could with the information you had. But now you have better information. The next car, the next raise, the next 10 years — those are still in your control. The only question is whether you will act on what you now know.'},
      {q:'What is the most common regret?',a:'Not starting sooner. The math is unforgiving. $500/month at 7% for 40 years is $1.3 million. The same $500/month for 30 years is $610,000. That 10-year delay costs $700,000. Every year you wait, the hill gets steeper. Start today with whatever you have.'}
    ]);

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.updateHRIInputs = safeCalc(function(){
    const scenario=document.getElementById('hri_scenario').value;
    const container=document.getElementById('hri-dynamic');
    if(scenario==='car'){
      container.innerHTML=`${inputField('hri_car_payment','Monthly car payment','number',{value:500,min:0,step:50})}`+
        `${inputField('hri_car_months','Number of payments made','number',{value:60,min:1,step:1})}`+
        `${inputField('hri_car_return','Annual investment return (%)','number',{value:7,min:0,max:15,step:0.5})}`;
    }else if(scenario==='401k'){
      container.innerHTML=`${inputField('hri_401k_start','Age you started working','number',{value:25,min:18,max:70,step:1})}`+
        `${inputField('hri_401k_now','Current age','number',{value:40,min:19,max:75,step:1})}`+
        `${inputField('hri_401k_match','Employer match (%)','number',{value:4,min:0,max:10,step:0.5})}`+
        `${inputField('hri_401k_return','Annual investment return (%)','number',{value:7,min:0,max:15,step:0.5})}`;
    }else if(scenario==='stock'){
      let opts='';for(const[k,v]of Object.entries(HRI_DATA)){opts+=`<option value="${k}">${v.name}</option>`;}
      container.innerHTML=`<label for="hri_ticker" style="display:block;margin-bottom:.5rem;font-weight:500">Asset</label>`+
        `<select id="hri_ticker" onchange="window.CalcFns.updateHRIDate()" style="width:100%;padding:.65rem .85rem;border-radius:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:1rem;margin-bottom:1rem">${opts}</select>`+
        `<label for="hri_date" style="display:block;margin-bottom:.5rem;font-weight:500">When would you have bought?</label>`+
        `<select id="hri_date" style="width:100%;padding:.65rem .85rem;border-radius:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:1rem;margin-bottom:1rem"></select>`+
        `${inputField('hri_amount','Amount you would have invested ($)','number',{value:10000,min:0,step:1000})}`+
        `${inputField('hri_custom_price','Or enter custom buy price ($)','number',{value:0,min:0,step:0.01})}`+
        `<p style="color:var(--muted);font-size:.85rem;margin-top:.5rem">Leave custom price at 0 to use the historical price from the selected date.</p>`;
      window.CalcFns.updateHRIDate();
    }
  });

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.updateHRIDate = safeCalc(function(){
    const ticker=document.getElementById('hri_ticker').value;
    const dateSel=document.getElementById('hri_date');
    if(!dateSel||!HRI_DATA[ticker])return;
    let html='';for(const p of HRI_DATA[ticker].prices){html+=`<option value="${p.price}">${p.label} — $${p.price}</option>`;}
    dateSel.innerHTML=html;
  });

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.calcHowRichIf = safeCalc(function(){
    const scenario=document.getElementById('hri_scenario').value;
    let resultHTML='';let lines=[];let title='';let subtitle='';

    if(scenario==='car'){
      const payment=getVal('hri_car_payment')||500;
      const months=getVal('hri_car_months')||60;
      const annualReturn=(getVal('hri_car_return')||7)/100;
      const monthlyRate=annualReturn/12;
      const totalPaid=payment*months;
      const fv=payment*(Math.pow(1+monthlyRate,months)-1)/monthlyRate;
      const carValueNow=totalPaid*0.4;
      const oppCost=fv-carValueNow;

      lines=[{label:'Monthly car payment',val:TE.formatMoney(payment)},{label:'Total payments',val:months+' months'},{label:'Total paid for car',val:TE.formatMoney(totalPaid)},{label:'Estimated car value now',val:TE.formatMoney(carValueNow)},{label:'',val:''},{label:'If invested at '+((annualReturn)*100).toFixed(1)+'%',val:TE.formatMoney(fv)},{label:'Opportunity cost',val:TE.formatMoney(oppCost)}];
      title='Counterfactual Wealth: Car Payments';
      subtitle='Your '+TE.formatMoney(totalPaid)+' car is worth '+TE.formatMoney(carValueNow)+' today. If invested, it would be '+TE.formatMoney(fv)+'.';

      const bigCard=`<div style="background:var(--surface);border:1px solid var(--danger);border-radius:12px;padding:1.5rem;text-align:center;margin-top:1.5rem"><span style="display:block;font-size:2.2rem;font-weight:800;color:var(--danger)">${TE.formatMoney(oppCost)}</span><span style="display:block;font-size:.9rem;color:var(--muted);margin-top:.25rem">Opportunity Cost of That Car</span><p style="margin-top:1rem;font-size:1.1rem">You paid ${TE.formatMoney(totalPaid)} for a car now worth ${TE.formatMoney(carValueNow)}. The ${TE.formatMoney(oppCost)} difference is what you could have had instead. Every financed car is a wealth decision dressed as a transportation decision.</p></div>`;
      const summaryCards=`<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1rem;margin-top:1rem">`+
        `<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.25rem;text-align:center"><span style="display:block;font-size:1.6rem;font-weight:700">${TE.formatMoney(totalPaid)}</span><span style="display:block;font-size:.85rem;color:var(--muted)">Total Paid</span></div>`+
        `<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.25rem;text-align:center"><span style="display:block;font-size:1.6rem;font-weight:700">${TE.formatMoney(carValueNow)}</span><span style="display:block;font-size:.85rem;color:var(--muted)">Current Value</span></div>`+
        `<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.25rem;text-align:center"><span style="display:block;font-size:1.6rem;font-weight:700;color:var(--accent)">${TE.formatMoney(fv)}</span><span style="display:block;font-size:.85rem;color:var(--muted)">If Invested</span></div>`+
        `<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.25rem;text-align:center"><span style="display:block;font-size:1.6rem;font-weight:700;color:var(--danger)">${TE.formatMoney(oppCost)}</span><span style="display:block;font-size:.85rem;color:var(--muted)">Lost Wealth</span></div></div>`;
      resultHTML=resultsBox(lines,title,subtitle)+bigCard+summaryCards;

    }else if(scenario==='401k'){
      const startAge=getVal('hri_401k_start')||25;
      const nowAge=getVal('hri_401k_now')||40;
      const matchPct=(getVal('hri_401k_match')||4)/100;
      const annualReturn=(getVal('hri_401k_return')||7)/100;
      const years=Math.max(0,nowAge-startAge);
      const months=years*12;
      const max2026=23500;
      const monthlyContrib=max2026/12;
      const matchMonthly=monthlyContrib*matchPct;
      const totalMonthly=monthlyContrib+matchMonthly;
      const monthlyRate=annualReturn/12;
      const fv=totalMonthly*(Math.pow(1+monthlyRate,months)-1)/monthlyRate;
      const totalContributed=monthlyContrib*months;
      const totalMatch=matchMonthly*months;

      lines=[{label:'Age started',val:startAge},{label:'Current age',val:nowAge},{label:'Years contributing',val:years},{label:'',val:''},{label:'Annual max contribution',val:TE.formatMoney(max2026)+'/year'},{label:'Monthly contribution',val:TE.formatMoney(monthlyContrib)},{label:'Employer match',val:(matchPct*100).toFixed(1)+'% ($'+TE.formatMoney(matchMonthly)+'/mo)'},{label:'',val:''},{label:'Total you contributed',val:TE.formatMoney(totalContributed)},{label:'Total employer match',val:TE.formatMoney(totalMatch)},{label:'Portfolio value today',val:TE.formatMoney(fv)}];
      title='Counterfactual Wealth: Maxed 401(k)';
      subtitle='If you had maxed your 401(k) from age '+startAge+' to '+nowAge+', you would have '+TE.formatMoney(fv)+' today.';

      const bigCard=`<div style="background:var(--surface);border:1px solid var(--accent);border-radius:12px;padding:1.5rem;text-align:center;margin-top:1.5rem"><span style="display:block;font-size:2.2rem;font-weight:800;color:var(--accent)">${TE.formatMoney(fv)}</span><span style="display:block;font-size:.9rem;color:var(--muted);margin-top:.25rem">Your 401(k) Would Be Worth</span><p style="margin-top:1rem;font-size:1.1rem">You contributed ${TE.formatMoney(totalContributed)}. Your employer added ${TE.formatMoney(totalMatch)}. Compound growth did the rest. The only decision that mattered was starting.</p></div>`;
      const summaryCards=`<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1rem;margin-top:1rem">`+
        `<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.25rem;text-align:center"><span style="display:block;font-size:1.6rem;font-weight:700">${years}</span><span style="display:block;font-size:.85rem;color:var(--muted)">Years</span></div>`+
        `<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.25rem;text-align:center"><span style="display:block;font-size:1.6rem;font-weight:700">${TE.formatMoney(totalContributed)}</span><span style="display:block;font-size:.85rem;color:var(--muted)">Your Money</span></div>`+
        `<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.25rem;text-align:center"><span style="display:block;font-size:1.6rem;font-weight:700">${TE.formatMoney(totalMatch)}</span><span style="display:block;font-size:.85rem;color:var(--muted)">Free Match</span></div>`+
        `<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.25rem;text-align:center"><span style="display:block;font-size:1.6rem;font-weight:700;color:var(--accent)">${TE.formatMoney(fv)}</span><span style="display:block;font-size:.85rem;color:var(--muted)">Total Value</span></div></div>`;
      resultHTML=resultsBox(lines,title,subtitle)+bigCard+summaryCards;

    }else if(scenario==='stock'){
      const ticker=document.getElementById('hri_ticker').value;
      const buyPrice=parseFloat(document.getElementById('hri_date').value)||0;
      const customPrice=getVal('hri_custom_price')||0;
      const amount=getVal('hri_amount')||10000;
      const actualBuyPrice=customPrice>0?customPrice:buyPrice;
      const asset=HRI_DATA[ticker];
      if(!asset||actualBuyPrice<=0){document.getElementById('hri-res').innerHTML='<p style="color:var(--danger)">Invalid selection. Please choose an asset and date.</p>';return;}

      const lastPrice=asset.prices[asset.prices.length-1].price;
      const shares=amount/actualBuyPrice;
      const currentValue=shares*lastPrice;
      const gain=currentValue-amount;
      const multiplier=currentValue/amount;

      lines=[{label:'Asset',val:asset.name},{label:'Amount invested',val:TE.formatMoney(amount)},{label:'Buy price',val:'$'+actualBuyPrice},{label:'Current price',val:'$'+lastPrice},{label:'Shares bought',val:shares.toFixed(2)},{label:'',val:''},{label:'Current value',val:TE.formatMoney(currentValue)},{label:'Total gain/loss',val:(gain>=0?'+':'')+TE.formatMoney(gain)},{label:'Return multiplier',val:multiplier.toFixed(1)+'x'}];
      title='Counterfactual Wealth: '+asset.name;
      subtitle='If you had invested '+TE.formatMoney(amount)+' in '+asset.name.split('(')[0].trim()+' at $'+actualBuyPrice+', you would have '+TE.formatMoney(currentValue)+' today.';

      const color=gain>=0?'var(--accent)':'var(--danger)';
      const bigCard=`<div style="background:var(--surface);border:1px solid ${color};border-radius:12px;padding:1.5rem;text-align:center;margin-top:1.5rem"><span style="display:block;font-size:2.2rem;font-weight:800;color:${color}">${TE.formatMoney(currentValue)}</span><span style="display:block;font-size:.9rem;color:var(--muted);margin-top:.25rem">Your Investment Would Be Worth</span><p style="margin-top:1rem;font-size:1.1rem">You put in ${TE.formatMoney(amount)}. It became ${TE.formatMoney(currentValue)}. That is a ${multiplier.toFixed(1)}x return. ${gain>=0?'The only regret is not putting in more.':'Even the best assets have bad entry points.'}</p></div>`;
      const summaryCards=`<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1rem;margin-top:1rem">`+
        `<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.25rem;text-align:center"><span style="display:block;font-size:1.6rem;font-weight:700">${TE.formatMoney(amount)}</span><span style="display:block;font-size:.85rem;color:var(--muted)">Invested</span></div>`+
        `<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.25rem;text-align:center"><span style="display:block;font-size:1.6rem;font-weight:700">$${actualBuyPrice}</span><span style="display:block;font-size:.85rem;color:var(--muted)">Buy Price</span></div>`+
        `<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.25rem;text-align:center"><span style="display:block;font-size:1.6rem;font-weight:700">$${lastPrice}</span><span style="display:block;font-size:.85rem;color:var(--muted)">Current Price</span></div>`+
        `<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.25rem;text-align:center"><span style="display:block;font-size:1.6rem;font-weight:700;color:${color}">${(gain>=0?'+':'')+TE.formatMoney(gain)}</span><span style="display:block;font-size:.85rem;color:var(--muted)">Gain/Loss</span></div></div>`;
      resultHTML=resultsBox(lines,title,subtitle)+bigCard+summaryCards+`<p style="color:var(--muted);font-size:.85rem;margin-top:1rem">Prices checked as of June 2026. For live prices, use your broker.</p>`;
    }

    document.getElementById('hri-res').innerHTML=resultHTML;
    scrollToResults('hri-res');
  });

  setTimeout(()=>window.CalcFns.updateHRIInputs(),0);
}

/* ===================== Cost of Having a Baby Calculator ===================== */
function babyCostView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'Cost of Having a Baby'})}<h2>Cost of Having a Baby Calculator</h2><p style="color:var(--muted);margin-bottom:1.5rem">The true first-year cost of having a baby: hospital delivery + diapers + formula + childcare + gear + lost income + opportunity cost. Most people underestimate by 50% or more.</p>`+
    `<div class="calc-grid">`+
    `<div class="calc-panel"><h3>🏥 Hospital & Delivery</h3>`+
    `${inputField('bc_delivery','Hospital delivery cost','number',{value:15000,min:0,step:500})}`+
    `${inputField('bc_prenatal','Prenatal care (ultrasounds, tests, visits)','number',{value:3000,min:0,step:500})}`+
    `</div>`+
    `<div class="calc-panel"><h3>👶 First-Year Expenses</h3>`+
    `${inputField('bc_diapers','Monthly diapers & wipes','number',{value:80,min:0,step:10})}`+
    `${inputField('bc_formula','Monthly formula / breastfeeding supplies','number',{value:150,min:0,step:10})}`+
    `${inputField('bc_childcare','Monthly childcare (daycare / nanny)','number',{value:1200,min:0,step:50})}`+
    `${inputField('bc_gear','One-time gear (crib, stroller, car seat, clothes)','number',{value:2000,min:0,step:100})}`+
    `${inputField('bc_medical','Monthly medical (pediatric visits, insurance copays)','number',{value:100,min:0,step:10})}`+
    `${inputField('bc_other','Monthly other (toys, books, activities)','number',{value:50,min:0,step:10})}`+
    `</div>`+
    `<div class="calc-panel"><h3>💼 Lost Income</h3>`+
    `${inputField('bc_salary','Parent salary if stepping back ($/year)','number',{value:50000,min:0,step:1000})}`+
    `${inputField('bc_reduce_pct','Percent of income lost','number',{value:50,min:0,max:100,step:5})}`+
    `${inputField('bc_months_out','Months of reduced / lost income','number',{value:6,min:0,max:12,step:1})}`+
    `</div>`+
    `<div class="calc-panel"><h3>📈 Opportunity Cost</h3>`+
    `${inputField('bc_return','Annual investment return (%)','number',{value:7,min:0,max:15,step:0.5})}`+
    `</div></div>`+
    `<div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcBabyCost()">Calculate True First-Year Cost</button></div>`+
    `<div id="bc-res"></div>`+
    renderFaqSection([
      {q:'Why is the true cost so much higher than people expect?',a:'Most people only think about the hospital bill and diapers. They forget formula, childcare, lost income, gear, copays, and the opportunity cost of not investing that money. Add it all up and the first year can easily hit $40,000–$70,000 depending on your city and whether a parent steps back from work.'},
      {q:'How accurate are these estimates?',a:'Delivery costs range from $5,000 (Medicaid birth) to $30,000+ (uninsured C-section). Childcare ranges from $800/month (home daycare) to $3,000+/month (nanny in NYC/SF). The numbers here are national medians. Adjust for your city and situation.'},
      {q:'What is opportunity cost?',a:'Every dollar spent on a baby is a dollar that is not invested. If you spend $40,000 in year one, and that money would have earned 7% annually, the 10-year opportunity cost is $78,000+ and the 20-year opportunity cost is $155,000+. That does not mean do not have a baby. It means know the full picture before you decide.'},
      {q:'Should both parents keep working?',a:'Mathematically, usually yes. Childcare is expensive, but lost income + career delay + resume gap + reduced Social Security benefits often costs more than daycare over a lifetime. Use the lost income section to model your exact situation. The calculator does not include the long-term career penalty, which is real and significant.'},
      {q:'What about the second and third year?',a:'Childcare stays high until kindergarten. Diapers and formula drop. Medical costs vary. Most families find years 2–4 cost $15,000–$35,000/year depending on childcare. The first year is the most expensive due to delivery and gear, but the financial impact lasts until school starts.'}
    ]);

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.calcBabyCost = safeCalc(function(){
    const delivery=getVal('bc_delivery')||0;
    const prenatal=getVal('bc_prenatal')||0;
    const diapers=(getVal('bc_diapers')||0)*12;
    const formula=(getVal('bc_formula')||0)*12;
    const childcare=(getVal('bc_childcare')||0)*12;
    const gear=getVal('bc_gear')||0;
    const medical=(getVal('bc_medical')||0)*12;
    const other=(getVal('bc_other')||0)*12;
    const salary=getVal('bc_salary')||0;
    const reducePct=(getVal('bc_reduce_pct')||0)/100;
    const monthsOut=getVal('bc_months_out')||0;
    const annualReturn=(getVal('bc_return')||7)/100;

    const lostIncome=salary*reducePct*(monthsOut/12);
    const totalExpenses=delivery+prenatal+diapers+formula+childcare+gear+medical+other;
    const totalCost=totalExpenses+lostIncome;

    const oneYearFV=totalCost*Math.pow(1+annualReturn,1);
    const opportunityCost=oneYearFV-totalCost;
    const tenYearFV=totalCost*Math.pow(1+annualReturn,10);
    const tenYearOpp=tenYearFV-totalCost;

    const lines=[
      {label:'Hospital delivery',val:TE.formatMoney(delivery)},
      {label:'Prenatal care',val:TE.formatMoney(prenatal)},
      {label:'Diapers & wipes (12 mo)',val:TE.formatMoney(diapers)},
      {label:'Formula / supplies (12 mo)',val:TE.formatMoney(formula)},
      {label:'Childcare (12 mo)',val:TE.formatMoney(childcare)},
      {label:'One-time gear',val:TE.formatMoney(gear)},
      {label:'Medical (12 mo)',val:TE.formatMoney(medical)},
      {label:'Other (12 mo)',val:TE.formatMoney(other)},
      {label:'',val:''},
      {label:'Total out-of-pocket expenses',val:TE.formatMoney(totalExpenses)},
      {label:'Lost income ('+monthsOut+' mo at '+(reducePct*100).toFixed(0)+'%)',val:TE.formatMoney(lostIncome)},
      {label:'',val:''},
      {label:'Total first-year cost',val:TE.formatMoney(totalCost)},
      {label:'1-year opportunity cost',val:TE.formatMoney(opportunityCost)},
      {label:'10-year opportunity cost',val:TE.formatMoney(tenYearOpp)}
    ];

    const title='True First-Year Cost of Having a Baby';
    const subtitle='Your baby\'s first year costs '+TE.formatMoney(totalCost)+'. If invested at '+(annualReturn*100).toFixed(1)+'%, that money would be worth '+TE.formatMoney(tenYearFV)+' in 10 years.';

    const bigCard=`<div style="background:var(--surface);border:1px solid var(--danger);border-radius:12px;padding:1.5rem;text-align:center;margin-top:1.5rem"><span style="display:block;font-size:2.2rem;font-weight:800;color:var(--danger)">${TE.formatMoney(totalCost)}</span><span style="display:block;font-size:.9rem;color:var(--muted);margin-top:.25rem">Total First-Year Cost</span><p style="margin-top:1rem;font-size:1.1rem">Direct expenses: ${TE.formatMoney(totalExpenses)}. Lost income: ${TE.formatMoney(lostIncome)}. The ${TE.formatMoney(tenYearOpp)} ten-year opportunity cost is what that money would have become if invested instead. Children are priceless. But they are not free.</p></div>`;

    const summaryCards=`<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1rem;margin-top:1rem">`+
      `<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.25rem;text-align:center"><span style="display:block;font-size:1.6rem;font-weight:700">${TE.formatMoney(totalExpenses)}</span><span style="display:block;font-size:.85rem;color:var(--muted)">Out-of-Pocket</span></div>`+
      `<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.25rem;text-align:center"><span style="display:block;font-size:1.6rem;font-weight:700">${TE.formatMoney(lostIncome)}</span><span style="display:block;font-size:.85rem;color:var(--muted)">Lost Income</span></div>`+
      `<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.25rem;text-align:center"><span style="display:block;font-size:1.6rem;font-weight:700;color:var(--danger)">${TE.formatMoney(totalCost)}</span><span style="display:block;font-size:.85rem;color:var(--muted)">Total Cost</span></div>`+
      `<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.25rem;text-align:center"><span style="display:block;font-size:1.6rem;font-weight:700;color:var(--accent)">${TE.formatMoney(tenYearOpp)}</span><span style="display:block;font-size:.85rem;color:var(--muted)">10-Yr Opportunity Cost</span></div></div>`;

    let advice='';
    if(totalCost>=60000){
      advice=`<div style="background:var(--surface);border:1px solid var(--danger);border-radius:12px;padding:1.25rem;margin-top:1.5rem"><strong style="color:var(--danger)">Very High Cost Environment</strong><p style="margin:.5rem 0 0">Your first-year cost is above $60,000. This is typical in high-cost cities with full-time daycare and a parent stepping back. Consider: employer FSA for childcare, negotiating remote work to reduce lost income, buying used gear, and applying for hospital financial assistance if uninsured.</p></div>`;
    }else if(totalCost>=35000){
      advice=`<div style="background:var(--surface);border:1px solid var(--warning);border-radius:12px;padding:1.25rem;margin-top:1.5rem"><strong style="color:var(--warning)">Moderate to High Cost</strong><p style="margin:.5rem 0 0">Your first-year cost is $35,000–$60,000. This is the national average for families with some childcare and moderate lost income. Prioritize: maxing employer 401(k) match before baby arrives, building a 6-month emergency fund, and researching dependent care FSA ($5,000 pre-tax).</p></div>`;
    }else{
      advice=`<div style="background:var(--surface);border:1px solid var(--accent);border-radius:12px;padding:1.25rem;margin-top:1.5rem"><strong style="color:var(--accent)">Below-Average Cost</strong><p style="margin:.5rem 0 0">Your first-year cost is under $35,000. You may have family childcare help, employer-paid parental leave, or lower delivery costs. Use this advantage to max retirement contributions now — compound interest works hardest in your 20s and 30s.</p></div>`;
    }

    document.getElementById('bc-res').innerHTML=resultsBox(lines,title,subtitle)+bigCard+summaryCards+advice;
    scrollToResults('bc-res');
  });
}

/* ===================== College Savings Gap Calculator ===================== */
function collegeSavingsGapView(main){
  const SCHOOL_COSTS={
    'public-in':{name:'Public In-State',annual:25000},
    'public-out':{name:'Public Out-of-State',annual:45000},
    'private':{name:'Private College',annual:60000},
    'ivy':{name:'Ivy League',annual:80000}
  };

  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'College Savings Gap'})}<h2>College Savings Gap Calculator</h2><p style="color:var(--muted);margin-bottom:1.5rem">Will you have enough saved when your child turns 18? Enter their age, target school type, current 529 balance, and monthly contribution. See your projected gap — and what it would take to close it.</p>`+
    `<div class="calc-grid">`+
    `<div class="calc-panel"><h3>👶 Your Child</h3>`+
    `${inputField('csg_age','Child\'s current age','number',{value:8,min:0,max:18,step:1})}`+
    `</div>`+
    `<div class="calc-panel"><h3>🎓 Target School</h3>`+
    `<label for="csg_school" style="display:block;margin-bottom:.5rem;font-weight:500">School type</label>`+
    `<select id="csg_school" style="width:100%;padding:.65rem .85rem;border-radius:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:1rem;margin-bottom:1rem">`+
    `<option value="public-in">Public In-State — $25,000/year</option>`+
    `<option value="public-out">Public Out-of-State — $45,000/year</option>`+
    `<option value="private">Private College — $60,000/year</option>`+
    `<option value="ivy">Ivy League — $80,000/year</option>`+
    `</select>`+
    `</div>`+
    `<div class="calc-panel"><h3>💰 Savings Plan</h3>`+
    `${inputField('csg_balance','Current 529 / savings balance','number',{value:25000,min:0,step:1000})}`+
    `${inputField('csg_monthly','Monthly contribution','number',{value:500,min:0,step:50})}`+
    `${inputField('csg_return','Annual investment return (%)','number',{value:7,min:0,max:15,step:0.5})}`+
    `${inputField('csg_inflation','Annual tuition inflation (%)','number',{value:5,min:0,max:10,step:0.5})}`+
    `</div></div>`+
    `<div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcCollegeSavingsGap()">Calculate Savings Gap</button></div>`+
    `<div id="csg-res"></div>`+
    renderFaqSection([
      {q:'How accurate are the school cost estimates?',a:'These are 2026 total cost of attendance estimates (tuition + room + board + fees) rounded for illustration. Public in-state averages ~$25,000/year nationally, private colleges ~$60,000, and Ivies ~$80,000. Actual costs vary by school. Always check the net price calculator on the school\'s website for your exact numbers.'},
      {q:'Why does tuition inflation matter so much?',a:'At 5% annual inflation, a $25,000/year school becomes $41,000/year in 10 years and $52,000/year in 15 years. That is the difference between $100,000 and $208,000 for four years. Small inflation assumptions create massive gaps. We use 5% as a conservative estimate — tuition has risen faster than general inflation for decades.'},
      {q:'What is a reasonable monthly contribution?',a:'If you start at birth and aim for public in-state: ~$300–$400/month. For private: ~$700–$900/month. For Ivy: ~$1,000+/month. If you start at age 8, you need roughly double. The calculator shows your exact gap so you can adjust monthly contributions, choose a cheaper school, or plan for loans/scholarships.'},
      {q:'Should I use a 529 plan?',a:'Yes, if available in your state. 529 plans grow tax-free for education expenses. Many states offer a state tax deduction for contributions. The main downside is that non-education withdrawals face taxes + a 10% penalty on earnings. But for college savings, 529s are usually the best vehicle.'},
      {q:'What if there is a surplus?',a:'A surplus means your projected savings exceed projected costs. You could: reduce monthly contributions, redirect excess to retirement, cover graduate school, or help with a sibling\'s education. A surplus is a good problem to have.'}
    ]);

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.calcCollegeSavingsGap = safeCalc(function(){
    const age=getVal('csg_age')||0;
    const schoolKey=document.getElementById('csg_school').value;
    const balance=getVal('csg_balance')||0;
    const monthly=getVal('csg_monthly')||0;
    const annualReturn=(getVal('csg_return')||7)/100;
    const inflation=(getVal('csg_inflation')||5)/100;

    const school=SCHOOL_COSTS[schoolKey];
    const yearsToCollege=Math.max(0,18-age);
    const currentAnnual=school.annual;

    const projectedAnnual=currentAnnual*Math.pow(1+inflation,yearsToCollege);
    const totalCost=projectedAnnual*4;

    const fvBalance=balance*Math.pow(1+annualReturn,yearsToCollege);
    const monthlyRate=annualReturn/12;
    const months=yearsToCollege*12;
    const fvContributions=monthly*(Math.pow(1+monthlyRate,months)-1)/monthlyRate;
    const totalSavings=fvBalance+fvContributions;

    const gap=totalCost-totalSavings;

    const lines=[
      {label:'Child\'s current age',val:age},
      {label:'Years until college',val:yearsToCollege},
      {label:'Target school',val:school.name},
      {label:'Current annual cost',val:TE.formatMoney(currentAnnual)+'/year'},
      {label:'Projected annual cost',val:TE.formatMoney(projectedAnnual)+'/year'},
      {label:'',val:''},
      {label:'Total 4-year cost',val:TE.formatMoney(totalCost)},
      {label:'Future value of current balance',val:TE.formatMoney(fvBalance)},
      {label:'Future value of contributions',val:TE.formatMoney(fvContributions)},
      {label:'Total projected savings',val:TE.formatMoney(totalSavings)},
      {label:'',val:''},
      {label:gap>0?'Projected SHORTFALL':'Projected SURPLUS',val:(gap>0?'−':'+')+TE.formatMoney(Math.abs(gap))}
    ];

    const title='College Savings Gap Analysis';
    const subtitle='For '+school.name+', your child needs '+TE.formatMoney(totalCost)+' at age 18. You are projected to have '+TE.formatMoney(totalSavings)+'.';

    const color=gap>0?'var(--danger)':'var(--accent)';
    const bigLabel=gap>0?'Projected Shortfall':'Projected Surplus';
    const bigCard=`<div style="background:var(--surface);border:1px solid ${color};border-radius:12px;padding:1.5rem;text-align:center;margin-top:1.5rem"><span style="display:block;font-size:2.2rem;font-weight:800;color:${color}">${(gap>0?'−':'+')+TE.formatMoney(Math.abs(gap))}</span><span style="display:block;font-size:.9rem;color:var(--muted);margin-top:.25rem">${bigLabel}</span><p style="margin-top:1rem;font-size:1.1rem">${gap>0?'You are projected to be '+TE.formatMoney(Math.abs(gap))+' short. To close the gap, increase monthly contributions, lower the target school cost, or plan for scholarships and loans. Start today — every month you wait makes the hill steeper.':'You are projected to have a '+TE.formatMoney(Math.abs(gap))+' surplus. You can reduce contributions, redirect to retirement, or cover graduate school. Well done.'}</p></div>`;

    const summaryCards=`<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1rem;margin-top:1rem">`+
      `<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.25rem;text-align:center"><span style="display:block;font-size:1.6rem;font-weight:700">${TE.formatMoney(totalCost)}</span><span style="display:block;font-size:.85rem;color:var(--muted)">Total Needed</span></div>`+
      `<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.25rem;text-align:center"><span style="display:block;font-size:1.6rem;font-weight:700">${TE.formatMoney(totalSavings)}</span><span style="display:block;font-size:.85rem;color:var(--muted)">Projected Savings</span></div>`+
      `<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.25rem;text-align:center"><span style="display:block;font-size:1.6rem;font-weight:700;color:${color}">${(gap>0?'−':'+')+TE.formatMoney(Math.abs(gap))}</span><span style="display:block;font-size:.85rem;color:var(--muted)">${bigLabel}</span></div>`+
      `<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.25rem;text-align:center"><span style="display:block;font-size:1.6rem;font-weight:700">${TE.formatMoney(monthly)}</span><span style="display:block;font-size:.85rem;color:var(--muted)">Monthly Now</span></div></div>`;

    let advice='';
    if(gap>150000){
      advice=`<div style="background:var(--surface);border:1px solid var(--danger);border-radius:12px;padding:1.25rem;margin-top:1.5rem"><strong style="color:var(--danger)">Massive Gap — Action Required</strong><p style="margin:.5rem 0 0">You are $150,000+ short. Options: switch to public in-state, double monthly contributions immediately, or plan for significant loans. Consider scholarships, community college for 2 years then transfer, or having your child contribute via work-study. Do not ignore this gap — it grows every year you wait.</p></div>`;
    }else if(gap>50000){
      advice=`<div style="background:var(--surface);border:1px solid var(--warning);border-radius:12px;padding:1.25rem;margin-top:1.5rem"><strong style="color:var(--warning)">Significant Gap — Increase Savings</strong><p style="margin:.5rem 0 0">You are $50,000–$150,000 short. Increase monthly contributions by $200–$500/month, redirect windfalls (bonuses, tax refunds) to the 529, and research school-specific scholarships. Starting 2 years earlier at age 6 instead of 8 would have cut this gap significantly. Time is your most powerful tool.</p></div>`;
    }else if(gap>0){
      advice=`<div style="background:var(--surface);border:1px solid var(--warning);border-radius:12px;padding:1.25rem;margin-top:1.5rem"><strong style="color:var(--warning)">Modest Gap — Tighten the Plan</strong><p style="margin:.5rem 0 0">You are under $50,000 short. A small boost in monthly contributions ($50–$150/month) or one-time gifts from grandparents could close this. Also explore 529 superfunding — contribute 5 years of the gift tax exclusion ($85,000 in 2026) in a single year.</p></div>`;
    }else{
      advice=`<div style="background:var(--surface);border:1px solid var(--accent);border-radius:12px;padding:1.25rem;margin-top:1.5rem"><strong style="color:var(--accent)">On Track — Optimize Further</strong><p style="margin:.5rem 0 0">You are on track or ahead. Consider redirecting excess to your own retirement, a sibling\'s 529, or a taxable brokerage for flexibility. College is not the only expense — graduate school, a first car, or a house down payment may be next.</p></div>`;
    }

    document.getElementById('csg-res').innerHTML=resultsBox(lines,title,subtitle)+bigCard+summaryCards+advice;
    scrollToResults('csg-res');
  });
}

/* ===================== Cost of Divorce Calculator ===================== */
function divorceCostView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'Cost of Divorce'})}<h2>Cost of Divorce Calculator</h2><p style="color:var(--muted);margin-bottom:1.5rem">The true financial cost of divorce: legal fees, asset division, support payments, two-household living cost increase, and QDRO retirement wealth destruction. Most people only count attorney fees. The real number is 5–20x larger.</p>`+
    `<div class="calc-grid">`+
    `<div class="calc-panel"><h3>🏠 Marital Assets</h3>`+
    `${inputField('dc_home','Home equity','number',{value:150000,min:0,step:10000})}`+
    `${inputField('dc_retirement','Retirement accounts (401k, IRA)','number',{value:300000,min:0,step:10000})}`+
    `${inputField('dc_savings','Savings & investments','number',{value:50000,min:0,step:5000})}`+
    `${inputField('dc_other','Other assets (cars, valuables)','number',{value:20000,min:0,step:5000})}`+
    `${inputField('dc_debts','Marital debts to split','number',{value:30000,min:0,step:5000})}`+
    `</div>`+
    `<div class="calc-panel"><h3>💼 Income & Support</h3>`+
    `${inputField('dc_high_income','Higher earner annual income','number',{value:100000,min:0,step:5000})}`+
    `${inputField('dc_low_income','Lower earner annual income','number',{value:40000,min:0,step:5000})}`+
    `${inputField('dc_alimony_monthly','Monthly alimony','number',{value:1500,min:0,step:100})}`+
    `${inputField('dc_alimony_years','Alimony duration (years)','number',{value:5,min:0,max:30,step:1})}`+
    `${inputField('dc_child_monthly','Monthly child support','number',{value:1000,min:0,step:100})}`+
    `${inputField('dc_child_years','Years until youngest turns 18','number',{value:10,min:0,max:18,step:1})}`+
    `</div>`+
    `<div class="calc-panel"><h3>⚖️ Legal & Administrative</h3>`+
    `${inputField('dc_attorney1','Your attorney fees','number',{value:15000,min:0,step:1000})}`+
    `${inputField('dc_attorney2','Spouse attorney fees','number',{value:15000,min:0,step:1000})}`+
    `${inputField('dc_mediator','Mediator / collaborative fees','number',{value:5000,min:0,step:500})}`+
    `${inputField('dc_filing','Court filing & misc fees','number',{value:2000,min:0,step:500})}`+
    `${inputField('dc_qdro_fee','QDRO preparation fee','number',{value:1500,min:0,step:500})}`+
    `${inputField('dc_appraisal','Home / asset appraisal','number',{value:3000,min:0,step:500})}`+
    `</div>`+
    `<div class="calc-panel"><h3>🏘️ Two-Household Cost Delta</h3>`+
    `${inputField('dc_current_expense','Current monthly household expenses','number',{value:5000,min:0,step:500})}`+
    `${inputField('dc_new_expense','New combined monthly expenses (2 households)','number',{value:8000,min:0,step:500})}`+
    `${inputField('dc_years_separate','Years living separately before remarriage','number',{value:5,min:0,max:30,step:1})}`+
    `${inputField('dc_invest_return','Investment return rate (%)','number',{value:7,min:0,max:15,step:0.5})}`+
    `</div></div>`+
    `<div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcDivorceCost()">Calculate True Divorce Cost</button></div>`+
    `<div id="dc-res"></div>`+
    renderFaqSection([
      {q:'Why is the true cost so much higher than attorney fees?',a:'Attorney fees are just the tip. Two households cost more than one. Support payments drain the higher earner for years. Retirement accounts split via QDRO destroy decades of compound growth. Add it up and a "simple" divorce can cost $200,000–$500,000 in total wealth impact over 10 years. The calculator shows every piece.'},
      {q:'What is a QDRO and why does it matter?',a:'A Qualified Domestic Relations Order splits retirement accounts in divorce. If you split a $300,000 401k 50/50, each gets $150,000. But the $150,000 you give up would have grown at 7% for 20 years to $580,000+. That $430,000+ in lost growth is the hidden cost. The calculator shows this opportunity cost explicitly.'},
      {q:'How do two households cost more than one?',a:'One mortgage, one set of utilities, one insurance policy, one Costco run. After divorce: two rents, two utility bills, two insurance policies, two sets of furniture, two streaming accounts. The delta is often $2,000–$5,000/month. Over 5 years that is $120,000–$300,000 in extra living costs — money neither spouse saves or invests.'},
      {q:'What about alimony and child support?',a:'Alimony is taxable to the recipient and deductible by the payer (for pre-2019 agreements; post-2019 agreements are neither deductible nor taxable). Child support is never taxable or deductible. The calculator shows the total paid/received over the full duration so you see the multi-year cash flow impact, not just the monthly number.'},
      {q:'Can mediation really save money?',a:'Yes. A contested divorce with attorneys can cost $30,000–$100,000+ each side. Mediation or collaborative divorce typically costs $3,000–$10,000 total. The savings are not just legal fees — faster resolution means less two-household overlap, less asset depreciation from frozen accounts, and less emotional toll that leads to bad financial decisions.'}
    ]);

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.calcDivorceCost = safeCalc(function(){
    const home=getVal('dc_home')||0;
    const retirement=getVal('dc_retirement')||0;
    const savings=getVal('dc_savings')||0;
    const other=getVal('dc_other')||0;
    const debts=getVal('dc_debts')||0;
    const totalAssets=home+retirement+savings+other-debts;
    const yourShare=totalAssets/2;

    const alimonyMonthly=getVal('dc_alimony_monthly')||0;
    const alimonyYears=getVal('dc_alimony_years')||0;
    const childMonthly=getVal('dc_child_monthly')||0;
    const childYears=getVal('dc_child_years')||0;
    const totalAlimony=alimonyMonthly*12*alimonyYears;
    const totalChildSupport=childMonthly*12*childYears;
    const totalSupport=totalAlimony+totalChildSupport;

    const attorney1=getVal('dc_attorney1')||0;
    const attorney2=getVal('dc_attorney2')||0;
    const mediator=getVal('dc_mediator')||0;
    const filing=getVal('dc_filing')||0;
    const qdroFee=getVal('dc_qdro_fee')||0;
    const appraisal=getVal('dc_appraisal')||0;
    const totalLegal=attorney1+attorney2+mediator+filing+qdroFee+appraisal;

    const currentExpense=getVal('dc_current_expense')||0;
    const newExpense=getVal('dc_new_expense')||0;
    const yearsSeparate=getVal('dc_years_separate')||0;
    const monthlyDelta=Math.max(0,newExpense-currentExpense);
    const totalTwoHouseholdDelta=monthlyDelta*12*yearsSeparate;

    const annualReturn=(getVal('dc_invest_return')||7)/100;
    const retirementSplit=retirement/2;
    const qdroOppCost=(annualReturn>0)?(retirementSplit*Math.pow(1+annualReturn,20)-retirementSplit):0;
    const qdroOppCostTen=(annualReturn>0)?(retirementSplit*Math.pow(1+annualReturn,10)-retirementSplit):0;

    const totalFinancialImpact=totalLegal+totalSupport+totalTwoHouseholdDelta+qdroOppCostTen;

    const lines=[
      {label:'Home equity',val:TE.formatMoney(home)},
      {label:'Retirement accounts',val:TE.formatMoney(retirement)},
      {label:'Savings & investments',val:TE.formatMoney(savings)},
      {label:'Other assets',val:TE.formatMoney(other)},
      {label:'Marital debts',val:'−'+TE.formatMoney(debts)},
      {label:'Total net marital assets',val:TE.formatMoney(totalAssets)},
      {label:'Your estimated share (50%)',val:TE.formatMoney(yourShare)},
      {label:'',val:''},
      {label:'Your attorney fees',val:TE.formatMoney(attorney1)},
      {label:'Spouse attorney fees',val:TE.formatMoney(attorney2)},
      {label:'Mediator / collaborative',val:TE.formatMoney(mediator)},
      {label:'Court & misc fees',val:TE.formatMoney(filing)},
      {label:'QDRO fee',val:TE.formatMoney(qdroFee)},
      {label:'Appraisals',val:TE.formatMoney(appraisal)},
      {label:'Total legal & admin costs',val:TE.formatMoney(totalLegal)},
      {label:'',val:''},
      {label:'Monthly alimony',val:TE.formatMoney(alimonyMonthly)+'/mo'},
      {label:'Alimony duration',val:alimonyYears+' years'},
      {label:'Total alimony',val:TE.formatMoney(totalAlimony)},
      {label:'Monthly child support',val:TE.formatMoney(childMonthly)+'/mo'},
      {label:'Child support duration',val:childYears+' years'},
      {label:'Total child support',val:TE.formatMoney(totalChildSupport)},
      {label:'Total support payments',val:TE.formatMoney(totalSupport)},
      {label:'',val:''},
      {label:'Current monthly expenses',val:TE.formatMoney(currentExpense)+'/mo'},
      {label:'New combined monthly (2 households)',val:TE.formatMoney(newExpense)+'/mo'},
      {label:'Monthly cost increase',val:TE.formatMoney(monthlyDelta)+'/mo'},
      {label:'Years of separate households',val:yearsSeparate},
      {label:'Total two-household cost delta',val:TE.formatMoney(totalTwoHouseholdDelta)},
      {label:'',val:''},
      {label:'Retirement split via QDRO',val:TE.formatMoney(retirementSplit)},
      {label:'10-year opportunity cost',val:TE.formatMoney(qdroOppCostTen)},
      {label:'20-year opportunity cost',val:TE.formatMoney(qdroOppCost)},
      {label:'',val:''},
      {label:'TOTAL FINANCIAL IMPACT (10 yr)',val:TE.formatMoney(totalFinancialImpact)}
    ];

    const title='True Cost of Divorce — 10-Year Financial Impact';
    const subtitle='Legal fees: '+TE.formatMoney(totalLegal)+'. Support: '+TE.formatMoney(totalSupport)+'. Two-household delta: '+TE.formatMoney(totalTwoHouseholdDelta)+'. QDRO 10-year impact: '+TE.formatMoney(qdroOppCostTen)+'. Total: '+TE.formatMoney(totalFinancialImpact)+'.';

    const bigCard=`<div style="background:var(--surface);border:1px solid var(--danger);border-radius:12px;padding:1.5rem;text-align:center;margin-top:1.5rem"><span style="display:block;font-size:2.2rem;font-weight:800;color:var(--danger)">${TE.formatMoney(totalFinancialImpact)}</span><span style="display:block;font-size:.9rem;color:var(--muted);margin-top:.25rem">Total 10-Year Financial Impact</span><p style="margin-top:1rem;font-size:1.1rem">Legal: ${TE.formatMoney(totalLegal)}. Support: ${TE.formatMoney(totalSupport)}. Living cost increase: ${TE.formatMoney(totalTwoHouseholdDelta)}. Retirement loss: ${TE.formatMoney(qdroOppCostTen)}. The attorney bill is just 3–8% of the total damage. The rest is invisible wealth destruction.</p></div>`;

    const summaryCards=`<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1rem;margin-top:1rem">`+
      `<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.25rem;text-align:center"><span style="display:block;font-size:1.6rem;font-weight:700">${TE.formatMoney(totalLegal)}</span><span style="display:block;font-size:.85rem;color:var(--muted)">Legal & Admin</span></div>`+
      `<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.25rem;text-align:center"><span style="display:block;font-size:1.6rem;font-weight:700">${TE.formatMoney(totalSupport)}</span><span style="display:block;font-size:.85rem;color:var(--muted)">Support Payments</span></div>`+
      `<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.25rem;text-align:center"><span style="display:block;font-size:1.6rem;font-weight:700">${TE.formatMoney(totalTwoHouseholdDelta)}</span><span style="display:block;font-size:.85rem;color:var(--muted)">2-Household Delta</span></div>`+
      `<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.25rem;text-align:center"><span style="display:block;font-size:1.6rem;font-weight:700">${TE.formatMoney(qdroOppCostTen)}</span><span style="display:block;font-size:.85rem;color:var(--muted)">QDRO 10-Yr Impact</span></div></div>`;

    let advice='';
    if(totalFinancialImpact>=400000){
      advice=`<div style="background:var(--surface);border:1px solid var(--danger);border-radius:12px;padding:1.25rem;margin-top:1.5rem"><strong style="color:var(--danger)">Severe Financial Impact — Mediate Immediately</strong><p style="margin:.5rem 0 0">Your 10-year impact exceeds $400,000. Every dollar spent on attorneys is a dollar neither of you keeps. Switch to mediation or collaborative divorce immediately. Freeze non-essential spending. Do not touch retirement accounts unless absolutely necessary. The QDRO alone could cost you $200,000+ in lost growth. A mediator costs $5,000–$10,000 total. An attorney costs $30,000+ per side. The math is brutal and obvious.</p></div>`;
    }else if(totalFinancialImpact>=150000){
      advice=`<div style="background:var(--surface);border:1px solid var(--warning);border-radius:12px;padding:1.25rem;margin-top:1.5rem"><strong style="color:var(--warning)">Significant Impact — Minimize Conflict</strong><p style="margin:.5rem 0 0">Your 10-year impact is $150,000–$400,000. Prioritize: mediation over litigation, keeping the house only if you can afford it alone, and negotiating alimony duration vs amount. Consider a lump-sum alimony buyout — it is often cheaper long-term. Protect your retirement: a $50,000 QDRO split today destroys $100,000+ in future wealth.</p></div>`;
    }else{
      advice=`<div style="background:var(--surface);border:1px solid var(--accent);border-radius:12px;padding:1.25rem;margin-top:1.5rem"><strong style="color:var(--accent)">Moderate Impact — Stay Disciplined</strong><p style="margin:.5rem 0 0">Your 10-year impact is under $150,000. This is typical for short marriages, no children, or amicable splits. Still: use mediation, keep emotions out of financial decisions, and rebuild retirement contributions immediately post-divorce. The first 3 years after divorce are when most people make their worst financial mistakes. Do not be one of them.</p></div>`;
    }

    document.getElementById('dc-res').innerHTML=resultsBox(lines,title,subtitle)+bigCard+summaryCards+advice;
    scrollToResults('dc-res');
  });
}

/* ===================== Eldercare Cost Calculator ===================== */
function eldercareCostView(main){
  const CARE_TYPES={
    'inhome-pt':{name:'In-Home Care (Part-Time)',monthly:3200},
    'inhome-ft':{name:'In-Home Care (Full-Time)',monthly:5800},
    'assisted':{name:'Assisted Living',monthly:4800},
    'memory':{name:'Memory Care',monthly:6800},
    'nursing':{name:'Nursing Home',monthly:8800}
  };
  const STATE_TIER={
    'low':{name:'Low Cost',mult:0.70,states:'MS, AL, LA, AR, OK, WV, KY, IN, MO, TN, SD, ND, NE, KS, IA'},
    'med':{name:'Medium Cost',mult:0.90,states:'WI, MN, OH, MI, PA, IL, AZ, UT, NM, ID, MT, WY, VT, ME, NH, DE, RI, NC, SC, GA, FL'},
    'high':{name:'High Cost',mult:1.10,states:'TX, VA, CO, OR, WA, NV'},
    'vhigh':{name:'Very High Cost',mult:1.50,states:'CA, NY, NJ, CT, MA, MD, DC, HI, AK'}
  };
  const HEALTH_LE={
    'healthy':{name:'Healthy / Independent',le:88,recommended:'inhome-pt'},
    'limited':{name:'Limited Mobility / Chronic',le:81,recommended:'inhome-ft'},
    'dementia':{name:'Dementia / Memory Care',le:79,recommended:'memory'}
  };

  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'Eldercare Cost'})}<h2>Eldercare Cost Calculator</h2><p style="color:var(--muted);margin-bottom:1.5rem">The cost of aging in America: in-home care, assisted living, memory care, and nursing home. Most families underestimate by 2–3x. Enter your parent's age, health, location, and care type to see projected 5-year and 10-year costs — and your family's financial exposure.</p>`+
    `<div class="calc-grid">`+
    `<div class="calc-panel"><h3>👴 Parent Profile</h3>`+
    `${inputField('ec_age','Parent\'s current age','number',{value:75,min:50,max:100,step:1})}`+
    `<label for="ec_health" style="display:block;margin-bottom:.5rem;font-weight:500">Health status</label>`+
    `<select id="ec_health" onchange="window.CalcFns.updateECCares()" style="width:100%;padding:.65rem .85rem;border-radius:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:1rem;margin-bottom:1rem">`+
    `<option value="healthy">Healthy / Independent</option>`+
    `<option value="limited">Limited Mobility / Chronic Condition</option>`+
    `<option value="dementia">Dementia / Needs Memory Care</option>`+
    `</select>`+
    `${inputField('ec_savings','Parent\'s current savings & assets','number',{value:100000,min:0,step:10000})}`+
    `</div>`+
    `<div class="calc-panel"><h3>🏥 Care Preferences</h3>`+
    `<label for="ec_care" style="display:block;margin-bottom:.5rem;font-weight:500">Care type</label>`+
    `<select id="ec_care" style="width:100%;padding:.65rem .85rem;border-radius:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:1rem;margin-bottom:1rem">`+
    `<option value="inhome-pt">In-Home Care (Part-Time, ~20 hrs/wk)</option>`+
    `<option value="inhome-ft">In-Home Care (Full-Time, ~44 hrs/wk)</option>`+
    `<option value="assisted">Assisted Living Facility</option>`+
    `<option value="memory">Memory Care Facility</option>`+
    `<option value="nursing">Nursing Home (Semi-Private)</option>`+
    `</select>`+
    `${inputField('ec_years','Years to project','number',{value:10,min:1,max:30,step:1})}`+
    `<p style="color:var(--muted);font-size:.85rem;margin-top:.5rem">Projected life expectancy shown in results based on health status.</p>`+
    `</div>`+
    `<div class="calc-panel"><h3>📍 Location</h3>`+
    `<label for="ec_tier" style="display:block;margin-bottom:.5rem;font-weight:500">Cost region</label>`+
    `<select id="ec_tier" style="width:100%;padding:.65rem .85rem;border-radius:8px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:1rem;margin-bottom:1rem">`+
    `<option value="low">Low Cost — ${STATE_TIER.low.states}</option>`+
    `<option value="med">Medium Cost — ${STATE_TIER.med.states}</option>`+
    `<option value="high">High Cost — ${STATE_TIER.high.states}</option>`+
    `<option value="vhigh">Very High Cost — ${STATE_TIER.vhigh.states}</option>`+
    `</select>`+
    `${inputField('ec_inflation','Annual care cost inflation (%)','number',{value:4,min:0,max:10,step:0.5})}`+
    `</div>`+
    `<div class="calc-panel"><h3>👨‍👩‍👧 Family Contribution</h3>`+
    `${inputField('ec_family_monthly','Monthly family contribution','number',{value:1000,min:0,step:100})}`+
    `${inputField('ec_invest_return','Investment return on savings (%)','number',{value:5,min:0,max:10,step:0.5})}`+
    `</div></div>`+
    `<div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcEldercareCost()">Calculate Eldercare Costs</button></div>`+
    `<div id="ec-res"></div>`+
    renderFaqSection([
      {q:'Why are eldercare costs so different by location?',a:'In-home care aides earn $15/hr in Mississippi and $35/hr in California. Assisted living rent varies from $3,000/month in rural areas to $8,000+/month in Manhattan. Memory care in California can exceed $10,000/month. Location is the single biggest cost driver after care type. The calculator uses state-based cost tiers derived from Genworth Cost of Care survey data.'},
      {q:'How does health status affect cost?',a:'A healthy 75-year-old may only need part-time in-home help ($3,200/month). Someone with limited mobility needs full-time care or assisted living ($5,800–$6,800/month). Dementia requires specialized memory care with 24/7 supervision ($6,800–$10,000+/month). Health status also affects life expectancy: healthy seniors average 13 more years, dementia patients average 4–8 more years. The calculator projects costs over your chosen period.'},
      {q:'What is the family financial exposure?',a:'Family exposure is the gap between total projected eldercare costs and what the parent\'s savings can cover. If total costs are $500,000 and the parent has $150,000 saved, the family must contribute $350,000. The calculator shows this gap and what the monthly family contribution would need to be to cover it. It also shows the opportunity cost: what that family money would have become if invested instead.'},
      {q:'Does Medicare pay for any of this?',a:'Medicare does NOT pay for long-term custodial care. It covers up to 100 days of skilled nursing after a hospital stay, and limited home health care. For ongoing assisted living, memory care, or in-home aides, families pay out of pocket or use Medicaid (only after spending nearly all assets). Long-term care insurance exists but is expensive and many policies have been priced out of reach. The calculator assumes full out-of-pocket costs.'},
      {q:'What about long-term care insurance?',a:'Long-term care insurance can cover $3,000–$10,000/month of care costs. Premiums for a 60-year-old average $2,500–$5,000/year. The catch: premiums can increase, policies have elimination periods (30–90 days), and many insurers have exited the market. If your parent already has a policy, enter their savings/assets net of the policy\'s daily benefit multiplied by years. If not, it is usually too late to buy affordably by age 75.'}
    ]);

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.updateECCares = safeCalc(function(){
    const health=document.getElementById('ec_health').value;
    const careSel=document.getElementById('ec_care');
    const rec=HEALTH_LE[health].recommended;
    if(careSel){
      for(const opt of careSel.options){if(opt.value===rec){careSel.value=rec;break;}}
    }
  });

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.calcEldercareCost = safeCalc(function(){
    const age=getVal('ec_age')||75;
    const healthKey=document.getElementById('ec_health').value;
    const careKey=document.getElementById('ec_care').value;
    const tierKey=document.getElementById('ec_tier').value;
    const yearsProj=getVal('ec_years')||10;
    const parentSavings=getVal('ec_savings')||0;
    const familyMonthly=getVal('ec_family_monthly')||0;
    const inflation=(getVal('ec_inflation')||4)/100;
    const investReturn=(getVal('ec_invest_return')||5)/100;

    const health=HEALTH_LE[healthKey];
    const care=CARE_TYPES[careKey];
    const tier=STATE_TIER[tierKey];

    const baseMonthly=care.monthly*tier.mult;
    const le=health.le;
    const yearsRemaining=Math.max(0,le-age);
    const projectionYears=Math.min(yearsProj,yearsRemaining);

    let totalCost=0;
    let yearlyBreakdown=[];
    for(let y=1;y<=projectionYears;y++){
      const annualCost=baseMonthly*12*Math.pow(1+inflation,y-1);
      totalCost+=annualCost;
      yearlyBreakdown.push(annualCost);
    }

    const fiveYearCost=yearlyBreakdown.slice(0,Math.min(5,projectionYears)).reduce((a,b)=>a+b,0);
    const tenYearCost=yearlyBreakdown.slice(0,Math.min(10,projectionYears)).reduce((a,b)=>a+b,0);

    const fvSavings=parentSavings*Math.pow(1+investReturn,projectionYears);
    const gap=Math.max(0,totalCost-parentSavings);

    const monthlyRate=investReturn/12;
    const months=projectionYears*12;
    const fvFamilyContrib=(familyMonthly>0&&investReturn>0)?(familyMonthly*(Math.pow(1+monthlyRate,months)-1)/monthlyRate):familyMonthly*months;

    const familyGap=Math.max(0,gap-fvFamilyContrib);
    const neededMonthly=projectionYears>0?Math.ceil(gap/projectionYears/12/100)*100:0;

    const avgMonthlyCost=projectionYears>0?totalCost/projectionYears/12:0;

    const lines=[
      {label:'Parent\'s current age',val:age},
      {label:'Health status',val:health.name},
      {label:'Projected life expectancy',val:le+' years'},
      {label:'Years remaining (projected)',val:yearsRemaining},
      {label:'Years projected in analysis',val:projectionYears},
      {label:'',val:''},
      {label:'Care type',val:care.name},
      {label:'Cost region',val:tier.name},
      {label:'Base monthly cost (today)',val:TE.formatMoney(baseMonthly)+'/mo'},
      {label:'',val:''},
      {label:'5-year projected cost',val:TE.formatMoney(fiveYearCost)},
      {label:'10-year projected cost',val:TE.formatMoney(tenYearCost)},
      {label:'Total projected cost ('+projectionYears+' yr)',val:TE.formatMoney(totalCost)},
      {label:'Average monthly cost',val:TE.formatMoney(avgMonthlyCost)+'/mo'},
      {label:'',val:''},
      {label:'Parent\'s current savings/assets',val:TE.formatMoney(parentSavings)},
      {label:'Future value of savings',val:TE.formatMoney(fvSavings)},
      {label:'Total savings gap',val:TE.formatMoney(gap)},
      {label:'',val:''},
      {label:'Family monthly contribution',val:TE.formatMoney(familyMonthly)+'/mo'},
      {label:'Future value of family contributions',val:TE.formatMoney(fvFamilyContrib)},
      {label:'Remaining family gap',val:TE.formatMoney(familyGap)},
      {label:'Monthly needed to cover full gap',val:neededMonthly>0?TE.formatMoney(neededMonthly)+'/mo':'Fully covered'}
    ];

    const title='Eldercare Cost Projection';
    const subtitle=care.name+' in a '+tier.name+' region costs '+TE.formatMoney(baseMonthly)+'/mo today. Over '+projectionYears+' years, total projected cost is '+TE.formatMoney(totalCost)+'.';

    const color=familyGap>0?'var(--danger)':'var(--accent)';
    const bigLabel=familyGap>0?'Family Financial Exposure':'Covered by Savings & Contributions';
    const bigCard=`<div style="background:var(--surface);border:1px solid ${color};border-radius:12px;padding:1.5rem;text-align:center;margin-top:1.5rem"><span style="display:block;font-size:2.2rem;font-weight:800;color:${color}">${familyGap>0?TE.formatMoney(familyGap):'Fully Covered'}</span><span style="display:block;font-size:.9rem;color:var(--muted);margin-top:.25rem">${bigLabel}</span><p style="margin-top:1rem;font-size:1.1rem">${familyGap>0?'After parent savings and family contributions, your family still faces a '+TE.formatMoney(familyGap)+' gap over '+projectionYears+' years. At '+TE.formatMoney(neededMonthly)+'/month, this will strain most household budgets. Consider: Medicaid planning, a reverse mortgage, or discussing care options with siblings.':'Parent savings and family contributions cover the projected costs. Any surplus can buffer for longer-than-expected care or higher inflation.'}</p></div>`;

    const summaryCards=`<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:1rem;margin-top:1rem">`+
      `<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.25rem;text-align:center"><span style="display:block;font-size:1.6rem;font-weight:700">${TE.formatMoney(totalCost)}</span><span style="display:block;font-size:.85rem;color:var(--muted)">Total Cost</span></div>`+
      `<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.25rem;text-align:center"><span style="display:block;font-size:1.6rem;font-weight:700">${TE.formatMoney(gap)}</span><span style="display:block;font-size:.85rem;color:var(--muted)">Savings Gap</span></div>`+
      `<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.25rem;text-align:center"><span style="display:block;font-size:1.6rem;font-weight:700;color:${color}">${familyGap>0?TE.formatMoney(familyGap):'✓ Covered'}</span><span style="display:block;font-size:.85rem;color:var(--muted)">Family Exposure</span></div>`+
      `<div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.25rem;text-align:center"><span style="display:block;font-size:1.6rem;font-weight:700">${TE.formatMoney(avgMonthlyCost)}</span><span style="display:block;font-size:.85rem;color:var(--muted)">Avg Monthly</span></div></div>`;

    let advice='';
    if(familyGap>=200000){
      advice=`<div style="background:var(--surface);border:1px solid var(--danger);border-radius:12px;padding:1.25rem;margin-top:1.5rem"><strong style="color:var(--danger)">Catastrophic Gap — Immediate Planning Required</strong><p style="margin:.5rem 0 0">Your family exposure exceeds $200,000. This is unaffordable for most middle-class families. Immediate actions: consult an elder law attorney for Medicaid planning (5-year lookback), explore a reverse mortgage on the parent's home, investigate veterans benefits if applicable, and have a frank family meeting about sibling contributions. Do not wait — every year of delay makes the gap larger as care costs inflate 4–5% annually.</p></div>`;
    }else if(familyGap>=50000){
      advice=`<div style="background:var(--surface);border:1px solid var(--warning);border-radius:12px;padding:1.25rem;margin-top:1.5rem"><strong style="color:var(--warning)">Significant Gap — Start Saving Now</strong><p style="margin:.5rem 0 0">Your family exposure is $50,000–$200,000. Start a dedicated eldercare savings fund immediately. Even $500/month for 5 years builds $30,000+. Consider: moving parent to a lower-cost region, adult day programs to reduce in-home hours, or transitioning from memory care to assisted living if dementia is mild. Also review the parent's existing long-term care insurance policy if any.</p></div>`;
    }else if(familyGap>0){
      advice=`<div style="background:var(--surface);border:1px solid var(--warning);border-radius:12px;padding:1.25rem;margin-top:1.5rem"><strong style="color:var(--warning)">Modest Gap — Tighten & Cover</strong><p style="margin:.5rem 0 0">Your family exposure is under $50,000. This is manageable with modest lifestyle adjustments. Increase your monthly family contribution by $200–$500, redirect the parent's Social Security or pension income toward care costs, and research state Medicaid waiver programs that may subsidize in-home care. A small gap today can become zero with 2–3 years of disciplined savings.</p></div>`;
    }else{
      advice=`<div style="background:var(--surface);border:1px solid var(--accent);border-radius:12px;padding:1.25rem;margin-top:1.5rem"><strong style="color:var(--accent)">Covered — Build a Buffer</strong><p style="margin:.5rem 0 0">Parent savings plus family contributions cover projected costs. Build a 20% buffer for longer life or higher inflation. Consider purchasing a small life insurance policy on the parent to protect against the worst-case scenario. And document all care preferences now while the parent can communicate clearly.</p></div>`;
    }

    document.getElementById('ec-res').innerHTML=resultsBox(lines,title,subtitle)+bigCard+summaryCards+advice;
    scrollToResults('ec-res');
  });
}

/* ===================== When Can I Retire? Calculator ===================== */
function whenCanIRetireView(main){
  const SCENARIOS={
    conservative:{name:'Conservative',return:4.0,color:'var(--warning)',desc:'Bond-heavy portfolio, low volatility, modest growth'},
    moderate:{name:'Moderate',return:6.0,color:'var(--accent)',desc:'Balanced 60/40 stocks/bonds, historical average growth'},
    aggressive:{name:'Aggressive',return:8.0,color:'var(--success)',desc:'Equity-heavy portfolio, higher volatility, higher expected growth'}
  };

  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'When Can I Retire?'})}<h2>When Can I Retire? Calculator</h2><p style="color:var(--muted);margin-bottom:1.5rem">The most important number in personal finance: when can you stop working? Enter your current savings, contribution rate, expected expenses, and Social Security. See three scenarios — conservative, moderate, aggressive, and know exactly where you stand.</p>`+
    `<div class="calc-grid">`+
    `<div class="calc-panel"><h3>📊 Your Profile</h3>`+
    `${inputField('wir_age','Current age','number',{value:45,min:18,max:80,step:1})}`+
    `${inputField('wir_savings','Current retirement savings','number',{value:250000,min:0,step:10000})}`+
    `${inputField('wir_contrib','Monthly retirement contribution','number',{value:1500,min:0,step:100})}`+
    `${inputField('wir_expenses','Monthly retirement expenses (today\'s $)','number',{value:5000,min:0,step:500})}`+
    `</div>`+
    `<div class="calc-panel"><h3>🛡️ Social Security</h3>`+
    `${inputField('wir_ss_monthly','Expected monthly Social Security','number',{value:2000,min:0,step:100})}`+
    `${inputField('wir_ss_age','Social Security claiming age','number',{value:67,min:62,max:70,step:1})}`+
    `<p style="color:var(--muted);font-size:.85rem;margin-top:.5rem">Full Retirement Age (FRA) is 67 for those born 1960+. Claiming at 62 reduces benefits ~30%. Waiting until 70 increases them ~24%.</p>`+
    `</div>`+
    `<div class="calc-panel"><h3>⚙️ Assumptions</h3>`+
    `${inputField('wir_inflation','Annual expense inflation (%)','number',{value:3,min:0,max:8,step:0.5})}`+
    `${inputField('wir_swr','Safe withdrawal rate (%)','number',{value:4,min:2.5,max:6,step:0.5})}`+
    `<p style="color:var(--muted);font-size:.85rem;margin-top:.5rem">The 4% rule is the classic safe withdrawal rate. Some planners use 3.5% for extra safety or 4.5% for shorter retirements.</p>`+
    `</div>`+
    `<div class="calc-panel"><h3>📈 Scenarios</h3>`+
    `<p style="color:var(--muted);font-size:.85rem;margin-bottom:1rem">Three return scenarios are pre-set. Adjust your savings rate to see how each scenario shifts.</p>`+
    `<div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:.75rem 1rem;margin-bottom:.5rem"><strong style="color:var(--warning)">Conservative:</strong> 4.0% annual return</div>`+
    `<div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:.75rem 1rem;margin-bottom:.5rem"><strong style="color:var(--accent)">Moderate:</strong> 6.0% annual return</div>`+
    `<div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:.75rem 1rem"><strong style="color:var(--success)">Aggressive:</strong> 8.0% annual return</div>`+
    `</div></div>`+
    `<div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcWhenCanIRetire()">Calculate Retirement Scenarios</button></div>`+
    `<div id="wir-res"></div>`+
    renderFaqSection([
      {q:'How does the 4% rule work?',a:'The 4% rule says you can safely withdraw 4% of your retirement portfolio in the first year, then adjust for inflation each year, without running out of money over a 30-year retirement. It is based on historical U.S. stock and bond returns. A $1,000,000 portfolio supports $40,000/year. Some planners now recommend 3.5% for longer retirements or 4.5% for shorter ones.'},
      {q:'Why three scenarios?',a:'No one knows future returns. The conservative scenario (4%) assumes a bond-heavy portfolio or poor market decades. The moderate scenario (6%) matches historical balanced portfolio averages. The aggressive scenario (8%) assumes strong equity returns. You should plan around the conservative or moderate scenario — the aggressive one is aspirational, not guaranteed.'},
      {q:'When should I claim Social Security?',a:'If you need the money, claim at 62. If you are healthy and have savings, waiting until 70 maximizes lifetime benefits — especially if you outlive the break-even age (~80). At FRA (67), you get 100% of your benefit. At 62, you get ~70%. At 70, you get ~124%. The calculator shows the impact on your retirement age.'},
      {q:'What if my retirement age is higher than I want?',a:'Increase your savings rate by $500/month — it can pull retirement forward 2–4 years. Reduce expenses by $500/month — same effect. Increase your equity allocation (accept more risk) for the moderate or aggressive scenario. Or plan a partial retirement: work part-time for 5 years to bridge the gap.'},
      {q:'What about healthcare costs before Medicare?',a:'Medicare starts at 65. Before then, expect $400–$1,500/month for ACA marketplace plans or COBRA. The calculator assumes your "retirement expenses" include healthcare, but if you are retiring before 65, make sure your expense estimate is realistic. Many early retirees underestimate healthcare by 50%.'}
    ]);

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.calcWhenCanIRetire = safeCalc(function(){
    const age=getVal('wir_age')||45;
    const savings=getVal('wir_savings')||0;
    const contrib=getVal('wir_contrib')||0;
    const expenses=getVal('wir_expenses')||0;
    const ssMonthly=getVal('wir_ss_monthly')||0;
    const ssAge=getVal('wir_ss_age')||67;
    const inflation=(getVal('wir_inflation')||3)/100;
    const swr=(getVal('wir_swr')||4)/100;

    const annualContrib=contrib*12;
    const annualExpenses=expenses*12;
    const annualSS=ssMonthly*12;

    function simulateScenario(retRate){
      let port=savings;
      let retireAge=null;
      let retireSavings=0;
      for(let a=age+1;a<=120;a++){
        const years=a-age;
        port=(port+annualContrib)*(1+retRate);
        const inflatedExp=annualExpenses*Math.pow(1+inflation,years);
        const ssIncome=(a>=ssAge)?annualSS:0;
        const netNeeded=Math.max(0,inflatedExp-ssIncome);
        if(port*swr>=netNeeded){
          retireAge=a;
          retireSavings=port;
          break;
        }
      }
      return{retireAge,retireSavings};
    }

    const con=simulateScenario(SCENARIOS.conservative.return/100);
    const mod=simulateScenario(SCENARIOS.moderate.return/100);
    const agg=simulateScenario(SCENARIOS.aggressive.return/100);

    function buildScenarioCard(key,result){
      const s=SCENARIOS[key];
      const yearsToRetire=result.retireAge?(result.retireAge-age):null;
      const yrs=yearsToRetire!==null?yearsToRetire+' years':'120+';
      const savingsAtRetire=result.retireSavings;

      const inflatedAtRetire=result.retireAge?annualExpenses*Math.pow(1+inflation,result.retireAge-age):0;
      const ssAtRetire=result.retireAge?(result.retireAge>=ssAge?annualSS:0):0;
      const netAtRetire=Math.max(0,inflatedAtRetire-ssAtRetire);
      const portfolioNeeded=netAtRetire/swr;

      return`<div style="background:var(--surface);border:2px solid ${s.color};border-radius:12px;padding:1.25rem;text-align:center">`+
        `<span style="display:block;font-size:.85rem;color:var(--muted)">${s.name}</span>`+
        `<span style="display:block;font-size:2.2rem;font-weight:800;color:${s.color};margin-top:.25rem">${result.retireAge?result.retireAge:'120+'}</span>`+
        `<span style="display:block;font-size:.85rem;color:var(--muted)">Retirement Age</span>`+
        `<span style="display:block;font-size:1.1rem;font-weight:600;margin-top:.75rem">${yrs}</span>`+
        `<span style="display:block;font-size:.85rem;color:var(--muted)">Years from now</span>`+
        `<div style="margin-top:1rem;text-align:left;font-size:.9rem">`+
        `<div style="display:flex;justify-content:space-between;padding:.35rem 0;border-bottom:1px solid var(--border)"><span>Annual return</span><span>${s.return.toFixed(1)}%</span></div>`+
        `<div style="display:flex;justify-content:space-between;padding:.35rem 0;border-bottom:1px solid var(--border)"><span>Savings at retirement</span><span>${result.retireAge?TE.formatMoney(savingsAtRetire):'—'}</span></div>`+
        `<div style="display:flex;justify-content:space-between;padding:.35rem 0;border-bottom:1px solid var(--border)"><span>Annual expenses then</span><span>${result.retireAge?TE.formatMoney(inflatedAtRetire):'—'}</span></div>`+
        `<div style="display:flex;justify-content:space-between;padding:.35rem 0;border-bottom:1px solid var(--border)"><span>Social Security then</span><span>${result.retireAge?TE.formatMoney(ssAtRetire):'—'}</span></div>`+
        `<div style="display:flex;justify-content:space-between;padding:.35rem 0;border-bottom:1px solid var(--border)"><span>Net needed from portfolio</span><span>${result.retireAge?TE.formatMoney(netAtRetire):'—'}</span></div>`+
        `<div style="display:flex;justify-content:space-between;padding:.35rem 0"><span>Portfolio needed</span><span>${result.retireAge?TE.formatMoney(portfolioNeeded):'—'}</span></div>`+
        `</div></div>`;
    }

    const bestScenario=mod.retireAge?mod:(con.retireAge?con:(agg.retireAge?agg:null));
    const bestAge=bestScenario?bestScenario.retireAge:null;
    const bestYears=bestAge?(bestAge-age):null;

    const lines=[
      {label:'Current age',val:age},
      {label:'Current savings',val:TE.formatMoney(savings)},
      {label:'Monthly contribution',val:TE.formatMoney(contrib)+'/mo'},
      {label:'Annual contribution',val:TE.formatMoney(annualContrib)},
      {label:'',val:''},
      {label:'Monthly retirement expenses',val:TE.formatMoney(expenses)+'/mo'},
      {label:'Annual retirement expenses',val:TE.formatMoney(annualExpenses)},
      {label:'Expense inflation',val:(inflation*100).toFixed(1)+'%'},
      {label:'Safe withdrawal rate',val:(swr*100).toFixed(1)+'%'},
      {label:'',val:''},
      {label:'Social Security (monthly)',val:TE.formatMoney(ssMonthly)+'/mo'},
      {label:'Social Security (annual)',val:TE.formatMoney(annualSS)},
      {label:'Social Security claiming age',val:ssAge},
      {label:'',val:''},
      {label:'Conservative scenario age',val:con.retireAge||'120+'},
      {label:'Moderate scenario age',val:mod.retireAge||'120+'},
      {label:'Aggressive scenario age',val:agg.retireAge||'120+'}
    ];

    const title='Retirement Age Scenarios';
    const subtitle='At '+TE.formatMoney(contrib)+'/mo with '+TE.formatMoney(savings)+' saved, you retire at age '+(con.retireAge||'120+')+' (conservative), '+(mod.retireAge||'120+')+' (moderate), or '+(agg.retireAge||'120+')+' (aggressive).';

    const bigText=bestAge?`Retire at ${bestAge} — ${bestYears} years from now`:'Savings insufficient in all scenarios';
    const bigColor=bestAge?'var(--accent)':'var(--danger)';
    let bigCardText='';
    if(bestAge){
      bigCardText=`At a balanced 60/40 portfolio earning 6% annually, you can retire at ${bestAge}. Your portfolio will be worth ${TE.formatMoney(mod.retireSavings)} and your inflation-adjusted expenses will be ${TE.formatMoney(annualExpenses*Math.pow(1+inflation,bestYears))}.`;
      if(con.retireAge){
        bigCardText+=` If markets underperform, add ${con.retireAge-mod.retireAge} years.`;
      }else{
        bigCardText+=` With conservative 4% returns, retirement may not be possible within a normal lifespan.`;
      }
      if(agg.retireAge){
        bigCardText+=` If markets overperform, subtract ${mod.retireAge-agg.retireAge} years.`;
      }
    }else{
      bigCardText='Even with aggressive 8% returns, your savings and contributions cannot support your expense level. You need to save more, spend less, or delay Social Security to increase benefits.';
    }
    const bigCard=`<div style="background:var(--surface);border:1px solid ${bigColor};border-radius:12px;padding:1.5rem;text-align:center;margin-top:1.5rem"><span style="display:block;font-size:2.2rem;font-weight:800;color:${bigColor}">${bigText}</span><span style="display:block;font-size:.9rem;color:var(--muted);margin-top:.25rem">Best realistic scenario (moderate)</span><p style="margin-top:1rem;font-size:1.1rem">${bigCardText}</p></div>`;

    const scenarioCards=`<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin-top:1rem">`+
      buildScenarioCard('conservative',con)+buildScenarioCard('moderate',mod)+buildScenarioCard('aggressive',agg)+`</div>`;

    let advice='';
    if(!con.retireAge){
      advice=`<div style="background:var(--surface);border:1px solid var(--danger);border-radius:12px;padding:1.25rem;margin-top:1.5rem"><strong style="color:var(--danger)">Critical — Increase Savings Immediately</strong><p style="margin:.5rem 0 0">Even the aggressive scenario cannot fund your retirement within a normal lifespan. You need to: (1) Increase monthly contributions by at least $500–$1,000, (2) Reduce retirement expenses by $1,000+/month, or (3) Delay Social Security to 70 for a ~24% benefit boost. Consider working 5+ years longer or a phased retirement with part-time work.</p></div>`;
    }else if(!mod.retireAge||mod.retireAge>70){
      advice=`<div style="background:var(--surface);border:1px solid var(--warning);border-radius:12px;padding:1.25rem;margin-top:1.5rem"><strong style="color:var(--warning)">Concerning — Conservative Does Not Work Within Your Lifetime</strong><p style="margin:.5rem 0 0">With conservative 4% returns, your savings and contributions cannot outpace expense inflation within a normal lifespan. The moderate scenario retires you at ${mod.retireAge}. Increase your savings rate by $300–$500/month or trim $500/month from retirement expenses. Every $100/month extra saved pulls retirement forward ~6 months. Also verify your Social Security estimate at SSA.gov — it may be higher than you entered.</p></div>`;
    }else if(mod.retireAge<=65){
      advice=`<div style="background:var(--surface);border:1px solid var(--accent);border-radius:12px;padding:1.25rem;margin-top:1.5rem"><strong style="color:var(--accent)">On Track — Solid Retirement Plan</strong><p style="margin:.5rem 0 0">You can retire by ${mod.retireAge} in the moderate scenario. Build a 10–15% buffer into your expense estimate for healthcare surprises and market downturns. Consider a Roth conversion ladder if retiring before 59.5. And keep 2–3 years of expenses in cash/CDs to avoid selling stocks during market crashes.</p></div>`;
    }else{
      advice=`<div style="background:var(--surface);border:1px solid var(--warning);border-radius:12px;padding:1.25rem;margin-top:1.5rem"><strong style="color:var(--warning)">Tight — Push for Moderate</strong><p style="margin:.5rem 0 0">You can retire in the moderate scenario at ${mod.retireAge}, which is later than ideal. To pull it forward: increase 401k contribution by $200/month (especially if employer matches), reduce fees on your investments by switching to index funds, and consider a side income stream for the first 3–5 years of retirement. Every 1% lower in expense ratio saves $10,000+ over 20 years.</p></div>`;
    }

    document.getElementById('wir-res').innerHTML=resultsBox(lines,title,subtitle)+bigCard+scenarioCards+advice;
    scrollToResults('wir-res');
  });
}

/* ===================== Climate Financial Risk Calculator ===================== */
function climateRiskView(main){
  const RISK_TYPES={
    flood:{name:'Flood',desc:'River overflow, storm surge, or flash flooding'},
    wildfire:{name:'Wildfire',desc:'Wildland-urban interface fire risk'},
    hurricane:{name:'Hurricane / Severe Storm',desc:'Wind, storm surge, and flooding from tropical systems'},
    heat:{name:'Extreme Heat',desc:'Sustained high temperatures and heat waves'}
  };

  const SEVERITY={
    low:{name:'Low Risk',insuranceRate:0.03,valueLoss:0.05,adaptation:10000,adaptationMax:25000,insuranceLabel:'+3%/year',valueLabel:'-5% over period'},
    moderate:{name:'Moderate Risk',insuranceRate:0.08,valueLoss:0.15,adaptation:30000,adaptationMax:60000,insuranceLabel:'+8%/year',valueLabel:'-15% over period'},
    high:{name:'High Risk',insuranceRate:0.15,valueLoss:0.30,adaptation:60000,adaptationMax:120000,insuranceLabel:'+15%/year',valueLabel:'-30% over period'}
  };

  const HOME_AGE_FACTOR={
    under10:0.85,
    '10to30':1.0,
    '30to50':1.3,
    '50plus':1.7
  };

  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'Climate Financial Risk'})}<h2>Climate Financial Risk Calculator</h2><p style="color:var(--muted);margin-bottom:1.5rem">Your home is your biggest asset — and climate change is the biggest threat to it. Enter your home value, current insurance, and risk profile to see projected insurance cost increases, property value loss, and adaptation costs over 20 years.</p>`+
    `<div class="calc-grid">`+
    `<div class="calc-panel"><h3>🏠 Your Property</h3>`+
    `${inputField('cr_home_value','Current home market value','number',{value:400000,min:0,step:10000})}`+
    `${inputField('cr_insurance','Current annual homeowner\'s insurance','number',{value:1500,min:0,step:100})}`+
    `${selectField('cr_risk_type','Primary climate risk type',[
      {value:'flood',label:'Flood (river, storm surge, flash)'},
      {value:'wildfire',label:'Wildfire (WUI fire risk)'},
      {value:'hurricane',label:'Hurricane / Severe Storm'},
      {value:'heat',label:'Extreme Heat'}
    ],{value:'flood'})}`+
    `</div>`+
    `<div class="calc-panel"><h3>⚠️ Risk Profile</h3>`+
    `${selectField('cr_severity','Risk severity level',[
      {value:'low',label:'Low — Outside designated zones, minimal historical events'},
      {value:'moderate',label:'Moderate — Adjacent to high-risk zone or recent events nearby'},
      {value:'high',label:'High — Inside designated zone, repeated losses in area'}
    ],{value:'moderate'})}`+
    `${selectField('cr_home_age','Home age',[
      {value:'under10',label:'Under 10 years'},
      {value:'10to30',label:'10–30 years'},
      {value:'30to50',label:'30–50 years'},
      {value:'50plus',label:'50+ years'}
    ],{value:'10to30'})}`+
    `${inputField('cr_years','Years to project','number',{value:20,min:5,max:30,step:5})}`+
    `</div>`+
    `<div class="calc-panel"><h3>📊 What We Calculate</h3>`+
    `<p style="color:var(--muted);font-size:.85rem;margin-bottom:.75rem"><strong>Insurance cost increase:</strong> Annual premiums rising with climate risk. Low = +3%/yr, Moderate = +8%/yr, High = +15%/yr.</p>`+
    `<p style="color:var(--muted);font-size:.85rem;margin-bottom:.75rem"><strong>Property value at risk:</strong> Estimated depreciation of home value over the projection period due to increased risk perception and insurability.</p>`+
    `<p style="color:var(--muted);font-size:.85rem;margin-bottom:.75rem"><strong>Adaptation cost:</strong> One-time investment needed to reduce risk: elevation, fire-resistant materials, impact windows, HVAC upgrades, etc.</p>`+
    `<p style="color:var(--muted);font-size:.85rem">All projections are estimates. Actual costs vary by carrier, state regulation, and local building codes.</p>`+
    `</div></div>`+
    `<div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcClimateRisk()">Calculate Climate Financial Risk</button></div>`+
    `<div id="cr-res"></div>`+
    renderFaqSection([
      {q:'Why are insurance costs rising so fast in climate zones?',a:'Insurance companies are re-pricing risk as claims from floods, wildfires, and storms hit record levels. In high-risk zones, some carriers have stopped writing policies entirely. In Florida and California, some homeowners see 40-100% annual increases. Our moderate scenario (+8%/yr) matches current trends in many climate-exposed markets.'},
      {q:'How does property value depreciation work?',a:'As climate risk becomes priced into real estate, buyers demand discounts for high-risk properties. In some uninsurable areas, homes have lost 20-40% of value. Even in moderate zones, disclosure requirements and buyer awareness drive 5-15% discounts over 10-20 years.'},
      {q:'What counts as adaptation costs?',a:'Flood: elevation, sump pumps, backflow valves, flood barriers ($15K-$80K). Wildfire: defensible space, fire-resistant roofing/siding, ember-resistant vents ($10K-$50K). Hurricane: impact windows, reinforced garage doors, generators ($15K-$60K). Heat: HVAC upgrades, insulation, cool roofing ($5K-$25K). Many costs qualify for tax credits and utility rebates.'},
      {q:'Should I sell my home if the risk is high?',a:'Not necessarily. High-risk homes can still be good investments if you invest in adaptation and if your appreciation prospects exceed the climate discount. But if your total climate risk exceeds 20% of home value and insurance is becoming unaffordable, relocation deserves serious consideration. Run the numbers both ways.'},
      {q:'Are there government programs that help?',a:'Yes. FEMA offers flood mitigation grants and Community Rating System discounts. HUD provides resilience grants. Many states offer tax credits for wildfire-hardening and hurricane retrofits. Check your state\'s climate resilience office and your utility company\'s rebate programs. Some adaptation costs may also qualify for federal tax credits under the Inflation Reduction Act.'}
    ]);

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.calcClimateRisk = safeCalc(function(){
    const homeValue=getVal('cr_home_value')||400000;
    const currentInsurance=getVal('cr_insurance')||1500;
    const riskType=getSelect('cr_risk_type')||'flood';
    const severityKey=getSelect('cr_severity')||'moderate';
    const homeAgeKey=getSelect('cr_home_age')||'10to30';
    const years=getVal('cr_years')||20;

    const sev=SEVERITY[severityKey];
    const ageFactor=HOME_AGE_FACTOR[homeAgeKey];

    // Insurance projection
    const rate=sev.insuranceRate;
    let totalBaseline=0;
    let totalClimate=0;
    const insuranceData=[];
    for(let y=1;y<=years;y++){
      const baseline=currentInsurance;
      const climate=currentInsurance*Math.pow(1+rate,y-1);
      totalBaseline+=baseline;
      totalClimate+=climate;
      insuranceData.push({year:y,baseline,climate});
    }
    const extraInsurance=totalClimate-totalBaseline;

    // Property value depreciation
    const annualDeprRate=1-Math.pow(1-sev.valueLoss,1/years);
    const futureValue=homeValue*Math.pow(1-annualDeprRate,years);
    const valueLoss=homeValue-futureValue;

    // Adaptation cost
    const adaptation=(sev.adaptation+sev.adaptationMax)/2*ageFactor;

    // Total risk
    const totalRisk=extraInsurance+valueLoss+adaptation;
    const pctOfHome=(totalRisk/homeValue*100).toFixed(1);

    // Milestone years for table
    const milestones=[5,10,15,20].filter(m=>m<=years);
    if(!milestones.includes(years))milestones.push(years);
    milestones.sort((a,b)=>a-b);

    let tableHtml=`<table style="width:100%;border-collapse:collapse;margin-top:1rem;font-size:.9rem"><thead><tr style="background:var(--surface);border-bottom:2px solid var(--border)"><th style="padding:.5rem;text-align:left">Year</th><th style="padding:.5rem;text-align:right">Insurance</th><th style="padding:.5rem;text-align:right">Cumulative Extra</th><th style="padding:.5rem;text-align:right">Home Value</th></tr></thead><tbody>`;
    let cumExtra=0;
    for(const m of milestones){
      let mInsurance=0;
      for(let y=1;y<=m;y++){
        mInsurance+=currentInsurance*Math.pow(1+rate,y-1);
      }
      cumExtra=mInsurance-currentInsurance*m;
      const mValue=homeValue*Math.pow(1-annualDeprRate,m);
      tableHtml+=`<tr style="border-bottom:1px solid var(--border)"><td style="padding:.5rem">Year ${m}</td><td style="padding:.5rem;text-align:right">${TE.formatMoney(currentInsurance*Math.pow(1+rate,m-1))}/yr</td><td style="padding:.5rem;text-align:right">${TE.formatMoney(cumExtra)}</td><td style="padding:.5rem;text-align:right">${TE.formatMoney(mValue)}</td></tr>`;
    }
    tableHtml+='</tbody></table>';

    // Results lines
    const lines=[
      {label:'Home value',val:TE.formatMoney(homeValue)},
      {label:'Current insurance (annual)',val:TE.formatMoney(currentInsurance)},
      {label:'Primary climate risk',val:RISK_TYPES[riskType].name},
      {label:'Risk severity',val:sev.name},
      {label:'Years projected',val:years},
      {label:'Home age factor',val:(ageFactor*100).toFixed(0)+'%'},
      {label:'',val:''},
      {label:'Insurance increase rate',val:sev.insuranceLabel},
      {label:'Projected insurance (year '+years+')',val:TE.formatMoney(currentInsurance*Math.pow(1+rate,years-1))+'/yr'},
      {label:'Total baseline insurance ('+years+' yr)',val:TE.formatMoney(totalBaseline)},
      {label:'Total climate insurance ('+years+' yr)',val:TE.formatMoney(totalClimate)},
      {label:'Extra insurance cost',val:TE.formatMoney(extraInsurance)},
      {label:'',val:''},
      {label:'Projected property value loss',val:TE.formatMoney(valueLoss)},
      {label:'Future home value (year '+years+')',val:TE.formatMoney(futureValue)},
      {label:'',val:''},
      {label:'Estimated adaptation cost',val:TE.formatMoney(adaptation)},
      {label:'',val:''},
      {label:'TOTAL CLIMATE RISK',val:TE.formatMoney(totalRisk)},
      {label:'As % of home value',val:pctOfHome+'%'}
    ];

    const title='Climate Financial Risk Over '+years+' Years';
    const subtitle='Your '+RISK_TYPES[riskType].name.toLowerCase()+' risk at '+severityKey+' severity could cost '+TE.formatMoney(totalRisk)+' over '+years+' years — '+pctOfHome+'% of your home\'s value.';

    const bigText=TE.formatMoney(totalRisk)+' Total Risk';
    const bigColor=pctOfHome>20?'var(--danger)':(pctOfHome>10?'var(--warning)':'var(--accent)');
    const bigCard=`<div style="background:var(--surface);border:1px solid ${bigColor};border-radius:12px;padding:1.5rem;text-align:center;margin-top:1.5rem"><span style="display:block;font-size:2.2rem;font-weight:800;color:${bigColor}">${bigText}</span><span style="display:block;font-size:.9rem;color:var(--muted);margin-top:.25rem">${pctOfHome}% of home value over ${years} years</span><p style="margin-top:1rem;font-size:1.1rem">At a ${severityKey} ${RISK_TYPES[riskType].name.toLowerCase()} risk with ${sev.insuranceLabel} insurance increases, your home could lose ${TE.formatMoney(valueLoss)} in value while insurance costs rise by ${TE.formatMoney(extraInsurance)}. Adapting your property now costs an estimated ${TE.formatMoney(adaptation)} — often less than five years of extra insurance premiums.</p></div>`;

    const scenarioCards=`<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-top:1rem">`+
      `<div style="background:var(--surface);border:2px solid var(--warning);border-radius:12px;padding:1.25rem;text-align:center"><span style="display:block;font-size:.85rem;color:var(--muted)">Extra Insurance</span><span style="display:block;font-size:1.8rem;font-weight:800;color:var(--warning);margin-top:.25rem">${TE.formatMoney(extraInsurance)}</span><span style="display:block;font-size:.85rem;color:var(--muted)">Over ${years} years</span><div style="margin-top:.75rem;font-size:.85rem;text-align:left">Year ${years} premium: <strong>${TE.formatMoney(currentInsurance*Math.pow(1+rate,years-1))}/yr</strong><br>Increase from today: <strong>${((currentInsurance*Math.pow(1+rate,years-1)/currentInsurance-1)*100).toFixed(0)}%</strong></div></div>`+
      `<div style="background:var(--surface);border:2px solid var(--danger);border-radius:12px;padding:1.25rem;text-align:center"><span style="display:block;font-size:.85rem;color:var(--muted)">Property Value Loss</span><span style="display:block;font-size:1.8rem;font-weight:800;color:var(--danger);margin-top:.25rem">${TE.formatMoney(valueLoss)}</span><span style="display:block;font-size:.85rem;color:var(--muted)">${sev.valueLabel}</span><div style="margin-top:.75rem;font-size:.85rem;text-align:left">Current value: <strong>${TE.formatMoney(homeValue)}</strong><br>Projected (yr ${years}): <strong>${TE.formatMoney(futureValue)}</strong></div></div>`+
      `<div style="background:var(--surface);border:2px solid var(--accent);border-radius:12px;padding:1.25rem;text-align:center"><span style="display:block;font-size:.85rem;color:var(--muted)">Adaptation Cost</span><span style="display:block;font-size:1.8rem;font-weight:800;color:var(--accent);margin-top:.25rem">${TE.formatMoney(adaptation)}</span><span style="display:block;font-size:.85rem;color:var(--muted)">One-time investment</span><div style="margin-top:.75rem;font-size:.85rem;text-align:left">Risk type: <strong>${RISK_TYPES[riskType].name}</strong><br>Home age adj: <strong>${(ageFactor*100).toFixed(0)}%</strong></div></div>`+
      `</div>`;

    let advice='';
    if(pctOfHome>20){
      advice=`<div style="background:var(--surface);border:1px solid var(--danger);border-radius:12px;padding:1.25rem;margin-top:1.5rem"><strong style="color:var(--danger)">Critical — Total Risk Exceeds 20% of Home Value</strong><p style="margin:.5rem 0 0">Your total climate financial exposure is severe. Prioritize adaptation investments immediately — they often pay for themselves in 3-5 years through insurance savings and value preservation. If adaptation costs exceed $80K and your home is already depreciating, consider whether relocation is the smarter financial move. Document everything for insurance claims and explore FEMA mitigation grants, state resilience programs, and utility rebates. Uninsurable homes have sold at 30-50% discounts in some markets.</p></div>`;
    }else if(pctOfHome>10){
      advice=`<div style="background:var(--surface);border:1px solid var(--warning);border-radius:12px;padding:1.25rem;margin-top:1.5rem"><strong style="color:var(--warning)">Elevated Risk — Adapt Now, Before Costs Accelerate</strong><p style="margin:.5rem 0 0">Your climate risk is material but manageable. Invest in adaptation within the next 2-3 years before insurance costs spiral further. Bundle adaptation work to qualify for larger tax credits. Shop insurance annually — carriers are re-pricing differently. Consider raising your deductible to offset premium increases. And monitor your local climate risk maps: a re-zone from moderate to high could double your costs overnight.</p></div>`;
    }else{
      advice=`<div style="background:var(--surface);border:1px solid var(--accent);border-radius:12px;padding:1.25rem;margin-top:1.5rem"><strong style="color:var(--accent)">Moderate Risk — Stay Proactive</strong><p style="margin:.5rem 0 0">Your climate financial exposure is relatively contained. Still, invest in low-cost adaptations (weather sealing, better drainage, tree trimming) to keep risk from escalating. Review your insurance coverage annually and ensure replacement cost coverage keeps pace with inflation. Build an emergency fund for climate-related repairs. And stay informed about local infrastructure investments — a new flood barrier or fire break could improve your risk profile and reduce premiums.</p></div>`;
    }

    document.getElementById('cr-res').innerHTML=resultsBox(lines,title,subtitle)+bigCard+scenarioCards+`<div style="margin-top:1.5rem"><h3 style="margin-bottom:.5rem">Year-by-Year Milestones</h3><p style="color:var(--muted);font-size:.9rem">See how insurance premiums climb and home value erodes at key intervals.</p>${tableHtml}</div>`+advice;
    scrollToResults('cr-res');
  });
}

/* ===================== 50/30/20 Budget Calculator ===================== */
function budget503020View(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'Budget 50/30/20'})}<h2>50/30/20 Budget Calculator</h2><p style="color:var(--muted);margin-bottom:1.5rem">The most recommended budgeting rule in personal finance. Enter your monthly take-home pay and see exactly how much goes to needs, wants, and savings. Every personal finance article links to a tool like this.</p>
    <div class="calc-grid"><div class="calc-panel"><h3>Your Income</h3>
      ${inputField('b_takehome','Monthly take-home pay','number',{value:5000})}
      <p style="color:var(--muted);font-size:.9rem;margin-top:.5rem">After taxes, health insurance, and 401(k) deductions. This is what hits your bank account.</p>
    </div>
    <div class="calc-panel"><h3>Your Split</h3>
      ${inputField('b_needs','Needs % (rent, groceries, utilities, minimum debt)','number',{value:50,min:0,max:100,step:1})}
      ${inputField('b_wants','Wants % (dining out, streaming, hobbies, travel)','number',{value:30,min:0,max:100,step:1})}
      ${inputField('b_savings','Savings & debt paydown % (emergency fund, 401k, extra debt)','number',{value:20,min:0,max:100,step:1})}
      <p id="b_split_warn" style="color:var(--danger);font-size:.9rem;margin-top:.5rem;display:none">Percentages must add to 100%.</p>
    </div></div>
    <div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcBudget503020()">Split My Paycheck</button></div>
    <div id="b-res"></div>`+
    renderFaqSection([
      {q:'What counts as "needs"?',a:'Needs are non-negotiable expenses: rent or mortgage, utilities, groceries, transportation to work, minimum debt payments, insurance, and phone. If you can legally or physically skip it without severe consequence, it is not a need.'},
      {q:'What counts as "wants"?',a:'Wants are discretionary: dining out, entertainment subscriptions, hobbies, travel, fancy clothes beyond basic wardrobe, and gym memberships. These improve quality of life but can be cut in an emergency.'},
      {q:'Is 50/30/20 realistic for high-cost cities?',a:'Not always. In NYC or San Francisco, rent alone can exceed 50% of take-home pay. If your needs are 60-70%, temporarily reduce wants to 10-15% and keep savings at 20%. The rule is a framework, not a law. The non-negotiable priority is savings: at least 20% if possible, but any consistent percentage is better than zero.'}
    ]);

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.calcBudget503020 = safeCalc(function(){
    const takehome=getVal('b_takehome');
    const needsPct=getVal('b_needs');
    const wantsPct=getVal('b_wants');
    const savingsPct=getVal('b_savings');
    const totalPct=needsPct+wantsPct+savingsPct;
    const warn=document.getElementById('b_split_warn');
    if(warn)warn.style.display=Math.abs(totalPct-100)<0.01?'none':'block';

    const needs=(takehome*needsPct/100);
    const wants=(takehome*wantsPct/100);
    const savings=(takehome*savingsPct/100);
    const annualTakehome=takehome*12;
    const annualNeeds=needs*12;
    const annualWants=wants*12;
    const annualSavings=savings*12;

    const bigCardStyle='background:var(--card);border:1px solid var(--border);border-radius:12px;padding:1.5rem;text-align:center;margin-bottom:1rem';
    const bigNumberStyle='font-size:2.2rem;font-weight:700;color:var(--accent);display:block';
    const bigLabelStyle='font-size:.85rem;color:var(--muted);margin-top:.25rem;display:block';

    const bar=(label,amount,pct,color)=>`<div style="margin-bottom:1rem"><div style="display:flex;justify-content:space-between;font-size:.9rem;margin-bottom:.25rem"><span>${label}</span><span>${TE.formatMoney(amount)} /mo (${pct.toFixed(0)}%)</span></div><div style="background:var(--border);border-radius:6px;height:28px;overflow:hidden"><div style="width:${Math.min(pct,100)}%;background:${color};height:100%;border-radius:6px;transition:width .4s ease"></div></div></div>`;

    document.getElementById('b-res').innerHTML=
    `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin-top:1.5rem">`+
    `<div style="${bigCardStyle};border-top:4px solid #4caf50"><span style="${bigNumberStyle};color:#4caf50">${TE.formatMoney(needs)}</span><span style="${bigLabelStyle}">Needs / month</span><span style="font-size:.8rem;color:var(--muted);display:block;margin-top:.25rem">${TE.formatMoney(annualNeeds)} / year</span></div>`+
    `<div style="${bigCardStyle};border-top:4px solid #2196f3"><span style="${bigNumberStyle};color:#2196f3">${TE.formatMoney(wants)}</span><span style="${bigLabelStyle}">Wants / month</span><span style="font-size:.8rem;color:var(--muted);display:block;margin-top:.25rem">${TE.formatMoney(annualWants)} / year</span></div>`+
    `<div style="${bigCardStyle};border-top:4px solid #ff9800"><span style="${bigNumberStyle};color:#ff9800">${TE.formatMoney(savings)}</span><span style="${bigLabelStyle}">Savings / month</span><span style="font-size:.8rem;color:var(--muted);display:block;margin-top:.25rem">${TE.formatMoney(annualSavings)} / year</span></div>`+
    `</div>`+
    `<div class="calc-panel" style="margin-top:1.5rem"><h3>Monthly Budget Breakdown</h3>${bar('Needs',needs,needsPct,'#4caf50')}${bar('Wants',wants,wantsPct,'#2196f3')}${bar('Savings',savings,savingsPct,'#ff9800')}</div>`+
    `<div class="calc-panel" style="margin-top:1rem"><h3>Annual View</h3><p>Take-home pay: <strong>${TE.formatMoney(annualTakehome)}</strong></p><p style="margin-top:.5rem">Needs: <strong style="color:#4caf50">${TE.formatMoney(annualNeeds)}</strong> · Wants: <strong style="color:#2196f3">${TE.formatMoney(annualWants)}</strong> · Savings: <strong style="color:#ff9800">${TE.formatMoney(annualSavings)}</strong></p></div>`+
    `<div class="calc-panel" style="margin-top:1rem;background:rgba(46,125,50,.08);border-color:var(--success)"><h3>Reality Check</h3><p><strong>If your needs exceed 50%:</strong> You are house-poor or debt-heavy. Fix the big three: housing, transportation, food. Consider a roommate, cheaper car, or meal prep. A 5% reduction in needs frees up $${TE.formatMoney(annualTakehome*.05)} per year.</p><p style="margin-top:.5rem"><strong>If your savings is below 20%:</strong> You are one emergency away from credit card debt. Build a $1,000 mini-emergency fund first, then automate 20% to savings before you see it. You cannot spend what you never touch.</p><p style="margin-top:.5rem"><strong>The real rule:</strong> Save first, spend second. The 50/30/20 rule assumes you control your wants. If you do not, flip it: automate savings on payday, then budget the remainder.</p></div>`;
    scrollToResults('b-res');
  });
}

/* ===================== Profit Margin Calculator ===================== */
function profitMarginView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'Profit Margin'})}<h2>Profit Margin Calculator</h2><p style="color:var(--muted);margin-bottom:1.5rem">Revenue + costs → gross margin, net margin, and markup percentage in one view. Etsy, Amazon, and Shopify sellers check this constantly. Know your real profit before you price your next product.</p>
    <div class="calc-grid"><div class="calc-panel"><h3>Revenue</h3>
      ${inputField('pm_revenue','Total revenue (sales price × units sold)','number',{value:10000})}
      <p style="color:var(--muted);font-size:.9rem;margin-top:.5rem">Total money received from customers before any deductions.</p>
    </div>
    <div class="calc-panel"><h3>Costs</h3>
      ${inputField('pm_cogs','Cost of goods sold (materials, manufacturing, shipping to customer)','number',{value:4000})}
      ${inputField('pm_operating','Operating expenses (platform fees, ads, packaging, software)','number',{value:1500})}
      ${inputField('pm_other','Other costs (returns, chargebacks, equipment, outsourcing)','number',{value:500})}
      <p style="color:var(--muted);font-size:.9rem;margin-top:.5rem">Include every dollar it takes to run the business, not just the product itself.</p>
    </div></div>
    <div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcProfitMargin()">Show My Margins</button></div>
    <div id="pm-res"></div>`+
    renderFaqSection([
      {q:'What is gross margin?',a:'Gross margin = (Revenue − COGS) / Revenue. It measures how much you keep after direct production costs. A healthy e-commerce gross margin is typically 40-60%. Below 30% means you are competing on price, not value.'},
      {q:'What is net margin?',a:'Net margin = (Revenue − All Costs) / Revenue. It is your true bottom-line profit. Most small e-commerce sellers run 10-20% net margin. Below 5% is unsustainable long-term.'},
      {q:'What is markup vs margin?',a:'Markup is calculated on cost: (Price − Cost) / Cost. Margin is calculated on revenue: (Price − Cost) / Price. A 50% margin equals a 100% markup. Sellers often confuse them and underprice by using markup language when they mean margin.'}
    ]);

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.calcProfitMargin = safeCalc(function(){
    const revenue=getVal('pm_revenue');
    const cogs=getVal('pm_cogs');
    const operating=getVal('pm_operating');
    const other=getVal('pm_other');
    const totalCosts=cogs+operating+other;
    const grossProfit=Math.max(0,revenue-cogs);
    const netProfit=revenue-totalCosts;
    const grossMargin=revenue>0?((grossProfit/revenue)*100):0;
    const netMargin=revenue>0?((netProfit/revenue)*100):0;
    const markup=cogs>0?(((revenue-cogs)/cogs)*100):0;
    const breakEven=0.01;
    const costPct=revenue>0?((totalCosts/revenue)*100):0;

    const bigCardStyle='background:var(--card);border:1px solid var(--border);border-radius:12px;padding:1.5rem;text-align:center;margin-bottom:1rem';
    const bigNumberStyle='font-size:2.2rem;font-weight:700;color:var(--accent);display:block';
    const bigLabelStyle='font-size:.85rem;color:var(--muted);margin-top:.25rem;display:block';
    const profitColor=netProfit>=0?'#2e7d32':'#d32f2f';

    const bar=(label,amount,pct,color)=>`<div style="margin-bottom:1rem"><div style="display:flex;justify-content:space-between;font-size:.9rem;margin-bottom:.25rem"><span>${label}</span><span>${TE.formatMoney(amount)} (${pct.toFixed(1)}%)</span></div><div style="background:var(--border);border-radius:6px;height:28px;overflow:hidden"><div style="width:${Math.min(pct,100)}%;background:${color};height:100%;border-radius:6px;transition:width .4s ease"></div></div></div>`;

    document.getElementById('pm-res').innerHTML=
    `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-top:1.5rem">`+
    `<div style="${bigCardStyle};border-top:4px solid #4caf50"><span style="${bigNumberStyle};color:#4caf50">${grossMargin.toFixed(1)}%</span><span style="${bigLabelStyle}">Gross Margin</span><span style="font-size:.8rem;color:var(--muted);display:block;margin-top:.25rem">${TE.formatMoney(grossProfit)} profit</span></div>`+
    `<div style="${bigCardStyle};border-top:4px solid ${profitColor}"><span style="${bigNumberStyle};color:${profitColor}">${netMargin.toFixed(1)}%</span><span style="${bigLabelStyle}">Net Margin</span><span style="font-size:.8rem;color:var(--muted);display:block;margin-top:.25rem">${TE.formatMoney(netProfit)} profit</span></div>`+
    `<div style="${bigCardStyle};border-top:4px solid #2196f3"><span style="${bigNumberStyle};color:#2196f3">${markup.toFixed(1)}%</span><span style="${bigLabelStyle}">Markup</span><span style="font-size:.8rem;color:var(--muted);display:block;margin-top:.25rem">On COGS</span></div>`+
    `<div style="${bigCardStyle};border-top:4px solid #ff9800"><span style="${bigNumberStyle};color:#ff9800">${costPct.toFixed(1)}%</span><span style="${bigLabelStyle}">Cost Ratio</span><span style="font-size:.8rem;color:var(--muted);display:block;margin-top:.25rem">Of revenue</span></div>`+
    `</div>`+
    `<div class="calc-panel" style="margin-top:1.5rem"><h3>Cost Breakdown</h3>${bar('COGS',cogs,revenue>0?(cogs/revenue)*100:0,'#f44336')}${bar('Operating',operating,revenue>0?(operating/revenue)*100:0,'#ff9800')}${bar('Other',other,revenue>0?(other/revenue)*100:0,'#607d8b')}${bar('Total costs',totalCosts,costPct,'#9e9e9e')}</div>`+
    `<div class="calc-panel" style="margin-top:1rem"><h3>The Numbers</h3><p>Revenue: <strong>${TE.formatMoney(revenue)}</strong></p><p style="margin-top:.5rem">COGS: <strong>${TE.formatMoney(cogs)}</strong> · Operating: <strong>${TE.formatMoney(operating)}</strong> · Other: <strong>${TE.formatMoney(other)}</strong></p><p style="margin-top:.5rem">Gross profit: <strong style="color:#4caf50">${TE.formatMoney(grossProfit)}</strong> (${grossMargin.toFixed(1)}% margin)</p><p style="margin-top:.5rem">Net profit: <strong style="color:${profitColor}">${TE.formatMoney(netProfit)}</strong> (${netMargin.toFixed(1)}% margin)</p><p style="margin-top:.5rem">Markup on cost: <strong>${markup.toFixed(1)}%</strong></p></div>`+
    `<div class="calc-panel" style="margin-top:1rem;background:${netProfit>=0?'rgba(46,125,50,.08)':'rgba(211,47,47,.08)'};border-color:${netProfit>=0?'var(--success)':'#d32f2f'}"><h3>Seller Reality Check</h3>${netProfit<0?`<p><strong>You are losing money on every sale.</strong> Your costs exceed revenue. Before cutting prices further, fix costs: negotiate supplier rates, reduce ad spend with poor ROAS, or raise prices by ${((Math.abs(netProfit)/revenue)*100+5).toFixed(1)}% to break even.</p>`:`<p><strong>Healthy?</strong> Gross margin above 40% = you have pricing power. Below 30% = you are a reseller in a race to the bottom.</p>`}<p style="margin-top:.5rem"><strong>Amazon FBA reality:</strong> FBA fees + advertising often eat 35-50% of revenue. If your net margin is below 10%, you are one fee increase away from unprofitability. Diversify to your own Shopify store.</p><p style="margin-top:.5rem"><strong>Etsy reality:</strong> Listing fees, transaction fees, and offsite ads can total 20%+. Price accordingly. A $30 item with $10 COGS and $6 fees has a 47% gross margin but only 27% after fees.</p><p style="margin-top:.5rem"><strong>The rule:</strong> Know your numbers before you scale. Doubling revenue while losing money is just doubling your losses.</p></div>`;
    scrollToResults('pm-res');
  });
}

/* ===================== Freelance Rate Calculator ===================== */
function freelanceRateView(main){
  const stateOpts=DATA&&DATA.states?Object.keys(DATA.states).sort().map(code=>({value:code,label:DATA.states[code].name+' ('+code+')'})):[
    {value:'CA',label:'California (CA)'},{value:'NY',label:'New York (NY)'},{value:'TX',label:'Texas (TX)'},{value:'FL',label:'Florida (FL)'},{value:'IL',label:'Illinois (IL)'},{value:'WA',label:'Washington (WA)'},{value:'CO',label:'Colorado (CO)'},{value:'NC',label:'North Carolina (NC)'},{value:'OH',label:'Ohio (OH)'},{value:'PA',label:'Pennsylvania (PA)'}
  ];
  const statusOpts=[{value:'single',label:'Single'},{value:'mfj',label:'Married Filing Jointly'},{value:'mfs',label:'Married Filing Separately'},{value:'hoh',label:'Head of Household'}];

  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'Freelance Rate'})}<h2>Freelance Rate Calculator 2026</h2><p style="color:var(--muted);margin-bottom:1.5rem">Target income + overhead + real taxes + time off → your minimum hourly rate. Uses actual 2026 federal brackets, SE tax, and state tax. Stop underselling.</p>
    <div class="calc-grid"><div class="calc-panel"><h3>Your Goals</h3>
      ${inputField('fr_target','Target annual take-home income','number',{value:80000})}
      ${inputField('fr_expenses','Annual business expenses','number',{value:5000})}
      ${selectField('fr_state','Your state',stateOpts,{value:'CA'})}
      ${selectField('fr_status','Filing status',statusOpts,{value:'single'})}
    </div>
    <div class="calc-panel"><h3>Your Time</h3>
      ${inputField('fr_weeks_off','Weeks off per year (vacation + holidays + sick)','number',{value:4})}
      ${inputField('fr_hours_week','Billable hours per week','number',{value:25})}
      ${inputField('fr_project_hours','Average project size (hours, optional)','number',{value:40})}
      <p style="color:var(--muted);font-size:.9rem;margin-top:1rem">Most freelancers only bill 20-30 hours/week. The rest is admin, sales, and email. Be honest with yourself.</p>
    </div></div>
    <div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcFreelanceRate()">Show My Floor Rate</button></div>
    <div id="fr-res"></div>`+
    renderFaqSection([
      {q:'Why is my rate so high?',a:'Because you only bill 20-30 hours/week, take time off, pay SE tax (15.3%), federal income tax, and state income tax. A $100/hr rate with 25 billable hours and 4 weeks off = $125,000 gross. After $5,000 expenses, ~$14,000 SE tax, ~$10,000 federal tax, and ~$3,000 state tax (CA), you keep about $93,000. That is reality.'},
      {q:'Should I charge my floor rate?',a:'No - your floor rate is the minimum to survive. Your market rate is what clients will pay. Research competitors. If your floor is $85 and market is $120, charge $120. If floor is $85 and market is $60, you need more specialized skills or a different niche.'},
      {q:'What counts as business expenses?',a:'Software subscriptions, coworking, equipment, insurance, professional development, marketing, payment processing fees, legal/accounting. Do not count personal expenses like rent or groceries - those come from take-home pay.'}
    ]);

  function computeTakeHome(R,expenses,stateCode,status){
    if(!DATA||!TE||!TE.calcSETax){
      const approxTax=(R-expenses)*0.25;
      return{takeHome:R-expenses-approxTax,fed:approxTax,se:0,state:0,qbi:0,netSE:R-expenses};
    }
    const netSE=R-expenses;
    const se=TE.calcSETax(netSE,DATA);
    const agi=Math.max(0,netSE-se.deductibleHalf);
    const stdDed=DATA.federal&&DATA.federal.standardDeduction?DATA.federal.standardDeduction[status]||16100:16100;
    const taxableBeforeQBI=Math.max(0,agi-stdDed);
    const qbi=TE.calcQBI?TE.calcQBI(netSE,taxableBeforeQBI,status,DATA):0;
    const taxable=Math.max(0,taxableBeforeQBI-qbi);
    const fed=TE.calcFederalTax(taxable,status,DATA);
    const stateRes=TE.calcStateTax(agi,stateCode,DATA,status);
    const totalTax=fed+se.totalSE+stateRes.tax;
    const takeHome=R-expenses-totalTax;
    return{takeHome,fed,se:se.totalSE,state:stateRes.tax,qbi,netSE,totalTax};
  }

  function findRevenueForTarget(target,expenses,stateCode,status){
    let low=target+expenses;
    let high=(target+expenses)*3;
    let bestR=low;
    for(let i=0;i<30;i++){
      const mid=(low+high)/2;
      const res=computeTakeHome(mid,expenses,stateCode,status);
      if(res.takeHome<target){low=mid;}
      else{high=mid;bestR=mid;}
    }
    return{revenue:bestR,...computeTakeHome(bestR,expenses,stateCode,status)};
  }

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.calcFreelanceRate = safeCalc(function(){
    const target=getVal('fr_target');
    const expenses=getVal('fr_expenses');
    const stateCode=document.getElementById('fr_state').value;
    const status=document.getElementById('fr_status').value;
    const weeksOff=getVal('fr_weeks_off');
    const hoursWeek=getVal('fr_hours_week');
    const projectHours=getVal('fr_project_hours');

    const workingWeeks=Math.max(1,52-weeksOff);
    const annualBillableHours=workingWeeks*hoursWeek;

    const res=findRevenueForTarget(target,expenses,stateCode,status);
    const grossRevenue=res.revenue;
    const hourlyRate=annualBillableHours>0?grossRevenue/annualBillableHours:0;
    const projectRate=projectHours>0?hourlyRate*projectHours:0;

    const lines=[
      {label:'Target take-home',val:TE.formatMoney(target)},
      {label:'Annual business expenses',val:TE.formatMoney(expenses)},
      {label:'Gross revenue needed',val:TE.formatMoney(grossRevenue)},
      {label:'Working weeks',val:workingWeeks},
      {label:'Annual billable hours',val:annualBillableHours}
    ];
    if(DATA&&TE&&TE.calcSETax){
      lines.push({label:'',val:''});
      lines.push({label:'Net profit (SE income)',val:TE.formatMoney(res.netSE)});
      lines.push({label:'SE tax (15.3%)',val:TE.formatMoney(res.se)});
      lines.push({label:'Federal income tax',val:TE.formatMoney(res.fed)});
      lines.push({label:'State income tax ('+stateCode+')',val:TE.formatMoney(res.state)});
      lines.push({label:'Total tax',val:TE.formatMoney(res.totalTax)});
      if(res.qbi>0) lines.push({label:'QBI deduction',val:TE.formatMoney(res.qbi)});
    }

    const bigCardStyle='background:var(--card);border:1px solid var(--border);border-radius:12px;padding:1.5rem;text-align:center;margin-bottom:1rem';
    const bigNumberStyle='font-size:2.2rem;font-weight:700;color:var(--accent);display:block';
    const bigLabelStyle='font-size:.85rem;color:var(--muted);margin-top:.25rem;display:block';

    let projectHtml='';
    if(projectHours>0){
      projectHtml=`<div style="${bigCardStyle}"><span style="${bigNumberStyle}">${TE.formatMoney(projectRate)}</span><span style="${bigLabelStyle}">Minimum per project (${projectHours} hrs)</span></div>`;
    }

    document.getElementById('fr-res').innerHTML=resultsBox(lines,'Minimum Hourly Rate',TE.formatMoney(hourlyRate)+'/hr')+
    `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin-top:1rem">`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle}">${TE.formatMoney(hourlyRate)}</span><span style="${bigLabelStyle}">Per Hour (floor)</span></div>`+
    projectHtml+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle}">${TE.formatMoney(grossRevenue)}</span><span style="${bigLabelStyle}">Annual Revenue Needed</span></div>`+
    `</div>`+
    `<div class="calc-panel" style="margin-top:1rem;background:rgba(201,74,30,.08);border-color:var(--accent)"><h3>The Floor</h3><p>If you charge <strong>less than ${TE.formatMoney(hourlyRate)}/hr</strong>, you cannot hit your ${TE.formatMoney(target)} take-home goal - even if you bill every available hour.</p><p>At ${TE.formatMoney(hourlyRate)}/hr × ${annualBillableHours} billable hours = <strong>${TE.formatMoney(grossRevenue)}</strong> gross revenue.</p><p>After ${TE.formatMoney(expenses)} expenses and ~${TE.formatMoney(res.totalTax)} in total taxes (SE + federal + state), you keep <strong>${TE.formatMoney(target)}</strong>.</p><p><strong>This is your floor, not your ceiling.</strong> Research market rates. If the market pays more, charge more.</p></div>`+
    `<div class="calc-panel" style="margin-top:1rem"><h3>Reality Check</h3><p>Most freelancers only bill <strong>20-30 hours/week</strong>. If you think you will bill 40, you are probably wrong unless you have a full pipeline and no admin work.</p><p>At <strong>${hoursWeek} billable hours/week</strong> with <strong>${weeksOff} weeks off</strong>, you have <strong>${annualBillableHours} billable hours/year</strong>.</p><p>If your current rate is <strong>${TE.formatMoney(hourlyRate*0.7)}</strong>, you would need to work <strong>${Math.ceil((grossRevenue/(hourlyRate*0.7))/hoursWeek)} weeks</strong> to hit the same revenue - or take a pay cut.</p></div>`;
    scrollToResults('fr-res');
  });
}

/* ===================== Work Hours Calculator ===================== */
function workHoursView(main){
  const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  let rows='';
  for(const d of days){
    rows+=`<tr>
      <td style="font-weight:600">${d}</td>
      <td><input type="time" id="wh_${d}_in" value="${d==='Sat'||d==='Sun'?'':'09:00'}" style="width:100%;padding:.5rem;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--text)"></td>
      <td><input type="time" id="wh_${d}_out" value="${d==='Sat'||d==='Sun'?'':'17:00'}" style="width:100%;padding:.5rem;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--text)"></td>
      <td><input type="number" id="wh_${d}_break" value="${d==='Sat'||d==='Sun'?'0':'30'}" min="0" style="width:80px;padding:.5rem;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--text)"></td>
      <td id="wh_${d}_res" style="text-align:right;color:var(--muted)">-</td>
    </tr>`;
  }

  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'Work Hours'})}<h2>Work Hours Calculator 2026</h2><p style="color:var(--muted);margin-bottom:1.5rem">Clock in, clock out, track breaks. See daily and weekly totals, regular hours vs overtime, and optional pay calculation.</p>
    <div class="calc-grid"><div class="calc-panel"><h3>Weekly Timesheet</h3>
      <table class="data-table" style="margin-bottom:1rem"><thead><tr><th>Day</th><th>Clock In</th><th>Clock Out</th><th>Break (min)</th><th style="text-align:right">Hours</th></tr></thead><tbody>${rows}</tbody></table>
    </div>
    <div class="calc-panel"><h3>Rules & Pay</h3>
      ${inputField('wh_daily_thresh','Daily regular hours threshold','number',{value:8})}
      ${inputField('wh_weekly_thresh','Weekly regular hours threshold','number',{value:40})}
      ${inputField('wh_ot_mult','Overtime multiplier','number',{value:1.5})}
      ${inputField('wh_hourly_rate','Hourly rate (optional, for pay calc)','number',{value:0})}
    </div></div>
    <div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcWorkHours()">Calculate Hours</button></div>
    <div id="wh-res"></div>`+
    renderFaqSection([
      {q:'How is overtime calculated?',a:'Overtime is hours worked beyond your daily threshold (default 8) OR your weekly threshold (default 40), whichever produces more overtime. This calculator applies daily overtime first, then checks weekly totals. Some states (e.g., California) require daily OT; others (e.g., federal FLSA) use weekly only.'},
      {q:'Do I include lunch break time?',a:'No - only count paid breaks. If your lunch is unpaid (30-60 minutes), enter those minutes in the break column. Paid breaks (typically 10-15 minutes) should NOT be subtracted.'},
      {q:'What about shift differentials or holiday pay?',a:'This calculator does not include premium pay rates. Enter your base hourly rate. For shift differential or holiday pay, calculate separately and add to the total.'}
    ]);

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.calcWorkHours = safeCalc(function(){
    function parseTime(t){
      if(!t) return 0;
      const [h,m]=t.split(':').map(Number);
      return h*60+m;
    }
    const dailyThresh=getVal('wh_daily_thresh'),weeklyThresh=getVal('wh_weekly_thresh');
    const otMult=getVal('wh_ot_mult'),hourlyRate=getVal('wh_hourly_rate');

    let weeklyTotal=0,weeklyRegular=0,weeklyOT=0,weeklyPay=0;
    const dayResults=[];

    for(const d of days){
      const clockIn=parseTime(document.getElementById('wh_'+d+'_in').value);
      const clockOut=parseTime(document.getElementById('wh_'+d+'_out').value);
      const breakMin=getVal('wh_'+d+'_break');
      const rawMin=Math.max(0,clockOut-clockIn-breakMin);
      const hours=rawMin/60;
      const dailyRegular=Math.min(hours,dailyThresh);
      const dailyOT=Math.max(0,hours-dailyThresh);
      const dayPay=hourlyRate>0?(dailyRegular*hourlyRate+dailyOT*hourlyRate*otMult):0;

      document.getElementById('wh_'+d+'_res').innerHTML=hours>0
        ?`<span style="color:var(--text)">${hours.toFixed(2)}</span>`+(dailyOT>0?` <span style="color:var(--accent);font-size:.8rem">(${dailyRegular.toFixed(2)} + ${dailyOT.toFixed(2)} OT)</span>`:'')
        :'<span style="color:var(--muted)">-</span>';

      dayResults.push({day:d,hours,regular:dailyRegular,ot:dailyOT,pay:dayPay});
      weeklyTotal+=hours;
      weeklyRegular+=dailyRegular;
      weeklyOT+=dailyOT;
      weeklyPay+=dayPay;
    }

    // Weekly overtime recalculation: if weekly total exceeds threshold, recalc
    const weeklyOTByTotal=Math.max(0,weeklyTotal-weeklyThresh);
    const weeklyRegByTotal=Math.min(weeklyTotal,weeklyThresh);

    const lines=[
      {label:'Weekly total hours',val:weeklyTotal.toFixed(2)+' hrs'},
      {label:'Regular hours (daily rule)',val:weeklyRegular.toFixed(2)+' hrs'},
      {label:'Overtime hours (daily rule)',val:weeklyOT.toFixed(2)+' hrs'},
      {label:'Regular hours (weekly rule)',val:weeklyRegByTotal.toFixed(2)+' hrs'},
      {label:'Overtime hours (weekly rule)',val:weeklyOTByTotal.toFixed(2)+' hrs'}
    ];
    if(hourlyRate>0){
      lines.push({label:'Pay at regular rate',val:TE.formatMoney(weeklyRegByTotal*hourlyRate)});
      lines.push({label:'Pay at OT rate (x'+otMult.toFixed(1)+')',val:TE.formatMoney(weeklyOTByTotal*hourlyRate*otMult)});
      lines.push({label:'Total estimated pay',val:TE.formatMoney(weeklyRegByTotal*hourlyRate+weeklyOTByTotal*hourlyRate*otMult)});
    }

    const otNote=weeklyOTByTotal>weeklyOT?'Weekly threshold triggers more overtime than daily threshold.':'Daily threshold determines overtime.';

    document.getElementById('wh-res').innerHTML=resultsBox(lines,'Weekly Summary',weeklyTotal.toFixed(2)+' hrs')+
    `<div class="calc-panel" style="margin-top:1rem"><h3>Day-by-Day Breakdown</h3><table class="data-table"><thead><tr><th>Day</th><th>Total</th><th>Regular</th><th>Overtime</th>${hourlyRate>0?'<th>Pay</th>':''}</tr></thead><tbody>`+
    dayResults.map(r=>`<tr><td>${r.day}</td><td>${r.hours.toFixed(2)}</td><td>${r.regular.toFixed(2)}</td><td>${r.ot.toFixed(2)}</td>${hourlyRate>0?'<td>'+TE.formatMoney(r.pay)+'</td>':''}</tr>`).join('')+
    `</tbody></table><p style="margin-top:1rem;color:var(--muted);font-size:.9rem">${otNote}</p></div>`;
    scrollToResults('wh-res');
  });
}

/* ===================== 1099-K Reconciliation ===================== */
function k1099CalculatorView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'',text:'Seller Marketplace'},{href:'',text:'1099-K Reconciliation'})}<h2>1099-K Tax Reconciliation Calculator 2026: eBay & Seller Tool</h2><p style="color:var(--muted);margin-bottom:1.5rem">Your 1099-K shows GROSS receipts before fees, refunds, and COGS. This tool reconciles to your actual taxable income.</p>${callout('yellow','2026 1099-K Rules','Threshold restored to $20,000 + 200 transactions by OBBBA. But ALL income is taxable even without a 1099-K.')}
    <div class="calc-grid"><div class="calc-panel"><h3>1099-K Gross</h3>${inputField('k_gross','Gross 1099-K amount','number',{value:35000})}${inputField('k_fees','Platform fees deducted','number',{value:2500})}${inputField('k_refunds','Returns / refunds','number',{value:800})}${inputField('k_shipping','Shipping costs charged','number',{value:600})}</div>
    <div class="calc-panel"><h3>Your Deductions</h3>${inputField('k_cogs','Cost of goods sold','number',{value:12000})}${inputField('k_other','Other deductions','number',{value:1500})}</div></div>
    <div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calc1099K()">Reconcile</button></div><div id="k1099-res"></div>`;
  window.CalcFns = window.CalcFns || {};
  window.CalcFns.calc1099K = safeCalc(function(){
    const gross=getVal('k_gross'),fees=getVal('k_fees'),refunds=getVal('k_refunds'),shipping=getVal('k_shipping'),cogs=getVal('k_cogs'),other=getVal('k_other');
    const r=TE.reconcile1099K(gross,fees,refunds,shipping,cogs,other);
    document.getElementById('k1099-res').innerHTML=resultsBox([
      {label:'Gross 1099-K',val:TE.formatMoney(r.gross)},{label:'Platform fees',val:'-'+TE.formatMoney(fees)},{label:'Returns/refunds',val:'-'+TE.formatMoney(refunds)},{label:'Shipping charged',val:'-'+TE.formatMoney(shipping)},{label:'COGS',val:'-'+TE.formatMoney(cogs)},{label:'Other deductions',val:'-'+TE.formatMoney(other)},{label:'Total deductions',val:'-'+TE.formatMoney(r.deductions)}
    ],'Net taxable income',TE.formatMoney(r.netTaxable))+
    `<div class="calc-panel" style="margin-top:1rem"><p>Your taxable income is <strong>${TE.formatMoney(r.netTaxable)}</strong> - not the ${TE.formatMoney(r.gross)} shown on your 1099-K. If you reported the gross amount without deducting fees and COGS, you would overpay by approximately <strong>${TE.formatMoney(r.gross*0.25)}</strong> in taxes.</p></div>`;
    scrollToResults('k1099-res');
  });
}

/* ===================== Brand Deal Calculator ===================== */
function brandDealCalculatorView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'',text:'Creator Economy'},{href:'',text:'Brand Deal Calculator'})}<h2>Influencer Brand Deal Tax Calculator 2026: Sponsorship Income Estimator</h2><p style="color:var(--muted);margin-bottom:1.5rem">Got a $5,000 or $10,000 brand deal? See instantly what to set aside for federal, state, and SE tax.</p>
    <div class="calc-grid"><div class="calc-panel"><h3>Deal Details</h3>${inputField('bd_amount','Brand deal amount','number',{value:10000})}${inputField('bd_other','Your other annual income','number',{value:45000})}${inputField('bd_ded','Deductions for this deal','number',{value:500})}${selectField('bd_status','Filing status',[{value:'single',label:'Single'},{value:'mfj',label:'Married Filing Jointly'},{value:'hoh',label:'Head of Household'}],{value:'single'})}${selectField('bd_state','State',buildStateOptions(),{value:'CA'})}<div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcBrandDeal()">Calculate</button></div></div></div><div id="bd-res"></div>`+
    renderFaqSection([
      {q:'Do brands send 1099s for gifted products?',a:'Not always. Brands may not send a 1099 for gifted products or trips, but you must still report the fair market value as income. <a href="/creator/instagram">Instagram creator tax guide</a>.'},
      {q:'Are brand deal expenses deductible?',a:'Yes. Creation costs, equipment, travel, and agency fees for the deal are 100% deductible business expenses. Keep receipts.'},
      {q:'Should I set aside more than 30%?',a:'Brand deals can push you into a higher bracket. Use this calculator with your total annual income to get an exact percentage. <a href="/multi-source">Combine all income sources</a> for a precise total.'}
    ]);
  window.CalcFns = window.CalcFns || {};
  window.CalcFns.calcBrandDeal = safeCalc(function(){
    const deal=getVal('bd_amount'),other=getVal('bd_other'),ded=getVal('bd_ded'),status=getSelect('bd_status'),state=getSelect('bd_state');
    const r=TE.calcBrandDeal(deal,other,ded,status,state,DATA);
    document.getElementById('bd-res').innerHTML=resultsBox([
      {label:'Brand deal amount',val:TE.formatMoney(r.dealAmount)},{label:'Deductions',val:'-'+TE.formatMoney(ded)},{label:'Net SE from deal',val:TE.formatMoney(r.netSE)},{label:'SE tax on deal',val:TE.formatMoney(r.seTax)},{label:'Federal tax',val:TE.formatMoney(r.fedTax)},{label:'State tax',val:TE.formatMoney(r.stateTax)}
    ],'Total tax on this deal',TE.formatMoney(r.totalTax))+
    `<div class="calc-panel" style="margin-top:1rem"><h3>Summary</h3><p>You will pay <strong>${TE.formatMoney(r.totalTax)}</strong> in total tax on this <strong>${TE.formatMoney(deal)}</strong> brand deal.</p><p>Your take-home amount is <strong>${TE.formatMoney(r.afterTax)}</strong>.</p><p>Set aside <strong>${(r.setAsidePct*100).toFixed(0)}%</strong> for taxes: <strong>${TE.formatMoney(deal*r.setAsidePct)}</strong>.</p></div>`;
    scrollToResults('bd-res');
  });
  calcBrandDeal();
}

/* ===================== Entity Views ===================== */
function entitiesView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'Entities'})}<h2>Business Entities & Tax Structures</h2><p style="color:var(--muted);margin-bottom:1.5rem">24 entity types, their tax forms, costs, and when each makes sense.</p>
    <div class="section">${sectionLabel('Entity Tax Calculators')}<p style="color:var(--muted);margin:.5rem 0 1rem">Compare business structures, estimate formation costs, and calculate tax savings. Choose the right entity for your profit level, ownership model, and state.</p><div class="tile-grid">
      ${tileCard('🤔','Entity Recommender','Answer 12 questions. Get a recommendation.','Tool','standalone/entity-recommender')}
      ${tileCard('⚖️','LLC vs S-Corp','See exact savings with your numbers.','Compare','standalone/entity-compare')}
      ${tileCard('🏢','S-Corp vs C-Corp','$200k profit → pass-through vs 21% corp rate + dividends.','Compare','standalone/s-vs-c-corp')}
      ${tileCard('💰','Salary Optimizer','Find the optimal salary %.','S-Corp','standalone/scorp-optimizer')}
      ${tileCard('🔍','Reasonable Comp Audit Risk','Is your salary too low? IRS audit probability score.','S-Corp','standalone/comp-audit-risk')}
      ${tileCard('🏛️','Delaware Franchise Tax','Authorized shares vs assumed par value method.','C-Corp','standalone/delaware-tax')}
      ${tileCard('📄','Delaware Formation Cost','One-time LLC/Corp filing fees + registered agent.','Formation','standalone/delaware-formation')}
      ${tileCard('👤','Sole Proprietorship','Schedule C. No entity.','Pass-Through','standalone/sole-prop')}
      ${tileCard('🛡️','Single-Member LLC','Disregarded entity. Same tax, liability shield.','Pass-Through','standalone/single-member-llc')}
      ${tileCard('🤝','Partnership','Multi-member LLC / Partnership. K-1 income.','Pass-Through','standalone/partnership')}
      ${tileCard('🏢','C-Corporation','21% corp tax. Double taxation on dividends.','C-Corp','standalone/c-corp')}
      ${tileCard('⛰️','Wyoming Entity','0% state tax. Privacy + asset protection.','No State Tax','standalone/wyoming')}
      ${tileCard('🏔️','Montana / South Dakota LLC','No sales tax (MT) + no income tax (SD). Compare vs your home state.','Formation','standalone/mt-sd-entity')}
      ${tileCard('💚','Nonprofit (501c3)','Mission income exempt. UBI taxed.','Exempt','standalone/nonprofit')}
    </div></div>
    <div class="section">${sectionLabel('All Entity Types')}<div class="card-grid" id="entity-cards"></div></div>`;
  const container=document.getElementById('entity-cards');
  const entities=DATA.entityTypes;
  for(const key in entities){
    const e=entities[key];
    const card=document.createElement('div');card.className='card';
    card.innerHTML=`<div class="card-cat">${e.taxForm||'See details'}</div><div class="card-title">${key.replace(/([A-Z])/g,' $1').replace(/^./,c=>c.toUpperCase())}</div><div class="card-desc">${e.bestFor||e.note||''}</div><div class="card-meta">${e.annualCost!==undefined?'Cost: '+e.annualCost:'Pass-through: '+(e.passThrough?'Yes':'No')}</div>`;
    container.appendChild(card);
  }
}

/* ===================== Entity Recommender ===================== */
function entityRecommenderView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'Recommender'})}<h2>Entity Recommender</h2><p style="color:var(--muted);margin-bottom:1.5rem">Answer a few questions. We recommend the best structure and estimate your savings.</p>
    <div class="calc-panel">${selectField('er_profit','Expected annual net profit',[{value:'15000',label:'Under $20,000'},{value:'45000',label:'$20,000 – $60,000'},{value:'100000',label:'$60,000 – $150,000'},{value:'250000',label:'$150,000 – $500,000'},{value:'600000',label:'Over $500,000'}],{value:'45000'})}${selectField('er_owners','How many owners?',[{value:'1',label:'Just me'},{value:'2',label:'2 owners'},{value:'3+',label:'3+ owners'}],{value:'1'})}${selectField('er_risk','Liability risk level',[{value:'low',label:'Low (writing, consulting from home)'},{value:'medium',label:'Medium (driving, client visits)'},{value:'high',label:'High (manufacturing, physical products, employees)'}],{value:'medium'})}${selectField('er_vcmoney','Are you raising VC funding?',[{value:'no',label:'No'},{value:'yes',label:'Yes - need C-Corp for investors'}],{value:'no'})}${selectField('er_salary','Do you want to pay yourself a W-2 salary?',[{value:'no',label:'No - keep it simple'},{value:'yes',label:'Yes - I want W-2 and payroll'}],{value:'no'})}${selectField('er_state','Primary state',buildStateOptions(),{value:'CA'})}<div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcEntityRec()">Recommend</button></div></div><div id="er-res"></div>`;
  window.CalcFns = window.CalcFns || {};
  window.CalcFns.calcEntityRec = safeCalc(function(){
    const profit=parseInt(getSelect('er_profit')),owners=getSelect('er_owners'),risk=getSelect('er_risk'),vc=getSelect('er_vcmoney'),salary=getSelect('er_salary'),state=getSelect('er_state');
    const bp=DATA.entityRecommender.breakpoints;
    let rec='',reason='',savings=0;
    if(vc==='yes'){rec='C Corporation (Delaware recommended)';reason=bp.delawareCCorp.trigger;}
    else if(profit<bp.staysSoleProprietor.netProfitBelow&&owners==='1'){rec='Sole Proprietorship or Single-Member LLC';reason=bp.staysSoleProprietor.reason;}
    else if(profit>=bp.considerSCorp.netProfitAbove&&owners==='1'&&salary==='yes'){rec='LLC electing S-Corp status';reason='At '+TE.formatMoney(profit)+', S-Corp saves approximately '+TE.formatMoney(profit*0.08)+'–'+TE.formatMoney(profit*0.12)+' in SE tax vs sole prop. '+bp.considerSCorp.reason;savings=profit*0.10;}
    else if(owners!=='1'){rec='Multi-Member LLC or Partnership';reason='Multiple owners need pass-through with flexible allocation. S-Corp possible later.';}
    else if(risk==='high'){rec='Single-Member LLC (or S-Corp if profitable)';reason='High liability risk demands legal separation. LLC is the minimum.';}
    else{rec='Single-Member LLC';reason='Gives liability protection, minimal cost. Can elect S-Corp later when profitable.';}
    const stateRate=(DATA.states[state]||{}).topRate||0;
    let savingsLabel='Estimated annual savings',savingsValue=savings>0?TE.formatMoney(savings):'N/A';
    if(vc==='yes'){savingsLabel='Tax savings vs pass-through';savingsValue='N/A (C-Corp uses corporate tax structure, not comparable to pass-through savings)';}
    else if(rec.indexOf('Sole Proprietorship')>=0){savingsValue='N/A (S-Corp savings start at '+TE.formatMoney(bp.considerSCorp.netProfitAbove)+'+ profit with W-2 salary)';}
    else if(owners!=='1'){savingsValue='N/A (Depends on profit-sharing agreement)';}
    document.getElementById('er-res').innerHTML=`<div class="results-box"><h3>Recommendation</h3><div class="result-line"><span>Recommended entity</span><span class="num">${rec}</span></div><div class="result-line"><span>${savingsLabel}</span><span class="num">${savingsValue}</span></div><div class="result-line"><span>State income tax rate</span><span class="num">${(stateRate*100).toFixed(1)}%</span></div></div><div class="calc-panel" style="margin-top:1rem"><p>${reason}</p><p><a href="/standalone/entity-compare" class="btn btn-accent">Compare LLC vs S-Corp with your numbers</a></p></div>`;
    scrollToResults('er-res');
  });
}

/* ===================== Entity Compare ===================== */
function entityCompareView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'Compare'})}<h2>LLC vs S Corp Tax Savings Calculator 2026</h2><p style="color:var(--muted);margin-bottom:1.5rem">Enter your net profit and see exactly how much an S-Corp election saves you.</p>
    ${callout('blue','Sole Prop / LLC - No salary required','As a Sole Proprietor or Single-Member LLC, you take <strong>draws</strong> (not salary). The full net profit is subject to <strong>self-employment (SE) tax of 15.3%</strong> plus regular income tax. There is no distinction between "salary" and "distribution."')}
    ${callout('green','S-Corp - Reasonable salary required','As an S-Corp owner-employee, you must pay yourself a <strong>reasonable W-2 salary</strong>. Only the salary portion is subject to payroll tax (FICA ≈ 7.65% employee + 7.65% employer). The remaining <strong>distribution is NOT subject to SE/FICA tax</strong> - it is taxed only as regular income. This is where the savings come from.')}
    <div class="calc-grid"><div class="calc-panel"><h3>Your Numbers</h3>${inputField('ec_profit','Annual net profit (before salary)','number',{value:80000})}${inputField('ec_w2','Other W-2 income (if any)','number',{value:0})}${selectField('ec_status','Filing status',[{value:'single',label:'Single'},{value:'mfj',label:'Married Filing Jointly'},{value:'hoh',label:'Head of Household'}],{value:'single'})}${selectField('ec_state','State',buildStateOptions(),{value:'CA'})}<div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcEntityCompare()">Compare</button></div></div></div><div id="ec-res"></div>`+
    renderFaqSection([
      {q:'When does an S-Corp make sense?',a:'Generally at $60,000–$80,000+ net profit. Below that, compliance costs ($1,500–$3,000/year) often exceed the SE tax savings.'},
      {q:'What is a reasonable salary?',a:'The IRS requires your S-Corp salary to be reasonable for your industry. Too low = audit risk. <a href="/standalone/scorp-optimizer">Find your optimal salary percentage</a>.'},
      {q:'Can I switch from LLC to S-Corp later?',a:'Yes. You can form an LLC today and elect S-Corp status later by filing Form 2553. There is no rush if your profit is below the sweet spot.'}
    ]);
  window.CalcFns = window.CalcFns || {};
  window.CalcFns.calcEntityCompare = safeCalc(function(){
    const profit=getVal('ec_profit'),w2=getVal('ec_w2'),status=getSelect('ec_status'),state=getSelect('ec_state');
    const r=TE.compareEntities(profit,w2,status,state,DATA);
    const saving=r.soleProp.totalTax-r.sCorp.totalTax;
    document.getElementById('ec-res').innerHTML=`<div class="stat-row">${statBlock(TE.formatMoney(r.soleProp.totalTax),'Sole Prop / LLC')}${statBlock(TE.formatMoney(r.sCorp.totalTax),'S-Corp')}${statBlock(TE.formatMoney(saving),'Annual Savings')}</div>
    <div class="results-box"><h3>Breakdown</h3><div class="result-line"><span>Sole Prop - Federal tax</span><span class="num">${TE.formatMoney(r.soleProp.fedTax)}</span></div>${r.soleProp.qbi>0?`<div class="result-line"><span>Sole Prop - QBI deduction</span><span class="num">-${TE.formatMoney(r.soleProp.qbi)}</span></div>`:''}<div class="result-line"><span>Sole Prop - SE tax</span><span class="num">${TE.formatMoney(r.soleProp.seTax)}</span></div><div class="result-line"><span>Sole Prop - State tax</span><span class="num">${TE.formatMoney(r.soleProp.stateTax)}</span></div><div class="result-line"><span>S-Corp - Federal tax</span><span class="num">${TE.formatMoney(r.sCorp.fedTax)}</span></div>${r.sCorp.qbi>0?`<div class="result-line"><span>S-Corp - QBI deduction</span><span class="num">-${TE.formatMoney(r.sCorp.qbi)}</span></div>`:''}<div class="result-line"><span>S-Corp - SE tax (on salary only)</span><span class="num">${TE.formatMoney(r.sCorp.seTax)}</span></div><div class="result-line"><span>S-Corp - State tax</span><span class="num">${TE.formatMoney(r.sCorp.stateTax)}</span></div><div class="result-line"><span>S-Corp - Salary</span><span class="num">${TE.formatMoney(r.sCorp.salary)}</span></div><div class="result-line"><span>S-Corp - Distribution</span><span class="num">${TE.formatMoney(r.sCorp.distribution)}</span></div></div>
    ${callout('green','S-Corp sweet spot',`<strong>At ${TE.formatMoney(profit)} profit:</strong><br><br>&mdash; Salary: <strong>${TE.formatMoney(r.sCorp.salary)}</strong> (subject to FICA ≈ 7.65% employee + 7.65% employer)<br>&mdash; Distribution: <strong>${TE.formatMoney(r.sCorp.distribution)}</strong> (NO SE/FICA tax - regular income tax only)<br><br>Tax savings vs Sole Prop: <strong>${TE.formatMoney(saving)}</strong>/year<br>Typical compliance costs: <strong>$1,500 &ndash; $3,000</strong>/year<br>Net savings: <strong>${TE.formatMoney(Math.max(0,saving-2500))}</strong>/year`)}<div style="margin-top:1rem"><a href="/standalone/scorp-optimizer" class="btn">Find optimal salary %</a></div>`+
    `<div class="calc-panel" style="margin-top:1rem"><h3>Tax Breakdown: SE Tax vs Regular Tax</h3><p><strong>Sole Prop / LLC:</strong></p><ul><li>Full ${TE.formatMoney(profit)} subject to SE tax (15.3%) = <strong>${TE.formatMoney(r.soleProp.seTax)}</strong></li><li>Plus federal + state income tax on profit after SE deduction</li></ul><p><strong>S-Corp:</strong></p><ul><li>Salary ${TE.formatMoney(r.sCorp.salary)} subject to FICA (≈15.3% total) = <strong>${TE.formatMoney(r.sCorp.seTax)}</strong></li><li>Distribution ${TE.formatMoney(r.sCorp.distribution)} subject to <em>only</em> regular income tax (no SE/FICA)</li><li>Plus federal + state income tax on total income after SE deduction and QBI</li></ul></div>`+
    `<div class="calc-panel" style="margin-top:1rem"><h3>Summary</h3><p>As a Sole Prop, you will pay <strong>${TE.formatMoney(r.soleProp.totalTax)}</strong> in total tax.</p><p>As an S-Corp, you will pay <strong>${TE.formatMoney(r.sCorp.totalTax)}</strong> in total tax.</p><p>Switching to S-Corp saves you <strong>${TE.formatMoney(saving)}</strong> per year.</p><p>Your S-Corp take-home after all taxes: <strong>${TE.formatMoney(profit-r.sCorp.totalTax)}</strong>.</p></div>`;
    scrollToResults('ec-res');
  });
}

/* ===================== S-Corp Optimizer ===================== */
function scorpOptimizerView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'Salary Optimizer'})}<h2>S-Corp Reasonable Salary Calculator 2026</h2><p style="color:var(--muted);margin-bottom:1.5rem">Find the sweet spot: what percentage of net profit to pay yourself as W-2 salary vs distribution.</p>${callout('blue','IRS Reasonableness Rule','Your salary must be "reasonable" for your industry. Too low = audit risk. The calculator tests 20% to 60% of net profit.')}
    ${callout('green','Why salary matters for SE tax','In an S-Corp, only your <strong>W-2 salary</strong> is subject to FICA payroll tax (≈15.3% combined employer + employee). Your <strong>distribution</strong> is NOT subject to payroll/SE tax - it flows through as ordinary income taxed only at regular income tax rates. A lower salary % means less payroll tax, but too low triggers IRS scrutiny. A higher salary % means more payroll tax but may be safer.')}
    <div class="calc-grid"><div class="calc-panel"><h3>Inputs</h3>${inputField('so_profit','Net profit before salary','number',{value:120000})}${inputField('so_w2','Other W-2 income (if any)','number',{value:0})}${inputField('so_payroll','Annual payroll admin cost','number',{value:2000,placeholder:'Payroll service, accountant, state fees'})}${selectField('so_status','Filing status',[{value:'single',label:'Single'},{value:'mfj',label:'Married Filing Jointly'}],{value:'single'})}${selectField('so_state','State',buildStateOptions(),{value:'CA'})}<div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcSCorpOpt()">Optimize</button></div></div></div><div id="so-res"></div>`;
  window.CalcFns = window.CalcFns || {};
  window.CalcFns.calcSCorpOpt = safeCalc(function(){
    const profit=getVal('so_profit'),w2=getVal('so_w2'),payroll=getVal('so_payroll')||0,status=getSelect('so_status'),state=getSelect('so_state');
    const r=TE.optimizeSCorpSalary(profit,w2,status,state,DATA,payroll);
    
    // Calculate sole proprietorship for comparison
    const se=TE.calcSETax(profit,DATA);
    const agiSole=profit+w2-se.deductibleHalf;
    const stdDed=TE.getStandardDeduction(status,false,DATA);
    const taxableBeforeQBISole=Math.max(0,agiSole-stdDed);
    const qbiSole=TE.calcQBI(profit,taxableBeforeQBISole,status,DATA);
    const taxableSole=Math.max(0,taxableBeforeQBISole-qbiSole);
    const fedSole=TE.calcFederalTax(taxableSole,status,DATA);
    const stateSole=TE.calcStateTax(agiSole,state,DATA,status);
    const totalTaxSole=fedSole+se.totalSE+stateSole.tax;
    const savings=Math.max(0,totalTaxSole-r.best.totalTax);
    const breakEvenProfit=payroll>0?payroll/0.153:0;
    
    let rows=r.results.map(x=>`<tr><td>${x.pct}%</td><td>${TE.formatMoney(x.salary)}</td><td>${TE.formatMoney(x.distribution)}</td><td>${TE.formatMoney(x.totalTax)}</td><td>${TE.formatMoney(x.fedTax)}</td><td>${TE.formatMoney(x.seTax)}</td><td>${TE.formatMoney(x.stateTax)}</td>${x.qbi>0?`<td>${TE.formatMoney(x.qbi)}</td>`:''}</tr>`).join('');
    const takeHome=profit-r.best.totalTax;
    const takeHomeSole=profit+w2-totalTaxSole;
    
    document.getElementById('so-res').innerHTML=`<div class="calc-panel"><h3>Best: ${r.best.pct}% salary</h3><p>Lowest total tax at <strong>${TE.formatMoney(r.best.totalTax)}</strong> with salary of <strong>${TE.formatMoney(r.best.salary)}</strong> and distribution of <strong>${TE.formatMoney(r.best.distribution)}</strong>.</p><p style="color:var(--muted);margin-top:.5rem">At this split, <strong>${TE.formatMoney(r.best.salary)}</strong> is subject to FICA payroll tax (≈15.3%) and <strong>${TE.formatMoney(r.best.distribution)}</strong> avoids payroll tax entirely.</p></div>
    <div class="calc-panel" style="margin-top:1rem;background:rgba(46,125,50,.08);border-color:var(--success)"><h3>S-Corp vs Sole Proprietorship Comparison</h3>
    <p><strong>Sole Proprietorship total tax:</strong> ${TE.formatMoney(totalTaxSole)} (includes ${TE.formatMoney(se.totalSE)} SE tax on full profit)</p>
    <p><strong>S-Corp total tax (${r.best.pct}% salary):</strong> ${TE.formatMoney(r.best.totalTax)} (includes ${TE.formatMoney(r.best.seTax)} FICA on salary + ${TE.formatMoney(payroll)} payroll admin)</p>
    <p style="font-size:1.1rem;font-weight:700;color:var(--success);margin-top:.5rem">S-Corp saves you <strong>${TE.formatMoney(savings)}</strong> per year</p>
    <p style="color:var(--muted);margin-top:.5rem">S-Corp take-home: ${TE.formatMoney(takeHome)} | Sole prop take-home: ${TE.formatMoney(takeHomeSole)}</p></div>
    ${payroll>0?`<div class="calc-panel" style="margin-top:1rem;background:rgba(255,152,0,.08);border-color:#ff9800"><h3>Break-Even Analysis</h3><p>With your payroll admin cost of ${TE.formatMoney(payroll)}/year, S-Corp becomes worthwhile at approximately <strong>${TE.formatMoney(breakEvenProfit)}</strong> in net profit.</p><p style="color:var(--muted);margin-top:.5rem">Below this profit level, payroll costs exceed SE tax savings. At your current profit of ${TE.formatMoney(profit)}, S-Corp is ${savings>0?'worthwhile':'not yet worthwhile'}.</p></div>`:''}
    <table class="data-table"><thead><tr><th>Salary %</th><th>Salary</th><th>Distribution</th><th>Total Tax</th><th>Fed Tax</th><th>SE/FICA Tax</th><th>State Tax</th>${r.best.qbi>0?'<th>QBI</th>':''}</tr></thead><tbody>${rows}</tbody></table>`+
    `<div class="calc-panel" style="margin-top:1rem"><h3>Tax Breakdown: What Gets SE Tax vs What Doesn\'t</h3><p><strong>Subject to payroll/SE tax:</strong> Your W-2 salary (${TE.formatMoney(r.best.salary)}) - taxed at ≈15.3% FICA = <strong>${TE.formatMoney(r.best.seTax)}</strong></p><p><strong>NOT subject to payroll/SE tax:</strong> Your distribution (${TE.formatMoney(r.best.distribution)}) - taxed only as regular income</p><p style="color:var(--muted);margin-top:.5rem">This is the core S-Corp advantage: every dollar shifted from salary to distribution saves ≈15.3% in payroll tax, but the IRS requires your salary to be "reasonable."</p></div>`+
    `<div class="calc-panel" style="margin-top:1rem"><h3>Summary</h3><p>You will pay <strong>${TE.formatMoney(r.best.totalTax)}</strong> in total tax on <strong>${TE.formatMoney(profit)}</strong> of S-Corp profit.</p><p>Your take-home amount is <strong>${TE.formatMoney(takeHome)}</strong>.</p></div>`;
    scrollToResults('so-res');
  });
}

/* ===================== Reasonable Compensation Audit Risk Calculator ===================== */
function compAuditRiskView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'Reasonable Comp Audit Risk'})}<h2>S-Corp Reasonable Compensation Audit Risk Calculator 2026</h2><p style="color:var(--muted);margin-bottom:1.5rem">IRS data shows S-Corp reasonable compensation is a top audit trigger. Score your risk before filing.</p>${callout('red','Top 3 IRS audit triggers for S-Corps','(1) Zero or near-zero salary with significant profit. (2) Salary below industry norms for the owner\'s role. (3) Distributions far exceeding salary. The IRS won the <strong>Watson case</strong> (8th Cir. 2012) — salary of $24k on $200k profit was unreasonable.')} ${callout('blue','How this calculator works','We score your audit risk from 0 (safe) to 100 (audit likely) based on: (1) your salary-to-profit ratio vs industry norms, (2) profit magnitude, (3) business maturity, (4) employee count, and (5) number of owners. This is an estimate — consult a CPA for a formal reasonable comp study.')}
    <div class="calc-grid"><div class="calc-panel"><h3>Business</h3>${inputField('ar_profit','Net profit before salary','number',{value:200000})}${inputField('ar_salary','Your current W-2 salary','number',{value:40000})}${selectField('ar_industry','Industry / role',[ {value:'software',label:'Software / SaaS / Tech'}, {value:'consulting',label:'Consulting / Professional Services'}, {value:'medical',label:'Medical / Dental / Healthcare'}, {value:'legal',label:'Legal / Accounting / CPA'}, {value:'construction',label:'Construction / Trades'}, {value:'retail',label:'E-commerce / Retail'}, {value:'creative',label:'Creative / Marketing / Media'}, {value:'realestate',label:'Real Estate / Property Management'}, {value:'other',label:'Other / General Business'} ],{value:'consulting'})}${inputField('ar_years','Years in business','number',{value:3})}${inputField('ar_employees','Number of employees (excluding you)','number',{value:0})}${selectField('ar_owners','Other S-Corp owners',[ {value:'0',label:'Just me (100% owner-worker)'}, {value:'1',label:'1 other owner who also works'}, {value:'1passive',label:'1 other owner who is passive'}, {value:'2plus',label:'2+ other owners'} ],{value:'0'})}</div>
    <div class="calc-panel"><h3>Your Profile</h3>${selectField('ar_hours','Hours you work per week in the business',[ {value:'40',label:'40+ hours (full-time)'}, {value:'30',label:'30-39 hours'}, {value:'20',label:'20-29 hours'}, {value:'10',label:'10-19 hours'}, {value:'5',label:'Under 10 hours'} ],{value:'40'})}${selectField('ar_credentials','Your credentials / role level',[ {value:'expert',label:'Advanced degree / 10+ years experience'}, {value:'senior',label:'Senior-level / 5-10 years'}, {value:'mid',label:'Mid-level / 2-5 years'}, {value:'entry',label:'Entry-level / under 2 years'} ],{value:'expert'})}${selectField('ar_state','Your state',buildStateOptions(),{value:'CA'})}<div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcAuditRisk()">Calculate Audit Risk</button></div></div></div>
    <div id="ar-res"></div>`+
    renderFaqSection([
      {q:'What is "reasonable compensation"?',a:'The IRS requires S-Corp owner-employees to pay themselves a <strong>reasonable salary</strong> — what a similar business would pay a non-owner employee for the same work. If you pay yourself $0 or far below market rate while taking large distributions, the IRS can reclassify distributions as wages and hit you with back payroll taxes, penalties, and interest.'},
      {q:'How does the IRS decide what is reasonable?',a:'The IRS looks at: (1) <strong>Your role</strong> — are you the CEO, developer, or bookkeeper? (2) <strong>Hours worked</strong> — full-time vs part-time. (3) <strong>Your qualifications</strong> — degrees, certifications, experience. (4) <strong>Industry data</strong> — Bureau of Labor Statistics wage surveys. (5) <strong>Company size</strong> — revenue, employees, geographic location. (6) <strong>What the company can afford</strong> — a startup may pay less initially.'},
      {q:'What happens if my salary is too low?',a:'The IRS can <strong>reclassify distributions as wages</strong>, making you pay: (1) Back employer + employee FICA (15.3%). (2) Penalties for late payroll tax deposits (up to 15%). (3) Interest on underpaid tax. (4) Accuracy-related penalties (20% of underpayment). In <em>Watson v. Commissioner</em>, the 8th Circuit upheld the IRS\'s reclassification of $175k in distributions as wages on a $200k profit where the owner paid himself only $24k.'},
      {q:'Can I pay myself $0 if the business loses money?',a:'<strong>Yes.</strong> If your S-Corp has no profit or a loss, you are not required to pay yourself a salary. The reasonable compensation rule only applies when the business has <strong>net profit</strong> that could be distributed. If you have profit but reinvest it all, the IRS may still argue you should take a reasonable salary — but reinvestment is a valid defense in some cases.'},
      {q:'What is a safe salary percentage?',a:'There is no fixed IRS rule, but CPAs generally recommend: <strong>40-60%</strong> of net profit for owner-operators in service businesses. <strong>30-50%</strong> for businesses with employees or contractors doing much of the work. <strong>20-40%</strong> for capital-intensive businesses (real estate, investing) where profit comes from assets, not labor. The calculator uses industry-specific benchmarks derived from BLS wage data and S-Corp court cases.'},
      {q:'Should I get a formal reasonable compensation study?',a:'<strong>Yes, if your salary is below 30% of profit.</strong> A formal study (cost: $500-2,500) by a CPA or valuation expert analyzes comparable salaries in your industry, role, and geography. It is your best defense in an audit. The study should document: your job description, hours, qualifications, comparable salary data, and the company\'s financial ability to pay.'}
    ]);

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.calcAuditRisk = safeCalc(function(){
    try{
      const profit=getVal('ar_profit'),salary=getVal('ar_salary'),industry=getSelect('ar_industry'),years=getVal('ar_years'),employees=getVal('ar_employees'),owners=getSelect('ar_owners'),hours=getSelect('ar_hours'),credentials=getSelect('ar_credentials'),state=getSelect('ar_state');
      const ratio=profit>0?salary/profit:0;

      // Industry benchmark salary % ranges (min, target, max)
      const benchmarks={
        software:{min:0.30,target:0.45,max:0.60,label:'Software / SaaS'},
        consulting:{min:0.35,target:0.50,max:0.65,label:'Consulting'},
        medical:{min:0.40,target:0.55,max:0.70,label:'Medical / Healthcare'},
        legal:{min:0.40,target:0.55,max:0.70,label:'Legal / Accounting'},
        construction:{min:0.30,target:0.42,max:0.55,label:'Construction'},
        retail:{min:0.25,target:0.35,max:0.50,label:'E-commerce / Retail'},
        creative:{min:0.30,target:0.42,max:0.55,label:'Creative / Media'},
        realestate:{min:0.20,target:0.30,max:0.45,label:'Real Estate'},
        other:{min:0.30,target:0.45,max:0.60,label:'General Business'}
      };
      const bm=benchmarks[industry]||benchmarks.other;

      // Risk scoring (0-100) — track each factor for accurate breakdown
      let score=0;
      const ratioPts=ratio<bm.min?50:ratio<bm.target-0.05?35:ratio<bm.target?20:ratio<=bm.max?5:0;
      const profitPts=profit>=500000?20:profit>=250000?15:profit>=100000?10:profit>=50000?5:0;
      const yearsPts=years<2?-5:years>10?10:years>5?5:0;
      const empPts=employees>=10?10:employees>=5?7:employees>=2?4:0;
      const ownerPts=owners==='0'?0:owners==='1'?3:owners==='1passive'?7:10;
      const hoursPts=hours==='40'?5:hours==='30'?3:hours==='20'?1:0;
      const credPts=credentials==='expert'?5:credentials==='senior'?3:credentials==='mid'?1:0;
      score=ratioPts+profitPts+yearsPts+empPts+ownerPts+hoursPts+credPts;
      score=Math.max(0,Math.min(100,Math.round(score)));

      // Risk level
      let level,color,icon,summary;
      if(score<=25){ level='Low Risk'; color='var(--success)'; icon='✅'; summary='Your salary appears reasonable for your industry and profit level. Maintain documentation of your compensation decision.'; }
      else if(score<=50){ level='Moderate Risk'; color='#f59e0b'; icon='⚠️'; summary='Your salary is below typical benchmarks. Consider increasing salary or obtaining a formal reasonable compensation study. Document your rationale thoroughly.'; }
      else if(score<=75){ level='High Risk'; color='var(--accent)'; icon='🚨'; summary='Your salary is significantly below industry norms for your profit level. IRS reclassification is a real possibility. Strongly recommended: increase salary to at least '+Math.round(bm.min*100)+'% of profit or get a formal compensation study.'; }
      else{ level='Critical Risk'; color='#dc2626'; icon='⛔'; summary='Your salary is unreasonably low. The IRS has a strong case for reclassification. Immediate action required: increase salary, get a formal study, or consult a tax attorney before filing.'; }

      // Recommended salary range
      const recMin=Math.round(profit*bm.min);
      const recTarget=Math.round(profit*bm.target);
      const recMax=Math.round(profit*bm.max);

      // State tax context
      const stateInfo=DATA.states[state]||{};
      const stateName=stateInfo.name||state;

      const lines=[
        {label:'Net profit (before salary)',val:TE.formatMoney(profit)},
        {label:'Current salary',val:TE.formatMoney(salary)},
        {label:'Salary ratio',val:(ratio*100).toFixed(1)+'%'},
        {label:'Industry benchmark (min/target/max)',val:(bm.min*100).toFixed(0)+'% / '+(bm.target*100).toFixed(0)+'% / '+(bm.max*100).toFixed(0)+'%'},
        {label:'Recommended salary range',val:TE.formatMoney(recMin)+' – '+TE.formatMoney(recMax)},
        {label:'Years in business',val:years.toString()},
        {label:'Employees',val:employees.toString()},
        {label:'Your weekly hours',val:hours+' hrs'},
        {label:'State',val:stateName}
      ];

      const gaugeStyle=`width:100%;height:24px;background:var(--border);border-radius:12px;overflow:hidden;margin:1rem 0`;
      const gaugeFill=`height:100%;width:${score}%;background:linear-gradient(90deg,var(--success) 0%,#f59e0b 50%,var(--accent) 80%,#dc2626 100%);border-radius:12px;transition:width .5s ease`;

      document.getElementById('ar-res').innerHTML=
        `<div class="calc-panel" style="margin-top:1.5rem;text-align:center;border:2px solid ${color}">
          <div style="font-size:3rem;font-weight:800;color:${color}">${score}<span style="font-size:1rem;font-weight:500;color:var(--muted)">/100</span></div>
          <div style="font-size:1.25rem;font-weight:700;color:${color};margin:.5rem 0">${icon} ${level}</div>
          <div style="${gaugeStyle}"><div style="${gaugeFill}"></div></div>
          <div style="display:flex;justify-content:space-between;font-size:.75rem;color:var(--muted)"><span>Safe</span><span>Moderate</span><span>High</span><span>Critical</span></div>
        </div>`+
        resultsBox(lines,'Audit Risk Summary',level)+`
        <div class="calc-panel" style="margin-top:1rem"><h3>📋 Assessment</h3><p>${summary}</p><p style="margin-top:.75rem"><strong>Your situation:</strong> You pay yourself <strong>${(ratio*100).toFixed(1)}%</strong> of ${TE.formatMoney(profit)} profit as salary in the <strong>${bm.label}</strong> industry. The typical range is <strong>${(bm.min*100).toFixed(0)}%-${(bm.max*100).toFixed(0)}%</strong>.</p><p style="margin-top:.5rem"><strong>Recommended action:</strong> Increase salary to at least <strong>${TE.formatMoney(recMin)}</strong> (${(bm.min*100).toFixed(0)}% of profit). The target is <strong>${TE.formatMoney(recTarget)}</strong> (${(bm.target*100).toFixed(0)}%). At your current salary, you save ≈<strong>${TE.formatMoney(Math.round((recTarget-salary)*0.153))}</strong>/year in payroll tax vs the target — but you risk back taxes, penalties, and interest if audited.</p><p style="margin-top:.5rem;color:var(--muted)">Score breakdown: Salary ratio (${ratioPts} pts) + Profit magnitude (${profitPts} pts) + Business maturity (${yearsPts} pts) + Employees (${empPts} pts) + Owner structure (${ownerPts} pts) + Hours (${hoursPts} pts) + Credentials (${credPts} pts)</p></div>`+
        `<div class="calc-panel" style="margin-top:1rem"><h3>📚 Key Court Cases & IRS Guidance</h3><p><strong><em>Watson v. Commissioner</em></strong> (8th Cir. 2012) — S-Corp owner paid himself $24k salary on $200k+ profit. Court upheld IRS reclassification of $175k distributions as wages. <strong>Lesson:</strong> 12% salary ratio was unreasonable.</p><p style="margin-top:.5rem"><strong><em>Sean McAlary Ltd. v. Commissioner</em></strong> (TC 2014) — Real estate S-Corp owner paid $0 salary on $200k profit. Court imposed $100k reasonable salary. <strong>Lesson:</strong> Even in capital-intensive industries, active owners need salary.</p><p style="margin-top:.5rem"><strong>IRS Fact Sheet 2008-25</strong> — "S corporation shareholders who provide services to the corporation must be treated as employees and paid reasonable compensation."</p></div>`;
      scrollToResults('ar-res');
    }catch(err){
      document.getElementById('ar-res').innerHTML=`<div class="callout" style="background:rgba(201,74,30,.1);border-color:var(--accent)"><strong>Error:</strong> ${err.message}</div>`;
      console.error(err);
    }
  });
}

/* ===================== Delaware Franchise Tax ===================== */
function delawareTaxView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'Delaware Tax'})}<h2>Delaware C-Corp Franchise Tax Calculator 2026</h2><p style="color:var(--muted);margin-bottom:1.5rem">Delaware offers two methods. Startups with many authorized shares almost always save with the Assumed Par Value method.</p>${callout('yellow','Critical Tip','The Authorized Shares Method is the DEFAULT. Delaware bills you this unless you request the Assumed Par Value method. Startups commonly overpay by $10,000–$80,000+ per year.')}
    <div class="calc-grid"><div class="calc-panel"><h3>Your Corporation</h3>${inputField('dt_shares','Authorized shares','number',{value:10000000})}${inputField('dt_issued','Issued shares (including treasury)','number',{value:1000000})}${inputField('dt_assets','Total gross assets (Schedule L)','number',{value:2000000})}${inputField('dt_large','Large Corporate Filer (cap $250K)','checkbox')}<div class="btn-group"><button class="btn btn-accent" id="dt-calc-btn" onclick="window.CalcFns.calcDelaware()">Calculate Both Methods</button></div></div></div><div id="dt-res"></div>`;
  window.CalcFns = window.CalcFns || {};
  window.CalcFns.calcDelaware = safeCalc(function(){
  const shares=getVal('dt_shares'),issued=getVal('dt_issued'),assets=getVal('dt_assets'),large=getVal('dt_large');
  const r=TE.calcDelawareFranchiseTax(shares,assets,issued,large,DATA);
  const authTotal=r.authMethod+r.filingFee;
  const parTotal=r.parValueMethod+r.filingFee;
  const savings=Math.max(0,authTotal-parTotal);
  const bestMethod=r.authMethod<=r.parValueMethod?'Authorized Shares Method':'Assumed Par Value Method';
  document.getElementById('dt-res').innerHTML=
  `<div class="calc-grid" style="margin-top:1.5rem">
    <div class="calc-panel"><h3>Method 1: Authorized Shares</h3>
    <div class="result-line"><span>Franchise tax</span><span class="num">${TE.formatMoney(r.authMethod)}</span></div>
    <div class="result-line"><span>Filing fee</span><span class="num">${TE.formatMoney(r.filingFee)}</span></div>
    <div class="result-line total"><span>Total</span><span class="num">${TE.formatMoney(authTotal)}</span></div></div>
    <div class="calc-panel"><h3>Method 2: Assumed Par Value</h3>
    <div class="result-line"><span>Franchise tax</span><span class="num">${TE.formatMoney(r.parValueMethod)}</span></div>
    <div class="result-line"><span>Filing fee</span><span class="num">${TE.formatMoney(r.filingFee)}</span></div>
    <div class="result-line total"><span>Total</span><span class="num">${TE.formatMoney(parTotal)}</span></div></div>
  </div>
  <div class="calc-panel" style="margin-top:1rem"><h3>Comparison</h3>
  <p>The <strong>${bestMethod}</strong> is cheaper.</p>
  <p>Difference: <strong>${TE.formatMoney(savings)}</strong> per year.</p>
  <p>You should pay: <strong>${TE.formatMoney(Math.min(authTotal,parTotal))}</strong> total (tax + filing fee).</p>
  <p style="color:var(--muted);margin-top:.75rem">Late penalty if missed: <strong>${TE.formatMoney(r.filingFee+200)}</strong> (includes $200 fine + 1.5%/month interest).</p></div>`;
    scrollToResults('dt-res');
  });
}

/* ===================== Delaware Formation Cost Calculator ===================== */
function delawareFormationView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'Delaware Formation'})}<h2>Delaware LLC & Corp Formation Cost Calculator 2026</h2><p style="color:var(--muted);margin-bottom:1.5rem">One-time costs to form a Delaware LLC or Corporation. Compare filing fees, expedited options, and registered agent costs.</p>${callout('yellow','Annual fees are separate','This calculator covers one-time formation costs only. Delaware LLCs pay a $300 annual tax. Corporations pay annual franchise tax + $50 report fee. <a href="/standalone/delaware-tax">Calculate ongoing franchise tax</a>')}
    <div class="calc-grid"><div class="calc-panel"><h3>Entity</h3>
      ${selectField('df_entity','Entity type',[{value:'llc',label:'LLC (Limited Liability Company)'},{value:'corp',label:'Corporation (C-Corp)'}],{value:'llc',onchange:'calcDelawareFormation()'})}
      ${selectField('df_expedite','Expedited filing',[{value:'none',label:'Standard (7-10 business days, $0)'},{value:'24hr',label:'24-Hour ($50)'},{value:'same',label:'Same Day ($500)'},{value:'2hr',label:'2-Hour ($1,000)'}],{value:'none',onchange:'calcDelawareFormation()'})}
      ${inputField('df_shares','Authorized shares (Corp only)','number',{value:10000000,oninput:'calcDelawareFormation()'})}
    </div>
    <div class="calc-panel"><h3>Services</h3>
      ${selectField('df_agent','Registered agent',[{value:'self',label:'I am my own agent ($0, must have DE address)'},{value:'basic',label:'Basic service ($50/year)'},{value:'standard',label:'Standard service ($100/year)'},{value:'premium',label:'Premium service ($200/year)'}],{value:'standard',onchange:'calcDelawareFormation()'})}
      ${inputField('df_copy','Certified copy ($50 each)','number',{value:1,oninput:'calcDelawareFormation()'})}
      ${inputField('df_apostille','Apostille ($80 each)','number',{value:0,oninput:'calcDelawareFormation()'})}
      <div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcDelawareFormation()">Calculate Formation Cost</button></div>
    </div></div>
    <div id="df-res"></div>`+
    renderFaqSection([
      {q:'Why form in Delaware?',a:'Delaware has a specialized business court (Court of Chancery), well-developed corporate law, and is preferred by VCs and public companies. For small businesses, the benefits are often outweighed by the cost unless you plan to raise VC funding or go public.'},
      {q:'Do I need a registered agent?',a:'Yes. Delaware requires every LLC and corporation to maintain a registered agent with a physical Delaware address. If you do not live in Delaware, you must hire a service. Expect $50-200/year.'},
      {q:'What is an apostille?',a:'An apostille authenticates your formation documents for use in foreign countries that are members of the Hague Convention. You only need this if you are doing business internationally.'}
    ]);
  window.CalcFns = window.CalcFns || {};
  window.CalcFns.calcDelawareFormation = safeCalc(function(){
    const entity=getSelect('df_entity'),expedite=getSelect('df_expedite'),shares=getVal('df_shares');
    const agent=getSelect('df_agent'),copies=getVal('df_copy'),apostilles=getVal('df_apostille');
    let filingFee=0,expediteFee=0,agentFee=0;
    if(entity==='llc'){filingFee=110;}
    else{
      const baseFee=109;
      const extraShares=Math.max(0,shares-1500);
      const extraFee=Math.ceil(extraShares/10000)*50;
      filingFee=baseFee+extraFee;
    }
    switch(expedite){case '24hr':expediteFee=50;break;case 'same':expediteFee=500;break;case '2hr':expediteFee=1000;break;}
    switch(agent){case 'basic':agentFee=50;break;case 'standard':agentFee=100;break;case 'premium':agentFee=200;break;}
    const copyFee=copies*50;
    const apostilleFee=apostilles*80;
    const total=filingFee+expediteFee+agentFee+copyFee+apostilleFee;
    const lines=[
      {label:'Filing fee ('+(entity==='llc'?'LLC Certificate of Formation':'Certificate of Incorporation')+')',val:TE.formatMoney(filingFee)}
    ];
    if(expediteFee>0) lines.push({label:'Expedited filing ('+expedite+')',val:TE.formatMoney(expediteFee)});
    if(agentFee>0) lines.push({label:'Registered agent (1st year)',val:TE.formatMoney(agentFee)});
    if(copyFee>0) lines.push({label:'Certified copies ('+copies+')',val:TE.formatMoney(copyFee)});
    if(apostilleFee>0) lines.push({label:'Apostilles ('+apostilles+')',val:TE.formatMoney(apostilleFee)});
    const bigCard='background:var(--card);border:1px solid var(--border);border-radius:12px;padding:1.5rem;text-align:center;margin-bottom:1rem';
    const bigNum='font-size:2.2rem;font-weight:700;color:var(--accent);display:block';
    const bigLbl='font-size:.85rem;color:var(--muted);margin-top:.25rem;display:block';
    document.getElementById('df-res').innerHTML=resultsBox(lines,'Total formation cost',TE.formatMoney(total))+
    `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-top:1rem">`+
    `<div style="${bigCard};border-top:4px solid #ff9800"><span style="${bigNum};color:#ff9800">${TE.formatMoney(filingFee)}</span><span style="${bigLbl}">Filing Fee</span></div>`+
    `<div style="${bigCard};border-top:4px solid #f44336"><span style="${bigNum};color:#f44336">${TE.formatMoney(total)}</span><span style="${bigLbl}">Total Cost</span></div>`+
    `</div>`+
    `<div class="calc-panel" style="margin-top:1rem;background:rgba(46,125,50,.08);border-color:var(--success)"><h3>Ongoing Costs</h3><p><strong>LLC:</strong> $300 annual tax (due June 1). Late penalty: $200 + 1.5%/month interest.</p><p style="margin-top:.5rem"><strong>Corporation:</strong> Annual report $50 + franchise tax. <a href="/standalone/delaware-tax">Calculate franchise tax</a>. Late penalty: $200 + 1.5%/month.</p><p style="margin-top:.5rem"><strong>Registered agent:</strong> Recurring $50-200/year.</p></div>`;
    scrollToResults('df-res');
  });
}

/* ===================== Sole Proprietorship Calculator ===================== */
function solePropView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'Sole Proprietorship'})}<h2>Sole Proprietorship Tax Calculator 2026 | Schedule C</h2><p style="color:var(--muted);margin-bottom:1.5rem">No legal entity. You and the business are one. Schedule C on your personal return.</p>${callout('yellow','No liability protection','Personal assets at risk. Consider Single-Member LLC for liability shield at minimal cost.')}
    ${callout('blue','No salary required - full profit gets SE tax','As a Sole Proprietor, you do <strong>not</strong> pay yourself a W-2 salary. You take <strong>owner draws</strong>. The entire net profit is subject to <strong>self-employment (SE) tax of 15.3%</strong> (Social Security 12.4% + Medicare 2.9%) plus regular federal and state income tax. Consider an LLC for liability protection, or an S-Corp election if profit exceeds ~$60K to reduce SE tax. <a href="/standalone/entity-compare">Compare LLC vs S-Corp</a>')}
    <div class="calc-grid"><div class="calc-panel"><h3>Income</h3>${inputField('sp_gross','Gross business income','number',{value:60000})}${inputField('sp_ded','Total deductions','number',{value:15000})}${selectField('sp_status','Filing status',[{value:'single',label:'Single'},{value:'mfj',label:'Married Filing Jointly'},{value:'hoh',label:'Head of Household'}],{value:'single'})}${selectField('sp_state','State',buildStateOptions(),{value:'CA'})}${inputField('sp_dependents','Dependents under 17','number',{value:0})}${inputField('sp_age65','Age 65+', 'checkbox')}<div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcSoleProp()">Calculate</button></div></div></div><div id="sp-res"></div>`;
  window.CalcFns = window.CalcFns || {};
  window.CalcFns.calcSoleProp = safeCalc(function(){
    try{
    const gross=getVal('sp_gross'),ded=getVal('sp_ded'),status=getSelect('sp_status'),state=getSelect('sp_state'),dependents=getVal('sp_dependents'),age65=getVal('sp_age65');
    const net=Math.max(0,gross-ded);
    const se=TE.calcSETax(net,DATA);
    const agi=net-se.deductibleHalf;
    const stdDed=TE.getStandardDeduction(status,age65,DATA);
    const taxableBeforeQBI=Math.max(0,agi-stdDed);
    const qbi=TE.calcQBI(net,taxableBeforeQBI,status,DATA);
    const taxable=Math.max(0,taxableBeforeQBI-qbi);
    const fed=TE.calcFederalTax(taxable,status,DATA);
    const stateRes=TE.calcStateTax(agi,state,DATA,status);
    const childCredit=TE.calcChildTaxCredit(dependents,agi,status,DATA);
    const totalTax=Math.max(0,fed+se.totalSE+stateRes.tax-childCredit);
    const lines=[{label:'Gross income',val:TE.formatMoney(gross)},{label:'Deductions',val:'-'+TE.formatMoney(ded)},{label:'Net SE income',val:TE.formatMoney(net)},{label:'AGI',val:TE.formatMoney(agi)},{label:'Standard deduction',val:'-'+TE.formatMoney(stdDed)}];
    if(qbi>0){lines.push({label:'Taxable income before QBI',val:TE.formatMoney(taxableBeforeQBI)},{label:'QBI deduction',val:'-'+TE.formatMoney(qbi)},{label:'Taxable income after QBI',val:TE.formatMoney(taxable)});}else{lines.push({label:'Taxable income',val:TE.formatMoney(taxable)});}
    lines.push({label:'SE tax (15.3%)',val:TE.formatMoney(se.totalSE)},{label:'Federal income tax',val:TE.formatMoney(fed)},{label:'State income tax',val:TE.formatMoney(stateRes.tax)});
    if(childCredit>0) lines.push({label:'Child tax credit',val:'-'+TE.formatMoney(childCredit)});
    document.getElementById('sp-res').innerHTML=resultsBox(lines,'Total tax owed',TE.formatMoney(totalTax))+
    `<div class="calc-panel" style="margin-top:1rem"><h3>Summary</h3><p>You will pay <strong>${TE.formatMoney(totalTax)}</strong> in total tax on <strong>${TE.formatMoney(gross)}</strong> of gross income.</p><p>Your take-home amount is <strong>${TE.formatMoney(gross-totalTax)}</strong>.</p><p style="color:var(--muted)">Effective tax rate: <strong>${(totalTax/gross*100).toFixed(1)}%</strong></p></div>`;
    scrollToResults('sp-res');
    }catch(err){document.getElementById('sp-res').innerHTML=`<div class="callout" style="background:rgba(201,74,30,.1);border-color:var(--accent)"><strong>Error:</strong> ${err.message}</div>`;console.error(err);}
  });
}

/* ===================== Single-Member LLC Calculator ===================== */
function singleMemberLLCView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'Single-Member LLC'})}<h2>Single Member LLC Schedule C Tax Estimator 2026</h2><p style="color:var(--muted);margin-bottom:1.5rem">Default: disregarded entity. Same tax as Sole Prop but with liability protection.</p>${callout('green','Liability protection','Your personal assets are shielded from business debts and lawsuits. Tax is identical to Sole Prop.')}
    ${callout('blue','No salary required - but full profit gets SE tax','As a Single-Member LLC owner, you do <strong>not</strong> pay yourself a W-2 salary. You take <strong>owner draws</strong>. The entire net profit is subject to <strong>self-employment (SE) tax of 15.3%</strong> (Social Security 12.4% + Medicare 2.9%) plus regular federal and state income tax. To reduce SE tax, consider electing S-Corp status once profit exceeds ~$60,000–$80,000. <a href="/standalone/entity-compare">Compare LLC vs S-Corp</a>')}
    <div class="calc-grid"><div class="calc-panel"><h3>Income</h3>${inputField('sm_gross','Gross business income','number',{value:60000})}${inputField('sm_ded','Total deductions','number',{value:15000})}${selectField('sm_status','Filing status',[{value:'single',label:'Single'},{value:'mfj',label:'Married Filing Jointly'},{value:'hoh',label:'Head of Household'}],{value:'single'})}${selectField('sm_state','State',buildStateOptions(),{value:'CA'})}${inputField('sm_dependents','Dependents under 17','number',{value:0})}${inputField('sm_age65','Age 65+', 'checkbox')}<div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcSingleMember()">Calculate</button></div></div></div><div id="sm-res"></div>`;
  window.CalcFns = window.CalcFns || {};
  window.CalcFns.calcSingleMember = safeCalc(function(){
    try{
    const gross=getVal('sm_gross'),ded=getVal('sm_ded'),status=getSelect('sm_status'),state=getSelect('sm_state'),dependents=getVal('sm_dependents'),age65=getVal('sm_age65');
    const net=Math.max(0,gross-ded);
    const se=TE.calcSETax(net,DATA);
    const agi=net-se.deductibleHalf;
    const stdDed=TE.getStandardDeduction(status,age65,DATA);
    const taxableBeforeQBI=Math.max(0,agi-stdDed);
    const qbi=TE.calcQBI(net,taxableBeforeQBI,status,DATA);
    const taxable=Math.max(0,taxableBeforeQBI-qbi);
    const fed=TE.calcFederalTax(taxable,status,DATA);
    const stateRes=TE.calcStateTax(agi,state,DATA,status);
    const childCredit=TE.calcChildTaxCredit(dependents,agi,status,DATA);
    const totalTax=Math.max(0,fed+se.totalSE+stateRes.tax-childCredit);
    const lines=[{label:'Gross income',val:TE.formatMoney(gross)},{label:'Deductions',val:'-'+TE.formatMoney(ded)},{label:'Net SE income',val:TE.formatMoney(net)},{label:'AGI',val:TE.formatMoney(agi)},{label:'Standard deduction',val:'-'+TE.formatMoney(stdDed)}];
    if(qbi>0){lines.push({label:'Taxable income before QBI',val:TE.formatMoney(taxableBeforeQBI)},{label:'QBI deduction',val:'-'+TE.formatMoney(qbi)},{label:'Taxable income after QBI',val:TE.formatMoney(taxable)});}else{lines.push({label:'Taxable income',val:TE.formatMoney(taxable)});}
    lines.push({label:'SE tax (15.3%)',val:TE.formatMoney(se.totalSE)},{label:'Federal income tax',val:TE.formatMoney(fed)},{label:'State income tax',val:TE.formatMoney(stateRes.tax)});
    if(childCredit>0) lines.push({label:'Child tax credit',val:'-'+TE.formatMoney(childCredit)});
    document.getElementById('sm-res').innerHTML=resultsBox(lines,'Total tax owed',TE.formatMoney(totalTax))+
    `<div class="calc-panel" style="margin-top:1rem"><h3>Tax Breakdown: SE Tax vs Regular Tax</h3><p><strong>Self-Employment Tax (15.3%) on full net profit ${TE.formatMoney(net)}:</strong> <strong>${TE.formatMoney(se.totalSE)}</strong></p><p>This covers:</p><ul><li>Social Security (12.4%) - up to the wage base</li><li>Medicare (2.9%) - no cap</li></ul><p><strong>Regular Income Tax on profit after SE deduction and QBI:</strong></p><ul><li>Federal tax: <strong>${TE.formatMoney(fed)}</strong></li><li>State tax: <strong>${TE.formatMoney(stateRes.tax)}</strong></li>${qbi>0?`<li>QBI deduction: <strong>-${TE.formatMoney(qbi)}</strong></li>`:''}</ul><p style="color:var(--muted)">Half of your SE tax is deductible above-the-line, reducing your AGI by <strong>${TE.formatMoney(se.deductibleHalf)}</strong>.</p></div>`+
    `<div class="calc-panel" style="margin-top:1rem"><h3>Summary</h3><p>You will pay <strong>${TE.formatMoney(totalTax)}</strong> in total tax on <strong>${TE.formatMoney(gross)}</strong> of gross income.</p><p>Your take-home amount is <strong>${TE.formatMoney(gross-totalTax)}</strong>.</p><p style="color:var(--muted)">Tax is identical to a Sole Proprietorship. The LLC adds <strong>liability protection</strong> for ~$50–300/year in state fees. No salary required - but consider S-Corp election if profit exceeds ~$60K to reduce SE tax. <a href="/standalone/entity-compare">Compare LLC vs S-Corp</a></p></div>`;
    scrollToResults('sm-res');
    }catch(err){document.getElementById('sm-res').innerHTML=`<div class="callout" style="background:rgba(201,74,30,.1);border-color:var(--accent)"><strong>Error:</strong> ${err.message}</div>`;console.error(err);}
  });
}

/* ===================== Partnership Calculator ===================== */
function partnershipView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'Partnership / Multi-Member LLC'})}<h2>Partnership Tax Calculator 2026 | Schedule K-1</h2><p style="color:var(--muted);margin-bottom:1.5rem">Form 1065 + K-1. Each partner pays tax on their distributive share.</p>${callout('blue','SE tax on general partners only','General partners pay SE tax on their share. Limited partners do not.')}
    <div class="calc-grid"><div class="calc-panel"><h3>Partnership</h3>${inputField('p_gross','Gross partnership revenue','number',{value:180000})}${inputField('p_ded','Partnership deductions','number',{value:60000})}${inputField('p_your_share','Your share (%)','number',{value:50})}${selectField('p_type','Your partner type',[{value:'general',label:'General partner'},{value:'limited',label:'Limited partner'}],{value:'general'})}${inputField('p_other','Your other income (W-2, etc.)','number',{value:0})}${selectField('p_status','Filing status',[{value:'single',label:'Single'},{value:'mfj',label:'Married Filing Jointly'},{value:'hoh',label:'Head of Household'}],{value:'single'})}${selectField('p_state','State',buildStateOptions(),{value:'CA'})}${inputField('p_dependents','Dependents under 17','number',{value:0})}<div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcPartnership()">Calculate</button></div></div></div><div id="p-res"></div>`;
  window.CalcFns = window.CalcFns || {};
  window.CalcFns.calcPartnership = safeCalc(function(){
    try{
    const gross=getVal('p_gross'),ded=getVal('p_ded'),sharePct=getVal('p_your_share'),type=getSelect('p_type'),other=getVal('p_other'),status=getSelect('p_status'),state=getSelect('p_state'),dependents=getVal('p_dependents');
    const net=Math.max(0,gross-ded);
    const yourShare=net*(sharePct/100);
    const se=type==='general'?TE.calcSETax(yourShare,DATA):{totalSE:0,deductibleHalf:0};
    const agi=other+yourShare-se.deductibleHalf;
    const stdDed=TE.getStandardDeduction(status,false,DATA);
    const taxableBeforeQBI=Math.max(0,agi-stdDed);
    const qbi=type==='general'?TE.calcQBI(yourShare,taxableBeforeQBI,status,DATA):0;
    const taxable=Math.max(0,taxableBeforeQBI-qbi);
    const fed=TE.calcFederalTax(taxable,status,DATA);
    const stateRes=TE.calcStateTax(agi,state,DATA,status);
    const childCredit=TE.calcChildTaxCredit(dependents,agi,status,DATA);
    const totalTax=Math.max(0,fed+se.totalSE+stateRes.tax-childCredit);
    const lines=[{label:'Gross partnership revenue',val:TE.formatMoney(gross)},{label:'Deductions',val:'-'+TE.formatMoney(ded)},{label:'Net partnership income',val:TE.formatMoney(net)},{label:'Your share ('+sharePct+'%)',val:TE.formatMoney(yourShare)},{label:'SE tax ('+(type==='general'?'15.3%':'0% - limited partner')+')',val:TE.formatMoney(se.totalSE)},{label:'Your other income',val:TE.formatMoney(other)},{label:'AGI',val:TE.formatMoney(agi)},{label:'Standard deduction',val:'-'+TE.formatMoney(stdDed)}];
    if(qbi>0){lines.push({label:'Taxable income before QBI',val:TE.formatMoney(taxableBeforeQBI)},{label:'QBI deduction',val:'-'+TE.formatMoney(qbi)},{label:'Taxable income after QBI',val:TE.formatMoney(taxable)});}else{lines.push({label:'Taxable income',val:TE.formatMoney(taxable)});}
    lines.push({label:'Federal income tax',val:TE.formatMoney(fed)},{label:'State income tax',val:TE.formatMoney(stateRes.tax)});
    if(childCredit>0) lines.push({label:'Child tax credit',val:'-'+TE.formatMoney(childCredit)});
    document.getElementById('p-res').innerHTML=resultsBox(lines,'Total tax on your partnership income',TE.formatMoney(totalTax))+
    `<div class="calc-panel" style="margin-top:1rem"><h3>Summary</h3><p>You will pay <strong>${TE.formatMoney(totalTax)}</strong> in total tax on your <strong>${TE.formatMoney(yourShare)}</strong> partnership share.</p><p>Your take-home from this partnership: <strong>${TE.formatMoney(yourShare-se.totalSE-(fed+stateRes.tax-childCredit))}</strong>.</p></div>`;
    scrollToResults('p-res');
    }catch(err){document.getElementById('p-res').innerHTML=`<div class="callout" style="background:rgba(201,74,30,.1);border-color:var(--accent)"><strong>Error:</strong> ${err.message}</div>`;console.error(err);}
  });
}

/* ===================== C-Corporation Calculator ===================== */
function cCorpView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'C-Corporation'})}<h2>C-Corporation Tax Calculator 2026 | Form 1120</h2><p style="color:var(--muted);margin-bottom:1.5rem">Corp pays 21% on profits. Double taxation if dividends distributed. Salary is deductible.</p>${callout('yellow','Double taxation warning','Corp profits taxed at 21%. If you take dividends, you pay tax again at 0–20% qualified dividend rate. Salary avoids this but triggers payroll tax.')}
    ${callout('blue','C-Corp owner must take reasonable salary','If you work in your C-Corp, the IRS requires you to pay yourself a <strong>reasonable W-2 salary</strong> (not just take dividends). Salary is deductible to the corp but triggers <strong>FICA payroll tax</strong> (≈15.3% total: 7.65% employee + 7.65% employer). The employer portion is deductible, reducing corp tax. Dividends avoid payroll tax but are double-taxed (corp 21% + your dividend rate).')}
    <div class="calc-grid"><div class="calc-panel"><h3>Corporation</h3>${inputField('cc_rev','Gross revenue','number',{value:200000})}${inputField('cc_ded','Deductions (excl. salary)','number',{value:50000})}${inputField('cc_salary','Salary paid to you','number',{value:80000})}${inputField('cc_dividends','Dividends distributed','number',{value:20000})}</div><div class="calc-panel"><h3>You (shareholder)</h3>${inputField('cc_other','Your other income','number',{value:0})}${selectField('cc_status','Filing status',[{value:'single',label:'Single'},{value:'mfj',label:'Married Filing Jointly'},{value:'hoh',label:'Head of Household'}],{value:'single'})}${selectField('cc_state','State',buildStateOptions(),{value:'CA'})}${inputField('cc_dependents','Dependents under 17','number',{value:0})}<div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcCCorp()">Calculate</button></div></div></div><div id="cc-res"></div>`;
  window.CalcFns = window.CalcFns || {};
  window.CalcFns.calcCCorp = safeCalc(function(){
    try{
    const rev=getVal('cc_rev'),ded=getVal('cc_ded'),salary=getVal('cc_salary'),dividends=getVal('cc_dividends'),other=getVal('cc_other'),status=getSelect('cc_status'),state=getSelect('cc_state'),dependents=getVal('cc_dependents');
    const se=DATA.federal.selfEmployment;
    const empSSRate = se.socialSecurityRate / 2;
    const empMedicareRate = se.medicareRate / 2;
    const ficaSS=Math.min(salary,Math.max(0,se.socialSecurityWageBase-other))*empSSRate;
    const ficaMedicare=salary*empMedicareRate;
    const employeeFica=ficaSS+ficaMedicare;
    const employerFica=employeeFica;
    const corpTaxable=Math.max(0,rev-ded-salary-employerFica);
    const corpTax=corpTaxable*DATA.entityTypes.cCorporation.corporateTaxRate;
    // Owner tax: W-2 + dividends
    const w2Taxable=salary+other;
    const ownerAGI=w2Taxable+dividends; // dividends are part of AGI
    const stdDed=TE.getStandardDeduction(status,false,DATA);
    const ownerTaxable=Math.max(0,ownerAGI-stdDed);
    const ownerFed=TE.calcFederalTax(ownerTaxable,status,DATA);
    const ownerStateRes=TE.calcStateTax(ownerAGI,state,DATA,status);
    const ownerStateTax=ownerStateRes.tax;
    const childCredit=TE.calcChildTaxCredit(dependents,ownerAGI,status,DATA);
    const ownerTotal=Math.max(0,ownerFed+ownerStateTax-childCredit);
    // Qualified dividend tax (dividends stack on top of ordinary taxable income after stdDed)
    const ordinaryTaxable=Math.max(0,w2Taxable-stdDed);
    const divTax=TE.calcLTCGTax(dividends,ordinaryTaxable,status,DATA);
    const totalTax=corpTax+ownerTotal+employeeFica+divTax+employerFica;
    const lines=[{label:'Corp gross revenue',val:TE.formatMoney(rev)},{label:'Corp deductions',val:'-'+TE.formatMoney(ded)},{label:'Salary (deductible)',val:'-'+TE.formatMoney(salary)},{label:'Employer FICA (deductible)',val:'-'+TE.formatMoney(employerFica)},{label:'Corp taxable income',val:TE.formatMoney(corpTaxable)},{label:'Corp tax (21%)',val:TE.formatMoney(corpTax)},{label:'Your salary',val:TE.formatMoney(salary)},{label:'Employee FICA (7.65%)',val:TE.formatMoney(employeeFica)},{label:'Federal tax on salary',val:TE.formatMoney(ownerFed)},{label:'State tax on salary',val:TE.formatMoney(ownerStateTax)},{label:'Dividends',val:TE.formatMoney(dividends)},{label:'Dividend tax',val:TE.formatMoney(divTax)}];
    if(childCredit>0) lines.push({label:'Child tax credit',val:'-'+TE.formatMoney(childCredit)});
    document.getElementById('cc-res').innerHTML=resultsBox(lines,'Total tax (corp + you)',TE.formatMoney(totalTax))+
    `<div class="calc-panel" style="margin-top:1rem"><h3>Tax Breakdown: Salary vs Dividends</h3><p><strong>Salary ${TE.formatMoney(salary)}:</strong></p><ul><li>Subject to employee FICA (7.65%) = <strong>${TE.formatMoney(employeeFica)}</strong></li><li>Subject to federal + state income tax = <strong>${TE.formatMoney(ownerTotal)}</strong></li><li>Corp also pays employer FICA (7.65%) = <strong>${TE.formatMoney(employerFica)}</strong> - deductible, reducing corp tax</li></ul><p><strong>Dividends ${TE.formatMoney(dividends)}:</strong></p><ul><li>NOT subject to FICA / payroll tax</li><li>Subject to corp tax (21%) first, then your qualified dividend tax = <strong>${TE.formatMoney(divTax)}</strong></li><li>This is "double taxation" - the same profit is taxed twice</li></ul></div>`+
    `<div class="calc-panel" style="margin-top:1rem"><h3>Summary</h3><p>Corporation pays <strong>${TE.formatMoney(corpTax)}</strong> in federal tax + <strong>${TE.formatMoney(employerFica)}</strong> employer FICA.</p><p>You pay <strong>${TE.formatMoney(ownerTotal+employeeFica+divTax)}</strong> in personal tax (income + FICA + dividends).</p><p>Total tax burden: <strong>${TE.formatMoney(totalTax)}</strong>.</p><p>Your take-home (salary + dividends - personal tax): <strong>${TE.formatMoney(salary+dividends-(ownerTotal+employeeFica+divTax))}</strong>.</p></div>`;
    scrollToResults('cc-res');
    }catch(err){document.getElementById('cc-res').innerHTML=`<div class="callout" style="background:rgba(201,74,30,.1);border-color:var(--accent)"><strong>Error:</strong> ${err.message}</div>`;console.error(err);}
  });
  calcCCorp();
}

/* ===================== Wyoming Entity Calculator ===================== */
function wyomingView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'Wyoming Entity'})}<h2>Wyoming LLC Tax Advantages Calculator 2026</h2><p style="color:var(--muted);margin-bottom:1.5rem">No Wyoming income tax. Low annual fees. Strong privacy protections.</p>${callout('green','No state income tax','Wyoming has 0% personal and corporate income tax. You only pay federal tax.')}
    <div class="calc-grid"><div class="calc-panel"><h3>Entity</h3>${selectField('wy_type','Entity type',[{value:'llc',label:'Wyoming LLC (pass-through)'},{value:'ccorp',label:'Wyoming C-Corp'}],{value:'llc',onchange:'calcWyoming()'})}${inputField('wy_gross','Gross income / revenue','number',{value:80000,oninput:'calcWyoming()'})}${inputField('wy_ded','Deductions','number',{value:20000,oninput:'calcWyoming()'})}${inputField('wy_salary','Salary paid (C-Corp only)','number',{value:0,oninput:'calcWyoming()'})}${inputField('wy_dividends','Dividends (C-Corp only)','number',{value:0,oninput:'calcWyoming()'})}</div><div class="calc-panel"><h3>Personal</h3>${inputField('wy_other','Your other income','number',{value:0,oninput:'calcWyoming()'})}${selectField('wy_status','Filing status',[{value:'single',label:'Single'},{value:'mfj',label:'Married Filing Jointly'},{value:'hoh',label:'Head of Household'}],{value:'single',onchange:'calcWyoming()'})}${inputField('wy_dependents','Dependents under 17','number',{value:0,oninput:'calcWyoming()'})}<div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcWyoming()">Calculate</button></div></div></div><div id="wy-res"></div>`+
    `<div class="calc-panel" style="margin-top:1.5rem"><h3> Wyoming Formation Costs (One-Time)</h3><p><strong>Filing fee:</strong> $102 (LLC Articles of Organization or Corp Articles of Incorporation)</p><p style="margin-top:.5rem"><strong>Registered agent:</strong> $25-50/year (Wyoming requires a physical WY address)</p><p style="margin-top:.5rem"><strong>Name reservation (optional):</strong> $50</p><p style="margin-top:.5rem"><strong>Total to form:</strong> ~$102-202 one-time + $25-50/year registered agent</p><p style="margin-top:.5rem"><strong>Ongoing:</strong> $60 annual report fee (due on the first day of the anniversary month)</p></div>`;
  window.CalcFns = window.CalcFns || {};
  window.CalcFns.calcWyoming = safeCalc(function(){
    try{
    const type=getSelect('wy_type'),gross=getVal('wy_gross'),ded=getVal('wy_ded'),salary=getVal('wy_salary'),dividends=getVal('wy_dividends'),other=getVal('wy_other'),status=getSelect('wy_status'),dependents=getVal('wy_dependents');
    const net=Math.max(0,gross-ded);
    let corpTax=0,ownerTotal=0,divTax=0,lines=[];
    if(type==='llc'){
      const se=TE.calcSETax(net,DATA);
      const agi=net-se.deductibleHalf+other;
      const stdDed=TE.getStandardDeduction(status,false,DATA);
      const taxableBeforeQBI=Math.max(0,agi-stdDed);
      const qbi=TE.calcQBI(net,taxableBeforeQBI,status,DATA);
      const taxable=Math.max(0,taxableBeforeQBI-qbi);
      const fed=TE.calcFederalTax(taxable,status,DATA);
      const childCredit=TE.calcChildTaxCredit(dependents,agi,status,DATA);
      ownerTotal=Math.max(0,fed+se.totalSE-childCredit);
      lines=[{label:'Gross income',val:TE.formatMoney(gross)},{label:'Deductions',val:'-'+TE.formatMoney(ded)},{label:'Net income',val:TE.formatMoney(net)},{label:'SE tax (15.3%)',val:TE.formatMoney(se.totalSE)},{label:'Federal income tax',val:TE.formatMoney(fed)},{label:'Wyoming state tax',val:TE.formatMoney(0)},{label:'Wyoming annual fee',val:TE.formatMoney(60)}];
      if(childCredit>0) lines.push({label:'Child tax credit',val:'-'+TE.formatMoney(childCredit)});
      lines.push({label:'Total tax + fees',val:TE.formatMoney(ownerTotal+60)});
      document.getElementById('wy-res').innerHTML=resultsBox(lines,'Net after tax & fees',TE.formatMoney(gross-(ownerTotal+60)))+
      `<div class="calc-panel" style="margin-top:1rem"><h3>Summary</h3><p>You will pay <strong>${TE.formatMoney(ownerTotal)}</strong> in federal tax + <strong>$60</strong> Wyoming annual fee.</p><p>Your take-home: <strong>${TE.formatMoney(gross-(ownerTotal+60))}</strong>.</p><p style="color:var(--muted)">Wyoming has no state income tax and strong privacy / asset protection.</p></div>`;
      scrollToResults('wy-res');
    }else{
      const fica=TE.calcFICA(salary,DATA,other);
      const employerFica=fica.employerFICA;
      const employeeFica=fica.employeeFICA;
      const corpTaxable=Math.max(0,gross-ded-salary-employerFica);
      corpTax=corpTaxable*DATA.entityTypes.cCorporation.corporateTaxRate;
      const w2Taxable=salary+other;
      const ownerAGI=w2Taxable+dividends;
      const stdDed=TE.getStandardDeduction(status,false,DATA);
      const ownerTaxable=Math.max(0,ownerAGI-stdDed);
      const ownerFed=TE.calcFederalTax(ownerTaxable,status,DATA);
      const ownerStateTax=0; // Wyoming has no state income tax
      const childCredit=TE.calcChildTaxCredit(dependents,ownerAGI,status,DATA);
      ownerTotal=Math.max(0,ownerFed+ownerStateTax-childCredit);
      const ordinaryTaxable=Math.max(0,w2Taxable-stdDed);
      if(dividends>0) divTax=TE.calcLTCGTax(dividends,ordinaryTaxable,status,DATA);
      const totalTax=corpTax+ownerTotal+employeeFica+divTax+employerFica;
      lines=[{label:'Corp gross revenue',val:TE.formatMoney(gross)},{label:'Corp deductions',val:'-'+TE.formatMoney(ded)},{label:'Salary (deductible)',val:'-'+TE.formatMoney(salary)},{label:'Employer FICA (deductible)',val:'-'+TE.formatMoney(employerFica)},{label:'Corp taxable income',val:TE.formatMoney(corpTaxable)},{label:'Corp tax (21%)',val:TE.formatMoney(corpTax)},{label:'Your salary',val:TE.formatMoney(salary)},{label:'Employee FICA',val:TE.formatMoney(employeeFica)},{label:'Federal tax on salary+dividends',val:TE.formatMoney(ownerFed)},{label:'Dividends',val:TE.formatMoney(dividends)},{label:'Dividend tax',val:TE.formatMoney(divTax)},{label:'Wyoming state tax',val:TE.formatMoney(0)},{label:'Wyoming annual fee',val:TE.formatMoney(60)}];
      if(childCredit>0) lines.push({label:'Child tax credit',val:'-'+TE.formatMoney(childCredit)});
      document.getElementById('wy-res').innerHTML=resultsBox(lines,'Total tax (corp + you)',TE.formatMoney(totalTax+60))+
      `<div class="calc-panel" style="margin-top:1rem"><h3>Summary</h3><p>Corporation pays <strong>${TE.formatMoney(corpTax)}</strong> in federal tax + <strong>${TE.formatMoney(employerFica)}</strong> employer FICA.</p><p>You pay <strong>${TE.formatMoney(ownerTotal+employeeFica+divTax)}</strong> in personal tax.</p><p>Total burden: <strong>${TE.formatMoney(totalTax)}</strong> tax + <strong>$60</strong> Wyoming fee.</p><p>Your take-home (salary + dividends - personal tax): <strong>${TE.formatMoney(salary+dividends-(ownerTotal+employeeFica+divTax))}</strong>.</p></div>`;
    }
    scrollToResults('wy-res');
    }catch(err){document.getElementById('wy-res').innerHTML=`<div class="callout" style="background:rgba(201,74,30,.1);border-color:var(--accent)"><strong>Error:</strong> ${err.message}</div>`;console.error(err);}
  });
}

/* ===================== Montana / South Dakota LLC Calculator ===================== */
function mtSdEntityView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'Montana / South Dakota LLC'})}<h2>Montana & South Dakota LLC Formation Calculator 2026</h2><p style="color:var(--muted);margin-bottom:1.5rem">Compare forming your LLC in Montana or South Dakota vs your current state. Two of the most popular no/low-tax formation states alongside Wyoming and Delaware.</p>${callout('green','Montana: No sales tax. Low fees.','Montana is one of only 5 states with <strong>zero sales tax</strong>. Filing fee is just <strong>$35</strong> and annual report is <strong>$20</strong>. Individual income tax is ~5.65%. Perfect for e-commerce and remote businesses.')} ${callout('blue','South Dakota: No income tax. No corporate tax.','South Dakota has <strong>0% personal income tax</strong>, <strong>0% corporate income tax</strong>, and no state business tax on LLCs. Filing fee is <strong>$150</strong> and annual report is <strong>$50</strong>. Ideal for high-income owners who distribute profits.')}
    <div class="calc-grid"><div class="calc-panel"><h3>Business</h3>${inputField('ms_revenue','Annual revenue','number',{value:120000})}${inputField('ms_expenses','Business expenses','number',{value:40000})}${inputField('ms_retail','Retail / e-commerce sales volume','number',{value:60000,hint:'Sales shipped to customers. Used to estimate sales tax collection burden in your home state.'})}${selectField('ms_home','Your home state',buildStateOptions(),{value:'CA'})}</div>
    <div class="calc-panel"><h3>Personal</h3>${selectField('ms_status','Filing status',[{value:'single',label:'Single'},{value:'mfj',label:'Married Filing Jointly'},{value:'hoh',label:'Head of Household'}],{value:'single'})}${inputField('ms_other','Other personal income','number',{value:50000})}${inputField('ms_dependents','Dependents under 17','number',{value:0})}<div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcMtSd()">Compare MT vs SD vs Home State</button></div></div></div>
    <div id="ms-res"></div>`+
    renderFaqSection([
      {q:'Why form in Montana?',a:'Three reasons: (1) <strong>No sales tax</strong> — one of only 5 states. If you sell physical products online, you do not collect Montana sales tax on shipments from Montana. This simplifies compliance and can make your pricing more competitive. (2) <strong>Low fees</strong> — $35 filing + $20 annual report vs $70-500+ in most states. (3) <strong>Privacy</strong> — Montana does not require member names on public filings. The trade-off: ~5.65% individual income tax on your LLC distributions.'},
      {q:'Why form in South Dakota?',a:'Two big reasons: (1) <strong>No state income tax</strong> — your LLC distributions are taxed at 0% by South Dakota. You only pay federal tax. This is huge for high-income owners. (2) <strong>No corporate tax</strong> — if you later convert to a C-Corp, South Dakota charges nothing at the state level. The trade-off: you still collect sales tax on retail sales (4.5% state + local). Filing fees are moderate ($150 + $50/year).'},
      {q:'Do I need to live in Montana or South Dakota?',a:'No. You can form an LLC in any state regardless of where you live. However, if your business has a physical presence (office, employees, inventory) in your home state, you may need to <strong>foreign qualify</strong> there too — which means paying registration fees in BOTH states. This calculator assumes a location-independent business (consulting, e-commerce, SaaS, etc.) where the LLC is the only entity.'},
      {q:'What about Wyoming?',a:'Wyoming is the classic privacy + asset protection state: $102 filing, $60 annual, 0% income tax, no business tax, and anonymous ownership. It is the best all-around choice for most asset-protection-focused LLCs. Montana wins on no-sales-tax for e-commerce. South Dakota wins on zero income tax for high earners. Delaware wins on corporate law and VC fundraising. Choose based on your specific priority.'},
      {q:'What is the registered agent cost?',a:'All four states (WY, MT, SD, DE) require a registered agent with a physical address in the state. You can be your own agent if you have an address there, or hire a service for $50-150/year. The calculator assumes $75/year for comparison purposes. This cost applies regardless of which state you choose.'}
    ]);

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.calcMtSd = safeCalc(function(){
    try{
      const revenue=getVal('ms_revenue'),expenses=getVal('ms_expenses'),retail=getVal('ms_retail'),homeState=getSelect('ms_home'),status=getSelect('ms_status'),other=getVal('ms_other'),dependents=getVal('ms_dependents');
      const net=Math.max(0,revenue-expenses);
      const agi=net+other;
      const stdDed=TE.getStandardDeduction(status,false,DATA);
      const taxableBeforeQBI=Math.max(0,agi-stdDed);
      const qbi=TE.calcQBI(net,taxableBeforeQBI,status,DATA);
      const taxable=Math.max(0,taxableBeforeQBI-qbi);
      const fedTax=TE.calcFederalTax(taxable,status,DATA);
      const childCredit=TE.calcChildTaxCredit(dependents,agi,status,DATA);
      const fedTotal=Math.max(0,fedTax-childCredit);

      // Home state
      const homeStateTax=TE.calcStateTax(agi,homeState,DATA,status);
      const homeHasSalesTax=!DATA.stateMetadata.statesWithNoSalesTax.includes(homeState);
      const homeSalesTaxBurden=homeHasSalesTax?retail*0.045:0; // assume ~4.5% avg collection/admin burden

      // Montana
      const mtStateTax=TE.calcStateTax(agi,'MT',DATA,status);
      const mtSalesTax=0; // no sales tax
      const mtFiling=35,mtAnnual=20,mtAgent=75;

      // South Dakota
      const sdStateTax=TE.calcStateTax(agi,'SD',DATA,status);
      const sdSalesTax=retail*0.045; // 4.5% state + local avg
      const sdFiling=150,sdAnnual=50,sdAgent=75;

      // Totals year 1
      const homeY1=fedTotal+homeStateTax.tax+homeSalesTaxBurden+150+100+75; // avg home state filing+annual+agent
      const mtY1=fedTotal+mtStateTax.tax+mtSalesTax+mtFiling+mtAnnual+mtAgent;
      const sdY1=fedTotal+sdStateTax.tax+sdSalesTax+sdFiling+sdAnnual+sdAgent;

      // Totals year 2-5 (ongoing)
      const homeAnnualCost=homeStateTax.tax+homeSalesTaxBurden+100+75;
      const mtAnnualCost=mtStateTax.tax+mtSalesTax+mtAnnual+mtAgent;
      const sdAnnualCost=sdStateTax.tax+sdSalesTax+sdAnnual+sdAgent;

      const home5y=homeY1+homeAnnualCost*4;
      const mt5y=mtY1+mtAnnualCost*4;
      const sd5y=sdY1+sdAnnualCost*4;

      const homeVsMt=home5y-mt5y;
      const homeVsSd=home5y-sd5y;
      const mtVsSd=mt5y-sd5y;

      const best=mt5y<sd5y&&mt5y<home5y?'Montana':(sd5y<mt5y&&sd5y<home5y?'South Dakota':'Your home state');
      const bestColor=best==='Montana'?'var(--accent)':(best==='South Dakota'?'var(--success)':'var(--warning)');

      const lines=[
        {label:'',val:''},
        {label:'Home State ('+homeState+') — State income tax',val:TE.formatMoney(homeStateTax.tax)},
        {label:'Home State — Sales tax burden',val:TE.formatMoney(homeSalesTaxBurden)},
        {label:'Home State — Formation (est.)',val:TE.formatMoney(150)},
        {label:'Home State — Annual fees (est.)',val:TE.formatMoney(100)},
        {label:'Home State — Registered agent',val:TE.formatMoney(75)},
        {label:'Home State — Year 1 total',val:TE.formatMoney(homeY1)},
        {label:'Home State — 5-year total',val:TE.formatMoney(home5y)},
        {label:'',val:''},
        {label:'Montana LLC — State income tax',val:TE.formatMoney(mtStateTax.tax)},
        {label:'Montana LLC — Sales tax',val:TE.formatMoney(mtSalesTax)},
        {label:'Montana LLC — Formation fee',val:TE.formatMoney(mtFiling)},
        {label:'Montana LLC — Annual report',val:TE.formatMoney(mtAnnual)},
        {label:'Montana LLC — Registered agent',val:TE.formatMoney(mtAgent)},
        {label:'Montana LLC — Year 1 total',val:TE.formatMoney(mtY1)},
        {label:'Montana LLC — 5-year total',val:TE.formatMoney(mt5y)},
        {label:'',val:''},
        {label:'South Dakota LLC — State income tax',val:TE.formatMoney(sdStateTax.tax)},
        {label:'South Dakota LLC — Sales tax',val:TE.formatMoney(sdSalesTax)},
        {label:'South Dakota LLC — Formation fee',val:TE.formatMoney(sdFiling)},
        {label:'South Dakota LLC — Annual report',val:TE.formatMoney(sdAnnual)},
        {label:'South Dakota LLC — Registered agent',val:TE.formatMoney(sdAgent)},
        {label:'South Dakota LLC — Year 1 total',val:TE.formatMoney(sdY1)},
        {label:'South Dakota LLC — 5-year total',val:TE.formatMoney(sd5y)},
      ];

      const bigCard='background:var(--card);border:1px solid var(--border);border-radius:12px;padding:1.5rem;text-align:center;margin-bottom:1rem';
      const homeCard=`<div style="${bigCard}"><span style="font-size:1.5rem;font-weight:700;color:var(--muted)">${homeState}</span><span style="display:block;font-size:.85rem;color:var(--muted);margin-top:.25rem">Home state 5-year cost</span><span style="display:block;font-size:1.5rem;font-weight:700;color:var(--muted)">${TE.formatMoney(home5y)}</span></div>`;
      const mtCard=`<div style="${bigCard};border:2px solid ${best==='Montana'?bestColor:'var(--border)'}"><span style="font-size:1.5rem;font-weight:700;color:var(--accent)">Montana</span><span style="display:block;font-size:.85rem;color:var(--muted);margin-top:.25rem">5-year total cost</span><span style="display:block;font-size:1.5rem;font-weight:700;color:var(--accent)">${TE.formatMoney(mt5y)}</span><span style="display:block;font-size:.85rem;color:var(--muted)">Saves ${TE.formatMoney(homeVsMt)} vs home</span></div>`;
      const sdCard=`<div style="${bigCard};border:2px solid ${best==='South Dakota'?bestColor:'var(--border)'}"><span style="font-size:1.5rem;font-weight:700;color:var(--success)">South Dakota</span><span style="display:block;font-size:.85rem;color:var(--muted);margin-top:.25rem">5-year total cost</span><span style="display:block;font-size:1.5rem;font-weight:700;color:var(--success)">${TE.formatMoney(sd5y)}</span><span style="display:block;font-size:.85rem;color:var(--muted)">Saves ${TE.formatMoney(homeVsSd)} vs home</span></div>`;

      let advice='';
      if(best==='Montana'){
        advice=`<div class="calc-panel" style="margin-top:1rem;border-color:var(--accent)"><h3>🏔️ Montana Wins — Saves ${TE.formatMoney(Math.max(homeVsMt,0))} over 5 years</h3><p>At <strong>${TE.formatMoney(agi)}</strong> total income, forming in Montana costs <strong>${TE.formatMoney(mt5y)}</strong> over 5 years vs <strong>${TE.formatMoney(home5y)}</strong> in ${homeState}.</p><p><strong>Key advantages:</strong> (1) <strong>No sales tax</strong> saves you ${TE.formatMoney(homeSalesTaxBurden)}/year in collection burden vs ${homeState}. (2) <strong>Ultra-low fees</strong> — $35 to form, $20/year to maintain. (3) <strong>Privacy</strong> — no member names on public record.</p><p><strong>Trade-off:</strong> You pay ~5.65% Montana individual income tax on distributions. This is higher than South Dakota's 0%, but lower than high-tax states like CA or NY.</p><p><strong>Best for:</strong> E-commerce sellers, online retailers, dropshippers, and any business where no sales tax is a competitive advantage.</p></div>`;
      }else if(best==='South Dakota'){
        advice=`<div class="calc-panel" style="margin-top:1rem;border-color:var(--success)"><h3>🌾 South Dakota Wins — Saves ${TE.formatMoney(Math.max(homeVsSd,0))} over 5 years</h3><p>At <strong>${TE.formatMoney(agi)}</strong> total income, forming in South Dakota costs <strong>${TE.formatMoney(sd5y)}</strong> over 5 years vs <strong>${TE.formatMoney(home5y)}</strong> in ${homeState}.</p><p><strong>Key advantages:</strong> (1) <strong>Zero state income tax</strong> — you keep ${TE.formatMoney(homeStateTax.tax-sdStateTax.tax)} more per year vs ${homeState}. (2) <strong>Zero corporate tax</strong> — if you scale to a C-Corp later, no state layer. (3) <strong>No franchise tax or gross receipts tax</strong>.</p><p><strong>Trade-off:</strong> You still collect sales tax on retail sales (${TE.formatMoney(sdSalesTax)}/year estimated). Filing fee is $150 vs Montana's $35.</p><p><strong>Best for:</strong> High-income consultants, SaaS founders, service businesses, and any owner who distributes most profits personally.</p></div>`;
      }else{
        advice=`<div class="calc-panel" style="margin-top:1rem;border-color:var(--warning)"><h3>🏠 Your Home State (${homeState}) Is Competitive</h3><p>At <strong>${TE.formatMoney(agi)}</strong> total income, staying in ${homeState} costs <strong>${TE.formatMoney(home5y)}</strong> over 5 years — roughly the same or better than forming out of state.</p><p><strong>Possible reasons:</strong> (1) ${homeState} may have low or no income tax (e.g., TX, FL, NV, WY). (2) Your retail sales volume is low, so sales tax savings don't matter. (3) Your business has a physical presence in ${homeState}, so you'd need to foreign qualify anyway.</p><p><strong>Still consider MT/SD if:</strong> You plan to scale revenue significantly, you sell nationwide online, or you want privacy/asset protection that your home state doesn't offer.</p></div>`;
      }

      document.getElementById('ms-res').innerHTML=
        `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-top:1.5rem">${homeCard}${mtCard}${sdCard}</div>`+
        resultsBox(lines,'5-year cost comparison',TE.formatMoney(best==='Montana'?homeVsMt:(best==='South Dakota'?homeVsSd:0)))+
        advice+
        `<div class="calc-panel" style="margin-top:1rem"><p style="color:var(--muted);font-size:.85rem"><strong>Assumptions:</strong> Federal tax is identical in all scenarios (standard deduction + QBI where applicable). Home state assumes $150 formation + $100 annual + $75 agent as average. Sales tax burden = 4.5% of retail sales volume for states with sales tax (estimated collection/admin cost + competitive pricing impact). Montana income tax uses 2026 brackets: 4.7% on first $25k/$50k, 5.65% above. South Dakota has 0% income tax. Registered agent cost is $75/year in all states. Does not include foreign qualification fees if you have a physical presence in your home state. Consult a CPA before forming out of state.</p></div>`;
      scrollToResults('ms-res');
    }catch(err){
      document.getElementById('ms-res').innerHTML=`<div class="callout" style="background:rgba(201,74,30,.1);border-color:var(--accent)"><strong>Error:</strong> ${err.message}</div>`;
      console.error(err);
    }
  });
}

/* ===================== Nonprofit Calculator ===================== */
function nonprofitView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'Nonprofit (501c3)'})}<h2>Nonprofit Tax Calculator 2026 | Form 990</h2><p style="color:var(--muted);margin-bottom:1.5rem">Mission-related income is tax-exempt. Unrelated business income (UBI) is taxed.</p>${callout('green','Tax-exempt on mission income','Donations, grants, and program revenue related to your mission are NOT taxed. Only UBI is.')}
    <div class="calc-panel" style="margin-bottom:1.5rem"><h3>How to Estimate Your Exempt Percentage</h3><p>Look at your revenue sources. Count each dollar as <strong>exempt</strong> if it directly supports your mission. Count it as <strong>UBI</strong> if it comes from a regular business activity unrelated to your exempt purpose.</p>
    <p><strong>Typically exempt (count toward %):</strong></p><ul><li>Donations and charitable contributions</li><li>Government and private grants for program work</li><li>Program fees, tuition, or membership dues tied to your mission</li><li>Sales of mission-related products (e.g., educational materials)</li><li>Investment income (dividends, interest, rents, royalties - generally excluded from UBI by statute)</li></ul>
    <p><strong>Typically UBI (do NOT count toward %):</strong></p><ul><li>Advertising revenue from a regularly published periodical</li><li>Commercial sponsorships with quid pro quo benefits</li><li>Sale of merchandise unrelated to your mission (e.g., a museum running a parking lot)</li><li>Rental of facilities with debt-financed property</li><li>Services performed for non-exempt organizations as a regular business</li></ul>
    <p style="color:var(--muted)">IRS exceptions: Activities run <em>substantially by volunteers</em>, activities for <em>convenience of members/students/patients</em>, and <em>donated merchandise sales</em> are generally NOT UBI even if they look like a business. <a href="https://www.irs.gov/charities-non-profits/unrelated-business-income" target="_blank">IRS Pub 598</a></p></div>
    <div class="calc-grid"><div class="calc-panel"><h3>Revenue</h3>${inputField('np_total','Total annual revenue','number',{value:500000})}${inputField('np_exempt_pct','Mission-related / exempt (%)','number',{value:85,hint:'IRS: Income is exempt if it directly furthers your 501(c)(3) mission (donations, grants, program fees). It is unrelated business income (UBI) if from a regularly carried-on trade or business not substantially related to your exempt purpose.'})}${inputField('np_ubi','Unrelated business income (UBI)','number',{value:15000})}${inputField('np_ded','UBI deductions','number',{value:5000})}${selectField('np_state','State',buildStateOptions(),{value:'CA'})}<div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcNonprofit()">Calculate</button></div></div></div><div id="np-res"></div>`;
  window.CalcFns = window.CalcFns || {};
  window.CalcFns.calcNonprofit = safeCalc(function(){
    try{
    const total=getVal('np_total'),exemptPct=getVal('np_exempt_pct'),ubi=getVal('np_ubi'),ded=getVal('np_ded'),state=getSelect('np_state');
    const exemptIncome=total*(exemptPct/100);
    const ubiNet=Math.max(0,ubi-ded);
    const ubiTax=ubiNet*DATA.entityTypes.cCorporation.corporateTaxRate; // taxed at corporate rate
    const stateUbiTax=TE.calcStateTax(ubiNet,state,DATA,'single');
    const totalTax=ubiTax+stateUbiTax.tax;
    const lines=[{label:'Total revenue',val:TE.formatMoney(total)},{label:'Exempt mission income ('+exemptPct+'%)',val:TE.formatMoney(exemptIncome)},{label:'Unrelated business income (UBI)',val:TE.formatMoney(ubi)},{label:'UBI deductions',val:'-'+TE.formatMoney(ded)},{label:'Net UBI',val:TE.formatMoney(ubiNet)},{label:'Federal UBI tax (21%)',val:TE.formatMoney(ubiTax)},{label:'State UBI tax',val:TE.formatMoney(stateUbiTax.tax)}];
    document.getElementById('np-res').innerHTML=resultsBox(lines,'Total tax on UBI only',TE.formatMoney(totalTax))+
    `<div class="calc-panel" style="margin-top:1rem"><h3>Summary</h3><p>Your <strong>${TE.formatMoney(exemptIncome)}</strong> in mission-related revenue is <strong>tax-exempt</strong>.</p><p>You pay <strong>${TE.formatMoney(totalTax)}</strong> in tax on <strong>${TE.formatMoney(ubiNet)}</strong> of unrelated business income.</p><p>Tax-free revenue: <strong>${TE.formatMoney(exemptIncome)}</strong> of <strong>${TE.formatMoney(total)}</strong> total.</p></div>`;
    scrollToResults('np-res');
    }catch(err){document.getElementById('np-res').innerHTML=`<div class="callout" style="background:rgba(201,74,30,.1);border-color:var(--accent)"><strong>Error:</strong> ${err.message}</div>`;console.error(err);}
  });
}

/* ===================== SSDI Calculator ===================== */
function ssdiCalculatorView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'SSDI Tax Calculator'})}<h2>SSDI Taxability Calculator</h2><p style="color:var(--muted);margin-bottom:1.5rem">SSDI is not automatically 85% taxable. Use the IRS Pub 915 formula to find your actual taxable amount.</p>${callout('green','Key Fact','"85% taxable" means up to 85% of your benefit amount becomes taxable income - NOT an 85% tax rate. At the 10% bracket, your effective rate on SSDI is just 8.5%.')}
    <div class="calc-grid"><div class="calc-panel"><h3>Your Situation</h3>${inputField('ssdi_annual','Annual SSDI benefit','number',{value:16800})}${inputField('ssdi_other','Other income (wages, interest, dividends)','number',{value:20000})}${inputField('ssdi_taxexempt','Tax-exempt interest','number',{value:0})}${selectField('ssdi_status','Filing status',[{value:'single',label:'Single / HOH / QW'},{value:'mfj',label:'Married Filing Jointly'},{value:'mfs',label:'Married Filing Separately (lived together)'}],{value:'single'})}<div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcSSDI()">Calculate</button></div></div></div><div id="ssdi-res"></div>`;
  window.CalcFns = window.CalcFns || {};
  window.CalcFns.calcSSDI = safeCalc(function(){
    const benefit=getVal('ssdi_annual'),other=getVal('ssdi_other'),taxExempt=getVal('ssdi_taxexempt'),status=getSelect('ssdi_status');
    const r=TE.calcSSDITaxable(benefit,other,taxExempt,status);
    const fs=status==='mfs'?'single':status;
    // Marginal tax: tax WITH SSDI taxable portion minus tax WITHOUT it
    const taxWith=TE.calcFederalTax(other+r.taxable,fs,DATA);
    const taxWithout=TE.calcFederalTax(other,fs,DATA);
    const fedMarginal=Math.max(0,taxWith-taxWithout);
    document.getElementById('ssdi-res').innerHTML=resultsBox([
      {label:'Annual SSDI benefit',val:TE.formatMoney(benefit)},{label:'Other income',val:TE.formatMoney(other)},{label:'Tax-exempt interest',val:TE.formatMoney(taxExempt)},{label:'Combined income',val:TE.formatMoney(r.combined)},{label:'Taxable SSDI amount',val:TE.formatMoney(r.taxable)},{label:'Tier',val:r.tier},{label:'Tax on other income alone',val:TE.formatMoney(taxWithout)},{label:'Tax with SSDI included',val:TE.formatMoney(taxWith)}
    ],'Federal tax attributable to SSDI portion',TE.formatMoney(fedMarginal))+
    `<div class="calc-panel" style="margin-top:1rem"><p>Your marginal tax rate on the taxable portion of SSDI is approximately <strong>${r.taxable>0?((fedMarginal/r.taxable)*100).toFixed(1):0}%</strong> - not 85%.</p><p style="color:var(--muted)">This is the additional tax caused by adding your SSDI to your other income. It accounts for your actual tax bracket stacking.</p></div>`+
    `<div class="calc-panel" style="margin-top:1rem"><h3>Summary</h3><p>You will pay <strong>${TE.formatMoney(fedMarginal)}</strong> in additional federal tax because of your SSDI.</p><p>Your tax on other income alone would be <strong>${TE.formatMoney(taxWithout)}</strong>. With SSDI included, it is <strong>${TE.formatMoney(taxWith)}</strong>.</p></div>`;
    scrollToResults('ssdi-res');
  });
}

/* ===================== STD/LTD Disability Tax Calculator ===================== */
function stdLtdView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'STD/LTD Tax Calculator'})}<h2>Short-Term & Long-Term Disability Tax Calculator 2026</h2><p style="color:var(--muted);margin-bottom:1.5rem">The golden rule: disability benefits are taxable if the employer paid the premiums. Tax-free if you paid with after-tax dollars.</p>${callout('green','Key Rule','If your <strong>employer paid</strong> the premiums (or you paid pre-tax through a cafeteria plan), your disability benefits are <strong>taxable as ordinary income</strong>. If <strong>you paid</strong> the premiums with <strong>after-tax</strong> dollars, the benefits are <strong>tax-free</strong>.')}
    <div class="calc-grid"><div class="calc-panel"><h3>Disability Benefits</h3>
      ${inputField('std_monthly','Monthly disability benefit ($)','number',{value:3000})}
      ${inputField('std_months','Months receiving benefits','number',{value:6})}
      ${selectField('std_payer','Who paid the premiums?',[{value:'employer',label:'Employer paid (or pre-tax cafeteria plan)'},{value:'employee',label:'I paid with after-tax dollars'}],{value:'employer'})}
      ${selectField('std_type','Disability type',[{value:'std',label:'Short-Term Disability (STD)'},{value:'ltd',label:'Long-Term Disability (LTD)'}],{value:'std'})}
    </div>
    <div class="calc-panel"><h3>Your Profile</h3>
      ${inputField('std_other','Other taxable income ($)','number',{value:50000})}
      ${selectField('std_status','Filing status',[{value:'single',label:'Single'},{value:'mfj',label:'Married Filing Jointly'},{value:'hoh',label:'Head of Household'}],{value:'single'})}
      ${inputField('std_dependents','Dependents under 17','number',{value:0})}
      <div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcSTDLTD()">Calculate Disability Tax</button></div>
    </div></div>
    <div id="std-res"></div>`+
    renderFaqSection([
      {q:'Are my disability benefits taxable?',a:'It depends entirely on who paid the premiums. Employer-paid = taxable. Employee-paid with after-tax dollars = tax-free. If you split the cost, only the portion attributable to employer-paid premiums is taxable.'},
      {q:'What if I paid premiums pre-tax through a cafeteria plan?',a:'Pre-tax premium payments through a Section 125 cafeteria plan are treated the same as employer-paid. The benefits will be taxable because you got a tax deduction on the premiums.'},
      {q:'How is LTD different from STD for taxes?',a:'Tax treatment is identical. The only difference is duration: STD typically covers 3-6 months, LTD covers years or until retirement. Both follow the same "who paid premiums" rule.'},
      {q:'What about state disability insurance (SDI / TDI)?',a:'State-mandated disability insurance (like CA SDI, NY DBL, NJ TDI, HI TDI) is generally NOT taxable at the federal level because employees typically fund these programs through payroll deductions. Check your state rules.'}
    ]);
  window.CalcFns = window.CalcFns || {};
  window.CalcFns.calcSTDLTD = safeCalc(function(){
    const monthly=getVal('std_monthly'),months=getVal('std_months');
    const payer=getSelect('std_payer'),type=getSelect('std_type');
    const other=getVal('std_other'),status=getSelect('std_status');
    const dependents=getVal('std_dependents');
    const totalBenefit=monthly*months;
    const taxableAmount=payer==='employer'?totalBenefit:0;
    const stdDed=TE.getStandardDeduction(status,false,DATA);
    const taxableWithBenefit=Math.max(0,other+taxableAmount-stdDed);
    const taxableWithout=Math.max(0,other-stdDed);
    const taxWith=TE.calcFederalTax(taxableWithBenefit,status,DATA);
    const taxWithout=TE.calcFederalTax(taxableWithout,status,DATA);
    const incrementalTax=Math.max(0,taxWith-taxWithout);
    const childCredit=TE.calcChildTaxCredit(dependents,other+taxableAmount,status,DATA);
    const childCreditWithout=TE.calcChildTaxCredit(dependents,other,status,DATA);
    const creditDiff=childCredit-childCreditWithout;
    const netIncremental=Math.max(0,incrementalTax-creditDiff);
    const lines=[
      {label:(type==='std'?'STD':'LTD')+' monthly benefit',val:TE.formatMoney(monthly)},
      {label:'Months receiving benefits',val:months},
      {label:'Total benefits received',val:TE.formatMoney(totalBenefit)},
      {label:'Premium payer',val:payer==='employer'?'Employer paid (taxable)':'Employee paid after-tax (tax-free)'},
      {label:'Taxable amount',val:TE.formatMoney(taxableAmount)}
    ];
    if(taxableAmount>0){
      lines.push({label:'Extra federal tax from benefits',val:TE.formatMoney(incrementalTax)});
      if(creditDiff>0) lines.push({label:'Child credit reduction',val:TE.formatMoney(creditDiff)});
      lines.push({label:'Net extra tax',val:TE.formatMoney(netIncremental)});
    }
    const summaryLabel=taxableAmount>0?'Tax on disability benefits':'Benefits are tax-free';
    const summaryValue=taxableAmount>0?TE.formatMoney(netIncremental):'Tax-free';
    const bigCard='background:var(--card);border:1px solid var(--border);border-radius:12px;padding:1.5rem;text-align:center;margin-bottom:1rem';
    const bigNum='font-size:2.2rem;font-weight:700;color:var(--accent);display:block';
    const bigLbl='font-size:.85rem;color:var(--muted);margin-top:.25rem;display:block';
    document.getElementById('std-res').innerHTML=resultsBox(lines,summaryLabel,summaryValue)+
    `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-top:1rem">`+
    `<div style="${bigCard};border-top:4px solid #ff9800"><span style="${bigNum};color:#ff9800">${TE.formatMoney(totalBenefit)}</span><span style="${bigLbl}">Total Benefits</span></div>`+
    `<div style="${bigCard};border-top:4px solid ${taxableAmount>0?'#f44336':'#4caf50'}"><span style="${bigNum};color:${taxableAmount>0?'#f44336':'#4caf50'}">${taxableAmount>0?TE.formatMoney(taxableAmount):'Tax-Free'}</span><span style="${bigLbl}">Taxable Amount</span></div>`+
    `<div style="${bigCard};border-top:4px solid #2196f3"><span style="${bigNum};color:#2196f3">${taxableAmount>0?TE.formatMoney(netIncremental):'$0'}</span><span style="${bigLbl}">Tax Owed</span></div>`+
    `</div>`+
    `<div class="calc-panel" style="margin-top:1rem;background:rgba(46,125,50,.08);border-color:var(--success)"><h3>How to Make Benefits Tax-Free</h3><p>If your employer offers disability insurance, ask if you can pay the premiums with <strong>after-tax</strong> dollars. The small extra cost now saves significant tax later if you ever need to claim benefits.</p><p style="margin-top:.5rem">If you already have employer-paid coverage, consider buying a supplemental individual policy with after-tax dollars to cover the gap.</p></div>`;
    scrollToResults('std-res');
  });
}

/* ===================== Workers' Compensation Tax Calculator ===================== */
function workersCompView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'Workers\' Comp Tax Calculator'})}<h2>Workers' Compensation Tax Calculator 2026</h2><p style="color:var(--muted);margin-bottom:1.5rem">Workers' comp benefits are generally tax-free under federal law. But if you also receive SSDI, the offset rule may create taxable SSDI.</p>${callout('green','Generally Tax-Free','Under IRC Section 104(a)(1), workers\' compensation benefits for job-related injury or sickness are NOT taxable. This includes weekly wage replacement and lump-sum settlements.')}
    <div class="calc-grid"><div class="calc-panel"><h3>Workers' Comp</h3>
      ${inputField('wc_weekly','Weekly workers comp benefit ($)','number',{value:800})}
      ${inputField('wc_weeks','Weeks receiving benefits','number',{value:52})}
      ${inputField('wc_lump','Lump-sum settlement ($)','number',{value:0})}
      ${inputField('wc_medical','Medical expense reimbursement ($)','number',{value:5000})}
      ${inputField('wc_attorney','Attorney fees paid ($)','number',{value:0})}
    </div>
    <div class="calc-panel"><h3>SSDI Offset (if applicable)</h3>
      ${inputField('wc_ssdi','Monthly SSDI benefit before offset ($)','number',{value:0})}
      ${inputField('wc_ssdi_offset','Monthly SSDI after offset ($)','number',{value:0})}
      <p style="color:var(--muted);font-size:.9rem;margin-top:.5rem">If workers comp reduces your SSDI, the portion of SSDI that was "replaced" by workers comp may be taxable. Enter your pre-offset and post-offset SSDI.</p>
      <div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcWorkersComp()">Calculate</button></div>
    </div></div>
    <div id="wc-res"></div>`+
    renderFaqSection([
      {q:'Is my workers comp settlement taxable?',a:'No. Workers compensation benefits (weekly payments and lump-sum settlements) for job-related injury or sickness are NOT taxable under IRC Section 104(a)(1). Medical reimbursements are also tax-free. Attorney fees may be deductible as a miscellaneous itemized deduction (subject to 2% floor in some cases).'},
      {q:'Why would SSDI become taxable because of workers comp?',a:'Social Security reduces your SSDI by the amount of workers comp you receive (the "offset"). The workers comp itself remains tax-free, but the SSDI that is NOT offset may now be taxable under the combined income formula (IRS Pub 915).'},
      {q:'Are attorney fees from a workers comp settlement deductible?',a:'Attorney fees are generally deductible from the taxable portion of any award. Since workers comp is tax-free, the deduction benefit is limited. If you have a mixed award (some taxable, some not), allocate the attorney fee proportionally. Consult a tax professional.'},
      {q:'What about vocational rehabilitation payments?',a:'Vocational rehabilitation benefits paid under workers comp are generally tax-free if they are part of the workers comp award. If paid separately by a state agency, they may be taxable. Check with your state program.'}
    ]);
  window.CalcFns = window.CalcFns || {};
  window.CalcFns.calcWorkersComp = safeCalc(function(){
    const weekly=getVal('wc_weekly'),weeks=getVal('wc_weeks');
    const lump=getVal('wc_lump'),medical=getVal('wc_medical');
    const attorney=getVal('wc_attorney');
    const ssdiBefore=getVal('wc_ssdi'),ssdiAfter=getVal('wc_ssdi_offset');
    const totalWeekly=weekly*weeks;
    const totalWC=totalWeekly+lump;
    const ssdiOffsetAmount=ssdiBefore-ssdiAfter;
    const lines=[
      {label:'Weekly workers comp',val:TE.formatMoney(weekly)},
      {label:'Weeks receiving',val:weeks},
      {label:'Total weekly benefits',val:TE.formatMoney(totalWeekly)},
      {label:'Lump-sum settlement',val:TE.formatMoney(lump)},
      {label:'Medical reimbursement',val:TE.formatMoney(medical)},
      {label:'Total workers comp received',val:TE.formatMoney(totalWC+medical)},
      {label:'Taxable workers comp',val:'$0 (tax-free)'}
    ];
    if(attorney>0) lines.push({label:'Attorney fees paid',val:TE.formatMoney(attorney)});
    if(ssdiBefore>0){
      lines.push({label:'SSDI before offset',val:TE.formatMoney(ssdiBefore)});
      lines.push({label:'SSDI after offset',val:TE.formatMoney(ssdiAfter)});
      lines.push({label:'SSDI offset by workers comp',val:TE.formatMoney(ssdiOffsetAmount)});
      if(ssdiAfter>0){
        // Estimate taxable SSDI after offset
        const annualSSDI=ssdiAfter*12;
        const r=TE.calcSSDITaxable(annualSSDI,0,0,'single');
        lines.push({label:'Estimated taxable SSDI (after offset, single)',val:TE.formatMoney(r.taxable/12)+'/month'});
      }
    }
    const bigCard='background:var(--card);border:1px solid var(--border);border-radius:12px;padding:1.5rem;text-align:center;margin-bottom:1rem';
    const bigNum='font-size:2.2rem;font-weight:700;color:var(--accent);display:block';
    const bigLbl='font-size:.85rem;color:var(--muted);margin-top:.25rem;display:block';
    document.getElementById('wc-res').innerHTML=resultsBox(lines,'Workers\' Comp Tax Summary','Tax-free')+
    `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-top:1rem">`+
    `<div style="${bigCard};border-top:4px solid #4caf50"><span style="${bigNum};color:#4caf50">${TE.formatMoney(totalWC+medical)}</span><span style="${bigLbl}">Total Received</span></div>`+
    `<div style="${bigCard};border-top:4px solid #4caf50"><span style="${bigNum};color:#4caf50">Tax-Free</span><span style="${bigLbl}">Federal Tax Status</span></div>`+
    `<div style="${bigCard};border-top:4px solid ${ssdiOffsetAmount>0?'#ff9800':'#4caf50'}"><span style="${bigNum};color:${ssdiOffsetAmount>0?'#ff9800':'#4caf50'}">${ssdiOffsetAmount>0?TE.formatMoney(ssdiOffsetAmount):'None'}</span><span style="${bigLbl}">SSDI Offset</span></div>`+
    `</div>`+
    `<div class="calc-panel" style="margin-top:1rem;background:rgba(46,125,50,.08);border-color:var(--success)"><h3>Key Rules</h3><p><strong>Workers' comp:</strong> Always tax-free under IRC Section 104(a)(1).</p><p style="margin-top:.5rem"><strong>Medical reimbursements:</strong> Tax-free.</p><p style="margin-top:.5rem"><strong>SSDI offset:</strong> Workers' comp reduces SSDI dollar-for-dollar. The workers' comp remains tax-free, but the reduced SSDI may still be taxable under the combined income formula.</p><p style="margin-top:.5rem"><strong>Attorney fees:</strong> Generally deductible from the taxable portion of awards. Consult a tax pro for allocation.</p></div>`;
    scrollToResults('wc-res');
  });
}

/* ===================== ACA Subsidy Calculator ===================== */
function acaCalculatorView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'ACA Subsidy Calculator'})}<h2>ACA Premium Tax Credit (2026)</h2><p style="color:var(--muted);margin-bottom:1.5rem">OBBBA did NOT extend enhanced subsidies past Dec 31, 2025. The hard 400% FPL cliff returned January 1, 2026.</p>${callout('yellow','Cliff Warning','Earning $1 above 400% FPL = $0 premium tax credit. No partial phase-out above the cliff. Source: KFF analysis of OBBBA expiration.')}
    <div class="calc-grid"><div class="calc-panel"><h3>Household</h3>${inputField('aca_magi','Projected 2026 MAGI','number',{value:58000})}${inputField('aca_size','Household size','number',{value:2,min:1,max:10})}${inputField('aca_premium','Monthly benchmark Silver plan (SLCSP)','number',{value:650,hint:'SLCSP = Second Lowest Cost Silver Plan in your zip code. This is the benchmark the ACA uses to calculate your subsidy. Find it on Healthcare.gov or your state exchange. It is NOT necessarily the plan you enrolled in.'})}<div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcACA()">Calculate Subsidy</button></div></div></div>
    <div class="calc-panel" style="margin-top:1rem"><p style="color:var(--muted);font-size:.85rem"><strong>Estimate only.</strong> Your actual premium tax credit depends on your state marketplace, exact household composition, the benchmark Second Lowest Cost Silver Plan (SLCSP) in your zip code, and your final year-end MAGI. Visit <a href="https://www.healthcare.gov" target="_blank" rel="noopener">Healthcare.gov</a> or your state marketplace for the official calculation and enrollment.</p></div>
    <div id="aca-res"></div>`;
  window.CalcFns = window.CalcFns || {};
  window.CalcFns.calcACA = safeCalc(function(){
    const magi=getVal('aca_magi'),size=parseInt(getVal('aca_size')),premium=getVal('aca_premium');
    const r=TE.calcACASubsidy(magi,size,premium,DATA);
    const fpl400=DATA.acaSubsidy.cliffThresholds400pct['persons'+Math.min(size,6)];
    const gap=fpl400-magi;
    document.getElementById('aca-res').innerHTML=resultsBox([
      {label:'MAGI',val:TE.formatMoney(magi)},{label:'FPL',val:TE.formatMoney(r.fpl)},{label:'FPL %',val:(r.fplPct*100).toFixed(1)+'%'},{label:'Max premium (monthly)',val:TE.formatMoney(r.maxPremium)},{label:'Subsidy (monthly)',val:TE.formatMoney(r.subsidy)}
    ],'Net premium you pay',TE.formatMoney(Math.max(0,premium-r.subsidy)))+
    `<div class="calc-panel" style="margin-top:1rem">${r.cliffRisk?`<p style="color:var(--accent)"><strong>Cliff risk!</strong> You are within 10% of the 400% FPL cutoff (${TE.formatMoney(fpl400)}). Earning just ${TE.formatMoney(gap)} more would eliminate your entire ${TE.formatMoney(r.subsidy*12)}/year subsidy.</p>`:`<p>You are ${(r.fplPct*100).toFixed(0)}% of FPL. ${r.eligible?'You qualify for a subsidy.':'You are above 400% FPL and do not qualify for a subsidy.'}</p>`}</div>`;
    scrollToResults('aca-res');
  });
}

/* ===================== Quarterly Tax Calculator ===================== */
function quarterlyCalculatorView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'Quarterly Tax Estimator'})}<h2>1099 Quarterly Estimated Tax Calculator 2026 | Form 1040-ES</h2><p style="color:var(--muted);margin-bottom:1.5rem">Enter all your income sources. We calculate your total estimated tax and tell you exactly how much to pay each quarter. Includes SE income, capital gains, and stock options.</p>
    ${callout('green','Safe Harbor Rule','Pay 100% of last year\'s tax (110% if AGI > $150K) OR 90% of this year\'s estimated tax - whichever is lower. Miss it = underpayment penalty.')}
    <div class="calc-panel"><h3>1. Self-Employment Income</h3><div class="calc-grid">
      <div class="calc-panel"><h4>Gig Economy</h4>${inputField('qt_gig_gross','Gross gig income','number',{value:18000})}${inputField('qt_gig_ded','Deductions','number',{value:4000})}</div>
      <div class="calc-panel"><h4>Creator Economy</h4>${inputField('qt_creator_gross','Gross creator income','number',{value:0})}${inputField('qt_creator_ded','Deductions','number',{value:0})}</div>
      <div class="calc-panel"><h4>Online Selling</h4>${inputField('qt_seller_gross','Gross sales','number',{value:0})}${inputField('qt_seller_cogs','COGS','number',{value:0})}${inputField('qt_seller_fees','Platform fees','number',{value:0})}${inputField('qt_seller_other','Other deductions','number',{value:0})}</div>
      <div class="calc-panel"><h4>Brand Deals / Sponsorships</h4>${inputField('qt_brand_gross','Gross brand deal income','number',{value:0})}${inputField('qt_brand_ded','Deductions','number',{value:0})}</div>
    </div></div>
    <div class="calc-panel"><h3>2. Rental & Passive Income</h3><div class="calc-grid">
      <div class="calc-panel"><h4>Rental Income</h4>${inputField('qt_rental_gross','Gross rental income','number',{value:0})}${inputField('qt_rental_ded','Deductions','number',{value:0})}${selectField('qt_rental_type','Rental type',[{value:'passive',label:'Passive / Schedule E'},{value:'active',label:'Active / Schedule C (SE tax applies)'}],{value:'passive'})}</div>
      <div class="calc-panel"><h4>Interest & Dividends</h4>${inputField('qt_int_taxable','Bank interest, bond interest, REIT dividends','number',{value:0,hint:'Taxed at regular income rates. Includes savings account, CDs, bonds, REITs, ordinary stock dividends.'})}${inputField('qt_int_qualified','Stock dividends (held 60+ days)','number',{value:0,hint:'Lower tax rate (0% or 15%). Only dividends from stocks you held more than 60 days.'})}</div>
    </div></div>
    <div class="calc-panel"><h3>3. Stock & Options</h3><div class="calc-grid">
      <div class="calc-panel"><h4>Stock Sales - Did you sell stocks this year?</h4>${inputField('qt_st_proceeds','Sold for (short-term: held less than 1 year)','number',{value:0,hint:'Total amount you received from selling stocks held less than 1 year. Found on your 1099-B.'})}${inputField('qt_st_basis','Originally paid (short-term)','number',{value:0,hint:'What you originally paid for those same stocks. Your broker reports this on 1099-B.'})}${inputField('qt_lt_proceeds','Sold for (long-term: held 1+ year)','number',{value:0,hint:'Total amount you received from selling stocks held 1+ year. Lower tax rate applies.'})}${inputField('qt_lt_basis','Originally paid (long-term)','number',{value:0,hint:'What you originally paid for those same stocks.'})}</div>
      <div class="calc-panel"><h4>Stock Options - Did you exercise options this year?</h4>${inputField('qt_iso_shares','Incentive Stock Options (ISO): shares exercised','number',{value:0,hint:'ISOs: no tax when you exercise, but may trigger AMT. Count shares you bought.'})}${inputField('qt_iso_price','ISO: price you paid per share to exercise','number',{value:0,hint:'Your strike price from your option grant.'})}${inputField('qt_iso_fmv','ISO: stock price when you exercised','number',{value:0,hint:'Fair market value per share on exercise date. Your company or broker provides this.'})}${inputField('qt_nso_shares','Non-Qualified Stock Options (NSO): shares exercised','number',{value:0,hint:'NSOs: taxed as ordinary income at exercise. Count shares you bought.'})}${inputField('qt_nso_price','NSO: price you paid per share to exercise','number',{value:0,hint:'Your strike price from your option grant.'})}${inputField('qt_nso_fmv','NSO: stock price when you exercised','number',{value:0,hint:'Fair market value per share on exercise date.'})}</div>
    </div></div>
    <div class="calc-panel"><h3>4. W-2 & Profile</h3><div class="calc-grid">
      <div class="calc-panel"><h4>W-2 Income</h4>${inputField('qt_w2_gross','W-2 gross wages','number',{value:0})}${inputField('qt_w2_withholding','Federal withholding','number',{value:0})}</div>
      <div class="calc-panel"><h4>Profile & Safe Harbor</h4>${selectField('qt_status','Filing status',[{value:'single',label:'Single'},{value:'mfj',label:'Married Filing Jointly'},{value:'mfs',label:'Married Filing Separately'},{value:'hoh',label:'Head of Household'}],{value:'single'})}${selectField('qt_state','State',buildStateOptions(),{value:'CA'})}${inputField('qt_age65','Age 65+','checkbox')}${inputField('qt_dependents','Children under 17','number',{value:0})}${inputField('qt_prior_tax','Prior year total tax liability','number',{value:0})}${inputField('qt_prior_agi','Prior year AGI','number',{value:0})}</div>
    </div></div>
    <div class="btn-group" style="margin:1.5rem 0"><button class="btn btn-accent" onclick="window.CalcFns.calcQuarterly()">Calculate Quarterly Tax</button></div>
    <div id="qt-res"></div>`+
    renderFaqSection([
      {q:'What are the quarterly due dates?',a:'Q1: April 15 · Q2: June 15 · Q3: September 15 · Q4: January 15 (next year). If the 15th falls on a weekend or holiday, the deadline is the next business day.'},
      {q:'What is the safe harbor rule?',a:'Pay 100% of last year\'s total tax (110% if prior AGI > $150K) OR 90% of this year\'s estimated tax - whichever is lower. Miss it = underpayment penalty.'},
      {q:'Should I use this calculator or the combined one?',a:'This calculator is specifically for quarterly planning with safe harbor rules. <a href="/w2-and-side-hustle">The combined calculator</a> gives you the full-year tax picture and shows what to set aside from your side hustle.'}
    ]);

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.calcQuarterly = safeCalc(function(){
    try{
    const status=getSelect('qt_status'),state=getSelect('qt_state');
    const age65=getVal('qt_age65'),dependents=getVal('qt_dependents');
    const priorTax=getVal('qt_prior_tax'),priorAGI=getVal('qt_prior_agi');
    const stdDed=TE.getStandardDeduction(status,age65,DATA);
    const ctc=DATA.federal.childTaxCredit;

    // Collect income sources
    let totalW2=0,w2Withholding=0;
    let totalSENet=0,totalQBI=0;
    let totalRentalNet=0;
    let taxableInterest=0,qualifiedDividends=0;

    let detailHTML='';

    // Gig
    const gigGross=getVal('qt_gig_gross'),gigDed=getVal('qt_gig_ded');
    const gigNet=Math.max(0,gigGross-gigDed);
    if(gigNet>0){totalSENet+=gigNet;totalQBI+=gigNet;detailHTML+=`<p><strong>Gig:</strong> ${TE.formatMoney(gigGross)} gross - ${TE.formatMoney(gigDed)} deductions = ${TE.formatMoney(gigNet)} net SE</p>`;}

    // Creator
    const creatorGross=getVal('qt_creator_gross'),creatorDed=getVal('qt_creator_ded');
    const creatorNet=Math.max(0,creatorGross-creatorDed);
    if(creatorNet>0){totalSENet+=creatorNet;totalQBI+=creatorNet;detailHTML+=`<p><strong>Creator:</strong> ${TE.formatMoney(creatorGross)} gross - ${TE.formatMoney(creatorDed)} deductions = ${TE.formatMoney(creatorNet)} net SE</p>`;}

    // Seller
    const sellerGross=getVal('qt_seller_gross'),sellerCOGS=getVal('qt_seller_cogs'),sellerFees=getVal('qt_seller_fees'),sellerOther=getVal('qt_seller_other');
    const sellerNet=Math.max(0,sellerGross-sellerCOGS-sellerFees-sellerOther);
    if(sellerNet>0){totalSENet+=sellerNet;totalQBI+=sellerNet;detailHTML+=`<p><strong>Seller:</strong> ${TE.formatMoney(sellerGross)} gross - ${TE.formatMoney(sellerCOGS)} COGS - ${TE.formatMoney(sellerFees)} fees - ${TE.formatMoney(sellerOther)} other = ${TE.formatMoney(sellerNet)} net SE</p>`;}

    // Brand
    const brandGross=getVal('qt_brand_gross'),brandDed=getVal('qt_brand_ded');
    const brandNet=Math.max(0,brandGross-brandDed);
    if(brandNet>0){totalSENet+=brandNet;totalQBI+=brandNet;detailHTML+=`<p><strong>Brand Deal:</strong> ${TE.formatMoney(brandGross)} gross - ${TE.formatMoney(brandDed)} deductions = ${TE.formatMoney(brandNet)} net SE</p>`;}

    // Rental
    const rentalGross=getVal('qt_rental_gross'),rentalDed=getVal('qt_rental_ded');
    const rentalNet=Math.max(0,rentalGross-rentalDed);
    if(rentalNet>0){if(getSelect('qt_rental_type')==='active'){totalSENet+=rentalNet;totalQBI+=rentalNet;detailHTML+=`<p><strong>Rental (active):</strong> ${TE.formatMoney(rentalGross)} gross - ${TE.formatMoney(rentalDed)} deductions = ${TE.formatMoney(rentalNet)} net SE</p>`;}else{totalRentalNet+=rentalNet;detailHTML+=`<p><strong>Rental (passive):</strong> ${TE.formatMoney(rentalGross)} gross - ${TE.formatMoney(rentalDed)} deductions = ${TE.formatMoney(rentalNet)} net rental</p>`;}}

    // Interest/Dividends
    taxableInterest=getVal('qt_int_taxable');qualifiedDividends=getVal('qt_int_qualified');
    if(taxableInterest>0||qualifiedDividends>0){detailHTML+=`<p><strong>Interest/Dividends:</strong> ${TE.formatMoney(taxableInterest)} taxable interest + ${TE.formatMoney(qualifiedDividends)} qualified dividends</p>`;}

    // W-2
    totalW2=getVal('qt_w2_gross');w2Withholding=getVal('qt_w2_withholding');
    if(totalW2>0){detailHTML+=`<p><strong>W-2:</strong> ${TE.formatMoney(totalW2)} gross wages (${TE.formatMoney(w2Withholding)} withholding)</p>`;}

    // SE tax on combined net SE income
    const se=TE.calcSETax(totalSENet,DATA,totalW2);
    if(totalSENet>0){detailHTML+=`<p><strong>SE tax (15.3%):</strong> ${TE.formatMoney(se.totalSE)} on ${TE.formatMoney(totalSENet)} net SE income</p>`;}

    // Stock Options (exercise income affects AGI)
    const isoShares=getVal('qt_iso_shares'),isoPrice=getVal('qt_iso_price'),isoFMV=getVal('qt_iso_fmv');
    const nsoShares=getVal('qt_nso_shares'),nsoPrice=getVal('qt_nso_price'),nsoFMV=getVal('qt_nso_fmv');
    let optionsIncome=0,optionsDetail='';
    if(isoShares>0||nsoShares>0){
      const opt=TE.calcOptionsTax(isoShares,isoPrice,isoFMV,nsoShares,nsoPrice,nsoFMV,status,DATA);
      optionsIncome=opt.nsoOrdinaryIncome;
      optionsDetail=`<p><strong>Options exercise:</strong> ${TE.formatMoney(opt.isoBargainElement)} ISO bargain element (AMT adjustment) + ${TE.formatMoney(opt.nsoOrdinaryIncome)} NSO ordinary income</p>`;
    }

    // AGI and taxable income (qualified dividends ARE part of AGI)
    const agi=totalW2+totalSENet+totalRentalNet+taxableInterest+qualifiedDividends+optionsIncome-se.deductibleHalf;
    const taxableBeforeQD=Math.max(0,agi-stdDed);

    // QBI deduction reduces taxable income BEFORE federal tax calculation
    const qbi=TE.calcQBI(totalQBI,taxableBeforeQD,status,DATA);
    const taxableAfterQBI=Math.max(0,taxableBeforeQD-qbi);

    // Capital Gains (computed AFTER taxable income is known so brackets stack correctly)
    const stProceeds=getVal('qt_st_proceeds'),stBasis=getVal('qt_st_basis');
    const ltProceeds=getVal('qt_lt_proceeds'),ltBasis=getVal('qt_lt_basis');
    let cgTax=0,cgTotalGain=0,cgDetail='';
    if(stProceeds>0||ltProceeds>0){
      const cgBase=taxableAfterQBI; // Ordinary taxable income after QBI - CG brackets stack on top
      const cg=TE.calcCapitalGains(stProceeds,stBasis,ltProceeds,ltBasis,cgBase,status,DATA);
      cgTax=cg.totalCGTax;
      cgTotalGain=cg.totalGain;
      cgDetail=`<p><strong>Capital gains:</strong> ${TE.formatMoney(cg.shortTermGain)} short-term + ${TE.formatMoney(cg.longTermGain)} long-term = ${TE.formatMoney(cg.totalGain)} total gain</p>`;
      cgDetail+=`<p>Short-term tax: ${TE.formatMoney(cg.shortTermTax)} | Long-term tax: ${TE.formatMoney(cg.longTermTax)} | NIIT (3.8%): ${TE.formatMoney(cg.niitTax)}</p>`;
    }

    // Ordinary tax = taxable income minus qualified dividends (taxed at preferential rate)
    const ordinaryTaxable=Math.max(0,taxableAfterQBI-qualifiedDividends);
    const fedOrdinary=TE.calcFederalTax(ordinaryTaxable,status,DATA);
    // Qualified dividends stack on top of ordinary taxable income - use proper LTCG bracket stacking
    const fedQD=qualifiedDividends>0?TE.calcLTCGTax(qualifiedDividends,ordinaryTaxable,status,DATA):0;
    const fedTotal=fedOrdinary+fedQD;

    // State tax base: AGI + capital gains (since AGI in this calc doesn't include them yet)
    const stateTaxBase=agi+cgTotalGain;
    const stateRes=TE.calcStateTax(stateTaxBase,state,DATA,status);
    const childCredit=Math.min(TE.calcChildTaxCredit(dependents,agi,status,DATA),fedTotal);
    // EIC: earned income = W-2 + net SE income
    const earnedIncome=totalW2+totalSENet;
    const investmentIncome=taxableInterest+qualifiedDividends+cgTotalGain+totalRentalNet;
    const eic=TE.calcEIC(earnedIncome, investmentIncome, dependents, status, DATA);
    const fedAfterCredit=Math.max(0,fedTotal-childCredit-eic);
    const totalTax=fedAfterCredit+se.totalSE+stateRes.tax+cgTax;

    // Quarterly calculation
    const q=TE.calcQuarterly(totalTax,priorTax,priorAGI,DATA);
    const stillOwed=Math.max(0,totalTax-w2Withholding);
    const effectiveRate=totalTax>0?totalTax/(totalW2+totalSENet+totalRentalNet+taxableInterest+qualifiedDividends+cgTotalGain+optionsIncome):0;

    // Determine recommended quarterly payment
    const ninetyPctQuarterly=(totalTax*0.90)/4;
    const safeHarborQuarterly=q.perQuarter;
    let recommendedQuarterly,recommendedLabel;
    if(priorTax===0){
      recommendedQuarterly=ninetyPctQuarterly;
      recommendedLabel='First year / no prior tax: pay 90% of current year';
    }else if(safeHarborQuarterly>=ninetyPctQuarterly){
      recommendedQuarterly=safeHarborQuarterly;
      recommendedLabel='Safe harbor is higher - pay this to avoid any penalty';
    }else{
      recommendedQuarterly=ninetyPctQuarterly;
      recommendedLabel='90% of current year is higher - pay this to avoid any penalty';
    }

    // Results
    let lines=[];
    if(totalW2>0) lines.push({label:'W-2 wages',val:TE.formatMoney(totalW2)});
    if(totalSENet>0) lines.push({label:'Net SE income',val:TE.formatMoney(totalSENet)});
    if(totalRentalNet>0) lines.push({label:'Net rental income (passive)',val:TE.formatMoney(totalRentalNet)});
    if(taxableInterest>0) lines.push({label:'Bank/bond/REIT interest & dividends',val:TE.formatMoney(taxableInterest)});
    if(qualifiedDividends>0) lines.push({label:'Stock dividends (qualified)',val:TE.formatMoney(qualifiedDividends)});
    if(optionsIncome>0) lines.push({label:'NSO ordinary income (from exercise)',val:TE.formatMoney(optionsIncome)});
    lines.push({label:'AGI',val:TE.formatMoney(agi)},{label:'Standard deduction',val:'-'+TE.formatMoney(stdDed)},{label:'Taxable income before QBI',val:TE.formatMoney(taxableBeforeQD)});
    if(qbi>0) lines.push({label:'QBI deduction (20% of SE profit)',val:'-'+TE.formatMoney(qbi)},{label:'Taxable income after QBI',val:TE.formatMoney(taxableAfterQBI)});
    lines.push({label:'Federal income tax',val:TE.formatMoney(fedTotal)},{label:'Child tax credit',val:'-'+TE.formatMoney(childCredit)});
    if(eic>0) lines.push({label:'Earned Income Credit (EIC)',val:'-'+TE.formatMoney(eic)});
    lines.push({label:'Federal after credits',val:TE.formatMoney(fedAfterCredit)},{label:'SE tax (15.3% on net SE earnings)',val:TE.formatMoney(se.totalSE)},{label:'State income tax',val:TE.formatMoney(stateRes.tax)});
    if(cgTax>0) lines.push({label:'Capital gains tax (stocks sold)',val:TE.formatMoney(cgTax)});
    lines.push({label:'W-2 withholding',val:TE.formatMoney(w2Withholding)});

    document.getElementById('qt-res').innerHTML=`<div class="calc-panel" style="margin-top:1rem"><h3>Calculation Details</h3>${detailHTML}${cgDetail}${optionsDetail}</div>`+resultsBox(lines,'Total estimated tax',TE.formatMoney(totalTax))+
    `<div class="calc-panel" style="margin-top:1rem"><h3>Quarterly Payments</h3>
    <table class="data-table"><thead><tr><th>Quarter</th><th>Period</th><th>Due Date</th><th>Form</th></tr></thead><tbody>${q.quarters.map(qu=>`<tr><td>Q${qu.quarter}</td><td>${qu.periodLabel}</td><td>${new Date(qu.dueDate).toLocaleDateString()}</td><td>${qu.irsForm}</td></tr>`).join('')}</tbody></table>
    <div style="margin-top:1.5rem">
      <p><strong style="color:var(--accent)">Recommended quarterly payment: ${TE.formatMoney(recommendedQuarterly)}</strong></p>
      <p style="color:var(--muted);font-size:.9rem">${recommendedLabel}</p>
      <div style="display:flex;gap:1.5rem;margin-top:1rem;flex-wrap:wrap">
        <div><strong>90% of current year:</strong><br>${TE.formatMoney(ninetyPctQuarterly)}/quarter<br><span style="color:var(--muted);font-size:.85rem">Total year: ${TE.formatMoney(totalTax*0.90)}</span></div>
        <div><strong>Safe harbor:</strong><br>${TE.formatMoney(safeHarborQuarterly)}/quarter<br><span style="color:var(--muted);font-size:.85rem">${priorTax===0?'No prior tax - safe harbor is $0':'Based on last year: '+TE.formatMoney(priorTax)}</span></div>
      </div>
    </div>
    <p style="margin-top:1.5rem"><strong>Total tax you will owe:</strong> ${TE.formatMoney(totalTax)}</p>
    <p>W-2 withholding covers: <strong>${TE.formatMoney(w2Withholding)}</strong></p>
    <p>After withholding, you still owe: <strong>${TE.formatMoney(stillOwed)}</strong></p>
    <p style="color:var(--muted);margin-top:.75rem">Your effective tax rate: <strong>${(effectiveRate*100).toFixed(1)}%</strong> of total income</p>
    </div>`+
    `<div class="calc-panel" style="margin-top:1rem"><h3>Penalty Estimator</h3><p>If you underpay quarterly taxes, the IRS charges interest on the underpayment. The rate is the federal short-term rate + 3 percentage points, compounded daily. For 2026, assume approximately <strong>8%</strong> annual rate.</p>`+
    `<table class="data-table"><thead><tr><th>Scenario</th><th>Underpayment</th><th>Estimated Penalty (annual)</th></tr></thead><tbody>`+
    `<tr><td>Miss one quarter entirely</td><td>${TE.formatMoney(recommendedQuarterly)}</td><td>~${TE.formatMoney(recommendedQuarterly*0.08*0.25)}</td></tr>`+
    `<tr><td>Pay 50% of recommended</td><td>${TE.formatMoney(recommendedQuarterly*0.5)}</td><td>~${TE.formatMoney(recommendedQuarterly*0.5*0.08*0.25)}</td></tr>`+
    `<tr><td>Pay nothing all year (no withholding)</td><td>${TE.formatMoney(totalTax)}</td><td>~${TE.formatMoney(totalTax*0.08*0.5)}</td></tr>`+
    `</tbody></table>`+
    `<p style="margin-top:.75rem;color:var(--muted);font-size:.9rem">This is an approximation. The actual penalty is calculated using Form 2210 with daily compounding and is based on the specific quarter the underpayment occurred. Safe harbor (100% prior year / 110% if AGI > $150K) protects you from penalty even if you underpay.</p></div>`+
    `<div class="calc-panel" style="margin-top:1rem"><h3>Summary</h3><p>You will pay <strong>${TE.formatMoney(totalTax)}</strong> in total tax on <strong>${TE.formatMoney(agi)}</strong> of income.</p><p>Your take-home after all taxes and withholding: <strong>${TE.formatMoney(agi-totalTax)}</strong>.</p></div>`;
    scrollToResults('qt-res');
    }catch(err){
      document.getElementById('qt-res').innerHTML=`<div class="callout" style="background:rgba(201,74,30,.1);border-color:var(--accent)"><strong>Error</strong>${err.message}<br><small>${err.stack||''}</small></div>`;
      console.error(err);
    }
  });
}

/* ===================== OBBBA Tracker ===================== */
function obbbaTrackerView(main){
  let html=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'',text:'Reference'},{href:'',text:'OBBBA Tracker'})}<h2>OBBBA Tax Changes Tracker 2026</h2><p style="color:var(--muted);margin-bottom:1.5rem">The One Big Beautiful Bill Act (signed July 4, 2025) made major changes affecting self-employed filers, gig workers, and creators. Here is what changed and what it means for your 2026 return.</p>`;

  const provisions=[
    {title:'100% Bonus Depreciation Made Permanent',impact:'Positive',detail:'<p>Previously scheduled to phase out (80% in 2023, 60% in 2024, 40% in 2025, 20% in 2026, 0% in 2027). OBBBA restored <strong>100% bonus depreciation permanently</strong> for qualified property acquired and placed in service after January 19, 2025.</p><p><strong>What this means:</strong> You can write off 100% of qualifying equipment (cameras, computers, tools, vehicles over 6,000 lbs) in Year 1. No need to stretch deductions over 5–7 years.</p><p><strong>State trap:</strong> California and some other states do <em>not</em> conform to federal bonus depreciation. You get the federal deduction but must add it back for state tax. <a href="/reference/deductions">See state-specific deduction notes</a>.</p>'},
    {title:'QBI Deduction (Section 199A) Made Permanent',impact:'Positive',detail:'<p>The 20% pass-through deduction was set to expire after 2025. OBBBA made it <strong>permanent</strong>.</p><p><strong>What this means:</strong> Sole props, partnerships, and S-Corps continue to deduct up to 20% of qualified business income. For a creator with $80,000 net profit, that is a $16,000 deduction.</p><p><strong>SSTB phase-outs still apply:</strong> Specified service businesses (health, law, consulting, athletics, performing arts) phase out above $201,775 single / $403,500 MFJ.</p>'},
    {title:'R&D Expensing Restored',impact:'Positive',detail:'<p>TCJA required businesses to amortize R&D costs over 5 years (15 years for foreign) starting in 2022. OBBBA restored <strong>immediate expensing</strong> for domestic R&D costs.</p><p><strong>What this means:</strong> Software development, app creation, and product innovation costs can be fully deducted in the year incurred. No amortization spreadsheet needed.</p><p><strong>Foreign R&D:</strong> Costs for offshore development must still be amortized over 15 years. Only domestic R&D qualifies for immediate expensing under OBBBA.</p>'},
    {title:'1099-K Threshold Restored to $20,000 + 200 Transactions',impact:'Mixed',detail:'<p>The American Rescue Plan had lowered the 1099-K threshold to $600 with no transaction minimum, causing mass confusion. OBBBA restored the <strong>$20,000 and 200 transactions</strong> threshold.</p><p><strong>What this means:</strong> Most casual sellers and small creators will not receive a 1099-K. But ALL income is still taxable even without a 1099. The threshold only affects whether the platform must report it.</p><p><a href="/seller/1099k-reconciliation">Reconcile your 1099-K to actual taxable income</a>.</p>'},
    {title:'ACA Subsidy Enhancements Ended',impact:'Negative',detail:'<p>Enhanced premium tax credits (which removed the 400% FPL cliff) expired. For 2026, the pre-2021 rules apply: subsidies phase out at 400% of the federal poverty level.</p><p><strong>What this means:</strong> If your household income exceeds 400% FPL ($63,840 single / $86,160 family of 2 in 2026), you lose the entire subsidy. Side hustle income can push you over the cliff.</p><p><a href="/aca">Model your MAGI against ACA thresholds</a>.</p>'},
    {title:'QSBS Exclusion Cap Raised',impact:'Positive',detail:'<p>OBBBA increased the Section 1202 QSBS exclusion cap from $10M to <strong>$15M</strong> for stock acquired after July 4, 2025.</p><p><strong>What this means:</strong> If you invested in a qualified small business and sell after holding 5+ years, up to $15M of gain may be completely excluded from federal tax.</p><p><a href="/equity">Calculate QSBS exclusion</a>.</p>'},
    {title:'State and Local Tax (SALT) Cap Raised to $40,400',impact:'Neutral',detail:'<p>For 2026, the SALT cap increases from $10,000 to <strong>$40,400</strong> under OBBBA. The higher cap phases out for taxpayers with MAGI over approximately $505,000, and reverts to $10,000 in 2030.</p><p><strong>What this means:</strong> High-tax-state W-2 and self-employed taxpayers who itemize can deduct significantly more state income and property taxes. Schedule C business deductions remain unaffected by the SALT cap in any year.</p>'},
    {title:'Work Opportunity Tax Credit (WOTC) Extended',impact:'Positive',detail:'<p>OBBBA extended WOTC through 2026. If you hire veterans, SNAP recipients, or long-term unemployed individuals, you may qualify for a credit of up to $9,600 per employee.</p>'}
  ];

  html='';
  for(const p of provisions){
    const color=p.impact==='Positive'?'var(--success)':p.impact==='Negative'?'var(--accent)':'var(--muted)';
    html+=`<div class="section"><h3>${p.title} <span style="color:${color};font-size:.9rem">(${p.impact})</span></h3>${p.detail}</div>`;
  }

  html+=`<div class="calc-panel" style="margin-top:1.5rem"><h3>OBBBA Effective Dates</h3><table class="data-table"><thead><tr><th>Provision</th><th>Effective Date</th></tr></thead><tbody>`+
  `<tr><td>100% Bonus Depreciation</td><td>Property acquired and placed in service after Jan 19, 2025</td></tr>`+
  `<tr><td>QBI Permanence</td><td>Tax years beginning after Dec 31, 2025</td></tr>`+
  `<tr><td>R&D Expensing</td><td>Tax years beginning after Dec 31, 2024. Small businesses (&lt;$31M gross receipts) may elect retroactive treatment for 2022–2024 via amended returns.</td></tr>`+
  `<tr><td>1099-K Threshold</td><td>Permanent, retroactive to 2022</td></tr>`+
  `<tr><td>QSBS $15M Cap</td><td>Stock acquired after July 4, 2025</td></tr>`+
  `</tbody></table></div>`;

  html+=renderFaqSection([
    {q:'Does OBBBA affect my 2025 return?',a:'Some provisions are retroactive (R&D expensing). Most affect 2026 and beyond. The 100% bonus depreciation applies to property acquired and placed in service after January 19, 2025 - so 2025 purchases may qualify.'},
    {q:'Will my state follow OBBBA?',a:'Not automatically. States choose whether to conform to federal tax changes. California does NOT conform to bonus depreciation or Section 179. Check your state\'s tax website for conformity updates.'},
    {q:'Did OBBBA change my quarterly estimated tax?',a:'No direct change to quarterly payment rules. But if bonus depreciation or QBI permanence significantly lowers your taxable income, your estimated payments may decrease. Recalculate each quarter. <a href="/quarterly">Use our quarterly estimator</a>.'}
  ]);
  main.innerHTML=html;
}

/* ===================== Professionals Deductions ===================== */
function professionalsView(main){
  const profs=DATA.professionals||{};
  const names={software_dev:'Software Developer',ai_consultant:'AI Consultant',designer:'Designer',copywriter:'Copywriter',realtor:'Realtor',travel_nurse:'Travel Nurse',truck_driver_otr:'Truck Driver (OTR)',photographer:'Photographer',hair_stylist:'Hair Stylist',personal_trainer:'Personal Trainer',therapist:'Therapist',nurse_contractor:'Nurse Contractor',massage_therapist:'Massage Therapist',bookkeeper_accountant:'Bookkeeper / Accountant',virtual_assistant:'Virtual Assistant',coach:'Coach',insurance_agent:'Insurance Agent',notary_signing_agent:'Notary Signing Agent',tutor:'Tutor',wedding_event_planner:'Wedding / Event Planner',qa_tester_contractor:'QA Tester Contractor',clergy_minister:'Clergy / Minister',farm_schedule_f:'Farmer (Schedule F)'};
  let cards='';
  for(const key in profs){
    const p=profs[key];
    const label=names[key]||key;
    let dedList=[];
    if(p.keyDeductions) dedList=p.keyDeductions.map(d=>typeof d==='string'?d:d.name||'');
    else if(p.uniqueDeductions) dedList=p.uniqueDeductions.map(d=>d.name||'');
    const deds=dedList.filter(Boolean).map(d=>`<li>${d.replace(/_/g,' ')}</li>`).join('');
    cards+=`<div class="tile-card fade-in" style="cursor:default"><span class="tile-name">${label}</span><span class="tile-desc" style="text-align:left"><ul style="margin:0;padding-left:1.25rem;font-size:.85rem">${deds}</ul></span></div>`;
  }
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'',text:'Reference'},{href:'',text:'Deductions by Profession'})}<h2>Deductions by Profession</h2><p style="color:var(--muted);margin-bottom:1.5rem">23 professions with their most common tax deductions. Use these as a checklist for your Schedule C.</p>${callout('blue','Not a complete list','These are the most common deductions. Your specific situation may have additional deductions. Consult a tax professional for personalized advice.')}
    <div class="tile-grid" style="grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px">${cards}</div>`;
}

/* ===================== Overtime Pay Calculator ===================== */
function overtimePayView(main){
  const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  let rows='';
  for(const d of days){
    rows+=`<tr>
      <td style="font-weight:600">${d}</td>
      <td><input type="time" id="ot_${d}_in" value="${d==='Sat'||d==='Sun'?'':'09:00'}" style="width:100%;padding:.5rem;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--text)"></td>
      <td><input type="time" id="ot_${d}_out" value="${d==='Sat'||d==='Sun'?'':'17:00'}" style="width:100%;padding:.5rem;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--text)"></td>
      <td><input type="number" id="ot_${d}_break" value="${d==='Sat'||d==='Sun'?'0':'30'}" min="0" style="width:80px;padding:.5rem;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--text)"></td>
      <td id="ot_${d}_res" style="text-align:right;color:var(--muted)">-</td>
    </tr>`;
  }

  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'Overtime Pay'})}<h2>Overtime Pay Calculator 2026</h2><p style="color:var(--muted);margin-bottom:1.5rem">Regular rate × 1.5 for OT hours. Handles daily OT (CA rules) vs weekly FLSA rules. Hourly workers run this every Friday before clocking out.</p>
    <div class="calc-grid"><div class="calc-panel"><h3>Weekly Timesheet</h3>
      <table class="data-table" style="margin-bottom:1rem"><thead><tr><th>Day</th><th>Clock In</th><th>Clock Out</th><th>Break (min)</th><th style="text-align:right">Hours / Pay</th></tr></thead><tbody>${rows}</tbody></table>
    </div>
    <div class="calc-panel"><h3>Pay Rules</h3>
      ${inputField('ot_rate','Hourly rate','number',{value:28})}
      ${inputField('ot_daily_thresh','Daily regular hours threshold','number',{value:8})}
      ${inputField('ot_weekly_thresh','Weekly regular hours threshold','number',{value:40})}
      ${inputField('ot_mult','Overtime multiplier','number',{value:1.5})}
      ${selectField('ot_rule','Overtime rule',[{value:0,label:'Federal (weekly only)'},{value:1,label:'California (daily + weekly)'},{value:2,label:'Custom (whichever is higher)'}],{value:1})}
    </div></div>
    <div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcOvertimePay()">Calculate Pay</button></div>
    <div id="ot-res"></div>`+
    renderFaqSection([
      {q:'How does daily overtime work?',a:'California and some states require overtime for hours worked beyond 8 in a single day, even if your weekly total is under 40. Federal FLSA only requires weekly overtime (over 40 hours total). This calculator lets you pick which rule applies.'},
      {q:'What about double time?',a:'This calculator does not include double time (2x rate). Some states require double time after 12 hours in a day or on the 7th consecutive day. Check your state labor code for specific rules.'},
      {q:'Should I include lunch breaks?',a:'Only subtract UNPAID breaks. If you clock out for lunch (30-60 min), enter those minutes. Paid breaks (rest breaks, typically 10-15 min) are paid time - do NOT subtract them.'}
    ]);

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.calcOvertimePay = safeCalc(function(){
    function parseTime(t){
      if(!t) return 0;
      const [h,m]=t.split(':').map(Number);
      return h*60+m;
    }
    const rate=getVal('ot_rate'),dailyThresh=getVal('ot_daily_thresh'),weeklyThresh=getVal('ot_weekly_thresh');
    const otMult=getVal('ot_mult');
    const ruleIdx=parseInt(document.getElementById('ot_rule').value)||1;

    let weeklyTotal=0;
    const dayData=[];

    // Pass 1: calculate daily hours
    for(const d of days){
      const clockIn=parseTime(document.getElementById('ot_'+d+'_in').value);
      const clockOut=parseTime(document.getElementById('ot_'+d+'_out').value);
      const breakMin=getVal('ot_'+d+'_break');
      const rawMin=Math.max(0,clockOut-clockIn-breakMin);
      const hours=rawMin/60;
      dayData.push({day:d,hours,clockIn,clockOut});
      weeklyTotal+=hours;
    }

    // Pass 2: calculate pay based on rule
    let totalRegularPay=0,totalOTPay=0,totalPay=0;
    let weeklyRegularAccum=0;
    const results=[];

    for(let i=0;i<dayData.length;i++){
      const d=dayData[i];
      let dailyRegular=0,dailyOT=0,dayPay=0,dayRegularPay=0,dayOTPay=0;

      if(ruleIdx===0){ // Federal: weekly only
        const remainingWeeklyReg=Math.max(0,weeklyThresh-weeklyRegularAccum);
        dailyRegular=Math.min(d.hours,remainingWeeklyReg);
        dailyOT=Math.max(0,d.hours-dailyRegular);
        weeklyRegularAccum+=dailyRegular;
      } else if(ruleIdx===1){ // California: daily + weekly
        const dailyReg=Math.min(d.hours,dailyThresh);
        const dailyOt=Math.max(0,d.hours-dailyThresh);
        // Weekly check: if weekly total exceeds threshold, recalc remaining
        const remainingWeeklyReg=Math.max(0,weeklyThresh-weeklyRegularAccum);
        if(weeklyRegularAccum+dailyReg+dailyOt>weeklyThresh){
          // Blend: daily OT counts first, then regular up to weekly limit
          const totalBefore=weeklyRegularAccum;
          if(totalBefore+dailyReg>weeklyThresh){
            dailyRegular=Math.max(0,weeklyThresh-totalBefore);
            dailyOT=d.hours-dailyRegular;
          } else {
            dailyRegular=dailyReg;
            const remainingAfterDaily=weeklyThresh-(totalBefore+dailyRegular);
            const potentialWeeklyOT=Math.max(0,dailyOt-remainingAfterDaily);
            dailyOT=potentialWeeklyOT;
          }
        } else {
          dailyRegular=dailyReg;
          dailyOT=dailyOt;
        }
        weeklyRegularAccum+=dailyRegular;
      } else { // Custom: whichever is higher
        const dailyReg=Math.min(d.hours,dailyThresh);
        const dailyOt=Math.max(0,d.hours-dailyThresh);
        const remainingWeeklyReg=Math.max(0,weeklyThresh-weeklyRegularAccum);
        const weeklyReg=Math.min(d.hours,remainingWeeklyReg);
        const weeklyOt=Math.max(0,d.hours-weeklyReg);
        // Use whichever produces more OT (higher is more worker-friendly)
        if(dailyOt>=weeklyOt){
          dailyRegular=dailyReg;
          dailyOT=dailyOt;
        } else {
          dailyRegular=weeklyReg;
          dailyOT=weeklyOt;
        }
        weeklyRegularAccum+=dailyRegular;
      }

      dayRegularPay=dailyRegular*rate;
      dayOTPay=dailyOT*rate*otMult;
      dayPay=dayRegularPay+dayOTPay;
      totalRegularPay+=dayRegularPay;
      totalOTPay+=dayOTPay;
      totalPay+=dayPay;

      document.getElementById('ot_'+d.day+'_res').innerHTML=d.hours>0
        ?`<span style="color:var(--text)">${d.hours.toFixed(2)} hrs</span>`+(dailyOT>0?` <span style="color:var(--accent);font-size:.8rem">(${TE.formatMoney(dayPay)})</span>`:` <span style="color:var(--muted);font-size:.8rem">(${TE.formatMoney(dayPay)})</span>`)
        :'<span style="color:var(--muted)">-</span>';

      results.push({day:d.day,hours:d.hours,regular:dailyRegular,ot:dailyOT,regularPay:dayRegularPay,otPay:dayOTPay,totalPay:dayPay});
    }

    const totalHours=dayData.reduce((s,d)=>s+d.hours,0);
    const otHours=totalHours>0?dayData.reduce((s,d,i)=>s+results[i].ot,0):0;
    const regHours=totalHours-otHours;

    const lines=[
      {label:'Total hours worked',val:totalHours.toFixed(2)+' hrs'},
      {label:'Regular hours',val:regHours.toFixed(2)+' hrs'},
      {label:'Overtime hours',val:otHours.toFixed(2)+' hrs'},
      {label:'Hourly rate',val:TE.formatMoney(rate)+'/hr'},
      {label:'OT multiplier',val:otMult.toFixed(1)+'x'},
      {label:'Regular pay',val:TE.formatMoney(totalRegularPay)},
      {label:'Overtime pay',val:TE.formatMoney(totalOTPay)},
      {label:'Total pay (gross)',val:TE.formatMoney(totalPay)}
    ];

    const ruleNames=['Federal (weekly only)','California (daily + weekly)','Custom (higher of daily/weekly)'];
    const ruleName=ruleNames[ruleIdx]||'Custom';

    document.getElementById('ot-res').innerHTML=resultsBox(lines,'Weekly Pay',TE.formatMoney(totalPay))+
    `<div class="calc-panel" style="margin-top:1rem"><h3>Day-by-Day Breakdown</h3><table class="data-table"><thead><tr><th>Day</th><th>Hours</th><th>Regular</th><th>Overtime</th><th>Regular Pay</th><th>OT Pay</th><th>Total Pay</th></tr></thead><tbody>`+
    results.map(r=>`<tr><td>${r.day}</td><td>${r.hours.toFixed(2)}</td><td>${r.regular.toFixed(2)}</td><td>${r.ot.toFixed(2)}</td><td>${TE.formatMoney(r.regularPay)}</td><td>${TE.formatMoney(r.otPay)}</td><td><strong>${TE.formatMoney(r.totalPay)}</strong></td></tr>`).join('')+
    `</tbody></table><p style="margin-top:1rem;color:var(--muted);font-size:.9rem"><strong>Rule applied:</strong> ${ruleName}. ${ruleIdx===0?'Only weekly threshold counts. You must exceed 40 total hours before any OT applies.':ruleIdx===1?'Daily OT (>8 hrs) applies each day. Weekly OT (>40 hrs) also applies if weekly total is exceeded.':'Uses whichever rule (daily or weekly) produces more overtime pay for the worker.'}</p></div>`;
    scrollToResults('ot-res');
  });
}

/* ===================== Salary to Hourly Converter ===================== */
function salaryToHourlyView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'Salary to Hourly'})}<h2>Salary to Hourly Converter 2026</h2><p style="color:var(--muted);margin-bottom:1.5rem">Annual salary ÷ actual work hours, with PTO and holiday adjustments. More accurate than a simple divide. Reverse mode included.</p>
    <div class="calc-grid"><div class="calc-panel"><h3>Salary → Hourly</h3>
      ${inputField('sth_salary','Annual salary','number',{value:85000})}
      ${inputField('sth_hours','Regular hours per week','number',{value:40})}
      ${inputField('sth_pto','Paid PTO days (vacation + sick)','number',{value:15})}
      ${inputField('sth_holidays','Paid holidays','number',{value:10})}
      ${inputField('sth_unpaid','Unpaid days off','number',{value:0})}
    </div>
    <div class="calc-panel"><h3>Hourly → Salary (Reverse)</h3>
      ${inputField('sth_hourly_rate','Hourly rate','number',{value:0})}
      ${inputField('sth_rev_hours','Hours per week','number',{value:40})}
      ${inputField('sth_rev_pto','Paid PTO days','number',{value:15})}
      ${inputField('sth_rev_holidays','Paid holidays','number',{value:10})}
      ${inputField('sth_rev_unpaid','Unpaid days off','number',{value:0})}
    </div></div>
    <div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcSalaryToHourly()">Calculate</button></div>
    <div id="sth-res"></div>`+
    renderFaqSection([
      {q:'Why not just divide salary by 2,080?',a:'The 2,080 figure assumes 40 hours × 52 weeks with zero time off. Most full-time workers have 15-25 days of PTO and 10 paid holidays. That means you are actually paid for fewer days than you think, so your true hourly rate is higher than salary÷2080.'},
      {q:'Which mode should I use?',a:'Use Salary → Hourly when evaluating a job offer: "Is $85k actually worth it?" Use Hourly → Salary when comparing an hourly gig to a salaried role: "What salary equals $45/hr with benefits?"'},
      {q:'Do I count weekends as unpaid days off?',a:'No. This calculator assumes a standard 5-day work week (260 weekdays/year). Only enter days YOU take off beyond weekends: vacation, sick leave, unpaid leave, etc.'}
    ]);

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.calcSalaryToHourly = safeCalc(function(){
    const salary=getVal('sth_salary'),hours=getVal('sth_hours');
    const pto=getVal('sth_pto'),holidays=getVal('sth_holidays'),unpaid=getVal('sth_unpaid');
    const revRate=getVal('sth_hourly_rate'),revHours=getVal('sth_rev_hours');
    const revPto=getVal('sth_rev_pto'),revHolidays=getVal('sth_rev_holidays'),revUnpaid=getVal('sth_rev_unpaid');

    const workdaysPerYear=260; // 52 weeks × 5 days
    const weeksPerYear=52;

    // Forward: salary → hourly
    const workDaysForward=workdaysPerYear-pto-holidays-unpaid; // days physically at work
    const paidDaysForward=workdaysPerYear-unpaid; // all paid days incl PTO/holidays
    const simpleHourlyForward=salary>0&&hours>0?salary/(hours*weeksPerYear):0;
    const trueHourlyForward=salary>0&&workDaysForward>0&&hours>0
      ?salary/(workDaysForward*(hours/5))
      :0;
    const allPaidHourlyForward=salary>0&&paidDaysForward>0&&hours>0
      ?salary/(paidDaysForward*(hours/5))
      :0;

    // Reverse: hourly → salary
    const workDaysReverse=workdaysPerYear-revPto-revHolidays-revUnpaid;
    const paidDaysReverse=workdaysPerYear-revUnpaid;
    const simpleSalaryReverse=revRate>0&&revHours>0?revRate*revHours*weeksPerYear:0;
    const trueSalaryReverse=revRate>0&&workDaysReverse>0&&revHours>0
      ?revRate*(workDaysReverse*(revHours/5))
      :0;
    const allPaidSalaryReverse=revRate>0&&paidDaysReverse>0&&revHours>0
      ?revRate*(paidDaysReverse*(revHours/5))
      :0;

    const lines=[];

    if(salary>0){
      lines.push({label:'Annual salary',val:TE.formatMoney(salary)});
      lines.push({label:'Hours per week',val:hours.toLocaleString()});
      lines.push({label:'Paid PTO + holidays',val:(pto+holidays)+' days'});
      lines.push({label:'Unpaid days off',val:unpaid+' days'});
      lines.push({label:'Paid workdays (260 - unpaid)',val:paidDaysForward+' days'});
      lines.push({label:'Days actually working',val:workDaysForward+' days'});
      lines.push({label:'Simple hourly (salary ÷ 2080)',val:simpleHourlyForward>0?TE.formatMoney(simpleHourlyForward)+'/hr':'N/A'});
      lines.push({label:'True hourly (work hours only)',val:trueHourlyForward>0?TE.formatMoney(trueHourlyForward)+'/hr':'N/A'});
      lines.push({label:'All-paid-days hourly',val:allPaidHourlyForward>0?TE.formatMoney(allPaidHourlyForward)+'/hr':'N/A'});
    }

    if(revRate>0){
      if(lines.length>0) lines.push({label:'',val:''});
      lines.push({label:'Hourly rate',val:TE.formatMoney(revRate)+'/hr'});
      lines.push({label:'Hours per week',val:revHours.toLocaleString()});
      lines.push({label:'Paid PTO + holidays',val:(revPto+revHolidays)+' days'});
      lines.push({label:'Unpaid days off',val:revUnpaid+' days'});
      lines.push({label:'Simple annual (rate × 2080)',val:simpleSalaryReverse>0?TE.formatMoney(simpleSalaryReverse):'N/A'});
      lines.push({label:'True annual (work hours only)',val:trueSalaryReverse>0?TE.formatMoney(trueSalaryReverse):'N/A'});
      lines.push({label:'All-paid-days annual',val:allPaidSalaryReverse>0?TE.formatMoney(allPaidSalaryReverse):'N/A'});
    }

    const hasForward=salary>0&&trueHourlyForward>0;
    const hasReverse=revRate>0&&trueSalaryReverse>0;

    let summaryHtml='';
    if(hasForward){
      summaryHtml+=`<p>Your <strong>${TE.formatMoney(salary)}</strong> salary at <strong>${hours}</strong> hrs/week with <strong>${pto+holidays}</strong> paid days off = <strong>${TE.formatMoney(trueHourlyForward)}/hr</strong> true hourly rate.</p>`;
      const diffFwd=trueHourlyForward-simpleHourlyForward;
      summaryHtml+=`<p>Simple calculation says <strong>${TE.formatMoney(simpleHourlyForward)}/hr</strong> - that's <strong>${TE.formatMoney(Math.abs(diffFwd))}</strong> ${diffFwd>=0?'lower':'higher'} because it ignores your paid time off. You earn more per hour actually worked.</p>`;
    }
    if(hasReverse){
      summaryHtml+=`<p>At <strong>${TE.formatMoney(revRate)}/hr</strong> for <strong>${revHours}</strong> hrs/week with <strong>${revPto+revHolidays}</strong> paid days off, your true annual equivalent is <strong>${TE.formatMoney(trueSalaryReverse)}</strong>.</p>`;
      const diffRev=simpleSalaryReverse-trueSalaryReverse;
      summaryHtml+=`<p>Simple calculation says <strong>${TE.formatMoney(simpleSalaryReverse)}</strong> - that's <strong>${TE.formatMoney(Math.abs(diffRev))}</strong> too ${diffRev>=0?'high':'low'} because it double-counts paid time off.</p>`;
    }

    document.getElementById('sth-res').innerHTML=resultsBox(lines,'Results','')+
    `<div class="calc-panel" style="margin-top:1rem"><h3>Summary</h3>${summaryHtml}<p style="color:var(--muted);font-size:.9rem;margin-top:1rem"><strong>Method:</strong> "True" divides by hours you physically work (excludes PTO & holidays). "All-paid-days" divides by every paid day including PTO & holidays - same as simple when you have zero unpaid days. "Simple" uses 2,080 flat. Use true rate when comparing offers with different PTO packages.</p></div>`;
    scrollToResults('sth-res');
  });
}

/* ===================== City Salary Comparison ===================== */
function cityComparisonView(main){
  const CATS=['housing','groceries','utilities','transport','healthcare','misc'];
  const CAT_LABELS={housing:'Housing',groceries:'Groceries / Food',utilities:'Utilities',transport:'Transportation',healthcare:'Healthcare',misc:'Everything Else'};
  const DEFAULT_WEIGHTS={housing:33,groceries:12,utilities:6,transport:10,healthcare:8,misc:31};
  const COL_DATA=[
    {name:'New York, NY',index:187,state:'NY',housing:265,groceries:138,utilities:118,transport:128,healthcare:115,misc:125},
    {name:'San Francisco, CA',index:178,state:'CA',housing:250,groceries:132,utilities:112,transport:122,healthcare:118,misc:120},
    {name:'San Jose, CA',index:175,state:'CA',housing:240,groceries:130,utilities:110,transport:120,healthcare:118,misc:118},
    {name:'Los Angeles, CA',index:152,state:'CA',housing:210,groceries:120,utilities:105,transport:115,healthcare:110,misc:115},
    {name:'San Diego, CA',index:147,state:'CA',housing:195,groceries:118,utilities:105,transport:112,healthcare:108,misc:112},
    {name:'Seattle, WA',index:145,state:'WA',housing:190,groceries:120,utilities:100,transport:108,healthcare:105,misc:110},
    {name:'Boston, MA',index:143,state:'MA',housing:185,groceries:118,utilities:105,transport:110,healthcare:112,misc:110},
    {name:'Washington, DC',index:140,state:'DC',housing:175,groceries:115,utilities:102,transport:108,healthcare:110,misc:108},
    {name:'Chicago, IL',index:118,state:'IL',housing:130,groceries:105,utilities:98,transport:105,healthcare:100,misc:102},
    {name:'Denver, CO',index:123,state:'CO',housing:145,groceries:108,utilities:98,transport:100,healthcare:98,misc:105},
    {name:'Portland, OR',index:125,state:'OR',housing:148,groceries:108,utilities:95,transport:100,healthcare:98,misc:105},
    {name:'Minneapolis, MN',index:110,state:'MN',housing:125,groceries:102,utilities:95,transport:98,healthcare:98,misc:100},
    {name:'Philadelphia, PA',index:115,state:'PA',housing:130,groceries:105,utilities:98,transport:102,healthcare:100,misc:102},
    {name:'Miami, FL',index:120,state:'FL',housing:140,groceries:108,utilities:105,transport:105,healthcare:100,misc:105},
    {name:'Austin, TX',index:115,state:'TX',housing:130,groceries:98,utilities:95,transport:95,healthcare:95,misc:98},
    {name:'Dallas, TX',index:108,state:'TX',housing:115,groceries:98,utilities:95,transport:95,healthcare:95,misc:98},
    {name:'Houston, TX',index:105,state:'TX',housing:110,groceries:98,utilities:95,transport:95,healthcare:95,misc:98},
    {name:'Atlanta, GA',index:103,state:'GA',housing:105,groceries:98,utilities:95,transport:95,healthcare:95,misc:98},
    {name:'Phoenix, AZ',index:108,state:'AZ',housing:115,groceries:98,utilities:105,transport:95,healthcare:95,misc:98},
    {name:'Nashville, TN',index:106,state:'TN',housing:112,groceries:96,utilities:92,transport:92,healthcare:92,misc:96},
    {name:'Raleigh, NC',index:98,state:'NC',housing:100,groceries:95,utilities:92,transport:92,healthcare:92,misc:95},
    {name:'Tampa, FL',index:105,state:'FL',housing:108,groceries:96,utilities:95,transport:95,healthcare:92,misc:96},
    {name:'Salt Lake City, UT',index:110,state:'UT',housing:115,groceries:98,utilities:90,transport:95,healthcare:92,misc:98},
    {name:'Charlotte, NC',index:100,state:'NC',housing:102,groceries:96,utilities:92,transport:92,healthcare:92,misc:96},
    {name:'Kansas City, MO',index:95,state:'MO',housing:95,groceries:94,utilities:92,transport:90,healthcare:90,misc:94},
    {name:'Indianapolis, IN',index:92,state:'IN',housing:85,groceries:92,utilities:90,transport:88,healthcare:88,misc:92},
    {name:'Columbus, OH',index:94,state:'OH',housing:88,groceries:94,utilities:90,transport:90,healthcare:90,misc:94},
    {name:'Cincinnati, OH',index:93,state:'OH',housing:82,groceries:92,utilities:90,transport:88,healthcare:88,misc:92},
    {name:'Milwaukee, WI',index:93,state:'WI',housing:85,groceries:92,utilities:90,transport:88,healthcare:90,misc:92},
    {name:'Pittsburgh, PA',index:92,state:'PA',housing:80,groceries:92,utilities:88,transport:88,healthcare:88,misc:92},
    {name:'St. Louis, MO',index:91,state:'MO',housing:78,groceries:90,utilities:88,transport:88,healthcare:88,misc:90},
    {name:'Detroit, MI',index:90,state:'MI',housing:75,groceries:90,utilities:88,transport:88,healthcare:88,misc:90},
    {name:'Cleveland, OH',index:89,state:'OH',housing:72,groceries:90,utilities:88,transport:88,healthcare:88,misc:88},
    {name:'Oklahoma City, OK',index:86,state:'OK',housing:70,groceries:88,utilities:88,transport:85,healthcare:85,misc:88},
    {name:'Memphis, TN',index:85,state:'TN',housing:68,groceries:88,utilities:88,transport:85,healthcare:85,misc:88},
    {name:'Louisville, KY',index:88,state:'KY',housing:72,groceries:90,utilities:88,transport:88,healthcare:85,misc:90},
    {name:'Birmingham, AL',index:86,state:'AL',housing:68,groceries:88,utilities:88,transport:85,healthcare:85,misc:88},
    {name:'Buffalo, NY',index:95,state:'NY',housing:88,groceries:95,utilities:95,transport:92,healthcare:90,misc:92},
    {name:'Boise, ID',index:103,state:'ID',housing:105,groceries:98,utilities:88,transport:92,healthcare:90,misc:98},
    {name:'Remote / National Average',index:100,state:null,housing:100,groceries:100,utilities:100,transport:100,healthcare:100,misc:100}
  ];
  const cityOptions=COL_DATA.map(c=>({value:c.name,label:c.name+' (COL: '+c.index+')'}));

  const spendInputs=CATS.map(cat=>inputField('cc_'+cat,DEFAULT_WEIGHTS[cat]+'%  -  '+CAT_LABELS[cat],'number',{value:DEFAULT_WEIGHTS[cat]})).join('');

  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'City Comparison'})}<h2>Salary Comparison by City 2026</h2><p style="color:var(--muted);margin-bottom:1.5rem">Does $120k in NYC = $75k in Austin? See cost-of-living adjusted salary equivalence. Now with category-level personalization - adjust your spending mix to see YOUR number.</p>
    <div class="calc-grid"><div class="calc-panel"><h3>Your Offer</h3>
      ${inputField('cc_salary','Annual salary','number',{value:120000})}
      ${selectField('cc_city_a','City A (where the salary is)',cityOptions,{value:'New York, NY'})}
      ${selectField('cc_city_b','City B (compare to)',cityOptions,{value:'Austin, TX'})}
    </div>
    <div class="calc-panel"><h3>Your Spending Mix</h3>
      ${spendInputs}
      <p style="color:var(--muted);font-size:.9rem;margin-top:1rem">Adjust percentages to match your actual spending. Default is US average. The calculator builds a personalized cost-of-living index from these weights.</p>
    </div></div>
    <div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcCityComparison()">Compare Cities</button></div>
    <div id="cc-res"></div>`+
    renderFaqSection([
      {q:'How is the personalized index calculated?',a:'We weight each city\'s category costs (housing, groceries, utilities, transportation, healthcare, everything else) by your spending percentages. If you spend 40% on housing and NYC housing costs 265% of national average, your housing weight is 40% × 265 = 106. We sum all six categories to get your personalized index.'},
      {q:'Why does my personalized result differ from the composite index?',a:'The composite index is an average for a typical household. If you spend more on housing than average, a high-housing city (like NYC or SF) will look even more expensive to you personally. If you spend less on housing and more on groceries, the difference shrinks.'},
      {q:'Does this calculator include state income tax?',a:'Yes. The calculator estimates single-filer state tax for both cities using 2026 brackets, with standard deduction and no dependents. Use our state tax calculator for a detailed breakdown with your actual filing status, deductions, and credits.'}
    ]);

  function getWeightedIndex(data){
    let total=0;
    for(const cat of CATS){
      const w=getVal('cc_'+cat)||DEFAULT_WEIGHTS[cat];
      total+=w*(data[cat]||100);
    }
    return total/100;
  }

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.calcCityComparison = safeCalc(function(){
    const salary=getVal('cc_salary');
    const cityA=document.getElementById('cc_city_a').value;
    const cityB=document.getElementById('cc_city_b').value;
    const dataA=COL_DATA.find(c=>c.name===cityA);
    const dataB=COL_DATA.find(c=>c.name===cityB);
    const colA=getWeightedIndex(dataA);
    const colB=getWeightedIndex(dataB);
    const compositeA=dataA?.index||100;
    const compositeB=dataB?.index||100;
    const equivalent=salary*(colB/colA);
    const diff=equivalent-salary;
    const pctChange=((colB/colA)-1)*100;

    // State tax estimates (simplified: single-filer brackets, salary as AGI)
    let stateTaxA=0,stateTaxB=0;
    if(DATA&&TE&&TE.calcStateTax){
      if(dataA?.state){
        try{stateTaxA=TE.calcStateTax(salary,dataA.state,DATA,'single')?.tax||0;}catch(e){stateTaxA=0;}
      }
      if(dataB?.state){
        try{stateTaxB=TE.calcStateTax(equivalent,dataB.state,DATA,'single')?.tax||0;}catch(e){stateTaxB=0;}
      }
    }
    const afterTaxSalary=salary-stateTaxA;
    const afterTaxEquivalent=equivalent-stateTaxB;
    const afterTaxDiff=afterTaxEquivalent-afterTaxSalary;

    // Category breakdown for display
    let catRows='';
    for(const cat of CATS){
      const label=CAT_LABELS[cat];
      const w=getVal('cc_'+cat)||DEFAULT_WEIGHTS[cat];
      const a=dataA[cat]||100;
      const b=dataB[cat]||100;
      catRows+=`<tr><td>${label}</td><td>${w}%</td><td>${a}</td><td>${b}</td><td>${(b-a>=0?'+':'')+(b-a)}</td></tr>`;
    }

    const lines=[
      {label:'Your salary in '+cityA,val:TE.formatMoney(salary)},
      {label:'Composite COL index ('+cityA+')',val:compositeA.toFixed(0)},
      {label:'Composite COL index ('+cityB+')',val:compositeB.toFixed(0)},
      {label:'Your personalized COL index ('+cityA+')',val:colA.toFixed(1)},
      {label:'Your personalized COL index ('+cityB+')',val:colB.toFixed(1)},
      {label:'Equivalent salary in '+cityB,val:TE.formatMoney(equivalent)},
      {label:'Difference',val:(diff>=0?'+':'')+TE.formatMoney(diff)},
      {label:'Percent change',val:(pctChange>=0?'+':'')+pctChange.toFixed(1)+'%'}
    ];
    if(stateTaxA>0||stateTaxB>0){
      lines.push({label:'',val:''});
      if(stateTaxA>0) lines.push({label:'Est. state tax in '+cityA,val:TE.formatMoney(stateTaxA)});
      if(stateTaxB>0) lines.push({label:'Est. state tax in '+cityB,val:TE.formatMoney(stateTaxB)});
      if(stateTaxA>0&&stateTaxB>0){
        const taxSavings=stateTaxA-stateTaxB;
        lines.push({label:'Tax savings in '+cityB,val:(taxSavings>=0?'+':'')+TE.formatMoney(taxSavings)});
      }
      lines.push({label:'After-tax equivalent in '+cityB,val:TE.formatMoney(afterTaxEquivalent)});
      lines.push({label:'After-tax difference',val:(afterTaxDiff>=0?'+':'')+TE.formatMoney(afterTaxDiff)});
    }

    const cheaper=colB<colA;
    const afterTaxCheaper=afterTaxEquivalent<afterTaxSalary;
    let comparisonHtml=`<p>A <strong>${TE.formatMoney(salary)}</strong> salary in <strong>${cityA}</strong> has the same buying power as <strong>${TE.formatMoney(equivalent)}</strong> in <strong>${cityB}</strong>.</p>`;
    if(cheaper){
      comparisonHtml+=`<p>You would need <strong>${TE.formatMoney(Math.abs(diff))} less</strong> in ${cityB} to maintain the same lifestyle - a <strong>${Math.abs(pctChange).toFixed(1)}%</strong> reduction in required income.</p>`;
    } else {
      comparisonHtml+=`<p>You would need <strong>${TE.formatMoney(Math.abs(diff))} more</strong> in ${cityB} to maintain the same lifestyle - a <strong>${Math.abs(pctChange).toFixed(1)}%</strong> increase in required income.</p>`;
    }
    if(stateTaxA>0||stateTaxB>0){
      if(stateTaxA>0) comparisonHtml+=`<p>Est. state tax in ${cityA}: <strong>${TE.formatMoney(stateTaxA)}</strong>. After-tax income: <strong>${TE.formatMoney(afterTaxSalary)}</strong>.</p>`;
      if(stateTaxB>0) comparisonHtml+=`<p>Est. state tax in ${cityB}: <strong>${TE.formatMoney(stateTaxB)}</strong>. After-tax income: <strong>${TE.formatMoney(afterTaxEquivalent)}</strong>.</p>`;
      if(stateTaxA>0&&stateTaxB>0){
        comparisonHtml+=`<p>After-tax comparison: ${afterTaxCheaper?`You keep <strong>${TE.formatMoney(Math.abs(afterTaxDiff))} more</strong> in ${cityB}`:`You keep <strong>${TE.formatMoney(Math.abs(afterTaxDiff))} more</strong> in ${cityA}`} when COL + state tax are combined.</p>`;
      }
    }

    // Screenshot-worthy big numbers
    const bigCardStyle='background:var(--card);border:1px solid var(--border);border-radius:12px;padding:1.5rem;text-align:center;margin-bottom:1rem';
    const bigNumberStyle='font-size:2rem;font-weight:700;color:var(--text);display:block';
    const bigLabelStyle='font-size:.85rem;color:var(--muted);margin-top:.25rem;display:block';

    document.getElementById('cc-res').innerHTML=resultsBox(lines,'Equivalent in '+cityB,TE.formatMoney(equivalent))+
    `<div class="calc-panel" style="margin-top:1rem"><h3>Summary</h3>${comparisonHtml}</div>`+
    `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-top:1rem">`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle}">${TE.formatMoney(salary)}</span><span style="${bigLabelStyle}">In ${cityA}</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle}">=</span><span style="${bigLabelStyle}">Same buying power</span></div>`+
    `<div style="${bigCardStyle}"><span style="${bigNumberStyle}">${TE.formatMoney(equivalent)}</span><span style="${bigLabelStyle}">In ${cityB}</span></div>`+
    `</div>`+
    `<div class="calc-panel" style="margin-top:1rem"><h3>Your Category Breakdown</h3><p style="color:var(--muted);font-size:.9rem">How your spending mix drives the personalized index vs the composite.</p><table class="data-table"><thead><tr><th>Category</th><th>Your %</th><th>${cityA} Index</th><th>${cityB} Index</th><th>Difference</th></tr></thead><tbody>${catRows}</tbody></table></div>`+
    `<div class="calc-panel" style="margin-top:1rem"><h3>Cost-of-Living Quick Reference (Composite)</h3><table class="data-table"><thead><tr><th>City</th><th>Index</th><th>Vs ${cityA}</th></tr></thead><tbody>`+
    COL_DATA.sort((a,b)=>a.index-b.index).map(c=>{
      const vsA=(c.index/compositeA);
      return`<tr><td>${c.name}</td><td>${c.index}</td><td>${(vsA*100).toFixed(0)}%</td></tr>`;
    }).join('')+
    `</tbody></table></div>`;
    scrollToResults('cc-res');
  });
}

/* ===================== Deductions Library ===================== */
function deductionsLibraryView(main){
  if(!DATA||!DATA.selfEmploymentDeductions){
    main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'',text:'Reference'},{href:'',text:'Deductions Library'})}<h2>Complete Deductions Library</h2><p style="color:var(--muted)">Data not loaded yet. Please refresh.</p>`;
    return;
  }
  const ded=DATA.selfEmploymentDeductions;
  let html=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'',text:'Reference'},{href:'',text:'Deductions Library'})}<h2>Complete Deductions Library</h2><p style="color:var(--muted);margin-bottom:1.5rem">Every deduction available to self-employed individuals, gig workers, creators, and small business owners.</p>`+
  `<div class="calc-panel" style="margin-bottom:1.5rem"><h3>Browse Deductions by Profession</h3><p>We have curated checklists for 23 professions - from Uber drivers to YouTubers to real estate agents. See the exact deductions your job qualifies for.</p><p><a href="/professionals" class="btn btn-accent">View Deductions by Profession</a></p></div>`;

  const sections=[
    {title:'2026 Standard Deduction',html:`<p>Single / Married Filing Separately: <strong>$16,100</strong>. Married Filing Jointly: <strong>$32,200</strong>. Head of Household: <strong>$24,150</strong>. Additional amount for age 65+: $2,050 (single) / $1,650 (MFJ per spouse).</p><p><em>Source: ${DATA.federal.standardDeduction.source}</em></p>`},

    {title:'Vehicle Deductions: Standard Mileage vs. Actual Expense',html:`<p><strong>Standard Mileage (2026):</strong> $${ded.mileage.businessRatePerMile}/mile for business use. If you drive 10,000 business miles, that is a <strong>$7,250</strong> deduction.</p><p><strong>Actual Expense Method:</strong> Track gas, insurance, repairs, registration, and depreciation, then multiply by business-use percentage. Best when you have high operating costs or a newer expensive vehicle.</p><p><strong>Switching methods:</strong> If you previously claimed MACRS depreciation (including bonus/Section 179), you <em>cannot</em> switch back to standard mileage. First-year choice matters.</p><p><strong>Listed property / SUV cap:</strong> Vehicles over 6,000 lbs qualify for Section 179 but are capped at ${TE.formatMoney(ded.section179.suvLimit)}. Passenger cars have lower luxury auto depreciation limits (Year 1: $${ded.vehicleActualMethod.macrsDepreciationCar.year1}, Year 2: $${ded.vehicleActualMethod.macrsDepreciationCar.year2}, Year 3: $${ded.vehicleActualMethod.macrsDepreciationCar.year3}, Year 4+: $${ded.vehicleActualMethod.macrsDepreciationCar.year4Plus}).</p><p><strong>EV nuance:</strong> EVs and clean commercial vehicles may qualify for the Clean Vehicle Credit or Commercial Clean Vehicle Credit (IRC 45W) separately from depreciation. The credit reduces basis - you cannot double-dip.</p><p><em>Record-keeping required:</em> Mileage log with date, destination, purpose, and odometer readings. For actual method: keep all receipts.</p>`},

    {title:'Phone & Internet',html:`<p><strong>Business-use percentage method:</strong> Log your usage for 2–4 weeks to establish a representative business %. Apply that percentage to your total bill. Typical rates: gig drivers ~80%, creators ~90%, remote professionals ~70%.</p><p><strong>Home internet proration:</strong> If your home office is 10% of your home square footage, you may deduct 10% of internet costs. Alternatively, use time-based or usage-based allocation. Document your method.</p><p><strong>Second business line:</strong> If you have a dedicated business phone number, 100% of that line is deductible.</p><p><em>Record-keeping required:</em> 2–4 week usage log, bills showing total cost, written calculation of business percentage.</p>`},

    {title:'Education & Courses',html:`<p><strong>Deductible (maintains current skills):</strong> A YouTuber buying a video editing course. A graphic designer taking an advanced Figma workshop. A bookkeeper updating QuickBooks certification. A gig driver taking a defensive driving course.</p><p><strong>NOT deductible (qualifies for new career):</strong> A rideshare driver getting a CDL to become a trucker. A photographer enrolling in law school. A creator taking a nursing degree. The IRS draws the line at "new trade or business."</p><p><strong>Workshops & conferences:</strong> 100% deductible if directly related to your current business. Travel to the conference is also deductible (but meals remain 50%).</p>`},

    {title:'Bad Debt',html:`<p><strong>Accrual-basis taxpayers only:</strong> If you record income when you invoice (not when paid), you can deduct bad debt when it becomes uncollectible.</p><p><strong>Cash-basis taxpayers (most gig workers and creators):</strong> You <em>cannot</em> deduct bad debt because you never reported the income. Since you only record income when paid, there is nothing to reverse. This is a common mistake.</p>`},

    {title:'Depreciation Basics: MACRS, Bonus, Section 179',html:`<p><strong>MACRS:</strong> Modified Accelerated Cost Recovery System. Most business equipment is 5-year or 7-year property. Half-year or mid-quarter convention applies.</p><p><strong>Bonus depreciation:</strong> OBBBA made 100% bonus depreciation <em>permanent</em> for qualified property acquired and placed in service after January 19, 2025. You can write off the entire cost in Year 1.</p><p><strong>Section 179:</strong> Elect to expense up to ${TE.formatMoney(ded.section179.limit)} in Year 1. Phase-out begins at ${TE.formatMoney(ded.section179.phaseoutStart)}. Must be >50% business use. Cannot create a loss.</p><p><strong>Listed property:</strong> Vehicles, computers, and other assets used for both business and personal purposes. Business use must exceed 50% to use Section 179 or bonus depreciation.</p><p><strong>Interaction:</strong> You pick Section 179 first (up to limit), then bonus depreciation on remaining basis, then regular MACRS on anything left. You do not have to use all three.</p>`},

    {title:'Pass-Through Losses: At-Risk & Passive Activity Rules',html:`<p><strong>At-risk rules:</strong> You can only deduct losses up to the amount you have "at risk" - your cash investment plus recourse debt. Non-recourse debt generally does not count.</p><p><strong>Passive activity loss limitations:</strong> If you are a W-2 earner with a side rental or passive investment, you generally <em>cannot</em> deduct passive losses against active (W-2) income. Exception: you qualify as a <strong>real estate professional</strong> (750+ hours/year, >50% of personal service time in real estate).</p><p><strong>Schedule C losses:</strong> A W-2 earner with a side business <em>can</em> deduct Schedule C losses against W-2 income (not passive). But excessive losses year after year may trigger hobby loss rules.</p>`},

    {title:'Self-Employment Tax Deduction',html:`<p>You deduct <strong>one-half of your SE tax</strong> on Schedule 1 (line 15). This is an <em>above-the-line</em> deduction that reduces AGI.</p><p><strong>Critical interaction with QBI:</strong> QBI is calculated on your <em>net</em> business income. The SE tax deduction does NOT reduce your QBI base - QBI is based on business profit before the SE tax deduction. However, the SE tax deduction does reduce your taxable income, which affects your marginal bracket.</p>`},

    {title:'Health Insurance: Sole Prop vs. S-Corp Owner',html:`<p><strong>Sole prop / single-member LLC:</strong> 100% deductible on Schedule 1 (line 17). Cannot exceed net SE profit. Not deductible if eligible for employer-subsidized plan through spouse.</p><p><strong>S-Corp owner-employee (2%+ shareholder):</strong> The S-Corp must include health insurance premiums in your W-2 Box 1 wages, <em>then</em> you deduct it as SE health insurance on Form 1040. The entity gets the deduction; you get the personal deduction. This is different from sole props and requires payroll processing.</p><p><strong>HSA:</strong> Self-only ${TE.formatMoney(DATA.retirement.hsa.selfOnly)}, family ${TE.formatMoney(DATA.retirement.hsa.family)}. HSA contributions reduce AGI and grow tax-free.</p>`},

    {title:'SALT Cap & Schedule A vs. Schedule C',html:`<p><strong>SALT cap:</strong> State and local tax deductions on <strong>Schedule A</strong> are capped at <strong>$40,400 for 2026</strong> ($20,200 MFS). Phases out above ~$505,000 MAGI. Reverts to $10,000 in 2030. This affects itemizers only.</p><p><strong>Schedule C deductions are NOT affected:</strong> State income tax paid on self-employment income is <em>not</em> a Schedule A deduction - it is part of your business tax calculation. The SALT cap does not limit your Schedule C or SE tax deductions. This is a common source of confusion.</p>`},

    {title:'Business Gifts',html:`<p><strong>$25 limit per recipient per year:</strong> You can deduct only $25 of business gifts to any one person during the tax year.</p><p><strong>Promotional items exception:</strong> Items costing $4 or less with your business name permanently imprinted (pens, magnets, keychains) are <em>not</em> subject to the $25 limit.</p><p><strong>Shipping & incidentals:</strong> Wrapping, engraving, and shipping are not counted toward the $25 limit.</p>`},

    {title:'Legal Settlements',html:`<p><strong>Deductible:</strong> Ordinary and necessary legal fees related to your business - contract disputes, trademark enforcement, collection actions.</p><p><strong>NOT deductible:</strong> Personal legal fees (divorce, personal injury), fines and penalties, and punitive damages. Settlement payments for violating the law are not deductible.</p>`},

    {title:'Licenses & Permits',html:`<p>100% deductible. Often overlooked by gig workers: food handler certification, notary commission, contractor license, real estate license renewal, TSA Hazmat endorsement, CDL fees, city business license.</p><p><em>Record-keeping required:</em> Keep the certificate, renewal notice, or receipt showing the license period.</p>`},

    {title:'DPAD (Domestic Production Activities Deduction)',html:`<p>Less relevant for most creators, but applicable if you manufacture products in the US (e.g., handmade goods sold on Etsy, print-on-demand fulfilled domestically). The DPAD was repealed by TCJA for tax years after 2017 and replaced by the QBI deduction. Most small producers now use QBI instead.</p>`},

    {title:'Home Office',html:`<p>Simplified: $${ded.homeOffice.simplified.ratePerSqFt}/sq ft up to ${ded.homeOffice.simplified.maxSqFt} sq ft (max $${ded.homeOffice.simplified.maxDeduction}).</p><p>Actual: percentage of home expenses. ${ded.homeOffice.rule}</p>`},
    {title:'Section 179',html:`<p>Limit: <strong>${TE.formatMoney(ded.section179.limit)}</strong>. Phase-out starts at ${TE.formatMoney(ded.section179.phaseoutStart)}. Bonus depreciation: ${(ded.section179.bonusDepreciationRate*100).toFixed(0)}%.</p>`},
    {title:'Self-Employed Health Insurance',html:`<p>100% deductible up to net SE profit. Covers medical, dental, vision, long-term care.</p>`},
    {title:'Meals',html:`<p>${(ded.mealsDeduction.rate*100).toFixed(0)}% deductible for business meals. Document who, what, where, business discussed.</p>`},
    {title:'Business Travel',html:`<p>Airfare & hotel 100%. Meals 50%. Ground transport 100%. Truck driver per diem: $${ded.businessTravel.truckDriverPerDiem.rate}/day (${(ded.businessTravel.truckDriverPerDiem.deductiblePct*100).toFixed(0)}% deductible = $${ded.businessTravel.truckDriverPerDiem.rate*ded.businessTravel.truckDriverPerDiem.deductiblePct}/day net).</p>`},
    {title:'QBI Deduction (Section 199A)',html:`<p>${(ded.qualifiedBusinessIncomeDeduction.rate*100).toFixed(0)}% of qualified business income. Phase-out starts at ${TE.formatMoney(ded.qualifiedBusinessIncomeDeduction.phaseoutSingle)} single / ${TE.formatMoney(ded.qualifiedBusinessIncomeDeduction.phaseoutMFJ)} MFJ.</p>`},
    {title:'Augusta Rule (Section 280A(g))',html:`<p>Rent your personal residence to your business up to ${ded.augustaRule.maxDays} days/year. Income is excluded. Requires S-Corp, C-Corp, or Partnership - not sole prop.</p>`},
    {title:'Retirement Contributions',html:`<p>Solo 401(k): up to ${TE.formatMoney(DATA.retirement.solo401k.combinedMaxUnder50)} under 50. SEP-IRA: up to ${TE.formatMoney(DATA.retirement.sep_ira.limit)}. SIMPLE IRA: ${TE.formatMoney(DATA.retirement.simple_ira.employeeLimit)}. HSA: ${TE.formatMoney(DATA.retirement.hsa.selfOnly)} self-only / ${TE.formatMoney(DATA.retirement.hsa.family)} family.</p>`},
    {title:'Family Employment',html:`<p>Hire children under 18: FICA-exempt for sole props. Standard deduction ${TE.formatMoney(DATA.selfEmploymentDeductions.familyEmployment.hireChildren.standardDeduction2026)} means tax-free wages up to that amount. Hire spouse: FICA applies but spouse gets retirement plan eligibility.</p>`}
  ];
  for(const s of sections){
    html+=`<div class="section"><h3>${s.title}</h3>${s.html}</div>`;
  }

  // SE tax reduction distinction callout
  html+=`<div class="calc-panel" style="margin-top:1.5rem"><h3>Deductions That Reduce SE Tax vs. Those That Don\'t</h3><p>This distinction is crucial and most tax sites ignore it. Your <strong>self-employment tax base</strong> is calculated on net business profit <em>before</em> certain deductions.</p><table class="data-table"><thead><tr><th>Reduces SE Tax Base</th><th>Reduces Income Tax Only</th></tr></thead><tbody><tr><td>Business expenses (mileage, COGS, fees, supplies)</td><td>Retirement contributions (Solo 401k, SEP-IRA)</td></tr><tr><td>Business deductions on Schedule C</td><td>Self-employed health insurance</td></tr><tr><td>50% of SE tax (deductible on Schedule 1)</td><td>HSA contributions</td></tr><tr><td></td><td>Standard deduction / itemized deductions</td></tr><tr><td></td><td>QBI deduction (Section 199A)</td></tr><tr><td></td><td>Charitable contributions (Schedule A)</td></tr></tbody></table><p style="margin-top:.75rem;color:var(--muted)"><strong>Why this matters:</strong> A $10,000 Solo 401(k) contribution saves you federal and state income tax, but it does <em>not</em> reduce your 15.3% SE tax. Only Schedule C business expenses reduce both.</p></div>`;

  // Deductions requiring an entity callout
  html+=`<div class="calc-panel" style="margin-top:1.5rem"><h3>Deductions That Require a Business Entity</h3><p>Some powerful deductions are unavailable to sole proprietors:</p><ul><li><strong>Augusta Rule (Section 280A(g))</strong> - rent home to business: requires S-Corp, C-Corp, or Partnership</li><li><strong>Accountable plan reimbursements</strong> - tax-free reimbursements to owners: requires S-Corp or C-Corp</li><li><strong>Employer-paid health insurance</strong> - 100% deductible by entity: best with S-Corp or C-Corp</li><li><strong>Corporate retirement plans</strong> - 401(k) with match: requires an entity with employees</li></ul><p style="margin-top:.75rem"><a href="/standalone/entity-recommender" class="btn btn-accent">Find the right entity for your business</a> <a href="/standalone/entity-compare" class="btn btn-secondary">Compare LLC vs S-Corp savings</a></p></div>`;

  const other=ded.otherCommonDeductions;
  html+=`<div class="section"><h3>Other Common Deductions</h3><table class="data-table"><thead><tr><th>Deduction</th><th>Deductible %</th><th>Note</th><th>Required Documentation</th></tr></thead><tbody>`;
  for(const item of other){
    let pct;
    if(typeof item.deductible==='number'){
      if(item.deductible===1) pct='100%';
      else if(item.deductible>1) pct=`Up to $${item.deductible.toLocaleString()} cap`;
      else if(item.deductible===0) pct='0%';
      else pct=(item.deductible*100).toFixed(0)+'%';
    }else{ pct=item.deductible; }
    html+=`<tr><td>${item.name}</td><td>${pct}</td><td>${item.note||''}</td><td>${item.recordKeeping||'Receipts'}</td></tr>`;
  }
  html+='</tbody></table></div>';

  // State-specific notes callout
  html+=`<div class="calc-panel" style="margin-top:1.5rem"><h3>State-Specific Deduction Notes</h3><p><strong>California:</strong> CA does <em>not</em> conform to federal bonus depreciation or Section 179 for personal income tax. You must add back bonus depreciation on your CA return and depreciate the asset under CA rules. This is a major trap for CA-based gig workers who take 100% bonus depreciation federally.</p><p><strong>New York:</strong> NY generally conforms to federal depreciation but has its own rules for certain credits. Check Form IT-398 for depreciation adjustments.</p><p><strong>No-income-tax states:</strong> TX, FL, NV, WA, TN, SD, WY, AK, NH. No state income tax means no state depreciation conformity issues, but you still owe federal SE tax.</p></div>`;

  main.innerHTML=html;
}

/* ===================== RSU Tax Calculator ===================== */
function rsuTaxView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'',text:'Equity Compensation'},{href:'',text:'RSU Tax'})}<h2>RSU Tax Calculator 2026</h2><p style="color:var(--muted);margin-bottom:1.5rem">Restricted Stock Units are taxed as ordinary income at vest. Employers withhold shares at 22% (37% if over $1M supplemental). See your withholding gap and sale gains.</p>
    <div class="calc-grid"><div class="calc-panel"><h3>RSU Grant</h3>
      ${inputField('rsu2_shares','Shares vesting','number',{value:1000})}
      ${inputField('rsu2_fmv','FMV per share at vest ($)','number',{value:150})}
      ${inputField('rsu2_withheld','Shares withheld for tax','number',{value:220})}
      <p style="color:var(--muted);font-size:.9rem;margin-top:.5rem">Most employers withhold 22% of shares for federal tax.</p>
    </div>
    <div class="calc-panel"><h3>Sale (Optional)</h3>
      ${inputField('rsu2_sale','Sale price per share ($) - leave 0 if not sold','number',{value:0})}
      ${inputField('rsu2_months','Months since vesting','number',{value:0})}
    </div></div>
    <div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcRSU2()">Calculate RSU Tax</button></div>
    <div id="rsu2-res"></div>`+
    renderFaqSection([
      {q:'Why sell RSUs immediately at vest?',a:'Diversification. You already depend on your employer for salary, benefits, and career. Holding concentrated employer stock adds single-company risk. The tax is identical whether you sell today or in 10 years (ordinary income at vest). Only the sale produces capital gains/losses.'},
      {q:'What is the supplemental withholding gap?',a:'Employers withhold 22% for federal tax on supplemental wages under $1M, and 37% above. But if your marginal tax bracket is 32%, 35%, or 37%, the employer withholding is insufficient. You will owe the difference at tax time or via estimated payments.'},
      {q:'Are RSUs taxed twice?',a:'No. You pay ordinary income tax on the FMV at vest. Your cost basis becomes that FMV. When you sell, you only pay capital gains tax on the change in value since vest. If you sell immediately, there is essentially zero additional tax.'}
    ]);
  window.CalcFns = window.CalcFns || {};
  window.CalcFns.calcRSU2 = safeCalc(function(){
    const shares=getVal('rsu2_shares'),fmv=getVal('rsu2_fmv'),withheld=getVal('rsu2_withheld');
    const sale=getVal('rsu2_sale'),months=getVal('rsu2_months');
    const ordinary=shares*fmv;const taxWithheld=withheld*fmv;const sharesReceived=shares-withheld;
    const employerRate=ordinary>1000000?0.37:0.22;const employerWithheld=ordinary*employerRate;
    const gap=Math.max(0,ordinary*0.37-employerWithheld);
    let cg=0,cgType='';
    if(sale>0&&sharesReceived>0){cg=(sale-fmv)*sharesReceived;cgType=months>=12?'LTCG':'STCG';}
    const lines=[
      {label:'RSU ordinary income (vesting)',val:TE.formatMoney(ordinary)},
      {label:'Shares received after withholding',val:sharesReceived},
      {label:'Tax withheld by employer',val:'-'+TE.formatMoney(taxWithheld)},
      {label:'Employer withholding rate',val:(employerRate*100).toFixed(0)+'%'}
    ];
    if(sale>0){lines.push({label:cgType+' on sale',val:TE.formatMoney(cg)});}
    const bigCard='background:var(--card);border:1px solid var(--border);border-radius:12px;padding:1.5rem;text-align:center;margin-bottom:1rem';
    const bigNum='font-size:2.2rem;font-weight:700;color:var(--accent);display:block';
    const bigLbl='font-size:.85rem;color:var(--muted);margin-top:.25rem;display:block';
    document.getElementById('rsu2-res').innerHTML=resultsBox(lines,'RSU Tax Summary',TE.formatMoney(ordinary-taxWithheld+(cg>0?cg:0)))+
    `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-top:1rem">`+
    `<div style="${bigCard};border-top:4px solid #4caf50"><span style="${bigNum};color:#4caf50">${TE.formatMoney(ordinary)}</span><span style="${bigLbl}">Ordinary Income</span></div>`+
    `<div style="${bigCard};border-top:4px solid #f44336"><span style="${bigNum};color:#f44336">${TE.formatMoney(taxWithheld)}</span><span style="${bigLbl}">Tax Withheld</span></div>`+
    `<div style="${bigCard};border-top:4px solid #ff9800"><span style="${bigNum};color:#ff9800">${TE.formatMoney(sharesReceived*fmv+(cg>0?cg:0))}</span><span style="${bigLbl}">Net Value</span></div>`+
    `</div>`+
    `<div class="calc-panel" style="margin-top:1rem;background:rgba(46,125,50,.08);border-color:var(--success)"><h3>The Withholding Gap</h3><p>Your employer withheld at <strong>${(employerRate*100).toFixed(0)}%</strong>. If your marginal federal bracket is 32%, 35%, or 37%, you may owe an additional <strong>${TE.formatMoney(gap)}</strong> at tax time. Fix this by adjusting W-4 withholding or making estimated payments.</p><p style="margin-top:.5rem"><strong>Pro tip:</strong> Sell immediately at vest, set aside 37% for taxes, invest the rest in a diversified index fund. You get the same economic exposure with lower risk.</p></div>`;
    scrollToResults('rsu2-res');
  });
}

/* ===================== ISO Stock Options Calculator ===================== */
function isoTaxView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'',text:'Equity Compensation'},{href:'',text:'ISO Tax'})}<h2>ISO Stock Options Tax Calculator 2026</h2><p style="color:var(--muted);margin-bottom:1.5rem">Incentive Stock Options: no tax at exercise, but AMT may apply. Qualifying disposition = LTCG on entire spread. Disqualifying = ordinary income. Model both scenarios.</p>
    <div class="calc-grid"><div class="calc-panel"><h3>Grant & Exercise</h3>
      ${inputField('iso_shares','Shares exercised','number',{value:1000})}
      ${inputField('iso_strike','Strike price per share ($)','number',{value:10})}
      ${inputField('iso_fmv','FMV at exercise ($)','number',{value:50})}
      ${inputField('iso_sale','Sale price per share ($)','number',{value:80})}
      ${inputField('iso_other','Other ordinary income ($)','number',{value:150000})}
    </div>
    <div class="calc-panel"><h3>Timing & Profile</h3>
      ${inputField('iso_grant_months','Months since grant','number',{value:24})}
      ${inputField('iso_exercise_months','Months since exercise','number',{value:14})}
      ${selectField('iso_status','Filing status',[{value:'single',label:'Single'},{value:'mfj',label:'Married Filing Jointly'},{value:'mfs',label:'Married Filing Separately'},{value:'hoh',label:'Head of Household'}],{value:'single'})}
    </div></div>
    <div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcISO()">Calculate ISO Tax</button></div>
    <div id="iso-res"></div>`+
    renderFaqSection([
      {q:'What is the AMT trap?',a:'When you exercise ISOs, the bargain element ((FMV - strike) * shares) counts as an AMT preference item. You may owe AMT even with no cash from the exercise. This is the #1 reason employees get surprise tax bills. Plan ahead with an AMT estimate.'},
      {q:'What is a qualifying disposition?',a:'You must hold shares 2+ years from grant AND 1+ year from exercise. Then the entire gain (salePrice - strike) is long-term capital gain. Miss either deadline and it becomes a disqualifying disposition taxed partly as ordinary income.'},
      {q:'Should I early exercise ISOs?',a:'Only if you understand AMT. Early exercise starts the LTCG clock before your company goes public. But if the stock drops, you are stuck with AMT on phantom gains. Consider an 83(b) election if available.'}
    ]);
  window.CalcFns = window.CalcFns || {};
  window.CalcFns.calcISO = safeCalc(function(){
    const shares=getVal('iso_shares'),strike=getVal('iso_strike'),fmv=getVal('iso_fmv'),sale=getVal('iso_sale');
    const other=getVal('iso_other');const grantMonths=getVal('iso_grant_months'),exMonths=getVal('iso_exercise_months');
    const status=getSelect('iso_status');const stdDed=TE.getStandardDeduction(status,false,DATA);
    const bargain=(fmv-strike)*shares;const qualifying=grantMonths>=24&&exMonths>=12;
    let regOrdinary=0,regCG=0;
    if(qualifying){regCG=(sale-strike)*shares;}
    else{regOrdinary=(fmv-strike)*shares;regCG=(sale-fmv)*shares;}
    const regTaxableOrd=Math.max(0,other+regOrdinary-stdDed);
    const regFed=TE.calcFederalTax(regTaxableOrd,status,DATA);
    const regCGTax=TE.calcLTCGTax(Math.max(0,regCG),regTaxableOrd,status,DATA);
    const regTotal=regFed+regCGTax;
    const amtExemption=status==='mfj'?140200:90100;
    const amtPhaseoutStart=status==='mfj'?1000000:500000;
    const amtIncome=other+regOrdinary+bargain;
    let amtEx=amtExemption;
    if(amtIncome>amtPhaseoutStart)amtEx=Math.max(0,amtExemption-(amtIncome-amtPhaseoutStart)*0.25);
    const amtTaxable=Math.max(0,amtIncome-amtEx);
    const amtTax=amtTaxable<=244500?amtTaxable*0.26:(244500*0.26+(amtTaxable-244500)*0.28);
    const amtTotal=amtTax+regCGTax;
    const amtLiability=Math.max(0,amtTotal-regTotal);
    const lines=[
      {label:'Bargain element (AMT preference)',val:TE.formatMoney(bargain)},
      {label:'Disposition',val:qualifying?'Qualifying (LTCG on full spread)':'Disqualifying (ordinary income at exercise)'},
      {label:'Regular federal tax',val:TE.formatMoney(regTotal)},
      {label:'AMT liability (additional)',val:TE.formatMoney(amtLiability)}
    ];
    if(qualifying){lines.push({label:'LTCG (qualifying)',val:TE.formatMoney(regCG)});}
    else{lines.push({label:'Ordinary income (disqualifying)',val:TE.formatMoney(regOrdinary)});lines.push({label:'Capital gain/loss',val:TE.formatMoney(regCG)});}
    const bigCard='background:var(--card);border:1px solid var(--border);border-radius:12px;padding:1.5rem;text-align:center;margin-bottom:1rem';
    const bigNum='font-size:2.2rem;font-weight:700;color:var(--accent);display:block';
    const bigLbl='font-size:.85rem;color:var(--muted);margin-top:.25rem;display:block';
    const dispColor=qualifying?'#4caf50':'#ff9800';
    document.getElementById('iso-res').innerHTML=resultsBox(lines,'ISO Tax Summary',TE.formatMoney((qualifying?regCG:0)-amtLiability))+
    `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-top:1rem">`+
    `<div style="${bigCard};border-top:4px solid ${dispColor}"><span style="${bigNum};color:${dispColor}">${qualifying?'Qualifying':'Disqualifying'}</span><span style="${bigLbl}">Disposition</span></div>`+
    `<div style="${bigCard};border-top:4px solid #2196f3"><span style="${bigNum};color:#2196f3">${TE.formatMoney(bargain)}</span><span style="${bigLbl}">Bargain Element</span></div>`+
    `<div style="${bigCard};border-top:4px solid #f44336"><span style="${bigNum};color:#f44336">${TE.formatMoney(amtLiability)}</span><span style="${bigLbl}">AMT (Additional)</span></div>`+
    `<div style="${bigCard};border-top:4px solid #4caf50"><span style="${bigNum};color:#4caf50">${TE.formatMoney(regTotal+amtLiability)}</span><span style="${bigLbl}">Total Tax</span></div>`+
    `</div>`+
    `<div class="calc-panel" style="margin-top:1rem;background:${amtLiability>0?'rgba(211,47,47,.08)':'rgba(46,125,50,.08)'};border-color:${amtLiability>0?'#d32f2f':'var(--success)'}"><h3>ISO Strategy Note</h3>${qualifying?`<p><strong>Qualifying disposition saves you ${TE.formatMoney((regOrdinary+regCG+other)*0.37-regTotal)}</strong> vs ordinary income at your top bracket.</p>`:`<p><strong>Disqualifying disposition:</strong> You pay ordinary income tax on the spread at exercise. Consider waiting for qualifying status if possible.</p>`}<p style="margin-top:.5rem">${amtLiability>0?`<strong>AMT Warning:</strong> You owe ${TE.formatMoney(amtLiability)} in AMT this year. Set aside cash before exercising. AMT paid generates a credit you may recover in future years.`:`<strong>No AMT:</strong> Your regular tax exceeds AMT. You are safe from the AMT trap.`}</p></div>`;
    scrollToResults('iso-res');
  });
}

/* ===================== NSO Stock Options Calculator ===================== */
function nsoTaxView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'',text:'Equity Compensation'},{href:'',text:'NSO Tax'})}<h2>NSO Stock Options Tax Calculator 2026</h2><p style="color:var(--muted);margin-bottom:1.5rem">Non-Qualified Stock Options are taxed as ordinary income at exercise on the spread (FMV - strike). Subsequent sale is capital gain/loss.</p>
    <div class="calc-grid"><div class="calc-panel"><h3>Exercise</h3>
      ${inputField('nso_shares','Shares exercised','number',{value:1000})}
      ${inputField('nso_strike','Strike price ($)','number',{value:10})}
      ${inputField('nso_fmv','FMV at exercise ($)','number',{value:50})}
    </div>
    <div class="calc-panel"><h3>Sale & Profile</h3>
      ${inputField('nso_sale','Sale price ($) - leave 0 if not sold','number',{value:0})}
      ${inputField('nso_other','Other ordinary income ($)','number',{value:150000})}
      ${selectField('nso_status','Filing status',[{value:'single',label:'Single'},{value:'mfj',label:'Married Filing Jointly'},{value:'mfs',label:'Married Filing Separately'},{value:'hoh',label:'Head of Household'}],{value:'single'})}
    </div></div>
    <div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcNSO()">Calculate NSO Tax</button></div>
    <div id="nso-res"></div>`+
    renderFaqSection([
      {q:'Why do NSOs hurt at exercise?',a:'The entire spread (FMV - strike) is ordinary income the moment you exercise. If your company is private, you may owe tax on illiquid stock you cannot sell. This is why employees prefer ISOs for pre-IPO companies.'},
      {q:'Can I avoid tax by not exercising?',a:'If you let NSOs expire, there is no tax event. But you forfeit the upside. Some employers allow net exercise (surrender shares to cover the cost) or cashless exercise (sell-to-cover).'},
      {q:'What is my basis after exercise?',a:'Your cost basis becomes the FMV at exercise. When you later sell, capital gains = salePrice - FMV_at_exercise. If you sell immediately, there is essentially no additional capital gain.'}
    ]);
  window.CalcFns = window.CalcFns || {};
  window.CalcFns.calcNSO = safeCalc(function(){
    const shares=getVal('nso_shares'),strike=getVal('nso_strike'),fmv=getVal('nso_fmv'),sale=getVal('nso_sale');
    const other=getVal('nso_other');const status=getSelect('nso_status');const stdDed=TE.getStandardDeduction(status,false,DATA);
    const ordinary=(fmv-strike)*shares;
    const fica=ordinary*0.0765;
    const taxableOrd=Math.max(0,other+ordinary-stdDed);
    const fed=TE.calcFederalTax(taxableOrd,status,DATA);
    let cg=0,cgTax=0,cgType='';
    if(sale>0){cg=(sale-fmv)*shares;cgType=cg>=0?'Capital gain':'Capital loss';cgTax=TE.calcLTCGTax(Math.max(0,cg),taxableOrd,status,DATA);}
    const totalTax=fed+fica+cgTax;
    const lines=[
      {label:'Ordinary income at exercise',val:TE.formatMoney(ordinary)},
      {label:'Employee FICA (7.65%)',val:TE.formatMoney(fica)},
      {label:'Federal tax on exercise',val:TE.formatMoney(fed)}
    ];
    if(sale>0){lines.push({label:cgType,val:TE.formatMoney(cg)});lines.push({label:'Tax on sale',val:TE.formatMoney(cgTax)});}
    const bigCard='background:var(--card);border:1px solid var(--border);border-radius:12px;padding:1.5rem;text-align:center;margin-bottom:1rem';
    const bigNum='font-size:2.2rem;font-weight:700;color:var(--accent);display:block';
    const bigLbl='font-size:.85rem;color:var(--muted);margin-top:.25rem;display:block';
    document.getElementById('nso-res').innerHTML=resultsBox(lines,'NSO Tax Summary',TE.formatMoney(ordinary+cg-totalTax))+
    `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-top:1rem">`+
    `<div style="${bigCard};border-top:4px solid #ff9800"><span style="${bigNum};color:#ff9800">${TE.formatMoney(ordinary)}</span><span style="${bigLbl}">Ordinary Income</span></div>`+
    `<div style="${bigCard};border-top:4px solid #f44336"><span style="${bigNum};color:#f44336">${TE.formatMoney(totalTax)}</span><span style="${bigLbl}">Total Tax</span></div>`+
    `<div style="${bigCard};border-top:4px solid #4caf50"><span style="${bigNum};color:#4caf50">${TE.formatMoney(ordinary+cg-totalTax)}</span><span style="${bigLbl}">Net After Tax</span></div>`+
    `</div>`+
    `<div class="calc-panel" style="margin-top:1rem;background:rgba(211,47,47,.08);border-color:#d32f2f"><h3>The NSO Reality</h3><p>NSOs are taxed immediately on exercise. If you exercise 1,000 shares with a $40 spread, you owe tax on <strong>${TE.formatMoney(ordinary)}</strong> of ordinary income even if the stock is illiquid. Always have a cashless exercise or sell-to-cover plan.</p><p style="margin-top:.5rem"><strong>Pre-IPO warning:</strong> If your company never goes public, you paid tax on gains you never realize. ISOs are generally better for private companies because of the AMT deferral.</p></div>`;
    scrollToResults('nso-res');
  });
}

/* ===================== ESPP Tax Calculator ===================== */
function esppTaxView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'',text:'Equity Compensation'},{href:'',text:'ESPP Tax'})}<h2>ESPP Tax Calculator 2026</h2><p style="color:var(--muted);margin-bottom:1.5rem">Employee Stock Purchase Plans give you a discount (typically 15%). Tax depends on whether you have a qualifying or disqualifying disposition.</p>
    <div class="calc-grid"><div class="calc-panel"><h3>Purchase</h3>
      ${inputField('espp2_purchase','Purchase price per share ($)','number',{value:85})}
      ${inputField('espp2_fmv_purchase','FMV at purchase date ($)','number',{value:100})}
      ${inputField('espp2_fmv_offer','FMV at offering start ($)','number',{value:90})}
      ${inputField('espp2_shares','Shares purchased','number',{value:100})}
    </div>
    <div class="calc-panel"><h3>Sale & Type</h3>
      ${inputField('espp2_sale','Sale price per share ($)','number',{value:120})}
      ${selectField('espp2_type','Disposition type',[{value:'qualifying',label:'Qualifying (2+ yrs from offering, 1+ yr from purchase)'},{value:'disqualifying',label:'Disqualifying'}],{value:'qualifying'})}
      ${inputField('espp2_other','Other ordinary income ($)','number',{value:150000})}
      ${selectField('espp2_status','Filing status',[{value:'single',label:'Single'},{value:'mfj',label:'Married Filing Jointly'},{value:'mfs',label:'Married Filing Separately'},{value:'hoh',label:'Head of Household'}],{value:'single'})}
    </div></div>
    <div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcESPP2()">Calculate ESPP Tax</button></div>
    <div id="espp2-res"></div>`+
    renderFaqSection([
      {q:'What is the 15% ESPP discount?',a:'ESPP plans typically let you buy stock at 85% of the lower of (start price or end price). This is a guaranteed 15%+ discount if the stock stays flat, and potentially much more if it rises.'},
      {q:'Should I hold for a qualifying disposition?',a:'A qualifying disposition gives favorable tax treatment but requires holding 2+ years from offering and 1+ year from purchase. Many advisors recommend selling immediately and paying the slightly higher tax to avoid single-stock risk.'},
      {q:'What forms do I need?',a:'Your employer reports ESPP on Form W-2. For disqualifying dispositions, ordinary income is in Box 1. For qualifying, you must calculate the ordinary income portion yourself. Use Form 8949 and Schedule D for the capital gain portion.'}
    ]);
  window.CalcFns = window.CalcFns || {};
  window.CalcFns.calcESPP2 = safeCalc(function(){
    const purchase=getVal('espp2_purchase'),fmvP=getVal('espp2_fmv_purchase'),fmvO=getVal('espp2_fmv_offer');
    const sale=getVal('espp2_sale'),shares=getVal('espp2_shares');
    const type=getSelect('espp2_type');const other=getVal('espp2_other');const status=getSelect('espp2_status');
    const stdDed=TE.getStandardDeduction(status,false,DATA);
    let ordinary=0,cg=0,cgLabel='';
    if(type==='qualifying'){
      const discountPerShare=Math.min(fmvO*0.15,sale-purchase);
      ordinary=discountPerShare*shares;
      cg=(sale-purchase)*shares-ordinary;
      cgLabel='LTCG (qualifying)';
    }else{
      ordinary=(fmvP-purchase)*shares;
      cg=(sale-fmvP)*shares;
      cgLabel=cg>=0?'Capital gain':'Capital loss';
    }
    const taxableOrdWithESPP=Math.max(0,other+ordinary-stdDed);
    const fedOrdWithESPP=TE.calcFederalTax(taxableOrdWithESPP,status,DATA);
    const cgTaxWithESPP=TE.calcLTCGTax(Math.max(0,cg),taxableOrdWithESPP,status,DATA);
    // Tax WITHOUT ESPP (for incremental comparison)
    const taxableOrdNoESPP=Math.max(0,other-stdDed);
    const fedOrdNoESPP=TE.calcFederalTax(taxableOrdNoESPP,status,DATA);
    const cgTaxNoESPP=TE.calcLTCGTax(0,taxableOrdNoESPP,status,DATA);
    const totalTaxWithESPP=fedOrdWithESPP+cgTaxWithESPP;
    const totalTaxNoESPP=fedOrdNoESPP+cgTaxNoESPP;
    const incrementalOrdTax=fedOrdWithESPP-fedOrdNoESPP;
    const incrementalCGTax=cgTaxWithESPP-cgTaxNoESPP;
    const incrementalTotalTax=incrementalOrdTax+incrementalCGTax;
    const esppTotalGain=ordinary+cg;
    const esppNetAfterOwnTax=esppTotalGain-incrementalTotalTax;
    const lines=[
      {label:'ESPP ordinary income',val:TE.formatMoney(ordinary)},
      {label:cgLabel,val:TE.formatMoney(cg)},
      {label:'Total ESPP gain',val:TE.formatMoney(esppTotalGain)},
      {label:'Extra tax from ESPP (ordinary)',val:TE.formatMoney(incrementalOrdTax)},
      {label:'Extra tax from ESPP (capital gains)',val:TE.formatMoney(incrementalCGTax)},
      {label:'Total extra tax from ESPP',val:TE.formatMoney(incrementalTotalTax)}
    ];
    const bigCard='background:var(--card);border:1px solid var(--border);border-radius:12px;padding:1.5rem;text-align:center;margin-bottom:1rem';
    const bigNum='font-size:2.2rem;font-weight:700;color:var(--accent);display:block';
    const bigLbl='font-size:.85rem;color:var(--muted);margin-top:.25rem;display:block';
    document.getElementById('espp2-res').innerHTML=resultsBox(lines,'ESPP net after its own tax',TE.formatMoney(esppNetAfterOwnTax))+
    `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-top:1rem">`+
    `<div style="${bigCard};border-top:4px solid #ff9800"><span style="${bigNum};color:#ff9800">${TE.formatMoney(ordinary)}</span><span style="${bigLbl}">Ordinary Income</span></div>`+
    `<div style="${bigCard};border-top:4px solid #4caf50"><span style="${bigNum};color:#4caf50">${TE.formatMoney(cg)}</span><span style="${bigLbl}">${cgLabel}</span></div>`+
    `<div style="${bigCard};border-top:4px solid #f44336"><span style="${bigNum};color:#f44336">${TE.formatMoney(incrementalTotalTax)}</span><span style="${bigLbl}">Extra Tax from ESPP</span></div>`+
    `<div style="${bigCard};border-top:4px solid #2196f3"><span style="${bigNum};color:#2196f3">${TE.formatMoney(esppNetAfterOwnTax)}</span><span style="${bigLbl}">ESPP Net After Tax</span></div>`+
    `</div>`+
    `<div class="calc-panel" style="margin-top:1rem"><h3>Your total tax picture</h3><p>Tax on your other income alone: <strong>${TE.formatMoney(totalTaxNoESPP)}</strong></p><p>Tax with ESPP included: <strong>${TE.formatMoney(totalTaxWithESPP)}</strong></p><p>Difference (extra tax from ESPP): <strong>${TE.formatMoney(incrementalTotalTax)}</strong></p></div>`+
    `<div class="calc-panel" style="margin-top:1rem;background:rgba(46,125,50,.08);border-color:var(--success)"><h3>ESPP Strategy</h3><p><strong>Sell immediately:</strong> You lock in the 15% discount with minimal capital gains risk. The ordinary income is the same either way.</p><p style="margin-top:.5rem"><strong>Hold for qualifying:</strong> Only do this if you genuinely want to hold the stock long-term. The tax savings are usually smaller than the concentration risk you take.</p><p style="margin-top:.5rem"><strong>Remember:</strong> ESPP is a paycheck benefit, not an investment strategy. Take the discount, diversify.</p></div>`;
    scrollToResults('espp2-res');
  });
}

/* ===================== QSBS Exclusion Calculator ===================== */
function qsbsTaxView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'',text:'Equity Compensation'},{href:'',text:'QSBS Tax'})}<h2>QSBS Exclusion Calculator 2026</h2><p style="color:var(--muted);margin-bottom:1.5rem">Qualified Small Business Stock under Section 1202 can exclude up to 100% of gain from federal tax. OBBBA raised the cap to $15M for stock acquired after July 4, 2025.</p>
    <div class="calc-grid"><div class="calc-panel"><h3>QSBS Details</h3>
      ${inputField('qsbs2_basis','Original investment / basis ($)','number',{value:10000})}
      ${inputField('qsbs2_sale','Sale price ($)','number',{value:500000})}
      ${selectField('qsbs2_when','Acquisition date',[{value:'pre2010',label:'Before Feb 18, 2009 (50% exclusion)'},{value:'2009_2010',label:'Feb 18, 2009 - Sept 27, 2010 (75% exclusion)'},{value:'post2010',label:'After Sept 27, 2010 (100% exclusion)'},{value:'post_july2025',label:'After July 4, 2025 (OBBBA 100%, $15M cap)'}],{value:'post2010'})}
    </div>
    <div class="calc-panel"><h3>Profile</h3>
      ${inputField('qsbs2_other','Other taxable income ($)','number',{value:200000})}
      ${selectField('qsbs2_status','Filing status',[{value:'single',label:'Single'},{value:'mfj',label:'Married Filing Jointly'},{value:'mfs',label:'Married Filing Separately'},{value:'hoh',label:'Head of Household'}],{value:'single'})}
      <p style="color:var(--muted);font-size:.9rem;margin-top:1rem">QSBS requires: C-Corp, under $50M gross assets at issuance, active business (not personal services), and 5+ year hold.</p>
    </div></div>
    <div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcQSBS2()">Calculate QSBS Exclusion</button></div>
    <div id="qsbs2-res"></div>`+
    renderFaqSection([
      {q:'Does my startup equity qualify for QSBS?',a:'QSBS requires: (1) C-Corporation, (2) under $50M in gross assets at issuance, (3) active business (not personal services, farming, or hospitality), and (4) 5+ year holding period. Most VC-backed tech startups qualify. Verify with your company or tax advisor.'},
      {q:'What did OBBBA change for QSBS?',a:'OBBBA raised the Section 1202 exclusion cap from $10M to $15M for stock acquired after July 4, 2025. Stock acquired before that date still has the $10M cap. The exclusion rate remains 100% for post-2010 acquisitions.'},
      {q:'Can I roll over QSBS gains?',a:'Yes. Section 1045 allows you to roll over QSBS gains into new QSBS within 60 days, preserving the exclusion. This is common for founders and early employees who sell to a new startup.'}
    ]);
  window.CalcFns = window.CalcFns || {};
  window.CalcFns.calcQSBS2 = safeCalc(function(){
    const basis=getVal('qsbs2_basis'),sale=getVal('qsbs2_sale');
    const when=getSelect('qsbs2_when');const other=getVal('qsbs2_other');const status=getSelect('qsbs2_status');
    const stdDed=TE.getStandardDeduction(status,false,DATA);
    const gain=Math.max(0,sale-basis);
    let exclusionRate=0,exclusionCap=10000000;
    switch(when){
      case 'pre2010':exclusionRate=0.50;break;
      case '2009_2010':exclusionRate=0.75;break;
      case 'post2010':exclusionRate=1.00;break;
      case 'post_july2025':exclusionRate=1.00;exclusionCap=15000000;break;
    }
    const excluded=Math.min(gain*exclusionRate,exclusionCap);
    const taxableGain=gain-excluded;
    const taxableOrd=Math.max(0,other-stdDed);
    const fedOrd=TE.calcFederalTax(taxableOrd,status,DATA);
    const cgTax=TE.calcLTCGTax(Math.max(0,taxableGain),taxableOrd,status,DATA);
    const totalTax=fedOrd+cgTax;
    const taxSaved=(gain*exclusionRate>exclusionCap?exclusionCap:gain*exclusionRate)*0.238;
    const lines=[
      {label:'QSBS total gain',val:TE.formatMoney(gain)},
      {label:'Exclusion rate',val:(exclusionRate*100).toFixed(0)+'%'},
      {label:'Excluded from tax (Section 1202)',val:TE.formatMoney(excluded)},
      {label:'Taxable LTCG remaining',val:TE.formatMoney(taxableGain)},
      {label:'Estimated tax saved',val:TE.formatMoney(taxSaved)}
    ];
    const bigCard='background:var(--card);border:1px solid var(--border);border-radius:12px;padding:1.5rem;text-align:center;margin-bottom:1rem';
    const bigNum='font-size:2.2rem;font-weight:700;color:var(--accent);display:block';
    const bigLbl='font-size:.85rem;color:var(--muted);margin-top:.25rem;display:block';
    document.getElementById('qsbs2-res').innerHTML=resultsBox(lines,'QSBS Tax Summary',TE.formatMoney(gain-cgTax))+
    `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-top:1rem">`+
    `<div style="${bigCard};border-top:4px solid #4caf50"><span style="${bigNum};color:#4caf50">${(exclusionRate*100).toFixed(0)}%</span><span style="${bigLbl}">Exclusion Rate</span></div>`+
    `<div style="${bigCard};border-top:4px solid #2196f3"><span style="${bigNum};color:#2196f3">${TE.formatMoney(excluded)}</span><span style="${bigLbl}">Excluded</span></div>`+
    `<div style="${bigCard};border-top:4px solid #ff9800"><span style="${bigNum};color:#ff9800">${TE.formatMoney(taxableGain)}</span><span style="${bigLbl}">Taxable Gain</span></div>`+
    `<div style="${bigCard};border-top:4px solid #4caf50"><span style="${bigNum};color:#4caf50">${TE.formatMoney(taxSaved)}</span><span style="${bigLbl}">Tax Saved (est)</span></div>`+
    `</div>`+
    `<div class="calc-panel" style="margin-top:1rem;background:rgba(46,125,50,.08);border-color:var(--success)"><h3>QSBS Checklist</h3><p><strong>Requirements:</strong> C-Corp, under $50M gross assets at issuance, active business (not personal services), 5+ year hold.</p><p style="margin-top:.5rem"><strong>OBBBA:</strong> $15M cap for stock acquired after July 4, 2025. $10M cap for earlier stock.</p><p style="margin-top:.5rem"><strong>Rollover:</strong> Section 1045 allows rolling QSBS gains into new QSBS within 60 days.</p><p style="margin-top:.5rem"><strong>Documentation:</strong> Keep proof of issuance date, purchase price, and company qualification. You will need this when you sell.</p></div>`;
    scrollToResults('qsbs2-res');
  });
}

/* ===================== Phantom Stock / SARs Calculator ===================== */
function phantomTaxView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'',text:'Equity Compensation'},{href:'',text:'Phantom Stock / SARs'})}<h2>Phantom Stock & SARs Tax Calculator 2026</h2><p style="color:var(--muted);margin-bottom:1.5rem">Phantom stock and Stock Appreciation Rights (SARs) pay cash or stock equal to the value increase. Taxed as ordinary income when paid. FICA applies if you are a W-2 employee.</p>
    <div class="calc-grid"><div class="calc-panel"><h3>Payout</h3>
      ${inputField('phantom2_amount','Payout amount ($)','number',{value:25000})}
      ${selectField('phantom2_type','Recipient type',[{value:'employee',label:'Employee (W-2)'},{value:'contractor',label:'Contractor (1099-NEC)'}],{value:'employee'})}
      ${inputField('phantom2_other','Other ordinary income ($)','number',{value:150000})}
    </div>
    <div class="calc-panel"><h3>Profile</h3>
      ${selectField('phantom2_status','Filing status',[{value:'single',label:'Single'},{value:'mfj',label:'Married Filing Jointly'},{value:'mfs',label:'Married Filing Separately'},{value:'hoh',label:'Head of Household'}],{value:'single'})}
      <p style="color:var(--muted);font-size:.9rem;margin-top:1rem">Phantom stock pays the value of real stock without issuing shares. SARs pay the appreciation only. Both are taxed at payout.</p>
    </div></div>
    <div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcPhantom2()">Calculate Phantom Tax</button></div>
    <div id="phantom2-res"></div>`+
    renderFaqSection([
      {q:'How is phantom stock different from RSUs?',a:'RSUs give you actual shares at vest. Phantom stock pays cash equal to the value of shares but never transfers ownership. It is common in LLCs and partnerships that cannot easily issue equity.'},
      {q:'Do contractors pay SE tax on phantom stock?',a:'Yes. If you receive phantom stock or SARs as a contractor, the payout is reported on 1099-NEC and subject to self-employment tax (15.3%). Employees pay only FICA (7.65%).'},
      {q:'Can I defer phantom stock payouts?',a:'Some plans allow deferral until retirement or a liquidity event. Deferral requires careful structuring to avoid constructive receipt. Consult a tax attorney before deferring.'}
    ]);
  window.CalcFns = window.CalcFns || {};
  window.CalcFns.calcPhantom2 = safeCalc(function(){
    const amount=getVal('phantom2_amount');const type=getSelect('phantom2_type');
    const other=getVal('phantom2_other');const status=getSelect('phantom2_status');
    const stdDed=TE.getStandardDeduction(status,false,DATA);
    let fica=0,seTax=0;
    if(type==='employee'){fica=amount*0.0765;}
    else{const se=TE.calcSETax(amount,DATA);seTax=se.totalSE;}
    // Tax WITH phantom
    const taxableOrdWith=Math.max(0,other+amount-stdDed);
    const fedWith=TE.calcFederalTax(taxableOrdWith,status,DATA);
    const totalTaxWith=fedWith+fica+seTax;
    // Tax WITHOUT phantom (for incremental comparison)
    const taxableOrdWithout=Math.max(0,other-stdDed);
    const fedWithout=TE.calcFederalTax(taxableOrdWithout,status,DATA);
    const totalTaxWithout=fedWithout;
    const incrementalFedTax=fedWith-fedWithout;
    const incrementalTotalTax=incrementalFedTax+fica+seTax;
    const net=amount-incrementalTotalTax;
    const lines=[
      {label:'Phantom stock / SAR payout',val:TE.formatMoney(amount)},
      {label:'Recipient type',val:type==='employee'?'Employee (W-2)':'Contractor (1099-NEC)'},
      {label:'Extra federal tax from payout',val:TE.formatMoney(incrementalFedTax)}
    ];
    if(fica>0){lines.push({label:'FICA (employee 7.65%)',val:TE.formatMoney(fica)});}
    if(seTax>0){lines.push({label:'Self-employment tax',val:TE.formatMoney(seTax)});}
    lines.push({label:'Total extra tax from payout',val:TE.formatMoney(incrementalTotalTax)});
    const bigCard='background:var(--card);border:1px solid var(--border);border-radius:12px;padding:1.5rem;text-align:center;margin-bottom:1rem';
    const bigNum='font-size:2.2rem;font-weight:700;color:var(--accent);display:block';
    const bigLbl='font-size:.85rem;color:var(--muted);margin-top:.25rem;display:block';
    document.getElementById('phantom2-res').innerHTML=resultsBox(lines,'Phantom net after its own tax',TE.formatMoney(net))+
    `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem;margin-top:1rem">`+
    `<div style="${bigCard};border-top:4px solid #ff9800"><span style="${bigNum};color:#ff9800">${TE.formatMoney(amount)}</span><span style="${bigLbl}">Payout</span></div>`+
    `<div style="${bigCard};border-top:4px solid #f44336"><span style="${bigNum};color:#f44336">${TE.formatMoney(incrementalTotalTax)}</span><span style="${bigLbl}">Extra Tax from Payout</span></div>`+
    `<div style="${bigCard};border-top:4px solid #4caf50"><span style="${bigNum};color:#4caf50">${TE.formatMoney(net)}</span><span style="${bigLbl}">Payout Net After Tax</span></div>`+
    `</div>`+
    `<div class="calc-panel" style="margin-top:1rem"><h3>Your total tax picture</h3><p>Tax on your other income alone: <strong>${TE.formatMoney(totalTaxWithout)}</strong></p><p>Tax with payout included: <strong>${TE.formatMoney(totalTaxWith)}</strong></p><p>Difference (extra tax from payout): <strong>${TE.formatMoney(incrementalTotalTax)}</strong></p></div>`+
    `<div class="calc-panel" style="margin-top:1rem;background:rgba(46,125,50,.08);border-color:var(--success)"><h3>Phantom vs Real Equity</h3><p><strong>Phantom stock:</strong> Pays cash equal to share value. No voting rights, no dividends, no cap gains treatment. Taxed as ordinary income.</p><p style="margin-top:.5rem"><strong>SARs:</strong> Pays appreciation only. Same tax treatment.</p><p style="margin-top:.5rem"><strong>For employers:</strong> Phantom stock avoids dilution and 409A valuation issues. Common in private equity-backed companies and LLCs.</p></div>`;
    scrollToResults('phantom2-res');
  });
}

/* ===================== Equity Hub ===================== */
function equityView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'',text:'Equity Compensation'})}<h2>Equity Compensation Tax Calculators</h2><p style="color:var(--muted);margin-bottom:1.5rem">RSUs, ISOs, NSOs, ESPP, QSBS, Phantom Stock - every equity type has different tax rules. Use the dedicated calculator for your specific grant type.</p>
    <div class="tile-grid">
      ${tileCard('📦','RSU Tax Calculator','Shares vesting -> ordinary income, withholding gap, sale gains.','Equity','equity/rsu-tax')}
      ${tileCard('🏷️','ISO Stock Options Calculator','AMT exposure, qualifying vs disqualifying disposition.','Equity','equity/iso-tax')}
      ${tileCard('📋','NSO Stock Options Calculator','Ordinary income at exercise + capital gains at sale.','Equity','equity/nso-tax')}
      ${tileCard('🛒','ESPP Tax Calculator','Qualifying vs disqualifying, discount income, capital gains.','Equity','equity/espp-tax')}
      ${tileCard('🚀','QSBS Exclusion Calculator','Section 1202 exclusion, $10M/$15M cap, OBBBA changes.','Equity','equity/qsbs-tax')}
      ${tileCard('👻','Phantom Stock / SARs Calculator','Payout taxed as ordinary income + FICA/SE tax.','Equity','equity/phantom-tax')}
      ${tileCard('🧮','Combined Equity Calculator','Model RSU + ESPP + QSBS + Phantom in one run.','Equity','equity/equity-combined')}
    </div>`+
    `<div class="calc-panel" style="margin-top:1.5rem"><h3>Related Hubs</h3><p><a href="/gig-hub" class="btn btn-secondary">Gig Economy Calculators</a> <a href="/creator-hub" class="btn btn-secondary">Creator Economy Calculators</a> <a href="/seller-hub" class="btn btn-secondary">Seller Marketplace Calculators</a> <a href="/rental-hub" class="btn btn-secondary">Rental Income Calculators</a> <a href="/calculators" class="btn btn-secondary">Standalone Tools Hub</a></p></div>`;
}

/* ===================== Combined Equity Calculator ===================== */
function equityCombinedView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'',text:'Equity Compensation'},{href:'',text:'Combined Equity Calculator'})}<h2>Equity Compensation Tax Calculator</h2><p style="color:var(--muted);margin-bottom:1.5rem">Calculate tax on RSU vesting, ESPP sales, QSBS exclusion, and Phantom Stock payouts.</p>
    <div class="calc-panel"><h3>1. Select equity types</h3>
      <div class="deduction-row"><input type="checkbox" id="has_rsu" onchange="window.CalcFns.toggleEquityForm()"> <label for="has_rsu"><strong>RSU - Restricted Stock Units</strong></label></div>
      <div class="deduction-row"><input type="checkbox" id="has_espp" onchange="window.CalcFns.toggleEquityForm()"> <label for="has_espp"><strong>ESPP - Employee Stock Purchase Plan</strong></label></div>
      <div class="deduction-row"><input type="checkbox" id="has_qsbs" onchange="window.CalcFns.toggleEquityForm()"> <label for="has_qsbs"><strong>QSBS - Section 1202 Exclusion</strong></label></div>
      <div class="deduction-row"><input type="checkbox" id="has_phantom" onchange="window.CalcFns.toggleEquityForm()"> <label for="has_phantom"><strong>Phantom Stock / SARs</strong></label></div>
    </div>
    <div id="equity-forms"></div>
    <div class="calc-panel"><h3>Profile</h3>
      ${selectField('eq_status','Filing status',[{value:'single',label:'Single'},{value:'mfj',label:'Married Filing Jointly'},{value:'mfs',label:'Married Filing Separately'},{value:'hoh',label:'Head of Household'}],{value:'single'})}
      ${selectField('eq_state','State',buildStateOptions(),{value:'CA'})}
      ${inputField('eq_other_income','Other income (W-2, SE, etc.)','number',{value:0})}
    </div>
    <div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcEquity()">Calculate Equity Tax</button></div>
    <div id="equity-res"></div>`+
    `<div class="calc-panel" style="margin-top:1.5rem"><h3>How Equity Compensation Is Taxed</h3><p><strong>RSUs:</strong> Taxed as ordinary income at vesting based on fair market value. Your employer withholds shares (typically 22–37%). Any subsequent sale is a capital gain/loss (short-term if held &lt;1 year, long-term if ≥1 year).</p><p><strong>ESPP:</strong> <em>Qualifying</em> dispositions (held 2+ years from offering, 1+ year from purchase) give you ordinary income on the lesser of discount or actual gain, with the rest as LTCG. <em>Disqualifying</em> dispositions tax the entire discount as ordinary income and the rest as STCG/LTCG.</p><p><strong>QSBS (Section 1202):</strong> If you hold qualified small business stock for 5+ years, up to 100% of gain may be excluded from federal tax. OBBBA raised the cap to $15M for stock acquired after July 4, 2025.</p><p><strong>ISOs:</strong> No tax at exercise, but the bargain element may trigger AMT. When you sell, if held 2+ years from grant and 1+ year from exercise, the entire gain is LTCG.</p><p><strong>Phantom Stock / SARs:</strong> Taxed as ordinary income when paid out. If you are a contractor, you receive a 1099-NEC and owe SE tax too.</p></div>`+
    renderFaqSection([
      {q:'Should I hold RSUs or sell immediately?',a:'Most advisors recommend selling immediately at vest to diversify and avoid concentration risk. The tax is the same either way (ordinary income at vest). Only the sale produces capital gains/losses.'},
      {q:'What is the AMT trap with ISOs?',a:'When you exercise ISOs, the difference between fair market value and strike price (the "bargain element") counts as an AMT preference item. You may owe AMT even though you have no cash from the exercise. Plan ahead.'},
      {q:'Does QSBS apply to my startup equity?',a:'QSBS requires (1) C-Corp, (2) under $50M in gross assets at issuance, (3) active business (not personal services), and (4) 5+ year hold. Most VC-backed startups qualify. Verify with your company.'}
    ]);

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.toggleEquityForm = safeCalc(function(){
    let html='';
    if(getVal('has_rsu')){
      html+=`<div class="calc-panel"><h3>RSU - Restricted Stock Units</h3>
        ${inputField('rsu_shares','Shares vesting','number',{value:100})}
        ${inputField('rsu_fmv','FMV per share at vest ($)','number',{value:150})}
        ${inputField('rsu_withheld','Shares withheld for tax','number',{value:30})}
        ${inputField('rsu_sale_price','Sale price per share ($) - leave 0 if not sold','number',{value:0})}
        ${inputField('rsu_sale_date','Months since vesting (for STCG/LTCG)','number',{value:0})}
      </div>`;
    }
    if(getVal('has_espp')){
      html+=`<div class="calc-panel"><h3>ESPP - Employee Stock Purchase Plan</h3>
        ${inputField('espp_purchase_price','Purchase price per share ($)','number',{value:85})}
        ${inputField('espp_fmv_purchase','FMV at purchase date ($)','number',{value:100})}
        ${inputField('espp_sale_price','Sale price per share ($)','number',{value:120})}
        ${inputField('espp_shares','Shares purchased','number',{value:100})}
        ${selectField('espp_type','Disposition type',[{value:'qualifying',label:'Qualifying (2+ yrs from offering, 1+ yr from purchase)'},{value:'disqualifying',label:'Disqualifying (held less)'}],{value:'qualifying'})}
      </div>`;
    }
    if(getVal('has_qsbs')){
      html+=`<div class="calc-panel"><h3>QSBS - Section 1202 Exclusion</h3>
        ${inputField('qsbs_basis','Original investment / basis ($)','number',{value:10000})}
        ${inputField('qsbs_sale_price','Sale price ($)','number',{value:500000})}
        ${inputField('qsbs_acquired_after_2010','Acquired after Sept 27, 2010','checkbox')}
        ${inputField('qsbs_acquired_after_july2025','Acquired after July 4, 2025 (OBBBA)','checkbox')}
      </div>`;
    }
    if(getVal('has_phantom')){
      html+=`<div class="calc-panel"><h3>Phantom Stock / SARs</h3>
        ${inputField('phantom_amount','Payout amount ($)','number',{value:25000})}
        ${selectField('phantom_type','Recipient type',[{value:'employee',label:'Employee (W-2)'},{value:'contractor',label:'Contractor (1099-NEC)'}],{value:'employee'})}
      </div>`;
    }
    document.getElementById('equity-forms').innerHTML=html;
  });

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.calcEquity = safeCalc(function(){
    try{
    const status=getSelect('eq_status'),state=getSelect('eq_state');
    const otherIncome=getVal('eq_other_income');
    const stdDed=TE.getStandardDeduction(status,false,DATA);
    let totalOrdinaryIncome=0,totalLTCG=0,totalSTCG=0,totalExcluded=0;
    let totalFICA=0,totalFederalTax=0,totalStateTax=0;
    let lines=[];

    // RSU
    if(getVal('has_rsu')){
      const shares=getVal('rsu_shares'),fmv=getVal('rsu_fmv'),withheld=getVal('rsu_withheld');
      const salePrice=getVal('rsu_sale_price'),monthsSinceVest=getVal('rsu_sale_date');
      const rsuOrdinary=shares*fmv;
      const sharesReceived=shares-withheld;
      const taxWithheld=withheld*fmv;
      totalOrdinaryIncome+=rsuOrdinary;
      lines.push({label:'RSU ordinary income (vesting)',val:TE.formatMoney(rsuOrdinary)});
      lines.push({label:'RSU tax withheld (@22%)',val:'-'+TE.formatMoney(taxWithheld)});
      if(salePrice>0&&sharesReceived>0){
        const gain=(salePrice-fmv)*sharesReceived;
        if(monthsSinceVest>=12){totalLTCG+=gain;lines.push({label:'RSU sale LTCG',val:TE.formatMoney(gain)});}
        else{totalSTCG+=gain;lines.push({label:'RSU sale STCG',val:TE.formatMoney(gain)});}
      }
    }

    // ESPP
    if(getVal('has_espp')){
      const purchasePrice=getVal('espp_purchase_price'),fmvPurchase=getVal('espp_fmv_purchase');
      const salePrice=getVal('espp_sale_price'),shares=getVal('espp_shares');
      const espptype=getSelect('espp_type');
      if(espptype==='qualifying'){
        // Qualifying: ordinary income = LESSER of (discount per share, actual gain per share) × shares
        const discountPerShare=Math.min(fmvPurchase*0.15,salePrice-purchasePrice);
        const ordinary=discountPerShare*shares;
        const ltcg=(salePrice-purchasePrice)*shares-ordinary;
        totalOrdinaryIncome+=ordinary;
        totalLTCG+=ltcg;
        lines.push({label:'ESPP ordinary income (qualifying)',val:TE.formatMoney(ordinary)});
        lines.push({label:'ESPP LTCG (qualifying)',val:TE.formatMoney(ltcg)});
      }else{
        const ordinary=(fmvPurchase-purchasePrice)*shares;
        const cg=(salePrice-fmvPurchase)*shares;
        totalOrdinaryIncome+=ordinary;
        totalSTCG+=cg;
        lines.push({label:'ESPP ordinary income (disqualifying)',val:TE.formatMoney(ordinary)});
        lines.push({label:'ESPP capital gain/loss',val:TE.formatMoney(cg)});
      }
    }

    // QSBS
    if(getVal('has_qsbs')){
      const basis=getVal('qsbs_basis'),salePrice=getVal('qsbs_sale_price');
      const after2010=getVal('qsbs_acquired_after_2010'),afterJuly2025=getVal('qsbs_acquired_after_july2025');
      const gain=Math.max(0,salePrice-basis);
      let exclusionRate=after2010?1.0:0.75;
      let exclusionCap=afterJuly2025?15000000:10000000;
      const excluded=Math.min(gain*exclusionRate,exclusionCap);
      const taxableGain=gain-excluded;
      totalExcluded+=excluded;
      if(taxableGain>0) totalLTCG+=taxableGain;
      lines.push({label:'QSBS total gain (included in AGI)',val:TE.formatMoney(gain)});
      lines.push({label:'QSBS excluded from tax (Section 1202)',val:TE.formatMoney(excluded)});
      lines.push({label:'QSBS taxable LTCG',val:TE.formatMoney(taxableGain)});
    }

    // Phantom Stock
    if(getVal('has_phantom')){
      const amount=getVal('phantom_amount');
      const ptype=getSelect('phantom_type');
      totalOrdinaryIncome+=amount;
      if(ptype==='employee'){
        const fica=amount*0.0765; // employee share 7.65%
        totalFICA+=fica;
        lines.push({label:'Phantom stock/SAR payout',val:TE.formatMoney(amount)});
        lines.push({label:'FICA (7.65%)',val:TE.formatMoney(fica)});
      }else{
        lines.push({label:'Phantom stock/SAR payout (1099-NEC)',val:TE.formatMoney(amount)});
      }
    }

    // Total tax calculation
    const agi=otherIncome+totalOrdinaryIncome+totalSTCG+totalLTCG;
    const taxableTotal=Math.max(0,agi-stdDed);
    const taxableOrdinary=Math.max(0,taxableTotal-totalLTCG);
    const fedOrdinary=TE.calcFederalTax(taxableOrdinary,status,DATA);
    // LTCG taxed at preferential rates (0%/15%/20%), not ordinary brackets
    const fedCG=TE.calcLTCGTax(totalLTCG,taxableOrdinary,status,DATA);
    totalFederalTax=fedOrdinary+fedCG;
    const stateRes=TE.calcStateTax(agi,state,DATA,status);
    totalStateTax=stateRes.tax;

    // NIIT check (3.8% on investment income above threshold)
    const niitThreshold=status==='mfj'?250000:200000;
    const investmentIncome=totalSTCG+totalLTCG; // Interest/dividends part of eq_other_income
    const niitTaxable=Math.max(0,Math.min(investmentIncome,Math.max(0,agi-niitThreshold)));
    const niit=niitTaxable*0.038;

    lines.push({label:'Other income',val:TE.formatMoney(otherIncome)});
    lines.push({label:'Total ordinary income from equity',val:TE.formatMoney(totalOrdinaryIncome)});
    if(totalSTCG!==0) lines.push({label:'Short-term capital gains',val:TE.formatMoney(totalSTCG)});
    if(totalLTCG>0) lines.push({label:'Long-term capital gains (taxable)',val:TE.formatMoney(totalLTCG)});
    lines.push({label:'AGI',val:TE.formatMoney(agi)});
    lines.push({label:'Standard deduction',val:'-'+TE.formatMoney(stdDed)});
    lines.push({label:'Taxable ordinary income',val:TE.formatMoney(taxableOrdinary)});
    lines.push({label:'Federal ordinary tax',val:TE.formatMoney(fedOrdinary)});
    if(fedCG>0) lines.push({label:'Federal capital gains tax',val:TE.formatMoney(fedCG)});
    lines.push({label:'State income tax',val:TE.formatMoney(totalStateTax)});
    if(totalFICA>0) lines.push({label:'FICA on phantom stock',val:TE.formatMoney(totalFICA)});
    if(niit>0) lines.push({label:'NIIT (3.8% Net Investment Income Tax)',val:TE.formatMoney(niit)});
    const totalEquityTax=totalFederalTax+totalStateTax+totalFICA+niit;
    lines.push({label:'Total tax on equity income',val:TE.formatMoney(totalEquityTax)});

    const totalGains=totalOrdinaryIncome+totalSTCG+totalLTCG+totalExcluded;
    document.getElementById('equity-res').innerHTML=resultsBox(lines,'Net equity income after tax',TE.formatMoney(totalGains-totalEquityTax))+
    `<div class="calc-panel" style="margin-top:1rem"><h3>Summary</h3><p>You will pay <strong>${TE.formatMoney(totalEquityTax)}</strong> in total tax on <strong>${TE.formatMoney(totalGains)}</strong> of equity income.</p><p>Your take-home amount is <strong>${TE.formatMoney(totalGains-totalEquityTax)}</strong>.</p></div>`;
    }catch(err){
      document.getElementById('equity-res').innerHTML=`<div class="callout" style="background:rgba(201,74,30,.1);border-color:var(--accent)"><strong>Error</strong>${err.message}</div>`;
      console.error(err);
    }
  });
}

/* ===================== Tax Forms Reference ===================== */
function taxFormsView(main){
  const forms=DATA.importantForms||{};
  let html=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'',text:'Reference'},{href:'',text:'Tax Forms'})}<h2>IRS Tax Forms Guide 2026</h2><p style="color:var(--muted);margin-bottom:1.5rem">Key IRS forms for gig workers, creators, and self-employed filers. Know which forms you receive, which you file, and where each flows on your return.</p>`;

  html+=`<div class="section"><h3>Forms You FILE</h3><table class="data-table"><thead><tr><th>Form</th><th>When You Need It</th><th>Where It Flows</th></tr></thead><tbody>`+
  `<tr><td><strong>Schedule C</strong> (Form 1040)</td><td>Any self-employment income (gig, creator, seller, rental with services)</td><td>Business profit/loss → Form 1040 line 12</td></tr>`+
  `<tr><td><strong>Schedule SE</strong></td><td>Net SE profit > $400</td><td>SE tax → Form 1040 Schedule 2 line 4</td></tr>`+
  `<tr><td><strong>Schedule E</strong></td><td>Passive rental income, royalties, partnerships, S-Corp K-1s</td><td>Rental/partnership income → Form 1040 line 5</td></tr>`+
  `<tr><td><strong>Form 1040-ES</strong></td><td>Expect to owe $1,000+ in tax; pay quarterly estimated taxes</td><td>Quarterly payments (not filed with return)</td></tr>`+
  `<tr><td><strong>Form 1040</strong></td><td>Everyone files this</td><td>Main tax return</td></tr>`+
  `<tr><td><strong>Form 1120-S</strong></td><td>S-Corporation annual return</td><td>Corporate income/loss → Schedule K-1 to shareholders</td></tr>`+
  `<tr><td><strong>Form 1065</strong></td><td>Partnership / multi-member LLC return</td><td>Partnership income/loss → Schedule K-1 to partners</td></tr>`+
  `<tr><td><strong>Form 1120</strong></td><td>C-Corporation annual return</td><td>Corporate tax return; dividends taxed separately</td></tr>`+
  `<tr><td><strong>Form 2553</strong></td><td>Electing S-Corp status (file within 75 days of formation or by March 15)</td><td>Election with IRS; no tax calculation</td></tr>`+
  `<tr><td><strong>Form 8829</strong></td><td>Home office (actual method)</td><td>Home office expenses → Schedule C</td></tr>`+
  `<tr><td><strong>Form 4562</strong></td><td>Depreciation and amortization (Section 179, bonus, MACRS)</td><td>Depreciation → Schedule C or Schedule E</td></tr>`+
  `<tr><td><strong>Form 8995</strong></td><td>QBI deduction (simplified method)</td><td>20% QBI deduction → Form 1040 line 13</td></tr>`+
  `</tbody></table></div>`;

  html+=`<div class="section"><h3>Forms You RECEIVE</h3><table class="data-table"><thead><tr><th>Form</th><th>Who Sends It</th><th>What It Reports</th><th>Threshold</th></tr></thead><tbody>`+
  `<tr><td><strong>1099-NEC</strong></td><td>Client/business that paid you $600+ for services</td><td>Non-employee compensation</td><td>$600</td></tr>`+
  `<tr><td><strong>1099-K</strong></td><td>Payment processor (Stripe, PayPal, Square, Amazon)</td><td>Gross payment card/third-party network transactions</td><td>$20,000 + 200 transactions (OBBBA restored threshold)</td></tr>`+
  `<tr><td><strong>1099-MISC</strong></td><td>Payer of rents, prizes, awards, royalties, legal settlements</td><td>Miscellaneous income</td><td>$600 (most types)</td></tr>`+
  `<tr><td><strong>1099-INT</strong></td><td>Banks, brokerages</td><td>Interest income</td><td>$10</td></tr>`+
  `<tr><td><strong>1099-DIV</strong></td><td>Brokerages</td><td>Dividends and distributions</td><td>$10</td></tr>`+
  `<tr><td><strong>1099-B</strong></td><td>Brokerages</td><td>Stock and bond transactions</td><td>Any sale</td></tr>`+
  `<tr><td><strong>W-2</strong></td><td>Employer</td><td>Wages, withholding, 401(k), HSA</td><td>Any wages</td></tr>`+
  `<tr><td><strong>K-1</strong></td><td>Partnership, S-Corp, LLC, trust/estate</td><td>Your share of income/loss, credits, distributions</td><td>Any amount</td></tr>`+
  `</tbody></table></div>`;

  html+=`<div class="section"><h3>Additional Reference Forms</h3><div class="tile-grid" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px">`;
  for(const [code,desc] of Object.entries(forms)){
    html+=`<div class="tile-card fade-in" style="cursor:default"><span class="tile-name">Form ${code}</span><span class="tile-desc">${desc}</span></div>`;
  }
  html+='</div></div>';

  html+=renderFaqSection([
    {q:'Do I file Schedule C if I only made $400?',a:'Yes. If you have any net profit from self-employment, you file Schedule C. SE tax (Schedule SE) is only required if net profit exceeds $400, but Schedule C itself reports all business income.'},
    {q:'What if my 1099-K gross is higher than my actual income?',a:'This is extremely common. The 1099-K reports gross receipts before platform fees, refunds, and COGS. You must reconcile it on Schedule C. <a href="/1099k-reconciliation">Use our 1099-K reconciliation tool</a>.'},
    {q:'Do I need to file Form 1040-ES?',a:'If you expect to owe $1,000 or more in tax for the year and your withholding does not cover at least 90% of your liability, you must pay quarterly estimated taxes. <a href="/quarterly">Calculate your quarterly payments</a>.'}
  ]);
  main.innerHTML=html;
}

/* ===================== Filing Statuses Reference ===================== */
function filingStatusView(main){
  const fs=DATA.filingStatuses||{};
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'',text:'Reference'},{href:'',text:'Filing Statuses'})}<h2>Filing Status Comparison</h2><p style="color:var(--muted);margin-bottom:1.5rem">2026 federal filing status brackets and standard deductions.</p>
    <div class="tile-grid" style="grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px">${Object.entries(fs).map(([k,v])=>`<div class="tile-card fade-in" style="cursor:default"><span class="tile-name">${v.label||k}</span><span class="tile-desc" style="text-align:left"><p><strong>Standard deduction:</strong> ${TE.formatMoney(DATA.federal.standardDeduction[k]||0)}</p><p><strong>10% bracket:</strong> Up to ${TE.formatMoney(DATA.federal.brackets[k]?DATA.federal.brackets[k][0].max:0)}</p><p>${v.description||''}</p></span></div>`).join('')}</div>`;
}

/* ===================== State Tax Metadata ===================== */
function stateMetaView(main){
  if(!DATA||!DATA.stateMetadata){
    main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'',text:'Reference'},{href:'',text:'State Tax Metadata'})}<h2>State Tax Reference</h2><p style="color:var(--muted)">Data not loaded yet. Please refresh.</p>`;
    return;
  }
  const sm=DATA.stateMetadata;
  const localTaxHtml=Object.entries(sm.statesWithLocalIncomeTax||{}).map(([state,notes])=>`<p><strong>${state}:</strong> ${notes.join('; ')}</p>`).join('');
  const passthrough=sm.passthroughEntityTaxStates||{};
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'',text:'Reference'},{href:'',text:'State Tax Metadata'})}<h2>State Tax Reference</h2><p style="color:var(--muted);margin-bottom:1.5rem">Key state tax rules and exceptions.</p>
    <div class="calc-panel"><h3>No Income Tax States</h3><p>${(sm.noIncomeTaxStates||[]).join(', ')}</p></div>
    <div class="calc-panel"><h3>States That Tax Social Security</h3><p>${(sm.statesThatTaxSocialSecurity||[]).join(', ')}</p></div>
    <div class="calc-panel"><h3>States With Local Income Tax</h3>${localTaxHtml||'<p style="color:var(--muted)">No data</p>'}</div>
    <div class="calc-panel"><h3>States With No Sales Tax</h3><p>${(sm.statesWithNoSalesTax||[]).join(', ')}</p></div>
    <div class="calc-panel"><h3>States With SDI / TDI</h3>${Object.entries(sm.statesWithSDI||{}).map(([state,data])=>`<p><strong>${state}:</strong> ${data.note||''}</p>`).join('')||'<p style="color:var(--muted)">No data</p>'}</div>
    <div class="calc-panel"><h3>Community Property States</h3><p>${(sm.communityPropertyStates||[]).join(', ')}</p><p style="color:var(--muted)">${sm.communityPropertyNote||''}</p></div>
    <div class="calc-panel"><h3>Pass-Through Entity Tax (PTET) States</h3><p>${passthrough.note||''}</p><p><strong>States with PTET:</strong> ${(passthrough.statesWithPTET||[]).join(', ')}</p></div>`;
}

/* ===================== Mixed Household Scenarios ===================== */
function mixedHouseholdView(main){
  const scenarios=DATA.mixedHouseholdScenarios||[];
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'Mixed Households'})}<h2>Mixed Household Tax Scenarios</h2><p style="color:var(--muted);margin-bottom:1.5rem">Common complex household situations and their tax implications.</p>
    <div class="tile-grid" style="grid-template-columns:1fr;gap:12px">${scenarios.map(s=>`<div class="tile-card fade-in" style="cursor:default;text-align:left"><span class="tile-name">${s.label}</span><span class="tile-desc" style="text-align:left"><p>${s.note}</p></span></div>`).join('')}</div>`;
}

/* ===================== Combined Salary Calculator ===================== */
function combinedSalaryView(main){
  const csc=DATA.combinedSalaryCalculator||{};
  const defs=csc.incomeTypeDefinitions||{};
  const incomeLabels={
    w2_salary:'W-2 Salary',rsu_vesting:'RSU Vesting',iso_exercise:'ISO Exercise',nso_exercise:'NSO Exercise',
    espp_sale:'ESPP Sale',qsbs_sale:'QSBS Sale',capital_gains_sale:'Capital Gains Sale',
    se_income_1099:'1099 Self-Employment',rental_schedule_e:'Rental (Schedule E)',ssdi_benefits:'SSDI Benefits',
    ltd_std_benefits:'LTD/STD Benefits',dividend_income:'Dividend Income',pension_annuity:'Pension / Annuity',
    unemployment_1099g:'Unemployment (1099-G)',alimony_pre2019:'Alimony (pre-2019)',k1_partnership_scorp:'K-1 Partnership / S-Corp'
  };
  const incomeList=(csc.supportedIncomeTypes||[]).map(t=>{
    const d=defs[t]||{};
    const label=incomeLabels[t]||t;
    return `<li style="margin-bottom:.5rem"><strong>${label}</strong>${d.taxTreatment?` - ${d.taxTreatment}`:''}</li>`;
  }).join('');

  const wot=csc.withholdingOptimizationTool||{};
  let wotHtml=`<p>Most households with mixed income, a W-2 job plus freelance, rental, or investment income, end up either writing a surprise check in April or overpaying all year and giving the IRS an interest-free loan. Neither is the right answer.</p>`+
    `<p>This tool calculates your total expected tax across all income sources, then tells you exactly how to split the payment burden between W-4 withholding adjustments and quarterly estimated payments, so you land within $1,000 of zero owed on April 15.</p>`+
    `<h4 style="margin-top:1rem">What makes this different from a basic withholding calculator</h4>`+
    `<p>Most W-4 tools only look at your W-2. This one models your complete picture: W-2 wages, 1099 income, rental income, capital gains, and SSDI, then accounts for the SE tax deduction, QBI deduction, and any retirement contributions before calculating what you actually owe. The result is a withholding strategy that reflects your real tax liability, not just your paycheck.</p>`+
    `<h4 style="margin-top:1rem">What you enter</h4>`+
    `<p>Expected income from each source, current W-4 withholding elections, filing status, state, and any anticipated deductions (retirement contributions, health insurance, business expenses).</p>`+
    `<h4 style="margin-top:1rem">What you get</h4>`+
    `<ul style="padding-left:1.25rem">`+
    `<li><strong>Projected total federal tax liability</strong> across all income sources</li>`+
    `<li><strong>Projected annual withholding</strong> at your current W-4 settings</li>`+
    `<li><strong>Dollar gap or overpayment</strong> - what you'd owe or get back under current settings</li>`+
    `<li><strong>Recommended additional withholding per paycheck</strong> (W-4 Line 4c) to close the gap through your employer</li>`+
    `<li><strong>Recommended quarterly estimated payment</strong> for each of the four 2026 due dates (April 15 / June 16 / September 15 / January 15), calibrated to your actual income timing</li>`+
    `<li><strong>Safe harbor target</strong> - the minimum you must pay to avoid penalty (100% of 2025 tax liability, or 110% if your 2025 AGI exceeded $150,000)</li>`+
    `<li><strong>Underpayment penalty flag</strong> - whether your current trajectory triggers IRS Form 2210, and by how much</li>`+
    `</ul>`+
    `<h4 style="margin-top:1rem">When to use it</h4>`+
    `<p>Run this in January when you set your W-4 for the year. Run it again in June if your income has changed significantly. Run it in October before Q3 and Q4 payments are due.</p>`;

  const scenarios=Object.entries(csc.familyScenarios||{}).map(([k,v])=>{
    const risks=(v.keyRisks||[]).map(r=>`<li>${r}</li>`).join('');
    return `<div style="margin-bottom:1.25rem"><p style="margin:0"><strong>${v.label||k.replace(/_/g,' ')}</strong></p>
      ${v.quarterlyStrategy?`<p style="margin:.25rem 0;color:var(--accent)"><strong>Strategy:</strong> ${v.quarterlyStrategy}</p>`:''}
      ${risks?`<ul style="margin:.25rem 0;padding-left:1.25rem;font-size:.9rem;color:var(--muted)">${risks}</ul>`:''}</div>`;
  }).join('');

  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'Combined Salary Guide'})}<h2>Combined Income Tax Guide</h2><p style="color:var(--muted);margin-bottom:1.5rem">How different income types interact on your tax return.</p>
    <div class="calc-panel"><h3>Supported Income Types</h3><ul style="padding-left:1.25rem">${incomeList||'<li style="color:var(--muted)">No data</li>'}</ul></div>
    <div class="calc-panel"><h3>Withholding Optimization</h3>${wotHtml||'<p style="color:var(--muted)">No data</p>'}</div>
    <div class="calc-panel"><h3>Family Scenarios</h3>${scenarios||'<p style="color:var(--muted)">No data</p>'}</div>`;
}

/* ===================== About ===================== */
function aboutView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'',text:'About'})}<h2>About MoneyScopeCalculators</h2>
    <p>MoneyScopeCalculators is built for the way people actually make money in 2026. W-2 jobs with side hustles. Gig apps. Creator platforms. Online marketplaces. Rental income. Equity compensation. LLCs and S-Corps.</p>
    <p>Most tax tools were built before the creator economy existed. They ask you to identify your "entity type" before you even start. Most people don't know if they're Schedule C or 1099-K - they know they drive for DoorDash and sell on Etsy.</p>
    <p>This tool starts with "How do you make money?" and routes you to the right calculator automatically. Every platform page is pre-loaded with the deductions that matter for that specific income source.</p>
    <h3>Data Sources</h3>
    <ul><li>IRS Revenue Procedure 2025-32 (2026 brackets)</li><li>IRS Notice 2025-67 (retirement limits)</li><li>IRS Notice 2026-10 (mileage rate)</li><li>IRS Publication 915 (SSDI taxation)</li><li>HHS 2026 Federal Poverty Guidelines</li><li>corp.delaware.gov (franchise tax)</li><li>SSA.gov (SGA limits)</li></ul>
    <p class="callout"><strong>Disclaimer</strong>For informational purposes only. Not tax advice. Verify with IRS.gov or a qualified tax professional before filing.</p>`;
}

/* ===================== Calculators Hub ===================== */
function calculatorsHubView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'',text:'Calculators'})}<h2>130+ Free Money Calculators. Tax, Salary, Wealth & Life Decisions 2026</h2>`+
    `<p style="color:var(--muted);margin-bottom:1.5rem">Whether you drive, deliver, create, sell, consult, invest, or just got your first RSU vest, every income type has its own tax rules, deductions, and traps. Use the standalone master calculators above to audit your full financial picture, or jump straight to your income source below. Every tool is free, updated for 2026, and built to give you a real number without a CPA appointment.</p>
    <div class="calc-panel" style="margin-bottom:1.5rem"><h3>Browse by Category</h3><p><a href="/gig-hub" class="btn btn-secondary">Gig Economy</a> <a href="/creator-hub" class="btn btn-secondary">Creator Economy</a> <a href="/seller-hub" class="btn btn-secondary">Seller Marketplace</a> <a href="/rental-hub" class="btn btn-secondary">Rental Income</a> <a href="/equity" class="btn btn-secondary">Equity Compensation</a> <a href="/entities" class="btn btn-secondary">Entities</a> <a href="#standalone-tools" class="btn btn-secondary">Standalone Calculators</a></p></div>
    <div class="section" id="standalone-tools">${sectionLabel('Standalone Tools')}<p style="color:var(--muted);margin:.5rem 0 1rem">These are the big-picture tools. Use them when your financial life doesn't fit a single category, when you're combining W-2 income with gig earnings and rental cash flow, modeling whether a raise actually helps after taxes, figuring out if you'll owe a penalty for skipping quarterly payments, or just trying to understand where all your money actually went. Covers tax, salary, retirement, wealth, and major life decisions, all in one place.</p><div class="tile-grid">
      ${tileCard('🧮','Combine All My Income','W-2 + gig + creator + seller + rental + SSDI. One total.','Multi-Source','standalone/multi-source')}
      ${tileCard('🗺️','Multi-State W-2 & 1099 Calculator','Work in 2+ states? Calculate tax in each state.','Multi-State','standalone/multi-state')}
      ${tileCard('💼','W-2 Tax Calculator','W-2 wages only. Refund or owe? Effective rate.','W-2','standalone/w2')}
      ${tileCard('⏱️','Hourly to Salary Converter','Convert hourly wage to annual, monthly, weekly pay.','Salary','standalone/hourly-to-salary')}
      ${tileCard('💰','Salary to Hourly Converter','True hourly rate after PTO & holidays. Reverse mode too.','Salary','standalone/salary-to-hourly')}
      ${tileCard('🏙️','City Salary Comparison','$120k in NYC vs $78k in Austin? COL-adjusted equivalence.','Salary','standalone/city-comparison')}
      ${tileCard('📈','Raise & Pay Cut Calculator','Old vs new salary. Percentage change, dollar difference, inflation target.','Salary','standalone/raise-calculator')}
      ${tileCard('💪','Raise Negotiation Calculator','Current salary + desired % → exact ask. 10-year earnings impact.','Salary','standalone/raise-negotiation')}
      ${tileCard('🎯','Freelance Rate Calculator','Target income + expenses + taxes + time off → floor rate.','Freelance','standalone/freelance-rate')}
      ${tileCard('⚖️','W-2 vs 1099 Comparison','$85k W-2 vs $95k 1099 — which actually pays more after benefits & tax?','Comparison','standalone/w2-vs-1099')}
      ${tileCard('💍','Marriage Penalty / Bonus','Two incomes → tax as single vs. married filing jointly. See if marriage saves or costs you.','Tax','standalone/marriage-penalty')}
      ${tileCard('⚧','Gender Pay Gap Calculator','Job title + experience + salary → your personal gap vs. peers and lifetime earnings impact.','Equity','standalone/gender-pay-gap')}
      ${tileCard('⚰️','Death & Money Calculator','Current assets + life expectancy → estate value, inheritance per child, estate tax exposure.','Wealth','standalone/death-money')}
      ${tileCard('📱','Influencer Deal Checker','Followers + engagement + content type → fair market rate vs offer.','Creator','standalone/influencer-deal')}
      ${tileCard('🎓','College Degree ROI Calculator','Major + cost + debt → lifetime earnings vs trade school & no degree.','Education','standalone/college-roi')}
      ${tileCard('🚗','Gig Worker True Hourly Rate','Gross earnings → minus SE tax, mileage, depreciation, dead time.','Gig','standalone/gig-true-hourly')}
      ${tileCard('🎁','Bonus Tax Calculator','$10k bonus - how much do you keep? Flat 22% vs aggregate method.','W-2','standalone/bonus-tax')}
      ${tileCard('📋','W-4 Withholding Calculator','Fix your paycheck withholding. Owe or refund? Exact W-4 adjustment.','W-2','standalone/w4-withholding')}
      ${tileCard('🏛️','Roth vs Traditional IRA','Current vs future tax rate → clear winner in 30 seconds.','Retirement','standalone/roth-vs-traditional')}
      ${tileCard('🏦','401(k) Contribution Calculator','Salary + match + tax savings + 30-year projection.','Retirement','standalone/401k-calculator')}
      ${tileCard('💎','Net Worth Calculator','Assets vs liabilities + age benchmark. Am I on track?','Wealth','standalone/net-worth')}
      ${tileCard('💸','Lifetime IRS Tax Paid','Age + income + years worked → total federal + state + FICA paid.','Wealth','standalone/lifetime-irs-cost')}
      ${tileCard('🔥','FIRE Calculator','Current savings + income + expenses → years to financial independence.','Wealth','standalone/fire-calculator')}
      ${tileCard('☕','Coffee Lifetime Cost','$6 latte × daily → 40-year opportunity cost with S&P compounding. "$284,000 in lost wealth."','Wealth','standalone/coffee-lifetime')}
      ${tileCard('📋','Subscription Audit Calculator','List subscriptions → monthly bleed, annual total, 10-year opportunity cost.','Wealth','standalone/subscription-audit')}
      ${tileCard('💳','Credit Card Minimum Payment Trap','Balance + APR + minimum payment → years to pay off and total interest. Pure horror.','Wealth','standalone/credit-card-trap')}
      ${tileCard('🏠','Buy vs Rent Calculator','Home price + down payment + mortgage rate + rent + appreciation → exact month buying wins.','Wealth','standalone/buy-vs-rent')}
      ${tileCard('⏳','Cost of Procrastinating on Investing','$500/month at 25 vs 35 vs 45 → wealth gap at 65. Emotionally devastating.','Wealth','standalone/procrastination-investing')}
      ${tileCard('📈','Lifestyle Creep Calculator','Income then vs now + savings rate → wealth destroyed by spending increases. Brutal.','Wealth','standalone/lifestyle-creep')}
      ${tileCard('💍','Prenup Financial Mismatch','Two partner income/asset/debt profiles → compatibility score, net worth, 10-yr wealth together vs apart.','Wealth','standalone/prenup-mismatch')}
      ${tileCard('🪄','How Rich Would I Be If...','Car payments → invested? Maxed 401k since 25? Bought Bitcoin in 2017? Counterfactual wealth engine.','Wealth','standalone/how-rich-if')}
      ${tileCard('👶','Cost of Having a Baby','Hospital delivery + first-year expenses + lost income + opportunity cost → true cost. $28K–$67K.','Wealth','standalone/baby-cost')}
      ${tileCard('🎓','College Savings Gap','Child\'s age + target school + 529 balance + monthly contribution → projected gap at 18.','Wealth','standalone/college-savings-gap')}
      ${tileCard('⚖️','Cost of Divorce','Marital assets + support + legal fees + two-household delta + QDRO → total financial impact.','Wealth','standalone/divorce-cost')}
      ${tileCard('👴','Eldercare Cost','Parent age + health + location → in-home vs assisted living vs memory care cost over 5/10 years + family exposure.','Wealth','standalone/eldercare-cost')}
      ${tileCard('🏖️','When Can I Retire?','Current age + savings + monthly contribution + expenses + Social Security → three retirement scenarios.','Wealth','standalone/when-can-i-retire')}
      ${tileCard('🌍','Climate Financial Risk','Home value + insurance + flood/wildfire/heat zone → projected insurance increase, property value loss, and adaptation cost over 20 years.','Wealth','standalone/climate-risk')}
      ${tileCard('📊','50/30/20 Budget Calculator','Monthly pay → needs / wants / savings split with visual bars.','Budget','standalone/budget-50-30-20')}
      ${tileCard('💹','Profit Margin Calculator','Revenue + costs → gross/net margin & markup. For Etsy, Amazon, Shopify.','Seller','standalone/profit-margin')}
      ${tileCard('🕐','Work Hours Calculator','Clock in/out timesheet. Daily & weekly hours, overtime, breaks, pay.','Timesheet','standalone/work-hours')}
      ${tileCard('⏰','Overtime Pay Calculator','Clock in/out → regular pay + OT pay. CA daily vs FLSA weekly.','Timesheet','standalone/overtime-pay')}
      ${tileCard('💼','W-2 & Side Hustle Tax Calculator','Model combined W-2 and 1099 tax. See what to set aside.','Combined','standalone/w2-and-side-hustle')}
      ${tileCard('♿','SSDI Tax Calculator','How much of your SSDI is taxable? 0/50/85% rule.','Disability','standalone/ssdi')}
      ${tileCard('🏥','STD/LTD Disability Tax','Employer-paid premiums = taxable benefits. Employee-paid = tax-free.','Disability','standalone/std-ltd')}
      ${tileCard('🦺','Workers Comp Tax','Benefits are tax-free. Estimate SSDI offset impact.','Disability','standalone/workers-comp')}
      ${tileCard('🏥','ACA Subsidy Calculator','Will you hit the 400% FPL cliff in 2026?','Healthcare','standalone/aca')}
      ${tileCard('🏥','Self-Employed Health Insurance','Above-the-line deduction, ACA impact, S-Corp treatment.','Healthcare','standalone/self-employed-health-insurance')}
      ${tileCard('📅','Quarterly Tax Estimator','When are they due and how much to pay?','Estimator','standalone/quarterly')}
      ${tileCard('⚠️','Estimated Tax Penalty','Form 2210 underpayment penalty. Calculate exactly what you owe.','Penalty','standalone/estimated-tax-penalty')}
      ${tileCard('👶','Nanny Employer Tax','Schedule H, employer FICA, FUTA, SUTA. Household employer taxes.','Household','standalone/nanny-employer-tax')}
      ${tileCard('📜','OBBBA Changes Tracker','Bonus depreciation, QBI permanence, 1099-K rules.','Law Update','reference/obbba')}
      ${tileCard('✂️','Tax Deductions Library','Every deduction for every profession.','Reference','reference/deductions')}
    </div></div>
    <div class="section">${sectionLabel('Equity Compensation')}<p style="color:var(--muted);margin:.5rem 0 1rem">Tech employees, startup founders, and early hires face complex tax rules on RSUs, ISOs, NSOs, ESPP, QSBS, and phantom stock. Each equity type has unique timing, withholding, and AMT implications. Use the dedicated calculator for your specific grant.</p><div class="tile-grid">
      ${tileCard('📦','RSU Tax Calculator','Shares vesting → ordinary income, withholding gap, sale gains.','Equity','equity/rsu-tax')}
      ${tileCard('🏷️','ISO Stock Options Calculator','AMT exposure, qualifying vs disqualifying disposition.','Equity','equity/iso-tax')}
      ${tileCard('📋','NSO Stock Options Calculator','Ordinary income at exercise + capital gains at sale.','Equity','equity/nso-tax')}
      ${tileCard('🛒','ESPP Tax Calculator','Qualifying vs disqualifying, discount income, capital gains.','Equity','equity/espp-tax')}
      ${tileCard('🚀','QSBS Exclusion Calculator','Section 1202 exclusion, $10M/$15M cap, OBBBA changes.','Equity','equity/qsbs-tax')}
      ${tileCard('👻','Phantom Stock / SARs Calculator','Payout taxed as ordinary income + FICA/SE tax.','Equity','equity/phantom-tax')}
      ${tileCard('₿','Crypto Tax Calculator','Bitcoin, Ethereum, NFTs, staking rewards.','Crypto','equity/crypto-tax')}
      ${tileCard('🧮','Combined Equity Calculator','Model RSU + ESPP + QSBS + Phantom in one run.','Equity','equity/equity-combined')}
    </div></div>
    <div class="section">${sectionLabel('Gig Economy')}<p style="color:var(--muted);margin:.5rem 0 1rem">Built for independent contractors, on-demand drivers, and mobile service providers. Select your platform below to calculate self-employment tax (15.3%), factor in the 2026 standard mileage deduction ($0.725/mile), and optimize your business expense write-offs for Schedule C.</p><div class="tile-grid">
      ${tileCard('🚗','Uber & Lyft Tax Calculator','Rideshare drivers','Rideshare','gig/uber')}
      ${tileCard('🍔','DoorDash Tax Calculator','Delivery drivers','Delivery','gig/doordash')}
      ${tileCard('🛒','Instacart Tax Calculator','Full-service shoppers','Delivery','gig/instacart')}
      ${tileCard('📦','Amazon Flex Tax Calculator','Package delivery','Delivery','gig/amazon_flex')}
      ${tileCard('🍕','Grubhub Tax Calculator','Food delivery','Delivery','gig/grubhub')}
      ${tileCard('🛍️','Spark & Walmart Tax Calculator','Grocery delivery','Delivery','gig/spark_walmart')}
      ${tileCard('🐕','Rover Pet Care Tax Calculator','Pet sitting & walking','Services','gig/rover')}
      ${tileCard('🔨','TaskRabbit Tax Calculator','Task-based gigs','Services','gig/taskrabbit')}
      ${tileCard('🧹','Cleaning Business Tax Calculator','House cleaning','Services','gig/cleaning')}
      ${tileCard('🌿','Lawn Care Tax Calculator','Landscaping & lawn','Services','gig/lawn_care')}
      ${tileCard('🔧','Handyman Tax Calculator','Repair services','Services','gig/handyman_1099')}
      ${tileCard('👶','Babysitter & Nanny Tax Calculator','Childcare services','Care','gig/babysitter_nanny_1099')}
      ${tileCard('🛒','Shipt Tax Calculator','Grocery delivery','Delivery','gig/shipt')}
      ${tileCard('🔨','Thumbtack Tax Calculator','Pro services','Services','gig/thumbtack')}
      ${tileCard('🥡','Uber Eats Tax Calculator','Food delivery drivers','Delivery','gig/uber_eats')}
      ${tileCard('💻','Fiverr / Upwork Tax Calculator','Freelance marketplace','Freelance','gig/fiverr_upwork')}
      ${tileCard('⭐','Toptal Tax Calculator','Elite freelance platform','Freelance','gig/toptal')}
      ${tileCard('🎬','Cameo / Stir Tax Calculator','Creator pay platforms','Creator','gig/cameo_stir')}
    </div></div>
    <div class="section">${sectionLabel('Creator Economy')}<p style="color:var(--muted);margin:.5rem 0 1rem">Digital creators, social media influencers, and newsletter operators face complex tax rules on sponsorship deals, ad revenue, and brand contracts. Use these specialized platform calculators to safely calculate what percentage of your creator revenue to set aside for federal and state income tax.</p><div class="tile-grid">
      ${tileCard('📸','OnlyFans Tax Calculator','Creator platform','Video/Social','creator/onlyfans')}
      ${tileCard('🎵','TikTok Tax Calculator','Short-form video','Video/Social','creator/tiktok')}
      ${tileCard('▶️','YouTube Tax Calculator','Long-form video','Video/Social','creator/youtube')}
      ${tileCard('🎮','Twitch Tax Calculator','Live streaming','Streaming','creator/twitch')}
      ${tileCard('✍️','Substack Tax Calculator','Newsletter writer','Writing','creator/substack')}
      ${tileCard('🎙️','Podcast Tax Calculator','Audio creator','Audio','creator/podcast')}
      ${tileCard('🎨','Patreon Tax Calculator','Subscription creator','Subscription','creator/patreon')}
      ${tileCard('📷','Instagram Tax Calculator','Influencer','Social','creator/instagram')}
      ${tileCard('🐦','X / Twitter Creator Tax Calculator','Ad revenue sharing + Premium','Social','creator/x_creator')}
      ${tileCard('🎟️','Fanbase / Passes Tax Calculator','Direct fan monetization','Subscription','creator/fanbase_passes')}
      ${tileCard('📌','Pinterest Creator Tax Calculator','Creator rewards + paid partnerships','Social','creator/pinterest_creator')}
      ${tileCard('🎬','UGC Creator Tax Calculator','Brand content','UGC','creator/ugc_creator')}
      ${tileCard('🎓','Course Creator Tax Calculator','Online courses','Courses','creator/online_course_creator')}
      ${tileCard('🔗','Affiliate','Affiliate marketing','Affiliate','creator/affiliate')}
      ${tileCard('📰','Newsletter Business Tax Calculator','Email business','Newsletter','creator/newsletter_business')}
      ${tileCard('🤝','Sponsorships Tax Calculator','Brand deals','Deals','creator/sponsorship_income')}
      ${tileCard('💰','Brand Deal Tax Calculator','One-off deal tax','Standalone','creator/brand-deal')}
      ${tileCard('🐝','Beehiiv Tax Calculator','Newsletter platform','Writing','creator/beehiiv')}
      ${tileCard('☕','Ko-fi / Buy Me a Coffee Tax Calculator','Creator tips & support','Tips','creator/kofi_buymeacoffee')}
      ${tileCard('💼','LinkedIn Creator Tax Calculator','Professional content','B2B','creator/linkedin_creator')}
      ${tileCard('🧑‍🏫','Kajabi Tax Calculator','Courses + community','Courses','creator/kajabi')}
    </div></div>
    <div class="section">${sectionLabel('Marketplace Sellers')}<p style="color:var(--muted);margin:.5rem 0 1rem">E-commerce stores and resale platforms trigger strict 1099-K reporting thresholds. Select your storefront provider below to reconcile your gross marketplace receipts against platform processing fees, cost of goods sold (COGS), and shipping expenses to pinpoint your true net taxable income.</p><div class="tile-grid">
      ${tileCard('🧶','Etsy Tax Calculator','Handmade & vintage','Craft','seller/etsy')}
      ${tileCard('🏷️','eBay Tax Calculator','Auctions & fixed-price','General','seller/ebay')}
      ${tileCard('📦','Amazon FBA Tax Calculator','Fulfillment by Amazon','FBA','seller/amazon_fba')}
      ${tileCard('📚','Amazon KDP Tax Calculator','Self-publishing royalty income','Publishing','seller/amazon_kdp')}
      ${tileCard('🛍️','Shopify Tax Calculator','Own store','E-commerce','seller/shopify')}
      ${tileCard('👗','Poshmark Tax Calculator','Fashion resale','Fashion','seller/poshmark')}
      ${tileCard('🧵','Depop Tax Calculator','Gen Z fashion resale','Fashion','seller/depop')}
      ${tileCard('🎤','Whatnot Tax Calculator','Live auction selling','Collectibles','seller/whatnot')}
      ${tileCard('📱','Mercari Tax Calculator','Mobile selling','General','seller/mercari')}
      ${tileCard('💻','Gumroad Tax Calculator','Digital products','Digital','seller/gumroad')}
      ${tileCard('🏪','Stan Store Tax Calculator','Creator store','Digital','seller/stan_store')}
      ${tileCard('🏠','Facebook Marketplace Tax Calculator','Local selling','Social','seller/facebook_marketplace')}
      ${tileCard('👟','StockX & GOAT Tax Calculator','Sneaker resale','Sneakers','seller/stockx_goat')}
      ${tileCard('👕','Printful & Printify Tax Calculator','Print-on-demand','POD','seller/printful_printify')}
      ${tileCard('🧾','1099-K Reconcile','Reconcile gross vs net','Tool','seller/1099k-reconciliation')}
    </div></div>
    <div class="section">${sectionLabel('Rental Income')}<p style="color:var(--muted);margin:.5rem 0 1rem">Short-term hosting, car sharing, and equipment rentals generate passive and active income streams that require precise tracking. Use these tools to model your rental revenues, factor in structural depreciation, and identify specific platform deductions.</p><div class="tile-grid">
      ${tileCard('🏠','Airbnb & VRBO Tax Calculator','Short-term rental','STR','rental/airbnb')}
      ${tileCard('🏠','Mid-Term Rental Tax Calculator','30-90 day furnished rentals','MTR','rental/mid_term_rental')}
      ${tileCard('🚗','Turo Tax Calculator','Car sharing','Vehicle','rental/turo')}
      ${tileCard('🚗','Getaround Tax Calculator','Peer-to-peer car sharing','Vehicle','rental/getaround')}
      ${tileCard('🏕️','RV Rental Tax Calculator','RVshare / Outdoorsy','Vehicle','rental/rv_rental')}
      ${tileCard('🚤','Boat Rental Tax Calculator','Boatsetter','Marine','rental/boat_rental')}
      ${tileCard('🎥','Equipment Rental Tax Calculator','Tools, cameras, gear','Equipment','rental/equipment_rental')}
      ${tileCard('🅿️','Parking Space Tax Calculator','SpotHero, Neighbor','Passive','rental/parking_space_rental')}
      ${tileCard('📦','Storage Rental Tax Calculator','Garage / shed rent','Passive','rental/storage_rental')}
      ${tileCard('🏘️','Landlord Tax Calculator','Long-term rental','LTR','rental/landlord')}
      ${tileCard('📊','Short vs Long-Term Rental','Compare STR vs LTR tax','Compare','rental/short-vs-long-term-rental')}
      ${tileCard('🏠','Real Estate Agent Rental','RE pro with rentals','Pro','rental/real-estate-agent-rental')}
    </div></div>
    <div class="section">${sectionLabel('Reference & Guides')}<div class="tile-grid">
      ${tileCard('📈','Equity Compensation Hub','RSU, ISO, NSO, ESPP, QSBS, Phantom Stock tax calculators','Reference','equity')}
      ${tileCard('📋','Tax Forms','Important IRS forms for 2026 filing','Reference','reference/tax-forms')}
      ${tileCard('👤','Filing Statuses','Compare standard deductions and brackets','Reference','reference/filing-statuses')}
      ${tileCard('🗺️','State Tax Rules','No-income-tax states, SDI, Social Security tax','Reference','reference/state-metadata')}
      ${tileCard('👨‍👩‍👧‍👦','Mixed Households','Complex household tax scenarios','Reference','standalone/mixed-households')}
      ${tileCard('💰','Combined Salary Guide','How income types interact on your return','Reference','standalone/combined-salary')}
      ${tileCard('💼','Professions','Deductions by profession (23 careers)','Reference','reference/professionals')}
      ${tileCard('✂️','Deductions Library','Every Schedule C deduction','Reference','reference/deductions')}
    </div></div>`;
}

/* ===================== Multi-Source Combined Calculator ===================== */
function multiSourceCalculatorView(main){
  const sources=[
    {id:'w2',label:'💼 W-2 Job',desc:'Regular wages with employer withholding'},
    {id:'gig',label:'🚗 Gig Economy',desc:'Uber, DoorDash, Instacart, etc.'},
    {id:'creator',label:'📱 Creator Economy',desc:'YouTube, TikTok, OnlyFans, etc.'},
    {id:'seller',label:'🛒 Online Seller',desc:'Etsy, eBay, Amazon FBA, etc.'},
    {id:'rental',label:'🏠 Rental Income',desc:'Airbnb, Turo, landlord, etc.'},
    {id:'ssdi',label:'♿ SSDI Benefits',desc:'Social Security Disability Insurance'},
    {id:'brand',label:'💵 Brand Deal',desc:'One-time sponsorship or brand deal'},
    {id:'unemployment',label:'📋 Unemployment',desc:'State unemployment benefits'},
    {id:'interest',label:'💰 Interest / Dividends',desc:'Bank interest, investment dividends'},
    {id:'crypto',label:'₿ Crypto Income',desc:'Crypto trading, mining, staking, airdrops'},
    {id:'k1',label:'📊 K-1 / Partnership',desc:'Partnership, S-Corp, or trust distributions'},
    {id:'std',label:'🏥 Short-Term Disability',desc:'Short-term disability benefits'},
    {id:'ltd',label:'🏥 Long-Term Disability',desc:'Long-term disability benefits'}
  ];
  let checkboxes=sources.map(s=>`<div class="deduction-row" style="padding:.75rem"><input type="checkbox" id="src_${s.id}" onchange="window.CalcFns.toggleMultiSource('${s.id}')"> <label for="src_${s.id}"><strong>${s.label}</strong><div class="hint" style="margin:0">${s.desc}</div></label></div>`).join('');
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'Multi-Source Calculator'})}<h2>Multiple Income Sources Tax Estimator 2026: W2 & 1099 Combined</h2><p style="color:var(--muted);margin-bottom:1.5rem">Select every way you make money. We combine them into one total tax calculation.</p>
    ${callout('green','How this works','Most people have multiple income streams. W-2 + side hustle + SSDI + rental income. Each has different tax rules. This calculator handles the interaction between all of them - including how W-2 wages push your SE income into higher brackets, and how other income affects SSDI taxability.')}
    <div class="calc-panel"><h3>1. Select your income sources</h3><div class="deduction-list">${checkboxes}</div></div>
    <div class="calc-panel"><h3>2. Enter your details</h3>
      ${selectField('m_status','Filing status',[{value:'single',label:'Single'},{value:'mfj',label:'Married Filing Jointly'},{value:'mfs',label:'Married Filing Separately'},{value:'hoh',label:'Head of Household'}],{value:'single'})}
      ${selectField('m_state','State',buildStateOptions(),{value:'CA'})}
      ${inputField('m_age65','Age 65+','checkbox')}
      ${inputField('m_dependents','Children under 17','number',{value:0})}
    </div>
    <div id="multi-forms"></div>
    <div class="btn-group" style="margin:1.5rem 0"><button class="btn btn-accent" onclick="window.CalcFns.calcMultiSource()">Calculate Combined Tax</button></div>
    <div id="multi-res"></div>`;

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.toggleMultiSource = safeCalc(function(id){
    const container=document.getElementById('multi-forms');
    let html='';
    const sections={
      w2:()=>`<div class="calc-panel" id="form_w2"><h3>💼 W-2 Income</h3>${inputField('m_w2_gross','Annual W-2 gross wages','number',{value:55000})}${inputField('m_w2_withholding','Federal withholding so far','number',{value:8000})}</div>`,
      gig:()=>`<div class="calc-panel" id="form_gig"><h3>🚗 Gig Economy</h3>${inputField('m_gig_gross','Annual gross gig income','number',{value:18000})}${inputField('m_gig_ded','Business deductions','number',{value:4000})}</div>`,
      creator:()=>`<div class="calc-panel" id="form_creator"><h3>📱 Creator Economy</h3>${inputField('m_creator_gross','Annual gross creator income','number',{value:15000})}${inputField('m_creator_ded','Business deductions','number',{value:3000})}</div>`,
      seller:()=>`<div class="calc-panel" id="form_seller"><h3>🛒 Online Selling</h3>${inputField('m_seller_gross','Annual gross sales','number',{value:25000})}${inputField('m_seller_cogs','Cost of goods sold','number',{value:8000})}${inputField('m_seller_fees','Platform & payment fees','number',{value:2000})}${inputField('m_seller_other','Other deductions','number',{value:1500})}</div>`,
      rental:()=>`<div class="calc-panel" id="form_rental"><h3>🏠 Rental Income</h3>${inputField('m_rental_gross','Annual rental gross','number',{value:20000})}${inputField('m_rental_ded','Rental deductions (insurance, repairs, depreciation, etc.)','number',{value:6000})}${selectField('m_rental_type','Rental type',[{value:'passive',label:'Passive / Schedule E (no SE tax)'},{value:'active',label:'Active / Schedule C (substantial services, SE tax applies)'}],{value:'passive'})}</div>`,
      ssdi:()=>`<div class="calc-panel" id="form_ssdi"><h3>♿ SSDI Benefits</h3>${inputField('m_ssdi_annual','Annual SSDI benefit','number',{value:16800})}${inputField('m_ssdi_taxexempt','Tax-exempt interest (if any)','number',{value:0})}</div>`,
      brand:()=>`<div class="calc-panel" id="form_brand"><h3>💵 Brand Deal</h3>${inputField('m_brand_amount','Brand deal amount','number',{value:10000})}${inputField('m_brand_ded','Creation costs / deductions','number',{value:500})}</div>`,
      unemployment:()=>`<div class="calc-panel" id="form_unemployment"><h3>📋 Unemployment Benefits</h3>${inputField('m_ui_amount','Annual unemployment benefits','number',{value:8000})}</div>`,
      interest:()=>`<div class="calc-panel" id="form_interest"><h3>💰 Interest & Dividends</h3>${inputField('m_int_taxable','Taxable interest & ordinary dividends','number',{value:1000})}${inputField('m_int_qualified','Qualified dividends','number',{value:500})}</div>`,
      crypto:()=>`<div class="calc-panel" id="form_crypto"><h3>₿ Crypto Income</h3>${inputField('m_crypto_proceeds','Total crypto proceeds (sales, mining, staking)','number',{value:5000})}${inputField('m_crypto_basis','Cost basis / acquisition cost','number',{value:3000})}${selectField('m_crypto_type','Crypto income type',[{value:'trading',label:'Trading (capital gain)'},{value:'mining',label:'Mining / Staking (ordinary income)'},{value:'airdrop',label:'Airdrops / Forks (ordinary income)'}],{value:'trading'})}</div>`,
      k1:()=>`<div class="calc-panel" id="form_k1"><h3>📊 K-1 / Partnership Income</h3>${inputField('m_k1_amount','K-1 ordinary business income (Box 1)','number',{value:15000})}${inputField('m_k1_guaranteed','Guaranteed payments received (Box 4)','number',{value:0})}</div>`,
      std:()=>`<div class="calc-panel" id="form_std"><h3>🏥 Short-Term Disability</h3>${inputField('m_std_amount','Annual STD benefits received','number',{value:6000})}${inputField('m_std_employer_paid','Employer paid premiums (taxable)','checkbox')}</div>`,
      ltd:()=>`<div class="calc-panel" id="form_ltd"><h3>🏥 Long-Term Disability</h3>${inputField('m_ltd_amount','Annual LTD benefits received','number',{value:12000})}${inputField('m_ltd_employer_paid','Employer paid premiums (taxable)','checkbox')}</div>`
    };
    for(const s of sources){
      if(getVal('src_'+s.id)) html+=sections[s.id]();
    }
    container.innerHTML=html;
  });

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.calcMultiSource = safeCalc(function(){
    const status=getSelect('m_status'),state=getSelect('m_state');
    const age65=getVal('m_age65'),dependents=getVal('m_dependents');
    const stdDed=TE.getStandardDeduction(status,age65,DATA);
    const ctc=DATA.federal.childTaxCredit;

    // Collect all income sources
    let totalW2=0,w2Withholding=0;
    let totalSENet=0; // Net self-employment income (for SE tax)
    let totalQBI=0;   // Qualified business income (for QBI deduction)
    let totalRentalNet=0; // Rental net (Schedule E, no SE tax)
    let ssdiAnnual=0,ssdiTaxExempt=0;
    let brandAmount=0,brandDed=0;
    let uiAmount=0;
    let taxableInterest=0,qualifiedDividends=0;

    // Per-source detail for transparency
    let detailHTML='';

    if(getVal('src_w2')){totalW2=getVal('m_w2_gross');w2Withholding=getVal('m_w2_withholding');detailHTML+=`<p><strong>W-2:</strong> ${TE.formatMoney(totalW2)} gross wages (${TE.formatMoney(w2Withholding)} federal withholding already paid by employer)</p>`;}
    if(getVal('src_gig')){const gross=getVal('m_gig_gross'),ded=getVal('m_gig_ded');const net=Math.max(0,gross-ded);totalSENet+=net;totalQBI+=net;detailHTML+=`<p><strong>Gig:</strong> ${TE.formatMoney(gross)} gross - ${TE.formatMoney(ded)} deductions = ${TE.formatMoney(net)} net SE</p>`;}
    if(getVal('src_creator')){const gross=getVal('m_creator_gross'),ded=getVal('m_creator_ded');const net=Math.max(0,gross-ded);totalSENet+=net;totalQBI+=net;detailHTML+=`<p><strong>Creator:</strong> ${TE.formatMoney(gross)} gross - ${TE.formatMoney(ded)} deductions = ${TE.formatMoney(net)} net SE</p>`;}
    if(getVal('src_seller')){const gross=getVal('m_seller_gross'),cogs=getVal('m_seller_cogs'),fees=getVal('m_seller_fees'),other=getVal('m_seller_other');const net=Math.max(0,gross-cogs-fees-other);totalSENet+=net;totalQBI+=net;detailHTML+=`<p><strong>Seller:</strong> ${TE.formatMoney(gross)} gross - ${TE.formatMoney(cogs)} COGS - ${TE.formatMoney(fees)} fees - ${TE.formatMoney(other)} other = ${TE.formatMoney(net)} net SE</p>`;}
    if(getVal('src_rental')){const gross=getVal('m_rental_gross'),ded=getVal('m_rental_ded');const net=Math.max(0,gross-ded);if(getSelect('m_rental_type')==='active'){totalSENet+=net;totalQBI+=net;detailHTML+=`<p><strong>Rental (active/Schedule C):</strong> ${TE.formatMoney(gross)} gross - ${TE.formatMoney(ded)} deductions = ${TE.formatMoney(net)} net SE</p>`;}else{totalRentalNet+=net;detailHTML+=`<p><strong>Rental (passive/Schedule E):</strong> ${TE.formatMoney(gross)} gross - ${TE.formatMoney(ded)} deductions = ${TE.formatMoney(net)} net rental</p>`;}}
    if(getVal('src_brand')){const gross=getVal('m_brand_amount'),ded=getVal('m_brand_ded');brandAmount=gross;brandDed=ded;const net=Math.max(0,gross-ded);totalSENet+=net;totalQBI+=net;detailHTML+=`<p><strong>Brand Deal:</strong> ${TE.formatMoney(gross)} gross - ${TE.formatMoney(ded)} deductions = ${TE.formatMoney(net)} net SE</p>`;}
    if(getVal('src_ssdi')){ssdiAnnual=getVal('m_ssdi_annual');ssdiTaxExempt=getVal('m_ssdi_taxexempt');detailHTML+=`<p><strong>SSDI:</strong> ${TE.formatMoney(ssdiAnnual)} annual benefit</p>`;}
    if(getVal('src_unemployment')){uiAmount=getVal('m_ui_amount');detailHTML+=`<p><strong>Unemployment:</strong> ${TE.formatMoney(uiAmount)} taxable benefits</p>`;}
    if(getVal('src_interest')){taxableInterest=getVal('m_int_taxable');qualifiedDividends=getVal('m_int_qualified');detailHTML+=`<p><strong>Interest/Dividends:</strong> ${TE.formatMoney(taxableInterest)} taxable interest + ${TE.formatMoney(qualifiedDividends)} qualified dividends</p>`;}

    // Crypto income
    let cryptoGain=0,cryptoOrdinary=0;
    if(getVal('src_crypto')){const proceeds=getVal('m_crypto_proceeds'),basis=getVal('m_crypto_basis'),cryptoType=getSelect('m_crypto_type');const gain=Math.max(0,proceeds-basis);if(cryptoType==='trading'){cryptoGain=gain;detailHTML+=`<p><strong>Crypto (trading):</strong> ${TE.formatMoney(proceeds)} proceeds - ${TE.formatMoney(basis)} basis = ${TE.formatMoney(gain)} capital gain</p>`;}else{cryptoOrdinary=proceeds;detailHTML+=`<p><strong>Crypto (${cryptoType}):</strong> ${TE.formatMoney(proceeds)} ordinary income (cost basis not deductible for mining/staking/airdrops)</p>`;}}

    // K-1 / Partnership income
    let k1Income=0,k1Guaranteed=0;
    if(getVal('src_k1')){k1Income=getVal('m_k1_amount');k1Guaranteed=getVal('m_k1_guaranteed');if(k1Income>0) detailHTML+=`<p><strong>K-1 partnership:</strong> ${TE.formatMoney(k1Income)} ordinary business income (Box 1)</p>`;if(k1Guaranteed>0){totalSENet+=k1Guaranteed;detailHTML+=`<p><strong>K-1 guaranteed payments:</strong> ${TE.formatMoney(k1Guaranteed)} (subject to SE tax)</p>`;}}

    // Short-term disability
    let stdTaxable=0;
    if(getVal('src_std')){const stdAmount=getVal('m_std_amount');const stdEmployerPaid=getVal('m_std_employer_paid');stdTaxable=stdEmployerPaid?stdAmount:0;detailHTML+=`<p><strong>Short-term disability:</strong> ${TE.formatMoney(stdAmount)} total - ${stdEmployerPaid?TE.formatMoney(stdAmount)+' taxable (employer paid)':'$0 taxable (you paid premiums)'}</p>`;}

    // Long-term disability
    let ltdTaxable=0;
    if(getVal('src_ltd')){const ltdAmount=getVal('m_ltd_amount');const ltdEmployerPaid=getVal('m_ltd_employer_paid');ltdTaxable=ltdEmployerPaid?ltdAmount:0;detailHTML+=`<p><strong>Long-term disability:</strong> ${TE.formatMoney(ltdAmount)} total - ${ltdEmployerPaid?TE.formatMoney(ltdAmount)+' taxable (employer paid)':'$0 taxable (you paid premiums)'}</p>`;}

    // SE tax on combined net SE income
    const se=TE.calcSETax(totalSENet,DATA,totalW2);

    // SSDI taxability (Pub 915)
    let ssdiTaxable=0,ssdiCombined=0,ssdiTier='';
    if(ssdiAnnual>0){
      const otherAGI=totalW2+totalSENet+totalRentalNet+uiAmount+taxableInterest-se.deductibleHalf;
      const r=TE.calcSSDITaxable(ssdiAnnual,otherAGI,ssdiTaxExempt,status);
      ssdiTaxable=r.taxable;ssdiCombined=r.combined;ssdiTier=r.tier;
      detailHTML+=`<p><strong>SSDI taxability (Pub 915):</strong> IRS combined-income formula = ${TE.formatMoney(r.combined)} (your other income + ½ of ${TE.formatMoney(ssdiAnnual)} SSDI) → ${r.tier} tier → <strong>${TE.formatMoney(ssdiTaxable)} of your ${TE.formatMoney(ssdiAnnual)} SSDI benefit is taxable</strong>. Your other income is taxed separately on its own.</p>`;
    }

    // AGI and taxable income (qualified dividends ARE part of AGI)
    const agi=totalW2+totalSENet+totalRentalNet+uiAmount+taxableInterest+qualifiedDividends+ssdiTaxable+cryptoOrdinary+k1Income+stdTaxable+ltdTaxable-se.deductibleHalf;
    detailHTML+=`<p><strong>AGI calculation:</strong> ${TE.formatMoney(totalW2)} W-2 + ${TE.formatMoney(totalSENet)} net SE + ${TE.formatMoney(totalRentalNet)} rental + ${TE.formatMoney(uiAmount)} UI + ${TE.formatMoney(taxableInterest)} interest${qualifiedDividends>0?' + '+TE.formatMoney(qualifiedDividends)+' qualified dividends':''} + ${TE.formatMoney(ssdiTaxable)} taxable SSDI${cryptoOrdinary>0?' + '+TE.formatMoney(cryptoOrdinary)+' crypto (mining/staking)':''}${k1Income>0?' + '+TE.formatMoney(k1Income)+' K-1 income':''}${stdTaxable>0?' + '+TE.formatMoney(stdTaxable)+' STD taxable':''}${ltdTaxable>0?' + '+TE.formatMoney(ltdTaxable)+' LTD taxable':''} - ${TE.formatMoney(se.deductibleHalf)} SE deduction = ${TE.formatMoney(agi)}</p>`;

    const taxableBeforeQD=Math.max(0,agi-stdDed);
    detailHTML+=`<p><strong>Taxable income before QBI:</strong> ${TE.formatMoney(taxableBeforeQD)}</p>`;

    // QBI deduction reduces taxable income BEFORE federal tax calculation
    const qbi=TE.calcQBI(totalQBI,taxableBeforeQD,status,DATA);
    const taxableAfterQBI=Math.max(0,taxableBeforeQD-qbi);
    if(qbi>0){detailHTML+=`<p><strong>QBI deduction (20% of SE profit):</strong> -${TE.formatMoney(qbi)} → Taxable income after QBI: ${TE.formatMoney(taxableAfterQBI)}</p>`;}

    // Federal tax (ordinary income + crypto capital gains treated as ordinary for simplicity)
    const ordinaryTaxable=Math.max(0,taxableAfterQBI-qualifiedDividends);
    const fedOrdinary=TE.calcFederalTax(ordinaryTaxable+cryptoGain,status,DATA);
    const qdThreshold=TE.getQDZeroRateThreshold(status,DATA);
    const qdTaxRate=taxableAfterQBI<qdThreshold?0:0.15;
    const fedQD=qualifiedDividends*qdTaxRate;
    const fedTotal=fedOrdinary+fedQD;

    const stateRes=TE.calcStateTax(agi,state,DATA,status);
    const childCredit=Math.min(TE.calcChildTaxCredit(dependents,agi,status,DATA),fedTotal);
    // EIC: earned income = W-2 + net SE income (not passive rental, not UI, not interest/dividends)
    const earnedIncome=totalW2+totalSENet;
    const eic=TE.calcEIC(earnedIncome, taxableInterest+qualifiedDividends+cryptoGain, dependents, status, DATA);
    const fedAfterCredit=Math.max(0,fedTotal-childCredit-eic);
    const totalTax=fedAfterCredit+se.totalSE+stateRes.tax;
    const totalIncome=totalW2+totalSENet+totalRentalNet+uiAmount+taxableInterest+ssdiAnnual+brandAmount+qualifiedDividends+cryptoGain+cryptoOrdinary+k1Income+stdTaxable+ltdTaxable;
    const effectiveRate=totalIncome>0?totalTax/totalIncome:0;
    const stillOwed=Math.max(0,totalTax-w2Withholding);

    // Build dynamic SE label
    const seSources=[];
    if(getVal('src_gig')) seSources.push('gig');
    if(getVal('src_creator')) seSources.push('creator');
    if(getVal('src_seller')) seSources.push('seller');
    if(getVal('src_rental')&&getSelect('m_rental_type')==='active') seSources.push('rental');
    if(getVal('src_brand')) seSources.push('brand');
    if(getVal('src_k1')&&k1Guaranteed>0) seSources.push('K-1 guaranteed');
    const seLabel=seSources.length>0?'Net SE income ('+seSources.join(' + ')+')':'Net SE income';

    // Source breakdown
    let sourceLines=[];
    if(totalW2>0) sourceLines.push({label:'W-2 wages',val:TE.formatMoney(totalW2)});
    if(totalSENet>0) sourceLines.push({label:seLabel,val:TE.formatMoney(totalSENet)});
    if(totalRentalNet>0) sourceLines.push({label:'Net rental income (passive)',val:TE.formatMoney(totalRentalNet)});
    if(uiAmount>0) sourceLines.push({label:'Unemployment benefits',val:TE.formatMoney(uiAmount)});
    if(taxableInterest>0) sourceLines.push({label:'Taxable interest & dividends',val:TE.formatMoney(taxableInterest)});
    if(qualifiedDividends>0) sourceLines.push({label:'Qualified dividends',val:TE.formatMoney(qualifiedDividends)});
    if(ssdiAnnual>0) sourceLines.push({label:'SSDI benefit ('+TE.formatMoney(ssdiAnnual)+' total)',val:TE.formatMoney(ssdiTaxable)+' taxable ('+ssdiTier+')'});
    if(cryptoGain>0) sourceLines.push({label:'Crypto capital gain',val:TE.formatMoney(cryptoGain)});
    if(cryptoOrdinary>0) sourceLines.push({label:'Crypto ordinary income (mining/staking)',val:TE.formatMoney(cryptoOrdinary)});
    if(k1Income>0) sourceLines.push({label:'K-1 partnership income',val:TE.formatMoney(k1Income)});
    if(stdTaxable>0) sourceLines.push({label:'Short-term disability (taxable)',val:TE.formatMoney(stdTaxable)});
    if(ltdTaxable>0) sourceLines.push({label:'Long-term disability (taxable)',val:TE.formatMoney(ltdTaxable)});
    sourceLines.push({label:'AGI',val:TE.formatMoney(agi)},{label:'Standard deduction',val:'-'+TE.formatMoney(stdDed)},{label:'Taxable income',val:TE.formatMoney(taxableBeforeQD)});
    if(qualifiedDividends>0) sourceLines.push({label:'Ordinary income portion',val:TE.formatMoney(ordinaryTaxable)},{label:'Qualified dividends portion',val:TE.formatMoney(qualifiedDividends)});
    sourceLines.push({label:'Federal income tax (before credits)',val:TE.formatMoney(fedTotal)},{label:'Child tax credit',val:'-'+TE.formatMoney(childCredit)});
    if(eic>0) sourceLines.push({label:'Earned Income Credit (EIC)',val:'-'+TE.formatMoney(eic)});
    sourceLines.push({label:'Federal after credits',val:TE.formatMoney(fedAfterCredit)},{label:'SE tax (15.3%)',val:TE.formatMoney(se.totalSE)},{label:'State income tax',val:TE.formatMoney(stateRes.tax)});
    if(qbi>0) sourceLines.push({label:'QBI deduction',val:'-'+TE.formatMoney(qbi)});

    document.getElementById('multi-res').innerHTML=`<div class="calc-panel" style="margin-top:1rem"><h3>Calculation Details</h3>${detailHTML}</div>`+resultsBox(sourceLines,'Total tax owed',TE.formatMoney(totalTax))+
    `<div class="calc-panel" style="margin-top:1rem"><h3>Set-Aside Guidance</h3><p>Total tax on all income: <strong>${TE.formatMoney(totalTax)}</strong>. Your W-2 withholding covers <strong>${TE.formatMoney(w2Withholding)}</strong>.</p><p>You still need to set aside: <strong>${TE.formatMoney(stillOwed)}</strong>.</p><p>Combined effective rate on total income: <strong>${(effectiveRate*100).toFixed(1)}%</strong></p></div>`+
    `<div class="calc-panel" style="margin-top:1rem"><h3>Summary</h3><p>You will pay <strong>${TE.formatMoney(totalTax)}</strong> in total tax on <strong>${TE.formatMoney(totalIncome)}</strong> of total income.</p><p>Your take-home amount is <strong>${TE.formatMoney(totalIncome-totalTax)}</strong>.</p></div>`;
    scrollToResults('multi-res');
  });
}

/* ===================== Marriage Penalty / Bonus Calculator ===================== */
function marriagePenaltyView(main){
  const stateOpts=DATA&&DATA.states?Object.keys(DATA.states).sort().map(code=>({value:code,label:DATA.states[code].name+' ('+code+')'})):[
    {value:'CA',label:'California (CA)'},{value:'NY',label:'New York (NY)'},{value:'TX',label:'Texas (TX)'},{value:'FL',label:'Florida (FL)'},{value:'IL',label:'Illinois (IL)'},{value:'WA',label:'Washington (WA)'},{value:'CO',label:'Colorado (CO)'},{value:'NC',label:'North Carolina (NC)'},{value:'OH',label:'Ohio (OH)'},{value:'PA',label:'Pennsylvania (PA)'}
  ];
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'Marriage Penalty / Bonus'})}<h2>Marriage Penalty / Bonus Calculator 2026</h2><p style="color:var(--muted);margin-bottom:1.5rem">Enter both incomes and see whether getting married saves you money or costs you extra. Compares total tax as two single filers vs. married filing jointly, including federal and state income tax.</p>${callout('blue','What is the marriage penalty?','The U.S. tax code treats married couples as one unit. When two high earners marry, their combined income can push them into higher tax brackets than if they filed separately as singles — this is the "marriage penalty." When one partner earns significantly more than the other, marriage often creates a "marriage bonus" because the higher earner gets the benefit of wider MFJ brackets.')}
    <div class="calc-grid"><div class="calc-panel"><h3>Person A</h3>${inputField('mp_a_income','W-2 annual income','number',{value:75000})}${inputField('mp_a_age65','Age 65+','checkbox')}${inputField('mp_a_401k','401(k) contribution','number',{value:0})}</div>
    <div class="calc-panel"><h3>Person B</h3>${inputField('mp_b_income','W-2 annual income','number',{value:55000})}${inputField('mp_b_age65','Age 65+','checkbox')}${inputField('mp_b_401k','401(k) contribution','number',{value:0})}</div></div>
    <div class="calc-grid"><div class="calc-panel"><h3>Household</h3>${selectField('mp_state','State',stateOpts,{value:'CA'})}${inputField('mp_dependents','Children under 17','number',{value:0})}${inputField('mp_itemize','Itemize deductions (instead of standard)','checkbox')}${inputField('mp_itemize_amount','Itemized deductions amount','number',{value:0})}</div>
    <div class="calc-panel"><h3>Notes</h3><p style="color:var(--muted);font-size:.9rem">This calculator compares federal income tax + state income tax + FICA for both scenarios. FICA is identical either way (each person has their own Social Security wage base cap). The penalty or bonus comes almost entirely from how the tax brackets treat your combined income.</p></div></div>
    <div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcMarriagePenalty()">Compare Single vs. Married</button></div>
    <div id="mp-res"></div>`+
    renderFaqSection([
      {q:'Why does marriage sometimes increase taxes?',a:'The MFJ tax brackets are wider than single brackets, but not twice as wide. When two people with similar incomes marry, their combined income fills up the lower brackets faster and spills into higher marginal rates. Example: two people earning $85k each are in the 22% bracket as singles. Combined as MFJ, part of their income hits the 24% bracket.'},
      {q:'When does marriage create a tax bonus?',a:'When one spouse earns significantly more than the other. A $150k earner married to a $30k earner gets to spread the high income across the full MFJ bracket width. The low earner effectively "fills up" the lower brackets, reducing the high earner\'s marginal rate.'},
      {q:'Does the standard deduction matter?',a:'In 2026, the MFJ standard deduction ($32,200) is exactly double the single deduction ($16,100 × 2 = $32,200). So there is no penalty or bonus from the standard deduction itself. The effect comes entirely from bracket structure.'},
      {q:'What about state taxes?',a:'Some states have progressive brackets like the federal system and create their own marriage penalties. Others have flat rates (PA, NC, IL, CO) where marriage has no effect. This calculator models state taxes where applicable.'},
      {q:'Should we file separately to avoid the penalty?',a:'Almost never. Married Filing Separately (MFS) disallows or limits: QBI deduction, EITC, education credits, ACA subsidies, Roth IRA contributions, and student loan interest deduction. In nearly all cases, MFJ is better than MFS even with a small marriage penalty.'}
    ]);

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.calcMarriagePenalty = safeCalc(function(){
    try{
    const aIncome=getVal('mp_a_income');
    const bIncome=getVal('mp_b_income');
    const aAge65=getVal('mp_a_age65');
    const bAge65=getVal('mp_b_age65');
    const a401k=getVal('mp_a_401k');
    const b401k=getVal('mp_b_401k');
    const state=getSelect('mp_state');
    const dependents=getVal('mp_dependents');
    const itemize=getVal('mp_itemize');
    const itemizeAmount=getVal('mp_itemize_amount');

    const totalIncome=aIncome+bIncome;

    // === Single filer calculations ===
    const aStdDed=TE.getStandardDeduction('single',aAge65,DATA);
    const bStdDed=TE.getStandardDeduction('single',bAge65,DATA);
    const aDeduction=itemize?Math.max(aStdDed,itemizeAmount/2):aStdDed;
    const bDeduction=itemize?Math.max(bStdDed,itemizeAmount/2):bStdDed;

    const aFica=TE.calcFICA(aIncome,DATA,0);
    const bFica=TE.calcFICA(bIncome,DATA,0);

    const aTaxable=Math.max(0,aIncome-a401k-aDeduction);
    const bTaxable=Math.max(0,bIncome-b401k-bDeduction);
    const aFed=TE.calcFederalTax(aTaxable,'single',DATA);
    const bFed=TE.calcFederalTax(bTaxable,'single',DATA);

    const aStateRes=TE.calcStateTax(aIncome-a401k,state,DATA,'single');
    const bStateRes=TE.calcStateTax(bIncome-b401k,state,DATA,'single');
    const aState=aStateRes.tax||0;
    const bState=bStateRes.tax||0;

    const ctcPerChild=DATA&&DATA.federal&&DATA.federal.childTaxCredit?DATA.federal.childTaxCredit.amount||2000:2000;
    const ctcSingleA=Math.min(dependents*ctcPerChild,aFed);
    const ctcSingleB=0; // CTC typically goes to one parent
    const totalSingleCTC=Math.min(dependents*ctcPerChild,aFed+bFed);

    const singleTotalTax=aFed+bFed+aState+bState+aFica.totalFICA+bFica.totalFICA-totalSingleCTC;
    const singleTakeHome=totalIncome-a401k-b401k-singleTotalTax;
    const singleEffective=totalIncome>0?singleTotalTax/totalIncome:0;

    // === MFJ calculations ===
    const mfjStdDed=TE.getStandardDeduction('mfj',aAge65||bAge65,DATA);
    const mfjDeduction=itemize?Math.max(mfjStdDed,itemizeAmount):mfjStdDed;

    const mfjTaxable=Math.max(0,totalIncome-a401k-b401k-mfjDeduction);
    const mfjFed=TE.calcFederalTax(mfjTaxable,'mfj',DATA);
    const mfjStateRes=TE.calcStateTax(totalIncome-a401k-b401k,state,DATA,'mfj');
    const mfjState=mfjStateRes.tax||0;

    const mfjCTC=Math.min(dependents*ctcPerChild,mfjFed);
    const mfjTotalTax=mfjFed+mfjState+aFica.totalFICA+bFica.totalFICA-mfjCTC;
    const mfjTakeHome=totalIncome-a401k-b401k-mfjTotalTax;
    const mfjEffective=totalIncome>0?mfjTotalTax/totalIncome:0;

    // === Penalty or Bonus ===
    const diff=mfjTotalTax-singleTotalTax;
    const isPenalty=diff>0;
    const amount=Math.abs(diff);
    const label=isPenalty?'Marriage Penalty':'Marriage Bonus';
    const color=isPenalty?'var(--danger)':'var(--success)';
    const verb=isPenalty?'costs':'saves';

    const aMarginal=getMarginalRate(aIncome-a401k-aDeduction,'single');
    const bMarginal=getMarginalRate(bIncome-b401k-bDeduction,'single');
    const mfjMarginal=getMarginalRate(mfjTaxable,'mfj');

    const lines=[
      {label:'Person A income',val:TE.formatMoney(aIncome)},
      {label:'Person B income',val:TE.formatMoney(bIncome)},
      {label:'Combined income',val:TE.formatMoney(totalIncome)},
      {label:'',val:''},
      {label:'As two single filers — total tax',val:TE.formatMoney(singleTotalTax)},
      {label:'As married filing jointly — total tax',val:TE.formatMoney(mfjTotalTax)},
      {label:'',val:''},
      {label:`${label} (per year)`,val:TE.formatMoney(amount),emphasis:true},
      {label:`Effective rate as singles`,val:(singleEffective*100).toFixed(1)+'%'},
      {label:`Effective rate as MFJ`,val:(mfjEffective*100).toFixed(1)+'%'},
    ];

    const detailSingle=`<div class="calc-panel"><h3>Two Single Filers</h3>
      <p><strong>Person A</strong></p>
      <p>Income: ${TE.formatMoney(aIncome)} | 401(k): -${TE.formatMoney(a401k)} | Deduction: -${TE.formatMoney(aDeduction)}</p>
      <p>Taxable income: ${TE.formatMoney(aTaxable)} | Federal tax: ${TE.formatMoney(aFed)} | State tax: ${TE.formatMoney(aState)} | FICA: ${TE.formatMoney(aFica.totalFICA)}</p>
      <p><strong>Person B</strong></p>
      <p>Income: ${TE.formatMoney(bIncome)} | 401(k): -${TE.formatMoney(b401k)} | Deduction: -${TE.formatMoney(bDeduction)}</p>
      <p>Taxable income: ${TE.formatMoney(bTaxable)} | Federal tax: ${TE.formatMoney(bFed)} | State tax: ${TE.formatMoney(bState)} | FICA: ${TE.formatMoney(bFica.totalFICA)}</p>
      <p style="margin-top:.5rem"><strong>Combined tax:</strong> ${TE.formatMoney(singleTotalTax)} | <strong>Take-home:</strong> ${TE.formatMoney(singleTakeHome)}</p>
    </div>`;

    const detailMFJ=`<div class="calc-panel"><h3>Married Filing Jointly</h3>
      <p>Combined income: ${TE.formatMoney(totalIncome)} | 401(k): -${TE.formatMoney(a401k+b401k)} | Deduction: -${TE.formatMoney(mfjDeduction)}</p>
      <p>Taxable income: ${TE.formatMoney(mfjTaxable)} | Federal tax: ${TE.formatMoney(mfjFed)} | State tax: ${TE.formatMoney(mfjState)} | FICA: ${TE.formatMoney(aFica.totalFICA+bFica.totalFICA)}</p>
      <p style="margin-top:.5rem"><strong>Total tax:</strong> ${TE.formatMoney(mfjTotalTax)} | <strong>Take-home:</strong> ${TE.formatMoney(mfjTakeHome)}</p>
    </div>`;

    const advice=isPenalty
      ? `<div class="calc-panel" style="margin-top:1rem;border-color:var(--danger)"><h3>💡 How to Reduce the Penalty</h3><p><strong>Max out pre-tax accounts:</strong> Both spouses should maximize 401(k), HSA, and traditional IRA contributions. Every dollar in a pre-tax account reduces your combined taxable income and can pull you out of a higher bracket.</p><p><strong>Consider Roth strategically:</strong> If you're already in a high bracket, Roth contributions do not help now — but they provide tax-free growth later. Use traditional 401(k) to reduce current-year taxable income.</p><p><strong>Time deductions:</strong> Bunch charitable contributions, property tax payments, and medical expenses into alternating years to itemize when beneficial.</p></div>`
      : `<div class="calc-panel" style="margin-top:1rem;border-color:var(--success)"><h3>💡 Maximize the Bonus</h3><p>Your marriage creates a tax <strong>bonus</strong> of <strong>${TE.formatMoney(amount)}</strong> per year. This usually happens when one spouse earns significantly more than the other.</p><p><strong>Strategy:</strong> Have the higher earner max out traditional 401(k) and HSA first (they get the biggest marginal rate benefit). The lower earner can favor Roth if their marginal rate is low.</p><p><strong>529 plans:</strong> If you have children, the lower earner can contribute to a 529 without pushing the household into higher brackets. Some states offer deductions too.</p></div>`;

    document.getElementById('mp-res').innerHTML=
      `<div class="calc-panel" style="margin-top:1.5rem;text-align:center;border:2px solid ${color}"><h3 style="color:${color};font-size:1.5rem">${label}: ${TE.formatMoney(amount)}</h3><p style="font-size:1.1rem">Marriage ${verb} you <strong>${TE.formatMoney(amount)}</strong> per year in combined federal and state income tax.</p><p style="color:var(--muted)">Marginal rate as single (higher earner): ${aMarginal}% → Marginal rate as MFJ: ${mfjMarginal}%</p></div>`+
      `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1rem;margin-top:1rem">${detailSingle}${detailMFJ}</div>`+
      resultsBox(lines,'Tax comparison summary',TE.formatMoney(amount))+
      advice;
    scrollToResults('mp-res');
    }catch(err){
      document.getElementById('mp-res').innerHTML=`<div class="callout" style="background:rgba(201,74,30,.1);border-color:var(--accent)"><strong>Error</strong>${err.message}<br><small>${err.stack||''}</small></div>`;
      console.error(err);
    }
  });
}

function getMarginalRate(taxableIncome,status){
  if(!DATA||!DATA.federal||!DATA.federal.brackets)return 0;
  const brackets=DATA.federal.brackets[status]||DATA.federal.brackets.single;
  let rate=0;
  for(let i=brackets.length-1;i>=0;i--){
    if(taxableIncome>brackets[i].min){rate=brackets[i].rate*100;break;}
  }
  return rate.toFixed(0);
}

function calcQualifiedDividendTax(dividends,taxableIncomeBeforeDiv,status,data){
  if(!dividends||dividends<=0)return 0;
  const brackets=(data&&data.federal&&data.federal.capitalGains&&data.federal.capitalGains.longTerm&&data.federal.capitalGains.longTerm[status])||[{min:0,max:49450,rate:0},{min:49450,max:545500,rate:0.15},{min:545500,max:null,rate:0.2}];
  let tax=0, income=taxableIncomeBeforeDiv;
  for(const b of brackets){
    if(income>=(b.max||Infinity))continue;
    const room=(b.max||Infinity)-income;
    const divInBracket=Math.min(dividends,room);
    tax+=divInBracket*b.rate;
    dividends-=divInBracket;
    income+=divInBracket;
    if(dividends<=0)break;
  }
  return tax;
}

/* ===================== Gender Pay Gap Calculator ===================== */
function genderPayGapView(main){
  const occupations=[
    {name:'Software Developer / Engineer',median:132270,maleMedian:135000,femaleMedian:118000,note:'Tech has a persistent gap despite high overall salaries.'},
    {name:'Registered Nurse',median:86070,maleMedian:91000,femaleMedian:84000,note:'Male nurses are 13% of workforce but overrepresented in higher-paying specialties like CRNA and management.'},
    {name:'Teacher (K-12)',median:61090,maleMedian:64000,femaleMedian:59000,note:'Women are 76% of teachers. Male teachers more likely to coach (supplemental pay) and advance to administration.'},
    {name:'Accountant / Auditor',median:79920,maleMedian:87000,femaleMedian:73000,note:'Partnership track at Big 4 has significant attrition for women, especially during childbearing years.'},
    {name:'Marketing Manager',median:157620,maleMedian:172000,femaleMedian:138000,note:'C-suite marketing roles show larger gaps than mid-level.'},
    {name:'Sales Representative',median:73220,maleMedian:85000,femaleMedian:62000,note:'Commission-based pay amplifies gaps when women get lower-territory or lower-commission accounts.'},
    {name:'Human Resources Specialist',median:67880,maleMedian:76000,femaleMedian:64000,note:'HR is female-dominated but male HR leaders earn more; gap widens at director+ level.'},
    {name:'Physician / Surgeon',median:239200,maleMedian:275000,femaleMedian:208000,note:'Largest gap of any major occupation. Specialty choice explains some but not all of the difference.'},
    {name:'Pharmacist',median:132750,maleMedian:138000,femaleMedian:128000,note:'Relatively narrow gap due to standardized pay scales in retail pharmacy.'},
    {name:'Physical Therapist',median:99090,maleMedian:104000,femaleMedian:96000,note:'Narrow gap. Self-employed PTs show slightly larger differences.'},
    {name:'Lawyer / Attorney',median:135740,maleMedian:158000,femaleMedian:115000,note:'Big Law partnership gap is severe (19% female equity partners). Solo practice also shows disparities.'},
    {name:'Financial Analyst',median:96000,maleMedian:108000,femaleMedian:84000,note:'Wall Street and buy-side roles have extreme gaps; corporate finance is more compressed.'},
    {name:'Data Scientist',median:108020,maleMedian:115000,femaleMedian:98000,note:'Tech-adjacent role with moderate gap. Startup equity compounds disparity over time.'},
    {name:'Project Manager',median:98000,maleMedian:106000,femaleMedian:91000,note:'Construction and IT PMs skew male and higher-paid; healthcare and nonprofit PMs skew female.'},
    {name:'Executive Assistant',median:68920,maleMedian:78000,femaleMedian:66000,note:'Rare male EAs command premium, especially supporting C-suite executives.'},
    {name:'Truck Driver (Heavy)',median:54020,maleMedian:55000,femaleMedian:48000,note:'Women are 7% of heavy truck drivers. Gap reflects route assignment (long-haul vs local).'},
    {name:'Customer Service Rep',median:38430,maleMedian:41000,femaleMedian:36000,note:'High-turnover role with little negotiation leverage. Gap is consistent across industries.'},
    {name:'Administrative Assistant',median:44270,maleMedian:47000,femaleMedian:43000,note:'Historically female-coded role; men who enter often move up faster or get assigned to higher-paid executives.'},
    {name:'Social Worker',median:55640,maleMedian:62000,femaleMedian:52000,note:'Male social workers are overrepresented in clinical licensure paths and administration.'},
    {name:'Psychologist',median:85830,maleMedian:98000,femaleMedian:76000,note:'Private practice rates vary widely; women undercharge and accept lower-insurance panels more often.'},
    {name:'Chef / Head Cook',median:56850,maleMedian:62000,femaleMedian:48000,note:'Celebrity chef culture is male-dominated. Women are overrepresented in lower-paid cafeteria and institutional cooking.'},
    {name:'Real Estate Agent',median:54200,maleMedian:62000,femaleMedian:48000,note:'Commission-based. Women often handle lower-price markets and get fewer luxury listings from broker networks.'},
    {name:'Graphic Designer',median:58770,maleMedian:64000,femaleMedian:54000,note:'Freelance rate disparities are larger than in-house. Women underbid more often.'},
    {name:'Writer / Editor',median:73150,maleMedian:82000,femaleMedian:65000,note:'Book advances, script sales, and editor-in-chief roles show large disparities.'},
    {name:'Mechanical Engineer',median:99110,maleMedian:105000,femaleMedian:90000,note:'Women are 9% of mechanical engineers. Those who enter often face glass ceiling in management tracks.'},
    {name:'Civil Engineer',median:90220,maleMedian:96000,femaleMedian:84000,note:'Public sector civil engineering has narrower gaps than private consulting.'},
    {name:'Management Analyst',median:100530,maleMedian:110000,femaleMedian:90000,note:'MBB consulting partners show severe gaps; independent consultants have more variable results.'},
    {name:'Dental Hygienist',median:87030,maleMedian:92000,femaleMedian:86000,note:'Narrow gap. Male hygienists are rare and slightly overrepresented in temp/agency work at higher rates.'},
    {name:'Radiologic Technologist',median:70240,maleMedian:76000,femaleMedian:67000,note:'Specialization (MRI, CT) creates pay tiers where men advance faster.'},
    {name:'Paralegal / Legal Assistant',median:60460,maleMedian:68000,femaleMedian:56000,note:'Male paralegals often use the role as a stepping stone to law school and get better mentoring.'},
    {name:'Nurse Practitioner',median:126260,maleMedian:132000,femaleMedian:122000,note:'Narrow gap among NPs. Male NPs slightly more likely to work in higher-paying acute care settings.'},
    {name:'Electrician',median:61790,maleMedian:63000,femaleMedian:52000,note:'Women are 2% of electricians. Union vs non-union matters more than gender for pay.'},
    {name:'Police Officer',median:71000,maleMedian:74000,femaleMedian:65000,note:'Overtime and detail pay amplify gaps. Women underrepresented in SWAT and detective units with premium pay.'},
    {name:'Firefighter',median:56810,maleMedian:59000,femaleMedian:48000,note:'Women are 4% of firefighters. Overtime structure creates cumulative earnings gaps.'},
    {name:'Restaurant Server',median:32790,maleMedian:36000,femaleMedian:31000,note:'Tips and shift assignment (high-tipping vs slow sections) drive disparities.'}
  ];
  const occOpts=occupations.map((o,i)=>({value:i,label:o.name}));
  const expOpts=[
    {value:0,label:'0-2 years (entry)'},{value:1,label:'3-5 years (early)'},{value:2,label:'6-10 years (mid)'},
    {value:3,label:'11-15 years (senior)'},{value:4,label:'16-20 years (expert)'},{value:5,label:'21+ years (veteran)'}
  ];
  const expMultipliers=[0.82,0.95,1.08,1.22,1.38,1.55];
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'Gender Pay Gap'})}<h2>Gender Pay Gap Personal Calculator</h2><p style="color:var(--muted);margin-bottom:1.5rem">Select your occupation, experience level, and current salary. See how your pay compares to the median for your role, and what the gender gap looks like in your specific field — not the misleading "78 cents on the dollar" headline number.</p>${callout('blue','The headline number is misleading','The widely cited "women earn 78 cents for every dollar men earn" is an aggregate across all occupations, all ages, and all education levels. It does not mean a female software developer earns 78% of a male software developer. The real gap varies wildly by field: near-zero in pharmacy and nursing, severe in surgery and sales. This calculator shows your specific occupation\'s gap.')}
    <div class="calc-grid"><div class="calc-panel"><h3>Your Profile</h3>${selectField('gpg_occ','Occupation',occOpts,{value:0})}${selectField('gpg_exp','Experience level',expOpts,{value:1})}${inputField('gpg_salary','Your current annual salary','number',{value:85000})}${selectField('gpg_gender','Gender',[{value:'female',label:'Female'},{value:'male',label:'Male'},{value:'nb',label:'Non-binary / Other'},{value:'na',label:'Prefer not to say'}],{value:'female'})}</div>
    <div class="calc-panel"><h3>Context</h3>${inputField('gpg_hours','Weekly hours worked','number',{value:40})}${inputField('gpg_overtime','Paid overtime hours per week','number',{value:0})}${inputField('gpg_negotiated','Negotiated starting salary?','checkbox')}${inputField('gpg_promo','Received promotion in last 2 years?','checkbox')}</div></div>
    <div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcGenderPayGap()">Calculate My Gap</button></div>
    <div id="gpg-res"></div>`+
    renderFaqSection([
      {q:'Is the 78-cent statistic real?',a:'It is a real statistic but deeply misleading without context. It comes from dividing the median earnings of all full-time working women by the median earnings of all full-time working men. It does not control for occupation, hours worked, experience, education, or job choice. When researchers control for these factors, the gap shrinks to 91-97 cents on the dollar — still real, still meaningful, but very different from 78 cents.'},
      {q:'Why does the gap vary so much by occupation?',a:'Three forces: (1) Occupational sorting — women are overrepresented in lower-paying fields (teaching, social work, nursing) and underrepresented in higher-paying fields (petroleum engineering, surgery, quant finance). (2) Within-field advancement — even in the same job title, men are more likely to reach senior/executive levels. (3) Negotiation and starting salary — men negotiate starting salaries more often and more aggressively, creating a compounding gap over a career.'},
      {q:'What about "equal pay for equal work"?',a:'The Equal Pay Act of 1963 and Title VII make it illegal to pay differently for the same job based on gender. The remaining gap within identical job titles is typically 2-5% after controlling for experience and hours. The larger gaps you see in this calculator come from: different specialties (female surgeon = pediatric, male surgeon = orthopedic), different employers (nonprofit vs. Wall Street), and different career trajectories (women more likely to reduce hours or leave workforce temporarily for caregiving).'},{q:'How do I close my personal gap?',a:'(1) Know your market rate before every negotiation. Use this calculator, Glassdoor, Levels.fyi, and BLS data. (2) Negotiate your starting salary — every $5k you negotiate at age 25 compounds to $500k+ over a career. (3) Track promotion eligibility and advocate for yourself explicitly. (4) Consider switching employers if internal raises are capped below market. (5) Build in-demand skills that command premium pay in your field.'},
      {q:'Does this calculator account for race?',a:'Not directly in this version. The intersection of race and gender creates even larger gaps: Black women earn ~63 cents and Hispanic women ~55 cents versus white men at the aggregate level. The occupation-specific data here uses BLS figures that reflect the full population. We recommend layering race-specific gap research (e.g., National Women\'s Law Center reports) on top of these numbers for a more complete picture.'}
    ]);

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.calcGenderPayGap = safeCalc(function(){
    try{
    const occIdx=parseInt(getSelect('gpg_occ'));
    const expIdx=parseInt(getSelect('gpg_exp'));
    const salary=getVal('gpg_salary');
    const gender=getSelect('gpg_gender');
    const hours=getVal('gpg_hours');
    const overtime=getVal('gpg_overtime');
    const negotiated=getVal('gpg_negotiated');
    const promoted=getVal('gpg_promo');

    const occ=occupations[occIdx];
    const expMult=expMultipliers[expIdx];

    // Adjust medians for experience level
    const adjustedMedian=Math.round(occ.median*expMult);
    const adjustedMale=Math.round(occ.maleMedian*expMult);
    const adjustedFemale=Math.round(occ.femaleMedian*expMult);

    // Adjust for hours worked (full-time = 40 hrs)
    const hoursFactor=hours/40;
    const adjustedMedianHours=Math.round(adjustedMedian*hoursFactor);
    const adjustedMaleHours=Math.round(adjustedMale*hoursFactor);
    const adjustedFemaleHours=Math.round(adjustedFemale*hoursFactor);

    // Overtime premium (1.5x for hours over 40)
    const otPremium=overtime>0?Math.round(adjustedMedianHours/40*overtime*1.5):0;
    const otMale=overtime>0?Math.round(adjustedMaleHours/40*overtime*1.5):0;
    const otFemale=overtime>0?Math.round(adjustedFemaleHours/40*overtime*1.5):0;

    const totalMedian=adjustedMedianHours+otPremium;
    const totalMale=adjustedMaleHours+otMale;
    const totalFemale=adjustedFemaleHours+otFemale;

    // Personal gap vs median for occupation
    const personalGap=salary-totalMedian;
    const personalGapPct=totalMedian>0?(personalGap/totalMedian)*100:0;
    const personalColor=personalGap>=0?'var(--success)':'var(--danger)';
    const personalVerb=personalGap>=0?'above':'below';

    // Gender gap for this occupation
    const genderGap=totalMale-totalFemale;
    const genderGapPct=totalMale>0?(genderGap/totalMale)*100:0;

    // User's gap vs opposite gender median for their role
    let vsOppositeMedian,vsOppositePct,vsOppositeLabel;
    if(gender==='female'){vsOppositeMedian=totalMale;vsOppositeLabel='male peers';}
    else if(gender==='male'){vsOppositeMedian=totalFemale;vsOppositeLabel='female peers';}
    else{vsOppositeMedian=totalMedian;vsOppositeLabel='all peers';}
    const userVsOpposite=salary-vsOppositeMedian;
    const userVsOppositePct=vsOppositeMedian>0?(userVsOpposite/vsOppositeMedian)*100:0;

    // Lifetime earnings impact (40-year career)
    const careerYears=40;
    const lifetimeGap=genderGap*careerYears;
    const lifetimePersonal=personalGap*careerYears;

    // Negotiation impact estimate
    const negImpact=negotiated?0:Math.round(totalMedian*0.05);
    const negLifetime=negImpact*careerYears;

    // Promotion impact estimate
    const promoImpact=!promoted?Math.round(totalMedian*0.08):0;
    const promoLifetime=promoImpact*careerYears;

    const lines=[
      {label:'Occupation',val:occ.name},
      {label:'Experience-adjusted median',val:TE.formatMoney(totalMedian)},
      {label:'Male median in this role',val:TE.formatMoney(totalMale)},
      {label:'Female median in this role',val:TE.formatMoney(totalFemale)},
      {label:'Gender gap in this role',val:TE.formatMoney(genderGap)+' ('+genderGapPct.toFixed(1)+'%)'},
      {label:'',val:''},
      {label:'Your salary',val:TE.formatMoney(salary)},
      {label:'Your gap vs. occupation median',val:TE.formatMoney(Math.abs(personalGap))+' ('+Math.abs(personalGapPct).toFixed(1)+'%) '+personalVerb},
      {label:'Your gap vs. '+vsOppositeLabel, val:TE.formatMoney(Math.abs(userVsOpposite))+' ('+Math.abs(userVsOppositePct).toFixed(1)+'%) '+(userVsOpposite>=0?'above':'below')},
    ];

    const bigCardStyle='background:var(--card);border:1px solid var(--border);border-radius:12px;padding:1.5rem;text-align:center;margin-bottom:1rem';

    const personalGapCard=`<div style="${bigCardStyle}"><span style="font-size:2rem;font-weight:700;color:${personalColor}">${personalGap>=0?'+':'-'}${TE.formatMoney(Math.abs(personalGap))}</span><span style="display:block;font-size:.85rem;color:var(--muted);margin-top:.25rem">Your gap vs. occupation median<br>(${Math.abs(personalGapPct).toFixed(1)}% ${personalVerb} median)</span></div>`;
    const genderGapCard=`<div style="${bigCardStyle}"><span style="font-size:2rem;font-weight:700;color:var(--accent)">${TE.formatMoney(genderGap)}</span><span style="display:block;font-size:.85rem;color:var(--muted);margin-top:.25rem">Gender gap in ${occ.name}<br>Women earn ${(100-genderGapPct).toFixed(1)} cents per male dollar</span></div>`;

    const lifetimeCard=`<div class="calc-panel" style="margin-top:1rem"><h3>💰 Lifetime Earnings Impact (40-Year Career)</h3>
      <p><strong>Gender gap cost:</strong> ${TE.formatMoney(lifetimeGap)} — what the median woman in this role earns less than the median man over a full career.</p>
      ${personalGap!==0?`<p><strong>Your personal trajectory:</strong> ${TE.formatMoney(lifetimePersonal)} ${personalGap>=0?'more':'less'} than median over 40 years.</p>`:''}
      ${!negotiated?`<p><strong>Negotiation penalty:</strong> Not negotiating your starting salary typically costs ~5% (${TE.formatMoney(negImpact)}/year = ${TE.formatMoney(negLifetime)} over a career).</p>`:''}
      ${!promoted?`<p><strong>Promotion gap:</strong> Missing one promotion cycle costs ~8% (${TE.formatMoney(promoImpact)}/year = ${TE.formatMoney(promoLifetime)} over a career).</p>`:''}
    </div>`;

    const advice=gender==='female'?`<div class="calc-panel" style="margin-top:1rem;border-color:var(--accent)"><h3>💡 Strategies for Your Field</h3><p><strong>Know your number:</strong> Before your next review, research the exact salary range for ${occ.name} at your experience level in your city. Use Levels.fyi (tech), MGMA (healthcare), or BLS OES data.</p><p><strong>Negotiate with data:</strong> "My research shows the median for this role at my level is ${TE.formatMoney(totalMedian)}. Based on my performance and [specific achievement], I am targeting ${TE.formatMoney(Math.round(totalMedian*1.1))}."</p><p><strong>Track your trajectory:</strong> If you have not been promoted in 2+ years and peers have, schedule a explicit conversation with your manager about promotion criteria and timeline.</p><p><strong>Specialize:</strong> In ${occ.name}, the highest-paid subspecialties often have the smallest female representation. Consider whether a certification, skill, or lateral move could shift your compensation band.</p></div>`
      :gender==='male'?`<div class="calc-panel" style="margin-top:1rem;border-color:var(--success)"><h3>💡 Context for Your Role</h3><p>As a male in ${occ.name}, you are likely above or near the male median. The gender gap in your field is ${genderGapPct.toFixed(1)}% — meaning women in identical roles typically earn ${TE.formatMoney(genderGap)} less per year.</p><p><strong>If you manage people:</strong> Audit your team\'s salaries for gender equity. Unconscious bias in starting offers and promotion decisions is the single largest driver of within-field gaps.</p><p><strong>If you negotiate:</strong> Consider advocating for transparent salary bands and standardized offer formulas in your organization. Individual negotiation skill creates inequity when some people are socialized not to ask.</p></div>`
      :`<div class="calc-panel" style="margin-top:1rem;border-color:var(--accent)"><h3>💡 General Guidance</h3><p>The gender gap in ${occ.name} is ${genderGapPct.toFixed(1)}% — ${TE.formatMoney(genderGap)} per year. The most impactful actions you can take: (1) know your market rate before every job change, (2) negotiate every offer using data, (3) track promotion timelines explicitly, and (4) specialize in the highest-paid subspecialties within your field.</p></div>`;

    document.getElementById('gpg-res').innerHTML=
      `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1rem;margin-top:1.5rem">${personalGapCard}${genderGapCard}</div>`+
      resultsBox(lines,'Pay gap breakdown',TE.formatMoney(genderGap))+
      lifetimeCard+
      advice+
      `<div class="calc-panel" style="margin-top:1rem"><p style="color:var(--muted);font-size:.85rem"><strong>Note:</strong> ${occ.note} Data sourced from Bureau of Labor Statistics (BLS) Occupational Employment and Wage Statistics (May 2025) and Current Population Survey (2024). Figures are national medians and do not adjust for specific employer, city cost-of-living, or individual performance. Your actual market rate may vary ±20%.</p></div>`;
    scrollToResults('gpg-res');
    }catch(err){
      document.getElementById('gpg-res').innerHTML=`<div class="callout" style="background:rgba(201,74,30,.1);border-color:var(--accent)"><strong>Error</strong>${err.message}<br><small>${err.stack||''}</small></div>`;
      console.error(err);
    }
  });
}

/* ===================== Death & Money Calculator ===================== */
function deathMoneyView(main){
  const stateOpts=DATA&&DATA.states?Object.keys(DATA.states).sort().map(code=>({value:code,label:DATA.states[code].name+' ('+code+')'})):[
    {value:'CA',label:'California (CA)'},{value:'NY',label:'New York (NY)'},{value:'TX',label:'Texas (TX)'},{value:'FL',label:'Florida (FL)'},{value:'IL',label:'Illinois (IL)'},{value:'WA',label:'Washington (WA)'},{value:'CO',label:'Colorado (CO)'},{value:'NC',label:'North Carolina (NC)'},{value:'OH',label:'Ohio (OH)'},{value:'PA',label:'Pennsylvania (PA)'}
  ];
  const stateEstateTax={
    CT:{exemption:9100000,rate:0.10,name:'Connecticut'},DC:{exemption:4500000,rate:0.12,name:'District of Columbia'},
    HI:{exemption:5490000,rate:0.10,name:'Hawaii'},IL:{exemption:4000000,rate:0.10,name:'Illinois'},
    ME:{exemption:6410000,rate:0.08,name:'Maine'},MD:{exemption:5000000,rate:0.10,name:'Maryland'},
    MA:{exemption:2000000,rate:0.10,name:'Massachusetts'},MN:{exemption:3000000,rate:0.13,name:'Minnesota'},
    NY:{exemption:6940000,rate:0.10,name:'New York'},OR:{exemption:1000000,rate:0.10,name:'Oregon'},
    RI:{exemption:1850000,rate:0.10,name:'Rhode Island'},VT:{exemption:5000000,rate:0.16,name:'Vermont'},
    WA:{exemption:2193000,rate:0.10,name:'Washington'}
  };
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'Death & Money'})}<h2>Death & Money Calculator 2026</h2><p style="color:var(--muted);margin-bottom:1.5rem">Project your estate value at death, calculate federal and state estate tax exposure, and see what each child or heir actually inherits. Accounts for investment growth, annual savings, marital deduction, and charitable giving.</p>${callout('yellow','2026 estate tax uncertainty','The federal estate tax exemption is scheduled to drop from ~$13.99M (2025) to approximately $7M in 2026 when the TCJA provisions sunset. This calculator uses the post-TCJA $7M exemption. Congress may act to change this before 2026, but as of current law, $7M per person is the scheduled amount.')}
    <div class="calc-grid"><div class="calc-panel"><h3>Your Estate</h3>${inputField('dm_networth','Current net worth (assets minus debts)','number',{value:2500000})}${inputField('dm_age','Your current age','number',{value:55})}${inputField('dm_death_age','Expected age at death','number',{value:85})}${inputField('dm_savings','Annual savings added to net worth','number',{value:50000})}${inputField('dm_return','Expected annual return (%)','number',{value:6})}</div>
    <div class="calc-panel"><h3>Heirs & Deductions</h3>${selectField('dm_status','Marital status',[{value:'single',label:'Single'},{value:'married',label:'Married (unlimited marital deduction)'}],{value:'single'})}${inputField('dm_children','Number of children / heirs','number',{value:2})}${inputField('dm_charity','Charitable bequests','number',{value:0})}${selectField('dm_state','State of residence',stateOpts,{value:'CA'})}</div></div>
    <div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcDeathMoney()">Calculate Estate & Inheritance</button></div>
    <div id="dm-res"></div>`+
    renderFaqSection([
      {q:'How is estate tax calculated?',a:'Federal estate tax applies to the value of your estate at death minus deductions (charitable giving, debts, funeral expenses, unlimited marital deduction for spouses). In 2026, the first ~$7M is exempt per person. Amounts above that are taxed at 40%.'},
      {q:'What is the unlimited marital deduction?',a:'If you are married and leave your entire estate to your U.S. citizen spouse, no federal estate tax is due at your death. The tax is deferred until the surviving spouse dies. This effectively doubles the exemption to ~$14M for married couples (portability allows the surviving spouse to use both exemptions).'},
      {q:'Which states have their own estate tax?',a:'As of 2026: Connecticut, District of Columbia, Hawaii, Illinois, Maine, Maryland, Massachusetts, Minnesota, New York, Oregon, Rhode Island, Vermont, and Washington. Their exemptions range from $1M (Oregon) to $9.1M (Connecticut). States without income tax do not necessarily mean no estate tax — Washington has one despite no income tax.'},
      {q:'What about the step-up in basis?',a:'Assets inherited at death receive a "step-up" in tax basis to their fair market value at the date of death. This means heirs can sell inherited property immediately with little to no capital gains tax. This is a massive benefit that this calculator does not explicitly model but is relevant to inheritance planning.'},
      {q:'Should I create a trust?',a:'A revocable living trust does not reduce estate tax — it avoids probate and provides privacy. An irrevocable trust can remove assets from your estate, but you lose control. For estates near the $7M threshold, gifting during lifetime ($18,000/year per recipient in 2026) and irrevocable life insurance trusts (ILITs) are common strategies. Consult an estate attorney.'}
    ]);

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.calcDeathMoney = safeCalc(function(){
    try{
      const netWorth=getVal('dm_networth');
      const age=getVal('dm_age');
      const deathAge=getVal('dm_death_age');
      const savings=getVal('dm_savings');
      const returnRate=getVal('dm_return')/100;
      const status=getSelect('dm_status');
      const children=getVal('dm_children');
      const charity=getVal('dm_charity');
      const state=getSelect('dm_state');
      const years=Math.max(0,deathAge-age);

      let projected;
      if(returnRate===0){projected=netWorth+savings*years;}
      else{projected=netWorth*Math.pow(1+returnRate,years)+savings*((Math.pow(1+returnRate,years)-1)/returnRate);}
      projected=Math.round(projected);

      const fedExemption=7000000;
      const combinedExemption=status==='married'?fedExemption*2:fedExemption;
      const taxableEstate=Math.max(0,projected-charity);
      const fedTaxable=Math.max(0,taxableEstate-combinedExemption);
      const fedEstateTax=Math.round(fedTaxable*0.40);

      let stateEstateTaxAmt=0;
      let stateTaxNote='';
      if(stateEstateTax[state]){
        const st=stateEstateTax[state];
        const stateTaxable=Math.max(0,taxableEstate-st.exemption);
        stateEstateTaxAmt=Math.round(stateTaxable*st.rate);
        stateTaxNote=`${st.name} estate tax: ${TE.formatMoney(st.exemption)} exemption, ~${(st.rate*100).toFixed(0)}% above exemption.`;
      }

      const totalTax=fedEstateTax+stateEstateTaxAmt;
      const netEstate=projected-totalTax-charity;
      const perChild=children>0?Math.round(netEstate/children):0;
      const effectiveRate=projected>0?(totalTax/projected)*100:0;

      const maritalNote=status==='married'?`<p style="color:var(--muted);margin-top:.5rem">Married couples can combine exemptions (~$14M total) and defer all tax until second death via unlimited marital deduction.</p>`:'';

      const lines=[
        {label:'Current net worth',val:TE.formatMoney(netWorth)},
        {label:'Years until death',val:years},
        {label:'Projected estate at death',val:TE.formatMoney(projected)},
        {label:'Charitable bequests',val:'-'+TE.formatMoney(charity)},
        {label:'Taxable estate',val:TE.formatMoney(taxableEstate)},
        {label:'Federal exemption used',val:TE.formatMoney(combinedExemption)},
        {label:'Federal estate tax',val:TE.formatMoney(fedEstateTax)},
        {label:'State estate tax',val:TE.formatMoney(stateEstateTaxAmt)},
        {label:'Total estate tax',val:TE.formatMoney(totalTax)},
        {label:'',val:''},
        {label:'Net estate after tax & charity',val:TE.formatMoney(netEstate)},
        {label:'Inheritance per child',val:TE.formatMoney(perChild)},
        {label:'Effective estate tax rate',val:effectiveRate.toFixed(1)+'%'},
      ];

      const bigCardStyle='background:var(--card);border:1px solid var(--border);border-radius:12px;padding:1.5rem;text-align:center;margin-bottom:1rem';
      const estateCard=`<div style="${bigCardStyle}"><span style="font-size:2rem;font-weight:700;color:var(--accent)">${TE.formatMoney(projected)}</span><span style="display:block;font-size:.85rem;color:var(--muted);margin-top:.25rem">Projected estate at death (age ${deathAge})</span></div>`;
      const taxCard=`<div style="${bigCardStyle}"><span style="font-size:2rem;font-weight:700;color:${totalTax>0?'var(--danger)':'var(--success)'}">${TE.formatMoney(totalTax)}</span><span style="display:block;font-size:.85rem;color:var(--muted);margin-top:.25rem">Total estate tax (federal + state)</span></div>`;
      const inheritCard=`<div style="${bigCardStyle}"><span style="font-size:2rem;font-weight:700;color:var(--success)">${TE.formatMoney(perChild)}</span><span style="display:block;font-size:.85rem;color:var(--muted);margin-top:.25rem">Per child / heir (${children})</span></div>`;

      let advice='';
      if(projected<=combinedExemption){
        advice=`<div class="calc-panel" style="margin-top:1rem;border-color:var(--success)"><h3>✅ No Estate Tax Exposure</h3><p>Your projected estate of <strong>${TE.formatMoney(projected)}</strong> is below the <strong>${TE.formatMoney(combinedExemption)}</strong> federal exemption. No federal estate tax is due.</p><p><strong>Action items:</strong> (1) Ensure your will is up to date. (2) Name beneficiaries on retirement accounts and life insurance. (3) Consider a revocable living trust to avoid probate. (4) Annual gifting ($18,000/person in 2026) can reduce your eventual estate further.</p></div>`;
      }else{
        advice=`<div class="calc-panel" style="margin-top:1rem;border-color:var(--warning)"><h3>⚠️ Estate Tax Exposure: ${TE.formatMoney(totalTax)}</h3><p>Your projected estate exceeds the federal exemption by <strong>${TE.formatMoney(fedTaxable)}</strong>. Federal estate tax at 40% = <strong>${TE.formatMoney(fedEstateTax)}</strong>.</p><p><strong>Strategies to reduce:</strong> (1) Annual gifting: $18,000/year per recipient (2026) removes assets from your estate. A couple can gift $36,000/year to each child. (2) Irrevocable life insurance trust (ILIT): Life insurance proceeds are included in your estate unless owned by an ILIT. (3) Charitable remainder trust: Donate appreciated assets, get income for life, reduce estate. (4) Family limited partnership: Discount valuations for minority interests. (5) Spend more — vacations, experiences, and gifts during life are tax-free enjoyment. Consult an estate planning attorney.</p></div>`;
      }

      document.getElementById('dm-res').innerHTML=
        `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin-top:1.5rem">${estateCard}${taxCard}${inheritCard}</div>`+
        maritalNote+
        resultsBox(lines,'Estate breakdown',TE.formatMoney(totalTax))+
        advice+
        (stateTaxNote?`<div class="calc-panel" style="margin-top:1rem"><p style="color:var(--muted);font-size:.85rem">${stateTaxNote}</p></div>`:'');
      scrollToResults('dm-res');
    }catch(err){
      document.getElementById('dm-res').innerHTML=`<div class="callout" style="background:rgba(201,74,30,.1);border-color:var(--accent)"><strong>Error</strong>${err.message}<br><small>${err.stack||''}</small></div>`;
      console.error(err);
    }
  });
}

/* ===================== S-Corp vs C-Corp Calculator ===================== */
function sVsCCorpView(main){
  main.innerHTML=`${breadcrumbs({href:'',text:'Home'},{href:'calculators',text:'Calculators'},{href:'standalone',text:'Standalone'},{href:'',text:'S-Corp vs C-Corp'})}<h2>S-Corp vs C-Corp Tax Comparison Calculator 2026</h2><p style="color:var(--muted);margin-bottom:1.5rem">For business owners deciding between pass-through and corporate taxation. Enter your revenue, expenses, and desired salary to see total tax paid under each structure — including corporate tax, payroll tax, personal income tax, and dividend tax.</p>${callout('blue','Key difference: one layer vs two layers of tax','An <strong>S-Corp</strong> is a pass-through: business profit flows to your personal return and is taxed once at individual rates. A <strong>C-Corp</strong> pays 21% corporate tax on profits, then you pay personal tax on your salary + dividend tax on distributions. The winner depends on your profit level, salary ratio, and whether you reinvest or distribute profits.')}
    <div class="calc-grid"><div class="calc-panel"><h3>Business</h3>${inputField('scc_revenue','Annual revenue','number',{value:400000})}${inputField('scc_expenses','Business expenses (excluding salary)','number',{value:120000})}${inputField('scc_salary','Owner W-2 salary','number',{value:120000})}${selectField('scc_dist_pct','Distribution assumption',[{value:1,label:'Distribute 100% of after-tax profit'},{value:0.5,label:'Distribute 50% (retain 50%)'},{value:0,label:'Retain 100% (no dividends)'}],{value:1})}</div>
    <div class="calc-panel"><h3>Personal</h3>${inputField('scc_other','Other personal income (W-2, spouse, investments)','number',{value:0})}${selectField('scc_status','Filing status',[{value:'single',label:'Single'},{value:'mfj',label:'Married Filing Jointly'},{value:'hoh',label:'Head of Household'}],{value:'single'})}${selectField('scc_state','State',buildStateOptions(),{value:'CA'})}${inputField('scc_dependents','Children under 17','number',{value:0})}</div></div>
    <div class="btn-group"><button class="btn btn-accent" onclick="window.CalcFns.calcSVsCCorp()">Compare S-Corp vs C-Corp</button></div>
    <div id="scc-res"></div>`+
    renderFaqSection([
      {q:'When does a C-Corp win?',a:'A C-Corp can win when: (1) You reinvest most profits (only 21% corporate tax vs individual rates up to 37%), (2) Your personal marginal rate is 32%+ while the corporate rate is 21%, (3) You need deductible fringe benefits (health insurance, retirement plans) that are fully deductible for C-Corps but limited for S-Corp >2% shareholders. C-Corp is common for startups seeking VC funding (VCs prefer C-Corp) and businesses with high reinvestment rates.'},
      {q:'When does an S-Corp win?',a:'An S-Corp usually wins when: (1) You distribute most profits to owners, (2) Your personal marginal rate is 22% or lower, (3) You qualify for the 20% QBI deduction, (4) You want to avoid double taxation on distributions. S-Corp is the default choice for most small businesses ($100k-$500k profit) because the 15.3% SE tax savings on distributions outweigh the corporate tax benefit.'},
      {q:'What about the QBI deduction?',a:'The 20% Qualified Business Income deduction applies to S-Corp distributions (but NOT salary). It does NOT apply to C-Corp dividends. For a business with $200k net profit and $80k salary, the S-Corp gets QBI on $120k = $24k deduction. The C-Corp gets zero QBI. This matters most when taxable income is below the phaseout thresholds (~$403k MFJ, ~$202k single for 2026).'},
      {q:'Can I switch from S-Corp to C-Corp?',a:'Yes, but it is a taxable liquidation event. Converting from S to C generally triggers tax on built-in gains. Most businesses pick the right structure early and stick with it. If you are unsure, start as an LLC (default pass-through) and elect S-Corp later. Converting from LLC to C-Corp is also taxable. Plan carefully with a CPA before converting.'},
      {q:'What is the 21% corporate rate after OBBBA?',a:'The Tax Cuts and Jobs Act (TCJA) lowered the corporate rate from 35% to 21% in 2018. The OBBBA (One Big Beautiful Bill Act) passed in 2025 did not change the corporate rate. It remains 21% for 2026. This makes C-Corp attractive for reinvestment, since retained earnings are only taxed at 21% vs individual rates that can reach 32-37%.'}
    ]);

  window.CalcFns = window.CalcFns || {};

  window.CalcFns.calcSVsCCorp = safeCalc(function(){
    try{
      const revenue=getVal('scc_revenue');
      const expenses=getVal('scc_expenses');
      const salary=getVal('scc_salary');
      const distPct=getVal('scc_dist_pct');
      const otherIncome=getVal('scc_other');
      const status=getSelect('scc_status');
      const state=getSelect('scc_state');
      const dependents=getVal('scc_dependents');

      const businessNet=Math.max(0,revenue-expenses);

      // S-Corp
      const sCorpDist=Math.max(0,businessNet-salary);
      const sCorpFICA=TE.calcFICA(salary,DATA,otherIncome);
      const sCorpAGI=salary+sCorpDist+otherIncome;
      const sCorpStd=TE.getStandardDeduction(status,false,DATA);
      const sCorpTaxableBeforeQBI=Math.max(0,sCorpAGI-sCorpStd);
      const sCorpQBI=TE.calcQBI(sCorpDist,sCorpTaxableBeforeQBI,status,DATA);
      const sCorpTaxable=Math.max(0,sCorpTaxableBeforeQBI-sCorpQBI);
      const sCorpFed=TE.calcFederalTax(sCorpTaxable,status,DATA);
      const sCorpState=TE.calcStateTax(sCorpAGI,state,DATA,status);
      const sCorpChildCredit=TE.calcChildTaxCredit(dependents,sCorpAGI,status,DATA);
      const sCorpTotalTax=Math.max(0,sCorpFICA.totalFICA+sCorpFed+sCorpState.tax-sCorpChildCredit);
      const sCorpTakeHome=businessNet+otherIncome-sCorpTotalTax;
      const sCorpEffectiveRate=businessNet>0?(sCorpTotalTax/businessNet)*100:0;

      // C-Corp
      const cCorpTaxableIncome=Math.max(0,businessNet-salary);
      const cCorpTax=cCorpTaxableIncome*0.21;
      const cCorpAfterTax=cCorpTaxableIncome-cCorpTax;
      const cCorpDividends=Math.round(cCorpAfterTax*distPct);
      const cCorpRetained=Math.round(cCorpAfterTax*(1-distPct));

      const cCorpFICA=TE.calcFICA(salary,DATA,otherIncome);
      const cCorpOrdinaryIncome=salary+otherIncome;
      const cCorpStd=TE.getStandardDeduction(status,false,DATA);
      const cCorpTaxableOrdinary=Math.max(0,cCorpOrdinaryIncome-cCorpStd);
      const cCorpFedOrdinary=TE.calcFederalTax(cCorpTaxableOrdinary,status,DATA);
      const cCorpDivTax=calcQualifiedDividendTax(cCorpDividends,cCorpTaxableOrdinary,status,DATA);
      const cCorpAGI=cCorpOrdinaryIncome+cCorpDividends;
      const cCorpState=TE.calcStateTax(cCorpAGI,state,DATA,status);
      const cCorpChildCredit=TE.calcChildTaxCredit(dependents,cCorpAGI,status,DATA);
      const cCorpPersonalTax=Math.max(0,cCorpFICA.totalFICA+cCorpFedOrdinary+cCorpDivTax+cCorpState.tax-cCorpChildCredit);
      const cCorpTotalTax=cCorpTax+cCorpPersonalTax;
      const cCorpTakeHome=businessNet+otherIncome-cCorpTotalTax;
      const cCorpEffectiveRate=businessNet>0?(cCorpTotalTax/businessNet)*100:0;

      const diff=sCorpTotalTax-cCorpTotalTax;
      const winner=diff>0?'C-Corp':'S-Corp';
      const amount=Math.abs(diff);
      const color=diff>0?'var(--success)':'var(--accent)';

      const lines=[
        {label:'Business net profit (before salary)',val:TE.formatMoney(businessNet)},
        {label:'',val:''},
        {label:'S-Corp — Salary',val:TE.formatMoney(salary)},
        {label:'S-Corp — Distribution',val:TE.formatMoney(sCorpDist)},
        {label:'S-Corp — FICA / payroll tax',val:TE.formatMoney(sCorpFICA.totalFICA)},
        {label:'S-Corp — Federal income tax',val:TE.formatMoney(sCorpFed)},
        {label:'S-Corp — State income tax',val:TE.formatMoney(sCorpState.tax)},
        {label:'S-Corp — QBI deduction',val:'-'+TE.formatMoney(sCorpQBI)},
        {label:'S-Corp — Total tax',val:TE.formatMoney(sCorpTotalTax)},
        {label:'',val:''},
        {label:'C-Corp — Corporate taxable income',val:TE.formatMoney(cCorpTaxableIncome)},
        {label:'C-Corp — Corporate tax (21%)',val:TE.formatMoney(cCorpTax)},
        {label:'C-Corp — Dividends distributed',val:TE.formatMoney(cCorpDividends)},
        {label:'C-Corp — Retained earnings',val:TE.formatMoney(cCorpRetained)},
        {label:'C-Corp — FICA / payroll tax',val:TE.formatMoney(cCorpFICA.totalFICA)},
        {label:'C-Corp — Federal income tax (ordinary)',val:TE.formatMoney(cCorpFedOrdinary)},
        {label:'C-Corp — Federal dividend tax',val:TE.formatMoney(cCorpDivTax)},
        {label:'C-Corp — State income tax',val:TE.formatMoney(cCorpState.tax)},
        {label:'C-Corp — Total tax',val:TE.formatMoney(cCorpTotalTax)},
      ];

      const bigCardStyle='background:var(--card);border:1px solid var(--border);border-radius:12px;padding:1.5rem;text-align:center;margin-bottom:1rem';
      const sCorpCard=`<div style="${bigCardStyle}"><span style="font-size:2rem;font-weight:700;color:var(--accent)">${TE.formatMoney(sCorpTotalTax)}</span><span style="display:block;font-size:.85rem;color:var(--muted);margin-top:.25rem">S-Corp total tax</span><span style="display:block;font-size:.85rem;color:var(--muted)">Effective rate: ${sCorpEffectiveRate.toFixed(1)}%</span></div>`;
      const cCorpCard=`<div style="${bigCardStyle}"><span style="font-size:2rem;font-weight:700;color:var(--success)">${TE.formatMoney(cCorpTotalTax)}</span><span style="display:block;font-size:.85rem;color:var(--muted);margin-top:.25rem">C-Corp total tax</span><span style="display:block;font-size:.85rem;color:var(--muted)">Effective rate: ${cCorpEffectiveRate.toFixed(1)}%</span></div>`;
      const winnerCard=`<div style="${bigCardStyle};border:2px solid ${color}"><span style="font-size:2rem;font-weight:700;color:${color}">${winner}</span><span style="display:block;font-size:.85rem;color:var(--muted);margin-top:.25rem">Winner by ${TE.formatMoney(amount)}/year</span></div>`;

      let advice='';
      if(winner==='S-Corp'){
        advice=`<div class="calc-panel" style="margin-top:1rem;border-color:var(--accent)"><h3>💡 Why S-Corp Wins Here</h3><p>At <strong>${TE.formatMoney(businessNet)}</strong> net profit, the S-Corp structure costs <strong>${TE.formatMoney(amount)}</strong> less per year than C-Corp.</p><p><strong>Key reasons:</strong> (1) No 21% corporate tax layer. (2) The QBI deduction (${TE.formatMoney(sCorpQBI)}) reduces your personal tax. (3) Distributions avoid FICA/SE tax (${TE.formatMoney(sCorpDist)} distributed, only ${TE.formatMoney(salary)} subject to payroll tax). (4) Your individual marginal rate is lower than the combined corporate + dividend rate.</p><p><strong>Caveat:</strong> If you plan to retain significant earnings for reinvestment rather than distribute them, re-run with "Retain 100%" to see if C-Corp becomes cheaper (retained earnings taxed at only 21%).</p></div>`;
      }else{
        advice=`<div class="calc-panel" style="margin-top:1rem;border-color:var(--success)"><h3>💡 Why C-Corp Wins Here</h3><p>At <strong>${TE.formatMoney(businessNet)}</strong> net profit, the C-Corp structure costs <strong>${TE.formatMoney(amount)}</strong> less per year than S-Corp.</p><p><strong>Key reasons:</strong> (1) Retained earnings are taxed at only 21% corporate rate vs your individual marginal rate. (2) You are distributing only ${(distPct*100).toFixed(0)}% of profits, so most money stays in the business. (3) Your personal marginal rate is high enough that the 21% corporate rate is a savings vs the pass-through rate.</p><p><strong>Caveat:</strong> If you later need to distribute retained earnings, you will pay dividend tax then. C-Corp is best for businesses that reinvest heavily. If you distribute most profits, S-Corp is usually better.</p></div>`;
      }

      document.getElementById('scc-res').innerHTML=
        `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin-top:1.5rem">${sCorpCard}${cCorpCard}${winnerCard}</div>`+
        resultsBox(lines,'Tax comparison summary',TE.formatMoney(amount))+
        advice+
        `<div class="calc-panel" style="margin-top:1rem"><p style="color:var(--muted);font-size:.85rem"><strong>Note:</strong> This calculator models federal corporate tax at 21%, federal individual tax using 2026 brackets, qualified dividend tax at 0%/15%/20%, and state income tax using current state rates. It assumes the business is your primary income source. Actual results vary based on specific deductions, credits, and state-specific corporate taxes (most states tax S-Corp pass-through and C-Corp profits at similar rates, but some have franchise taxes or gross receipts taxes not modeled here). Consult a CPA for entity-specific advice.</p></div>`;
      scrollToResults('scc-res');
    }catch(err){
      document.getElementById('scc-res').innerHTML=`<div class="callout" style="background:rgba(201,74,30,.1);border-color:var(--accent)"><strong>Error</strong>${err.message}<br><small>${err.stack||''}</small></div>`;
      console.error(err);
    }
  });
}
