import React, { useState, useEffect } from 'react';
import { ChefHat, Calendar, RotateCw, History, ArrowLeft, Lock, Copy, Trash2, Upload } from 'lucide-react';
import { generateMenu, getValidReplacements } from './lib/generator';
import type { WeekMenu, DailyMenu } from './lib/generator';
import type { Dish } from './data/platos';
import {
  getDishes, getHistory, saveWeekToHistory, saveMultipleWeeksToHistory,
  clearHistory, saveDish, updateDish, deleteDish,
  updateHistoryEntry, deleteWeekFromHistory,
} from './lib/api';
import type { HistoryEntry } from './lib/api';
import { parseHistoryMarkdown } from './lib/parser';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');

  const [currentMenu, setCurrentMenu] = useState<WeekMenu | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [inventory, setInventory] = useState<Dish[]>([]);
  const [currentTab, setCurrentTab] = useState<'generator' | 'inventory'>('generator');
  const [showHistory, setShowHistory] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [savingHistoryId, setSavingHistoryId] = useState<string | null>(null);

  // States para el inventario
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [newDish, setNewDish] = useState<Partial<Dish>>({ name: '', type: 'Segundo', protein: 'Pollo', isPrincipal: false });
  const [showForm, setShowForm] = useState(false);

  // Filtros del inventario
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'Sopa' | 'Segundo'>('all');
  const [filterProtein, setFilterProtein] = useState<string>('all');

  useEffect(() => {
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

  // WeekMenu[] que usa el generador (solo los menús, sin el id de Supabase)
  const historyMenus: WeekMenu[] = history.map(e => e.menu);

  const handleGenerate = () => {
    if (inventory.length === 0) return alert('No hay platos en el inventario.');
    const newMenu = generateMenu(inventory, historyMenus);
    setCurrentMenu(newMenu);
  };

  const handleSaveAndRotate = async () => {
    if (!currentMenu) return;
    await saveWeekToHistory(currentMenu);
    alert('¡Menú guardado exitosamente en la nube!');
    setCurrentMenu(null);
    fetchInitialData();
  };

  // Cambiar un plato en el menú en edición (pestaña Generador)
  const handleSwapDish = (dayIdx: number, isSoup: boolean, currentDish: Dish, replacementId: string) => {
    if (!currentMenu) return;
    const replacement = inventory.find(d => d.id === replacementId);
    if (!replacement) return;

    const newMenu = [...currentMenu];
    const dayMenu = newMenu[dayIdx];

    if (isSoup) {
      const idx = dayMenu.sopas.findIndex(d => d.id === currentDish.id);
      dayMenu.sopas[idx] = replacement;
    } else {
      const idx = dayMenu.segundos.findIndex(d => d.id === currentDish.id);
      dayMenu.segundos[idx] = replacement;
    }

    setCurrentMenu(newMenu);
  };

  // ── Historial editable ──────────────────────────────────────────────────────

  /** Cambia un plato en una semana del historial y guarda en Supabase. */
  const handleHistorySwapDish = async (
    entry: HistoryEntry,
    dayIdx: number,
    isSoup: boolean,
    currentDish: Dish,
    replacementId: string
  ) => {
    const replacement = inventory.find(d => d.id === replacementId);
    if (!replacement) return;

    // Construir el menú actualizado (inmutablemente)
    const updatedMenu: WeekMenu = entry.menu.map((day, dIdx) => {
      if (dIdx !== dayIdx) return day;
      if (isSoup) {
        return {
          ...day,
          sopas: day.sopas.map(s => (s.id === currentDish.id ? replacement : s)),
        };
      } else {
        return {
          ...day,
          segundos: day.segundos.map(s => (s.id === currentDish.id ? replacement : s)),
        };
      }
    });

    // Optimistic update: reflejar el cambio en la UI de inmediato
    setHistory(prev =>
      prev.map(e => (e.id === entry.id ? { ...e, menu: updatedMenu } : e))
    );

    // Persistir en Supabase
    setSavingHistoryId(entry.id);
    try {
      await updateHistoryEntry(entry.id, updatedMenu);
    } catch (err) {
      console.error(err);
      alert('Error al guardar el cambio. Recargando historial...');
      fetchInitialData();
    } finally {
      setSavingHistoryId(null);
    }
  };

  /** Elimina un día de una semana del historial (feriados / días sin servicio). */
  const handleDeleteDay = async (entry: HistoryEntry, dayIdx: number) => {
    const dayName = entry.menu[dayIdx]?.day ?? 'este día';
    if (!confirm(`¿Eliminar ${dayName} del historial? Los platos de ese día volverán a estar disponibles para generación.`)) return;

    const updatedMenu: WeekMenu = entry.menu.filter((_, i) => i !== dayIdx);

    // Si queda vacía la semana, eliminar la fila completa
    if (updatedMenu.length === 0) {
      setHistory(prev => prev.filter(e => e.id !== entry.id));
      setSavingHistoryId(entry.id);
      try {
        await deleteWeekFromHistory(entry.id);
      } catch (err) {
        console.error(err);
        alert('Error al eliminar. Recargando...');
        fetchInitialData();
      } finally {
        setSavingHistoryId(null);
      }
      return;
    }

    // Optimistic update
    setHistory(prev =>
      prev.map(e => (e.id === entry.id ? { ...e, menu: updatedMenu } : e))
    );

    setSavingHistoryId(entry.id);
    try {
      await updateHistoryEntry(entry.id, updatedMenu);
    } catch (err) {
      console.error(err);
      alert('Error al guardar el cambio. Recargando historial...');
      fetchInitialData();
    } finally {
      setSavingHistoryId(null);
    }
  };

  /** Elimina una semana entera del historial. */
  const handleDeleteWeek = async (entry: HistoryEntry) => {
    if (!confirm('¿Eliminar esta semana completa del historial?')) return;
    setHistory(prev => prev.filter(e => e.id !== entry.id));
    try {
      await deleteWeekFromHistory(entry.id);
    } catch (err) {
      console.error(err);
      alert('Error al eliminar. Recargando...');
      fetchInitialData();
    }
  };

  // ── Otros handlers ──────────────────────────────────────────────────────────

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
      day.sopas.forEach(s => (text += `- ${s.name}\n`));
      text += `🍛 *Segundos:*\n`;
      day.segundos.forEach(s => (text += `- ${s.name}\n`));
      text += '\n';
    });
    navigator.clipboard.writeText(text);
    alert('¡Menú copiado al portapapeles! Ya puedes pegarlo en WhatsApp.');
  };

  const handleImportHistory = async () => {
    try {
      const parsedWeeks = parseHistoryMarkdown(importText, inventory);
      if (parsedWeeks.length === 0) {
        alert('No se detectó ninguna semana válida. Revisa el formato.');
        return;
      }
      await saveMultipleWeeksToHistory(parsedWeeks);
      alert(`¡Éxito! Se importaron ${parsedWeeks.length} semanas (se guardaron las 3 más recientes).`);
      setImportText('');
      setShowImport(false);
      fetchInitialData();
    } catch (error) {
      console.error(error);
      alert('Error al procesar el historial.');
    }
  };

  const handleClearHistory = async () => {
    if (confirm('¿Estás seguro de que quieres borrar TODO el historial? Esta acción no se puede deshacer.')) {
      try {
        await clearHistory();
        alert('Historial borrado correctamente.');
        fetchInitialData();
      } catch (error) {
        console.error(error);
        alert('Error al borrar el historial.');
      }
    }
  };

  // ── Render helpers ──────────────────────────────────────────────────────────

  /** Renderiza la lista de platos con dropdown editable. */
  const renderDishList = (
    dishes: Dish[],
    dayMenu: DailyMenu,
    _isSoup: boolean,
    weekMenu: WeekMenu,
    dayIndex: number,
    onSwap: (currentDish: Dish, replacementId: string) => void
  ) => (
    <ul className="dish-list">
      {dishes.map(dish => {
        const options = getValidReplacements(dayMenu, dish, inventory, historyMenus, weekMenu, dayIndex);
        return (
          <li key={dish.id} className="dish-item dish-item--select">
            <div className="dish-info">
              {dish.isPrincipal && <span className="badge principal">Principal</span>}
              <span className="badge protein">{dish.protein}</span>
            </div>
            <select
              className="dish-select"
              value={dish.id}
              onChange={e => onSwap(dish, e.target.value)}
            >
              <option value={dish.id}>{dish.name}</option>
              {options.length === 0 && <option disabled>— Sin alternativas —</option>}
              {options.map(opt => (
                <option key={opt.id} value={opt.id}>
                  {opt.name} ({opt.protein})
                </option>
              ))}
            </select>
          </li>
        );
      })}
    </ul>
  );

  // ── Login ───────────────────────────────────────────────────────────────────

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
              onChange={e => setPin(e.target.value)}
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

  // ── App principal ───────────────────────────────────────────────────────────

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

        {/* ── GENERADOR ── */}
        {currentTab === 'generator' && (
          !showHistory ? (
            <>
              <div className="controls glass-panel">
                <div className="stats">
                  <History size={20} />
                  <span>Semanas en cuarentena: {history.length}/3</span>
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
                        {renderDishList(dayMenu.sopas, dayMenu, true, currentMenu, idx, (dish, rid) => handleSwapDish(idx, true, dish, rid))}
                      </div>

                      <div className="section">
                        <h3 className="section-title">Segundos</h3>
                        {renderDishList(dayMenu.segundos, dayMenu, false, currentMenu, idx, (dish, rid) => handleSwapDish(idx, false, dish, rid))}
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

            /* ── HISTORIAL ── */
            <div className="history-view">
              <div className="history-header glass-panel">
                <h2>Historial de Cuarentena (Últimas {history.length} Semanas)</h2>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button className="btn btn-secondary" style={{ borderColor: '#ef4444', color: '#ef4444' }} onClick={handleClearHistory}>
                    <Trash2 size={20} /> Borrar Todo
                  </button>
                  <button className="btn btn-secondary" onClick={() => setShowImport(!showImport)}>
                    <Upload size={20} /> {showImport ? 'Cerrar Importador' : 'Subir Historial'}
                  </button>
                  <button className="btn btn-secondary" onClick={() => setShowHistory(false)}>
                    <ArrowLeft size={20} /> Volver al Generador
                  </button>
                </div>
              </div>

              {showImport && (
                <div className="import-section glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                  <h3 style={{ marginTop: 0, color: 'var(--primary)' }}>Cargar Historial Manualmente</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    Pega aquí el contenido de tu archivo <code>historial_menus.md</code>.
                  </p>
                  <textarea
                    className="login-input"
                    style={{ width: '100%', height: '200px', margin: '1rem 0', fontFamily: 'monospace', fontSize: '0.8rem' }}
                    placeholder="******** LUNES Sopas: - Sopa de... Segundos: - Plato de..."
                    value={importText}
                    onChange={e => setImportText(e.target.value)}
                  />
                  <button className="btn btn-save" onClick={handleImportHistory}>
                    Analizar y Guardar Historial
                  </button>
                </div>
              )}

              {history.length === 0 ? (
                <div className="empty-state glass-panel">
                  <p>Aún no has guardado ninguna semana.</p>
                </div>
              ) : (
                <div className="history-weeks">
                  {history.map((entry, weekIdx) => (
                    <div key={entry.id} className="history-week glass-panel">
                      {/* Cabecera de semana */}
                      <div className="history-week-header">
                        <h3>
                          Semana {weekIdx + 1}
                          {savingHistoryId === entry.id && (
                            <span className="saving-indicator"> · Guardando…</span>
                          )}
                        </h3>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ borderColor: '#ef4444', color: '#ef4444' }}
                          onClick={() => handleDeleteWeek(entry)}
                          title="Eliminar semana completa"
                        >
                          <Trash2 size={14} /> Eliminar semana
                        </button>
                      </div>

                      {/* Días de la semana */}
                      <div className="menu-grid">
                        {entry.menu.map((dayMenu, dayIdx) => (
                          <div key={dayIdx} className="day-card history-day-card">
                            {/* Título del día + botón eliminar día */}
                            <div className="day-card-header">
                              <h4 className="day-title" style={{ fontSize: '1.2rem', margin: 0 }}>{dayMenu.day}</h4>
                              <button
                                className="btn-icon btn-icon--danger"
                                onClick={() => handleDeleteDay(entry, dayIdx)}
                                title={`Eliminar ${dayMenu.day} (feriado)`}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>

                            <div className="section">
                              <h5 className="section-title">Sopas</h5>
                              {renderDishList(
                                dayMenu.sopas,
                                dayMenu,
                                true,
                                entry.menu,
                                dayIdx,
                                (dish, rid) => handleHistorySwapDish(entry, dayIdx, true, dish, rid)
                              )}
                            </div>

                            <div className="section">
                              <h5 className="section-title">Segundos</h5>
                              {renderDishList(
                                dayMenu.segundos,
                                dayMenu,
                                false,
                                entry.menu,
                                dayIdx,
                                (dish, rid) => handleHistorySwapDish(entry, dayIdx, false, dish, rid)
                              )}
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

        {/* ── INVENTARIO ── */}
        {currentTab === 'inventory' && (
          <div className="inventory-manager glass-panel" style={{ padding: '2rem' }}>
            {/* ── Stats rápidas ── */}
          <div className="inv-stats-bar">
            {(['Sopa', 'Segundo'] as const).map(type => {
              const count = inventory.filter(d => d.type === type).length;
              const principals = inventory.filter(d => d.type === type && d.isPrincipal).length;
              return (
                <div key={type} className="inv-stat-card glass-panel">
                  <span className="inv-stat-label">{type === 'Sopa' ? '🍵 Sopas' : '🍛 Segundos'}</span>
                  <span className="inv-stat-number">{count}</span>
                  <span className="inv-stat-sub">{principals} principales</span>
                </div>
              );
            })}
            <div className="inv-stat-card glass-panel">
              <span className="inv-stat-label">📦 Total</span>
              <span className="inv-stat-number">{inventory.length}</span>
              <span className="inv-stat-sub">platos registrados</span>
            </div>
          </div>

          {/* ── Barra de búsqueda + filtros ── */}
          <div className="inv-toolbar glass-panel">
            <div className="inv-search-wrap">
              <svg className="inv-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input
                className="inv-search"
                type="text"
                placeholder="Buscar plato..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="inv-search-clear" onClick={() => setSearchQuery('')}>✕</button>
              )}
            </div>

            <div className="inv-filter-group">
              <span className="inv-filter-label">Tipo:</span>
              {(['all', 'Sopa', 'Segundo'] as const).map(t => (
                <button
                  key={t}
                  className={`inv-chip ${filterType === t ? 'inv-chip--active' : ''}`}
                  onClick={() => setFilterType(t)}
                >
                  {t === 'all' ? 'Todos' : t === 'Sopa' ? '🍵 Sopas' : '🍛 Segundos'}
                </button>
              ))}
            </div>

            <div className="inv-filter-group">
              <span className="inv-filter-label">Proteína:</span>
              {['all', 'Res', 'Pollo', 'Cerdo', 'Marisco', 'Vegetariano', 'Grano', 'Huevo'].map(p => (
                <button
                  key={p}
                  className={`inv-chip ${filterProtein === p ? 'inv-chip--active' : ''}`}
                  onClick={() => setFilterProtein(p)}
                >
                  {p === 'all' ? 'Todas' : p}
                </button>
              ))}
            </div>

            <button
              className="btn btn-save"
              style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}
              onClick={() => {
                setShowForm(true);
                setEditingDish(null);
                setNewDish({ name: '', type: 'Segundo', protein: 'Pollo', isPrincipal: false });
              }}
            >
              + Nuevo Plato
            </button>
          </div>

          {/* ── Formulario agregar/editar ── */}
          {(showForm || editingDish) && (
            <div className="inv-form glass-panel">
              <h3 className="inv-form-title">
                {editingDish ? '✏️ Editar Plato' : '➕ Agregar Nuevo Plato'}
              </h3>
              <div className="inv-form-grid">
                <div className="inv-form-field inv-form-field--wide">
                  <label>Nombre del plato</label>
                  <input
                    type="text"
                    placeholder="Ej: Seco de pollo"
                    value={newDish.name}
                    onChange={e => setNewDish({ ...newDish, name: e.target.value })}
                    className="inv-input"
                    autoFocus
                  />
                </div>
                <div className="inv-form-field">
                  <label>Tipo</label>
                  <select
                    value={newDish.type}
                    onChange={e => setNewDish({ ...newDish, type: e.target.value as 'Sopa' | 'Segundo' })}
                    className="inv-input"
                  >
                    <option value="Sopa">🍵 Sopa</option>
                    <option value="Segundo">🍛 Segundo</option>
                  </select>
                </div>
                <div className="inv-form-field">
                  <label>Proteína</label>
                  <select
                    value={newDish.protein}
                    onChange={e => setNewDish({ ...newDish, protein: e.target.value as any })}
                    className="inv-input"
                  >
                    <option value="Res">🥩 Res</option>
                    <option value="Pollo">🍗 Pollo</option>
                    <option value="Cerdo">🐷 Cerdo</option>
                    <option value="Marisco">🦐 Marisco</option>
                    <option value="Vegetariano">🥦 Vegetariano</option>
                    <option value="Grano">🫘 Grano</option>
                    <option value="Huevo">🥚 Huevo</option>
                  </select>
                </div>
                <div className="inv-form-field inv-form-field--check">
                  <label className="inv-checkbox-label">
                    <input
                      type="checkbox"
                      checked={newDish.isPrincipal}
                      onChange={e => setNewDish({ ...newDish, isPrincipal: e.target.checked })}
                    />
                    <span>¿Es Plato Principal?</span>
                  </label>
                  <p className="inv-form-hint">Los platos principales tienen prioridad en el generador.</p>
                </div>
              </div>
              <div className="inv-form-actions">
                <button
                  className="btn btn-save"
                  onClick={async () => {
                    if (!newDish.name?.trim()) return alert('Escribe el nombre del plato');
                    if (editingDish) {
                      await updateDish({ ...editingDish, ...newDish } as Dish);
                    } else {
                      await saveDish(newDish as Omit<Dish, 'id'>);
                    }
                    setNewDish({ name: '', type: 'Segundo', protein: 'Pollo', isPrincipal: false });
                    setEditingDish(null);
                    setShowForm(false);
                    fetchInitialData();
                  }}
                >
                  {editingDish ? 'Guardar Cambios' : 'Agregar Plato'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => { setShowForm(false); setEditingDish(null); setNewDish({ name: '', type: 'Segundo', protein: 'Pollo', isPrincipal: false }); }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* ── Lista de platos ── */}
          {(() => {
            const filtered = inventory.filter(d => {
              const matchSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase());
              const matchType = filterType === 'all' || d.type === filterType;
              const matchProtein = filterProtein === 'all' || d.protein === filterProtein;
              return matchSearch && matchType && matchProtein;
            });

            if (filtered.length === 0) {
              return (
                <div className="empty-state glass-panel" style={{ padding: '3rem' }}>
                  <p style={{ fontSize: '2rem', margin: 0 }}>🔍</p>
                  <p>No se encontraron platos con esos filtros.</p>
                  <button className="btn btn-secondary" onClick={() => { setSearchQuery(''); setFilterType('all'); setFilterProtein('all'); }}>
                    Limpiar filtros
                  </button>
                </div>
              );
            }

            return (
              <div className="inv-grid">
                {filtered.map(dish => (
                  <div key={dish.id} className={`inv-card inv-card--${dish.protein.toLowerCase()}`}>
                    <div className="inv-card-top">
                      <div className="inv-card-badges">
                        <span className={`inv-type-badge inv-type-badge--${dish.type.toLowerCase()}`}>
                          {dish.type === 'Sopa' ? '🍵' : '🍛'} {dish.type}
                        </span>
                        {dish.isPrincipal && <span className="badge principal">⭐ Principal</span>}
                      </div>
                      <div className="inv-card-actions">
                        <button
                          className="inv-action-btn inv-action-btn--edit"
                          title="Editar"
                          onClick={() => {
                            setEditingDish(dish);
                            setNewDish({ name: dish.name, type: dish.type, protein: dish.protein, isPrincipal: dish.isPrincipal });
                            setShowForm(false);
                          }}
                        >✏️</button>
                        <button
                          className="inv-action-btn inv-action-btn--delete"
                          title="Eliminar"
                          onClick={async () => {
                            if (confirm(`¿Eliminar "${dish.name}"?`)) {
                              await deleteDish(dish.id);
                              fetchInitialData();
                            }
                          }}
                        >🗑️</button>
                      </div>
                    </div>
                    <p className="inv-card-name">{dish.name}</p>
                    <div className="inv-card-footer">
                      <span className={`inv-protein-badge inv-protein--${dish.protein.toLowerCase()}`}>
                        {dish.protein}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
        )}
      </main>
    </div>
  );
}

export default App;
