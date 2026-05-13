'use client';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function MonitorAsistenciaPage() {
  const supabase = createClientComponentClient();
  const [registros, setRegistros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAsistencia();
    
    // Suscripción Realtime corregida
    const channel = supabase
      .channel('asistencia_realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'asistencia' }, 
        () => {
          console.log("Nuevo cambio detectado, recargando...");
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
      // Traemos los timbrajes. Quitamos el !inner para evitar que desaparezcan si hay error de relación
      const { data, error } = await supabase
        .from('asistencia')
        .select(`
          id,
          timestamp,
          status,
          user_id,
          empleados (
            nombre,
            empresas (nombre),
            sitios (nombre)
          )
        `)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) throw error;
      setRegistros(data || []);
    } catch (error) {
      console.error("Error en fetchAsistencia:", error);
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
            Registros entrantes en tiempo real desde el biométrico.
          </p>
        </div>
        <button 
          onClick={fetchAsistencia}
          className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold transition-all"
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
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Empresa / Sitio</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Fecha y Hora</th>
                <th className="p-4 text-[10px] font-black text-slate-400 uppercase text-center">Tipo</th>
              </tr>
            </thead>
            <tbody>
              {loading && registros.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-slate-400 font-bold animate-pulse">
                    Cargando timbradas...
                  </td>
                </tr>
              ) : registros.map((reg) => (
                <tr key={reg.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-800 uppercase text-xs">
                      {reg.empleados?.nombre || (
                        <span className="text-red-400">DESCONOCIDO (ID: {reg.user_id})</span>
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
                      {format(new Date(reg.timestamp), "eeee, d 'de' MMMM", { locale: es })}
                    </div>
                    <div className="text-[11px] font-black text-indigo-600">
                      {format(new Date(reg.timestamp), "HH:mm:ss")}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase ${
                      reg.status === 0 || reg.status === 1 || reg.status === 4 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {/* Dependiendo de tu reloj, 0 suele ser entrada. Ajustamos para mostrar algo siempre */}
                      {reg.status === 0 ? 'Entrada' : reg.status === 1 ? 'Salida' : 'Marcación'}
                    </span>
                  </td>
                </tr>
              ))}
              {!loading && registros.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-slate-400 font-bold">
                    No hay registros hoy.
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