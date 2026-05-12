'use client';
import { useState, useEffect } from 'react';
// Cambiamos el import anterior por este:
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function EmpresasFullConfig() {
  const [empresas, setEmpresas] = useState<any[]>([]);
  // ... resto de tus estados ...

  // Inicializamos el cliente dentro del componente
  const supabase = createClientComponentClient(); 

  // ... el resto de tus funciones fetchEmpresas, crearEmpresa, etc., 
  // ahora usarán este 'supabase' que SÍ envía el token de usuario.