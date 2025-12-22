import { Header } from "@/components/Header";
import { PricingSection } from "@/components/PricingSection";
import { TestimonialSection as LandingTestimonialSection } from "@/components/social-proof/TestimonialSection";
import { AvatarGroup, type AvatarUser } from "@/components/social-proof/AvatarGroup";

const recentSubscribers: AvatarUser[] = [
  { id: "1", name: "Ana Silva", avatar_url: "/avatars/ana.jpg" },
  { id: "2", name: "Bruno Costa", avatar_url: "/avatars/bruno.jpg" },
  { id: "3", name: "Carla Mendes", avatar_url: "/avatars/carla.jpg" },
  { id: "4", name: "Diego Rocha", avatar_url: "/avatars/diego.jpg" },
  { id: "5", name: "Gabriela Santos", avatar_url: "/avatars/gabriela.jpg" },
];

const Pricing = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      <main className="container mx-auto px-4 py-8 space-y-10">
        {/* Banner de urgência */}
        <div className="mb-4 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-center text-sm font-medium text-primary shadow-sm">
          🔥 197 pessoas assinaram o MyEnglish Premium nesta semana
        </div>

        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold">
            Escolha Seu {""}
            <span className="bg-gradient-hero bg-clip-text text-transparent">Plano</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Desbloqueie todo o potencial do seu aprendizado de inglês com nossos planos premium.
          </p>
        </div>

        {/* Cards de preço com social proof abaixo */}
        <section className="space-y-4">
          <PricingSection />

          <div className="mx-auto max-w-xl rounded-2xl border border-border/60 bg-background/60 px-4 py-3 text-xs md:text-sm text-muted-foreground flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="font-semibold text-foreground">
                ⭐ 4,8/5 — Avaliado por mais de 1.200 alunos
              </div>
              <p className="text-[11px] md:text-xs">
                Dados coletados dos alunos ativos nos últimos 6 meses.
              </p>
            </div>
            <AvatarGroup
              users={recentSubscribers}
              max={5}
              showCount
              className="justify-center md:justify-end"
            />
          </div>
        </section>

        {/* Seção de garantia */}
        <section className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-center rounded-3xl border border-border/60 bg-gradient-to-r from-background to-background/90 px-6 py-6 md:px-8 md:py-8 shadow-elevated">
          <div className="space-y-2 md:space-y-3">
            <h2 className="text-xl md:text-2xl font-semibold text-foreground">
              Garantia de 7 Dias — teste sem risco
            </h2>
            <p className="text-sm md:text-base text-muted-foreground">
              Se em até 7 dias você sentir que o MyEnglish não é para você, devolvemos 100% do valor, sem perguntas.
            </p>
            <p className="text-xs text-muted-foreground/80">
              Basta enviar um e-mail dentro do período de garantia que faremos o reembolso integral.
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-xs md:text-sm text-emerald-700 dark:text-emerald-300">
            <p className="font-semibold">
              “Pedi reembolso e fui atendido em menos de 24h. Acabei voltando para o plano anual depois.”
            </p>
            <p className="mt-1 text-[11px] md:text-xs opacity-90">
              — Aluno MyEnglish Premium, garantia utilizada sem burocracia.
            </p>
          </div>
        </section>

        {/* Depoimentos focados em quem assinou o Premium */}
        <section className="pt-4 border-t border-border/40">
          <div className="mb-6 text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground">
              Por que eles assinaram o Premium
            </h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
              Histórias reais de alunos que decidiram investir na fluência e hoje colhem resultados no trabalho, nas viagens e nos estudos.
            </p>
          </div>

          <LandingTestimonialSection />
        </section>
      </main>
    </div>
  );
};

export default Pricing;
