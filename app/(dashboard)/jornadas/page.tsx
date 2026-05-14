'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format, formatDistanceStrict, startOfMonth, endOfMonth } from 'date-fns';
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
  const [empresaId] = useState('dcb8a81e-338e-4da4-a278-fb4a772c9c72'); // OroJuez SA

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

  const fetchJornadas = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('jornadas_procesadas')
        .select(`
          *,
          empleados!inner (
            id,
            nombre,
            telefono,
            area:areas ( nombre ),
            sitio:sitios ( nombre ),
            empresa_id
          )
        `)
        .eq('empleados.empresa_id', empresaId);

      // Lógica de rango de fechas
      if (fechaInicio && fechaFin) {
        query = query.gte('entrada', `${fechaInicio}T00:00:00`)
                     .lte('entrada', `${fechaFin}T23:59:59`);
      } else {
        const dateRef = new Date(mesSeleccionado + "-01T12:00:00");
        const inicio = format(startOfMonth(dateRef), 'yyyy-MM-dd');
        const fin = format(endOfMonth(dateRef), 'yyyy-MM-dd');
        query = query.gte('entrada', `${inicio}T00:00:00`)
                     .lte('entrada', `${fin}T23:59:59`);
      }

      const { data, error } = await query.order('entrada', { ascending: false });
      if (error) throw error;
      setJornadas(data || []);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- AGRUPACIÓN POR ÁREA ---
  const agrupadoPorArea = jornadas.reduce((acc: any, j: any) => {
    const areaNombre = j.empleados?.area?.nombre || 'SIN ÁREA';
    if (!acc[areaNombre]) acc[areaNombre] = [];
    acc[areaNombre].push(j);
    return acc;
  }, {});

  // --- ACCIONES ---
  const exportToExcel = () => alert("Generando Excel con " + jornadas.length + " registros...");
  const exportToPDF = () => window.print();
  
  const sendWhatsApp = (empleado: any, jornada: any) => {
    if (!empleado?.telefono) return alert("El empleado no tiene teléfono registrado");
    const mensaje = `Hola ${empleado.nombre}, tu registro de hoy: Entrada ${formatFechaEcuador(jornada.entrada)}. Estado: ${jornada.estado.toUpperCase()}`;
    window.open(`https://wa.me/${empleado.telefono}?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  const formatFechaEcuador = (fechaIso: string) => {
    if (!fechaIso) return '---';
    const zonedDate = toZonedTime(new Date(fechaIso), timeZone);
    return format(zonedDate, "HH:mm", { locale: es });
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-slate-50 min-h-screen">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">⏱️ Control de Jornadas</h1>
          <p className="text-slate-500 text-sm">Gestión de tiempos y asistencia por departamento.</p>
        </div>
        
        <div className="flex gap-2">
          <button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition">EXCEL</button>
          <button onClick={exportToPDF} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition">PDF</button>
        </div>
      </header>

      {/* --- PANEL DE FILTROS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Mes Seleccionado</label>
          <input type="month" value={mesSeleccionado} onChange={(e) => {setMesSeleccionado(e.target.value); setFechaInicio(''); setFechaFin('');}} className="w-full border-slate-200 rounded-xl text-sm" />
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Rango Personalizado (Desde)</label>
          <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="w-full border-slate-200 rounded-xl text-sm" />
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Hasta</label>
          <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="w-full border-slate-200 rounded-xl text-sm" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
      ) : (
        <div className="space-y-10">
          {Object.keys(agrupadoPorArea).map((area) => (
            <section key={area}>
              <div className="flex items-center justify-between border-b-2 border-slate-200 pb-2 mb-4">
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Área: {area}</h2>
                <span className="bg-slate-200 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">
                  {agrupadoPorArea[area].length} Registros
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {agrupadoPorArea[area].map((j: any) => (
                  <div key={j.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:border-indigo-300 transition-all">
                    <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-800 uppercase">{j.empleados?.nombre}</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{j.empleados?.sitio?.nombre}</p>
                      </div>

                      <div className="flex-[2] grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Entrada</p>
                          <p className="text-sm font-black text-slate-700">{formatFechaEcuador(j.entrada)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Salida</p>
                          <p className="text-sm font-black text-slate-700">{j.salida ? formatFechaEcuador(j.salida) : '---'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Total</p>
                          <p className="text-sm font-black text-indigo-600">
                            {j.salida ? formatDistanceStrict(new Date(j.entrada), new Date(j.salida), { locale: es }) : 'En turno'}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={() => sendWhatsApp(j.empleados, j)}
                          className="bg-emerald-100 text-emerald-700 p-2 rounded-lg hover:bg-emerald-200 transition"
                          title="Enviar a WhatsApp"
                        >
                          <span className="text-lg">💬</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}