'use client';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function DashboardPrincipal() {
  const router = useRouter();

  const modulos = [
    { 
      nombre: 'Control de Jornadas', 
      icono: '⏱️', 
      color: 'bg-indigo-600', 
      link: '/jornadas', // Apunta a la nueva lógica inteligente
      desc: 'Entradas, salidas y horas' 
    },
    { 
      nombre: 'Aprobación Horas', 
      icono: '✅', 
      color: 'bg-rose-600', 
      link: '/aprobaciones', 
      desc: 'Validar extras y turnos' 
    },
    { 
      nombre: 'Estructura Negocio', 
      icono: '🏢', 
      color: 'bg-slate-800', 
      link: '/empresas', 
      desc: 'Empresas, Sitios y Áreas' 
    },
    { 
      nombre: 'Dispositivos', 
      icono: '📟', 
      color: 'bg-blue-700', 
      link: '/dispositivos', 
      desc: 'Relojes ZKTeco' 
    },
    { 
      nombre: 'Enrolamiento Personal', 
      icono: '👤', 
      color: 'bg-emerald-600', 
      link: '/empleados', 
      desc: 'Vincular ID de Reloj' 
    },
    { 
      nombre: 'Reportes y Nómina', 
      icono: '📊', 
      color: 'bg-amber-500', 
      link: '/reportes', 
      desc: 'Cálculos y exportación' 
    },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <main className="p-4 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header Superior */}
        <header className="flex justify-between items-center mb-10 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight text-center md:text-left">
              ORO JUEZ <span className="text-indigo-600">SISTEMAS</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Gestión de Asistencia v2.0</p>
          </div>
          <button 
            onClick={handleLogout}
            className="text-xs font-bold bg-slate-100 text-slate-500 px-5 py-2.5 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all active:scale-95 border border-transparent hover:border-red-100"
          >
            CERRAR SESIÓN
          </button>
        </header>

        {/* Malla de Módulos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
          {modulos.map((m) => (
            <a 
              key={m.link} 
              href={m.link} 
              className="group relative bg-white p-6 rounded-3xl shadow-sm border border-slate-200 active:scale-[0.98] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center space-x-5"
            >
              {/* Indicador de Color Vertical */}
              <div className={`absolute top-6 left-0 w-1.5 h-12 rounded-r-full ${m.color}`}></div>
              
              <div className="text-4xl bg-slate-50 p-4 rounded-2xl group-hover:scale-110 group-hover:bg-white transition-all duration-300">
                {m.icono}
              </div>
              
              <div className="flex-1">
                <h2 className="text-xl font-extrabold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">
                  {m.nombre}
                </h2>
                <p className="text-sm text-slate-500 mt-1 font-medium">{m.desc}</p>
              </div>

              <div className="text-slate-200 group-hover:text-indigo-400 transition-all transform translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="9 5l7 7-7 7" />
                </svg>
              </div>
            </a>
          ))}
        </div>

        <footer className="mt-16 text-center border-t border-slate-200 pt-8">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
            Desarrollado para Sistemas OroJuez &copy; 2026
          </p>
        </footer>
      </div>
    </main>
  );
}