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

  // --- ESTADOS DE FILTROS ---
  const [mesSeleccionado, setMesSeleccionado] = useState(format(new Date(), 'yyyy-MM'));
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  useEffect(() => {
    fetchJornadas();
    
    // Suscripción en tiempo real
    const channel = supabase
      .channel('jornadas_live')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'jornadas_procesadas' 
      }, () => fetchJornadas())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [mesSeleccionado, fechaInicio, fechaFin]);

  const fetchJornadas = async () => {
    setLoading(true);
    try {
      // 1. Definir rango de fechas
      let start, end;
      if (fechaInicio && fechaFin) {
        start = `${fechaInicio}T00:00:00Z`;
        end = `${fechaFin}T23:59:59Z`;
      } else {
        const dateRef = new Date(mesSeleccionado + "-01T12:00:00");
        start = format(startOfMonth(dateRef), "yyyy-MM-dd'T'00:00:00'Z'");
        end = format(endOfMonth(dateRef), "yyyy-MM-dd'T'23:59:59'Z'");
      }

      // 2. Consulta SIN filtros restrictivos de empresa (!inner eliminado)
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

      // 3. Procesamiento de horas y recargos
      const procesadas = (data || []).map(j => {
        const horasTotales = j.horas_trabajadas ? parseIntervalToHours(j.horas_trabajadas) : 0;
        const fechaEntrada = new Date(j.entrada);
        const diaSemana = getDay(fechaEntrada); // 0 = Domingo, 6 = Sábado
        const esFinDeSemana = diaSemana === 0 || diaSemana === 6;
        
        return {
          ...j,
          h_totales: horasTotales,
          h_25: j.minutos_atraso > 0 ? 0 : (j.minutos_atraso || 0), // Ejemplo: puedes vincularlo a tu campo real
          h_50: !esFinDeSemana && horasTotales > 8 ? horasTotales - 8 : 0,
          h_100: esFinDeSemana ? horasTotales : 0
        };
      });

      setJornadas(procesadas);
    } catch (err) {
      console.error("Error cargando jornadas:", err);
    } finally {
      setLoading(false);
    }
  };

  const parseIntervalToHours = (interval: any) => {
    if (typeof interval === 'number') return interval;
    if (typeof interval === 'string') {
      const parts = interval.split(':');
      if (parts.length >= 2) {
        const h = parseInt(parts[0]);
        const m = parseInt(parts[1]);
        return h + (m / 60);
      }
    }
    return 0;
  };

  const formatFechaEcuador = (fechaIso: string) => {
    if (!fechaIso) return '---';
    const zonedDate = toZonedTime(new Date(fechaIso), timeZone);
    return format(zonedDate, "HH:mm:ss", { locale: es });
  };

  // --- AGRUPACIÓN ---
  const agrupadoPorArea = jornadas.reduce((acc: any, j: any) => {
    const areaNombre = j.empleados?.area?.nombre || 'GENERAL / SIN ÁREA';
    if (!acc[areaNombre]) acc[areaNombre] = [];
    acc[areaNombre].push(j);
    return acc;
  }, {});

  // --- EXPORTACIONES ---
  const exportToCSV = () => {
    const encabezados = "Empleado,ID Reloj,Area,Fecha,Entrada,Salida,Total Horas,50%,100%\n";
    const filas = jornadas.map(j => 
      `${j.empleados?.nombre},${j.user_id_reloj},${j.empleados?.area?.nombre},${format(new Date(j.entrada), 'dd/MM/yyyy')},${formatFechaEcuador(j.entrada)},${j.salida ? formatFechaEcuador(j.salida) : '---'},${j.h_totales.toFixed(2)},${j.h_50.toFixed(2)},${j.h_100.toFixed(2)}`
    ).join("\n");
    
    const blob = new Blob(["\ufeff" + encabezados + filas], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Reporte_Jornadas_${mesSeleccionado}.csv`);
    link.click();
  };

  const sendWhatsApp = (j: any) => {
    const msg = `*REPORTE JORNADA*\nColaborador: ${j.empleados?.nombre}\nEntrada: ${formatFechaEcuador(j.entrada)}\nHoras: ${j.h_totales.toFixed(2)}h`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-slate-50 min-h-screen font-sans">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">⏱️ Control de Jornadas</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Sistema de Tiempos y Asistencia</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportToCSV} className="bg-emerald-600 text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase shadow-sm hover:bg-emerald-700 transition-all">CSV / EXCEL</button>
          <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase shadow-sm hover:bg-black transition-all">PDF / IMPRIMIR</button>
        </div>
      </header>

      {/* FILTROS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 mb-8 print:hidden">
        <div>
          <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 ml-1">Mes Seleccionado</label>
          <input type="month" value={mesSeleccionado} onChange={(e) => setMesSeleccionado(e.target.value)} className="w-full border-slate-100 bg-slate-50 rounded-xl text-sm font-bold p-3 focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div>
          <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 ml-1">Rango Desde</label>
          <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="w-full border-slate-100 bg-slate-50 rounded-xl text-sm font-bold p-3 focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
        <div>
          <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 ml-1">Rango Hasta</label>
          <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="w-full border-slate-100 bg-slate-50 rounded-xl text-sm font-bold p-3 focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 animate-pulse text-slate-400 font-black uppercase text-xs tracking-widest">Sincronizando datos...</div>
      ) : (
        <div className="space-y-12">
          {Object.keys(agrupadoPorArea).length === 0 && (
            <div className="bg-white p-20 rounded-[2.5rem] border-2 border-dashed border-slate-200 text-center">
               <p className="text-slate-400 font-black uppercase text-xs">No hay jornadas procesadas para este periodo.</p>
            </div>
          )}

          {Object.keys(agrupadoPorArea).map((area) => (
            <section key={area} className="break-inside-avoid">
              <div className="flex items-center justify-between border-b-2 border-slate-200 pb-2 mb-6">
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Departamento: {area}</h2>
                <div className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase">
                  {agrupadoPorArea[area].length} REGISTROS
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-[9px] font-black text-slate-400 uppercase px-4">
                      <th className="pb-2 pl-4">Colaborador</th>
                      <th className="pb-2 text-center">Marcaciones</th>
                      <th className="pb-2 text-center">Total Horas</th>
                      <th className="pb-2 text-center text-indigo-600">Rec. 25%</th>
                      <th className="pb-2 text-center text-orange-600">Ext. 50%</th>
                      <th className="pb-2 text-center text-red-600">Ext. 100%</th>
                      <th className="pb-2 pr-4 text-right print:hidden">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agrupadoPorArea[area].map((j: any) => (
                      <tr key={j.id} className="bg-white border border-slate-200 shadow-sm group hover:border-indigo-400 transition-all">
                        <td className="p-4 rounded-l-2xl border-y border-l border-slate-100">
                          <div className="text-[9px] font-black text-indigo-500 uppercase leading-none mb-1">ID: {j.user_id_reloj}</div>
                          <div className="font-black text-slate-800 uppercase text-xs">{j.empleados?.nombre || 'DESCONOCIDO'}</div>
                          <div className="text-[8px] text-slate-400 font-bold uppercase mt-1">{j.empleados?.sitio?.nombre}</div>
                        </td>
                        <td className="p-4 text-center border-y border-slate-100">
                          <div className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">
                             {format(new Date(j.entrada), "eee dd 'de' MMM", { locale: es })}
                          </div>
                          <div className="text-[10px] font-black text-slate-700 bg-slate-50 rounded-lg py-1 px-2">
                            {formatFechaEcuador(j.entrada)} <span className="text-slate-300">|</span> {j.salida ? formatFechaEcuador(j.salida) : 'EN TURNO'}
                          </div>
                        </td>
                        <td className="p-4 text-center bg-slate-50/50 border-y border-slate-100 font-black text-slate-900 text-xs">
                          {j.h_totales.toFixed(2)}h
                        </td>
                        <td className="p-4 text-center font-black text-indigo-600 text-xs border-y border-slate-100">
                          {j.h_25 > 0 ? `${j.h_25}h` : '-'}
                        </td>
                        <td className="p-4 text-center font-black text-orange-600 text-xs border-y border-slate-100">
                          {j.h_50 > 0 ? `${j.h_50.toFixed(2)}h` : '-'}
                        </td>
                        <td className="p-4 text-center font-black text-red-600 text-xs border-y border-slate-100">
                          {j.h_100 > 0 ? `${j.h_100.toFixed(2)}h` : '-'}
                        </td>
                        <td className="p-4 text-right rounded-r-2xl border-y border-r border-slate-100 print:hidden">
                          <button 
                            onClick={() => sendWhatsApp(j)}
                            className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                          >
                            <span className="text-sm">💬</span>
                          </button>
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

      <style jsx global>{`
        @media print {
          body { background: white !important; }
          .print\:hidden { display: none !important; }
          table { border-spacing: 0 !important; border-collapse: collapse !important; width: 100% !important; }
          tr { border-bottom: 1px solid #e2e8f0 !important; page-break-inside: avoid; }
          .rounded-l-2xl, .rounded-r-2xl, .rounded-[2rem] { border-radius: 0 !important; }
        }
      `}</style>
    </div>
  );
}