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
      // 1. Traer empleados con sus relaciones básicas (Cruce Manual)
      const { data: listaEmpleados } = await supabase
        .from('empleados')
        .select(`
          id, 
          nombre, 
          empresa_id, 
          area_id, 
          empresas(nombre), 
          areas(nombre)
        `);

      // 2. Consulta de Marcas pura
      let query = supabase
        .from('asistencia')
        .select('*')
        .gte('timestamp', `${fechaInicio} 00:00:00`)
        .lte('timestamp', `${fechaFin} 23:59:59`)
        .order('timestamp', { ascending: false });

      const { data: dataMarcas, error } = await query;
      
      if (error) throw error;

      // 3. Cruzar datos manualmente con NORMALIZACIÓN DE TIPOS (String)
      const cruzados = (dataMarcas || []).map(marca => {
        // Buscamos el empleado forzando ambos IDs a string para evitar fallos de tipo number vs string
        const infoEmpleado = listaEmpleados?.find(e => 
          String(e.id) === String(marca.user_id)
        );
        return {
          ...marca,
          empleado_info: infoEmpleado
        };
      });

      // 4. Aplicar Filtros en el cliente (Empresa, Área y Búsqueda por nombre)
      const filtrados = cruzados.filter(m => {
        const pasaEmpresa = filtroEmpresa === 'TODAS' || 
                           String(m.empleado_info?.empresa_id) === String(filtroEmpresa);
        
        const pasaArea = filtroArea === 'TODAS' || 
                        String(m.empleado_info?.area_id) === String(filtroArea);
        
        const nombreParaFiltrar = m.empleado_info?.nombre || "";
        const pasaNombre = nombreParaFiltrar.toLowerCase().includes(filtroNombre.toLowerCase()) || 
                          String(m.user_id).includes(filtroNombre);

        return pasaEmpresa && pasaArea && pasaNombre;
      });

      setMarcas(filtrados);
    } catch (e) {
      console.error("Error detallado en fetchMarcas:", e);
    } finally {
      setLoading(false);
    }
  }

  const handleAction = async (esClon: boolean) => {
    // Formato compatible con el timestamp de la base de datos
    const nuevoTimestamp = `${form.fecha}T${form.hora}`;
    const payload = { 
        user_id: form.user_id, 
        timestamp: nuevoTimestamp, 
        status: 1, 
        punch: 1 
    };

    try {
      if (esClon) {
        const { error } = await supabase.from('asistencia').insert([payload]);
        if (error) throw error;
        alert("¡Registro CLONADO correctamente!");
      } else {
        const { error } = await supabase.from('asistencia').update(payload).eq('id', form.id);
        if (error) throw error;
        alert("¡Registro ACTUALIZADO!");
      }
      setEditandoId(null);
      fetchMarcas();
    } catch (error: any) {
      alert("Error: " + error.message);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen text-slate-900 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-800">🕒 Monitor de Marcas Brutas</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1 text-indigo-600">OroJuez SA • Conexión Sincronizada</p>
        </header>

        {/* --- PANEL DE FILTROS --- */}
        <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-200 mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 ml-1">Empleado / ID</label>
            <input 
              type="text" 
              placeholder="Nombre o ID..." 
              className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              value={filtroNombre}
              onChange={(e) => setFiltroNombre(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 ml-1">Empresa</label>
            <select className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none cursor-pointer" value={filtroEmpresa} onChange={e => setFiltroEmpresa(e.target.value)}>
              <option value="TODAS">TODAS LAS EMPRESAS</option>
              {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 ml-1">Área</label>
            <select className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none cursor-pointer" value={filtroArea} onChange={e => setFiltroArea(e.target.value)}>
              <option value="TODAS">TODAS LAS ÁREAS</option>
              {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 ml-1">Periodo de Tiempo</label>
            <div className="flex gap-1">
              <input type="date" className="w-1/2 p-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-bold outline-none" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
              <input type="date" className="w-1/2 p-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-bold outline-none" value={fechaFin} onChange={e => setFechaFin(e.target.value)} />
            </div>
          </div>
          <div className="flex items-end">
             <button onClick={fetchMarcas} className="w-full bg-slate-900 text-white p-3.5 rounded-2xl text-[10px] font-black uppercase hover:bg-indigo-600 transition-all shadow-lg shadow-slate-200">Aplicar Filtros</button>
          </div>
        </div>

        {/* --- EDITOR DE REGISTROS --- */}
        {editandoId && (
          <div className="bg-indigo-600 text-white p-8 rounded-[2.5rem] mb-8 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xs font-black uppercase tracking-widest text-indigo-100">Corrección de Marca Manual</h3>
               <button onClick={() => setEditandoId(null)} className="text-indigo-200 hover:text-white transition-colors bg-indigo-500/50 w-8 h-8 rounded-full">✕</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
              <div>
                <label className="block text-[10px] font-black text-indigo-200 uppercase mb-2">Fecha</label>
                <input type="date" className="w-full p-4 bg-indigo-700 border-none rounded-2xl text-sm font-bold text-white outline-none focus:ring-2 focus:ring-white/20" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-indigo-200 uppercase mb-2">Hora (HH:MM:SS)</label>
                <input type="time" step="1" className="w-full p-4 bg-indigo-700 border-none rounded-2xl text-sm font-bold text-white outline-none focus:ring-2 focus:ring-white/20" value={form.hora} onChange={e => setForm({...form, hora: e.target.value})} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => handleAction(false)} className="flex-1 bg-slate-900 text-white p-4 rounded-2xl text-[10px] font-black uppercase hover:bg-black transition-all shadow-lg">Actualizar</button>
                <button onClick={() => handleAction(true)} className="flex-1 bg-white text-indigo-600 p-4 rounded-2xl text-[10px] font-black uppercase hover:bg-indigo-50 transition-all shadow-lg">Clonar</button>
              </div>
              <div className="text-[9px] text-indigo-100 italic leading-tight">Si clona un registro, se creará una marcación nueva con la fecha/hora seleccionada.</div>
            </div>
          </div>
        )}

        {/* --- TABLA PRINCIPAL --- */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Colaborador / ID</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Empresa / Área</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase text-center tracking-widest">Fecha y Hora</th>
                <th className="p-6 text-right px-8">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={4} className="p-24 text-center animate-pulse text-slate-300 font-black uppercase text-2xl tracking-tighter">Sincronizando base de datos...</td></tr>
              ) : marcas.length === 0 ? (
                <tr><td colSpan={4} className="p-24 text-center text-slate-400 font-bold uppercase text-xs italic">No se encontraron marcas brutas para los filtros seleccionados</td></tr>
              ) : marcas.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="p-6">
                    <div className="text-sm font-black uppercase text-slate-800">
                      {m.empleado_info?.nombre || <span className="text-orange-500 italic">Desconocido (ID: {m.user_id})</span>}
                    </div>
                    <div className="text-[9px] text-indigo-500 font-bold tracking-widest mt-1 uppercase">Reloj ID: {m.user_id}</div>
                  </td>
                  <td className="p-6">
                    <div className="text-[10px] font-bold text-slate-600 uppercase">{m.empleado_info?.empresas?.nombre || '---'}</div>
                    <div className="text-[9px] text-slate-400 uppercase font-bold mt-0.5">{m.empleado_info?.areas?.nombre || '---'}</div>
                  </td>
                  <td className="p-6 text-center">
                    <div className="text-[10px] font-black text-slate-400 mb-1.5 uppercase tracking-tighter">{format(new Date(m.timestamp), 'dd / MM / yyyy')}</div>
                    <span className="bg-slate-900 text-white px-4 py-2 rounded-2xl text-xs font-mono font-bold shadow-sm inline-block">
                      {format(new Date(m.timestamp), 'HH:mm:ss')}
                    </span>
                  </td>
                  <td className="p-6 text-right px-8">
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
                      className="opacity-0 group-hover:opacity-100 bg-white border border-slate-200 p-3 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-md transition-all transform hover:scale-110"
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