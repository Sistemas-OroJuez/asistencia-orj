'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format, startOfMonth, endOfMonth, getDay, differenceInMinutes } from 'date-fns';
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

  useEffect(() => {
    fetchJornadas();
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

  // Lógica Art. 49: Recargo del 25% entre las 19:00 y las 06:00
  const calcularRecargoNocturno = (entrada: Date, salida: Date) => {
    let minutosNocturnos = 0;
    let actual = new Date(entrada);
    while (actual < salida) {
      const hora = actual.getHours();
      if (hora >= 19 || hora < 6) minutosNocturnos++;
      actual.setMinutes(actual.getMinutes() + 1);
    }
    return minutosNocturnos / 60;
  };

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

      const procesadas = (data || []).map(j => {
        const ent = toZonedTime(new Date(j.entrada), timeZone);
        const sal = j.salida ? toZonedTime(new Date(j.salida), timeZone) : ent;
        
        const horasTotales = differenceInMinutes(sal, ent) / 60;
        const diaSemana = getDay(ent); // 0 = Domingo, 6 = Sábado
        const esFinDeSemana = diaSemana === 0 || diaSemana === 6;

        // 1. Recargo Nocturno 25% (Sobre las horas trabajadas en ese rango)
        const h25 = calcularRecargoNocturno(ent, sal);

        // 2. Horas Extras (Art. 55)
        let h50 = 0;
        let h100 = 0;

        if (esFinDeSemana) {
          h100 = horasTotales; // Sábados y Domingos siempre 100%
        } else if (horasTotales > 8) {
          const extras = horasTotales - 8;
          // Si la salida es de madrugada (00h-06h), esas extras son al 100%
          const horaSalida = sal.getHours();
          if (horaSalida >= 0 && horaSalida <= 6 && sal.getDate() !== ent.getDate()) {
            h100 = Math.min(extras, horaSalida);
            h50 = extras - h100;
          } else {
            h50 = extras;
          }
        }

        return {
          ...j,
          h_totales: horasTotales,
          h_25: h25,
          h_50: h50,
          h_100: h100,
          excedeLimite: (h50 + h100) > 4 // Alerta Art. 55 (Límite 4h diarias)
        };
      });

      setJornadas(procesadas);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatFechaEcuador = (fechaIso: string) => {
    if (!fechaIso) return '---';
    return format(toZonedTime(new Date(fechaIso), timeZone), "HH:mm:ss");
  };

  const agrupadoPorArea = jornadas.reduce((acc: any, j: any) => {
    const areaNombre = j.empleados?.area?.nombre || 'GENERAL';
    if (!acc[areaNombre]) acc[areaNombre] = [];
    acc[areaNombre].push(j);
    return acc;
  }, {});

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-slate-50 min-h-screen font-sans">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">⏱️ Control de Jornadas</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Cálculos según Código del Trabajo Ecuador</p>
        </div>
        <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase shadow-sm">PDF / IMPRIMIR</button>
      </header>

      {/* FILTROS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 mb-8 print:hidden">
        <input type="month" value={mesSeleccionado} onChange={(e) => setMesSeleccionado(e.target.value)} className="w-full border-slate-100 bg-slate-50 rounded-xl text-sm font-bold p-3 outline-none" />
        <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="w-full border-slate-100 bg-slate-50 rounded-xl text-sm font-bold p-3 outline-none" />
        <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="w-full border-slate-100 bg-slate-50 rounded-xl text-sm font-bold p-3 outline-none" />
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400 font-black uppercase text-xs">Sincronizando...</div>
      ) : (
        <div className="space-y-12">
          {Object.keys(agrupadoPorArea).map((area) => (
            <section key={area} className="break-inside-avoid">
              <h2 className="text-xl font-black text-slate-800 uppercase border-b-2 border-slate-200 pb-2 mb-6">Departamento: {area}</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-[9px] font-black text-slate-400 uppercase">
                      <th className="pb-2 pl-4">Colaborador</th>
                      <th className="pb-2 text-center">Marcaciones</th>
                      <th className="pb-2 text-center">Total Horas</th>
                      <th className="pb-2 text-center text-indigo-600">Rec. 25%</th>
                      <th className="pb-2 text-center text-orange-600">Supl. 50%</th>
                      <th className="pb-2 text-center text-red-600">Extr. 100%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agrupadoPorArea[area].map((j: any) => (
                      <tr key={j.id} className="bg-white border border-slate-200 shadow-sm group">
                        <td className="p-4 rounded-l-2xl border-y border-l border-slate-100">
                          <div className="text-[9px] font-black text-indigo-500 uppercase">ID: {j.user_id_reloj}</div>
                          <div className="font-black text-slate-800 uppercase text-xs">{j.empleados?.nombre}</div>
                          <div className="text-[8px] text-slate-400 font-bold uppercase">{j.empleados?.sitio?.nombre}</div>
                        </td>
                        <td className="p-4 text-center border-y border-slate-100">
                          <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                             {format(toZonedTime(new Date(j.entrada), timeZone), "eee dd MMM", { locale: es })}
                          </div>
                          <div className="text-[10px] font-black text-slate-700 bg-slate-50 rounded-lg py-1 px-2">
                            {formatFechaEcuador(j.entrada)} - {j.salida ? formatFechaEcuador(j.salida) : '...'}
                          </div>
                        </td>
                        <td className="p-4 text-center bg-slate-50/50 border-y border-slate-100 font-black text-slate-900 text-xs">
                          {j.h_totales.toFixed(2)}h
                        </td>
                        <td className="p-4 text-center font-black text-indigo-600 text-xs border-y border-slate-100">
                          {j.h_25 > 0 ? `${j.h_25.toFixed(2)}h` : '-'}
                        </td>
                        <td className={`p-4 text-center font-black text-xs border-y border-slate-100 ${j.excedeLimite ? 'bg-red-50 text-red-600' : 'text-orange-600'}`}>
                          {j.h_50 > 0 ? `${j.h_50.toFixed(2)}h` : '-'}
                          {j.excedeLimite && <div className="text-[7px] uppercase">Excede 4h</div>}
                        </td>
                        <td className="p-4 text-center font-black text-red-600 text-xs border-y border-slate-100">
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