import React, { useState, useEffect } from 'react';
import { ChefHat, Calendar, RotateCw, History, ArrowLeft, Lock, Copy, RefreshCw } from 'lucide-react';
import { generateMenu, swapDish } from './lib/generator';
import type { WeekMenu } from './lib/generator';
import type { Dish } from './data/platos';
import { getDishes, getHistory, saveWeekToHistory, saveDish, updateDish, deleteDish } from './lib/api';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  
  const [currentMenu, setCurrentMenu] = useState<WeekMenu | null>(null);
  const [history, setHistory] = useState<WeekMenu[]>([]);
  const [inventory, setInventory] = useState<Dish[]>([]);
  const [currentTab, setCurrentTab] = useState<'generator' | 'inventory'>('generator');
  const [showHistory, setShowHistory] = useState(false);
  
  // States para el inventario
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [newDish, setNewDish] = useState<Partial<Dish>>({ name: '', type: 'Segundo', protein: 'Pollo', isPrincipal: false });

  useEffect(() => {
    // Comprobar sesión
    if (sessionStorage.getItem('auth_entre_cucharas') === 'true') {
      setIsAuthenticated(true);
      fetchInitialData();
    }
  }, []);

  const fetchInitialData = async () => {
    const dishes = await getDishes();
    setInventory(dishes);
    const hist = await getHistory();
    setHistory(hist);
  };

  const handleGenerate = () => {
    if (inventory.length === 0) return alert('No hay platos en el inventario.');
    const newMenu = generateMenu(inventory, history);
    setCurrentMenu(newMenu);
  };

  const handleSaveAndRotate = async () => {
    if (!currentMenu) return;
    await saveWeekToHistory(currentMenu);
    alert('¡Menú guardado exitosamente en la nube!');
    setCurrentMenu(null);
    fetchInitialData();
  };

  const handleSwapDish = (dayIdx: number, isSoup: boolean, dish: Dish) => {
    if (!currentMenu) return;
    const newMenu = [...currentMenu];
    const dayMenu = newMenu[dayIdx];
    
    const replacement = swapDish(dayMenu, dish, inventory, history);
    if (!replacement) {
      alert('No se encontraron reemplazos válidos que cumplan las reglas para este día.');
      return;
    }

    if (isSoup) {
      const idx = dayMenu.sopas.findIndex(d => d.id === dish.id);
      dayMenu.sopas[idx] = replacement;
    } else {
      const idx = dayMenu.segundos.findIndex(d => d.id === dish.id);
      dayMenu.segundos[idx] = replacement;
    }
    
    setCurrentMenu(newMenu);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '900119ñ') { 
      setIsAuthenticated(true);
      sessionStorage.setItem('auth_entre_cucharas', 'true');
      fetchInitialData();
    } else {
      alert('PIN Incorrecto');
      setPin('');
    }
  };

  const handleCopyToClipboard = () => {
    if (!currentMenu) return;
    let text = '*MENÚ DE LA SEMANA - ENTRE CUCHARAS* 🍽️\n\n';
    currentMenu.forEach(day => {
      text += `*${day.day.toUpperCase()}*\n`;
      text += `🍵 *Sopas:*\n`;
      day.sopas.forEach(s => text += `- ${s.name}\n`);
      text += `🍛 *Segundos:*\n`;
      day.segundos.forEach(s => text += `- ${s.name}\n`);
      text += '\n';
    });
    navigator.clipboard.writeText(text);
    alert('¡Menú copiado al portapapeles! Ya puedes pegarlo en WhatsApp.');
  };



  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <form className="login-box glass-panel" onSubmit={handleLogin}>
          <div className="logo" style={{ justifyContent: 'center' }}>
            <ChefHat size={48} color="var(--primary)" />
          </div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--primary)' }}>Entre Cucharas</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Acceso Privado</p>
          
          <div style={{ marginTop: '1rem', width: '100%' }}>
            <input 
              type="password" 
              className="pin-input" 
              placeholder="PIN" 
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              autoFocus
            />
          </div>
          
          <button type="submit" className="btn" style={{ width: '100%', justifyContent: 'center' }}>
            <Lock size={20} /> Entrar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="glass-panel header">
        <div className="logo">
          <ChefHat size={32} color="var(--primary)" />
          <h1>Entre Cucharas</h1>
        </div>
        <p className="subtitle">Generador Inteligente de Menús Semanales</p>
      </header>

      <main className="main-content">
        <div className="tabs glass-panel" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', padding: '1rem' }}>
          <button className={`btn ${currentTab === 'generator' ? 'btn-save' : 'btn-secondary'}`} onClick={() => setCurrentTab('generator')}>Generador</button>
          <button className={`btn ${currentTab === 'inventory' ? 'btn-save' : 'btn-secondary'}`} onClick={() => setCurrentTab('inventory')}>Inventario ({inventory.length})</button>
        </div>

        {currentTab === 'generator' && (
          !showHistory ? (
            <>
              <div className="controls glass-panel">
                <div className="stats">
                  <History size={20} />
                  <span>Semanas en cuarentena: {history.length}/2</span>
                </div>
                <div className="actions">
                  <button className="btn btn-secondary" onClick={() => setShowHistory(true)}>
                    <History size={20} /> Ver Historial
                  </button>
                  <button className="btn" onClick={handleGenerate}>
                    <RotateCw size={20} /> Generar Nueva Semana
                  </button>
                  {currentMenu && (
                    <>
                      <button className="btn btn-secondary" onClick={handleCopyToClipboard}>
                        <Copy size={20} /> Copiar para WhatsApp
                      </button>
                      <button className="btn btn-save" onClick={handleSaveAndRotate}>
                        <Calendar size={20} /> Guardar y Rotar
                      </button>
                    </>
                  )}
                </div>
              </div>

            {currentMenu && (
              <div className="menu-grid">
                {currentMenu.map((dayMenu, idx) => (
                  <div key={idx} className="day-card glass-panel">
                    <h2 className="day-title">{dayMenu.day}</h2>
                    
                    <div className="section">
                      <h3 className="section-title">Sopas</h3>
                      <ul className="dish-list">
                        {dayMenu.sopas.map(sopa => (
                          <li key={sopa.id} className="dish-item" style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                              <span className="dish-name">{sopa.name}</span>
                              {sopa.isPrincipal && <span className="badge principal">Principal</span>}
                              <span className="badge protein">{sopa.protein}</span>
                            </div>
                            <button className="btn-icon" onClick={() => handleSwapDish(idx, true, sopa)} title="Cambiar Sopa">
                              <RefreshCw size={16} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="section">
                      <h3 className="section-title">Segundos</h3>
                      <ul className="dish-list">
                        {dayMenu.segundos.map(segundo => (
                          <li key={segundo.id} className="dish-item" style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                              <span className="dish-name">{segundo.name}</span>
                              {segundo.isPrincipal && <span className="badge principal">Principal</span>}
                              <span className="badge protein">{segundo.protein}</span>
                            </div>
                            <button className="btn-icon" onClick={() => handleSwapDish(idx, false, segundo)} title="Cambiar Segundo">
                              <RefreshCw size={16} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!currentMenu && (
              <div className="empty-state glass-panel">
                <ChefHat size={64} opacity={0.5} />
                <p>Haz clic en "Generar Nueva Semana" para empezar.</p>
              </div>
            )}
          </>
        ) : (
          <div className="history-view">
            <div className="history-header glass-panel">
              <h2>Historial de Cuarentena (Últimas {history.length} Semanas)</h2>
              <button className="btn btn-secondary" onClick={() => setShowHistory(false)}>
                <ArrowLeft size={20} /> Volver al Generador
              </button>
            </div>
            

            {history.length === 0 ? (
              <div className="empty-state glass-panel">
                <p>Aún no has guardado ninguna semana.</p>
              </div>
            ) : (
              <div className="history-weeks">
                {history.map((week, weekIdx) => (
                  <div key={weekIdx} className="history-week glass-panel">
                    <h3>Semana {weekIdx + 1} (Guardada)</h3>
                    <div className="menu-grid">
                      {week.map((dayMenu, idx) => (
                        <div key={idx} className="day-card">
                          <h4 className="day-title" style={{ fontSize: '1.2rem' }}>{dayMenu.day}</h4>
                          <div className="section">
                            <h5 className="section-title">Sopas</h5>
                            <ul className="dish-list">
                              {dayMenu.sopas.map(sopa => (
                                <li key={sopa.id} className="dish-item" style={{ padding: '4px 8px', fontSize: '0.9rem' }}>
                                  <span className="dish-name">{sopa.name}</span>
                                  <span className="badge protein">{sopa.protein}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="section">
                            <h5 className="section-title">Segundos</h5>
                            <ul className="dish-list">
                              {dayMenu.segundos.map(segundo => (
                                <li key={segundo.id} className="dish-item" style={{ padding: '4px 8px', fontSize: '0.9rem' }}>
                                  <span className="dish-name">{segundo.name}</span>
                                  <span className="badge protein">{segundo.protein}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      )}

        {currentTab === 'inventory' && (
          <div className="inventory-manager glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2>Gestor de Inventario</h2>
              <div className="stats">
                <span>Total: {inventory.length} platos</span>
              </div>
            </div>

            <div className="dish-form" style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
              <h3>{editingDish ? 'Editar Plato' : 'Agregar Nuevo Plato'}</h3>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                <input 
                  type="text" 
                  placeholder="Nombre del plato" 
                  value={newDish.name}
                  onChange={e => setNewDish({...newDish, name: e.target.value})}
                  className="login-input"
                  style={{ flex: '1 1 200px' }}
                />
                <select 
                  value={newDish.type}
                  onChange={e => setNewDish({...newDish, type: e.target.value as 'Sopa' | 'Segundo'})}
                  className="login-input"
                  style={{ flex: '1 1 100px' }}
                >
                  <option value="Sopa">Sopa</option>
                  <option value="Segundo">Segundo</option>
                </select>
                <select 
                  value={newDish.protein}
                  onChange={e => setNewDish({...newDish, protein: e.target.value as any})}
                  className="login-input"
                  style={{ flex: '1 1 100px' }}
                >
                  <option value="Res">Res</option>
                  <option value="Cerdo">Cerdo</option>
                  <option value="Pollo">Pollo</option>
                  <option value="Marisco">Marisco</option>
                  <option value="Grano">Grano</option>
                  <option value="Huevo">Huevo</option>
                  <option value="Vegetariano">Vegetariano</option>
                </select>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white' }}>
                  <input 
                    type="checkbox" 
                    checked={newDish.isPrincipal}
                    onChange={e => setNewDish({...newDish, isPrincipal: e.target.checked})}
                  />
                  ¿Es Principal?
                </label>
                <button className="btn btn-save" onClick={async () => {
                  if (!newDish.name) return alert('Ponle nombre al plato');
                  if (editingDish) {
                    const updated = { ...editingDish, ...newDish } as Dish;
                    await updateDish(updated);
                    alert('Plato actualizado');
                  } else {
                    await saveDish(newDish as Omit<Dish, 'id'>);
                    alert('Plato agregado');
                  }
                  setNewDish({ name: '', type: 'Segundo', protein: 'Pollo', isPrincipal: false });
                  setEditingDish(null);
                  fetchInitialData();
                }}>
                  {editingDish ? 'Guardar Cambios' : 'Agregar Plato'}
                </button>
                {editingDish && (
                  <button className="btn btn-secondary" onClick={() => {
                    setEditingDish(null);
                    setNewDish({ name: '', type: 'Segundo', protein: 'Pollo', isPrincipal: false });
                  }}>Cancelar</button>
                )}
              </div>
            </div>

            <div className="inventory-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {inventory.map(dish => (
                <div key={dish.id} className="dish-item" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>{dish.name}</strong>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn-icon" onClick={() => {
                        setEditingDish(dish);
                        setNewDish({ name: dish.name, type: dish.type, protein: dish.protein, isPrincipal: dish.isPrincipal });
                      }}>✏️</button>
                      <button className="btn-icon" onClick={async () => {
                        if(confirm(`¿Eliminar ${dish.name}?`)) {
                          await deleteDish(dish.id);
                          fetchInitialData();
                        }
                      }}>🗑️</button>
                    </div>
                  </div>
                  <div>
                    <span className="badge" style={{ background: 'rgba(255,255,255,0.1)' }}>{dish.type}</span>
                    <span className="badge protein">{dish.protein}</span>
                    {dish.isPrincipal && <span className="badge principal">Principal</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
