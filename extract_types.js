const fs = require('fs');
const data = JSON.parse(fs.readFileSync('C:/Users/harsh/.gemini/antigravity-ide/brain/29ac8193-6978-478b-86c5-8e1d9a46f24c/.system_generated/steps/746/output.txt', 'utf8'));
fs.writeFileSync('d:/CampusOS/src/types/database.ts', data.types);
console.log('Types generated successfully!');
