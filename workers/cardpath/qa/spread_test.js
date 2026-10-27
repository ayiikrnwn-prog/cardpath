#!/usr/bin/env node
// spread_test.js — QA harness permanen (audit T2): match spread 50 profil random
// RUN: node qa/spread_test.js   |  Exit 1 kalau FAIL
// Threshold: max share <= 35%. Monitor: kalau varo > 40% di LIVE distribution,
// naikkan pembeda (audit suggestion: chime build goalFit 40 -> 42).
const { JSDOM } = require('/tmp/node_modules/jsdom'); // fallback: npm i jsdom
const fs = require('fs');
const path = require('path');
const appjs = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const dom = new JSDOM('<html></html>', { runScripts: 'outside-only', url: 'http://localhost:8931/' });
dom.window.eval(appjs);
const D = dom.window.__cpDebug;
let seed = 7;
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const O = [
  ['never','browsed','applied'], ['now','month','months13','research'],
  ['unknown','never','bad','fair','good'], ['ssn','itin','passport'],
  ['none','past','active'], [0,99,150,350,600],
  ['regular','irregular','none'], [1,0], ['build','rebuild','rewards','graduate'],
];
const spread = {}; let viol = { id: 0, e1: 0, e2: 0, e4: 0 };
for (let n = 0; n < 50; n++) {
  const vals = O.map(o => o[Math.floor(rnd() * o.length)]);
  D.setAnswers(vals, [0,9,18,27,36,45,54,63,72].map(t => Date.now() + t*1000), 0);
  const top = D.quizMatch()[0].k;
  spread[top] = (spread[top] || 0) + 1;
  if (vals[3]==='passport' && !['zolve','amexnova'].includes(top)) viol.id++;
  if (vals[3]==='itin' && top==='petal2') viol.id++;
  if (top==='quicksilver' && vals[5] < 200) viol.e1++;
  if (vals[2]==='good' && vals[5]===0 && top==='creditone') viol.e2++;
  if (['opensky','openskynb','chime','varo','zolve','self','creditstrong','kikoff','grow'].includes(top) && D.quizOddsFor(top)==='low') viol.e4++;
}
const entries = Object.entries(spread).sort((a,b)=>b[1]-a[1]);
const mx = entries[0][1];
console.log('SPREAD (50 profiles):');
entries.forEach(([k,v]) => console.log('  ', k.padEnd(14), (v/50*100).toFixed(0)+'%'));
const pass = mx <= 17.5 && !Object.values(viol).some(x=>x); // 17.5 = 35% dari 50
console.log('max share:', (mx/50*100).toFixed(1)+'%', mx/50<=0.35 ? 'PASS (<=35%)' : 'FAIL');
console.log('violations:', JSON.stringify(viol));
process.exit(pass ? 0 : 1);
