'use client';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function EmpleadosPage() {
  const supabase = createClientComponentClient();
  const [empleados, setEmpleados] = useState<any[]>([]);
  const [turnos, setTurnos] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [sitios, setSitios] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Estados para edición y creación
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState({
    nombre: '',
    user_id_reloj: '',
    empresa_id: '',
    sitio_id: '',
    area_id: '',
    turno_id: ''
  });

  useEffect(() => {
    fetchDatos();
  }, []);

  const fetchDatos = async () => {
    setLoading(true);
    const [resEmp, resTur, resCia, resSit, resAre] = await Promise.all([
      supabase.from('empleados').select('*, turnos(nombre)').order('nombre'),
      supabase.from('turnos').select('*').order('nombre'),
      supabase.from('empresas').select('*').order('nombre'),
      supabase.from('sitios').select('*').order('nombre'),
      supabase.from('areas').select('*').order('nombre')
    ]);

    setEmpleados(resEmp.data || []);
    setTurnos(resTur.data || []);
    setEmpresas(resCia.data || []);
    setSitios(resSit.data || []);
    setAreas(resAre.data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('empleados').insert([form]);

    if (error) {
      alert("Error al crear empleado: " + error.message);
    } else {
      setForm({ nombre: '', user_id_reloj: '', empresa_id: '', sitio_id: '', area_id: '', turno_id: '' });
      setShowForm(false);
      fetchDatos();
    }
  };

  const guardarEdicion = async (id: string, data: any) => {
    const { error } = await supabase.from('empleados').update(data).eq('id', id);
    if (error) alert("Error: " + error.message);
    else {
      setEditandoId(null);
      fetchDatos();
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">👤 Gestión de Personal</h1>
          <p className="text-slate-500 text-sm">Registro y vinculación jerárquica de empleados.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          {showForm ? 'Cerrar Formulario' : '+ Nuevo Empleado'}
        </button>
      </header>

      {/* Formulario de Creación */}
      {showForm && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="text-xs font-black text-indigo-600 uppercase mb-6 tracking-widest">Registrar Nuevo Colaborador</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Nombre Completo</label>
              <input 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold uppercase"
                value={form.nombre}
                onChange={(e) => setForm({...form, nombre: e.target.value.toUpperCase()})}
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">ID en Reloj Biométrico</label>
              <input 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold"
                value={form.user_id_reloj}
                onChange={(e) => setForm({...form, user_id_reloj: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Horario (Turno)</label>
              <select 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold"
                value={form.turno_id}
                onChange={(e) => setForm({...form, turno_id: e.target.value})}
              >
                <option value="">Seleccionar Turno</option>
                {turnos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Empresa</label>
              <select 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold"
                value={form.empresa_id}
                onChange={(e) => setForm({...form, empresa_id: e.target.value})}
                required
              >
                <option value="">Seleccionar Empresa</option>
                {empresas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Sitio / Sucursal</label>
              <select 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold"
                value={form.sitio_id}
                onChange={(e) => setForm({...form, sitio_id: e.target.value})}
                required
              >
                <option value="">Seleccionar Sitio</option>
                {sitios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Área / Departamento</label>
              <select 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold"
                value={form.area_id}
                onChange={(e) => setForm({...form, area_id: e.target.value})}
                required
              >
                <option value="">Seleccionar Área</option>
                {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
              </select>
            </div>
            <div className="md:col-span-3">
              <button type="submit" className="w-full bg-slate-900 text-white p-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all">
                Finalizar Registro de Empleado
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla de Empleados */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Nombre</th>
              <th className="p-4 text-[10px] font-black text-slate-400 uppercase">ID Reloj</th>
              <th className="p-4 text-[10px] font-black text-slate-400 uppercase">Horario</th>
              <th className="p-4 text-[10px] font-black text-slate-400 uppercase text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {empleados.map((e) => (
              <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="p-4 font-bold text-slate-700 uppercase text-xs">{e.nombre}</td>
                <td className="p-4 font-mono font-bold text-indigo-600 text-xs">{e.user_id_reloj}</td>
                <td className="p-4 text-xs font-bold text-slate-500 uppercase">{e.turnos?.nombre || 'No asignado'}</td>
                <td className="p-4 text-right">
                  <button className="text-slate-300 hover:text-indigo-600 transition-colors">
                     {/* Aquí podrías añadir el modal de edición si lo deseas */}
                     ⚙️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}