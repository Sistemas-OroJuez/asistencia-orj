export default function Dashboard() {
  const modulos = [
    { id: 1, nombre: 'Control Asistencia', color: 'bg-blue-500', link: '/asistencia' },
    { id: 2, nombre: 'Gestión Usuarios', color: 'bg-green-500', link: '/usuarios' },
    { id: 3, nombre: 'Reportes de Horas', color: 'bg-orange-500', link: '/reportes' },
  ]

  return (
    <main className="p-10">
      <h1 className="text-3xl font-bold mb-8 text-slate-800">Panel de Administración - OroJuez</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {modulos.map((m) => (
          <a key={m.id} href={m.link} className={`${m.color} h-40 flex items-center justify-center rounded-xl text-white text-xl font-bold hover:scale-105 transition-transform cursor-pointer shadow-lg`}>
            {m.nombre}
          </a>
        ))}
      </div>
    </main>
  )
}