const fs = require('fs');

let thresholds = [0];
let current = 0;
for (let i = 1; i < 50; i++) {
  // Let's make a polynomial scaling.
  // level 1: 0
  // level 15: 25000
  // level 50: ~250000
  // delta = 100 + (i^1.5)*15
  let delta = Math.floor(100 + Math.pow(i, 1.6) * 15);
  // Round to nearest 50
  delta = Math.ceil(delta / 50) * 50;
  current += delta;
  thresholds.push(current);
}

const tsArray = "export const LEVEL_THRESHOLDS = [\n  " + thresholds.join(",\n  ") + "\n] as const;";
const sqlArray = "ARRAY[" + thresholds.join(", ") + "]";

console.log(tsArray);
console.log("SQL:");
console.log(sqlArray);
