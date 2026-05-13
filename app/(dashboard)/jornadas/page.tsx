'use client';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format, formatDistanceStrict } from 'date-fns';
import { es } from 'date-fns/locale';

export default function JornadasPage() {
  const supabase = createClientComponentClient();
  const [jornadas, setJornadas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJornadas();
    
    // Suscripción en tiempo real
    const channel = supabase
      .channel('jornadas_live')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'jornadas_procesadas' 
      }, () => {
        fetchJornadas();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchJornadas = async () => {
    setLoading(true);
    try {
      // CONSULTA ACTUALIZADA: 
      // Pedimos los datos del empleado y sus relaciones de forma independiente 
      // para evitar que un fallo en 'areas' bloquee toda la fila.
      const { data, error } = await supabase
        .from('jornadas_procesadas')
        .select(`
          *,
          empleados (
            id,
            nombre,
            areas (
              nombre
            ),
            sitios (
              nombre
            )
          )
        `)
        .order('entrada', { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error de Supabase:", error.message);
      } else {
        console.log("Datos recibidos:", data);
        setJornadas(data || []);
      }
    } catch (err) {
      console.error("Error inesperado en el cliente:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight text-center md:text-left uppercase">
          ⏱️ Jornadas y Turnos
        </h1>
        <p className="text-slate-500 text-sm text-center md:text-left">
          Monitoreo de entradas y salidas procesadas por el sistema.
        </p>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {jornadas.map((j) => (
            <div key={j.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Información del Empleado */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {/* Punto de estado: parpadea si la jornada está abierta o no tiene salida */}
                    <span className={`w-3 h-3 rounded-full ${!j.salida ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                    <h3 className="font-bold text-slate-800 text-lg uppercase">
                      {j.empleados?.nombre || 'Empleado Desconocido'}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                    {/* Renderizado robusto de Sitio y Área */}
                    {j.empleados?.sitios?.nombre || 'Sin Sitio'} • {j.empleados?.areas?.nombre || 'Sin Área'}
                  </p>
                </div>

                {/* Tiempos de Entrada y Salida */}
                <div className="grid grid-cols-2 gap-4 md:gap-12 flex-[2]">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Entrada</p>
                    <p className="text-sm font-bold text-slate-700">
                      {j.entrada ? format(new Date(j.entrada), "iii d MMM, HH:mm", { locale: es }) : '---'}
                    </p>
                    {j.minutos_atraso > 0 && (
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                        +{Math.round(j.minutos_atraso)} min atraso
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Salida</p>
                    {j.salida ? (
                      <p className="text-sm font-bold text-slate-700">
                        {format(new Date(j.salida), "iii d MMM, HH:mm", { locale: es })}
                      </p>
                    ) : (
                      <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-2 py-1 rounded border border-emerald-100 uppercase tracking-tighter">En Turno</span>
                    )}
                  </div>
                </div>

                {/* Cálculo de Horas */}
                <div className="bg-slate-50 p-4 rounded-xl text-center min-w-[140px] border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Tiempo Total</p>
                  <p className="text-lg font-black text-indigo-600">
                    {j.entrada && j.salida 
                      ? formatDistanceStrict(new Date(j.entrada), new Date(j.salida), { locale: es })
                      : j.entrada ? 'Contando...' : '---'
                    }
                  </p>
                </div>

              </div>
            </div>
          ))}

          {jornadas.length === 0 && (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-20 text-center">
              <div className="text-4xl mb-4">💤</div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">
                No hay registros para mostrar
              </p>
              <p className="text-slate-400 text-xs mt-2">
                Verifica los permisos RLS y las relaciones en Supabase.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}