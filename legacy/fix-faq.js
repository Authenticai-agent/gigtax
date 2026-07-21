const fs = require('fs');
const file = '/Users/juratevirkutyte/gigatax/gigtax-app/js/app.js';
let content = fs.readFileSync(file, 'utf8');

// Find the rental FAQ array and replace it with generic + specific FAQs
const oldRentalFaq = `rental:[{q:'Is my Airbnb income Schedule C or Schedule E?',a:'Short-term rentals with substantial services (cleaning, meals, concierge) = Schedule C (subject to SE tax). Simple rentals = Schedule E (no SE tax). The IRS looks at whether you provide services comparable to a hotel. <a href="/short-vs-long-term-rental">Compare STR vs LTR tax</a>.'},{q:'Can I deduct my mortgage on a rental property?',a:'You can deduct mortgage <em>interest</em> (not principal) on Schedule E. If you use the property personally, you must allocate interest between personal and rental use based on days or square footage. Principal payments are never deductible.'},{q:'What is the Augusta Rule and does it apply to me?',a:'IRC Section 280A(g) lets you rent your personal residence to your business for up to 14 days/year, tax-free. Requires an entity (S-Corp, C-Corp, or Partnership). Does NOT apply to sole proprietors. <a href="/deductions">See deduction guide</a>.'}]}`;

const newRentalFaqs = `rental:[{q:'Do I pay self-employment tax on rental income?',a:'Generally no for passive rentals reported on Schedule E (parking spaces, storage, long-term leases). Yes if you provide substantial services comparable to a hotel or business - then it is Schedule C and subject to 15.3% SE tax.'},{q:'What rental expenses can I deduct?',a:'Common deductions include property taxes, insurance, repairs, maintenance, platform fees, advertising, and depreciation. For vehicle or equipment rentals, you may also deduct mileage for delivery, storage costs, and Section 179 depreciation.'},{q:'Do I need to report rental income if I made less than $600?',a:'Yes. ALL rental income is taxable regardless of amount or whether you receive a 1099. Platforms may not send a 1099 under $600, but you must still report the income on Schedule E (or Schedule C if substantial services).'}],airbnb:[{q:'Is my Airbnb income Schedule C or Schedule E?',a:'Short-term rentals with substantial services (cleaning, meals, concierge) = Schedule C (subject to SE tax). Simple rentals = Schedule E (no SE tax). The IRS looks at whether you provide services comparable to a hotel. <a href="/short-vs-long-term-rental">Compare STR vs LTR tax</a>.'},{q:'Can I deduct my mortgage interest on a rental property?',a:'You can deduct mortgage <em>interest</em> (not principal) on Schedule E. If you use the property personally, you must allocate interest between personal and rental use based on days or square footage. Principal payments are never deductible.'},{q:'What is the Augusta Rule and does it apply to me?',a:'IRC Section 280A(g) lets you rent your personal residence to your business for up to 14 days/year, tax-free. Requires an entity (S-Corp, C-Corp, or Partnership). Does NOT apply to sole proprietors. <a href="/deductions">See deduction guide</a>.'}],parking_space_rental:[{q:'Do I pay self-employment tax on parking space rental income?',a:'Generally no. Renting a parking space is passive rental income reported on Schedule E, which is NOT subject to self-employment (SE) tax. You pay only federal and state income tax on the net profit.'},{q:'What expenses can I deduct for parking space rental?',a:'You can deduct a portion of property taxes, insurance, repairs and maintenance, platform fees, and advertising costs directly related to the parking space. If the space is part of your primary residence, allocate expenses by square footage or a reasonable method.'},{q:'Do I need to report parking space income if under $600?',a:'Yes. ALL rental income is taxable regardless of amount. Platforms like SpotHero or Neighbor may not send a 1099 under $600, but you must still report the income on Schedule E. Track gross income and deductible expenses throughout the year.'}]}`;

if (content.includes(oldRentalFaq)) {
  content = content.replace(oldRentalFaq, newRentalFaqs);
  fs.writeFileSync(file, content);
  console.log('Successfully updated rental FAQs');
} else {
  console.log('Could not find exact rental FAQ text. Attempting partial match...');
  // Try partial match
  const idx = content.indexOf("rental:[{q:'Is my Airbnb income Schedule C or Schedule E?");
  if (idx === -1) {
    console.log('ERROR: Could not find rental FAQ at all');
    process.exit(1);
  }
  // Find the end of the rental array
  let depth = 1;
  let endIdx = idx + "rental:[".length;
  while (depth > 0 && endIdx < content.length) {
    if (content[endIdx] === '[') depth++;
    if (content[endIdx] === ']') depth--;
    endIdx++;
  }
  const rentalFaqText = content.substring(idx, endIdx);
  console.log('Found rental FAQ from index', idx, 'to', endIdx);
  console.log('Length:', rentalFaqText.length);
  console.log('Text:', rentalFaqText.substring(0, 200));
}
