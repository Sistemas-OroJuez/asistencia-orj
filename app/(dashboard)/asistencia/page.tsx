'use client';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ControlAsistenciaPage() {
  const supabase = createClientComponentClient();
  const [asistencias, setAsistencias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAsistencias();

    // Suscripción en tiempo real: Actualiza la lista si el script de Python inserta algo
    const channel = supabase
      .channel('asistencia_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'asistencia' }, () => {
        fetchAsistencias();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchAsistencias = async () => {
    // Hacemos un JOIN con la tabla empleados y áreas para traer el nombre real
    const { data, error } = await supabase
      .from('asistencia')
      .select(`
        id,
        user_id,
        timestamp,
        status,
        empresa_id,
        empleados!inner (
          nombre,
          cedula,
          areas (
            nombre
          )
        )
      `)
      .order('timestamp', { ascending: false })
      .limit(50);

    if (error) console.error("Error:", error);
    else setAsistencias(data || []);
    setLoading(false);
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">CONTROL DE ASISTENCIA</h1>
          <p className="text-slate-500 text-sm">Marcaciones sincronizadas desde el reloj ZK</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div> EN VIVO
        </div>
      </header>

      {loading ? (
        <div className="text-center py-20 text-slate-400">Cargando marcaciones...</div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-4 text-xs font-extrabold text-slate-400 uppercase">Empleado</th>
                  <th className="p-4 text-xs font-extrabold text-slate-400 uppercase">Área</th>
                  <th className="p-4 text-xs font-extrabold text-slate-400 uppercase">Fecha y Hora</th>
                  <th className="p-4 text-xs font-extrabold text-slate-400 uppercase text-center">ID Reloj</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {asistencias.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{item.empleados?.nombre || 'Desconocido'}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{item.empleados?.cedula}</p>
                    </td>
                    <td className="p-4">
                      <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md text-xs font-medium">
                        {item.empleados?.areas?.nombre || 'Sin Área'}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-slate-700 font-medium">
                        {item.timestamp ? format(new Date(item.timestamp), "dd MMM, yyyy - HH:mm", { locale: es }) : '---'}
                      </p>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded font-mono">
                        #{item.user_id}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {asistencias.length === 0 && (
            <div className="p-10 text-center text-slate-400 italic text-sm">
              No hay marcaciones registradas hoy.
            </div>
          )}
        </div>
      )}
    </div>
  );
}