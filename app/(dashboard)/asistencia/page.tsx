"use client";

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format, parseISO } from 'date-fns';
import { toZonedTime, format as formatTZ } from 'date-fns-tz';

export default function MonitorAsistencia() {
  const supabase = createClientComponentClient();
  const timeZone = 'America/Guayaquil';
  
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

  /**
   * 1. LECTURA: Convertimos lo que viene de la DB (UTC) a Ecuador
   */
  const formatMostrar = (isoString: string, type: 'date' | 'time') => {
    if (!isoString) return "";
    // Forzamos la interpretación del string como UTC si no trae zona
    const date = isoString.includes('Z') || isoString.includes('+') ? parseISO(isoString) : parseISO(isoString + "Z");
    const zoned = toZonedTime(date, timeZone);
    return type === 'date' ? formatTZ(zoned, 'yyyy-MM-dd', { timeZone }) : formatTZ(zoned, 'HH:mm:ss', { timeZone });
  };

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
        .select(`id, nombre, user_id_reloj, empresa_id, area_id, empresas(nombre), areas(nombre)`);

      const { data: dataMarcas, error: errMarcas } = await supabase
        .from('asistencia')
        .select('*')
        .gte('timestamp', `${fechaInicio} 00:00:00`)
        .lte('timestamp', `${fechaFin} 23:59:59`)
        .order('timestamp', { ascending: false });

      if (errMarcas) throw errMarcas;

      const cruzados = (dataMarcas || []).map(marca => ({
        ...marca,
        empleado_info: listaEmpleados?.find(e => String(e.user_id_reloj).trim() === String(marca.user_id).trim())
      }));

      const filtrados = cruzados.filter(m => {
        const pasaEmpresa = filtroEmpresa === 'TODAS' || String(m.empleado_info?.empresa_id) === String(filtroEmpresa);
        const pasaArea = filtroArea === 'TODAS' || String(m.empleado_info?.area_id) === String(filtroArea);
        const nombreBusqueda = (m.empleado_info?.nombre || "").toLowerCase();
        const pasaNombre = nombreBusqueda.includes(filtroNombre.toLowerCase()) || String(m.user_id).includes(filtroNombre);
        return pasaEmpresa && pasaArea && pasaNombre;
      });

      setMarcas(filtrados);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  /**
   * 2. ESCRITURA: El truco para evitar las 5 horas es enviar el offset -05
   */
  const handleUpdate = async () => {
    // IMPORTANTE: Agregamos -05 al final para decirle a la DB que esta es hora de Ecuador
    const nuevoTimestamp = `${form.fecha}T${form.hora}-05:00`;
    
    try {
      const { error } = await supabase
        .from('asistencia')
        .update({ 
          user_id: form.user_id, 
          timestamp: nuevoTimestamp 
        })
        .eq('id', form.id);
      
      if (error) throw error;
      setEditandoId(null);
      fetchMarcas();
    } catch (error: any) { 
      alert("Error: " + error.message); 
    }
  };

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen text-slate-900 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 border-l-4 border-indigo-600 pl-4">
          <h1 className="text-2xl font-black uppercase tracking-tighter italic">🕒 Monitor de Marcas Brutas</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Zona Horaria: Ecuador (GMT-5)</p>
        </header>

        {/* FILTROS */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-1">
            <label className="block text-[9px] font-black text-slate-400 uppercase mb-2">Filtro Rápido</label>
            <input type="text" placeholder="Nombre o ID..." className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none" value={filtroNombre} onChange={(e) => setFiltroNombre(e.target.value)} />
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase mb-2">Empresa</label>
            <select className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none" value={filtroEmpresa} onChange={e => setFiltroEmpresa(e.target.value)}>
              <option value="TODAS">TODAS</option>
              {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase mb-2">Área</label>
            <select className="w-full p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none" value={filtroArea} onChange={e => setFiltroArea(e.target.value)}>
              <option value="TODAS">TODAS</option>
              {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[9px] font-black text-slate-400 uppercase mb-2">Rango de Fecha</label>
            <div className="flex gap-1">
              <input type="date" className="w-1/2 p-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-bold" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
              <input type="date" className="w-1/2 p-3 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-bold" value={fechaFin} onChange={e => setFechaFin(e.target.value)} />
            </div>
          </div>
          <div className="flex items-end">
             <button onClick={fetchMarcas} className="w-full bg-slate-900 text-white p-3.5 rounded-2xl text-[10px] font-black uppercase hover:bg-indigo-600 transition-all">Actualizar</button>
          </div>
        </div>

        {/* EDITOR */}
        {editandoId && (
          <div className="bg-indigo-600 text-white p-8 rounded-[2.5rem] mb-8 shadow-xl border-4 border-white">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
              <div>
                <label className="block text-[10px] font-black uppercase mb-2">Corregir Fecha</label>
                <input type="date" className="w-full p-4 bg-indigo-700 border-none rounded-2xl text-sm font-bold text-white outline-none" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase mb-2">Corregir Hora</label>
                <input type="time" step="1" className="w-full p-4 bg-indigo-700 border-none rounded-2xl text-sm font-bold text-white outline-none" value={form.hora} onChange={e => setForm({...form, hora: e.target.value})} />
              </div>
              <div className="flex gap-3">
                <button onClick={handleUpdate} className="flex-1 bg-slate-900 text-white p-4 rounded-2xl text-[10px] font-black uppercase hover:bg-black transition-all font-bold">Guardar</button>
                <button onClick={() => setEditandoId(null)} className="flex-1 bg-indigo-500 text-white p-4 rounded-2xl text-[10px] font-black uppercase hover:bg-indigo-400 transition-all font-bold">Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {/* TABLA */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase">
                <th className="p-6">Colaborador / ID</th>
                <th className="p-6">Empresa / Área</th>
                <th className="p-6 text-center">Fecha y Hora (Ecuador)</th>
                <th className="p-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={4} className="p-20 text-center animate-pulse text-slate-300 font-black uppercase">Sincronizando...</td></tr>
              ) : marcas.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="p-6">
                    <div className="text-sm font-black uppercase text-slate-800">{m.empleado_info?.nombre || 'DESCONOCIDO'}</div>
                    <div className="text-[9px] text-indigo-500 font-bold tracking-widest mt-1 uppercase font-mono">ID: {m.user_id}</div>
                  </td>
                  <td className="p-6">
                    <div className="text-[10px] font-bold text-slate-600 uppercase">{m.empleado_info?.empresas?.nombre || '---'}</div>
                    <div className="text-[9px] text-slate-400 uppercase font-bold">{m.empleado_info?.areas?.nombre || '---'}</div>
                  </td>
                  <td className="p-6 text-center">
                    <div className="text-[10px] font-black text-slate-400 mb-1.5 uppercase">
                        {formatMostrar(m.timestamp, 'date').split('-').reverse().join(' / ')}
                    </div>
                    <span className="bg-slate-900 text-white px-4 py-2 rounded-2xl text-xs font-mono font-bold shadow-sm inline-block min-w-[100px]">
                      {formatMostrar(m.timestamp, 'time')}
                    </span>
                  </td>
                  <td className="p-6 text-right px-8">
                    <button 
                      onClick={() => {
                        setEditandoId(m.id);
                        setForm({
                          id: m.id,
                          user_id: m.user_id,
                          fecha: formatMostrar(m.timestamp, 'date'),
                          hora: formatMostrar(m.timestamp, 'time')
                        });
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="bg-slate-100 p-3 rounded-2xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
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