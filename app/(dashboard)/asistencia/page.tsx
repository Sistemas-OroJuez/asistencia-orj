"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

export default function MonitorAsistencia() {
  // --- ESTADOS ---
  const [jornadas, setJornadas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros: Mes actual por defecto, Rango de fechas y Empresa
  const [mesSeleccionado, setMesSeleccionado] = useState(format(new Date(), 'yyyy-MM'));
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [empresaId, setEmpresaId] = useState('dcb8a81e-338e-4da4-a278-fb4a772c9c72');

  useEffect(() => {
    fetchDatos();
  }, [mesSeleccionado, fechaInicio, fechaFin, empresaId]);

  async function fetchDatos() {
    setLoading(true);
    try {
      // Consulta con Inner Join a Empleados para filtrar por Empresa y traer el Área
      let query = supabase
        .from('jornadas_procesadas')
        .select(`
          *,
          empleados!inner (
            nombre,
            area,
            empresa_id
          )
        `)
        .eq('empleados.empresa_id', empresaId);

      // Lógica de Filtro de Fechas
      if (fechaInicio && fechaFin) {
        query = query.gte('entrada', `${fechaInicio}T00:00:00`)
                     .lte('entrada', `${fechaFin}T23:59:59`);
      } else {
        const dateRef = new Date(mesSeleccionado + "-01T12:00:00");
        const inicioMes = format(startOfMonth(dateRef), 'yyyy-MM-dd');
        const finMes = format(endOfMonth(dateRef), 'yyyy-MM-dd');
        query = query.gte('entrada', `${inicioMes}T00:00:00`)
                     .lte('entrada', `${finMes}T23:59:59`);
      }

      const { data, error } = await query.order('entrada', { ascending: false });
      if (error) throw error;
      setJornadas(data || []);
    } catch (error) {
      console.error("Error cargando asistencia:", error);
    } finally {
      setLoading(false);
    }
  }

  // --- LÓGICA DE AGRUPACIÓN POR ÁREA Y SUBTOTALES ---
  const agrupadoPorArea = jornadas.reduce((acc, item) => {
    const area = item.empleados?.area || 'SIN ÁREA DEFINIDA';
    if (!acc[area]) acc[area] = { registros: [], contador: 0 };
    acc[area].registros.push(item);
    acc[area].contador += 1;
    return acc;
  }, {});

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Panel de Monitoreo de Asistencia</h1>

        {/* --- FILTROS --- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-6 rounded-xl shadow-md mb-8 border-t-4 border-blue-600">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase">Filtrar por Mes</label>
            <input 
              type="month" 
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={mesSeleccionado}
              onChange={(e) => {
                setMesSeleccionado(e.target.value);
                setFechaInicio(''); setFechaFin(''); // Resetea rango al cambiar mes
              }}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase">Desde (Rango)</label>
            <input 
              type="date" 
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase">Hasta (Rango)</label>
            <input 
              type="date" 
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 shadow-sm"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </div>
          <div className="flex items-end">
             <button 
                onClick={fetchDatos} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-md transition duration-200"
             >
               🔍 APLICAR FILTROS
             </button>
          </div>
        </div>

        {/* --- LISTADO POR ÁREAS --- */}
        {loading ? (
          <div className="text-center py-10 text-gray-500">Cargando datos de asistencia...</div>
        ) : (
          Object.keys(agrupadoPorArea).sort().map(area => (
            <div key={area} className="mb-10 bg-white rounded-lg shadow overflow-hidden border border-gray-200">
              <div className="bg-gray-800 px-6 py-4 flex justify-between items-center">
                <h2 className="text-white font-bold text-lg">ÁREA: {area}</h2>
                <span className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full font-bold">
                  {agrupadoPorArea[area].contador} REGISTROS ENCONTRADOS
                </span>
              </div>
              <table className="w-full text-left">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-bold text-gray-600 uppercase">Empleado</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-600 uppercase">Fecha</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-600 uppercase">Entrada</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-600 uppercase">Salida</th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-600 uppercase text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {agrupadoPorArea[area].registros.map((j) => (
                    <tr key={j.id} className="hover:bg-blue-50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900">{j.empleados?.nombre}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {format(new Date(j.entrada), 'PPPP', { locale: es })}
                      </td>
                      <td className="px-6 py-4 text-sm text-blue-600 font-bold">
                        {format(new Date(j.entrada), 'HH:mm:ss')}
                      </td>
                      <td className="px-6 py-4 text-sm text-orange-600 font-bold">
                        {j.salida ? format(new Date(j.salida), 'HH:mm:ss') : '--:--:--'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-black ${
                          j.estado === 'abierta' ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {j.estado.toUpperCase()}
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