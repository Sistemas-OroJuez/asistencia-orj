import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const { data: { session } } = await supabase.auth.getSession()

  // Si no hay sesión y no está en la página de login, redirigir a /login
  if (!session && !req.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Si ya hay sesión e intenta ir al login, mandarlo al panel principal
  if (session && req.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}