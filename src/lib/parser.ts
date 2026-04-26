import type { Dish } from '../data/platos';
import type { WeekMenu } from './generator';

function normalize(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function findDishByFuzzyName(name: string, currentInventory: Dish[], targetType: 'Sopa' | 'Segundo'): Dish | null {
  const nInput = normalize(name).replace(/^-\s*/, '');
  
  // Try to match only dishes of the target type
  const filteredInventory = currentInventory.filter(d => d.type === targetType);

  // 1. Exact match
  for (const dish of filteredInventory) {
    if (normalize(dish.name) === nInput) return dish;
  }

  // 2. Limpieza de sufijos comunes que no suelen estar en la DB
  // Solo limpiamos si el resultado no es demasiado corto
  let cleanedInput = nInput
    .replace(/\s+con\s+.*/, '')
    .replace(/\s+y\s+.*/, '')
    .replace(/\s+en\s+salsa\s+.*/, '')
    .trim();

  // Si la limpieza anterior borró demasiado, probamos con una versión más conservadora
  if (cleanedInput.length < 3) cleanedInput = nInput;

  // Mapeos específicos de corrección común
  cleanedInput = cleanedInput
    .replace('yapingacho', 'llapingacho')
    .replace('chancho al horno', 'seco de chancho')
    .replace('pollo apanado', 'pechuga apanada')
    .replace('montubio', 'montuvio')
    .replace('sopa de lenteja', 'caldo de lenteja');

  let bestMatch: Dish | null = null;
  let bestScore = 0;

  for (const dish of filteredInventory) {
    const nDish = normalize(dish.name);
    if (nDish === cleanedInput) return dish;
    if (nDish.includes(cleanedInput) || cleanedInput.includes(nDish)) {
       const score = Math.min(cleanedInput.length, nDish.length);
       if (score > bestScore) {
         bestScore = score;
         bestMatch = dish;
       }
    }
  }

  // 3. Fallback: keywords
  if (!bestMatch) {
    const words = cleanedInput.split(' ').filter(w => w.length > 3);
    for (const dish of filteredInventory) {
      const nDish = normalize(dish.name);
      let score = 0;
      for (const w of words) {
        if (nDish.includes(w)) score++;
      }
      if (score > bestScore && score >= 1) {
        bestScore = score;
        bestMatch = dish;
      }
    }
  }

  return bestMatch;
}

export function parseHistoryMarkdown(text: string, currentInventory: Dish[]): WeekMenu[] {
  console.log('Parser: Starting with text length', text.length);
  const daysBlocks = text.split(/[\*\-]{3,}/);
  let currentWeek: any[] = [];
  const weeks: WeekMenu[] = [];
  
  const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  for (const block of daysBlocks) {
    const trimmedBlock = block.trim();
    if (trimmedBlock.length < 5) continue;
    
    const blockLower = trimmedBlock.toLowerCase();
    const isSaturday = blockLower.includes('(sabado)') || blockLower.includes('sabado') || blockLower.includes('sábado');
    
    const parts = trimmedBlock.split(/🍛|Segundos?:/i);
    const sopasPart = parts[0];
    const segundosPart = parts.length > 1 ? parts[1] : '';

    const sopasLines = sopasPart.split(/Sopas?:/i).pop()?.split('\n') || [];
    const segundosLines = segundosPart.split('\n') || [];

    const cleanSopas = sopasLines.map(l => l.trim()).filter(l => l.length > 3 && !l.toLowerCase().includes('menú'));
    const cleanSegundos = segundosLines.map(l => l.trim()).filter(l => l.length > 3);
    
    const daySoups = cleanSopas.map(l => findDishByFuzzyName(l, currentInventory, 'Sopa')).filter(Boolean) as Dish[];
    const dayMains = cleanSegundos.map(l => findDishByFuzzyName(l, currentInventory, 'Segundo')).filter(Boolean) as Dish[];
    
    if (daySoups.length > 0 || dayMains.length > 0) {
      currentWeek.push({
        day: dayNames[currentWeek.length] || `Día ${currentWeek.length + 1}`,
        sopas: daySoups,
        segundos: dayMains
      });
      console.log(`Parser: Found day with ${daySoups.length} soups and ${dayMains.length} mains`);

      if (currentWeek.length === 6 || isSaturday) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
  }

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  console.log(`Parser: Completed. Total weeks: ${weeks.length}`);
  return weeks;
}
