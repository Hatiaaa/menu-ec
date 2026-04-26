import type { Dish } from '../data/platos';
import type { WeekMenu } from './generator';

function normalize(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function findDishByFuzzyName(name: string, currentInventory: Dish[]): Dish | null {
  const nInput = normalize(name).replace(/^-\s*/, '');
  
  // 1. Intento de coincidencia exacta (normalizada)
  for (const dish of currentInventory) {
    if (normalize(dish.name) === nInput) return dish;
  }

  // 2. Limpieza de sufijos comunes que no suelen estar en la DB
  const cleanedInput = nInput
    .replace(/\s+con\s+.*/, '')
    .replace(/\s+y\s+.*/, '')
    .replace(/\s+en\s+salsa\s+.*/, '')
    .replace(/\s+a\s+la\s+.*/, '')
    .replace(/\s+al\s+.*/, '')
    .replace('yapingacho', 'llapingacho')
    .replace('chancho al horno', 'seco de chancho')
    .replace('pollo apanado', 'pechuga apanada')
    .trim();

  if (cleanedInput.length < 3) return null;

  let bestMatch: Dish | null = null;
  let bestScore = 0;

  for (const dish of currentInventory) {
    const nDish = normalize(dish.name);
    
    // Coincidencia exacta tras limpieza
    if (nDish === cleanedInput) return dish;

    // Coincidencia parcial (el uno contiene al otro)
    if (nDish.includes(cleanedInput) || cleanedInput.includes(nDish)) {
       const score = Math.min(cleanedInput.length, nDish.length);
       if (score > bestScore) {
         bestScore = score;
         bestMatch = dish;
       }
    }
  }

  // 3. Fallback: coincidencia por palabras clave
  if (!bestMatch) {
    const words = cleanedInput.split(' ').filter(w => w.length > 3);
    for (const dish of currentInventory) {
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
  // Split by 4+ asterisks or 4+ dashes or even 3+ dashes
  const daysBlocks = text.split(/[\*\-]{3,}/);
  let currentWeek: any[] = [];
  const weeks: WeekMenu[] = [];
  
  const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  for (const block of daysBlocks) {
    const trimmedBlock = block.trim();
    if (trimmedBlock.length < 5) continue;
    
    const blockLower = trimmedBlock.toLowerCase();
    const isSaturday = blockLower.includes('(sabado)') || blockLower.includes('sabado') || blockLower.includes('sábado');
    
    // Split by Segundos header
    const parts = trimmedBlock.split(/🍛|Segundos?:/i);
    const sopasPart = parts[0];
    const segundosPart = parts.length > 1 ? parts[1] : '';

    // Extract sopas section (after "Sopa:")
    const sopasLines = sopasPart.split(/Sopas?:/i).pop()?.split('\n') || [];
    const segundosLines = segundosPart.split('\n') || [];

    const cleanSopas = sopasLines.map(l => l.trim()).filter(l => l.length > 3 && !l.toLowerCase().includes('menú'));
    const cleanSegundos = segundosLines.map(l => l.trim()).filter(l => l.length > 3);
    
    const daySoups = cleanSopas.map(l => findDishByFuzzyName(l, currentInventory)).filter(Boolean) as Dish[];
    const dayMains = cleanSegundos.map(l => findDishByFuzzyName(l, currentInventory)).filter(Boolean) as Dish[];
    
    if (daySoups.length > 0 || dayMains.length > 0) {
      currentWeek.push({
        day: dayNames[currentWeek.length] || `Día ${currentWeek.length + 1}`,
        sopas: daySoups,
        segundos: dayMains
      });

      if (currentWeek.length === 6 || isSaturday) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
  }

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return weeks;
}
