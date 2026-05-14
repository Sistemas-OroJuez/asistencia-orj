"use client";

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format, startOfMonth, endOfMonth, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ControlJornadas() {
  const supabase = createClientComponentClient();
  const [jornadas, setJornadas] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [filtroNombre, setFiltroNombre] = useState('');
  const [mesSeleccionado, setMesSeleccionado] = useState(format(new Date(), 'yyyy-MM'));
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [empresaId, setEmpresaId] = useState('TODAS');
  const [estadoFiltro, setEstadoFiltro] = useState('TODOS');

  useEffect(() => {
    fetchEmpresas();
  }, []);

  useEffect(() => {
    fetchDatos();
  }, [mesSeleccionado, fechaInicio, fechaFin, empresaId, estadoFiltro]);

  async function fetchEmpresas() {
    const { data } = await supabase.from('empresas').select('id, nombre');
    if (data) setEmpresas(data);
  }

  async function fetchDatos() {
    setLoading(true);
    try {
      // Query con Triple Join para traer nombres descriptivos
      let query = supabase
        .from('jornadas_procesadas')
        .select(`
          *,
          empleados!inner (
            nombre,
            cedula,
            empresa_id,
            empresas (nombre),
            sitios (nombre),
            areas (nombre)
          )
        `);

      if (empresaId !== 'TODAS') {
        query = query.eq('empleados.empresa_id', empresaId);
      }

      if (estadoFiltro !== 'TODOS') {
        query = query.eq('estado', estadoFiltro.toLowerCase());
      }

      // Lógica de fechas
      if (fechaInicio && fechaFin) {
        query = query.gte('entrada', `${fechaInicio}T00:00:00`).lte('entrada', `${fechaFin}T23:59:59`);
      } else {
        const dateRef = new Date(mesSeleccionado + "-01T12:00:00");
        const inicio = format(startOfMonth(dateRef), 'yyyy-MM-dd');
        const fin = format(endOfMonth(dateRef), 'yyyy-MM-dd');
        query = query.gte('entrada', `${inicio}T00:00:00`).lte('entrada', `${fin}T23:59:59`);
      }

      const { data, error } = await query.order('entrada', { ascending: false });
      if (error) throw error;

      // Filtro local por nombre para rapidez
      const filtrados = data.filter(j => 
        j.empleados.nombre.toLowerCase().includes(filtroNombre.toLowerCase())
      );

      setJornadas(filtrados || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }

  // Cálculo de horas trabajadas
  const calcularHoras = (entrada: string, salida: string | null) => {
    if (!salida) return "--";
    const min = differenceInMinutes(new Date(salida), new Date(entrada));
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${h}h ${m}m`;
  };

  const enviarWhatsApp = (j: any) => {
    const fecha = format(new Date(j.entrada), 'dd/MM/yyyy');
    const horas = calcularHoras(j.entrada, j.salida);
    const mensaje = `Hola ${j.empleados.nombre}, tu jornada del ${fecha} registra: Entrada: ${format(new Date(j.entrada), 'HH:mm')}, Salida: ${j.salida ? format(new Date(j.salida), 'HH:mm') : 'Pendiente'}. Total: ${horas}.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen text-slate-900">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight">📊 Control de Jornadas</h1>
            <p className="text-slate-500 text-sm">Reporte procesado de horas trabajadas y status de turno.</p>
          </div>
          <div className="flex gap-2">
            <button className="bg-green-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-green-700 transition">Excel</button>
            <button className="bg-red-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-red-700 transition">PDF</button>
          </div>
        </header>

        {/* Panel de Filtros Avanzados */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-8 grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Buscar Empleado</label>
            <input 
              type="text" 
              placeholder="Nombre o Cédula..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500"
              value={filtroNombre}
              onChange={(e) => setFiltroNombre(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Empresa</label>
            <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={empresaId} onChange={(e) => setEmpresaId(e.target.value)}>
              <option value="TODAS">TODAS</option>
              {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Estado</label>
            <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={estadoFiltro} onChange={(e) => setEstadoFiltro(e.target.value)}>
              <option value="TODOS">TODOS</option>
              <option value="ABIERTA">ABIERTA</option>
              <option value="CERRADA">CERRADA</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Mes</label>
            <input type="month" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold" value={mesSeleccionado} onChange={(e) => setMesSeleccionado(e.target.value)} />
          </div>
        </div>

        {/* Tabla de Resultados */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Colaborador</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Ubicación</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Entrada</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Salida</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase text-center">Horas</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase text-center">Status</th>
                <th className="p-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="p-10 text-center animate-pulse font-black text-slate-300">CARGANDO JORNADAS...</td></tr>
              ) : jornadas.map((j) => (
                <tr key={j.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="text-xs font-black uppercase">{j.empleados?.nombre}</div>
                    <div className="text-[9px] text-indigo-500 font-bold">CI: {j.empleados?.cedula}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-[9px] font-bold text-slate-500 uppercase">{j.empleados?.empresas?.nombre}</div>
                    <div className="text-[8px] text-slate-400 uppercase">{j.empleados?.sitios?.nombre} / {j.empleados?.areas?.nombre}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-[10px] font-bold text-slate-600">{format(new Date(j.entrada), 'dd/MM/yy')}</div>
                    <div className="text-xs font-black text-blue-600">{format(new Date(j.entrada), 'HH:mm:ss')}</div>
                  </td>
                  <td className="p-4 text-xs font-black text-orange-600">
                    {j.salida ? format(new Date(j.salida), 'HH:mm:ss') : '--:--:--'}
                  </td>
                  <td className="p-4 text-center">
                    <span className="bg-slate-100 px-2 py-1 rounded-lg text-[10px] font-black">
                      {calcularHoras(j.entrada, j.salida)}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase ${
                      j.estado === 'abierta' ? 'bg-green-100 text-green-700 ring-1 ring-green-200' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {j.estado}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => enviarWhatsApp(j)}
                      className="bg-green-50 text-green-600 p-2 rounded-xl hover:bg-green-600 hover:text-white transition-all"
                      title="Enviar reporte por WhatsApp"
                    >
                      📱
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