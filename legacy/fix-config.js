const fs = require('fs');
const filePath = '/Users/juratevirkutyte/gigatax/gigtax-app/data/config.json';

let content = fs.readFileSync(filePath, 'utf8');
const data = JSON.parse(content);

// Fix single brackets
const single = [
  {min:0, max:12400, rate:0.1},
  {min:12400, max:50400, rate:0.12},
  {min:50400, max:105700, rate:0.22},
  {min:105700, max:201775, rate:0.24},
  {min:201775, max:256225, rate:0.32},
  {min:256225, max:640600, rate:0.35},
  {min:640600, max:null, rate:0.37}
];

const mfj = [
  {min:0, max:24800, rate:0.1},
  {min:24800, max:100800, rate:0.12},
  {min:100800, max:211400, rate:0.22},
  {min:211400, max:403550, rate:0.24},
  {min:403550, max:512450, rate:0.32},
  {min:512450, max:768700, rate:0.35},
  {min:768700, max:null, rate:0.37}
];

const mfs = [
  {min:0, max:12400, rate:0.1},
  {min:12400, max:50400, rate:0.12},
  {min:50400, max:105700, rate:0.22},
  {min:105700, max:201775, rate:0.24},
  {min:201775, max:256225, rate:0.32},
  {min:256225, max:384350, rate:0.35},
  {min:384350, max:null, rate:0.37}
];

const hoh = [
  {min:0, max:17700, rate:0.1},
  {min:17700, max:67450, rate:0.12},
  {min:67450, max:105700, rate:0.22},
  {min:105700, max:201750, rate:0.24},
  {min:201750, max:256200, rate:0.32},
  {min:256200, max:640600, rate:0.35},
  {min:640600, max:null, rate:0.37}
];

data.federal.brackets.single = single;
data.federal.brackets.mfj = mfj;
data.federal.brackets.mfs = mfs;
data.federal.brackets.hoh = hoh;
data.federal.brackets.qsw = mfj;

// Fix Section 179
data.selfEmploymentDeductions.section179.limit = 2560000;
data.selfEmploymentDeductions.section179.phaseoutStart = 4090000;

// Fix EIC
data.federal.earnedIncomeCredit.brackets = [
  {children:0, maxCredit:664, incomeLimit:19540, phaseoutStart:10860},
  {children:1, maxCredit:4427, incomeLimit:51593, phaseoutStart:23890},
  {children:2, maxCredit:7316, incomeLimit:58629, phaseoutStart:23890},
  {children:3, maxCredit:8231, incomeLimit:62974, phaseoutStart:23890}
];
data.federal.earnedIncomeCredit.investmentIncomeLimit = 12200;
data.federal.earnedIncomeCredit.note = "MFJ phaseout starts approximately $7,270 higher than single/hoh. Single/HOH figures shown; calcEIC does not currently adjust for filing status.";

// Fix foreign earned income exclusion
data.federal.foreignEarnedIncomeExclusion.amount = 132900;

// Fix 1099NEC note
data.incomeSources['1099NEC'].note = "OBBBA raised threshold from $600 to $2,000 for payments made in calendar year 2026 (reported on 2026 returns filed in 2027). Income still taxable even without 1099-NEC below threshold.";

fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
console.log('Config updated');
