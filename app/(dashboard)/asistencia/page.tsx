"use client";

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

export default function MonitorAsistencia() {
  const supabase = createClientComponentClient();
  const [jornadas, setJornadas] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [mesSeleccionado, setMesSeleccionado] = useState(format(new Date(), 'yyyy-MM'));
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [empresaId, setEmpresaId] = useState('TODAS');

  useEffect(() => {
    fetchEmpresas();
  }, []);

  useEffect(() => {
    fetchDatos();
  }, [mesSeleccionado, fechaInicio, fechaFin, empresaId]);

  async function fetchEmpresas() {
    const { data } = await supabase.from('empresas').select('id, nombre');
    if (data) setEmpresas(data);
  }

  async function fetchDatos() {
    setLoading(true);
    try {
      // Simplificamos la consulta para evitar que el 'inner join' oculte datos si falta el ID de empresa
      let query = supabase
        .from('jornadas_procesadas')
        .select(`
          *,
          empleados (
            nombre,
            area,
            empresa_id
          )
        `);

      if (empresaId !== 'TODAS') {
        query = query.eq('empleados.empresa_id', empresaId);
      }

      if (fechaInicio && fechaFin) {
        query = query.gte('entrada', `${fechaInicio}T00:00:00`)
                     .lte('entrada', `${fechaFin}T23:59:59`);
      } else {
        const dateRef = new Date(mesSeleccionado + "-01T12:00:00");
        const inicio = format(startOfMonth(dateRef), 'yyyy-MM-dd');
        const fin = format(endOfMonth(dateRef), 'yyyy-MM-dd');
        query = query.gte('entrada', `${inicio}T00:00:00`).lte('entrada', `${fin}T23:59:59`);
      }

      const { data, error } = await query.order('entrada', { ascending: false });
      if (error) throw error;
      setJornadas(data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }

  // Agrupación robusta
  const agrupadoPorArea = jornadas.reduce((acc: any, item: any) => {
    const area = item.empleados?.area || 'GENERAL / POR DEFINIR';
    if (!acc[area]) acc[area] = { registros: [], contador: 0 };
    acc[area].registros.push(item);
    acc[area].contador += 1;
    return acc;
  }, {});

  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-black text-slate-800 mb-6 uppercase tracking-tight">Monitor de Asistencia</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-8">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Empresa</label>
            <select className="w-full border-slate-200 rounded-lg text-sm" value={empresaId} onChange={(e) => setEmpresaId(e.target.value)}>
              <option value="TODAS">-- MOSTRAR TODO --</option>
              {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mes</label>
            <input type="month" className="w-full border-slate-200 rounded-lg text-sm" value={mesSeleccionado} onChange={(e) => setMesSeleccionado(e.target.value)} />
          </div>
          <div className="md:col-span-1">
             <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Rango Libre</label>
             <div className="flex gap-2">
                <input type="date" className="w-1/2 border-slate-200 rounded-lg text-xs" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
                <input type="date" className="w-1/2 border-slate-200 rounded-lg text-xs" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
             </div>
          </div>
          <div className="flex items-end">
            <button onClick={fetchDatos} className="w-full bg-slate-900 text-white text-xs font-bold py-2.5 rounded-lg hover:bg-slate-800 transition">REFRESCAR</button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 animate-pulse text-slate-400 font-bold uppercase">Sincronizando...</div>
        ) : (
          Object.keys(agrupadoPorArea).map(area => (
            <div key={area} className="mb-8 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-black text-slate-700 text-xs uppercase tracking-widest">{area}</h3>
                <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-bold">{agrupadoPorArea[area].contador} MARCAS</span>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="text-left text-[10px] text-slate-400 uppercase border-b border-slate-50">
                    <th className="p-4">Empleado</th>
                    <th className="p-4">Fecha</th>
                    <th className="p-4">Entrada</th>
                    <th className="p-4">Salida</th>
                    <th className="p-4 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {agrupadoPorArea[area].registros.map((j: any) => (
                    <tr key={j.id} className="text-sm hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-bold text-slate-700">{j.empleados?.nombre || 'ID: ' + j.user_id_reloj}</td>
                      <td className="p-4 text-slate-500">{format(new Date(j.entrada), 'dd MMM yyyy', {locale: es})}</td>
                      <td className="p-4 font-mono font-bold text-blue-600">{format(new Date(j.entrada), 'HH:mm:ss')}</td>
                      <td className="p-4 font-mono font-bold text-orange-600">{j.salida ? format(new Date(j.salida), 'HH:mm:ss') : '--:--:--'}</td>
                      <td className="p-4 text-center">
                        <span className={`text-[10px] font-black px-2 py-1 rounded uppercase ${j.estado === 'abierta' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                          {j.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </div>
    </div>
  );
}