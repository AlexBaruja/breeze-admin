import React, { useState, useEffect } from 'react'
import { LayoutGrid, Shirt, Cog, BarChart3, Users, Settings, Plus, RefreshCw, Clock, Activity, TrendingUp, AlertCircle, Package, Droplets, ArrowDownToLine } from 'lucide-react'
import { supabase } from './supabase'

interface Garment { id: number; nombre: string; requiere_planchado: boolean; tiempo_estandar_min: number }
interface Machine { id: number; nombre: string; tipo: 'LAVADORA' | 'SECADORA' | 'PLANCHA'; marca: string; activo: boolean }
interface Batch { id: string; maquina_id: number; tipo_lote: string; peso_real: number; hora_inicio: string; maquina?: { nombre: string } }
interface Insumo { id: number; nombre: string; stock_actual: number; unidad: string; punto_reorden: number }
interface Operator { id: string; nombre: string; rol: string }
interface Attendance { id: number; entrada: string; salida?: string; operario?: { nombre: string } }
interface Recipe { id: number; nombre: string; descripcion: string }
interface RecipeSupply { id: number; receta_id: number; insumo_id: number; cantidad_ml_por_lote: number; insumo?: { nombre: string } }

function App() {
    const [activeTab, setActiveTab] = useState('dash')
    const [garments, setGarments] = useState<Garment[]>([])
    const [machines, setMachines] = useState<Machine[]>([])
    const [batches, setBatches] = useState<Batch[]>([])
    const [inventory, setInventory] = useState<Insumo[]>([])
    const [operators, setOperators] = useState<Operator[]>([])
    const [attendance, setAttendance] = useState<Attendance[]>([])
    const [recipes, setRecipes] = useState<Recipe[]>([])
    const [recipeSupplies, setRecipeSupplies] = useState<RecipeSupply[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [modalType, setModalType] = useState<'garment' | 'inventory' | 'machine' | 'hr' | 'recipe' | 'usage'>('garment')

    // Form states
    const [garmentForm, setGarmentForm] = useState({ nombre: '', requiere_planchado: true, tiempo_estandar_min: 15 })
    const [invFormData, setInvFormData] = useState({ nombre: '', stock_actual: 0, unidad: 'Litros', punto_reorden: 5 })
    const [machineForm, setMachineForm] = useState({ nombre: '', tipo: 'LAVADORA', marca: '' })
    const [operatorForm, setOperatorForm] = useState({ nombre: '', rol: 'OPERARIO' })
    const [recipeForm, setRecipeForm] = useState({ nombre: '', descripcion: '' })
    const [recipeInsumos, setRecipeInsumos] = useState<{ insumo_id: number, cantidad_ml_por_lote: number }[]>([])
    const [manualUsageForm, setManualUsageForm] = useState({ insumo_id: 0, cantidad: 0, lote_id: 0 })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [garmentRes, machineRes, batchRes, invRes, opRes, attRes, recipeRes, supplyRes] = await Promise.all([
                supabase.from('tipo_prenda').select('*').order('nombre'),
                supabase.from('maquina').select('*').eq('activo', true).order('nombre'),
                supabase.from('lote_trabajo').select('*, maquina(nombre)').is('hora_fin_estimada', null),
                supabase.from('insumo').select('*').order('nombre'),
                supabase.from('operario').select('*').order('nombre'),
                supabase.from('asistencia').select('*, operario(nombre)').order('entrada', { ascending: false }).limit(10),
                supabase.from('receta').select('*').order('nombre'),
                supabase.from('receta_insumo').select('*, insumo(nombre)')
            ]);

            setGarments(garmentRes.data || [])
            setMachines(machineRes.data || [])
            setBatches(batchRes.data || [])
            setInventory(invRes.data || [])
            setOperators(opRes.data || [])
            setAttendance(attRes.data || [])
            setRecipes(recipeRes.data || [])
            setRecipeSupplies(supplyRes.data || [])
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false)
        }
    }

    const handleCreateGarment = async (e: React.FormEvent) => {
        e.preventDefault()
        const { error } = await supabase.from('prenda').insert([garmentForm])
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
        const { error } = await supabase.from('operario').insert([operatorForm])
        if (!error) {
            setIsModalOpen(false)
            setOperatorForm({ nombre: '', rol: 'Lavado / Secado' })
            fetchData()
        }
    }

    const handleRecipeCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        // 1. Crear la receta
        const { data: recipeData, error: recipeError } = await supabase
            .from('receta')
            .insert([recipeForm])
            .select()
            .single()

        if (recipeError) {
            alert('Error al crear la receta: ' + recipeError.message)
            return
        }

        // 2. Vincular insumos
        if (recipeInsumos.length > 0) {
            const insumosToInsert = recipeInsumos.map((ri: { insumo_id: number, cantidad_ml_por_lote: number }) => ({
                ...ri,
                receta_id: recipeData.id
            }))
            const { error: insumoError } = await supabase.from('receta_insumo').insert(insumosToInsert)
            if (insumoError) {
                alert('Receta creada, pero error al vincular insumos: ' + insumoError.message)
            }
        }

        setIsModalOpen(false)
        setRecipeForm({ nombre: '', descripcion: '' })
        setRecipeInsumos([])
        fetchData()
    }

    const handleManualUsage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (manualUsageForm.insumo_id === 0 || manualUsageForm.cantidad <= 0) {
            alert('Por favor complete todos los campos')
            return
        }

        // Convertir ml a Litros para la DB (si la unidad es Litros)
        const insumo = inventory.find((i: Insumo) => i.id === manualUsageForm.insumo_id)
        const cantidadAjustada = insumo?.unidad.toLowerCase().includes('litro')
            ? manualUsageForm.cantidad / 1000
            : manualUsageForm.cantidad

        const { error } = await supabase.from('lote_insumo').insert([{
            insumo_id: manualUsageForm.insumo_id,
            cantidad_usada: cantidadAjustada,
            lote_id: manualUsageForm.lote_id || null
        }])

        if (!error) {
            // El trigger de base de datos debería descontar el stock si existe, 
            // pero como es manual y no por receta, el stock se descuenta por trigger en lote_insumo (si está configurado)
            // Por ahora solo registramos el uso.
            setIsModalOpen(false)
            setManualUsageForm({ insumo_id: 0, cantidad: 0, lote_id: 0 })
            fetchData()
        } else {
            alert('Error: ' + error.message)
        }
    }

    const openModal = (type: 'garment' | 'inventory' | 'machine' | 'hr' | 'recipe' | 'usage') => {
        setModalType(type)
        setIsModalOpen(true)
    }

    return (
        <div className="dashboard-container">
            {/* Sidebar Glassy */}
            <aside className="glass-sidebar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '3rem', padding: '0 1rem' }}>
                    <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Shirt color="#020617" size={24} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Breeze & Co.</h2>
                        <small style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Management System</small>
                    </div>
                </div>

                <nav style={{ flex: 1 }}>
                    <NavLink icon={<LayoutGrid size={20} />} label="Dashboard" active={activeTab === 'dash'} onClick={() => setActiveTab('dash')} />
                    <NavLink icon={<Shirt size={20} />} label="Prendas" active={activeTab === 'garments'} onClick={() => setActiveTab('garments')} />
                    <NavLink icon={<Droplets size={20} />} label="Recetas" active={activeTab === 'recipes'} onClick={() => setActiveTab('recipes')} />
                    <NavLink icon={<Package size={20} />} label="Inventario" active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} />
                    <NavLink icon={<Cog size={20} />} label="Máquinas" active={activeTab === 'machines'} onClick={() => setActiveTab('machines')} />
                    <NavLink icon={<Users size={20} />} label="Personal" active={activeTab === 'hr'} onClick={() => setActiveTab('hr')} />
                </nav>

                <div className="card-glass" style={{ padding: '1rem', marginTop: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)' }}></div>
                        <div>
                            <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>Admin User</p>
                            <small style={{ color: 'var(--text-muted)' }}>Super Administrador</small>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="main-viewport">
                {loading ? (
                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                        <RefreshCw className="animate-spin" size={48} color="var(--primary)" />
                    </div>
                ) : (
                    <>
                        <header className="hero-header">
                            <h1 style={{ fontSize: '2.5rem', fontWeight: 700, margin: 0, background: 'linear-gradient(90deg, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                {activeTab === 'dash' && "Resumen de Operaciones"}
                                {activeTab === 'garments' && "Maestro de Prendas"}
                                {activeTab === 'recipes' && "Gestión de Recetas"}
                                {activeTab === 'inventory' && "Control de Inventario"}
                                {activeTab === 'machines' && "Parque de Máquinas"}
                                {activeTab === 'hr' && "Recursos Humanos"}
                            </h1>
                            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Optimiza el flujo de tu tintorería con datos en tiempo real.</p>
                        </header>

                        {activeTab === 'dash' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                                {/* Summary Cards */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                                    <StatWidget icon={<Plus size={24} color="var(--primary)" />} value={batches.length} label="Lotes Hoy" />
                                    <StatWidget icon={<Activity size={24} color="#8b5cf6" />} value={machines.filter((m: Machine) => m.activo).length} label="Maquinas Activas" />
                                    <StatWidget icon={<TrendingUp size={24} color="#2dd4bf" />} value="128kg" label="Carga Procesada" />
                                    <StatWidget icon={<AlertCircle size={24} color="#f43f5e" />} value={inventory.filter((i: Insumo) => i.stock_actual < i.punto_reorden).length} label="Alertas Stock" />
                                </div>
                                {/* Gantt Visualizer */}
                                <section className="card-glass">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Cronograma de Producción</h3>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--primary)' }}></div> <small>Activo</small>
                                            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(255,255,255,0.1)' }}></div> <small>Pendiente</small>
                                        </div>
                                    </div>

                                    <div className="gantt-container">
                                        <div className="gantt-header">
                                            <div className="gantt-time-labels">
                                                <span>08:00</span><span>10:00</span><span>12:00</span><span>14:00</span><span>16:00</span><span>18:00</span>
                                            </div>
                                        </div>
                                        {machines.map((m: Machine) => (
                                            <div key={m.id} className="gantt-row">
                                                <div className="gantt-machine-info">
                                                    <span style={{ fontWeight: 600 }}>{m.nombre}</span>
                                                    <small style={{ color: 'var(--text-muted)' }}>{m.tipo}</small>
                                                </div>
                                                <div className="gantt-track">
                                                    {batches.filter((b: Batch) => b.maquina_id === m.id).map((b: Batch, i: number) => (
                                                        <div key={i} className="gantt-bar" style={{ left: '20%', width: '30%', background: 'linear-gradient(90deg, var(--primary), var(--secondary))' }}>
                                                            {b.tipo_lote} ({b.peso_real}kg)
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        )}

                        {/* --- PESTAÑA PRENDAS (MASTER) --- */}
                        {activeTab === 'garments' && (
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
                                        {garments.map((g: Garment) => (
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
                                    {inventory.map((item: Insumo) => (
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
                                    {machines.map((m: Machine) => (
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
                                            {operators.map((op: Operator) => (
                                                <tr key={op.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ fontWeight: 600 }}>{op.nombre}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {op.id}</div>
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <span style={{
                                                            padding: '0.25rem 0.5rem',
                                                            borderRadius: '4px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 600,
                                                            background: op.rol === 'Lavado / Secado' ? '#3b82f620' :
                                                                op.rol === 'Planchado' ? '#f59e0b20' :
                                                                    op.rol === 'Control de Calidad' ? '#10b98120' : '#64748b20',
                                                            color: op.rol === 'Lavado / Secado' ? '#3b82f6' :
                                                                op.rol === 'Planchado' ? '#f59e0b' :
                                                                    op.rol === 'Control de Calidad' ? '#10b981' : '#64748b',
                                                            border: `1px solid ${op.rol === 'Lavado / Secado' ? '#3b82f640' : '#64748b40'}`
                                                        }}>
                                                            {op.rol}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div className="status-badge status-ready">Activo</div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {operators.length === 0 && <tr><td colSpan={3} style={{ padding: '2rem', textAlign: 'center' }}>No hay personal registrado.</td></tr>}
                                        </tbody>
                                    </table>
                                </section>

                                <section className="card">
                                    <h3 style={{ marginBottom: '1.5rem' }}>Asistencia Reciente</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {attendance.map((att: Attendance) => (
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
                                    {recipes.map((r: Recipe) => (
                                        <div key={r.id} className="card" style={{ border: '1px solid var(--border)', padding: '1.25rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                                <div>
                                                    <h4 style={{ margin: 0, color: 'var(--primary)' }}>{r.nombre}</h4>
                                                    <p style={{ margin: '0.25rem 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{r.descripcion}</p>
                                                </div>
                                            </div>
                                            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '8px', padding: '0.75rem' }}>
                                                <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Insumos por Lote:</div>
                                                {recipeSupplies.filter((rs: RecipeSupply) => rs.receta_id === r.id).map((rs: RecipeSupply) => (
                                                    <div key={rs.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.25rem 0' }}>
                                                        <span>{rs.insumo?.nombre}</span>
                                                        <span style={{ fontWeight: 600 }}>{rs.cantidad_ml_por_lote} ml</span>
                                                    </div>
                                                ))}
                                                {recipeSupplies.filter((rs: RecipeSupply) => rs.receta_id === r.id).length === 0 && <div style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>Sin insumos vinculados.</div>}
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
                                            <div className="form-group"><label>Nombre</label><input type="text" required value={garmentForm.nombre} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGarmentForm({ ...garmentForm, nombre: e.target.value })} /></div>
                                            <div className="form-group"><label>Tiempo (min)</label><input type="number" required value={garmentForm.tiempo_estandar_min} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGarmentForm({ ...garmentForm, tiempo_estandar_min: parseInt(e.target.value) })} /></div>
                                            <div className="form-group" style={{ flexDirection: 'row', gap: '1rem', alignItems: 'center' }}>
                                                <input type="checkbox" checked={garmentForm.requiere_planchado} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGarmentForm({ ...garmentForm, requiere_planchado: e.target.checked })} id="iron-c" />
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
                                            <div className="form-group"><label>Nombre</label><input type="text" required value={invFormData.nombre} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInvFormData({ ...invFormData, nombre: e.target.value })} /></div>
                                            <div className="form-group"><label>Stock</label><input type="number" required value={invFormData.stock_actual} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInvFormData({ ...invFormData, stock_actual: parseFloat(e.target.value) })} /></div>
                                            <div className="form-group"><label>Unidad</label><input type="text" required value={invFormData.unidad} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInvFormData({ ...invFormData, unidad: e.target.value })} /></div>
                                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                                <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: '#475569', color: '#fff', flex: 1 }}>Cancelar</button>
                                                <button type="submit" style={{ flex: 1 }}>Guardar</button>
                                            </div>
                                        </form>
                                    )}

                                    {modalType === 'machine' && (
                                        <form onSubmit={handleMachineCreate}>
                                            <div className="form-group"><label>Nombre</label><input type="text" required value={machineForm.nombre} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMachineForm({ ...machineForm, nombre: e.target.value })} /></div>
                                            <div className="form-group"><label>Tipo</label>
                                                <select value={machineForm.tipo} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMachineForm({ ...machineForm, tipo: e.target.value as any })} style={{ background: '#0f172a', border: '1px solid var(--border)', padding: '0.75rem', color: 'white', borderRadius: '0.5rem' }}>
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
                                            <div className="form-group"><label>Nombre Completo</label><input type="text" required value={operatorForm.nombre} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOperatorForm({ ...operatorForm, nombre: e.target.value })} /></div>
                                            <div className="form-group"><label>Rol</label>
                                                <select value={operatorForm.rol} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setOperatorForm({ ...operatorForm, rol: e.target.value })} style={{ background: '#0f172a', border: '1px solid var(--border)', padding: '0.75rem', color: 'white', borderRadius: '0.5rem' }}>
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
                                            <div className="form-group"><label>Nombre del Ciclo</label><input type="text" required value={recipeForm.nombre} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRecipeForm({ ...recipeForm, nombre: e.target.value })} placeholder="Ej: Ciclo Blancos Premium" /></div>
                                            <div className="form-group"><label>Descripción</label><input type="text" value={recipeForm.descripcion} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRecipeForm({ ...recipeForm, descripcion: e.target.value })} placeholder="Breve nota sobre el uso" /></div>

                                            <div style={{ marginBottom: '1.5rem' }}>
                                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>Configurar Insumos (ml por lote)</label>
                                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                                    <select
                                                        id="insumo-select"
                                                        style={{ flex: 2, background: '#0f172a', border: '1px solid var(--border)', color: 'white', borderRadius: '0.5rem', padding: '0.5rem' }}
                                                    >
                                                        <option value="">Seleccionar Insumo...</option>
                                                        {inventory.map((i: Insumo) => <option key={i.id} value={i.id}>{i.nombre}</option>)}
                                                    </select>
                                                    <input
                                                        id="insumo-qty"
                                                        type="number"
                                                        placeholder="ml"
                                                        style={{ flex: 1, background: '#0f172a', border: '1px solid var(--border)', color: 'white', borderRadius: '0.5rem', padding: '0.5rem' }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const select = document.getElementById('insumo-select') as HTMLSelectElement;
                                                            const input = document.getElementById('insumo-qty') as HTMLInputElement;
                                                            if (select.value && input.value) {
                                                                const id = parseInt(select.value);
                                                                const qty = parseFloat(input.value);
                                                                if (!recipeInsumos.find((ri: { insumo_id: number }) => ri.insumo_id === id)) {
                                                                    setRecipeInsumos([...recipeInsumos, { insumo_id: id, cantidad_ml_por_lote: qty }]);
                                                                    input.value = '';
                                                                }
                                                            }
                                                        }}
                                                        style={{ padding: '0.5rem' }}
                                                    >
                                                        <Plus size={18} />
                                                    </button>
                                                </div>

                                                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '0.5rem' }}>
                                                    {recipeInsumos.length === 0 && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', margin: '0.5rem 0' }}>No hay insumos vinculados</p>}
                                                    {recipeInsumos.map((ri: { insumo_id: number, cantidad_ml_por_lote: number }, idx: number) => {
                                                        const insumo = inventory.find((i: Insumo) => i.id === ri.insumo_id);
                                                        return (
                                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.25rem 0.5rem', borderBottom: idx < recipeInsumos.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                                                <span style={{ fontSize: '0.875rem' }}>{insumo?.nombre}</span>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{ri.cantidad_ml_por_lote} ml</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setRecipeInsumos(recipeInsumos.filter((_: any, i: number) => i !== idx))}
                                                                        style={{ padding: '2px', background: 'transparent', color: '#ef4444' }}
                                                                    >
                                                                        <AlertCircle size={14} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                                <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: '#475569', color: '#fff', flex: 1 }}>Cancelar</button>
                                                <button type="submit" style={{ flex: 1 }}>Crear Receta Completa</button>
                                            </div>
                                        </form>
                                    )}
                                    {modalType === 'usage' && (
                                        <form onSubmit={handleManualUsage}>
                                            <div className="form-group">
                                                <label>Seleccionar Insumo</label>
                                                <select
                                                    required
                                                    value={manualUsageForm.insumo_id}
                                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setManualUsageForm({ ...manualUsageForm, insumo_id: parseInt(e.target.value) })}
                                                    style={{ background: '#0f172a', border: '1px solid var(--border)', padding: '0.75rem', color: 'white', borderRadius: '0.5rem' }}
                                                >
                                                    <option value="">Seleccione...</option>
                                                    {inventory.map((i: Insumo) => <option key={i.id} value={i.id}>{i.nombre} ({i.stock_actual} {i.unidad})</option>)}
                                                </select>
                                            </div>
                                            <div className="form-group"><label>Cantidad a Descontar (ml)</label><input type="number" required value={manualUsageForm.cantidad} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setManualUsageForm({ ...manualUsageForm, cantidad: parseFloat(e.target.value) })} /></div>
                                            <div className="form-group">
                                                <label>Lote (Opcional)</label>
                                                <input type="number" value={manualUsageForm.lote_id || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setManualUsageForm({ ...manualUsageForm, lote_id: parseInt(e.target.value) })} placeholder="ID del lote si aplica" />
                                            </div>
                                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                                <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: '#475569', color: '#fff', flex: 1 }}>Cancelar</button>
                                                <button type="submit" className="btn-premium" style={{ flex: 1 }}>Registrar Consumo</button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    )
}

function StatWidget({ icon, value, label }: { icon: React.ReactNode, value: string | number, label: string }) {
    return (
        <div className="stat-widget">
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>{icon}</div>
            <div>
                <div style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>{value}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
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

function NavLink({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
    return (
        <a href="#" className={`nav-link ${active ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); onClick(); }}>
            {icon}
            <span style={{ fontWeight: 600 }}>{label}</span>
        </a>
    )
}

export default App
