'use client';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function TurnosPage() {
  const supabase = createClientComponentClient();
  const [turnos, setTurnos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  
  const ID_EMPRESA_DEFAULT = "dcb8a81e-338e-4da4-a278-fb4a772c9c72";

  const [form, setForm] = useState({
    nombre: '',
    entrada_programada: '08:00',
    salida_programada: '17:00',
    tolerancia_entrada: 15,
    es_nocturno: false,
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

    if (error) console.error("Error al obtener turnos:", error);
    else setTurnos(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (editandoId) {
      // MODO EDICIÓN
      const { error } = await supabase
        .from('turnos')
        .update(form)
        .eq('id', editandoId);

      if (error) {
        alert(`Error al actualizar: ${error.message}`);
      } else {
        alert("Turno actualizado correctamente");
        cancelarEdicion();
        fetchTurnos();
      }
    } else {
      // MODO CREACIÓN
      const { error } = await supabase
        .from('turnos')
        .insert([form]);

      if (error) {
        alert(`No se pudo guardar: ${error.message}`);
      } else {
        resetForm();
        fetchTurnos();
        alert("Turno guardado exitosamente");
      }
    }
    setIsSubmitting(false);
  };

  const prepararEdicion = (t: any) => {
    setEditandoId(t.id);
    setForm({
      nombre: t.nombre,
      entrada_programada: t.entrada_programada.slice(0, 5),
      salida_programada: t.salida_programada.slice(0, 5),
      tolerancia_entrada: t.tolerancia_entrada,
      es_nocturno: t.es_nocturno,
      empresa_id: t.empresa_id || ID_EMPRESA_DEFAULT
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    resetForm();
  };

  const resetForm = () => {
    setForm({ 
      nombre: '', 
      entrada_programada: '08:00', 
      salida_programada: '17:00', 
      tolerancia_entrada: 15,
      es_nocturno: false,
      empresa_id: ID_EMPRESA_DEFAULT
    });
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto text-slate-900">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">
            ⚙️ Gestión de Horarios (Turnos)
          </h1>
          <p className="text-slate-500 text-sm">
            Define las horas oficiales de entrada y salida para calcular atrasos.
          </p>
        </div>
        {editandoId && (
          <button 
            onClick={cancelarEdicion}
            className="bg-slate-200 text-slate-600 px-4 py-2 rounded-xl font-bold text-xs uppercase hover:bg-slate-300 transition-all"
          >
            Cancelar Edición
          </button>
        )}
      </header>

      {/* Formulario */}
      <div className={`bg-white p-6 rounded-3xl shadow-sm border transition-all ${editandoId ? 'border-orange-400 ring-4 ring-orange-50' : 'border-slate-200'} mb-8`}>
        <h2 className="text-xs font-black text-indigo-600 uppercase mb-6 tracking-widest">
          {editandoId ? 'Editando Horario Seleccionado' : 'Crear Nuevo Horario'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div className="md:col-span-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Nombre del Turno</label>
              <input 
                type="text" 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold uppercase"
                value={form.nombre}
                onChange={(e) => setForm({...form, nombre: e.target.value.toUpperCase()})}
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
              editandoId 
                ? 'bg-orange-500 text-white hover:bg-orange-600' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'
            }`}
          >
            {isSubmitting ? 'Procesando...' : editandoId ? 'Actualizar Horario' : 'Guardar Nuevo Horario'}
          </button>
        </form>
      </div>

      {/* Lista */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {!loading && turnos.map((t) => (
          <div key={t.id} className="bg-white border border-slate-200 p-6 rounded-3xl flex justify-between items-center hover:border-indigo-300 transition-all group shadow-sm relative overflow-hidden">
            {t.es_nocturno && (
              <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[8px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest">
                🌙 Nocturno
              </div>
            )}
            <div className="flex gap-4 items-center">
              <button 
                onClick={() => prepararEdicion(t)}
                className="bg-slate-100 p-3 rounded-2xl hover:bg-orange-100 hover:text-orange-600 transition-all text-slate-400"
                title="Editar turno"
              >
                ✏️
              </button>
              <div>
                <h3 className="font-black text-slate-800 uppercase text-sm">{t.nombre}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                  Tolerancia: <span className="text-slate-600">{t.tolerancia_entrada} min</span>
                </p>
              </div>
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
      </div>
    </div>
  );
}