const fs = require('fs');

const filePath = '/Users/juratevirkutyte/gigatax/gigtax-app/js/app.js';
let content = fs.readFileSync(filePath, 'utf8');

// Update breadcrumbs: change {href:'',text:'Standalone'} to {href:'standalone',text:'Standalone'}
// This only affects standalone calculator breadcrumbs (those with 4 segments where 3rd is Standalone)
content = content.replace(
  /\{href:''(,text:'Standalone')\}/g,
  "{href:'standalone'$1}"
);

fs.writeFileSync(filePath, content);
console.log('Breadcrumbs updated successfully');
