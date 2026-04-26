import type { Dish } from '../data/platos';
import type { WeekMenu } from './generator';

function normalize(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function findDishByFuzzyName(name: string, currentInventory: Dish[]): Dish | null {
  const cleanName = normalize(name)
    .replace(/^-\s*/, '')
    .replace(/ con .*/, '')
    .replace(/ de .*/, (match) => {
       const commonDe = ['caldo de', 'sopa de', 'crema de', 'locro de', 'seco de', 'estofado de', 'biche de', 'chupe de', 'sancocho de', 'ensalada de', 'enrollado de', 'ceviche de', 'manizado de', 'sango de', 'cazuela de'];
       if (commonDe.some(prefix => normalize(match).includes(normalize(prefix)))) return match;
       return '';
    })
    .replace('yapingacho', 'llapingacho')
    .replace('chancho al horno', 'seco de chancho')
    .replace('pollo apanado', 'pechuga apanada');
  
  const normalizedClean = normalize(cleanName);
  let bestMatch: Dish | null = null;
  let bestScore = 0;

  for (const dish of currentInventory) {
    const normDish = normalize(dish.name);
    if (normDish === normalizedClean) return dish;
    if (normDish.includes(normalizedClean) || normalizedClean.includes(normDish)) {
       const score = Math.min(normalizedClean.length, normDish.length);
       if (score > bestScore) {
         bestScore = score;
         bestMatch = dish;
       }
    }
  }

  if (!bestMatch) {
    const words = normalizedClean.split(' ').filter(w => w.length > 3);
    for (const dish of currentInventory) {
      const normDish = normalize(dish.name);
      let score = 0;
      for (const w of words) {
        if (normDish.includes(w)) score++;
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
