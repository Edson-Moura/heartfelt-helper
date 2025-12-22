import { Header } from "@/components/Header";
import { TestimonialSection as LandingTestimonialSection } from "@/components/social-proof/TestimonialSection";
import { TESTIMONIALS } from "@/data/testimonials";
import { useMemo, useState } from "react";

const LEVEL_FILTERS = [
  { label: "Todos os níveis", value: "all" },
  { label: "Iniciante", value: "beginner" },
  { label: "Intermediário", value: "intermediate" },
  { label: "Avançado", value: "advanced" },
] as const;

const GOAL_FILTERS = [
  { label: "Todos os objetivos", value: "all" },
  { label: "Trabalho", value: "work" },
  { label: "Viagem", value: "travel" },
  { label: "Estudo", value: "study" },
  { label: "Hobby", value: "hobby" },
] as const;

const RATING_FILTERS = [
  { label: "Todas as notas", value: "all" },
  { label: "4.5+", value: "4.5" },
  { label: "5.0", value: "5" },
] as const;

type LevelFilterValue = (typeof LEVEL_FILTERS)[number]["value"];
type GoalFilterValue = (typeof GOAL_FILTERS)[number]["value"];
type RatingFilterValue = (typeof RATING_FILTERS)[number]["value"];

// Mapeia objetivos manualmente com base no contexto do depoimento
const goalsByTestimonialId: Record<string, GoalFilterValue> = {
  "1": "work",
  "2": "work",
  "3": "work",
  "4": "hobby",
  "5": "study",
  "6": "work",
  "7": "travel",
  "8": "study",
  "9": "hobby",
  "10": "study",
  "11": "work",
  "12": "work",
};

// Mapeia níveis de forma simples a partir do texto (A/B/C)
function getLevelCategory(level?: string | null): LevelFilterValue {
  if (!level) return "all";
  if (level.startsWith("A")) return "beginner";
  if (level.startsWith("B")) return "intermediate";
  if (level.startsWith("C")) return "advanced";
  return "all";
}

const PAGE_SIZE = 6;

const WallOfLove = () => {
  const [levelFilter, setLevelFilter] = useState<LevelFilterValue>("all");
  const [goalFilter, setGoalFilter] = useState<GoalFilterValue>("all");
  const [ratingFilter, setRatingFilter] = useState<RatingFilterValue>("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    return TESTIMONIALS.filter((t) => {
      const levelCat = getLevelCategory(t.level_start);
      const goal = goalsByTestimonialId[t.id] ?? "all";

      if (levelFilter !== "all" && levelCat !== levelFilter) return false;
      if (goalFilter !== "all" && goal !== goalFilter) return false;

      if (ratingFilter === "4.5" && t.rating < 4.5) return false;
      if (ratingFilter === "5" && t.rating !== 5) return false;

      return true;
    });
  }, [levelFilter, goalFilter, ratingFilter]);

  const visible = filtered.slice(0, visibleCount);
  const canLoadMore = visibleCount < filtered.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      <main className="container mx-auto px-4 py-10 space-y-10">
        <section className="text-center space-y-4">
          <p className="inline-flex items-center justify-center rounded-full bg-primary/10 px-4 py-1 text-xs font-medium text-primary">
            Depoimentos Reais de Alunos MyEnglish
          </p>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
            O Que Nossos Alunos Dizem
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore histórias reais de brasileiros que destravaram o inglês com a ajuda da IA do MyEnglish.
          </p>
        </section>

        {/* Filtros */}
        <section className="rounded-3xl border border-border/60 bg-background/80 px-4 py-4 md:px-6 md:py-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <span className="text-xs md:text-sm font-medium text-muted-foreground">
            Filtre por nível, objetivo e avaliação para encontrar histórias parecidas com a sua.
          </span>
          <div className="flex flex-wrap gap-3 text-xs md:text-sm">
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as LevelFilterValue)}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-xs md:text-sm"
            >
              {LEVEL_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
            <select
              value={goalFilter}
              onChange={(e) => setGoalFilter(e.target.value as GoalFilterValue)}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-xs md:text-sm"
            >
              {GOAL_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value as RatingFilterValue)}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-xs md:text-sm"
            >
              {RATING_FILTERS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Grid de depoimentos reutilizando o layout existente */}
        <section className="space-y-6">
          <LandingTestimonialSection />
        </section>

        {/* CTA para enviar depoimento */}
        <section className="rounded-3xl border border-primary/20 bg-primary/5 px-6 py-8 text-center space-y-3">
          <h2 className="text-xl md:text-2xl font-semibold text-foreground">
            Seja o próximo a conquistar fluência
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
            Comece hoje mesmo a praticar com a IA do MyEnglish e escreva o seu próprio depoimento de conquista em poucas semanas.
          </p>
          <a
            href="/pricing"
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow-elevated hover:shadow-glow transition-shadow"
          >
            Começar agora
          </a>
        </section>
      </main>
    </div>
  );
};

export default WallOfLove;
