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
  
  // FILTROS
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
    const { data, error } = await supabase.from('empresas').select('id, nombre');
    if (error) {
      console.error("Error cargando empresas:", error.message);
      return;
    }
    if (data) {
      setEmpresas(data);
    }
  }

  async function fetchDatos() {
    setLoading(true);
    try {
      // AJUSTE: Quitamos !inner para que no oculte registros si el empleado tiene datos incompletos
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

      // AJUSTE: Formato de fecha ISO para asegurar coincidencia con la base de datos
      if (fechaInicio && fechaFin) {
        query = query.gte('entrada', `${fechaInicio}T00:00:00.000Z`)
                     .lte('entrada', `${fechaFin}T23:59:59.999Z`);
      } else {
        const dateRef = new Date(mesSeleccionado + "-01T12:00:00");
        const inicioMes = format(startOfMonth(dateRef), 'yyyy-MM-dd');
        const finMes = format(endOfMonth(dateRef), 'yyyy-MM-dd');
        query = query.gte('entrada', `${inicioMes}T00:00:00.000Z`)
                     .lte('entrada', `${finMes}T23:59:59.999Z`);
      }

      const { data, error } = await query.order('entrada', { ascending: false });
      if (error) throw error;
      setJornadas(data || []);
    } catch (error) {
      console.error("Error en fetchDatos:", error);
    } finally {
      setLoading(false);
    }
  }

  const agrupadoPorArea = jornadas.reduce((acc: any, item: any) => {
    // AJUSTE: Si el empleado no tiene área, lo enviamos a GENERAL para no perder el dato
    const area = item.empleados?.area || 'GENERAL / POR DEFINIR';
    if (!acc[area]) acc[area] = { registros: [], contador: 0 };
    acc[area].registros.push(item);
    acc[area].contador += 1;
    return acc;
  }, {});

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tighter">
            📊 Monitoreo de Asistencia
          </h1>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-6 rounded-xl shadow-md mb-8 border-t-4 border-indigo-600">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase mb-1">Seleccionar Empresa</label>
            <select 
              className="w-full border border-gray-200 rounded-lg p-2 text-sm bg-white"
              value={empresaId}
              onChange={(e) => setEmpresaId(e.target.value)}
            >
              <option value="TODAS">-- TODAS LAS EMPRESAS --</option>
              {empresas.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 uppercase mb-1">Mes</label>
            <input type="month" className="w-full border border-gray-200 rounded-lg p-2 text-sm"
              value={mesSeleccionado}
              onChange={(e) => { setMesSeleccionado(e.target.value); setFechaInicio(''); setFechaFin(''); }}
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-400 uppercase mb-1">Rango Personalizado</label>
            <div className="flex gap-1">
              <input type="date" className="w-1/2 border border-gray-200 rounded-lg p-1 text-xs" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
              <input type="date" className="w-1/2 border border-gray-200 rounded-lg p-1 text-xs" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
            </div>
          </div>

          <div className="flex items-end">
             <button onClick={fetchDatos} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2 rounded-lg transition shadow-sm uppercase text-xs tracking-widest">
               Actualizar
             </button>
          </div>
        </div>

        {loading ? (
          <p className="text-center py-20 text-gray-400 font-bold uppercase animate-pulse">Cargando datos...</p>
        ) : Object.keys(agrupadoPorArea).length === 0 ? (
          <div className="bg-white p-20 rounded-xl text-center border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-black uppercase tracking-widest">No hay registros para mostrar</p>
          </div>
        ) : (
          Object.keys(agrupadoPorArea).sort().map(area => (
            <div key={area} className="mb-10 bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
              <div className="bg-slate-800 px-6 py-4 flex justify-between items-center">
                <h2 className="text-white font-black text-sm uppercase tracking-widest">ÁREA: {area}</h2>
                <span className="bg-indigo-500 text-white text-[10px] px-3 py-1 rounded-full font-black uppercase">
                  {agrupadoPorArea[area].contador} Registros
                </span>
              </div>
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b">
                  <tr className="text-[10px] font-black text-gray-400 uppercase">
                    <th className="px-6 py-3">Empleado</th>
                    <th className="px-6 py-3">Fecha</th>
                    <th className="px-6 py-3">Entrada</th>
                    <th className="px-6 py-3">Salida</th>
                    <th className="px-6 py-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {agrupadoPorArea[area].registros.map((j: any) => (
                    <tr key={j.id} className="hover:bg-indigo-50/30 transition-colors text-sm">
                      <td className="px-6 py-4 font-bold text-gray-800 uppercase">
                        {j.empleados?.nombre || `ID: ${j.user_id_reloj}`}
                      </td>
                      <td className="px-6 py-4 text-gray-500">{format(new Date(j.entrada), 'dd/MM/yyyy')}</td>
                      <td className="px-6 py-4 font-black text-blue-600">{format(new Date(j.entrada), 'HH:mm:ss')}</td>
                      <td className="px-6 py-4 font-black text-orange-600">
                        {j.salida ? format(new Date(j.salida), 'HH:mm:ss') : '--:--:--'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                          j.estado === 'abierta' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
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