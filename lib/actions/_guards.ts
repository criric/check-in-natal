import { createClient } from '@/lib/supabase/server'
import { UserRole, type CurrentUser } from '@/types'

type GuardSuccess = {
  ok: true
  user: CurrentUser
}

type GuardFailure = {
  ok: false
  error: string
}

// Discriminated union via boolean flag — sem `|` para enums de domínio,
// mas para discriminated unions de resultado o `|` é o jeito idiomático em TS.
export type GuardResult = GuardSuccess | GuardFailure

async function loadCurrent(): Promise<GuardResult> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return { ok: false, error: 'Não autenticado' }
  }

  const role = user.user_metadata?.role as UserRole | undefined
  if (!role) {
    return { ok: false, error: 'Usuário sem role definida' }
  }

  let proprietario_id: string | undefined
  if (role === UserRole.Proprietario) {
    const { data: prop } = await supabase
      .from('proprietarios')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    proprietario_id = prop?.id ?? undefined
  }

  return {
    ok: true,
    user: {
      id: user.id,
      email: user.email ?? '',
      role,
      proprietario_id,
    },
  }
}

export async function requireAuth(): Promise<GuardResult> {
  return loadCurrent()
}

export async function requireAdmin(): Promise<GuardResult> {
  const r = await loadCurrent()
  if (!r.ok) return r
  if (r.user.role !== UserRole.Admin) {
    return { ok: false, error: 'Acesso restrito a administradores' }
  }
  return r
}

export async function requireProprietario(): Promise<GuardResult> {
  const r = await loadCurrent()
  if (!r.ok) return r
  if (r.user.role !== UserRole.Proprietario) {
    return { ok: false, error: 'Acesso restrito a proprietários' }
  }
  return r
}
