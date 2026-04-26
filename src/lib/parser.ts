import type { Dish } from '../data/platos';
import type { WeekMenu } from './generator';

function findDishByFuzzyName(name: string, currentInventory: Dish[]): Dish | null {
  let cleanName = name.trim().toLowerCase()
    .replace(/^-\s*/, '') // Remove leading dash
    .replace(/ con .*/, '') // Remove " con ..."
    .replace(/ de .*/, (match) => {
       // Keep "de" if it's part of a standard name like "Caldo de bola"
       const commonDe = ['caldo de', 'sopa de', 'crema de', 'locro de', 'seco de', 'estofado de', 'biche de', 'chupe de', 'sancocho de', 'ensalada de', 'enrollado de', 'ceviche de', 'manizado de', 'sango de', 'cazuela de'];
       if (commonDe.some(prefix => match.toLowerCase().includes(prefix))) return match;
       return '';
    })
    .replace('yapingacho', 'llapingacho')
    .replace('chancho al horno', 'seco de chancho')
    .replace('pollo apanado', 'pechuga apanada')
    .trim();
  
  let bestMatch: Dish | null = null;
  let bestScore = 0;

  for (const dish of currentInventory) {
    const dishNameLower = dish.name.toLowerCase();
    if (dishNameLower === cleanName) return dish;
    if (dishNameLower.includes(cleanName) || cleanName.includes(dishNameLower)) {
       const score = Math.min(cleanName.length, dishNameLower.length);
       if (score > bestScore) {
         bestScore = score;
         bestMatch = dish;
       }
    }
  }

  // Fallback: try word by word matching
  if (!bestMatch) {
    const words = cleanName.split(' ').filter(w => w.length > 3);
    for (const dish of currentInventory) {
      const dishNameLower = dish.name.toLowerCase();
      let score = 0;
      for (const w of words) {
        if (dishNameLower.includes(w)) score++;
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
  // Split by 4+ asterisks or 4+ dashes
  const daysBlocks = text.split(/[\*\-]{4,}/);
  let currentWeek: any[] = [];
  const weeks: WeekMenu[] = [];
  
  const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  for (const block of daysBlocks) {
    const trimmedBlock = block.trim();
    if (trimmedBlock.length < 10) continue;
    
    const isSaturday = trimmedBlock.includes('(SABADO)') || trimmedBlock.toLowerCase().includes('sabado') || trimmedBlock.toLowerCase().includes('sábado');
    
    // Support "Sopa:" / "Sopas:" and "Segundo:" / "Segundos:"
    const parts = trimmedBlock.split(/🍛|Segundos?:/i);
    const sopasSection = parts[0].split(/Sopas?:/i).pop() || parts[0];
    const segundosSection = parts.length > 1 ? parts[1] : '';
    
    const sopasLines = sopasSection.split('\n').map(l => l.trim()).filter(l => l.length > 3 && !l.toLowerCase().includes('menú'));
    const segundosLines = segundosSection ? segundosSection.split('\n').map(l => l.trim()).filter(l => l.length > 3) : [];
    
    const daySoups = sopasLines.map(l => findDishByFuzzyName(l, currentInventory)).filter(Boolean) as Dish[];
    const dayMains = segundosLines.map(l => findDishByFuzzyName(l, currentInventory)).filter(Boolean) as Dish[];
    
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

  // If there's a partial week left, push it
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return weeks;
}
