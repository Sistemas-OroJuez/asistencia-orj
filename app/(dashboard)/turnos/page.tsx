'use client';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function TurnosPage() {
  const supabase = createClientComponentClient();
  const [turnos, setTurnos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // ID de empresa por defecto (según tus logs anteriores)
  const ID_EMPRESA_DEFAULT = "dcb8a81e-338e-4da4-a278-fb4a772c9c72";

  const [form, setForm] = useState({
    nombre: '',
    entrada_programada: '08:00',
    salida_programada: '17:00',
    tolerancia_entrada: 15,
    es_nocturno: false, // <-- Nuevo campo
    empresa_id: ID_EMPRESA_DEFAULT
  });

  useEffect(() => {
    fetchTurnos();
  }, []);

  const fetchTurnos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('turnos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error al obtener turnos:", error);
    } else {
      setTurnos(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await supabase
      .from('turnos')
      .insert([form]);

    if (error) {
      console.error("Error de Supabase:", error);
      alert(`No se pudo guardar: ${error.message}`);
    } else {
      setForm({ 
        nombre: '', 
        entrada_programada: '08:00', 
        salida_programada: '17:00', 
        tolerancia_entrada: 15,
        es_nocturno: false,
        empresa_id: ID_EMPRESA_DEFAULT
      });
      fetchTurnos();
      alert("Turno guardado exitosamente");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto text-slate-900">
      <header className="mb-8">
        <h1 className="text-2xl font-black uppercase tracking-tight">
          ⚙️ Gestión de Horarios (Turnos)
        </h1>
        <p className="text-slate-500 text-sm">
          Define las horas oficiales de entrada y salida para calcular atrasos.
        </p>
      </header>

      {/* Formulario de Creación */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-8">
        <h2 className="text-xs font-black text-indigo-600 uppercase mb-6 tracking-widest">Crear Nuevo Horario</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div className="md:col-span-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Nombre del Turno</label>
              <input 
                type="text" 
                placeholder="Ej: Nocturno Planta"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold"
                value={form.nombre}
                onChange={(e) => setForm({...form, nombre: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Hora Entrada</label>
              <input 
                type="time" 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold"
                value={form.entrada_programada}
                onChange={(e) => setForm({...form, entrada_programada: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Hora Salida</label>
              <input 
                type="time" 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold"
                value={form.salida_programada}
                onChange={(e) => setForm({...form, salida_programada: e.target.value})}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
               <label className="block text-[10px] font-black text-slate-400 uppercase ml-1">Tipo de Turno</label>
               <div 
                 onClick={() => setForm({...form, es_nocturno: !form.es_nocturno})}
                 className={`flex items-center cursor-pointer p-1 rounded-2xl border transition-all ${form.es_nocturno ? 'bg-indigo-600 border-indigo-600' : 'bg-slate-100 border-slate-200'}`}
               >
                 <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${!form.es_nocturno ? 'bg-white shadow-sm text-slate-900' : 'text-white'}`}>Diurno</div>
                 <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${form.es_nocturno ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>Nocturno</div>
               </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`w-full font-black p-4 rounded-2xl transition-all active:scale-95 text-xs uppercase tracking-widest ${
              isSubmitting ? 'bg-slate-200 text-slate-400' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'
            }`}
          >
            {isSubmitting ? 'Guardando...' : 'Guardar Horario'}
          </button>
        </form>
      </div>

      {/* Lista de Turnos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full py-10 text-center text-slate-400 font-bold uppercase text-xs tracking-widest animate-pulse">
            Cargando horarios...
          </div>
        ) : turnos.map((t) => (
          <div key={t.id} className="bg-white border border-slate-200 p-6 rounded-3xl flex justify-between items-center hover:border-indigo-300 transition-all group shadow-sm relative overflow-hidden">
            {t.es_nocturno && (
              <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[8px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest">
                🌙 Nocturno
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${t.es_nocturno ? 'bg-indigo-400 animate-pulse' : 'bg-orange-400'}`}></div>
                <h3 className="font-black text-slate-800 uppercase text-sm">{t.nombre}</h3>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                Tolerancia: <span className="text-slate-600">{t.tolerancia_entrada} min</span>
              </p>
            </div>
            <div className="text-right">
              <div className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-2xl group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                <span className="text-sm font-black text-indigo-600">
                  {t.entrada_programada?.slice(0, 5)} - {t.salida_programada?.slice(0, 5)}
                </span>
              </div>
            </div>
          </div>
        ))}

        {!loading && turnos.length === 0 && (
          <div className="col-span-full bg-slate-50 border-2 border-dashed border-slate-200 p-12 rounded-3xl text-center">
            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No hay turnos configurados</p>
          </div>
        )}
      </div>
    </div>
  );
}