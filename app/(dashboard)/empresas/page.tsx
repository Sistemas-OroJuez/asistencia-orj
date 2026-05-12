'use client';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function EmpresasFullConfig() {
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState<any>(null);
  const [sitios, setSitios] = useState<any[]>([]);
  const [selectedSitio, setSelectedSitio] = useState<any>(null);
  const [areas, setAreas] = useState<any[]>([]);
  
  // Inicializamos el cliente de Supabase con soporte para sesión
  const supabase = createClientComponentClient();

  // Estados para formularios
  const [showFormEmpresa, setShowFormEmpresa] = useState(false);
  const [newEmp, setNewEmp] = useState({ nombre: '', ruc: '', direccion: '', telefono: '' });
  const [newSitio, setNewSitio] = useState('');
  const [newArea, setNewArea] = useState('');

  useEffect(() => { 
    fetchEmpresas(); 
  }, []);

  const fetchEmpresas = async () => {
    const { data } = await supabase.from('empresas').select('*').order('nombre', { ascending: true });
    setEmpresas(data || []);
  };

  const fetchSitios = async (empresaId: string) => {
    const { data } = await supabase.from('sitios').select('*').eq('empresa_id', empresaId).order('nombre', { ascending: true });
    setSitios(data || []);
    setAreas([]);
    setSelectedSitio(null);
  };

  const fetchAreas = async (sitioId: string) => {
    const { data } = await supabase.from('areas').select('*').eq('sitio_id', sitioId).order('nombre', { ascending: true });
    setAreas(data || []);
  };

  const crearEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('empresas').insert([newEmp]);
    if (error) {
      alert("Error RLS: " + error.message);
    } else {
      setNewEmp({ nombre: '', ruc: '', direccion: '', telefono: '' });
      setShowFormEmpresa(false);
      fetchEmpresas();
    }
  };

  const agregarSitio = async () => {
    if (!newSitio.trim() || !selectedEmpresa) return;
    const { error } = await supabase.from('sitios').insert([{ nombre: newSitio, empresa_id: selectedEmpresa.id }]);
    if (error) alert(error.message);
    else { setNewSitio(''); fetchSitios(selectedEmpresa.id); }
  };

  const agregarArea = async () => {
    if (!newArea.trim() || !selectedSitio) return;
    const { error } = await supabase.from('areas').insert([{ nombre: newArea, sitio_id: selectedSitio.id }]);
    if (error) alert(error.message);
    else { setNewArea(''); fetchAreas(selectedSitio.id); }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-20">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">ESTRUCTURA DE NEGOCIO</h1>
          <p className="text-slate-500 text-sm">Configura empresas, plantas y departamentos.</p>
        </div>
        {!showFormEmpresa && (
          <button 
            onClick={() => setShowFormEmpresa(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-all"
          >
            + NUEVA EMPRESA
          </button>
        )}
      </header>

      {showFormEmpresa && (
        <form onSubmit={crearEmpresa} className="mb-8 bg-white p-6 rounded-2xl border-2 border-indigo-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="md:col-span-2 flex justify-between items-center mb-2">
            <h3 className="font-bold text-indigo-900">Datos de la Empresa</h3>
            <button type="button" onClick={() => setShowFormEmpresa(false)} className="text-slate-400 hover:text-red-500 font-bold">X</button>
          </div>
          <input type="text" placeholder="Nombre Comercial" className="p-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" required value={newEmp.nombre} onChange={e => setNewEmp({...newEmp, nombre: e.target.value})} />
          <input type="text" placeholder="RUC" className="p-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" required value={newEmp.ruc} onChange={e => setNewEmp({...newEmp, ruc: e.target.value})} />
          <input type="text" placeholder="Dirección" className="p-3 border rounded-xl md:col-span-2 outline-none focus:ring-2 focus:ring-indigo-500" value={newEmp.direccion} onChange={e => setNewEmp({...newEmp, direccion: e.target.value})} />
          <button type="submit" className="md:col-span-2 bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-md">GUARDAR EMPRESA</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* COLUMNA 1: LISTA EMPRESAS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-fit">
          <h2 className="font-extrabold text-slate-800 mb-4 uppercase text-[10px] tracking-widest text-indigo-600">1. Empresa</h2>
          <div className="space-y-2">
            {empresas.map(emp => (
              <button 
                key={emp.id} onClick={() => { setSelectedEmpresa(emp); fetchSitios(emp.id); }}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selectedEmpresa?.id === emp.id ? 'border-indigo-600 bg-indigo-50 shadow-sm' : 'border-slate-50 bg-slate-50'}`}
              >
                <p className="font-bold text-slate-800">{emp.nombre}</p>
                <p className="text-[10px] text-slate-500">{emp.ruc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* COLUMNA 2: SITIOS */}
        <div className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-fit transition-opacity ${!selectedEmpresa && 'opacity-40 pointer-events-none'}`}>
          <h2 className="font-extrabold text-slate-800 mb-4 uppercase text-[10px] tracking-widest text-indigo-600">2. Sitio / Planta</h2>
          <div className="flex flex-col gap-2 mb-6">
            <input type="text" placeholder="Ej: Planta Extractora" className="p-3 border-2 border-slate-100 rounded-xl outline-none focus:border-indigo-400" value={newSitio} onChange={e => setNewSitio(e.target.value)} />
            <button onClick={agregarSitio} className="bg-slate-800 text-white font-bold py-3 rounded-xl text-xs">+ AGREGAR SITIO</button>
          </div>
          <div className="space-y-2">
            {sitios.map(s => (
              <button 
                key={s.id} onClick={() => { setSelectedSitio(s); fetchAreas(s.id); }} 
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selectedSitio?.id === s.id ? 'bg-indigo-600 border-indigo-600 text-white font-bold' : 'bg-white border-slate-100 text-slate-700'}`}
              >
                {s.nombre}
              </button>
            ))}
          </div>
        </div>

        {/* COLUMNA 3: ÁREAS */}
        <div className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-fit transition-opacity ${!selectedSitio && 'opacity-40 pointer-events-none'}`}>
           <h2 className="font-extrabold text-slate-800 mb-4 uppercase text-[10px] tracking-widest text-emerald-600">3. Área / Departamento</h2>
           <div className="flex flex-col gap-2 mb-6">
            <input type="text" placeholder="Ej: Mantenimiento" className="p-3 border-2 border-slate-100 rounded-xl outline-none focus:border-emerald-400" value={newArea} onChange={e => setNewArea(e.target.value)} />
            <button onClick={agregarArea} className="bg-emerald-600 text-white font-bold py-3 rounded-xl text-xs">+ AGREGAR ÁREA</button>
          </div>
          <div className="space-y-2">
            {areas.map(a => (
              <div key={a.id} className="p-4 bg-emerald-50 text-emerald-800 border-2 border-emerald-100 rounded-xl font-bold text-sm flex justify-between items-center">
                {a.nombre}
                <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}