import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Faltan variables de entorno");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Extraer inventory
import { inventory } from './src/data/platos.js';
import { initialHistory } from './src/data/initialHistory.js';

async function seed() {
  console.log("Iniciando migración a Supabase...");

  // 1. Subir platos
  console.log(`Subiendo ${inventory.length} platos...`);
  const dishesToInsert = inventory.map(dish => ({
    name: dish.name,
    type: dish.type,
    protein: dish.protein,
    is_principal: dish.isPrincipal
  }));

  // Vaciar tabla primero por seguridad
  await supabase.from('dishes').delete().neq('name', 'none');

  const { error: errorDishes } = await supabase.from('dishes').insert(dishesToInsert);
  if (errorDishes) {
    console.error("Error subiendo platos:", errorDishes);
  } else {
    console.log("¡Platos subidos con éxito!");
  }

  // 2. Subir historial inicial
  console.log("Subiendo historial...");
  await supabase.from('menu_history').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Vaciar
  
  // Guardamos las semanas completas de initialHistory
  const { error: errorHistory } = await supabase.from('menu_history').insert({
    menu_data: initialHistory
  });

  if (errorHistory) {
    console.error("Error subiendo historial:", errorHistory);
  } else {
    console.log("¡Historial subido con éxito!");
  }

  console.log("Migración completada.");
}

seed();
