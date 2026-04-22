import fs from 'fs';
import path from 'path';

const historyText = fs.readFileSync(path.join(process.cwd(), '../historial_menus.md'), 'utf-8');

// Simplificamos los nombres del inventario para hacer fuzzy match
const inventoryJson = fs.readFileSync(path.join(process.cwd(), 'src/data/platos.ts'), 'utf-8');
// Extraer la lista usando regex o eval (peligroso, pero seguro aquí)
// Mejor extraemos nombres directamente del archivo
const namesMatches = [...inventoryJson.matchAll(/name:\s*'([^']+)'/g)].map(m => m[1]);
const idMatches = [...inventoryJson.matchAll(/id:\s*'([^']+)'/g)].map(m => m[1]);

const inventory = namesMatches.map((name, i) => ({ id: idMatches[i], name, nameLower: name.toLowerCase() }));

function findDishByFuzzyName(name) {
  let cleanName = name.trim().toLowerCase()
    .replace(' con menestra', '')
    .replace(' con ensalada', '')
    .replace(' con puré', '')
    .replace(' con fideo', '')
    .replace(' de fréjol', '')
    .replace(' de choclo', '')
    .replace(' de verdura', '')
    .replace(' rusa', '')
    .replace(' de beterava', '')
    .replace(' de lenteja', '')
    .replace(' y chorizo', '')
    .replace(' de hamburguesa', 'hamburguesa')
    .replace('yapingacho', 'llapingacho')
    .replace('chancho al horno', 'seco de chancho') // Fallback
    .trim();
  
  let bestMatch = null;
  let bestScore = 0;

  for (const dish of inventory) {
    if (dish.nameLower === cleanName) return dish;
    
    // Partial match
    let score = 0;
    const words = cleanName.split(' ');
    for (const w of words) {
      if (w.length > 3 && dish.nameLower.includes(w)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = dish;
    }
  }
  return bestMatch;
}

const daysBlocks = historyText.split(/\*{4,}/);
let currentWeek = [];
const weeks = [];

const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

for (const block of daysBlocks) {
  if (block.trim().length < 10) continue;
  
  const isSaturday = block.includes('(SABADO)');
  
  const sopasSection = block.split('🍛')[0];
  const segundosSection = block.split('🍛')[1];
  
  const sopasLines = sopasSection.split('\n').filter(l => l.trim().startsWith('-'));
  const segundosLines = segundosSection ? segundosSection.split('\n').filter(l => l.trim().startsWith('-')) : [];
  
  const daySoups = sopasLines.map(l => {
    const dish = findDishByFuzzyName(l.replace('-', '').trim());
    return dish ? dish.id : null;
  }).filter(Boolean);

  const dayMains = segundosLines.map(l => {
    const dish = findDishByFuzzyName(l.replace('-', '').trim());
    return dish ? dish.id : null;
  }).filter(Boolean);
  
  currentWeek.push({
    day: dayNames[currentWeek.length],
    sopas: daySoups,
    segundos: dayMains
  });

  if (currentWeek.length === 6 || isSaturday) {
    weeks.push(currentWeek);
    currentWeek = [];
  }
}

const finalOutput = `import { inventory } from './platos';

const rawHistory = ${JSON.stringify(weeks, null, 2)};

export const initialHistory = rawHistory.map(week => 
  week.map(day => ({
    day: day.day,
    sopas: day.sopas.map(id => inventory.find(d => d.id === id)).filter(Boolean),
    segundos: day.segundos.map(id => inventory.find(d => d.id === id)).filter(Boolean),
  }))
);
`;

fs.writeFileSync(path.join(process.cwd(), 'src/data/initialHistory.ts'), finalOutput);
console.log('History imported successfully!');
