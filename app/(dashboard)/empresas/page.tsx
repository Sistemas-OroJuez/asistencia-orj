'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para el formulario
  const [nombre, setNombre] = useState('');
  const [ruc, setRuc] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [contacto, setContacto] = useState('');

  // Cargar empresas al iniciar
  useEffect(() => {
    fetchEmpresas();
  }, []);

  const fetchEmpresas = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .order('nombre', { ascending: true });
    
    if (error) console.error('Error:', error);
    else setEmpresas(data || []);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('empresas').insert([
      { nombre, ruc, direccion, telefono, contacto }
    ]);

    if (error) {
      alert("Error al crear empresa: " + error.message);
    } else {
      alert("Empresa creada con éxito");
      // Limpiar formulario y recargar lista
      setNombre(''); setRuc(''); setDireccion(''); setTelefono(''); setContacto('');
      fetchEmpresas();
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-800 mb-8">Gestión de Empresas</h1>

      {/* Formulario de Registro */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-10">
        <h2 className="text-lg font-semibold mb-4 text-slate-700">Registrar Nueva Empresa</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input 
            type="text" placeholder="Nombre de la Empresa" required
            className="p-2 border rounded-lg" value={nombre} onChange={(e) => setNombre(e.target.value)}
          />
          <input 
            type="text" placeholder="RUC" required
            className="p-2 border rounded-lg" value={ruc} onChange={(e) => setRuc(e.target.value)}
          />
          <input 
            type="text" placeholder="Dirección"
            className="p-2 border rounded-lg md:col-span-2" value={direccion} onChange={(e) => setDireccion(e.target.value)}
          />
          <input 
            type="text" placeholder="Teléfono"
            className="p-2 border rounded-lg" value={telefono} onChange={(e) => setTelefono(e.target.value)}
          />
          <input 
            type="text" placeholder="Persona de Contacto"
            className="p-2 border rounded-lg" value={contacto} onChange={(e) => setContacto(e.target.value)}
          />
          <button type="submit" className="md:col-span-2 bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700 transition">
            Guardar Empresa
          </button>
        </form>
      </div>

      {/* Tabla de Resultados */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="p-4 text-slate-700">Nombre</th>
              <th className="p-4 text-slate-700">RUC</th>
              <th className="p-4 text-slate-700">Contacto</th>
              <th className="p-4 text-slate-700">Teléfono</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="p-4 text-center">Cargando...</td></tr>
            ) : empresas.map((emp) => (
              <tr key={emp.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-4 font-medium">{emp.nombre}</td>
                <td className="p-4 text-slate-600">{emp.ruc}</td>
                <td className="p-4 text-slate-600">{emp.contacto}</td>
                <td className="p-4 text-slate-600">{emp.telefono}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}