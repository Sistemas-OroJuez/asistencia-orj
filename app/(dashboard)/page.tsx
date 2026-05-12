'use client';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function DashboardPrincipal() {
  const router = useRouter();

  const modulos = [
    { nombre: 'Control Asistencia', icono: '⌚', color: 'bg-blue-600', link: '/asistencia', desc: 'Marcajes en vivo' },
    { nombre: 'Aprobación Horas', icono: '✅', color: 'bg-red-600', link: '/aprobaciones', desc: 'Validar extras' },
    { nombre: 'Empresas', icono: '🏢', color: 'bg-indigo-700', link: '/empresas', desc: 'Multiempresa' },
    { nombre: 'Dispositivos', icono: '📟', color: 'bg-slate-700', link: '/dispositivos', desc: 'Relojes ZKTeco' },
    { nombre: 'Usuarios / Personal', icono: '👥', color: 'bg-emerald-600', link: '/usuarios', desc: 'Gestión empleados' },
    { nombre: 'Reportes de Horas', icono: '📊', color: 'bg-amber-600', desc: 'Cálculos finales' },
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
        <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">Sistemas OroJuez</h1>
            <p className="text-xs text-slate-500 uppercase tracking-widest">Admin Panel</p>
          </div>
          <button 
            onClick={handleLogout}
            className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            CERRAR SESIÓN
          </button>
        </header>

        {/* Grid de Módulos Responsivo */}
        {/* grid-cols-1 para celular (botones de ancho completo) */}
        {/* md:grid-cols-2 para tablets */}
        {/* lg:grid-cols-3 para laptops */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {modulos.map((m) => (
            <a 
              key={m.link} 
              href={m.link} 
              className="group relative bg-white p-5 rounded-2xl shadow-sm border border-slate-200 active:scale-95 md:hover:shadow-md transition-all flex items-center space-x-4 h-24 md:h-32"
            >
              {/* Barra lateral de color */}
              <div className={`absolute top-0 left-0 w-2 h-full ${m.color}`}></div>
              
              <div className="text-3xl md:text-4xl bg-slate-50 p-3 rounded-xl group-hover:bg-white transition-colors">
                {m.icono}
              </div>
              
              <div className="flex-1">
                <h2 className="text-lg md:text-xl font-bold text-slate-800 leading-tight">{m.nombre}</h2>
                <p className="text-xs md:text-sm text-slate-500">{m.desc}</p>
              </div>

              <div className="text-slate-300 group-hover:text-slate-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="9 5l7 7-7 7" />
                </svg>
              </div>
            </a>
          ))}
        </div>

        <footer className="mt-12 text-center text-slate-400 text-xs">
          OroJuez Attendance System v2.0 - 2026
        </footer>
      </div>
    </main>
  );
}