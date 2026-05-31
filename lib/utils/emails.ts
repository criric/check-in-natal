import { Resend } from 'resend'
import { getConfiguracoes } from '@/lib/actions/configuracoes'
import { formatCurrency } from '@/lib/utils/formatters'

type EmailResult = {
  success: boolean
  messageId?: string
  error?: string
}

function getResend(): Resend {
  return new Resend(process.env.RESEND_API_KEY!)
}

function getFrom(): string {
  return process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

type EmpresaInfo = {
  nome: string
  cnpj: string
  endereco: string
  whatsapp: string
}

async function carregarEmpresa(): Promise<EmpresaInfo> {
  try {
    const cfg = await getConfiguracoes()
    return {
      nome: cfg['nome_empresa'] ?? 'Gestora Imóveis Natal',
      cnpj: cfg['cnpj_empresa'] ?? '00.000.000/0000-00',
      endereco: cfg['endereco_empresa'] ?? 'Natal, RN',
      whatsapp: cfg['whatsapp_contato'] ?? '',
    }
  } catch {
    return {
      nome: 'Gestora Imóveis Natal',
      cnpj: '',
      endereco: 'Natal, RN',
      whatsapp: '',
    }
  }
}

async function carregarAdminEmail(): Promise<string | undefined> {
  try {
    const cfg = await getConfiguracoes()
    return cfg['admin_email'] ?? process.env.ADMIN_EMAIL ?? undefined
  } catch {
    return process.env.ADMIN_EMAIL ?? undefined
  }
}

function emailLayout(conteudo: string, empresa: EmpresaInfo): string {
  const nome = escapeHtml(empresa.nome)
  const rodape = escapeHtml(`${empresa.nome} · ${empresa.endereco} · CNPJ ${empresa.cnpj}`)

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">
          <tr>
            <td style="background:#1a3a4a;padding:24px 32px;">
              <h1 style="color:#ffffff;margin:0;font-size:22px;">${nome}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;color:#1f2937;font-size:15px;line-height:1.55;">
              ${conteudo}
            </td>
          </tr>
          <tr>
            <td style="background:#f9f9f9;padding:16px 32px;border-top:1px solid #eeeeee;">
              <p style="color:#999;font-size:12px;margin:0;">
                ${rodape}<br>
                Este é um e-mail automático. Não responda a esta mensagem.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function botao(label: string, href: string, cor = '#1a3a4a'): string {
  return `<a href="${href}" style="display:inline-block;background:${cor};color:#fff;padding:12px 22px;border-radius:6px;text-decoration:none;font-weight:600;">${escapeHtml(label)}</a>`
}

function botaoCTA(label: string, href: string): string {
  return botao(label, href, '#f4845f')
}

function estrelas(nota: number): string {
  const cheia = '★'
  const vazia = '☆'
  const n = Math.max(0, Math.min(5, Math.round(nota)))
  return cheia.repeat(n) + vazia.repeat(5 - n)
}

// ─── Templates ──────────────────────────────────────────────

export function templateBoasVindas(nome: string, linkPortal: string): string {
  return `
    <h2 style="margin-top:0;color:#111827;font-size:20px;">Bem-vindo, ${escapeHtml(nome)}!</h2>
    <p>Seu portal de proprietário já está disponível. Por lá você acompanha:</p>
    <ul style="padding-left:18px;margin:14px 0;">
      <li>Financeiro: extratos mensais e histórico de repasses</li>
      <li>Reservas e ocupação dos seus imóveis em tempo real</li>
      <li>Manutenções abertas e aprovações pendentes</li>
    </ul>
    <p style="margin:24px 0;">${botaoCTA('Acessar meu portal', linkPortal)}</p>
    <p style="color:#6b7280;font-size:12px;">Se não esperava este e-mail, ignore-o.</p>
  `
}

export function templateExtratoRepasse(params: {
  nome: string
  mesAno: string
  receitaBruta: number
  comissao: number
  deducoes: number
  valorLiquido: number
  pdfUrl: string
  linkPortal: string
}): string {
  const linha = (label: string, valor: number, cor?: string) => `
    <tr>
      <td style="padding:8px 0;color:#6b7280;">${escapeHtml(label)}</td>
      <td style="padding:8px 0;text-align:right;${cor ? `color:${cor};font-weight:600;` : ''}">${formatCurrency(valor)}</td>
    </tr>`

  return `
    <h2 style="margin-top:0;color:#111827;font-size:20px;">Seu extrato de ${escapeHtml(params.mesAno)} está disponível</h2>
    <p>Olá ${escapeHtml(params.nome)}, o fechamento foi processado.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:18px 0;">
      ${linha('Receita bruta', params.receitaBruta)}
      ${linha('Comissão', -Math.abs(params.comissao))}
      ${params.deducoes > 0 ? linha('Deduções', -Math.abs(params.deducoes)) : ''}
      <tr><td colspan="2" style="border-top:1px solid #eee;height:1px;"></td></tr>
      ${linha('Valor líquido', params.valorLiquido, '#22c55e')}
    </table>
    <p style="margin:24px 0;">
      ${botao('Baixar extrato PDF', params.pdfUrl)}&nbsp;
      ${botao('Ver no portal', params.linkPortal, '#6b7280')}
    </p>
    <p style="color:#6b7280;font-size:12px;">Documento válido para declaração de Imposto de Renda.</p>
  `
}

export function templateAprovacaoManutencao(params: {
  nome: string
  imovelNome: string
  descricao: string
  custoEstimado: number
  linkPortal: string
}): string {
  return `
    <h2 style="margin-top:0;color:#b45309;font-size:20px;">Aprovação necessária: manutenção no seu imóvel</h2>
    <p>Olá ${escapeHtml(params.nome)},</p>
    <p>Identificamos uma manutenção no imóvel <strong>${escapeHtml(params.imovelNome)}</strong> que precisa da sua aprovação.</p>
    <div style="padding:14px;background:#fffbeb;border-left:4px solid #f59e0b;border-radius:4px;margin:16px 0;">
      <p style="margin:0 0 8px 0;"><strong>Descrição:</strong></p>
      <p style="margin:0 0 12px 0;">${escapeHtml(params.descricao)}</p>
      <p style="margin:0;"><strong>Custo estimado:</strong> ${formatCurrency(params.custoEstimado)}</p>
    </div>
    <p style="margin:24px 0;">
      ${botao('Aprovar', params.linkPortal, '#22c55e')}&nbsp;
      ${botao('Recusar', params.linkPortal, '#dc2626')}
    </p>
    <p style="color:#6b7280;font-size:12px;">Você pode aprovar ou recusar acessando seu portal de proprietário.</p>
  `
}

export function templateRespostaManutencao(params: {
  imovelNome: string
  proprietarioNome: string
  aprovado: boolean
  observacao?: string
  linkManutencao: string
}): string {
  const badge = params.aprovado
    ? '<span style="display:inline-block;background:#22c55e;color:#fff;padding:4px 10px;border-radius:4px;font-weight:600;">APROVADA</span>'
    : '<span style="display:inline-block;background:#dc2626;color:#fff;padding:4px 10px;border-radius:4px;font-weight:600;">RECUSADA</span>'

  return `
    <h2 style="margin-top:0;font-size:20px;color:#111827;">Proprietário respondeu sobre manutenção</h2>
    <p><strong>${escapeHtml(params.proprietarioNome)}</strong> sobre o imóvel <strong>${escapeHtml(params.imovelNome)}</strong>:</p>
    <p style="margin:14px 0;">Decisão: ${badge}</p>
    ${
      params.observacao
        ? `<div style="padding:12px;background:#f9fafb;border-left:4px solid #d1d5db;border-radius:4px;margin:12px 0;"><strong>Observação:</strong><br/>${escapeHtml(params.observacao)}</div>`
        : ''
    }
    <p style="margin:24px 0;">${botao('Ver manutenção', params.linkManutencao)}</p>
  `
}

export function templateCheckinSemLimpeza(params: {
  imovelNome: string
  dataCheckin: string
  horasRestantes: number
  linkLimpezas: string
}): string {
  return `
    <h2 style="margin-top:0;color:#dc2626;font-size:20px;">⚠️ URGENTE: limpeza não confirmada</h2>
    <div style="padding:14px;background:#fffbeb;border-left:4px solid #f59e0b;border-radius:4px;margin:16px 0;">
      <p style="margin:0 0 8px 0;"><strong>Imóvel:</strong> ${escapeHtml(params.imovelNome)}</p>
      <p style="margin:0 0 8px 0;"><strong>Check-in:</strong> ${escapeHtml(params.dataCheckin)}</p>
      <p style="margin:0;color:#dc2626;font-size:18px;"><strong>Faltam ${params.horasRestantes}h</strong></p>
    </div>
    <p style="margin:24px 0;">${botao('Gerenciar limpezas', params.linkLimpezas, '#dc2626')}</p>
  `
}

export function templateAvaliacaoNegativa(params: {
  imovelNome: string
  nota: number
  comentario?: string
  plataforma: string
  linkReserva: string
}): string {
  return `
    <h2 style="margin-top:0;color:#b91c1c;font-size:20px;">Avaliação ${params.nota}★ recebida — atenção necessária</h2>
    <p><strong>Imóvel:</strong> ${escapeHtml(params.imovelNome)}</p>
    <p><strong>Plataforma:</strong> ${escapeHtml(params.plataforma)}</p>
    <p style="font-size:22px;letter-spacing:2px;color:#f59e0b;margin:8px 0;">${estrelas(params.nota)}</p>
    ${
      params.comentario
        ? `<div style="padding:14px;background:#fef2f2;border-left:4px solid #dc2626;border-radius:4px;margin:16px 0;"><strong>Comentário do hóspede:</strong><br/>${escapeHtml(params.comentario)}</div>`
        : ''
    }
    <p style="margin:24px 0;">${botao('Ver reserva', params.linkReserva)}</p>
  `
}

export function templateNovoLead(lead: {
  nome: string
  telefone: string
  email?: string
  bairro?: string
  mensagem?: string
}): string {
  const linhaCampo = (label: string, valor?: string) =>
    valor
      ? `<tr><td style="padding:6px 0;color:#6b7280;width:120px;">${escapeHtml(label)}</td><td style="padding:6px 0;">${escapeHtml(valor)}</td></tr>`
      : ''

  const wppLink = `https://wa.me/55${lead.telefone.replace(/\D/g, '')}`

  return `
    <h2 style="margin-top:0;font-size:20px;color:#111827;">Novo lead: ${escapeHtml(lead.nome)}</h2>
    <table cellpadding="0" cellspacing="0" style="margin:14px 0;width:100%;border-collapse:collapse;">
      ${linhaCampo('Nome', lead.nome)}
      ${linhaCampo('Telefone', lead.telefone)}
      ${linhaCampo('E-mail', lead.email)}
      ${linhaCampo('Bairro', lead.bairro)}
      ${linhaCampo('Mensagem', lead.mensagem)}
    </table>
    <p style="margin:24px 0;">${botaoCTA('Falar no WhatsApp', wppLink)}</p>
  `
}

// ─── Envio ──────────────────────────────────────────────────

export async function enviarBoasVindasProprietario(
  nome: string,
  email: string,
  magicLink: string,
): Promise<EmailResult> {
  try {
    const empresa = await carregarEmpresa()
    const html = emailLayout(templateBoasVindas(nome, magicLink), empresa)

    const { data, error } = await getResend().emails.send({
      from: getFrom(),
      to: email,
      subject: `Bem-vindo ao portal · ${empresa.nome}`,
      html,
    })

    if (error) return { success: false, error: error.message }
    return { success: true, messageId: data?.id }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Erro desconhecido' }
  }
}

export async function enviarExtratoRepasse(
  email: string,
  nome: string,
  mesAno: string,
  valorLiquido: number,
  pdfUrl: string,
  extras?: { receitaBruta?: number; comissao?: number; deducoes?: number },
): Promise<EmailResult> {
  try {
    const empresa = await carregarEmpresa()
    const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/portal`

    const conteudo = templateExtratoRepasse({
      nome,
      mesAno,
      receitaBruta: extras?.receitaBruta ?? valorLiquido,
      comissao: extras?.comissao ?? 0,
      deducoes: extras?.deducoes ?? 0,
      valorLiquido,
      pdfUrl,
      linkPortal: portalUrl,
    })

    const { data, error } = await getResend().emails.send({
      from: getFrom(),
      to: email,
      subject: `Extrato de repasse — ${mesAno} disponível`,
      html: emailLayout(conteudo, empresa),
    })

    if (error) return { success: false, error: error.message }
    return { success: true, messageId: data?.id }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Erro desconhecido' }
  }
}

export async function notificarManutencaoUrgente(dados: {
  proprietario_email: string
  proprietario_nome: string
  imovel_nome: string
  descricao: string
  custo_estimado: number
  link_portal: string
}): Promise<EmailResult> {
  try {
    const empresa = await carregarEmpresa()
    const conteudo = templateAprovacaoManutencao({
      nome: dados.proprietario_nome,
      imovelNome: dados.imovel_nome,
      descricao: dados.descricao,
      custoEstimado: dados.custo_estimado,
      linkPortal: dados.link_portal,
    })

    const { data, error } = await getResend().emails.send({
      from: getFrom(),
      to: dados.proprietario_email,
      subject: 'Aprovação necessária: manutenção no seu imóvel',
      html: emailLayout(conteudo, empresa),
    })

    if (error) return { success: false, error: error.message }
    return { success: true, messageId: data?.id }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Erro desconhecido' }
  }
}

export async function notificarRespostaManutencao(dados: {
  admin_email: string
  proprietario_nome: string
  imovel_nome: string
  aprovado: boolean
  observacao?: string
  manutencao_id: string
}): Promise<EmailResult> {
  try {
    const empresa = await carregarEmpresa()
    const link = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/manutencoes/${dados.manutencao_id}`
    const conteudo = templateRespostaManutencao({
      imovelNome: dados.imovel_nome,
      proprietarioNome: dados.proprietario_nome,
      aprovado: dados.aprovado,
      observacao: dados.observacao,
      linkManutencao: link,
    })

    const { data, error } = await getResend().emails.send({
      from: getFrom(),
      to: dados.admin_email,
      subject: `Proprietário respondeu sobre manutenção (${dados.aprovado ? 'aprovou' : 'recusou'})`,
      html: emailLayout(conteudo, empresa),
    })

    if (error) return { success: false, error: error.message }
    return { success: true, messageId: data?.id }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Erro desconhecido' }
  }
}

export async function alertarCheckinSemLimpeza(dados: {
  admin_email: string
  imovel_nome: string
  data_checkin: string
  horas_restantes: number
}): Promise<EmailResult> {
  try {
    const empresa = await carregarEmpresa()
    const link = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/limpezas`
    const conteudo = templateCheckinSemLimpeza({
      imovelNome: dados.imovel_nome,
      dataCheckin: dados.data_checkin,
      horasRestantes: dados.horas_restantes,
      linkLimpezas: link,
    })

    const { data, error } = await getResend().emails.send({
      from: getFrom(),
      to: dados.admin_email,
      subject: `URGENTE: limpeza não confirmada — check-in em ${dados.horas_restantes}h`,
      html: emailLayout(conteudo, empresa),
      headers: { 'X-Priority': '1' },
    })

    if (error) return { success: false, error: error.message }
    return { success: true, messageId: data?.id }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Erro desconhecido' }
  }
}

export async function notificarAvaliacaoNegativa(dados: {
  admin_email: string
  imovel_nome: string
  nota: number
  comentario?: string
  plataforma: string
  reserva_id: string
}): Promise<EmailResult> {
  try {
    const empresa = await carregarEmpresa()
    const link = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/reservas/${dados.reserva_id}`
    const conteudo = templateAvaliacaoNegativa({
      imovelNome: dados.imovel_nome,
      nota: dados.nota,
      comentario: dados.comentario,
      plataforma: dados.plataforma,
      linkReserva: link,
    })

    const { data, error } = await getResend().emails.send({
      from: getFrom(),
      to: dados.admin_email,
      subject: `Atenção: avaliação ${dados.nota}★ recebida em ${dados.imovel_nome}`,
      html: emailLayout(conteudo, empresa),
    })

    if (error) return { success: false, error: error.message }
    return { success: true, messageId: data?.id }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Erro desconhecido' }
  }
}

export async function notificarAdminNovoLead(lead: {
  nome: string
  telefone: string
  email?: string
  bairro_imovel?: string
  mensagem?: string
}): Promise<EmailResult> {
  try {
    const adminEmail = await carregarAdminEmail()
    if (!adminEmail) {
      return { success: false, error: 'admin_email não configurado' }
    }
    const empresa = await carregarEmpresa()
    const conteudo = templateNovoLead({
      nome: lead.nome,
      telefone: lead.telefone,
      email: lead.email,
      bairro: lead.bairro_imovel,
      mensagem: lead.mensagem,
    })

    const { data, error } = await getResend().emails.send({
      from: getFrom(),
      to: adminEmail,
      subject: `Novo lead: ${lead.nome}`,
      html: emailLayout(conteudo, empresa),
    })

    if (error) return { success: false, error: error.message }
    return { success: true, messageId: data?.id }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Erro desconhecido' }
  }
}
