import { LeadForm } from './lead-form'

export function ContatoSection() {
  return (
    <section id="contato" className="bg-white py-24">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-eyebrow">Vamos conversar</span>
          <h2 className="mt-3 font-display text-3xl text-navy-700 sm:text-4xl">
            Conte sobre o seu imóvel.
          </h2>
          <p className="mt-4 text-base text-ink-muted">
            Em até 1 dia útil um especialista entra em contato com uma estimativa
            de receita personalizada — sem compromisso.
          </p>
        </div>

        <div className="mt-12">
          <LeadForm />
        </div>
      </div>
    </section>
  )
}
