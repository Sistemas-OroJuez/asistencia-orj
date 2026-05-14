"use client";

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

export default function MonitorAsistencia() {
  const supabase = createClientComponentClient();

  // --- ESTADOS ---
  // Se agrega <any[]> para evitar el error de "SetStateAction<never[]>" en el build
  const [jornadas, setJornadas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros: Mes actual por defecto, Rango de fechas y Empresa
  const [mesSeleccionado, setMesSeleccionado] = useState(format(new Date(), 'yyyy-MM'));
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  
  // ID de OroJuez SA para filtrar la data
  const [empresaId] = useState('dcb8a81e-338e-4da4-a278-fb4a772c9c72');

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

      // Lógica de Filtro de Fechas (Rango vs Mes)
      if (fechaInicio && fechaFin) {
        query = query.gte('entrada', `${fechaInicio}T00:00:00`)
                     .lte('entrada', `${fechaFin}T23:59:59`);
      } else {
        // Si no hay rango, usamos el mes seleccionado
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
  const agrupadoPorArea = jornadas.reduce((acc: any, item: any) => {
    const area = item.empleados?.area || 'SIN ÁREA DEFINIDA';
    if (!acc[area]) acc[area] = { registros: [], contador: 0 };
    acc[area].registros.push(item);
    acc[area].contador += 1;
    return acc;
  }, {});

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-black text-gray-800 tracking-tight uppercase">
            📊 Monitoreo de Asistencia
          </h1>
          <p className="text-gray-500">Visualización de registros en tiempo real por departamento.</p>
        </header>

        {/* --- PANEL DE FILTROS --- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-6 rounded-xl shadow-md mb-8 border-t-4 border-blue-600">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Filtrar por Mes</label>
            <input 
              type="month" 
              className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={mesSeleccionado}
              onChange={(e) => {
                setMesSeleccionado(e.target.value);
                setFechaInicio(''); setFechaFin('');
              }}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Desde (Rango)</label>
            <input 
              type="date" 
              className="w-full border border-gray-200 rounded-lg p-2 text-sm"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Hasta (Rango)</label>
            <input 
              type="date" 
              className="w-full border border-gray-200 rounded-lg p-2 text-sm"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
            />
          </div>
          <div className="flex items-end">
             <button 
                onClick={fetchDatos} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition duration-200 shadow-sm"
             >
               ACTUALIZAR
             </button>
          </div>
        </div>

        {/* --- LISTADO POR ÁREAS --- */}
        {loading ? (
          <div className="flex flex-col items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-400 font-medium">Cargando registros...</p>
          </div>
        ) : Object.keys(agrupadoPorArea).length === 0 ? (
          <div className="bg-white p-20 rounded-xl text-center border-2 border-dashed">
            <p className="text-gray-400 font-bold uppercase tracking-widest">No se encontraron registros</p>
          </div>
        ) : (
          Object.keys(agrupadoPorArea).sort().map(area => (
            <div key={area} className="mb-10 bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
              <div className="bg-gray-800 px-6 py-4 flex justify-between items-center">
                <h2 className="text-white font-extrabold text-lg tracking-tighter uppercase">ÁREA: {area}</h2>
                <span className="bg-blue-500 text-white text-xs px-4 py-1 rounded-full font-black">
                  {agrupadoPorArea[area].contador} REGISTROS
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-xs font-black text-gray-500 uppercase">Empleado</th>
                      <th className="px-6 py-3 text-xs font-black text-gray-500 uppercase">Fecha</th>
                      <th className="px-6 py-3 text-xs font-black text-gray-500 uppercase">Entrada</th>
                      <th className="px-6 py-3 text-xs font-black text-gray-500 uppercase">Salida</th>
                      <th className="px-6 py-3 text-xs font-black text-gray-500 uppercase text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {agrupadoPorArea[area].registros.map((j: any) => (
                      <tr key={j.id} className="hover:bg-blue-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900">{j.empleados?.nombre}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                          {format(new Date(j.entrada), 'eeee, d MMM', { locale: es })}
                        </td>
                        <td className="px-6 py-4 text-sm text-blue-600 font-extrabold">
                          {format(new Date(j.entrada), 'HH:mm:ss')}
                        </td>
                        <td className="px-6 py-4 text-sm text-orange-600 font-extrabold">
                          {j.salida ? format(new Date(j.salida), 'HH:mm:ss') : '--:--:--'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest border ${
                            j.estado === 'abierta' 
                              ? 'bg-green-50 text-green-700 border-green-200' 
                              : 'bg-gray-100 text-gray-600 border-gray-200'
                          }`}>
                            {j.estado.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}