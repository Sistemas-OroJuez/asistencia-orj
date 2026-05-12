'use client';
import { useState, useEffect } from 'react';
// Importación corregida apuntando a la carpeta lib que está 2 niveles arriba
import { supabase } from '../../lib/supabase';

export default function AsistenciaPage() {
  const [asistencias, setAsistencias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar datos desde Supabase
  useEffect(() => {
    const fetchAsistencia = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('asistencia') // Asegúrate que tu tabla se llame así
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(50);

        if (error) throw error;
        setAsistencias(data || []);
      } catch (error: any) {
        console.error('Error cargando asistencias:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAsistencia();
  }, []);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Control de Asistencia</h1>
          <p className="text-slate-500">Últimos marcajes sincronizados desde el reloj</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          Actualizar
        </button>
      </div>

      {loading ? (
        <p>Cargando registros...</p>
      ) : (
        <div className="bg-white shadow-md rounded-xl overflow-hidden border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 font-semibold text-slate-700">Usuario ID</th>
                <th className="p-4 font-semibold text-slate-700">Fecha y Hora</th>
                <th className="p-4 font-semibold text-slate-700">Estado</th>
                <th className="p-4 font-semibold text-slate-700">Tipo (Punch)</th>
              </tr>
            </thead>
            <tbody>
              {asistencias.length > 0 ? (
                asistencias.map((reg) => (
                  <tr key={reg.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="p-4 text-slate-600 font-medium">{reg.user_id}</td>
                    <td className="p-4 text-slate-600">
                      {new Date(reg.timestamp).toLocaleString('es-EC')}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${reg.status === 1 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {reg.status === 1 ? 'Verificado' : 'Normal'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`font-semibold ${reg.punch === 0 ? 'text-indigo-600' : 'text-orange-600'}`}>
                        {reg.punch === 0 ? 'ENTRADA' : 'SALIDA'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-slate-400">
                    No hay registros de asistencia encontrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}