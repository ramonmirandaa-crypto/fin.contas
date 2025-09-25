import type { LucideIcon } from 'lucide-react';

interface Highlight {
  icon: LucideIcon;
  title: string;
  description: string;
  accent?: string;
}

interface FeatureHighlightsProps {
  items: Highlight[];
}

export default function FeatureHighlights({ items }: FeatureHighlightsProps) {
  return (
    <section aria-labelledby="feature-highlights" className="relative">
      <div className="mb-12 flex flex-col gap-4 text-left">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] text-emerald-600">
          Experiências Financeiras
        </span>
        <div className="max-w-2xl">
          <h2 id="feature-highlights" className="text-3xl font-semibold text-slate-900 sm:text-4xl">
            Tudo o que você precisa para navegar seu dinheiro com clareza
          </h2>
          <p className="mt-4 text-base text-slate-600">
            Explore camadas de informações, automações inteligentes e uma visão unificada das suas contas em um fluxo contínuo.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {items.map(({ icon: Icon, title, description, accent }) => (
          <article
            key={title}
            className="group relative overflow-hidden rounded-3xl border border-emerald-100/60 bg-white p-6 text-left shadow-lg transition-transform hover:-translate-y-1 hover:shadow-2xl"
          >
            <div
              className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              aria-hidden="true"
              style={{
                background: accent || 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(20, 184, 166, 0.1))',
              }}
            />
            <div className="relative flex flex-col gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-700 shadow-inner">
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              <p className="text-sm text-slate-600">{description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
