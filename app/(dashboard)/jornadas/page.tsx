'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format, formatDistanceStrict, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';
import * as XLSX from 'xlsx';

export default function JornadasPage() {
  const supabase = createClientComponentClient();
  const [jornadas, setJornadas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const timeZone = 'America/Guayaquil';

  // --- ESTADOS DE FILTROS ---
  const [mesSeleccionado, setMesSeleccionado] = useState(format(new Date(), 'yyyy-MM'));
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  // ID de OroJuez SA según tu código anterior
  const empresaId = 'dcb8a81e-338e-4da4-a278-fb4a772c9c72'; 

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
      // 1. Primero definimos el rango de fechas para la consulta
      let start, end;
      if (fechaInicio && fechaFin) {
        start = `${fechaInicio}T00:00:00Z`;
        end = `${fechaFin}T23:59:59Z`;
      } else {
        const dateRef = new Date(mesSeleccionado + "-01T12:00:00");
        start = format(startOfMonth(dateRef), "yyyy-MM-dd'T'00:00:00'Z'");
        end = format(endOfMonth(dateRef), "yyyy-MM-dd'T'23:59:59'Z'");
      }

      // 2. Consulta ajustada al esquema SQL proporcionado
      const { data, error } = await supabase
        .from('jornadas_procesadas')
        .select(`
          *,
          empleados:empleado_id (
            nombre,
            cedula,
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

      // 3. Filtrar por empresa en el lado del cliente para mayor seguridad 
      // (o puedes usar .eq('empleados.empresa_id', empresaId) si RLS lo permite)
      const filtrados = (data || []).filter(j => j.empleados?.empresa_id === empresaId);
      
      setJornadas(filtrados);
    } catch (err) {
      console.error("Error cargando jornadas:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- AGRUPACIÓN POR ÁREA ---
  const agrupadoPorArea = jornadas.reduce((acc: any, j: any) => {
    const areaNombre = j.empleados?.area?.nombre || 'OPERACIONES / SIN ÁREA';
    if (!acc[areaNombre]) acc[areaNombre] = [];
    acc[areaNombre].push(j);
    return acc;
  }, {});

  // --- FUNCIONES DE EXPORTACIÓN ---
  const exportToExcel = () => {
    const dataExcel = jornadas.map(j => ({
      Empleado: j.empleados?.nombre,
      ID_Reloj: j.user_id_reloj,
      Area: j.empleados?.area?.nombre,
      Fecha: format(new Date(j.entrada), 'dd/MM/yyyy'),
      Entrada: formatFechaEcuador(j.entrada),
      Salida: j.salida ? formatFechaEcuador(j.salida) : 'N/A',
      Estado: j.estado?.toUpperCase(),
      Mins_Atraso: j.minutos_atraso
    }));

    const ws = XLSX.utils.json_to_sheet(dataExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Jornadas");
    XLSX.writeFile(wb, `Jornadas_OroJuez_${mesSeleccionado}.xlsx`);
  };

  const exportToPDF = () => {
    window.print();
  };
  
  const sendWhatsApp = (j: any) => {
    // Nota: El teléfono debe estar en la tabla empleados según tu lógica anterior
    const tel = j.empleados?.telefono || ""; 
    const nombre = j.empleados?.nombre;
    const entrada = formatFechaEcuador(j.entrada);
    
    if (!tel) {
        alert("El empleado no tiene número registrado.");
        return;
    }

    const mensaje = `*ORO JUEZ SA - Reporte de Jornada*\n\nHola ${nombre},\nTu registro de hoy:\n📍 *Entrada:* ${entrada}\n✅ *Estado:* ${j.estado?.toUpperCase()}\n\nSaludos.`;
    window.open(`https://wa.me/593${tel}?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  const formatFechaEcuador = (fechaIso: string) => {
    if (!fechaIso) return '---';
    const zonedDate = toZonedTime(new Date(fechaIso), timeZone);
    return format(zonedDate, "HH:mm:ss", { locale: es });
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto bg-slate-50 min-h-screen">
      {/* HEADER NO IMPRIMIBLE */}
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">⏱️ Control de Jornadas</h1>
          <p className="text-slate-500 text-sm font-bold uppercase">OroJuez SA - Santo Domingo, Ecuador</p>
        </div>
        
        <div className="flex gap-2">
          <button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-2xl text-[10px] font-black transition-all shadow-sm">EXCEL</button>
          <button onClick={exportToPDF} className="bg-slate-900 hover:bg-black text-white px-6 py-2.5 rounded-2xl text-[10px] font-black transition-all shadow-sm">PDF / IMPRIMIR</button>
        </div>
      </header>

      {/* FILTROS NO IMPRIMIBLES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 mb-8 print:hidden">
        <div>
          <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 ml-1">Vista Mensual</label>
          <input type="month" value={mesSeleccionado} onChange={(e) => {setMesSeleccionado(e.target.value); setFechaInicio(''); setFechaFin('');}} className="w-full border-slate-100 bg-slate-50 rounded-xl text-sm font-bold" />
        </div>
        <div>
          <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 ml-1">Desde</label>
          <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="w-full border-slate-100 bg-slate-50 rounded-xl text-sm font-bold" />
        </div>
        <div>
          <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 ml-1">Hasta</label>
          <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="w-full border-slate-100 bg-slate-50 rounded-xl text-sm font-bold" />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-indigo-600 mb-4"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Procesando Jornadas...</p>
        </div>
      ) : (
        <div className="space-y-10 print:space-y-4">
          {Object.keys(agrupadoPorArea).length === 0 && (
              <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
                  <p className="text-slate-400 font-bold uppercase text-xs">No se encontraron jornadas procesadas en este periodo.</p>
              </div>
          )}

          {Object.keys(agrupadoPorArea).map((area) => (
            <section key={area} className="break-inside-avoid">
              <div className="flex items-center justify-between border-b-2 border-slate-200 pb-3 mb-6">
                <h2 className="text-xl font-black text-slate-800 uppercase tracking-tighter">📦 Departamento: {area}</h2>
                <span className="bg-indigo-100 text-indigo-600 px-4 py-1 rounded-full text-[10px] font-black">
                  {agrupadoPorArea[area].length} COLABORADORES
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {agrupadoPorArea[area].map((j: any) => (
                  <div key={j.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:border-indigo-400 transition-all group">
                    <div className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="text-[9px] font-black text-indigo-500 uppercase mb-1">ID: {j.user_id_reloj}</div>
                        <h3 className="font-black text-slate-800 uppercase text-sm leading-none">{j.empleados?.nombre}</h3>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 italic">{j.empleados?.sitio?.nombre || 'PLANTA PRINCIPAL'}</p>
                      </div>

                      <div className="flex-[2] grid grid-cols-3 gap-4 border-x border-slate-50 px-4">
                        <div className="text-center">
                          <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Entrada</p>
                          <p className="text-xs font-black text-slate-700 bg-slate-50 py-1 rounded-lg">{formatFechaEcuador(j.entrada)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Salida</p>
                          <p className="text-xs font-black text-slate-700 bg-slate-50 py-1 rounded-lg">{j.salida ? formatFechaEcuador(j.salida) : '---'}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Estado</p>
                          <p className={`text-[9px] font-black py-1 rounded-lg uppercase ${j.estado === 'abierta' ? 'text-orange-500 bg-orange-50' : 'text-emerald-500 bg-emerald-50'}`}>
                            {j.estado}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 print:hidden">
                        <button 
                          onClick={() => sendWhatsApp(j)}
                          className="bg-emerald-500 text-white w-10 h-10 flex items-center justify-center rounded-xl hover:bg-emerald-600 transition-all shadow-sm"
                          title="Notificar por WhatsApp"
                        >
                          <span className="text-sm">💬</span>
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
      
      {/* ESTILOS PARA IMPRESIÓN PDF */}
      <style jsx global>{`
        @media print {
          body { background: white !important; }
          .print\:hidden { display: none !important; }
          .rounded-2xl, .rounded-[2rem] { border-radius: 0 !important; }
          .shadow-sm { box-shadow: none !important; }
          section { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}