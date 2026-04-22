import type { Dish } from '../data/platos';
import { inventory } from '../data/platos';
import type { WeekMenu } from './generator';

function findDishByFuzzyName(name: string): Dish | null {
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
    .replace('chancho al horno', 'seco de chancho')
    .trim();
  
  let bestMatch: Dish | null = null;
  let bestScore = 0;

  for (const dish of inventory) {
    const dishNameLower = dish.name.toLowerCase();
    if (dishNameLower === cleanName) return dish;
    
    // Partial match
    let score = 0;
    const words = cleanName.split(' ');
    for (const w of words) {
      if (w.length > 3 && dishNameLower.includes(w)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = dish;
    }
  }
  return bestMatch;
}

export function parseHistoryMarkdown(text: string): WeekMenu[] {
  const daysBlocks = text.split(/\*{4,}/);
  let currentWeek: any[] = [];
  const weeks: WeekMenu[] = [];
  
  const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  for (const block of daysBlocks) {
    if (block.trim().length < 10) continue;
    
    const isSaturday = block.includes('(SABADO)') || block.toLowerCase().includes('sabado') || block.toLowerCase().includes('sábado');
    
    const parts = block.split(/🍛|Segundos/i);
    const sopasSection = parts[0];
    const segundosSection = parts.length > 1 ? parts[1] : '';
    
    const sopasLines = sopasSection.split('\n').filter(l => l.trim().startsWith('-'));
    const segundosLines = segundosSection ? segundosSection.split('\n').filter(l => l.trim().startsWith('-')) : [];
    
    const daySoups = sopasLines.map(l => findDishByFuzzyName(l.replace('-', '').trim())).filter(Boolean) as Dish[];
    const dayMains = segundosLines.map(l => findDishByFuzzyName(l.replace('-', '').trim())).filter(Boolean) as Dish[];
    
    currentWeek.push({
      day: dayNames[currentWeek.length] || 'Día Extra',
      sopas: daySoups,
      segundos: dayMains
    });

    if (currentWeek.length === 6 || isSaturday) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  return weeks;
}
