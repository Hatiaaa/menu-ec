import type { Dish, Protein } from '../data/platos';


export interface DailyMenu {
  day: string;
  sopas: Dish[];
  segundos: Dish[];
}

export type WeekMenu = DailyMenu[];

// Función auxiliar para obtener un plato aleatorio y removerlo de la lista disponible
function popRandomDish(dishes: Dish[]): Dish | null {
  if (dishes.length === 0) return null;
  const index = Math.floor(Math.random() * dishes.length);
  return dishes.splice(index, 1)[0];
}

// Generador de Menú
export function generateMenu(inventory: Dish[], historial: WeekMenu[]): WeekMenu {
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  
  // Función interna para intentar generar con un historial específico
  const tryGenerateWithHistory = (historyToConsider: WeekMenu[]): WeekMenu | null => {
    const quarantinedIds = new Set<string>();
    historyToConsider.forEach(week => {
      week.forEach(day => {
        day.segundos.forEach(dish => quarantinedIds.add(dish.id));
      });
    });

    let validWeekFound = false;
    let weekAttempts = 0;
    let finalWeekMenu: WeekMenu = [];

    // Reintentar toda la semana si nos quedamos atascados en un día (Backtracking)
    while (!validWeekFound && weekAttempts < 100) {
      weekAttempts++;
      
      const availableSoups = [...inventory.filter(d => d.type === 'Sopa')];
      const availableMains = [...inventory.filter(d => d.type === 'Segundo' && !quarantinedIds.has(d.id))];
      
      const weekMenu: WeekMenu = [];
      let weekFailed = false;

      for (const day of days) {
        const isSaturday = day === 'Sábado';
        const numMains = isSaturday ? 2 : 3;

        let validDayFound = false;
        let dayAttempts = 0;
        let dailyMenu: DailyMenu = { day, sopas: [], segundos: [] };

        while (!validDayFound && dayAttempts < 50) {
          dayAttempts++;
          
          const tempSoups = [...availableSoups];
          const tempMains = [...availableMains];
          
          const daySoups: Dish[] = [];
          const dayMains: Dish[] = [];

          // 1 Principal
          const mainPrincipals = tempMains.filter(d => d.isPrincipal);
          const selectedMainPrincipal = popRandomDish(mainPrincipals);
          if (selectedMainPrincipal) dayMains.push(selectedMainPrincipal);

          // N No Principales
          const mainNonPrincipals = tempMains.filter(d => !d.isPrincipal);
          for (let i = 0; i < numMains - 1; i++) {
            const dish = popRandomDish(mainNonPrincipals);
            if (dish) dayMains.push(dish);
          }

          // Validaciones de Segundos
          const mainProteins = dayMains.map(d => d.protein);
          const proteinCounts = mainProteins.reduce((acc, p) => {
            acc[p] = (acc[p] || 0) + 1;
            return acc;
          }, {} as Record<Protein, number>);

          const hasInvalidMainProteins = Object.entries(proteinCounts).some(([p, count]) => {
            if (p === 'Marisco' && count > 1) return true; // Max 1 marisco
            if (count > 2) return true; // Max 2 de cualquier otra
            return false;
          });

          if (hasInvalidMainProteins || dayMains.length < numMains) continue;

          const repeatedProteins = new Set<Protein>();
          Object.entries(proteinCounts).forEach(([p, count]) => {
            if (count >= 2) repeatedProteins.add(p as Protein);
          });

          // Sopas
          let soupPrincipals = tempSoups.filter(d => d.isPrincipal);
          soupPrincipals = soupPrincipals.filter(s => {
            if (repeatedProteins.has(s.protein)) return false;
            return true;
          });

          const selectedSoupPrincipal = popRandomDish(soupPrincipals);
          if (selectedSoupPrincipal) daySoups.push(selectedSoupPrincipal);

          let soupNonPrincipals = tempSoups.filter(d => !d.isPrincipal);
          soupNonPrincipals = soupNonPrincipals.filter(s => {
            if (repeatedProteins.has(s.protein)) return false;
            if (selectedSoupPrincipal && s.protein === selectedSoupPrincipal.protein) return false;
            if (selectedSoupPrincipal && selectedSoupPrincipal.protein === 'Marisco' && s.protein === 'Marisco') return false;
            return true;
          });

          const selectedSoupNonPrincipal = popRandomDish(soupNonPrincipals);
          if (selectedSoupNonPrincipal) daySoups.push(selectedSoupNonPrincipal);

          if (daySoups.length < 2) continue;

          dailyMenu = { day, sopas: daySoups, segundos: dayMains };
          validDayFound = true;
          
          // Remover globales
          daySoups.forEach(ds => {
            const idx = availableSoups.findIndex(s => s.id === ds.id);
            if (idx !== -1) availableSoups.splice(idx, 1);
          });
          dayMains.forEach(dm => {
            const idx = availableMains.findIndex(s => s.id === dm.id);
            if (idx !== -1) availableMains.splice(idx, 1);
          });
        }

        if (!validDayFound) {
          weekFailed = true;
          break;
        }
        weekMenu.push(dailyMenu);
      }

      if (!weekFailed) {
        validWeekFound = true;
        finalWeekMenu = weekMenu;
      }
    }

    return validWeekFound ? finalWeekMenu : null;
  };

  // Intentar con el historial completo (2 o 3 semanas)
  let result = tryGenerateWithHistory(historial);
  
  // Fallback 1: Si falla, intentar relajando la cuarentena a solo la ÚLTIMA semana
  if (!result && historial.length > 1) {
    console.warn("No se pudo generar con cuarentena completa. Reduciendo cuarentena a 1 semana.");
    result = tryGenerateWithHistory([historial[historial.length - 1]]);
  }

  // Fallback 2: Si aún falla, generar SIN cuarentena (ignorar historial)
  if (!result) {
    console.error("No hay suficientes platos para cumplir las reglas. Generando sin cuarentena.");
    result = tryGenerateWithHistory([]);
  }

  // Fallback extremo (si aún con todo falla por mala suerte aleatoria)
  if (!result) {
    return []; // En el peor de los casos devuelve vacío, pero con 100 intentos sin cuarentena es casi imposible.
  }

  return result;
}

export function swapDish(dayMenu: DailyMenu, dishToSwap: Dish, inventory: Dish[], historial: WeekMenu[]): Dish | null {
  const candidates = getValidReplacements(dayMenu, dishToSwap, inventory, historial);
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/**
 * Devuelve la lista completa de platos válidos para reemplazar `dishToSwap` en `dayMenu`,
 * respetando todas las reglas del negocio:
 *  - Mismo tipo (Sopa / Segundo) y misma condición de Principal.
 *  - No estar ya asignado en este día ni en ningún otro día de la semana actual.
 *  - Segundos: no estar en cuarentena (historial de semanas anteriores).
 *  - No violar las reglas cruzadas de proteínas del día resultante.
 *
 * @param weekMenu  El menú completo de la semana en edición (para excluir platos ya usados en otros días).
 * @param dayIndex  El índice del día actual dentro de weekMenu.
 */
export function getValidReplacements(
  dayMenu: DailyMenu,
  dishToSwap: Dish,
  inventory: Dish[],
  historial: WeekMenu[],
  weekMenu?: WeekMenu,
  dayIndex?: number
): Dish[] {
  const isSoup = dishToSwap.type === 'Sopa';

  // IDs de los platos que ya están en el día (excepto el que se va a reemplazar)
  const currentDishIds = new Set([
    ...dayMenu.sopas.map(d => d.id),
    ...dayMenu.segundos.map(d => d.id),
  ]);
  currentDishIds.delete(dishToSwap.id);

  // IDs de platos usados en OTROS días de la semana actual (regla: nada se repite en la semana)
  const otherDaysIds = new Set<string>();
  if (weekMenu && dayIndex !== undefined) {
    weekMenu.forEach((otherDay, idx) => {
      if (idx === dayIndex) return; // Saltamos el día actual
      otherDay.sopas.forEach(d => otherDaysIds.add(d.id));
      otherDay.segundos.forEach(d => otherDaysIds.add(d.id));
    });
  }

  // IDs en cuarentena (solo aplica a segundos, de semanas anteriores en historial)
  const quarantinedIds = new Set<string>();
  historial.forEach(week => {
    week.forEach(day => {
      day.segundos.forEach(dish => quarantinedIds.add(dish.id));
    });
  });

  return inventory.filter(candidate => {
    // Mismo tipo y condición de principal
    if (candidate.type !== dishToSwap.type) return false;
    if (candidate.isPrincipal !== dishToSwap.isPrincipal) return false;
    // No el mismo plato
    if (candidate.id === dishToSwap.id) return false;
    // No ya en este día
    if (currentDishIds.has(candidate.id)) return false;
    // No en ningún otro día de la semana actual
    if (otherDaysIds.has(candidate.id)) return false;
    // Cuarentena solo para segundos
    if (!isSoup && quarantinedIds.has(candidate.id)) return false;

    // --- Validación de proteínas ---
    if (isSoup) {
      // Construir la lista de sopas resultante si aplicamos el reemplazo
      const resultSoups = dayMenu.sopas.map(s => (s.id === dishToSwap.id ? candidate : s));

      // Regla: las 2 sopas no pueden compartir proteína
      const soupProteins = resultSoups.map(s => s.protein);
      if (new Set(soupProteins).size < soupProteins.length) return false;

      // Regla cruzada: si en segundos hay una proteína repetida 2 veces,
      // ninguna sopa puede tener esa proteína.
      const mainProteinCounts = dayMenu.segundos.reduce((acc, d) => {
        acc[d.protein] = (acc[d.protein] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const repeatedMainProteins = new Set(
        Object.entries(mainProteinCounts)
          .filter(([, count]) => count >= 2)
          .map(([p]) => p)
      );
      if (repeatedMainProteins.has(candidate.protein)) return false;
    } else {
      // Construir la lista de segundos resultante si aplicamos el reemplazo
      const resultMains = dayMenu.segundos.map(d => (d.id === dishToSwap.id ? candidate : d));

      // Regla: max 1 marisco en segundos
      const mainProteinCounts = resultMains.reduce((acc, d) => {
        acc[d.protein] = (acc[d.protein] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      if ((mainProteinCounts['Marisco'] || 0) > 1) return false;
      // Regla: max 2 de cualquier otra proteína en segundos
      if (Object.values(mainProteinCounts).some(c => c > 2)) return false;

      // Regla cruzada inversa: si con este reemplazo una proteína queda repetida 2 veces en segundos,
      // ninguna sopa del día puede tener esa proteína.
      const repeatedMainProteins = new Set(
        Object.entries(mainProteinCounts)
          .filter(([, count]) => count >= 2)
          .map(([p]) => p)
      );
      const soupProteins = new Set(dayMenu.sopas.map(s => s.protein));
      for (const rp of repeatedMainProteins) {
        if (soupProteins.has(rp)) return false;
      }
    }

    return true;
  });
}
