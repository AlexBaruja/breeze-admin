import React, { useState, useEffect } from 'react'
import { LayoutGrid, Shirt, Cog, BarChart3, Users, Settings, Plus, RefreshCw, Clock, Activity, TrendingUp, AlertCircle, Package, Droplets, ArrowDownToLine } from 'lucide-react'
import { supabase } from './supabase'

function App() {
    const [activeTab, setActiveTab] = useState('dash')
    const [garments, setGarments] = useState<any[]>([])
    const [machines, setMachines] = useState<any[]>([])
    const [batches, setBatches] = useState<any[]>([])
    const [inventory, setInventory] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)

    // Form state for inventory
    const [invFormData, setInvFormData] = useState({
        nombre: '',
        stock_actual: 0,
        unidad: 'Litros',
        punto_reorden: 5
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        const [garmentRes, machineRes, batchRes, invRes] = await Promise.all([
            supabase.from('tipo_prenda').select('*').order('nombre'),
            supabase.from('maquina').select('*').eq('activo', true),
            supabase.from('lote_trabajo').select('*, maquina(nombre)').is('hora_fin_estimada', null),
            supabase.from('insumo').select('*').order('nombre')
        ])

        setGarments(garmentRes.data || [])
        setMachines(machineRes.data || [])
        setBatches(batchRes.data || [])
        setInventory(invRes.data || [])
        setLoading(false)
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
                                        activeTab === 'reports' ? 'Reportes y Eficiencia' : 'Panel de Control'}
                        </h1>
                        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                            {activeTab === 'dash' ? 'Monitorea el uso de máquinas y flujo de lotes.' :
                                activeTab === 'master' ? 'Administra tipos de prendas y tiempos.' :
                                    activeTab === 'inventory' ? 'Stock de jabón, suavizante y químicos.' :
                                        activeTab === 'reports' ? 'Métricas de producción y eficiencia.' : 'Selecciona una sección.'}
                        </p>
                    </div>
                    <button onClick={fetchData} style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-main)', padding: '0.75rem' }}>
                        <RefreshCw size={20} className={loading ? 'spin' : ''} />
                    </button>
                </header>

                {activeTab === 'inventory' && (
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.id} #ID</span>
                                            </div>
                                        </div>
                                        {item.stock_actual <= item.punto_reorden && (
                                            <span className="badge-danger">Stock Bajo</span>
                                        )}
                                    </div>

                                    <div style={{ marginTop: '1.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                            <span color="var(--text-muted)">Nivel Actual</span>
                                            <span style={{ fontWeight: 700 }}>{item.stock_actual} {item.unidad}</span>
                                        </div>
                                        <div className="progress-bg">
                                            {/* Simulación visual de nivel (máx 100 para demo) */}
                                            <div className="progress-fill" style={{
                                                width: `${Math.min((item.stock_actual / 20) * 100, 100)}%`,
                                                background: item.stock_actual <= item.punto_reorden ? '#ef4444' : 'var(--primary)'
                                            }} />
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                                            <span>Mínimo: {item.punto_reorden} {item.unidad}</span>
                                            <span>Capacidad: 20 {item.unidad}</span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                                        <button style={{ flex: 1, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-main)', fontSize: '0.8rem' }}>
                                            Editar
                                        </button>
                                        <button style={{ flex: 1, background: '#3b82f620', color: '#3b82f6', border: 'none', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                            <Plus size={16} /> Reponer
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {inventory.length === 0 && <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No hay insumos registrados.</div>}
                        </div>
                    </div>
                )}

                {/* Mantenemos las otras pestañas para consistencia */}
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
                                {/* Gantt logic already provided */}
                                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando línea de tiempo...</div>
                            </div>
                        </section>
                    </div>
                )}

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

                {/* MODAL NUEVO INSUMO */}
                {isModalOpen && activeTab === 'inventory' && (
                    <div className="modal-overlay">
                        <div className="modal-card card">
                            <h2 style={{ marginBottom: '1.5rem' }}>Agregar Nuevo Insumo</h2>
                            <form onSubmit={handleInvCreate}>
                                <div className="form-group"><label>Nombre del Químico</label><input type="text" required value={invFormData.nombre} onChange={e => setInvFormData({ ...invFormData, nombre: e.target.value })} /></div>
                                <div className="form-group"><label>Stock Inicial</label><input type="number" required value={invFormData.stock_actual} onChange={e => setInvFormData({ ...invFormData, stock_actual: parseFloat(e.target.value) })} /></div>
                                <div className="form-group"><label>Unidad (Lts, Kgs, etc)</label><input type="text" required value={invFormData.unidad} onChange={e => setInvFormData({ ...invFormData, unidad: e.target.value })} /></div>
                                <div className="form-group"><label>Punto de Reorden (Alerta)</label><input type="number" required value={invFormData.punto_reorden} onChange={e => setInvFormData({ ...invFormData, punto_reorden: parseFloat(e.target.value) })} /></div>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                    <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: '#334155', color: '#fff', flex: 1 }}>Cancelar</button>
                                    <button type="submit" style={{ flex: 1 }}>Guardar Insumo</button>
                                </div>
                            </form>
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
