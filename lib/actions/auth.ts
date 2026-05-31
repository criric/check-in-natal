'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAppUrl } from '@/lib/utils/app-url'
import { UserRole, type ActionResult, type CurrentUser } from '@/types'

export async function loginAdmin(
  email: string,
  password: string,
): Promise<ActionResult<{ redirectTo: string }>> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data.user) {
      return { error: error?.message ?? 'Credenciais inválidas' }
    }

    const role = data.user.user_metadata?.role
    if (role !== UserRole.Admin) {
      await supabase.auth.signOut()
      return { error: 'Esta conta não tem permissão de administrador' }
    }

    return { data: { redirectTo: '/dashboard' } }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erro ao fazer login' }
  }
}

export async function sendMagicLink(
  email: string,
): Promise<ActionResult<{ sent: boolean }>> {
  try {
    // Verifica se o e-mail existe entre os proprietários antes de enviar
    const admin = createAdminClient()
    const { data: prop, error: propError } = await admin
      .from('proprietarios')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (propError) {
      return { error: 'Erro ao validar o e-mail' }
    }
    if (!prop) {
      return { error: 'E-mail não encontrado entre os proprietários' }
    }

    const supabase = await createClient()
    const redirectTo = `${getAppUrl()}/magic-link`
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    })

    if (error) return { error: error.message }
    return { data: { sent: true } }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erro ao enviar link' }
  }
}

export async function sendPasswordReset(
  email: string,
): Promise<ActionResult<{ sent: boolean }>> {
  try {
    if (!email) return { error: 'Informe o e-mail para recuperar a senha' }

    const supabase = await createClient()
    const redirectTo = `${getAppUrl()}/login`
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    if (error) return { error: error.message }
    return { data: { sent: true } }
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : 'Erro ao enviar recuperação',
    }
  }
}

export async function logout(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function getCurrentUser(): Promise<ActionResult<CurrentUser>> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) return { error: 'Não autenticado' }

    const role = user.user_metadata?.role as UserRole | undefined
    if (!role) return { error: 'Usuário sem role' }

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
      data: {
        id: user.id,
        email: user.email ?? '',
        role,
        proprietario_id,
      },
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erro ao obter usuário' }
  }
}

// Helper de setup — usar manualmente para criar o primeiro admin.
// Bypass de RLS via service role.
export async function createAdminUser(
  email: string,
  password: string,
): Promise<ActionResult<{ user_id: string }>> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: UserRole.Admin },
    })

    if (error || !data.user) {
      return { error: error?.message ?? 'Erro ao criar usuário' }
    }

    return { data: { user_id: data.user.id } }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erro desconhecido' }
  }
}
