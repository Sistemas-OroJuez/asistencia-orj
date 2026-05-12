'use client';
import { useRouter, usePathname } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  // Usamos el cliente específico para componentes de Next.js
  const supabase = createClientComponentClient();

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault(); // Evitamos cualquier comportamiento por defecto
    
    try {
      // 1. Intentamos cerrar sesión en Supabase
      await supabase.auth.signOut();
      
      // 2. Limpieza manual de cookies y storage
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      localStorage.clear();
      
      // 3. Salida forzada
      window.location.replace('/login');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      // Si falla Supabase, igual lo mandamos al login
      window.location.href = '/login';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {pathname !== '/' && (
              <button 
                onClick={() => router.push('/')}
                className="flex items-center text-indigo-600 font-bold text-sm bg-indigo-50 px-3 py-1 rounded-full"
              >
                ← Inicio
              </button>
            )}
            <span className="text-slate-900 font-extrabold text-lg">
              OroJuez <span className="text-indigo-600 italic">Admin</span>
            </span>
          </div>

          <button 
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-700 shadow-md active:scale-95 transition-all"
          >
            CERRAR SESIÓN
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4">
        {children}
      </main>
    </div>
  );
}