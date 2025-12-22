import { useEffect, useMemo, useState } from "react";
import { TestimonialCard, type Testimonial } from "@/components/social-proof/TestimonialCard";
import { VideoTestimonialModal } from "@/components/social-proof/VideoTestimonialModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Users } from "lucide-react";

// Extende o modelo base de depoimento com a categoria de nível
// para uso interno de filtro na seção
export type LevelCategory = "all" | "beginner" | "intermediate" | "advanced";

type ExtendedTestimonial = Testimonial & {
  levelCategory: Exclude<LevelCategory, "all">;
  transcript?: string;
};

const TESTIMONIALS: ExtendedTestimonial[] = [
  {
    id: "1",
    name: "Ana Silva",
    role: "Estudante",
    age: 24,
    location: "São Paulo, BR",
    rating: 5,
    title: "Consegui meu emprego dos sonhos!",
    text:
      "Eu morria de medo de entrevistas em inglês. Depois de 45 dias praticando todo dia com o MyEnglish, fiz uma entrevista completa em inglês e fui aprovada!",
    before: "Não conseguia me apresentar em inglês em entrevistas.",
    after: "Participei de uma entrevista 100% em inglês e passei para a vaga.",
    verified: true,
    video_url: "https://www.w3schools.com/html/mov_bbb.mp4",
    image_url: undefined,
    days_using: 45,
    lessons_completed: 32,
    level_start: "A2",
    level_current: "B1",
    created_at: new Date("2024-01-10"),
    featured: true,
    platform: "both",
    levelCategory: "intermediate",
    transcript:
      "Antes eu travava em qualquer entrevista em inglês. Com as simulações de entrevista e as conversas guiadas, ganhei confiança e hoje trabalho em uma multinacional.",
  },
  {
    id: "2",
    name: "Bruno Costa",
    role: "Analista de TI",
    age: 29,
    location: "Curitiba, BR",
    rating: 5,
    title: "De iniciante absoluto a reuniões em inglês",
    text:
      "Comecei do zero e em 3 meses já estava participando das reuniões com o time global sem pânico. As lições curtas encaixam perfeito na minha rotina.",
    before: "Precisava de tradução para todos os e‑mails em inglês.",
    after: "Hoje escrevo e participo de reuniões em inglês com segurança.",
    verified: true,
    video_url: undefined,
    image_url: undefined,
    days_using: 90,
    lessons_completed: 68,
    level_start: "A1",
    level_current: "B1",
    created_at: new Date("2024-02-02"),
    featured: false,
    platform: "web",
    levelCategory: "beginner",
  },
  {
    id: "3",
    name: "Carla Mendes",
    role: "Gerente de Marketing",
    age: 34,
    location: "Rio de Janeiro, BR",
    rating: 5,
    title: "Apresentei um projeto inteiro em inglês",
    text:
      "Sempre delegava apresentações em inglês. Depois de treinar apresentações reais com o MyEnglish, consegui apresentar um projeto global sozinha e fui elogiada.",
    before: "Travava sempre que precisava falar em público em inglês.",
    after: "Apresentei um projeto global em inglês para a diretoria.",
    verified: true,
    video_url: "https://www.w3schools.com/html/mov_bbb.mp4",
    image_url: undefined,
    days_using: 60,
    lessons_completed: 41,
    level_start: "B1",
    level_current: "B2",
    created_at: new Date("2024-03-15"),
    featured: true,
    platform: "both",
    levelCategory: "intermediate",
    transcript:
      "Treinei várias vezes a mesma apresentação com feedback em tempo real. Quando chegou o dia, parecia que eu já tinha feito aquilo dezenas de vezes.",
  },
  {
    id: "4",
    name: "Diego Rocha",
    role: "Professor de inglês",
    age: 31,
    location: "Porto Alegre, BR",
    rating: 5,
    title: "Ferramenta perfeita para manter a fluência",
    text:
      "Já falava bem inglês, mas queria manter a fluência com temas mais avançados. As conversas com IA são muito mais desafiadoras do que os apps tradicionais.",
    before: "Sentia que meu inglês avançado estava enferrujando.",
    after: "Hoje pratico discussões avançadas sobre trabalho e atualidades.",
    verified: true,
    video_url: undefined,
    image_url: undefined,
    days_using: 120,
    lessons_completed: 54,
    level_start: "C1",
    level_current: "C1",
    created_at: new Date("2023-12-20"),
    featured: false,
    platform: "web",
    levelCategory: "advanced",
  },
  {
    id: "5",
    name: "Mariana Lopes",
    role: "Estudante de Medicina",
    age: 22,
    location: "São Paulo, BR",
    rating: 5,
    title: "Passei em uma prova de proficiência internacional",
    text:
      "Usei o MyEnglish focada em leitura e vocabulário médico. Em 2 meses passei na prova de proficiência que precisava para o intercâmbio.",
    before: "Não conseguia entender artigos médicos em inglês.",
    after: "Leio artigos complexos e tirei nota acima do necessário na prova.",
    verified: true,
    video_url: undefined,
    image_url: undefined,
    days_using: 75,
    lessons_completed: 57,
    level_start: "B1",
    level_current: "B2",
    created_at: new Date("2024-04-05"),
    featured: false,
    platform: "mobile",
    levelCategory: "intermediate",
  },
  {
    id: "6",
    name: "João Pereira",
    role: "Empreendedor",
    age: 38,
    location: "Lisboa, PT",
    rating: 5,
    title: "Negociando com clientes do mundo todo",
    text:
      "Minha empresa começou a atender clientes fora do Brasil e eu precisava me comunicar melhor. Hoje faço chamadas de vendas em inglês com confiança.",
    before: "Dependia de tradutor em todas as reuniões internacionais.",
    after: "Conduzo reuniões de vendas em inglês sozinho.",
    verified: true,
    video_url: "https://www.w3schools.com/html/mov_bbb.mp4",
    image_url: undefined,
    days_using: 150,
    lessons_completed: 89,
    level_start: "B1",
    level_current: "C1",
    created_at: new Date("2023-11-10"),
    featured: true,
    platform: "both",
    levelCategory: "advanced",
    transcript:
      "Comecei travando em reuniões internacionais. Hoje consigo negociar condições, explicar propostas e fechar contratos em inglês com muito mais segurança.",
  },
];

const FILTER_OPTIONS: { label: string; value: LevelCategory }[] = [
  { label: "Todos", value: "all" },
  { label: "Iniciantes", value: "beginner" },
  { label: "Intermediários", value: "intermediate" },
  { label: "Avançados", value: "advanced" },
];

const AUTO_ROTATE_INTERVAL = 5000; // 5 segundos

export const TestimonialSection = () => {
  const [filter, setFilter] = useState<LevelCategory>("all");
  const [startIndex, setStartIndex] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState<ExtendedTestimonial | null>(
    null,
  );

  const filteredTestimonials = useMemo(() => {
    if (filter === "all") return TESTIMONIALS;
    return TESTIMONIALS.filter((t) => t.levelCategory === filter);
  }, [filter]);

  // Calcula o slice de 6 depoimentos para o carrossel em grid
  const visibleTestimonials = useMemo(() => {
    if (filteredTestimonials.length <= 6) return filteredTestimonials;
    const slice: ExtendedTestimonial[] = [];

    for (let i = 0; i < 6; i++) {
      const idx = (startIndex + i) % filteredTestimonials.length;
      slice.push(filteredTestimonials[idx]);
    }

    return slice;
  }, [filteredTestimonials, startIndex]);

  useEffect(() => {
    if (filteredTestimonials.length <= 6) return;

    const timer = setInterval(() => {
      setStartIndex((prev) => (prev + 6) % filteredTestimonials.length);
    }, AUTO_ROTATE_INTERVAL);

    return () => clearInterval(timer);
  }, [filteredTestimonials.length]);

  // Resetar índice ao trocar filtro
  useEffect(() => {
    setStartIndex(0);
  }, [filter]);

  const totalStudents = 2847;

  return (
    <section className="py-16 md:py-24 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        {/* Cabeçalho */}
        <header className="max-w-3xl mx-auto text-center mb-10 md:mb-14 animate-fade-in">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            Prova social em tempo real
          </div>

          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-3">
            Alunos Reais, Resultados Reais
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
            Veja o que nossos {totalStudents.toLocaleString("pt-BR")} alunos estão
            conquistando com o MyEnglish em poucas semanas de estudo focado.
          </p>

          <div className="mt-4 inline-flex items-center justify-center gap-3 text-xs md:text-sm text-muted-foreground/80">
            <div className="inline-flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-primary" />
              4.9/5 de satisfação média
            </div>
            <span className="hidden md:inline-block">•</span>
            <span className="hidden md:inline-block">
              Atualizado semanalmente com novos resultados
            </span>
          </div>
        </header>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 md:mb-10 animate-fade-in">
          <p className="text-sm text-muted-foreground max-w-md">
            Filtre por nível para ver histórias de quem está no mesmo momento da
            jornada que você.
          </p>

          {/* Segmented control simples baseado em botões */}
          <div className="inline-flex items-center gap-1 rounded-full bg-muted/80 p-1 border border-border/60">
            {FILTER_OPTIONS.map((option) => {
              const isActive = filter === option.value;
              return (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  variant={isActive ? "default" : "ghost"}
                  className={`h-8 rounded-full px-3 text-xs md:text-sm transition-all hover-scale ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground"
                  }`}
                  onClick={() => setFilter(option.value)}
                >
                  {option.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Grid de depoimentos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 max-w-6xl mx-auto animate-fade-in">
          {visibleTestimonials.map((testimonial) => (
            <div key={testimonial.id} className="hover-scale">
              <TestimonialCard
                testimonial={testimonial}
                onVideoClick={(t) => setSelectedVideo(t as ExtendedTestimonial)}
              />
            </div>
          ))}
        </div>

        {/* Rodapé com CTA */}
        <div className="mt-10 md:mt-12 text-center animate-fade-in">
          <Badge className="bg-primary/10 text-primary border-primary/30 mb-3 text-[11px] md:text-xs">
            Atualizado com depoimentos de alunos reais
          </Badge>
          <p className="text-sm md:text-base text-muted-foreground mb-4 max-w-xl mx-auto">
            Junte‑se a milhares de brasileiros que já destravaram o inglês com
            conversas reais e lições personalizadas.
          </p>
          <Button
            type="button"
            size="lg"
            className="px-8 text-sm md:text-base shadow-elevated hover:shadow-glow transition-shadow hover-scale"
          >
            Começar meu teste grátis agora
          </Button>
        </div>

        {/* Modal de vídeo depoimento */}
        {selectedVideo && (
          <VideoTestimonialModal
            open={Boolean(selectedVideo)}
            testimonial={selectedVideo}
            transcript={selectedVideo.transcript}
            onClose={() => setSelectedVideo(null)}
          />
        )}
      </div>
    </section>
  );
};
