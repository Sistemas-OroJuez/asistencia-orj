'use client';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function EmpleadosPage() {
  const supabase = createClientComponentClient();
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [turnos, setTurnos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para la edición
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [formEdit, setFormEdit] = useState({ nombre: '', user_id_reloj: '' });

  useEffect(() => {
    fetchDatos();
  }, []);

  const fetchDatos = async () => {
    setLoading(true);
    const [resEmp, resTur] = await Promise.all([
      supabase.from('empleados').select('*, turnos(nombre)').order('nombre'),
      supabase.from('turnos').select('*').order('nombre')
    ]);
    setEmpleados(resEmp.data || []);
    setTurnos(resTur.data || []);
    setLoading(false);
  };

  const asignarTurno = async (empleadoId: string, turnoId: string) => {
    const { error } = await supabase
      .from('empleados')
      .update({ turno_id: turnoId === "" ? null : turnoId })
      .eq('id', empleadoId);
    if (!error) fetchDatos();
  };

  const iniciarEdicion = (emp: any) => {
    setEditandoId(emp.id);
    setFormEdit({ nombre: emp.nombre, user_id_reloj: emp.user_id_reloj });
  };

  const guardarCambios = async (id: string) => {
    const { error } = await supabase
      .from('empleados')
      .update(formEdit)
      .eq('id', id);

    if (error) {
      alert("Error al actualizar: " + error.message);
    } else {
      setEditandoId(null);
      fetchDatos();
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">👤 Gestión de Personal</h1>
          <p className="text-slate-500 text-sm">Edita datos básicos y vincula horarios.</p>
        </div>
      </header>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Empleado</th>
              <th className="p-4 text-[10px] font-black text-slate-400 uppercase text-center">ID Reloj</th>
              <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Horario Asignado</th>
              <th className="p-4 text-[10px] font-black text-slate-400 uppercase text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {empleados.map((e) => (
              <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="p-4">
                  {editandoId === e.id ? (
                    <input 
                      className="p-2 border rounded-lg w-full font-bold text-sm"
                      value={formEdit.nombre}
                      onChange={(ev) => setFormEdit({...formEdit, nombre: ev.target.value.toUpperCase()})}
                    />
                  ) : (
                    <span className="font-bold text-slate-700 uppercase text-sm">{e.nombre}</span>
                  )}
                </td>
                <td className="p-4 text-center">
                  {editandoId === e.id ? (
                    <input 
                      className="p-2 border rounded-lg w-20 text-center font-mono font-bold"
                      value={formEdit.user_id_reloj}
                      onChange={(ev) => setFormEdit({...formEdit, user_id_reloj: ev.target.value})}
                    />
                  ) : (
                    <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">{e.user_id_reloj}</span>
                  )}
                </td>
                <td className="p-4">
                  <select 
                    className="w-full p-2 bg-slate-100 border-none rounded-xl text-xs font-bold text-slate-600"
                    value={e.turno_id || ""}
                    onChange={(opt) => asignarTurno(e.id, opt.target.value)}
                  >
                    <option value="">Sin Turno</option>
                    {turnos.map((t) => (
                      <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                  </select>
                </td>
                <td className="p-4 text-right">
                  {editandoId === e.id ? (
                    <button 
                      onClick={() => guardarCambios(e.id)}
                      className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-[10px] font-black hover:bg-emerald-600 transition-all"
                    >
                      GUARDAR
                    </button>
                  ) : (
                    <button 
                      onClick={() => iniciarEdicion(e)}
                      className="text-slate-400 hover:text-indigo-600 p-2 transition-colors"
                      title="Editar empleado"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}