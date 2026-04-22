export type Protein = 'Res' | 'Pollo' | 'Cerdo' | 'Marisco' | 'Vegetariano' | 'Mixto';
export type DishType = 'Sopa' | 'Segundo';

export interface Dish {
  id: string;
  name: string;
  type: DishType;
  protein: Protein;
  isPrincipal: boolean;
  category?: string;
}

export const inventory: Dish[] = [
  // SOPAS - PRINCIPALES
  { id: 's1', name: 'Caldo de bola', type: 'Sopa', protein: 'Res', isPrincipal: true, category: 'Caldos' },
  { id: 's2', name: 'Caldo de pata', type: 'Sopa', protein: 'Res', isPrincipal: true, category: 'Caldos' },
  { id: 's3', name: 'Caldo de gallina', type: 'Sopa', protein: 'Pollo', isPrincipal: true, category: 'Caldos' },
  { id: 's4', name: 'Sancocho de hueso', type: 'Sopa', protein: 'Res', isPrincipal: true, category: 'Caldos' },
  { id: 's5', name: 'Caldo de torreja', type: 'Sopa', protein: 'Res', isPrincipal: true, category: 'Caldos' },
  { id: 's6', name: 'Caldo de mondongo', type: 'Sopa', protein: 'Res', isPrincipal: true, category: 'Caldos' },
  { id: 's7', name: 'Caldo de albóndigas', type: 'Sopa', protein: 'Res', isPrincipal: true, category: 'Caldos' },
  { id: 's8', name: 'Caldo de albacora', type: 'Sopa', protein: 'Marisco', isPrincipal: true, category: 'Caldos' },
  { id: 's9', name: 'Sopa de lenteja con carne', type: 'Sopa', protein: 'Res', isPrincipal: true, category: 'Sopas de Granos' },
  { id: 's10', name: 'Menestrón de carne', type: 'Sopa', protein: 'Res', isPrincipal: true, category: 'Sopas de Granos' },
  { id: 's11', name: 'Menestrón de chancho', type: 'Sopa', protein: 'Cerdo', isPrincipal: true, category: 'Sopas de Granos' },
  { id: 's12', name: 'Sancocho de albacora', type: 'Sopa', protein: 'Marisco', isPrincipal: true, category: 'Sopas de Pescado' },
  { id: 's13', name: 'Biche de pescado', type: 'Sopa', protein: 'Marisco', isPrincipal: true, category: 'Sopas de Pescado' },
  { id: 's14', name: 'Chupe de pescado', type: 'Sopa', protein: 'Marisco', isPrincipal: true, category: 'Sopas de Pescado' },
  { id: 's15', name: 'Sopa de camarón', type: 'Sopa', protein: 'Marisco', isPrincipal: true, category: 'Sopas de Pescado' },
  { id: 's16', name: 'Sancocho montuvio', type: 'Sopa', protein: 'Res', isPrincipal: true, category: 'Otras' },

  // SOPAS - NO PRINCIPALES
  { id: 'ns1', name: 'Caldo de bolitas de verde con queso', type: 'Sopa', protein: 'Vegetariano', isPrincipal: false, category: 'Caldos' },
  { id: 'ns2', name: 'Caldo de hueso', type: 'Sopa', protein: 'Res', isPrincipal: false, category: 'Caldos' },
  { id: 'ns3', name: 'Aguado de menudencia', type: 'Sopa', protein: 'Pollo', isPrincipal: false, category: 'Caldos' },
  { id: 'ns4', name: 'Crema de zapallo', type: 'Sopa', protein: 'Vegetariano', isPrincipal: false, category: 'Cremas' },
  { id: 'ns5', name: 'Crema de espinaca', type: 'Sopa', protein: 'Vegetariano', isPrincipal: false, category: 'Cremas' },
  { id: 'ns6', name: 'Crema de zanahoria', type: 'Sopa', protein: 'Vegetariano', isPrincipal: false, category: 'Cremas' },
  { id: 'ns7', name: 'Crema de acelga', type: 'Sopa', protein: 'Vegetariano', isPrincipal: false, category: 'Cremas' },
  { id: 'ns8', name: 'Crema de legumbres', type: 'Sopa', protein: 'Vegetariano', isPrincipal: false, category: 'Cremas' },
  { id: 'ns9', name: 'Crema de lentejas', type: 'Sopa', protein: 'Vegetariano', isPrincipal: false, category: 'Cremas' },
  { id: 'ns10', name: 'Locro de papas', type: 'Sopa', protein: 'Vegetariano', isPrincipal: false, category: 'Cremas' },
  { id: 'ns11', name: 'Locro de habas', type: 'Sopa', protein: 'Vegetariano', isPrincipal: false, category: 'Cremas' },
  { id: 'ns12', name: 'Locro de nabo', type: 'Sopa', protein: 'Vegetariano', isPrincipal: false, category: 'Cremas' },
  { id: 'ns13', name: 'Locro de espinaca', type: 'Sopa', protein: 'Vegetariano', isPrincipal: false, category: 'Cremas' },
  { id: 'ns14', name: 'Caldo de lenteja con queso', type: 'Sopa', protein: 'Vegetariano', isPrincipal: false, category: 'Sopas de Granos' },
  { id: 'ns15', name: 'Sopa de queso', type: 'Sopa', protein: 'Vegetariano', isPrincipal: false, category: 'Otras' },
  { id: 'ns16', name: 'Sopa de pollo', type: 'Sopa', protein: 'Pollo', isPrincipal: false, category: 'Otras' },

  // SEGUNDOS - POLLO (Principales)
  { id: 'p1', name: 'Pollo al horno', type: 'Segundo', protein: 'Pollo', isPrincipal: true, category: 'Pollo' },
  { id: 'p2', name: 'Pollo al jugo', type: 'Segundo', protein: 'Pollo', isPrincipal: true, category: 'Pollo' },
  { id: 'p3', name: 'Seco de pollo', type: 'Segundo', protein: 'Pollo', isPrincipal: true, category: 'Pollo' },
  { id: 'p4', name: 'Seco de gallina', type: 'Segundo', protein: 'Pollo', isPrincipal: true, category: 'Pollo' },
  { id: 'p5', name: 'Pollo a la Coca-Cola', type: 'Segundo', protein: 'Pollo', isPrincipal: true, category: 'Pollo' },
  { id: 'p6', name: 'Pollo a la naranja', type: 'Segundo', protein: 'Pollo', isPrincipal: true, category: 'Pollo' },
  { id: 'p7', name: 'Pollo al curry', type: 'Segundo', protein: 'Pollo', isPrincipal: true, category: 'Pollo' },
  { id: 'p8', name: 'Pollo broaster', type: 'Segundo', protein: 'Pollo', isPrincipal: true, category: 'Pollo' },
  { id: 'p9', name: 'Pechuga apanada', type: 'Segundo', protein: 'Pollo', isPrincipal: true, category: 'Pollo' },
  { id: 'p10', name: 'Pollo frito', type: 'Segundo', protein: 'Pollo', isPrincipal: true, category: 'Pollo' },
  { id: 'p11', name: 'Encocado de pollo', type: 'Segundo', protein: 'Pollo', isPrincipal: true, category: 'Pollo' },

  // SEGUNDOS - POLLO (No Principales)
  { id: 'np1', name: 'Estofado de pollo', type: 'Segundo', protein: 'Pollo', isPrincipal: false, category: 'Pollo' },
  { id: 'np2', name: 'Pollo en salsa de champiñones', type: 'Segundo', protein: 'Pollo', isPrincipal: false, category: 'Pollo' },
  { id: 'np3', name: 'Pollo en salsa de tocino', type: 'Segundo', protein: 'Pollo', isPrincipal: false, category: 'Pollo' },
  { id: 'np4', name: 'Pollo a la plancha', type: 'Segundo', protein: 'Pollo', isPrincipal: false, category: 'Pollo' },
  { id: 'np5', name: 'Arroz con pollo', type: 'Segundo', protein: 'Pollo', isPrincipal: false, category: 'Pollo' },
  { id: 'np6', name: 'Pollo salteado con vegetales', type: 'Segundo', protein: 'Pollo', isPrincipal: false, category: 'Pollo' },
  { id: 'np7', name: 'Canelones de pollo', type: 'Segundo', protein: 'Pollo', isPrincipal: false, category: 'Pollo' },
  { id: 'np8', name: 'Enrollado de pollo', type: 'Segundo', protein: 'Pollo', isPrincipal: false, category: 'Pollo' },

  // SEGUNDOS - RES (Principales)
  { id: 'r1', name: 'Churrasco', type: 'Segundo', protein: 'Res', isPrincipal: true, category: 'Res' },
  { id: 'r2', name: 'Carne apanada', type: 'Segundo', protein: 'Res', isPrincipal: true, category: 'Res' },
  { id: 'r3', name: 'Tallarin con albóndigas', type: 'Segundo', protein: 'Res', isPrincipal: true, category: 'Res' },
  { id: 'r4', name: 'Carne de hamburguesa', type: 'Segundo', protein: 'Res', isPrincipal: true, category: 'Res' },
  { id: 'r5', name: 'Brocheta de carne y chorizo', type: 'Segundo', protein: 'Res', isPrincipal: true, category: 'Res' }, // Tratado como res para simplificar
  
  // SEGUNDOS - RES (No Principales)
  { id: 'nr1', name: 'Carne frita', type: 'Segundo', protein: 'Res', isPrincipal: false, category: 'Res' },
  { id: 'nr2', name: 'Lomito', type: 'Segundo', protein: 'Res', isPrincipal: false, category: 'Res' },
  { id: 'nr3', name: 'Bistec de carne', type: 'Segundo', protein: 'Res', isPrincipal: false, category: 'Res' },
  { id: 'nr4', name: 'Carne a la plancha', type: 'Segundo', protein: 'Res', isPrincipal: false, category: 'Res' },
  { id: 'nr5', name: 'Estofado de carne', type: 'Segundo', protein: 'Res', isPrincipal: false, category: 'Res' },
  { id: 'nr6', name: 'Carne en salsa de champiñones', type: 'Segundo', protein: 'Res', isPrincipal: false, category: 'Res' },
  { id: 'nr7', name: 'Seco de carne', type: 'Segundo', protein: 'Res', isPrincipal: false, category: 'Res' },
  { id: 'nr8', name: 'Albóndigas con puré', type: 'Segundo', protein: 'Res', isPrincipal: false, category: 'Res' },
  { id: 'nr9', name: 'Tallarin de carne', type: 'Segundo', protein: 'Res', isPrincipal: false, category: 'Res' },
  { id: 'nr10', name: 'Bistec de hígado', type: 'Segundo', protein: 'Res', isPrincipal: false, category: 'Res' },
  { id: 'nr11', name: 'Canelones de carne', type: 'Segundo', protein: 'Res', isPrincipal: false, category: 'Res' },

  // SEGUNDOS - CERDO (Principales)
  { id: 'c1', name: 'Chuleta BBQ', type: 'Segundo', protein: 'Cerdo', isPrincipal: true, category: 'Cerdo' },
  { id: 'c2', name: 'Fritada', type: 'Segundo', protein: 'Cerdo', isPrincipal: true, category: 'Cerdo' },
  { id: 'c3', name: 'Guatita', type: 'Segundo', protein: 'Cerdo', isPrincipal: true, category: 'Cerdo' }, // Tratado como Cerdo/Menudencia
  { id: 'c4', name: 'Llapingacho', type: 'Segundo', protein: 'Cerdo', isPrincipal: true, category: 'Cerdo' },
  { id: 'c5', name: 'Encocado de chancho', type: 'Segundo', protein: 'Cerdo', isPrincipal: true, category: 'Cerdo' },
  { id: 'c6', name: 'Seco de costilla', type: 'Segundo', protein: 'Cerdo', isPrincipal: true, category: 'Cerdo' },
  { id: 'c7', name: 'Chancho en salsa BBQ', type: 'Segundo', protein: 'Cerdo', isPrincipal: true, category: 'Cerdo' },
  { id: 'c8', name: 'Medallones de cerdo', type: 'Segundo', protein: 'Cerdo', isPrincipal: true, category: 'Cerdo' },
  { id: 'c9', name: 'Chuleta', type: 'Segundo', protein: 'Cerdo', isPrincipal: true, category: 'Cerdo' },

  // SEGUNDOS - CERDO (No Principales)
  { id: 'nc1', name: 'Seco de chancho', type: 'Segundo', protein: 'Cerdo', isPrincipal: false, category: 'Cerdo' },
  { id: 'nc2', name: 'Estofado de chancho', type: 'Segundo', protein: 'Cerdo', isPrincipal: false, category: 'Cerdo' },
  { id: 'nc3', name: 'Arroz chaufa', type: 'Segundo', protein: 'Cerdo', isPrincipal: false, category: 'Cerdo' }, // Tiene variaciones, asumo cerdo

  // SEGUNDOS - MARISCOS/PESCADO (Principales)
  { id: 'm1', name: 'Ceviche de camarón', type: 'Segundo', protein: 'Marisco', isPrincipal: true, category: 'Marisco' },
  { id: 'm2', name: 'Camarón al ajillo', type: 'Segundo', protein: 'Marisco', isPrincipal: true, category: 'Marisco' },
  { id: 'm3', name: 'Pescado frito', type: 'Segundo', protein: 'Marisco', isPrincipal: true, category: 'Marisco' },
  { id: 'm4', name: 'Arroz marinero', type: 'Segundo', protein: 'Marisco', isPrincipal: true, category: 'Marisco' },

  // SEGUNDOS - MARISCOS/PESCADO (No Principales)
  { id: 'nm1', name: 'Sango de camarón', type: 'Segundo', protein: 'Marisco', isPrincipal: false, category: 'Marisco' },
  { id: 'nm2', name: 'Camarones apanados', type: 'Segundo', protein: 'Marisco', isPrincipal: false, category: 'Marisco' },
  { id: 'nm3', name: 'Tortilla de camarón', type: 'Segundo', protein: 'Marisco', isPrincipal: false, category: 'Marisco' },
  { id: 'nm4', name: 'Ensalada de camarón', type: 'Segundo', protein: 'Marisco', isPrincipal: false, category: 'Marisco' },
  { id: 'nm5', name: 'Sudado de pescado', type: 'Segundo', protein: 'Marisco', isPrincipal: false, category: 'Marisco' },
  { id: 'nm6', name: 'Manizado de pescado', type: 'Segundo', protein: 'Marisco', isPrincipal: false, category: 'Marisco' },
  { id: 'nm7', name: 'Sango de albacora', type: 'Segundo', protein: 'Marisco', isPrincipal: false, category: 'Marisco' },
  { id: 'nm8', name: 'Ceviche de pescado', type: 'Segundo', protein: 'Marisco', isPrincipal: false, category: 'Marisco' },
  { id: 'nm9', name: 'Sango mixto', type: 'Segundo', protein: 'Marisco', isPrincipal: false, category: 'Marisco' },
  { id: 'nm10', name: 'Cazuela mixta', type: 'Segundo', protein: 'Marisco', isPrincipal: false, category: 'Marisco' },
  { id: 'nm11', name: 'Enrollado de atún', type: 'Segundo', protein: 'Marisco', isPrincipal: false, category: 'Marisco' },
  { id: 'nm12', name: 'Enrollado de camarón', type: 'Segundo', protein: 'Marisco', isPrincipal: false, category: 'Marisco' },
  { id: 'nm13', name: 'Ensalada de atún', type: 'Segundo', protein: 'Marisco', isPrincipal: false, category: 'Marisco' },
];
