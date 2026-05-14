'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format, formatDistanceStrict, startOfMonth, endOfMonth, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';

export default function JornadasPage() {
  const supabase = createClientComponentClient();
  const [jornadas, setJornadas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const timeZone = 'America/Guayaquil';

  const [mesSeleccionado, setMesSeleccionado] = useState(format(new Date(), 'yyyy-MM'));
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const empresaId = 'dcb8a81e-338e-4da4-a278-fb4a772c9c72'; 

  useEffect(() => {
    fetchJornadas();
  }, [mesSeleccionado, fechaInicio, fechaFin]);

  const fetchJornadas = async () => {
    setLoading(true);
    try {
      let start, end;
      if (fechaInicio && fechaFin) {
        start = `${fechaInicio}T00:00:00Z`;
        end = `${fechaFin}T23:59:59Z`;
      } else {
        const dateRef = new Date(mesSeleccionado + "-01T12:00:00");
        start = format(startOfMonth(dateRef), "yyyy-MM-dd'T'00:00:00'Z'");
        end = format(endOfMonth(dateRef), "yyyy-MM-dd'T'23:59:59'Z'");
      }

      const { data, error } = await supabase
        .from('jornadas_procesadas')
        .select(`
          *,
          empleados:empleado_id (
            nombre,
            user_id_reloj,
            empresa_id,
            area:areas ( nombre ),
            sitio:sitios ( nombre )
          )
        `)
        .gte('entrada', start)
        .lte('entrada', end)
        .order('entrada', { ascending: false });

      if (error) throw error;
      
      // Cálculo de horas integrado
      const procesadas = (data || [])
        .filter(j => j.empleados?.empresa_id === empresaId)
        .map(j => {
          const horasTotales = j.horas_trabajadas ? parseIntervalToHours(j.horas_trabajadas) : 0;
          const esFinDeSemana = [0, 6].includes(getDay(new Date(j.entrada)));
          
          return {
            ...j,
            h_totales: horasTotales,
            h_25: j.horas_25_nocturnas || 0, // Usamos datos de la DB si existen
            h_50: !esFinDeSemana && horasTotales > 8 ? horasTotales - 8 : 0,
            h_100: esFinDeSemana ? horasTotales : 0
          };
        });

      setJornadas(procesadas);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const parseIntervalToHours = (interval: any) => {
    if (typeof interval === 'number') return interval;
    // Manejo simple de strings de PostgreSQL tipo "08:30:00"
    if (typeof interval === 'string') {
      const [h, m] = interval.split(':').map(Number);
      return h + (m / 60);
    }
    return 0;
  };

  const exportToCSV = () => {
    const encabezados = "Empleado,ID Reloj,Fecha,Entrada,Salida,Total Horas,25%,50%,100%\n";
    const filas = jornadas.map(j => 
      `${j.empleados?.nombre},${j.user_id_reloj},${format(new Date(j.entrada), 'dd/MM/yyyy')},${formatFechaEcuador(j.entrada)},${j.salida ? formatFechaEcuador(j.salida) : '---'},${j.h_totales.toFixed(2)},${j.h_25},${j.h_50.toFixed(2)},${j.h_100.toFixed(2)}`
    ).join("\n");
    
    const blob = new Blob([encabezados + filas], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Reporte_Horas_OroJuez_${mesSeleccionado}.csv`);
    link.click();
  };

  const formatFechaEcuador = (fechaIso: string) => {
    if (!fechaIso) return '---';
    const zonedDate = toZonedTime(new Date(fechaIso), timeZone);
    return format(zonedDate, "HH:mm:ss", { locale: es });
  };

  const agrupadoPorArea = jornadas.reduce((acc: any, j: any) => {
    const areaNombre = j.empleados?.area?.nombre || 'OPERACIONES';
    if (!acc[areaNombre]) acc[areaNombre] = [];
    acc[areaNombre].push(j);
    return acc;
  }, {});

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-slate-50 min-h-screen font-sans">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">📊 Control de Horas Extras</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Cálculo de Jornadas OroJuez SA</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportToCSV} className="bg-emerald-600 text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase shadow-sm">Descargar Excel (CSV)</button>
          <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase shadow-sm">Imprimir PDF</button>
        </div>
      </header>

      {/* FILTROS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 mb-8 print:hidden">
        <div>
          <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 ml-1">Periodo</label>
          <input type="month" value={mesSeleccionado} onChange={(e) => setMesSeleccionado(e.target.value)} className="w-full border-slate-100 bg-slate-50 rounded-xl text-sm font-bold p-3" />
        </div>
        <div>
          <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 ml-1">Desde</label>
          <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="w-full border-slate-100 bg-slate-50 rounded-xl text-sm font-bold p-3" />
        </div>
        <div>
          <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 ml-1">Hasta</label>
          <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="w-full border-slate-100 bg-slate-50 rounded-xl text-sm font-bold p-3" />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 animate-pulse font-black text-slate-400 uppercase text-xs">Calculando recargos...</div>
      ) : (
        <div className="space-y-12">
          {Object.keys(agrupadoPorArea).map((area) => (
            <section key={area} className="break-inside-avoid">
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter border-b-2 border-slate-200 pb-2 mb-6">
                Departamento: {area}
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-[9px] font-black text-slate-400 uppercase px-4">
                      <th className="pb-2 pl-4">Colaborador</th>
                      <th className="pb-2 text-center">Entrada/Salida</th>
                      <th className="pb-2 text-center bg-slate-100 rounded-t-lg">Total H.</th>
                      <th className="pb-2 text-center text-indigo-600">25%</th>
                      <th className="pb-2 text-center text-orange-600">50%</th>
                      <th className="pb-2 text-center text-red-600">100%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agrupadoPorArea[area].map((j: any) => (
                      <tr key={j.id} className="bg-white border border-slate-200 shadow-sm group hover:border-indigo-400 transition-all">
                        <td className="p-4 rounded-l-2xl">
                          <div className="text-[9px] font-black text-indigo-500 uppercase">ID: {j.user_id_reloj}</div>
                          <div className="font-black text-slate-800 uppercase text-xs">{j.empleados?.nombre}</div>
                        </td>
                        <td className="p-4 text-center">
                          <div className="text-[10px] font-bold text-slate-400 uppercase">{format(new Date(j.entrada), 'dd MMM')}</div>
                          <div className="text-[10px] font-black text-slate-700">{formatFechaEcuador(j.entrada)} - {j.salida ? formatFechaEcuador(j.salida) : '...'}</div>
                        </td>
                        <td className="p-4 text-center bg-slate-50 font-black text-slate-900 text-xs">
                          {j.h_totales.toFixed(2)}h
                        </td>
                        <td className="p-4 text-center font-black text-indigo-600 text-xs">
                          {j.h_25 > 0 ? `${j.h_25}h` : '-'}
                        </td>
                        <td className="p-4 text-center font-black text-orange-600 text-xs">
                          {j.h_50 > 0 ? `${j.h_50.toFixed(2)}h` : '-'}
                        </td>
                        <td className="p-4 text-center font-black text-red-600 text-xs rounded-r-2xl">
                          {j.h_100 > 0 ? `${j.h_100.toFixed(2)}h` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}