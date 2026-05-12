'use client';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Barra de Navegación Superior */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Botón de Regresar: Solo se muestra si NO estamos en el inicio */}
            {pathname !== '/' && (
              <button 
                onClick={() => router.push('/')}
                className="flex items-center text-indigo-600 hover:text-indigo-800 font-bold text-sm"
              >
                <span className="mr-1 text-xl">←</span> Inicio
              </button>
            )}
            <span className="text-slate-900 font-extrabold text-lg hidden md:block">
              OroJuez <span className="text-indigo-600">Admin</span>
            </span>
          </div>

          <button 
            onClick={handleLogout}
            className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-50 hover:text-red-600 transition-all"
          >
            CERRAR SESIÓN
          </button>
        </div>
      </nav>

      {/* Contenido de la página */}
      <main className="max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}