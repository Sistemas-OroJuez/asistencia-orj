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

  useEffect(() => { fetchEmpresas(); }, []);

  const fetchEmpresas = async () => {
    const { data } = await supabase.from('empresas').select('*');
    setEmpresas(data || []);
  };

  const fetchSitios = async (empresaId: string) => {
    const { data } = await supabase.from('sitios').select('*').eq('empresa_id', empresaId);
    setSitios(data || []);
    setAreas([]);
  };

  const fetchAreas = async (sitioId: string) => {
    const { data } = await supabase.from('areas').select('*').eq('sitio_id', sitioId);
    setAreas(data || []);
  };

  const agregarSitio = async () => {
    await supabase.from('sitios').insert([{ nombre: newSitio, empresa_id: selectedEmpresa.id }]);
    setNewSitio('');
    fetchSitios(selectedEmpresa.id);
  };

  const agregarArea = async () => {
    await supabase.from('areas').insert([{ nombre: newArea, sitio_id: selectedSitio.id }]);
    setNewArea('');
    fetchAreas(selectedSitio.id);
  };

  return (
    <div className="p-4 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* COLUMNA 1: EMPRESAS */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <h2 className="font-bold text-slate-700 mb-4 flex items-center">🏢 Empresas</h2>
        <div className="space-y-2">
          {empresas.map(emp => (
            <button 
              key={emp.id}
              onClick={() => { setSelectedEmpresa(emp); fetchSitios(emp.id); }}
              className={`w-full text-left p-3 rounded-lg border transition ${selectedEmpresa?.id === emp.id ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 hover:bg-slate-50'}`}
            >
              <p className="font-bold text-sm">{emp.nombre}</p>
              <p className="text-[10px] text-slate-500 uppercase">{emp.ruc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* COLUMNA 2: SITIOS */}
      <div className={`bg-white p-4 rounded-xl shadow-sm border border-slate-200 ${!selectedEmpresa && 'opacity-50'}`}>
        <h2 className="font-bold text-slate-700 mb-4 flex items-center">📍 Sitios / Plantas</h2>
        {selectedEmpresa && (
          <>
            <div className="flex gap-2 mb-4">
              <input type="text" className="flex-1 p-2 border rounded text-sm" placeholder="Nuevo Sitio..." value={newSitio} onChange={e => setNewSitio(e.target.value)} />
              <button onClick={agregarSitio} className="bg-slate-800 text-white px-3 py-1 rounded text-sm">+</button>
            </div>
            <div className="space-y-2">
              {sitios.map(s => (
                <button 
                  key={s.id} onClick={() => { setSelectedSitio(s); fetchAreas(s.id); }}
                  className={`w-full text-left p-2 rounded border text-sm ${selectedSitio?.id === s.id ? 'bg-slate-800 text-white' : 'bg-slate-50'}`}
                >
                  {s.nombre}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* COLUMNA 3: ÁREAS */}
      <div className={`bg-white p-4 rounded-xl shadow-sm border border-slate-200 ${!selectedSitio && 'opacity-50'}`}>
        <h2 className="font-bold text-slate-700 mb-4 flex items-center">🌳 Áreas (Ej: Extractora)</h2>
        {selectedSitio && (
          <>
            <div className="flex gap-2 mb-4">
              <input type="text" className="flex-1 p-2 border rounded text-sm" placeholder="Nueva Área..." value={newArea} onChange={e => setNewArea(e.target.value)} />
              <button onClick={agregarArea} className="bg-emerald-600 text-white px-3 py-1 rounded text-sm">+</button>
            </div>
            <div className="space-y-2">
              {areas.map(a => (
                <div key={a.id} className="p-2 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded text-sm font-medium">
                  {a.nombre}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}