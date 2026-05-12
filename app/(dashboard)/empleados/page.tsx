'use client';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function EmpleadosPage() {
  const supabase = createClientComponentClient();
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [turnos, setTurnos] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [sitios, setSitios] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  // Estado para el formulario (Tanto creación como edición)
  const [form, setForm] = useState({
    nombre: '',
    user_id_reloj: '',
    empresa_id: '',
    sitio_id: '',
    area_id: '',
    turno_id: ''
  });

  useEffect(() => {
    fetchDatos();
  }, []);

  const fetchDatos = async () => {
    setLoading(true);
    const [resEmp, resTur, resCia, resSit, resAre] = await Promise.all([
      supabase.from('empleados').select('*, turnos(nombre), empresas(nombre), sitios(nombre), areas(nombre)').order('nombre'),
      supabase.from('turnos').select('*').order('nombre'),
      supabase.from('empresas').select('*').order('nombre'),
      supabase.from('sitios').select('*').order('nombre'),
      supabase.from('areas').select('*').order('nombre')
    ]);

    setEmpleados(resEmp.data || []);
    setTurnos(resTur.data || []);
    setEmpresas(resCia.data || []);
    setSitios(resSit.data || []);
    setAreas(resAre.data || []);
    setLoading(false);
  };

  // --- LÓGICA DE FILTRADO DINÁMICO ---
  const sitiosFiltrados = sitios.filter(s => s.empresa_id === form.empresa_id);
  const areasFiltradas = areas.filter(a => a.sitio_id === form.sitio_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editandoId) {
      const { error } = await supabase.from('empleados').update(form).eq('id', editandoId);
      if (error) alert("Error al actualizar: " + error.message);
      else {
        setEditandoId(null);
        resetForm();
        fetchDatos();
      }
    } else {
      const { error } = await supabase.from('empleados').insert([form]);
      if (error) alert("Error al crear: " + error.message);
      else {
        resetForm();
        setShowForm(false);
        fetchDatos();
      }
    }
  };

  const resetForm = () => {
    setForm({ nombre: '', user_id_reloj: '', empresa_id: '', sitio_id: '', area_id: '', turno_id: '' });
  };

  const prepararEdicion = (emp: any) => {
    setEditandoId(emp.id);
    setForm({
      nombre: emp.nombre,
      user_id_reloj: emp.user_id_reloj,
      empresa_id: emp.empresa_id || '',
      sitio_id: emp.sitio_id || '',
      area_id: emp.area_id || '',
      turno_id: emp.turno_id || ''
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">👤 Gestión de Personal</h1>
          <p className="text-slate-500 text-sm italic">Franklin y todo el equipo bajo control jerárquico.</p>
        </div>
        <button 
          onClick={() => { setShowForm(!showForm); if(editandoId) {setEditandoId(null); resetForm();} }}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          {showForm ? 'Cancelar' : '+ Nuevo Empleado'}
        </button>
      </header>

      {/* Formulario Dinámico (Edición / Creación) */}
      {showForm && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border-2 border-indigo-100 mb-8 animate-in fade-in zoom-in-95 duration-300">
          <h2 className="text-xs font-black text-indigo-600 uppercase mb-6 tracking-widest">
            {editandoId ? `Editando a: ${form.nombre}` : 'Registrar Nuevo Colaborador'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Nombre Completo</label>
              <input 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold uppercase"
                value={form.nombre}
                onChange={(e) => setForm({...form, nombre: e.target.value.toUpperCase()})}
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">ID Reloj</label>
              <input 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold"
                value={form.user_id_reloj}
                onChange={(e) => setForm({...form, user_id_reloj: e.target.value})}
                required
              />
            </div>

            {/* FILTROS EN CASCADA */}
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">1. Empresa</label>
              <select 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold"
                value={form.empresa_id}
                onChange={(e) => setForm({...form, empresa_id: e.target.value, sitio_id: '', area_id: ''})}
                required
              >
                <option value="">Seleccione Empresa...</option>
                {empresas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">2. Sitio (Filtrado)</label>
              <select 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold disabled:opacity-50"
                value={form.sitio_id}
                onChange={(e) => setForm({...form, sitio_id: e.target.value, area_id: ''})}
                disabled={!form.empresa_id}
                required
              >
                <option value="">{form.empresa_id ? 'Seleccione Sitio...' : 'Primero elija Empresa'}</option>
                {sitiosFiltrados.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">3. Área (Filtrado)</label>
              <select 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold disabled:opacity-50"
                value={form.area_id}
                onChange={(e) => setForm({...form, area_id: e.target.value})}
                disabled={!form.sitio_id}
                required
              >
                <option value="">{form.sitio_id ? 'Seleccione Área...' : 'Primero elija Sitio'}</option>
                {areasFiltradas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Horario Asignado</label>
              <select 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold"
                value={form.turno_id}
                onChange={(e) => setForm({...form, turno_id: e.target.value})}
              >
                <option value="">Sin Turno Específico</option>
                {turnos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </div>

            <div className="md:col-span-3">
              <button type="submit" className="w-full bg-indigo-600 text-white p-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg">
                {editandoId ? 'ACTUALIZAR DATOS DE EMPLEADO' : 'REGISTRAR EMPLEADO'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla de Empleados con Información Completa */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Colaborador / ID Reloj</th>
              <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Ubicación Jerárquica</th>
              <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Horario</th>
              <th className="p-4 text-[10px] font-black text-slate-400 uppercase text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {empleados.map((e) => (
              <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="p-4">
                  <div className="font-bold text-slate-800 uppercase text-xs">{e.nombre}</div>
                  <div className="text-[10px] font-mono text-indigo-500 font-bold">ID: {e.user_id_reloj}</div>
                </td>
                <td className="p-4">
                  <div className="text-[10px] font-bold text-slate-600 uppercase">{e.empresas?.nombre}</div>
                  <div className="text-[9px] text-slate-400 uppercase">{e.sitios?.nombre} / {e.areas?.nombre}</div>
                </td>
                <td className="p-4">
                  <span className="text-[10px] font-black bg-slate-100 px-2 py-1 rounded-md text-slate-500">
                    {e.turnos?.nombre || 'SIN TURNO'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => prepararEdicion(e)}
                    className="bg-slate-900 text-white p-2 rounded-xl hover:bg-indigo-600 transition-colors"
                  >
                    ✏️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}