import { createClient } from '@supabase/supabase-js';
import { parseHistoryMarkdown } from './src/lib/parser';
import { clearHistory, getDishes, saveMultipleWeeksToHistory } from './src/lib/api';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

const text = `
Semana 1 
Lunes
Sopa:
Caldo de albóndigas
Locro de nabo
Segundos:
Lomito
Enrollado de camarón
Seco de pollo
------
Martes
Sopa:
Caldo de mondongo
Crema de zapallo
Segundos:
Medallones de cerdo con ensalada de beterava
Pollo salteado con vegetales
Manizado de pescado
------
Miercoles
Sopa:
Caldo de bola
Sopa de queso
Segundos:
Pollo a la naranja con ensalada de fréjol
Estofado de carne
Ensalada de atún con fideo
------
Jueves
Sopa:
Sopa de camarón
Sopa de pollo
Segundos:
Yapingacho
Tallarin de pollo
Carne de hamburguesa con menestra de lenteja
------
Viernes
Sopa:
Caldo de lenteja con carne
Crema de legumbres
Segundos:
Pollo al horno con ensalada de fideo
Estofado de chancho
Guatita
------
Sabado
Sopa:
Menestron de Chancho
Crema de zanahoria
Segundos:
Pollo apanado con puré
Churrasco
------

Semana 2
Lunes
Sopa:
Sancocho de hueso
Crema de acelga
Segundos:
Arroz con pollo
Sudado de pescado
Pollo al curry
------
Martes
Sopa:
Caldo de gallina
Crema de zapallo
Segundos:
Carne de hamburguesa
Pollo apanado
Tortilla de camarón
------
Miercoles
Sopa:
Sancocho montubio
Sopa de lenteja con queso
Segundos:
Pollo en salsa de champiñones
Carne frita con ensalada de beterava
Enrollado de atún
------
Jueves
Sopa:
Chupe de pescado
Sopa de pollo
Segundos:
Bistec de hígado con moro
Seco de chancho
Ensalada rusa de pollo
------
Viernes
Sopa:
Caldo de torreja
Crema de legumbres
Segundos:
Pollo broaster con menestra de fréjol
Carne en salsa de champiñones
Sango mixto
------
Sabado
Sopa:
Sopa de camarón
Crema de espinaca
Segundos:
Chancho en salsa BBQ con puré
Pollo al horno con ensalada de fideo
`;

async function run() {
  console.log('Fetching dishes...');
  const inventory = await getDishes();
  console.log(`Found ${inventory.length} dishes.`);

  console.log('Parsing history...');
  const weeks = parseHistoryMarkdown(text, inventory);
  console.log(`Parsed ${weeks.length} weeks.`);

  if (weeks.length > 0) {
    console.log('Saving to Supabase sequentially...');
    await saveMultipleWeeksToHistory(weeks);
    console.log('Success!');
  } else {
    console.log('No weeks parsed. Check the format.');
  }
}

run().catch(console.error);
