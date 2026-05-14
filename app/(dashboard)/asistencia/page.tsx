"use client";

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format } from 'date-fns';

export default function MonitorAsistencia() {
  const supabase = createClientComponentClient();
  
  const [marcas, setMarcas] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroEmpresa, setFiltroEmpresa] = useState('TODAS');
  const [filtroArea, setFiltroArea] = useState('TODAS');
  const [fechaInicio, setFechaInicio] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [fechaFin, setFechaFin] = useState(format(new Date(), 'yyyy-MM-dd'));

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
      const { data: listaEmpleados } = await supabase
        .from('empleados')
        .select(`
          id, 
          nombre, 
          user_id_reloj, 
          empresa_id, 
          area_id, 
          empresas(nombre), 
          areas(nombre)
        `);

      const { data: dataMarcas, error: errMarcas } = await supabase
        .from('asistencia')
        .select('*')
        .gte('timestamp', `${fechaInicio} 00:00:00`)
        .lte('timestamp', `${fechaFin} 23:59:59`)
        .order('timestamp', { ascending: false });

      if (errMarcas) throw errMarcas;

      const cruzados = (dataMarcas || []).map(marca => {
        const idRelojMarca = String(marca.user_id).trim();
        const infoEmpleado = listaEmpleados?.find(e => 
          String(e.user_id_reloj).trim() === idRelojMarca
        );
        return { ...marca, empleado_info: infoEmpleado };
      });

      const filtrados = cruzados.filter(m => {
        const pasaEmpresa = filtroEmpresa === 'TODAS' || String(m.empleado_info?.empresa_id) === String(filtroEmpresa);
        const pasaArea = filtroArea === 'TODAS' || String(m.empleado_info?.area_id) === String(filtroArea);
        const nombreBusqueda = (m.empleado_info?.nombre || "").toLowerCase();
        const pasaNombre = nombreBusqueda.includes(filtroNombre.toLowerCase()) || String(m.user_id).includes(filtroNombre);
        return pasaEmpresa && pasaArea && pasaNombre;
      });

      setMarcas(filtrados);
    } catch (e) {
      console.error("Error en Monitor:", e);
    } finally {
      setLoading(false);
    }
  }

  const rawExtract = (timestampStr: string, type: 'date' | 'time') => {
    if (!timestampStr) return "";
    const clean = timestampStr.split('+')[0].split('Z')[0].replace('T', ' ');
    const parts = clean.trim().split(' ');
    if (type === 'date') return parts[0];
    if (type === 'time') return parts[1] ? parts[1].substring(0, 8) : "00:00:00"; 
    return "";
  };

  const handleUpdate = async () => {
    const nuevoTimestamp = `${form.fecha} ${form.hora}`;
    const payload = { user_id: form.user_id, timestamp: nuevoTimestamp };

    try {
      const { error } = await supabase
        .from('asistencia')
        .update(payload)
        .eq('id', form.id);
      
      if (error) throw error;

      alert("Registro actualizado correctamente");
      setEditandoId(null);
      fetchMarcas();
    } catch (error: any) { 
      alert("Error al actualizar: " + error.message); 
    }
  };

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen text-slate-900 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 border-l-4 border-indigo-600 pl-4">
          <h1 className="text-2xl font-black uppercase tracking-tighter">🕒 Monitor de Marcas Brutas</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Auditoría OroJuez SA</p>
        </header>

        {/* FILTROS */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-1">
            <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 ml-1">Filtro Rápido</label>
            <input type="text" placeholder="Nombre o ID..." className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500" value={filtroNombre} onChange={(e) => setFiltroNombre(e.target.value)} />
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 ml-1">Empresa</label>
            <select className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none" value={filtroEmpresa} onChange={e => setFiltroEmpresa(e.target.value)}>
              <option value="TODAS">TODAS</option>
              {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 ml-1">Área</label>
            <select className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none" value={filtroArea} onChange={e => setFiltroArea(e.target.value)}>
              <option value="TODAS">TODAS</option>
              {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 ml-1">Rango</label>
            <div className="flex gap-1">
              <input type="date" className="w-1/2 p-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-bold" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
              <input type="date" className="w-1/2 p-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-bold" value={fechaFin} onChange={e => setFechaFin(e.target.value)} />
            </div>
          </div>
          <div className="flex items-end">
             <button onClick={fetchMarcas} className="w-full bg-slate-900 text-white p-3.5 rounded-2xl text-[10px] font-black uppercase hover:bg-indigo-600 transition-all">Actualizar</button>
          </div>
        </div>

        {/* EDITOR SIMPLIFICADO (SIN CLONAR) */}
        {editandoId && (
          <div className="bg-indigo-600 text-white p-8 rounded-[2.5rem] mb-8 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
              <div>
                <label className="block text-[10px] font-black uppercase mb-2">Corregir Fecha</label>
                <input type="date" className="w-full p-4 bg-indigo-700 border-none rounded-2xl text-sm font-bold text-white outline-none focus:ring-2 focus:ring-white/20" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase mb-2">Corregir Hora</label>
                <input type="time" step="1" className="w-full p-4 bg-indigo-700 border-none rounded-2xl text-sm font-bold text-white outline-none focus:ring-2 focus:ring-white/20" value={form.hora} onChange={e => setForm({...form, hora: e.target.value})} />
              </div>
              <div className="flex gap-3">
                <button onClick={handleUpdate} className="flex-1 bg-slate-900 text-white p-4 rounded-2xl text-[10px] font-black uppercase hover:bg-black transition-all">Guardar Cambios</button>
                <button onClick={() => setEditandoId(null)} className="flex-1 bg-indigo-500 text-white p-4 rounded-2xl text-[10px] font-black uppercase hover:bg-indigo-400 transition-all">Cancelar</button>
              </div>
              <div className="text-[10px] text-indigo-200 font-bold uppercase italic">
                * Editando marca de {marcas.find(m => m.id === editandoId)?.empleado_info?.nombre || 'ID ' + form.user_id}
              </div>
            </div>
          </div>
        )}

        {/* TABLA */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase">Colaborador / ID</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase">Empresa / Área</th>
                <th className="p-6 text-[10px] font-black text-slate-400 uppercase text-center">Fecha y Hora</th>
                <th className="p-6 text-right px-8">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={4} className="p-20 text-center animate-pulse text-slate-300 font-black uppercase">Sincronizando datos...</td></tr>
              ) : marcas.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="p-6">
                    <div className="text-sm font-black uppercase text-slate-800">
                      {m.empleado_info?.nombre || <span className="text-red-500 italic">DESCONOCIDO</span>}
                    </div>
                    <div className="text-[9px] text-indigo-500 font-bold tracking-widest mt-1 uppercase">ID RELOJ: {m.user_id}</div>
                  </td>
                  <td className="p-6">
                    <div className="text-[10px] font-bold text-slate-600 uppercase">{m.empleado_info?.empresas?.nombre || '---'}</div>
                    <div className="text-[9px] text-slate-400 uppercase font-bold mt-0.5">{m.empleado_info?.areas?.nombre || '---'}</div>
                  </td>
                  <td className="p-6 text-center">
                    <div className="text-[10px] font-black text-slate-400 mb-1.5 uppercase">
                        {rawExtract(m.timestamp, 'date').split('-').reverse().join(' / ')}
                    </div>
                    <span className="bg-slate-900 text-white px-4 py-2 rounded-2xl text-xs font-mono font-bold shadow-sm inline-block">
                      {rawExtract(m.timestamp, 'time')}
                    </span>
                  </td>
                  <td className="p-6 text-right px-8">
                    <button 
                      onClick={() => {
                        setEditandoId(m.id);
                        setForm({
                          id: m.id,
                          user_id: m.user_id,
                          fecha: rawExtract(m.timestamp, 'date'),
                          hora: rawExtract(m.timestamp, 'time')
                        });
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="opacity-0 group-hover:opacity-100 bg-white border border-slate-200 p-3 rounded-2xl text-slate-400 hover:text-indigo-600 hover:shadow-md transition-all"
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