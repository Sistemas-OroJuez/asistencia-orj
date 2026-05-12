'use client';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function RegistroEmpleados() {
  const supabase = createClientComponentClient();
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [sitios, setSitios] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    nombre: '',
    cedula: '',
    user_id_reloj: '', // Coincide con tu Schema
    empresa_id: '',
    area_id: ''
  });

  useEffect(() => { fetchInitialData(); }, []);

  const fetchInitialData = async () => {
    const { data } = await supabase.from('empresas').select('*');
    setEmpresas(data || []);
  };

  const handleEmpresaChange = async (id: string) => {
    setFormData({...formData, empresa_id: id, area_id: ''});
    // Buscamos sitios para que el usuario elija, aunque no se guarden en la tabla empleados directamente
    const { data } = await supabase.from('sitios').select('*').eq('empresa_id', id);
    setSitios(data || []);
  };

  const handleSitioChange = async (id: string) => {
    const { data } = await supabase.from('areas').select('*').eq('sitio_id', id);
    setAreas(data || []);
  };

  const guardarEmpleado = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Solo enviamos los campos que existen en tu tabla
    const { error } = await supabase.from('empleados').insert([
      { 
        nombre: formData.nombre,
        cedula: formData.cedula,
        user_id_reloj: formData.user_id_reloj,
        empresa_id: formData.empresa_id,
        area_id: formData.area_id,
        activo: true
      }
    ]);

    if (error) {
      alert("Error: " + error.message);
    } else {
      alert("Empleado vinculado exitosamente");
      setFormData({ nombre: '', cedula: '', user_id_reloj: '', empresa_id: '', area_id: '' });
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200">
        <h1 className="text-xl font-black mb-6">👤 ENROLAMIENTO</h1>
        
        <form onSubmit={guardarEmpleado} className="space-y-4">
          <input 
            type="text" placeholder="ID en el Reloj (User ID)" required
            className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl outline-none focus:border-indigo-500"
            value={formData.user_id_reloj}
            onChange={e => setFormData({...formData, user_id_reloj: e.target.value})}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              type="text" placeholder="Nombre Completo" required
              className="p-3 border rounded-xl"
              value={formData.nombre}
              onChange={e => setFormData({...formData, nombre: e.target.value})}
            />
            <input 
              type="text" placeholder="Número de Cédula" required
              className="p-3 border rounded-xl"
              value={formData.cedula}
              onChange={e => setFormData({...formData, cedula: e.target.value})}
            />
          </div>

          <div className="space-y-3 pt-4 border-t">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Ubicación Laboral</label>
            <select 
              className="w-full p-3 border rounded-xl bg-white" required
              onChange={e => handleEmpresaChange(e.target.value)}
              value={formData.empresa_id}
            >
              <option value="">Seleccionar Empresa...</option>
              {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>

            <select 
              className="w-full p-3 border rounded-xl bg-white" 
              onChange={e => handleSitioChange(e.target.value)}
              disabled={!formData.empresa_id}
            >
              <option value="">Seleccionar Sitio/Planta (Filtro)...</option>
              {sitios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>

            <select 
              className="w-full p-3 border rounded-xl bg-white" required
              disabled={areas.length === 0}
              value={formData.area_id}
              onChange={e => setFormData({...formData, area_id: e.target.value})}
            >
              <option value="">Seleccionar Área Final...</option>
              {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </div>

          <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all">
            GUARDAR EMPLEADO
          </button>
        </form>
      </div>
    </div>
  );
}