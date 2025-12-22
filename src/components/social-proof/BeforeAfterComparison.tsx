import { cn } from "@/lib/utils";

interface ComparisonItem {
  before: string;
  after: string;
}

interface BeforeAfterComparisonProps {
  title?: string;
  subtitle?: string;
  items?: ComparisonItem[];
  className?: string;
}

const DEFAULT_ITEMS: ComparisonItem[] = [
  {
    before: "Não conseguia pedir comida em inglês",
    after: "Peço em inglês com confiança em qualquer restaurante",
  },
  {
    before: "Assistia séries sempre com legenda em português",
    after: "Já assisto séries e filmes em inglês sem legenda",
  },
  {
    before: "Travava para falar com nativos e em reuniões",
    after: "Consigo conversar com nativos e participar de reuniões",
  },
];

export function BeforeAfterComparison({
  title = "Antes · Depois",
  subtitle = "Veja a transformação real que alunos estão tendo com o MyEnglish",
  items = DEFAULT_ITEMS,
  className,
}: BeforeAfterComparisonProps) {
  return (
    <section
      className={cn(
        "mx-auto mt-10 max-w-4xl rounded-2xl border bg-card/80 p-4 shadow-sm backdrop-blur-sm md:mt-14 md:p-6",
        "animate-fade-in",
        className,
      )}
      aria-label="Comparativo antes e depois dos resultados dos alunos"
    >
      <header className="mb-4 text-left md:mb-6">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Resultados concretos
        </p>
        <h3 className="mt-1 text-lg font-semibold tracking-tight text-foreground md:text-xl">
          {title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground md:text-base">
          {subtitle}
        </p>
      </header>

      <div className="grid gap-4 rounded-xl bg-muted/70 p-4 text-sm md:grid-cols-2 md:p-5">
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-destructive">
            Antes
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {items.map((item, index) => (
              <li key={`before-${index}`} className="flex items-start gap-2">
                <span className="mt-1 h-4 w-4 flex items-center justify-center rounded-full bg-destructive/10 text-[10px] font-semibold text-destructive">
                  ×
                </span>
                <span>{item.before}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-500">
            Depois
          </h4>
          <ul className="space-y-2 text-sm text-foreground">
            {items.map((item, index) => (
              <li key={`after-${index}`} className="flex items-start gap-2">
                <span className="mt-1 h-4 w-4 flex items-center justify-center rounded-full bg-emerald-500/10 text-[10px] font-semibold text-emerald-500">
                  +
                </span>
                <span>{item.after}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
