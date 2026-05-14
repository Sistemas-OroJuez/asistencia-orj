"use client";

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format } from 'date-fns';

export default function MonitorAsistencia() {
  const supabase = createClientComponentClient();
  
  // Estados de Datos
  const [marcas, setMarcas] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de Filtros
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroEmpresa, setFiltroEmpresa] = useState('TODAS');
  const [filtroArea, setFiltroArea] = useState('TODAS');
  const [fechaInicio, setFechaInicio] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [fechaFin, setFechaFin] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Estado de Edición
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState({ fecha: '', hora: '', user_id: '', id: 0 });

  useEffect(() => {
    fetchMaestros();
    fetchMarcas();
  }, [filtroEmpresa, filtroArea, fechaInicio, fechaFin]);

  async function fetchMaestros() {
    const { data: emp } = await supabase.from('empresas').select('id, nombre');
    const { data: are } = await supabase.from('areas').select('id, nombre');
    if (emp) setEmpresas(emp);
    if (are) setAreas(are);
  }

  async function fetchMarcas() {
    setLoading(true);
    try {
      let query = supabase
        .from('asistencia')
        .select(`
          id, user_id, timestamp, status, punch,
          empleados!inner (
            nombre,
            empresa_id,
            area_id,
            empresas (nombre),
            areas (nombre),
            sitios (nombre)
          )
        `);

      if (filtroEmpresa !== 'TODAS') query = query.eq('empleados.empresa_id', filtroEmpresa);
      if (filtroArea !== 'TODAS') query = query.eq('empleados.area_id', filtroArea);
      
      query = query
        .gte('timestamp', `${fechaInicio}T00:00:00+00`)
        .lte('timestamp', `${fechaFin}T23:59:59+00`);

      const { data, error } = await query.order('timestamp', { ascending: false });
      if (error) throw error;

      const filtrados = data.filter(m => 
        m.empleados.nombre.toLowerCase().includes(filtroNombre.toLowerCase())
      );

      setMarcas(filtrados);
    } catch (e) {
      console.error("Error al cargar marcas:", e);
    } finally {
      setLoading(false);
    }
  }

  const handleAction = async (esClon: boolean) => {
    // Formateamos el timestamp correctamente para PostgreSQL (ISO 8601)
    const nuevoTimestamp = `${form.fecha}T${form.hora}:00+00`;
    
    const payload = { 
        user_id: form.user_id, 
        timestamp: nuevoTimestamp, 
        status: 1, 
        punch: 1 
    };

    try {
      if (esClon) {
        // CREAR NUEVO REGISTRO
        const { error } = await supabase.from('asistencia').insert([payload]);
        if (error) throw error;
        alert("Registro CLONADO con éxito. El sistema recalculará la jornada.");
      } else {
        // ACTUALIZAR EXISTENTE
        const { error } = await supabase.from('asistencia').update(payload).eq('id', form.id);
        if (error) throw error;
        alert("Registro ACTUALIZADO con éxito.");
      }
      setEditandoId(null);
      fetchMarcas();
    } catch (error: any) {
      alert("Error en la operación: " + error.message);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen text-slate-900 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-800">🕒 Monitor de Marcas Brutas</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Auditoría de Transacciones • OroJuez SA</p>
        </header>

        {/* --- PANEL DE FILTROS --- */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 mb-6 grid grid-cols-1 md:grid-cols-5 gap-5">
          <div className="md:col-span-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Empleado</label>
            <input 
              type="text" 
              placeholder="Buscar por nombre..." 
              className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              value={filtroNombre}
              onChange={(e) => setFiltroNombre(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Empresa</label>
            <select className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none cursor-pointer" value={filtroEmpresa} onChange={e => setFiltroEmpresa(e.target.value)}>
              <option value="TODAS">TODAS LAS EMPRESAS</option>
              {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Área</label>
            <select className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none cursor-pointer" value={filtroArea} onChange={e => setFiltroArea(e.target.value)}>
              <option value="TODAS">TODAS LAS ÁREAS</option>
              {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Rango de Fechas</label>
            <div className="flex gap-2">
              <input type="date" className="w-1/2 p-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-bold" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
              <input type="date" className="w-1/2 p-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-bold" value={fechaFin} onChange={e => setFechaFin(e.target.value)} />
            </div>
          </div>
          <div className="flex items-end">
             <button onClick={fetchMarcas} className="w-full bg-indigo-600 text-white p-3.5 rounded-2xl text-[10px] font-black uppercase hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all">Aplicar Filtros</button>
          </div>
        </div>

        {/* --- EDITOR DE REGISTRO (MODAL STYLE) --- */}
        {editandoId && (
          <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] mb-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400">Panel de Corrección de Marcas</h3>
               <button onClick={() => setEditandoId(null)} className="text-slate-500 hover:text-white transition-colors">CERRAR ✕</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Fecha de Marcación</label>
                <input type="date" className="w-full p-4 bg-slate-800 border border-slate-700 rounded-2xl text-sm font-bold text-white outline-none focus:border-indigo-500" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Hora de Marcación (HH:MM:SS)</label>
                <input type="time" step="1" className="w-full p-4 bg-slate-800 border border-slate-700 rounded-2xl text-sm font-bold text-white outline-none focus:border-indigo-500" value={form.hora} onChange={e => setForm({...form, hora: e.target.value})} />
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleAction(false)} 
                  className="flex-1 bg-white text-slate-900 p-4 rounded-2xl text-[10px] font-black uppercase hover:bg-slate-200 transition-all"
                >
                  Actualizar
                </button>
                <button 
                  onClick={() => handleAction(true)} 
                  className="flex-1 bg-emerald-500 text-white p-4 rounded-2xl text-[10px] font-black uppercase hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-900/20"
                >
                  Clonar Marca
                </button>
              </div>
              <div className="text-[9px] text-slate-500 italic leading-snug">
                * El clonado crea una nueva marca sin afectar la original, ideal para registrar salidas olvidadas.
              </div>
            </div>
          </div>
        )}

        {/* --- TABLA DE RESULTADOS --- */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Empleado</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Empresa / Sitio / Área</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase text-center tracking-widest">Fecha y Hora</th>
                <th className="p-6 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={4} className="p-24 text-center animate-pulse text-slate-300 font-black uppercase tracking-tighter text-2xl">Consultando Reloj...</td></tr>
              ) : marcas.length === 0 ? (
                <tr><td colSpan={4} className="p-24 text-center text-slate-400 font-bold uppercase text-xs italic">No se encontraron marcas con estos filtros</td></tr>
              ) : marcas.map((m) => (
                <tr key={m.id} className={`hover:bg-slate-50/80 transition-colors ${editandoId === m.id ? 'bg-indigo-50/30' : ''}`}>
                  <td className="p-6">
                    <div className="text-sm font-black uppercase text-slate-800">{m.empleados?.nombre}</div>
                    <div className="text-[9px] text-indigo-500 font-bold tracking-[0.2em] mt-1">ID RELOJ: {m.user_id}</div>
                  </td>
                  <td className="p-6">
                    <div className="text-[10px] font-bold text-slate-600 uppercase">{m.empleados?.empresas?.nombre}</div>
                    <div className="text-[9px] text-slate-400 uppercase font-bold mt-0.5">
                      {m.empleados?.sitios?.nombre || 'General'} • {m.empleados?.areas?.nombre || 'Sin Área'}
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    <div className="text-[10px] font-black text-slate-400 mb-1.5 uppercase">{format(new Date(m.timestamp), 'dd MMM yyyy')}</div>
                    <span className="bg-slate-900 text-white px-4 py-2 rounded-2xl text-xs font-mono font-bold shadow-sm">
                      {format(new Date(m.timestamp), 'HH:mm:ss')}
                    </span>
                  </td>
                  <td className="p-6 text-right">
                    <button 
                      onClick={() => {
                        setEditandoId(m.id);
                        setForm({
                          id: m.id,
                          user_id: m.user_id,
                          fecha: format(new Date(m.timestamp), 'yyyy-MM-dd'),
                          hora: format(new Date(m.timestamp), 'HH:mm:ss')
                        });
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="bg-white border border-slate-200 p-3 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-sm transition-all"
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
    </div>
  );
}