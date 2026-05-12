'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function EmpresasFullConfig() {
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState<any>(null);
  const [sitios, setSitios] = useState<any[]>([]);
  const [selectedSitio, setSelectedSitio] = useState<any>(null); // ESTADO CORREGIDO
  const [areas, setAreas] = useState<any[]>([]);
  
  // Estados para formularios
  const [showFormEmpresa, setShowFormEmpresa] = useState(false);
  const [newEmp, setNewEmp] = useState({ nombre: '', ruc: '', direccion: '', telefono: '' });
  const [newSitio, setNewSitio] = useState('');
  const [newArea, setNewArea] = useState('');

  useEffect(() => { fetchEmpresas(); }, []);

  const fetchEmpresas = async () => {
    const { data } = await supabase.from('empresas').select('*').order('nombre', { ascending: true });
    setEmpresas(data || []);
  };

  const fetchSitios = async (empresaId: string) => {
    const { data } = await supabase.from('sitios').select('*').eq('empresa_id', empresaId).order('nombre', { ascending: true });
    setSitios(data || []);
    setAreas([]);
    setSelectedSitio(null); // Limpiar sitio al cambiar empresa
  };

  const fetchAreas = async (sitioId: string) => {
    const { data } = await supabase.from('areas').select('*').eq('sitio_id', sitioId).order('nombre', { ascending: true });
    setAreas(data || []);
  };

  const crearEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('empresas').insert([newEmp]);
    if (error) alert(error.message);
    else {
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
      
      {/* SECCIÓN SUPERIOR: AGREGAR EMPRESA */}
      <div className="mb-8">
        {!showFormEmpresa ? (
          <button 
            onClick={() => setShowFormEmpresa(true)}
            className="w-full md:w-auto bg-indigo-600 text-white px-6 py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <span className="text-xl">+</span> REGISTRAR NUEVA EMPRESA
          </button>
        ) : (
          <form onSubmit={crearEmpresa} className="bg-white p-6 rounded-2xl border-2 border-indigo-100 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in zoom-in duration-200">
            <input type="text" placeholder="Nombre Comercial" className="p-3 border rounded-xl" required value={newEmp.nombre} onChange={e => setNewEmp({...newEmp, nombre: e.target.value})} />
            <input type="text" placeholder="RUC" className="p-3 border rounded-xl" required value={newEmp.ruc} onChange={e => setNewEmp({...newEmp, ruc: e.target.value})} />
            <input type="text" placeholder="Dirección" className="p-3 border rounded-xl md:col-span-2" value={newEmp.direccion} onChange={e => setNewEmp({...newEmp, direccion: e.target.value})} />
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl">GUARDAR</button>
              <button type="button" onClick={() => setShowFormEmpresa(false)} className="px-6 bg-slate-100 text-slate-500 font-bold rounded-xl">CANCELAR</button>
            </div>
          </form>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* COLUMNA 1: LISTA EMPRESAS */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="font-extrabold text-slate-800 mb-4 uppercase text-xs tracking-widest">1. Seleccionar Empresa</h2>
          <div className="space-y-2">
            {empresas.map(emp => (
              <button 
                key={emp.id} onClick={() => { setSelectedEmpresa(emp); fetchSitios(emp.id); }}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selectedEmpresa?.id === emp.id ? 'border-indigo-600 bg-indigo-50 shadow-sm' : 'border-slate-50 bg-slate-50 hover:bg-slate-100'}`}
              >
                <p className="font-bold text-slate-800">{emp.nombre}</p>
                <p className="text-[10px] text-slate-500">{emp.ruc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* COLUMNA 2: SITIOS */}
        <div className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-opacity ${!selectedEmpresa && 'opacity-40 pointer-events-none'}`}>
          <h2 className="font-extrabold text-slate-800 mb-4 uppercase text-xs tracking-widest">2. Sitios de {selectedEmpresa?.nombre}</h2>
          <div className="flex flex-col gap-2 mb-6">
            <input type="text" placeholder="Nuevo Sitio (Ej: Planta A)" className="p-3 border-2 border-slate-100 rounded-xl outline-none focus:border-indigo-400" value={newSitio} onChange={e => setNewSitio(e.target.value)} />
            <button onClick={agregarSitio} className="bg-slate-800 text-white font-bold py-2 rounded-xl text-sm">+ AGREGAR</button>
          </div>
          <div className="space-y-2">
            {sitios.map(s => (
              <button 
                key={s.id} 
                onClick={() => { setSelectedSitio(s); fetchAreas(s.id); }} 
                className={`w-full text-left p-3 rounded-xl border transition-all ${selectedSitio?.id === s.id ? 'bg-indigo-600 text-white border-indigo-600 font-bold' : 'bg-white border-slate-200 text-slate-700'}`}
              >
                {s.nombre}
              </button>
            ))}
          </div>
        </div>

        {/* COLUMNA 3: ÁREAS */}
        <div className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-sm transition-opacity ${!selectedSitio && 'opacity-40 pointer-events-none'}`}>
           <h2 className="font-extrabold text-slate-800 mb-4 uppercase text-xs tracking-widest">3. Áreas de {selectedSitio?.nombre}</h2>
           <div className="flex flex-col gap-2 mb-6">
            <input type="text" placeholder="Nueva Área (Ej: Extractora)" className="p-3 border-2 border-slate-100 rounded-xl outline-none focus:border-emerald-400" value={newArea} onChange={e => setNewArea(e.target.value)} />
            <button onClick={agregarArea} className="bg-emerald-600 text-white font-bold py-2 rounded-xl text-sm">+ AGREGAR ÁREA</button>
          </div>
          <div className="space-y-2">
            {areas.map(a => (
              <div key={a.id} className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl font-bold text-sm">
                {a.nombre}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}