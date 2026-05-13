'use client';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function MonitorAsistenciaPage() {
  const supabase = createClientComponentClient();
  const [registros, setRegistros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAsistencia();
    
    // Suscripción Realtime para detectar cualquier cambio en la tabla asistencia
    const channel = supabase
      .channel('asistencia_realtime_v3')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'asistencia' }, 
        () => {
          console.log("Cambio detectado en el reloj, actualizando...");
          fetchAsistencia();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAsistencia = async () => {
    try {
      setLoading(true);
      
      // 1. Traemos los timbrajes brutos (asistencia)
      const { data: asistenciaData, error: astError } = await supabase
        .from('asistencia')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);

      if (astError) throw astError;

      // 2. Traemos la lista de empleados para el cruce de nombres
      const { data: empleadosData, error: empError } = await supabase
        .from('empleados')
        .select(`
          nombre, 
          user_id_reloj, 
          empresas (nombre), 
          sitios (nombre)
        `);

      if (empError) console.error("Error cargando empleados:", empError);

      // 3. Cruzamos la información en el cliente
      const registrosCombinados = (asistenciaData || []).map(reg => {
        // Buscamos al empleado cuyo user_id_reloj coincida con el user_id de la asistencia
        const empleado = empleadosData?.find(
          e => String(e.user_id_reloj).trim() === String(reg.user_id).trim()
        );
        
        return {
          ...reg,
          empleados: empleado // Agregamos la info del empleado al objeto
        };
      });

      setRegistros(registrosCombinados);
    } catch (error) {
      console.error("Error crítico en el monitor:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
            ⏱️ Monitor de Asistencia
          </h1>
          <p className="text-slate-500 text-sm">
            Registros en tiempo real sincronizados con el biométrico.
          </p>
        </div>
        <button 
          onClick={fetchAsistencia}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-100"
        >
          🔄 ACTUALIZAR
        </button>
      </header>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Colaborador</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Ubicación</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Fecha y Hora</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase text-center">Tipo</th>
              </tr>
            </thead>
            <tbody>
              {loading && registros.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-slate-400 font-bold animate-pulse">
                    Sincronizando con el reloj...
                  </td>
                </tr>
              ) : registros.map((reg) => (
                <tr key={reg.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-800 uppercase text-xs">
                      {reg.empleados?.nombre || (
                        <span className="text-red-500 font-black">ID RECONOCIDO: {reg.user_id}</span>
                      )}
                    </div>
                    <div className="text-[10px] text-indigo-500 font-bold">Reloj ID: {reg.user_id}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-[10px] font-bold text-slate-600 uppercase">
                      {reg.empleados?.empresas?.nombre || '---'}
                    </div>
                    <div className="text-[9px] text-slate-400 uppercase">
                      {reg.empleados?.sitios?.nombre || '---'}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-xs font-bold text-slate-700">
                      {format(parseISO(reg.timestamp), "eeee, d 'de' MMMM", { locale: es })}
                    </div>
                    <div className="text-[11px] font-black text-indigo-600">
                      {format(parseISO(reg.timestamp), "HH:mm:ss")}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase ${
                      reg.status === 0 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {reg.status === 0 ? 'Entrada' : 'Salida'}
                    </span>
                  </td>
                </tr>
              ))}
              {!loading && registros.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-slate-400 font-bold">
                    No se encontraron registros recientes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}