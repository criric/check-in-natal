/**
 * Resolve a URL base pública da aplicação, sem barra final.
 *
 * Ordem de prioridade:
 * 1. NEXT_PUBLIC_APP_URL — configuração explícita (recomendada em produção).
 * 2. VERCEL_PROJECT_PRODUCTION_URL — domínio de produção estável da Vercel.
 * 3. VERCEL_URL — URL do deployment atual (preview/branch).
 *
 * As variáveis da Vercel vêm sem protocolo, então `https://` é adicionado.
 * Lança erro quando nenhuma fonte está disponível, evitando gerar links
 * relativos quebrados (ex.: magic link apontando para localhost).
 */
export function getAppUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL
  if (explicit) return stripTrailingSlash(explicit)

  const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (vercelProd) return `https://${stripTrailingSlash(vercelProd)}`

  const vercelDeploy = process.env.VERCEL_URL
  if (vercelDeploy) return `https://${stripTrailingSlash(vercelDeploy)}`

  throw new Error(
    'URL da aplicação não configurada: defina NEXT_PUBLIC_APP_URL no ambiente.',
  )
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '')
}
