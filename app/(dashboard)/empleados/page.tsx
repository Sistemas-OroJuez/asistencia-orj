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
    codigo_reloj: '',
    empresa_id: '',
    sitio_id: '',
    area_id: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    const { data } = await supabase.from('empresas').select('*');
    setEmpresas(data || []);
  };

  const handleEmpresaChange = async (id: string) => {
    setFormData({...formData, empresa_id: id, sitio_id: '', area_id: ''});
    const { data } = await supabase.from('sitios').select('*').eq('empresa_id', id);
    setSitios(data || []);
  };

  const handleSitioChange = async (id: string) => {
    setFormData({...formData, sitio_id: id, area_id: ''});
    const { data } = await supabase.from('areas').select('*').eq('sitio_id', id);
    setAreas(data || []);
  };

  const guardarEmpleado = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('empleados').insert([
      { ...formData, codigo_reloj: parseInt(formData.codigo_reloj) }
    ]);
    if (error) alert("Error: " + error.message);
    else {
      alert("Empleado enrolado con éxito");
      setFormData({ nombre: '', cedula: '', codigo_reloj: '', empresa_id: '', sitio_id: '', area_id: '' });
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200">
        <h1 className="text-xl font-black mb-6 flex items-center gap-2">
          👤 ENROLAMIENTO DE EMPLEADO
        </h1>
        
        <form onSubmit={guardarEmpleado} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">ID Asignado en Reloj</label>
            <input 
              type="number" required placeholder="Ej: 105"
              className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              value={formData.codigo_reloj}
              onChange={e => setFormData({...formData, codigo_reloj: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              type="text" placeholder="Nombre Completo" required
              className="p-3 border rounded-xl"
              value={formData.nombre}
              onChange={e => setFormData({...formData, nombre: e.target.value})}
            />
            <input 
              type="text" placeholder="Cédula" required
              className="p-3 border rounded-xl"
              value={formData.cedula}
              onChange={e => setFormData({...formData, cedula: e.target.value})}
            />
          </div>

          <div className="space-y-3 pt-4 border-t">
            <select 
              className="w-full p-3 border rounded-xl" required
              onChange={e => handleEmpresaChange(e.target.value)}
              value={formData.empresa_id}
            >
              <option value="">Seleccionar Empresa...</option>
              {empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>

            <select 
              className="w-full p-3 border rounded-xl" required
              disabled={!formData.empresa_id}
              onChange={e => handleSitioChange(e.target.value)}
              value={formData.sitio_id}
            >
              <option value="">Seleccionar Sitio/Planta...</option>
              {sitios.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>

            <select 
              className="w-full p-3 border rounded-xl" required
              disabled={!formData.sitio_id}
              value={formData.area_id}
              onChange={e => setFormData({...formData, area_id: e.target.value})}
            >
              <option value="">Seleccionar Área...</option>
              {areas.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </div>

          <button type="submit" className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all">
            VINCULAR EMPLEADO AL SISTEMA
          </button>
        </form>
      </div>
    </div>
  );
}