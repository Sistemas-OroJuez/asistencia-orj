'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function EmpresasConfigPage() {
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState<any>(null);
  const [sitios, setSitios] = useState<any[]>([]);
  const [newSitio, setNewSitio] = useState('');
  const [newArea, setNewArea] = useState('');
  const [selectedSitio, setSelectedSitio] = useState<any>(null);
  const [areas, setAreas] = useState<any[]>([]);

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

  const agregarSitio = async () => {
    if (!newSitio.trim()) return alert("Escribe el nombre del sitio");
    
    const { error } = await supabase.from('sitios').insert([
      { nombre: newSitio, empresa_id: selectedEmpresa.id }
    ]);
    
    if (error) {
      alert("Error: " + error.message);
    } else {
      setNewSitio('');
      fetchSitios(selectedEmpresa.id);
    }
  };

  const agregarArea = async () => {
    if (!newArea.trim()) return alert("Escribe el nombre del área");
    
    const { error } = await supabase.from('areas').insert([
      { nombre: newArea, sitio_id: selectedSitio.id }
    ]);
    
    if (error) {
      alert("Error: " + error.message);
    } else {
      setNewArea('');
      fetchAreas(selectedSitio.id);
    }
  };

  return (
    <div className="p-4 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 pb-20">
      
      {/* COLUMNA 1: EMPRESAS */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="font-extrabold text-slate-800 mb-6 flex items-center text-lg">
          <span className="mr-2">🏢</span> Empresas
        </h2>
        <div className="space-y-3">
          {empresas.map(emp => (
            <button 
              key={emp.id}
              onClick={() => { setSelectedEmpresa(emp); fetchSitios(emp.id); }}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all active:scale-95 ${
                selectedEmpresa?.id === emp.id 
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm' 
                : 'border-slate-100 hover:border-slate-200 bg-slate-50'
              }`}
            >
              <p className="font-bold text-base">{emp.nombre}</p>
              <p className="text-[10px] font-mono text-slate-500 uppercase mt-1">RUC: {emp.ruc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* COLUMNA 2: SITIOS */}
      <div className={`bg-white p-5 rounded-2xl shadow-sm border border-slate-200 transition-opacity ${!selectedEmpresa && 'opacity-40'}`}>
        <h2 className="font-extrabold text-slate-800 mb-6 flex items-center text-lg">
          <span className="mr-2">📍</span> Sitios / Plantas
        </h2>
        {selectedEmpresa ? (
          <>
            <div className="flex flex-col gap-3 mb-8">
              <input 
                type="text" 
                className="w-full p-4 border-2 border-slate-100 rounded-xl text-sm focus:border-indigo-500 outline-none transition-colors" 
                placeholder="Nombre del nuevo sitio..." 
                value={newSitio} 
                onChange={e => setNewSitio(e.target.value)} 
              />
              <button 
                onClick={agregarSitio} 
                className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-900 active:scale-95 transition-all shadow-lg shadow-slate-200"
              >
                + AGREGAR SITIO
              </button>
            </div>
            <div className="space-y-3">
              {sitios.map(s => (
                <button 
                  key={s.id} 
                  onClick={() => { setSelectedSitio(s); fetchAreas(s.id); }}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all active:scale-95 ${
                    selectedSitio?.id === s.id 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                    : 'bg-white border-slate-100 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-bold text-sm">{s.nombre}</span>
                </button>
              ))}
              {sitios.length === 0 && <p className="text-center text-slate-400 text-xs italic py-4">No hay sitios creados</p>}
            </div>
          </>
        ) : (
          <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-xl">
             <p className="text-sm text-slate-400">Selecciona una empresa</p>
          </div>
        )}
      </div>

      {/* COLUMNA 3: ÁREAS */}
      <div className={`bg-white p-5 rounded-2xl shadow-sm border border-slate-200 transition-opacity ${!selectedSitio && 'opacity-40'}`}>
        <h2 className="font-extrabold text-slate-800 mb-6 flex items-center text-lg">
          <span className="mr-2">🌳</span> Áreas
        </h2>
        {selectedSitio ? (
          <>
            <div className="flex flex-col gap-3 mb-8">
              <input 
                type="text" 
                className="w-full p-4 border-2 border-slate-100 rounded-xl text-sm focus:border-emerald-500 outline-none transition-colors" 
                placeholder="Ej: Extractora, Oficina..." 
                value={newArea} 
                onChange={e => setNewArea(e.target.value)} 
              />
              <button 
                onClick={agregarArea} 
                className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 active:scale-95 transition-all shadow-lg shadow-emerald-100"
              >
                + AGREGAR ÁREA
              </button>
            </div>
            <div className="space-y-3">
              {areas.map(a => (
                <div key={a.id} className="p-4 bg-emerald-50 text-emerald-900 border-2 border-emerald-100 rounded-xl text-sm font-bold flex justify-between items-center shadow-sm">
                  <span>{a.nombre}</span>
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                </div>
              ))}
              {areas.length === 0 && <p className="text-center text-slate-400 text-xs italic py-4">No hay áreas creadas</p>}
            </div>
          </>
        ) : (
          <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-xl">
             <p className="text-sm text-slate-400">Selecciona un sitio</p>
          </div>
        )}
      </div>

    </div>
  );
}