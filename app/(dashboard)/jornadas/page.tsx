'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format, startOfMonth, endOfMonth, getDay, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';

export default function JornadasPage() {
  const supabase = createClientComponentClient();
  const [jornadas, setJornadas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [mesSeleccionado, setMesSeleccionado] = useState(format(new Date(), 'yyyy-MM'));
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  /**
   * EXTRAER LITERAL: Esta función es la que garantiza que 
   * 16:29:00 en la base sea 16:29:00 en la pantalla.
   */
  const extraerLiteral = (timestampDB: string | null, tipo: 'fecha' | 'hora' | 'objeto'): string | Date | null => {
    if (!timestampDB) {
      if (tipo === 'objeto') return null;
      return "";
    }
    
    // Separamos la fecha de la hora usando el espacio o la T
    const partesT = timestampDB.split('T');
    const fechaParte = partesT[0];
    const horaParteCompleta = partesT[1] || timestampDB.split(' ')[1] || "";
    
    // Limpiamos la hora de cualquier rastro de +00, Z o milisegundos
    const horaLimpia = horaParteCompleta.split('.')[0].split('+')[0].split('Z')[0];

    if (tipo === 'fecha') return fechaParte;
    if (tipo === 'hora') return horaLimpia || "00:00:00";
    
    // Para el objeto Date de cálculo, usamos el formato ISO local sin zona
    return new Date(`${fechaParte}T${horaLimpia}`);
  };

  useEffect(() => {
    fetchJornadas();
  }, [mesSeleccionado, fechaInicio, fechaFin]);

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
        start = `${fechaInicio} 00:00:00`;
        end = `${fechaFin} 23:59:59`;
      } else {
        const dateRef = new Date(mesSeleccionado + "-01T12:00:00");
        start = format(startOfMonth(dateRef), "yyyy-MM-dd 00:00:00");
        end = format(endOfMonth(dateRef), "yyyy-MM-dd 23:59:59");
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
        // OBTENEMOS LAS FECHAS COMO OBJETOS NEUTROS
        const ent = extraerLiteral(j.entrada, 'objeto') as Date;
        const sal = j.salida ? extraerLiteral(j.salida, 'objeto') as Date : ent;
        
        if (!ent || !sal) return j;

        const horasTotales = differenceInMinutes(sal, ent) / 60;
        const diaSemana = getDay(ent); 
        const esFinDeSemana = diaSemana === 0 || diaSemana === 6;

        const h25 = calcularRecargoNocturno(ent, sal);
        let h50 = 0;
        let h100 = 0;

        if (esFinDeSemana) {
          h100 = horasTotales;
        } else if (horasTotales > 8) {
          const extras = horasTotales - 8;
          const horaSalida = sal.getHours();
          // Lógica de extras al 100% si sale después de medianoche en día laboral
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
          excedeLimite: (h50 + h100) > 4
        };
      });

      setJornadas(procesadas);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const agrupadoPorArea = jornadas.reduce((acc: any, j: any) => {
    const areaNombre = j.empleados?.area?.nombre || 'GENERAL';
    if (!acc[areaNombre]) acc[areaNombre] = [];
    acc[areaNombre].push(j);
    return acc;
  }, {});

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-slate-50 min-h-screen font-sans text-slate-900">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase italic">⏱️ Control de Jornadas</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Sincronizado con Reloj Biométrico</p>
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
        <div className="text-center py-20 text-slate-300 font-black uppercase text-xs">Cargando...</div>
      ) : (
        <div className="space-y-12">
          {Object.keys(agrupadoPorArea).map((area) => (
            <section key={area} className="break-inside-avoid">
              <h2 className="text-xl font-black text-slate-800 uppercase border-l-4 border-indigo-600 pl-4 mb-6">Departamento: {area}</h2>
              <div className="overflow-x-auto bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[9px] font-black text-slate-400 uppercase bg-slate-50/50">
                      <th className="p-6">Colaborador</th>
                      <th className="p-6 text-center">Marcaciones</th>
                      <th className="p-6 text-center">Horas Totales</th>
                      <th className="p-6 text-center">Rec. 25%</th>
                      <th className="p-6 text-center">Supl. 50%</th>
                      <th className="p-6 text-center">Extr. 100%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {agrupadoPorArea[area].map((j: any) => {
                      const fEntra = extraerLiteral(j.entrada, 'fecha') as string;
                      const hEntra = extraerLiteral(j.entrada, 'hora') as string;
                      const hSale = j.salida ? (extraerLiteral(j.salida, 'hora') as string) : '...';

                      return (
                        <tr key={j.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-6">
                            <div className="text-[9px] font-black text-indigo-500 uppercase font-mono">ID: {j.empleados?.user_id_reloj}</div>
                            <div className="font-black text-slate-800 uppercase text-xs">{j.empleados?.nombre}</div>
                            <div className="text-[8px] text-slate-400 font-bold uppercase">{j.empleados?.sitio?.nombre}</div>
                          </td>
                          <td className="p-6 text-center">
                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">
                               {fEntra.split('-').reverse().join(' / ')}
                            </div>
                            <div className="text-[10px] font-black text-slate-700 bg-slate-100 rounded-xl py-2 px-3 inline-block font-mono">
                              {hEntra} - {hSale}
                            </div>
                          </td>
                          <td className="p-6 text-center font-black text-slate-900 text-xs">
                            {j.h_totales.toFixed(2)}h
                          </td>
                          <td className="p-6 text-center font-black text-indigo-600 text-xs">
                            {j.h_25 > 0 ? `${j.h_25.toFixed(2)}h` : '-'}
                          </td>
                          <td className={`p-6 text-center font-black text-xs ${j.excedeLimite ? 'bg-red-50 text-red-600' : 'text-orange-600'}`}>
                            {j.h_50 > 0 ? `${j.h_50.toFixed(2)}h` : '-'}
                          </td>
                          <td className="p-6 text-center font-black text-red-600 text-xs">
                            {j.h_100 > 0 ? `${j.h_100.toFixed(2)}h` : '-'}
                          </td>
                        </tr>
                      );
                    })}
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