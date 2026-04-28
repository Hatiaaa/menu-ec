import { supabase } from './supabaseClient';
import type { Dish, Protein, DishType } from '../data/platos';
import type { WeekMenu } from './generator';

// Entrada del historial con el ID de fila de Supabase expuesto
export interface HistoryEntry {
  id: string;
  menu: WeekMenu;
}

export async function getDishes(): Promise<Dish[]> {
  const { data, error } = await supabase.from('dishes').select('*');
  if (error) {
    console.error('Error fetching dishes:', error);
    return [];
  }
  return data.map(d => ({
    id: d.id,
    name: d.name,
    type: d.type as DishType,
    protein: d.protein as Protein,
    isPrincipal: d.is_principal
  }));
}

export async function saveDish(dish: Omit<Dish, 'id'>) {
  const { data, error } = await supabase.from('dishes').insert([{
    name: dish.name,
    type: dish.type,
    protein: dish.protein,
    is_principal: dish.isPrincipal
  }]).select();
  
  if (error) throw error;
  return data[0];
}

export async function updateDish(dish: Dish) {
  const { error } = await supabase.from('dishes').update({
    name: dish.name,
    type: dish.type,
    protein: dish.protein,
    is_principal: dish.isPrincipal
  }).eq('id', dish.id);
  
  if (error) throw error;
}

export async function deleteDish(id: string) {
  const { error } = await supabase.from('dishes').delete().eq('id', id);
  if (error) throw error;
}

export async function getHistory(): Promise<HistoryEntry[]> {
  const { data, error } = await supabase
    .from('menu_history')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);

  if (error) {
    console.error('Error fetching history:', error);
    return [];
  }

  // Invertir para orden cronológico (más antiguo primero) que es lo que espera el generador
  return data.reverse().map(row => ({
    id: row.id as string,
    menu: row.menu_data as WeekMenu,
  }));
}

export async function saveWeekToHistory(week: WeekMenu) {
  const { error } = await supabase.from('menu_history').insert([{
    menu_data: week
  }]);
  
  if (error) throw error;
  
  // Lógica de retención: borrar los más antiguos si hay más de 3
  const { data: allHistory } = await supabase.from('menu_history').select('id').order('created_at', { ascending: false });
  
  if (allHistory && allHistory.length > 3) {
    const idsToDelete = allHistory.slice(3).map(h => h.id);
    await supabase.from('menu_history').delete().in('id', idsToDelete);
  }
}

/** Guarda el estado actualizado de un menú semanal ya existente en el historial. */
export async function updateHistoryEntry(id: string, week: WeekMenu) {
  const { error } = await supabase
    .from('menu_history')
    .update({ menu_data: week })
    .eq('id', id);
  if (error) throw error;
}

/** Elimina toda una semana del historial por su ID de fila. */
export async function deleteWeekFromHistory(id: string) {
  const { error } = await supabase.from('menu_history').delete().eq('id', id);
  if (error) throw error;
}

export async function saveMultipleWeeksToHistory(weeks: WeekMenu[]) {
  // Borrar todo el historial previo
  await clearHistory();

  // Insertar una por una para asegurar que el created_at sea secuencial y correcto
  for (const week of weeks.slice(-3)) {
    const { error } = await supabase.from('menu_history').insert([{
      menu_data: week
    }]);
    if (error) throw error;
    // Pequeño delay para asegurar timestamps distintos
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

export async function clearHistory() {
  const { error } = await supabase.from('menu_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw error;
}
