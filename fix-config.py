import json

file_path = '/Users/juratevirkutyte/gigatax/gigtax-app/data/config.json'

with open(file_path, 'r') as f:
    data = json.load(f)

# 1. Fix federal brackets
brackets = data['federal']['brackets']

# Single brackets
brackets['single'] = [
    {"min": 0, "max": 12400, "rate": 0.1},
    {"min": 12400, "max": 50400, "rate": 0.12},
    {"min": 50400, "max": 105700, "rate": 0.22},
    {"min": 105700, "max": 201775, "rate": 0.24},
    {"min": 201775, "max": 256225, "rate": 0.32},
    {"min": 256225, "max": 640600, "rate": 0.35},
    {"min": 640600, "max": None, "rate": 0.37}
]

# MFJ brackets
brackets['mfj'] = [
    {"min": 0, "max": 24800, "rate": 0.1},
    {"min": 24800, "max": 100800, "rate": 0.12},
    {"min": 100800, "max": 211400, "rate": 0.22},
    {"min": 211400, "max": 403550, "rate": 0.24},
    {"min": 403550, "max": 512450, "rate": 0.32},
    {"min": 512450, "max": 768700, "rate": 0.35},
    {"min": 768700, "max": None, "rate": 0.37}
]

# MFS brackets (follow single for lower brackets)
brackets['mfs'] = [
    {"min": 0, "max": 12400, "rate": 0.1},
    {"min": 12400, "max": 50400, "rate": 0.12},
    {"min": 50400, "max": 105700, "rate": 0.22},
    {"min": 105700, "max": 201775, "rate": 0.24},
    {"min": 201775, "max": 256225, "rate": 0.32},
    {"min": 256225, "max": 384350, "rate": 0.35},
    {"min": 384350, "max": None, "rate": 0.37}
]

# HOH brackets
brackets['hoh'] = [
    {"min": 0, "max": 17700, "rate": 0.1},
    {"min": 17700, "max": 67450, "rate": 0.12},
    {"min": 67450, "max": 105700, "rate": 0.22},
    {"min": 105700, "max": 201750, "rate": 0.24},
    {"min": 201750, "max": 256200, "rate": 0.32},
    {"min": 256200, "max": 640600, "rate": 0.35},
    {"min": 640600, "max": None, "rate": 0.37}
]

# 2. Fix Section 179
data['federal']['selfEmploymentDeductions']['section179']['limit'] = 2560000
data['federal']['selfEmploymentDeductions']['section179']['phaseoutStart'] = 4090000

# 3. Fix EIC
eic = data['federal']['earnedIncomeCredit']
eic['brackets'] = [
    {"children": 0, "maxCredit": 664, "incomeLimit": 19540, "phaseoutStart": 10860},
    {"children": 1, "maxCredit": 4427, "incomeLimit": 51593, "phaseoutStart": 23890},
    {"children": 2, "maxCredit": 7316, "incomeLimit": 58629, "phaseoutStart": 23890},
    {"children": 3, "maxCredit": 8231, "incomeLimit": 62974, "phaseoutStart": 23890}
]
eic['investmentIncomeLimit'] = 12200
eic['note'] = "MFJ phaseout starts approximately $7,270 higher than single/hoh. Single/HOH figures shown; calcEIC does not currently adjust for filing status."

# 4. Fix foreign earned income exclusion
data['federal']['foreignEarnedIncomeExclusion']['amount'] = 132900

# 5. Fix 1099-NEC note
# The threshold itself ($2000) is correct for 2026 payments, but note should clarify
# Actually looking at current note: "OBBBA raised threshold from $600 to $2,000 effective 2026."
# This is somewhat defensible. The user says "This is genuinely ambiguous and sources disagree on framing, 
# but your config labeling it 'threshold2026' as $2,000 is defensible since it does affect 2026 payments. 
# Just make sure the UI language is clear about which direction the threshold runs."
# Let's update the note to be clearer.
data['federal']['1099NEC']['note'] = "OBBBA raised threshold from $600 to $2,000 for payments made in calendar year 2026 (reported on 2026 returns filed in 2027). Income still taxable even without 1099-NEC below threshold."

with open(file_path, 'w') as f:
    json.dump(data, f, indent=2)

print("Config updated successfully")
