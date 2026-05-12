'use client';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function DashboardPrincipal() {
  const router = useRouter();

  const modulos = [
    { nombre: 'Control Asistencia', icono: '⌚', color: 'bg-blue-600', link: '/asistencia', desc: 'Marcajes en vivo' },
    { nombre: 'Aprobación Horas', icono: '✅', color: 'bg-red-600', link: '/aprobaciones', desc: 'Validar extras por área' },
    { nombre: 'Empresas', icono: '🏢', color: 'bg-indigo-700', link: '/empresas', desc: 'Sitios y Departamentos' },
    { nombre: 'Dispositivos', icono: '📟', color: 'bg-slate-700', link: '/dispositivos', desc: 'Relojes ZKTeco' },
    { nombre: 'Enrolamiento Personal', icono: '👥', color: 'bg-emerald-600', link: '/empleados', desc: 'Vincular ID de Reloj' },
    { nombre: 'Reportes de Horas', icono: '📊', color: 'bg-amber-600', link: '/reportes', desc: 'Cálculos finales' },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <main className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header con Logout */}
        <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">Sistemas OroJuez</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Admin Panel v2.0</p>
          </div>
          <button 
            onClick={handleLogout}
            className="text-xs font-bold bg-slate-100 text-slate-600 px-4 py-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all active:scale-95"
          >
            CERRAR SESIÓN
          </button>
        </header>

        {/* Grid de Módulos Responsivo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {modulos.map((m) => (
            <a 
              key={m.link} 
              href={m.link} 
              className="group relative bg-white p-5 rounded-2xl shadow-sm border border-slate-200 active:scale-95 md:hover:shadow-lg md:hover:border-indigo-100 transition-all flex items-center space-x-4 h-28 md:h-32"
            >
              {/* Barra lateral de color */}
              <div className={`absolute top-0 left-0 w-2 h-full rounded-l-2xl ${m.color}`}></div>
              
              <div className="text-3xl md:text-4xl bg-slate-50 p-3 rounded-xl group-hover:bg-white transition-colors">
                {m.icono}
              </div>
              
              <div className="flex-1">
                <h2 className="text-lg md:text-xl font-bold text-slate-800 leading-tight group-hover:text-indigo-900 transition-colors">
                  {m.nombre}
                </h2>
                <p className="text-xs md:text-sm text-slate-500 mt-1">{m.desc}</p>
              </div>

              <div className="text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="9 5l7 7-7 7" />
                </svg>
              </div>
            </a>
          ))}
        </div>

        <footer className="mt-12 text-center text-slate-400 text-[10px] uppercase tracking-widest font-medium">
          OroJuez Attendance System &copy; 2026 - Gestión de Talento Humano
        </footer>
      </div>
    </main>
  );
}