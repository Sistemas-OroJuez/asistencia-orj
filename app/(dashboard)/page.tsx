export default function DashboardPrincipal() {
  const modulos = [
    { nombre: 'Control Asistencia', icono: '⌚', color: 'bg-blue-600', desc: 'Marcajes en tiempo real', link: '/asistencia' },
    { nombre: 'Aprobación Horas', icono: '✅', color: 'bg-red-600', desc: 'Validar horas extras y atrasos', link: '/aprobaciones' }, // NUEVO MODULO
    { nombre: 'Empresas', icono: '🏢', color: 'bg-indigo-700', desc: 'Gestión de Clientes/Empresas', link: '/empresas' },
    { nombre: 'Dispositivos', icono: '📟', color: 'bg-slate-700', desc: 'Relojes Biométricos (ZKTeco)', link: '/dispositivos' },
    { nombre: 'Usuarios / Personal', icono: '👥', color: 'bg-emerald-600', desc: 'Administrar empleados', link: '/usuarios' },
    { nombre: 'Reportes de Horas', icono: '📊', color: 'bg-amber-600', desc: 'Cálculo de horas extras', link: '/reportes' },
  ]

  return (
    <main className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-extrabold text-slate-900">Sistemas OroJuez</h1>
          <p className="text-slate-500">Gestión Multiempresa de Asistencia Laboral</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modulos.map((m) => (
            <a 
              key={m.link} 
              href={m.link} 
              className="group relative bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <div className={`absolute top-0 left-0 w-2 h-full ${m.color}`}></div>
              <div className="flex items-center space-x-4">
                <div className="text-4xl p-3 rounded-lg bg-gray-100 group-hover:rotate-12 transition-transform">
                  {m.icono}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{m.nombre}</h2>
                  <p className="text-sm text-slate-500">{m.desc}</p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </main>
  )
}