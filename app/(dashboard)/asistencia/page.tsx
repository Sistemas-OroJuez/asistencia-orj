"use client";

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function MonitorAsistencia() {
  const supabase = createClientComponentClient();
  const [marcas, setMarcas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para Edición/Clonación
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState({
    fecha: '',
    hora: '',
    user_id_reloj: '',
    id_registro: ''
  });

  // Filtros
  const [filtroFecha, setFiltroFecha] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    fetchMarcas();
  }, [filtroFecha]);

  async function fetchMarcas() {
    setLoading(true);
    const { data, error } = await supabase
      .from('asistencia')
      .select(`
        id,
        user_id_reloj,
        fecha,
        hora,
        empleados (nombre, empresa_id, empresas(nombre), sitios(nombre), areas(nombre))
      `)
      .eq('fecha', filtroFecha)
      .order('hora', { ascending: false });

    if (!error) setMarcas(data || []);
    setLoading(false);
  }

  const prepararAccion = (m: any) => {
    setEditandoId(m.id);
    setForm({
      fecha: m.fecha,
      hora: m.hora,
      user_id_reloj: m.user_id_reloj,
      id_registro: m.id
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdate = async (esClon: boolean) => {
    const payload = {
      fecha: form.fecha,
      hora: form.hora,
      user_id_reloj: form.user_id_reloj,
    };

    if (esClon) {
      // INSERTAR NUEVO (Clon)
      const { error } = await supabase.from('asistencia').insert([payload]);
      if (error) alert("Error al clonar: " + error.message);
    } else {
      // ACTUALIZAR EXISTENTE
      const { error } = await supabase.from('asistencia').update(payload).eq('id', form.id_registro);
      if (error) alert("Error al actualizar: " + error.message);
    }

    setEditandoId(null);
    fetchMarcas();
    alert(esClon ? "Marca clonada y guardada" : "Marca actualizada");
  };

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen text-slate-900">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-2xl font-black uppercase tracking-tight">🕒 Monitor de Marcas Brutas</h1>
          <p className="text-slate-500 text-sm italic">Historial directo del reloj. Solo Administradores pueden editar o clonar registros.</p>
        </header>

        {/* Panel de Edición/Clonación */}
        {editandoId && (
          <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-3xl mb-8 shadow-sm">
            <h2 className="text-[10px] font-black text-amber-600 uppercase mb-4 tracking-widest">Editor de Transacción</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Fecha</label>
                <input type="date" className="w-full p-2 rounded-xl border-slate-200 text-sm font-bold" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Hora (HH:MM:SS)</label>
                <input type="time" step="1" className="w-full p-2 rounded-xl border-slate-200 text-sm font-bold" value={form.hora} onChange={e => setForm({...form, hora: e.target.value})} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleUpdate(false)} className="flex-1 bg-slate-900 text-white p-2 rounded-xl text-[10px] font-black uppercase hover:bg-black">Actualizar</button>
                <button onClick={() => handleUpdate(true)} className="flex-1 bg-indigo-600 text-white p-2 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-700">Clonar</button>
              </div>
              <button onClick={() => setEditandoId(null)} className="text-[10px] font-black text-slate-400 uppercase hover:text-red-500">Cancelar</button>
            </div>
          </div>
        )}

        {/* Filtro de Fecha */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="text-[10px] font-black text-slate-400 uppercase">Ver día:</label>
            <input type="date" className="border-slate-200 rounded-lg text-sm font-bold" value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)} />
          </div>
          <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full uppercase">{marcas.length} registros hallados</span>
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Empleado / Reloj</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Empresa / Sitio</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase text-center">Fecha</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase text-center">Marcación</th>
                <th className="p-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="p-10 text-center animate-pulse text-slate-300 font-black">CONSULTANDO BASE...</td></tr>
              ) : marcas.map((m) => (
                <tr key={m.id} className={`hover:bg-slate-50 transition-colors ${editandoId === m.id ? 'bg-amber-50' : ''}`}>
                  <td className="p-4">
                    <div className="text-xs font-black uppercase text-slate-700">{m.empleados?.nombre || 'Desconocido'}</div>
                    <div className="text-[9px] text-indigo-500 font-bold">ID RELOJ: {m.user_id_reloj}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-[9px] font-bold text-slate-500 uppercase">{m.empleados?.empresas?.nombre}</div>
                    <div className="text-[8px] text-slate-400 uppercase">{m.empleados?.sitios?.nombre} / {m.empleados?.areas?.nombre}</div>
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-[10px] font-bold text-slate-600">{m.fecha}</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-mono font-bold">
                      {m.hora}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => prepararAccion(m)}
                      className="bg-slate-100 p-2 rounded-xl text-slate-400 hover:bg-orange-100 hover:text-orange-600 transition-all"
                      title="Editar o Clonar Marca"
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