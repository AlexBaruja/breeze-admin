import React, { useState, useEffect } from 'react'
import { LayoutGrid, Shirt, Cog, BarChart3, Users, Settings, Plus, RefreshCw, Clock, Activity, TrendingUp, AlertCircle, Package, Droplets, ArrowDownToLine } from 'lucide-react'
import { supabase } from './supabase'

function App() {
    const [activeTab, setActiveTab] = useState('dash')
    const [garments, setGarments] = useState<any[]>([])
    const [machines, setMachines] = useState<any[]>([])
    const [batches, setBatches] = useState<any[]>([])
    const [inventory, setInventory] = useState<any[]>([])
    const [operators, setOperators] = useState<any[]>([])
    const [attendance, setAttendance] = useState<any[]>([])
    const [recipes, setRecipes] = useState<any[]>([])
    const [recipeSupplies, setRecipeSupplies] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [modalType, setModalType] = useState<'garment' | 'inventory' | 'machine' | 'hr'>('garment')

    // Form states
    const [garmentForm, setGarmentForm] = useState({ nombre: '', requiere_planchado: true, tiempo_estandar_min: 15 })
    const [invFormData, setInvFormData] = useState({ nombre: '', stock_actual: 0, unidad: 'Litros', punto_reorden: 5 })
    const [machineForm, setMachineForm] = useState({ nombre: '', tipo: 'LAVADORA', marca: '' })
    const [operatorForm, setOperatorForm] = useState({ nombre: '', rol: 'OPERARIO' })
    const [recipeForm, setRecipeForm] = useState({ nombre: '', descripcion: '' })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        const [garmentRes, machineRes, batchRes, invRes, opRes, attRes] = await Promise.all([
            supabase.from('tipo_prenda').select('*').order('nombre'),
            supabase.from('maquina').select('*').eq('activo', true).order('nombre'),
            supabase.from('lote_trabajo').select('*, maquina(nombre)').is('hora_fin_estimada', null),
            supabase.from('insumo').select('*').order('nombre'),
            supabase.from('operario').select('*').order('nombre'),
            supabase.from('asistencia').select('*, operario(nombre)').order('entrada', { ascending: false }).limit(10),
            supabase.from('receta').select('*').order('nombre'),
            supabase.from('receta_insumo').select('*, insumo(nombre)')
        ])

        const [garmentRes, machineRes, batchRes, invRes, opRes, attRes, recipeRes, supplyRes] = results;

        setGarments(garmentRes.data || [])
        setMachines(machineRes.data || [])
        setBatches(batchRes.data || [])
        setInventory(invRes.data || [])
        setOperators(opRes.data || [])
        setAttendance(attRes.data || [])
        setRecipes(recipeRes.data || [])
        setRecipeSupplies(supplyRes.data || [])
        setLoading(false)
    }

    const handleCreateGarment = async (e: React.FormEvent) => {
        e.preventDefault()
        const { error } = await supabase.from('tipo_prenda').insert([garmentForm])
        if (!error) {
            setIsModalOpen(false)
            setGarmentForm({ nombre: '', requiere_planchado: true, tiempo_estandar_min: 15 })
            fetchData()
        }
    }

    const handleInvCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        const { error } = await supabase.from('insumo').insert([invFormData])
        if (!error) {
            setIsModalOpen(false)
            setInvFormData({ nombre: '', stock_actual: 0, unidad: 'Litros', punto_reorden: 5 })
            fetchData()
        }
    }

    const handleMachineCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        const { error } = await supabase.from('maquina').insert([machineForm])
        if (!error) {
            setIsModalOpen(false)
            setMachineForm({ nombre: '', tipo: 'LAVADORA', marca: '' })
            fetchData()
        }
    }

    const handleOperatorCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        const { error } = await supabase.from('operario').insert([{
            nombre: operatorForm.nombre,
            rol: operatorForm.rol
        }])
        if (!error) {
            setIsModalOpen(false)
            setOperatorForm({ nombre: '', rol: 'OPERARIO' })
            fetchData()
        }
    }

    const handleRecipeCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        const { error } = await supabase.from('receta').insert([recipeForm])
        if (!error) {
            setIsModalOpen(false)
            setRecipeForm({ nombre: '', descripcion: '' })
            fetchData()
        }
    }

    const openModal = (type: 'garment' | 'inventory' | 'machine' | 'hr' | 'recipe') => {
        setModalType(type as any)
        setIsModalOpen(true)
    }

    return (
        <div className="dashboard-layout">
            <aside className="sidebar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem', padding: '0 0.5rem' }}>
                    <div style={{ background: 'var(--primary)', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Shirt color="#111" size={20} />
                    </div>
                    <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.025em' }}>Breeze&Co</span>
                </div>

                <nav>
                    <NavItem icon={<LayoutGrid size={20} />} label="Dashboard / Gantt" active={activeTab === 'dash'} onClick={() => setActiveTab('dash')} />
                    <NavItem icon={<Shirt size={20} />} label="Prendas Maestras" active={activeTab === 'master'} onClick={() => setActiveTab('master')} />
                    <NavItem icon={<Package size={20} />} label="Inventario / Insumos" active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} />
                    <NavItem icon={<Cog size={20} />} label="Máquinas" active={activeTab === 'machines'} onClick={() => setActiveTab('machines')} />
                    <NavItem icon={<BarChart3 size={20} />} label="Reportes / KPIs" active={activeTab === 'reports'} onClick={() => setActiveTab('reports')} />
                    <NavItem icon={<Users size={20} />} label="Personal" active={activeTab === 'hr'} onClick={() => setActiveTab('hr')} />
                    <NavItem icon={<Activity size={20} />} label="Config. Ciclos" active={activeTab === 'recipes'} onClick={() => setActiveTab('recipes')} />
                    <div style={{ height: '1px', background: 'var(--border)', margin: '1.5rem 0' }} />
                    <NavItem icon={<Settings size={20} />} label="Configuración" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
                </nav>
            </aside>

            <main className="main-content">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.875rem' }}>
                            {activeTab === 'dash' ? 'Panel de Supervisión (Gantt)' :
                                activeTab === 'master' ? 'Configuración de Prendas' :
                                    activeTab === 'inventory' ? 'Control de Insumos / Químicos' :
                                        activeTab === 'machines' ? 'Gestión de Maquinaria' :
                                            activeTab === 'hr' ? 'Gestión de Personal' :
                                                activeTab === 'reports' ? 'Reportes y Eficiencia' : 'Panel de Control'}
                        </h1>
                        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                            {activeTab === 'dash' ? 'Monitorea el uso de máquinas y flujo de lotes.' :
                                activeTab === 'master' ? 'Administra tipos de prendas y tiempos.' :
                                    activeTab === 'inventory' ? 'Stock de jabón, suavizante y químicos.' :
                                        activeTab === 'machines' ? 'Configura lavadoras y secadoras de la planta.' :
                                            activeTab === 'hr' ? 'Control de operarios y asistencia.' :
                                                activeTab === 'reports' ? 'Métricas de producción y eficiencia.' : 'Selecciona una sección.'}
                        </p>
                    </div>
                    <button onClick={fetchData} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.75rem' }}>
                        <RefreshCw size={20} className={loading ? 'spin' : ''} />
                    </button>
                </header>

                {/* --- PESTAÑA DASHBOARD --- */}
                {activeTab === 'dash' && (
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                            <StatCard icon={<Activity color="#2dd4bf" />} value={batches.length} label="Lotes Activos" />
                            <StatCard icon={<Clock color="#f59e0b" />} value="85%" label="Ocupación" />
                            <StatCard icon={<Shirt color="#ef4444" />} value="242" label="Prendas Hoy" />
                            <StatCard icon={<Users color="#3b82f6" />} value="8" label="Personal Activo" />
                        </div>
                        <section className="card">
                            <h3 style={{ marginBottom: '1.5rem' }}>Ocupación de Máquinas (Hoy)</h3>
                            <div className="gantt-container">
                                {machines.length === 0 ? (
                                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No hay máquinas activas.</div>
                                ) : (
                                    <>
                                        <div className="gantt-header">
                                            <div className="gantt-y-label">Máquina</div>
                                            <div className="gantt-timeline">
                                                <span>08:00</span><span>10:00</span><span>12:00</span><span>14:00</span><span>16:00</span><span>18:00</span>
                                            </div>
                                        </div>
                                        {machines.map(m => (
                                            <div key={m.id} className="gantt-row">
                                                <div className="gantt-machine-info">
                                                    <span style={{ fontWeight: 600 }}>{m.nombre}</span>
                                                    <small style={{ color: 'var(--text-muted)' }}>{m.tipo}</small>
                                                </div>
                                                <div className="gantt-track">
                                                    {batches.filter(b => b.maquina_id === m.id).map((b, i) => (
                                                        <div key={i} className="gantt-bar" style={{ left: '20%', width: '30%' }}>
                                                            {b.tipo_lote} ({b.peso_real}kg)
                                                        </div>
                                                    ))}
                                                    <div className="gantt-bar busy" style={{ left: '60%', width: '15%' }}>Simulación</div>
                                                </div>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        </section>
                    </div>
                )}

                {/* --- PESTAÑA PRENDAS (MASTER) --- */}
                {activeTab === 'master' && (
                    <section className="card">
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                            <button onClick={() => openModal('garment')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Plus size={20} /> Nueva Prenda
                            </button>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                    <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Nombre Prenda</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Requiere Planchado</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Tiempo Estándar</th>
                                    <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {garments.map(g => (
                                    <tr key={g.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '1rem', fontWeight: 600 }}>{g.nombre}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ padding: '0.25rem 0.75rem', borderRadius: '2rem', background: g.requiere_planchado ? '#2dd4bf20' : '#64748b20', color: g.requiere_planchado ? 'var(--primary)' : 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600 }}>
                                                {g.requiere_planchado ? 'Sí' : 'No'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>{g.tiempo_estandar_min} min</td>
                                        <td style={{ padding: '1rem' }}>
                                            <button style={{ padding: '0.4rem', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)' }}>
                                                <Settings size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {garments.length === 0 && <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center' }}>No hay prendas.</td></tr>}
                            </tbody>
                        </table>
                    </section>
                )}

                {/* --- PESTAÑA INVENTARIO --- */}
                {activeTab === 'inventory' && (
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={() => openModal('inventory')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Plus size={20} /> Nuevo Insumo
                            </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                            {inventory.map(item => (
                                <div key={item.id} className="card inventory-card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ background: item.stock_actual <= item.punto_reorden ? '#ef444420' : '#2dd4bf20', padding: '0.50rem', borderRadius: '8px' }}>
                                                <Droplets color={item.stock_actual <= item.punto_reorden ? '#ef4444' : '#2dd4bf'} size={24} />
                                            </div>
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{item.nombre}</h4>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.unidad}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '1.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                            <span>Stock</span>
                                            <span style={{ fontWeight: 700 }}>{item.stock_actual} / {item.punto_reorden} (min)</span>
                                        </div>
                                        <div className="progress-bg">
                                            <div className="progress-fill" style={{
                                                width: `${Math.min((item.stock_actual / Math.max(item.stock_actual, item.punto_reorden * 2)) * 100, 100)}%`,
                                                background: item.stock_actual <= item.punto_reorden ? '#ef4444' : 'var(--primary)'
                                            }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- PESTAÑA MÁQUINAS --- */}
                {activeTab === 'machines' && (
                    <section className="card">
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                            <button onClick={() => openModal('machine')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Plus size={20} /> Nueva Máquina
                            </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                            {machines.map(m => (
                                <div key={m.id} className="card" style={{ padding: '1rem', border: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <Cog color="var(--primary)" size={20} />
                                        <span style={{ fontWeight: 700 }}>{m.nombre}</span>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.tipo} - {m.marca || 'Genérica'}</div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* --- PESTAÑA PERSONAL (HR) --- */}
                {activeTab === 'hr' && (
                    <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)' }}>
                        <section className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ margin: 0 }}>Nómina de Operarios</h3>
                                <button onClick={() => openModal('hr')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Plus size={20} /> Nuevo Operario
                                </button>
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                        <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Nombre</th>
                                        <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Rol</th>
                                        <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>ID</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {operators.map(op => (
                                        <tr key={op.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                            <td style={{ padding: '1rem', fontWeight: 600 }}>{op.nombre}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '2rem',
                                                    background:
                                                        op.rol === 'Lavado / Secado' ? '#2dd4bf20' :
                                                            op.rol === 'Planchado' ? '#f59e0b20' :
                                                                op.rol === 'Control de Calidad' ? '#6366f120' :
                                                                    op.rol === 'Doblado' ? '#f43f5e20' : '#3b82f620',
                                                    color:
                                                        op.rol === 'Lavado / Secado' ? '#2dd4bf' :
                                                            op.rol === 'Planchado' ? '#f59e0b' :
                                                                op.rol === 'Control de Calidad' ? '#6366f1' :
                                                                    op.rol === 'Doblado' ? '#f43f5e' : '#3b82f6',
                                                    fontSize: '0.875rem',
                                                    fontWeight: 600
                                                }}>
                                                    {op.rol}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{op.id.slice(0, 8)}...</td>
                                        </tr>
                                    ))}
                                    {operators.length === 0 && <tr><td colSpan={3} style={{ padding: '2rem', textAlign: 'center' }}>No hay personal registrado.</td></tr>}
                                </tbody>
                            </table>
                        </section>

                        <section className="card">
                            <h3 style={{ marginBottom: '1.5rem' }}>Asistencia Reciente</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {attendance.map(att => (
                                    <div key={att.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '0.75rem' }}>
                                        <div style={{ background: att.salida ? '#64748b20' : '#2dd4bf20', padding: '0.5rem', borderRadius: '50%' }}>
                                            <Clock size={16} color={att.salida ? '#64748b' : '#2dd4bf'} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{att.operario?.nombre}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {new Date(att.entrada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                {att.salida ? ` - ${new Date(att.salida).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ' (Activo)'}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {attendance.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Sin registros hoy.</div>}
                            </div>
                        </section>
                    </div>
                )}

                {/* --- PESTAÑA REPORTES --- */}
                {activeTab === 'reports' && (
                    <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: '1fr 1fr' }}>
                        <section className="card">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                <TrendingUp color="var(--primary)" size={20} />
                                Eficiencia de Producción
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <ProgressBar label="Lavado" value={92} color="#2dd4bf" />
                                <ProgressBar label="Planchado" value={65} color="#ef4444" />
                            </div>
                        </section>
                    </div>
                )}

                {/* --- PESTAÑA CONFIG. CICLOS (RECETAS) --- */}
                {activeTab === 'recipes' && (
                    <section className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>Ciclos de Lavado (Recetas)</h3>
                            <button onClick={() => openModal('recipe')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Plus size={20} /> Nuevo Ciclo
                            </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                            {recipes.map(r => (
                                <div key={r.id} className="card" style={{ border: '1px solid var(--border)', padding: '1.25rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                        <div>
                                            <h4 style={{ margin: 0, color: 'var(--primary)' }}>{r.nombre}</h4>
                                            <p style={{ margin: '0.25rem 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{r.descripcion}</p>
                                        </div>
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '8px', padding: '0.75rem' }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Insumos por Lote:</div>
                                        {recipeSupplies.filter(rs => rs.receta_id === r.id).map(rs => (
                                            <div key={rs.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.25rem 0' }}>
                                                <span>{rs.insumo?.nombre}</span>
                                                <span style={{ fontWeight: 600 }}>{rs.cantidad_ml_por_lote} ml</span>
                                            </div>
                                        ))}
                                        {recipeSupplies.filter(rs => rs.receta_id === r.id).length === 0 && <div style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>Sin insumos vinculados.</div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* --- MODAL UNIFICADO --- */}
                {isModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-card card">
                            <h2 style={{ marginBottom: '1.5rem' }}>
                                {modalType === 'garment' ? 'Nueva Prenda' :
                                    modalType === 'inventory' ? 'Nuevo Insumo' :
                                        modalType === 'machine' ? 'Nueva Máquina' : 'Nuevo Registro'}
                            </h2>

                            {modalType === 'garment' && (
                                <form onSubmit={handleCreateGarment}>
                                    <div className="form-group"><label>Nombre</label><input type="text" required value={garmentForm.nombre} onChange={e => setGarmentForm({ ...garmentForm, nombre: e.target.value })} /></div>
                                    <div className="form-group"><label>Tiempo (min)</label><input type="number" required value={garmentForm.tiempo_estandar_min} onChange={e => setGarmentForm({ ...garmentForm, tiempo_estandar_min: parseInt(e.target.value) })} /></div>
                                    <div className="form-group" style={{ flexDirection: 'row', gap: '1rem', alignItems: 'center' }}>
                                        <input type="checkbox" checked={garmentForm.requiere_planchado} onChange={e => setGarmentForm({ ...garmentForm, requiere_planchado: e.target.checked })} id="iron-c" />
                                        <label htmlFor="iron-c" style={{ marginBottom: 0 }}>¿Planchado?</label>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                        <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: '#475569', color: '#fff', flex: 1 }}>Cancelar</button>
                                        <button type="submit" style={{ flex: 1 }}>Guardar</button>
                                    </div>
                                </form>
                            )}

                            {modalType === 'inventory' && (
                                <form onSubmit={handleInvCreate}>
                                    <div className="form-group"><label>Nombre</label><input type="text" required value={invFormData.nombre} onChange={e => setInvFormData({ ...invFormData, nombre: e.target.value })} /></div>
                                    <div className="form-group"><label>Stock</label><input type="number" required value={invFormData.stock_actual} onChange={e => setInvFormData({ ...invFormData, stock_actual: parseFloat(e.target.value) })} /></div>
                                    <div className="form-group"><label>Unidad</label><input type="text" required value={invFormData.unidad} onChange={e => setInvFormData({ ...invFormData, unidad: e.target.value })} /></div>
                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                        <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: '#475569', color: '#fff', flex: 1 }}>Cancelar</button>
                                        <button type="submit" style={{ flex: 1 }}>Guardar</button>
                                    </div>
                                </form>
                            )}

                            {modalType === 'machine' && (
                                <form onSubmit={handleMachineCreate}>
                                    <div className="form-group"><label>Nombre</label><input type="text" required value={machineForm.nombre} onChange={e => setMachineForm({ ...machineForm, nombre: e.target.value })} /></div>
                                    <div className="form-group"><label>Tipo</label>
                                        <select value={machineForm.tipo} onChange={e => setMachineForm({ ...machineForm, tipo: e.target.value })} style={{ background: '#0f172a', border: '1px solid var(--border)', padding: '0.75rem', color: 'white', borderRadius: '0.5rem' }}>
                                            <option value="LAVADORA">Lavadora</option>
                                            <option value="SECADORA">Secadora</option>
                                            <option value="PLANCHA">Plancha</option>
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                        <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: '#475569', color: '#fff', flex: 1 }}>Cancelar</button>
                                        <button type="submit" style={{ flex: 1 }}>Guardar</button>
                                    </div>
                                </form>
                            )}

                            {modalType === 'hr' && (
                                <form onSubmit={handleOperatorCreate}>
                                    <div className="form-group"><label>Nombre Completo</label><input type="text" required value={operatorForm.nombre} onChange={e => setOperatorForm({ ...operatorForm, nombre: e.target.value })} /></div>
                                    <div className="form-group"><label>Rol</label>
                                        <select value={operatorForm.rol} onChange={e => setOperatorForm({ ...operatorForm, rol: e.target.value })} style={{ background: '#0f172a', border: '1px solid var(--border)', padding: '0.75rem', color: 'white', borderRadius: '0.5rem' }}>
                                            <option value="Lavado / Secado">Lavado / Secado</option>
                                            <option value="Planchado">Planchado</option>
                                            <option value="Control de Calidad">Control de Calidad</option>
                                            <option value="Doblado">Doblado</option>
                                            <option value="ADMIN">Administrador</option>
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                        <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: '#475569', color: '#fff', flex: 1 }}>Cancelar</button>
                                        <button type="submit" style={{ flex: 1 }}>Guardar</button>
                                    </div>
                                </form>
                            )}

                            {modalType === 'recipe' && (
                                <form onSubmit={handleRecipeCreate}>
                                    <div className="form-group"><label>Nombre del Ciclo</label><input type="text" required value={recipeForm.nombre} onChange={e => setRecipeForm({ ...recipeForm, nombre: e.target.value })} placeholder="Ej: Ciclo Blancos Premium" /></div>
                                    <div className="form-group"><label>Descripción</label><input type="text" value={recipeForm.descripcion} onChange={e => setRecipeForm({ ...recipeForm, descripcion: e.target.value })} placeholder="Breve nota sobre el uso" /></div>
                                    <div style={{ background: '#ef444410', border: '1px solid #ef444430', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#ef4444' }}><strong>Nota:</strong> Una vez creado el ciclo, podrás vincular los insumos desde la base de datos o en la próxima actualización del panel.</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                        <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: '#475569', color: '#fff', flex: 1 }}>Cancelar</button>
                                        <button type="submit" style={{ flex: 1 }}>Crear Ciclo</button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                )}
            </main>

            <style dangerouslySetInnerHTML={{
                __html: `
        .badge-danger { background: #ef444420; color: #ef4444; padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.7rem; font-weight: 700; border: 1px solid #ef444440; }
        .progress-bg { background: #334155; height: 8px; border-radius: 4px; overflow: hidden; margin: 4px 0; }
        .progress-fill { height: 100%; transition: width 0.3s ease; }
        .inventory-card { transition: all 0.3s ease; border: 1px solid var(--border); }
        .inventory-card:hover { border-color: var(--primary); }
        .gantt-container { overflow-x: auto; margin-top: 1rem; }
        .gantt-header { display: flex; border-bottom: 2px solid var(--border); padding-bottom: 1rem; }
        .gantt-y-label { width: 180px; font-weight: bold; color: var(--text-muted); }
        .gantt-timeline { flex: 1; display: flex; justify-content: space-between; padding: 0 1rem; color: var(--text-muted); font-size: 0.8rem; }
        .gantt-row { display: flex; padding: 1rem 0; border-bottom: 1px solid var(--border); align-items: center; }
        .gantt-machine-info { width: 180px; display: flex; flex-direction: column; }
        .gantt-track { flex: 1; height: 32px; background: rgba(255,255,255,0.03); border-radius: 4px; position: relative; overflow: hidden; margin: 0 1rem; }
        .gantt-bar { position: absolute; height: 100%; background: var(--primary); color: #111; font-size: 0.65rem; font-weight: bold; display: flex; align-items: center; padding: 0 8px; border-radius: 4px; }
        .gantt-bar.busy { background: #64748b; color: white; opacity: 0.5; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-card { width: 400px; }
        .form-group { display: flex; flex-direction: column; margin-bottom: 1rem; }
        .form-group label { margin-bottom: 0.5rem; font-size: 0.8rem; color: var(--text-muted); }
        .form-group input { background: #0f172a; border: 1px solid var(--border); border-radius: 0.5rem; padding: 0.75rem; color: white; outline: none; }
        .form-group input:focus { border-color: var(--primary); }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}} />
        </div>
    )
}

function StatCard({ icon, value, label }: any) {
    return (
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.25rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '12px' }}>{icon}</div>
            <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{value}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{label}</div>
            </div>
        </div>
    )
}

function ProgressBar({ label, value, color }: { label: string, value: number, color: string }) {
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                <span style={{ fontWeight: 500 }}>{label}</span>
                <span style={{ color: color, fontWeight: 700 }}>{value}%</span>
            </div>
            <div style={{ height: 10, background: '#334155', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: color, width: `${value}%`, borderRadius: 5 }} />
            </div>
        </div>
    )
}

function NavItem({ icon, label, active, onClick }: any) {
    return (
        <a href="#" className={`nav-item ${active ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); onClick(); }}>
            {icon}
            <span>{label}</span>
        </a>
    )
}

export default App
