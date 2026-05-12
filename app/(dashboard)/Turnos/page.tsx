'use client';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function TurnosPage() {
  const supabase = createClientComponentClient();
  const [turnos, setTurnos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    nombre: '',
    entrada_programada: '08:00',
    salida_programada: '17:00',
    tolerancia_entrada: 15
  });

  useEffect(() => {
    fetchTurnos();
  }, []);

  const fetchTurnos = async () => {
    const { data, error } = await supabase.from('turnos').select('*').order('created_at', { ascending: false });
    if (error) console.error(error);
    else setTurnos(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('turnos').insert([form]);
    if (error) alert("Error al crear turno");
    else {
      setForm({ nombre: '', entrada_programada: '08:00', salida_programada: '17:00', tolerancia_entrada: 15 });
      fetchTurnos();
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-black text-slate-900 mb-6 uppercase tracking-tight">⚙️ Configuración de Turnos</h1>

      {/* Formulario de Creación */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
        <h2 className="text-sm font-bold text-slate-400 uppercase mb-4 tracking-widest">Nuevo Horario</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Nombre del Turno</label>
            <input 
              type="text" 
              placeholder="Ej: Administrativo"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              value={form.nombre}
              onChange={(e) => setForm({...form, nombre: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Entrada</label>
            <input 
              type="time" 
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              value={form.entrada_programada}
              onChange={(e) => setForm({...form, entrada_programada: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Salida</label>
            <input 
              type="time" 
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              value={form.salida_programada}
              onChange={(e) => setForm({...form, salida_programada: e.target.value})}
              required
            />
          </div>
          <button type="submit" className="bg-indigo-600 text-white font-bold p-3 rounded-xl hover:bg-indigo-700 transition-all active:scale-95 text-sm">
            GUARDAR TURNO
          </button>
        </form>
      </div>

      {/* Lista de Turnos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {turnos.map((t) => (
          <div key={t.id} className="bg-white border border-slate-200 p-5 rounded-2xl flex justify-between items-center shadow-sm hover:border-indigo-200 transition-colors">
            <div>
              <h3 className="font-black text-slate-800 uppercase leading-none mb-1">{t.nombre}</h3>
              <p className="text-xs text-slate-400 font-medium">Tolerancia: {t.tolerancia_entrada} min</p>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                {t.entrada_programada.substring(0,5)} - {t.salida_programada.substring(0,5)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}