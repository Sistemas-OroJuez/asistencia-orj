'use client'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClientComponentClient()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    
    if (error) {
      alert("Error de acceso: " + error.message)
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-2xl">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-slate-900">OroJuez</h2>
          <p className="mt-2 text-sm text-slate-600">Ingresa tus credenciales para administrar</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4 shadow-sm">
            <input
              type="email"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Correo electrónico"
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="password"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Contraseña"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 py-2 text-white hover:bg-indigo-700 disabled:bg-slate-400"
          >
            {loading ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  )
}