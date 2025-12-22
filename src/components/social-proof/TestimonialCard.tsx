import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Star,
  CheckCircle2,
  PlayCircle,
  Award,
  MapPin,
  Clock,
  BookOpen,
  TrendingUp,
} from "lucide-react";

export interface Testimonial {
  id: string;
  name: string;
  avatar_url?: string;
  role?: string; // "Estudante", "Profissional", "Professor"
  age?: number;
  location?: string; // "São Paulo, BR"

  // Conteúdo
  rating: 1 | 2 | 3 | 4 | 5; // Estrelas
  title: string; // "Consegui meu emprego dos sonhos!"
  text: string; // Depoimento completo

  // Antes/Depois (MUITO IMPORTANTE!)
  before: string; // "Não conseguia pedir comida em inglês"
  after: string; // "Fiz entrevista em inglês e passei!"

  // Social proof
  verified: boolean; // Badge de verificado
  video_url?: string; // URL do vídeo depoimento
  image_url?: string; // Foto do resultado (certificado, etc)

  // Métricas
  days_using: number; // Quantos dias na plataforma
  lessons_completed: number;
  level_start: string; // "A1"
  level_current: string; // "B1"

  // Meta
  created_at: Date;
  featured: boolean; // Destacar na home
  platform: "web" | "mobile" | "both";
}

interface TestimonialCardProps {
  testimonial: Testimonial;
  onVideoClick?: (testimonial: Testimonial) => void;
}

const renderStars = (rating: number) => {
  return Array.from({ length: 5 }, (_, index) => (
    <Star
      key={index}
      className={
        "w-4 h-4 " +
        (index < rating
          ? "fill-primary text-primary drop-shadow-sm"
          : "text-muted-foreground/40")
      }
    />
  ));
};

export const TestimonialCard = ({ testimonial, onVideoClick }: TestimonialCardProps) => {
  const hasVideo = Boolean(testimonial.video_url);
  const hasImage = Boolean(testimonial.image_url);

  const initials = testimonial.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card
      className={`relative overflow-hidden border-border/60 bg-card/80 backdrop-blur-sm shadow-sm hover:shadow-elevated transition-all duration-300 group ${
        testimonial.featured ? "ring-2 ring-primary/60 shadow-elevated" : ""
      }`}
    >
      {/* Glow highlight for featured testimonials */}
      {testimonial.featured && (
        <div className="pointer-events-none absolute inset-x-0 -top-24 h-40 bg-gradient-to-b from-primary/15 via-primary/5 to-transparent" />
      )}

      <CardContent className="relative p-5 md:p-6 flex flex-col gap-4">
        {/* Header: avatar + basic info */}
        <div className="flex items-start gap-4">
          <Avatar className="h-11 w-11 border border-border/60 shadow-sm">
            {testimonial.avatar_url && (
              <AvatarImage
                src={testimonial.avatar_url}
                alt={`Foto de ${testimonial.name}`}
                className="object-cover"
              />
            )}
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-sm md:text-base text-foreground truncate flex items-center gap-1.5">
                {testimonial.name}
                {testimonial.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                    <CheckCircle2 className="h-3 w-3" />
                    Verificado
                  </span>
                )}
              </p>

              {testimonial.featured && (
                <Badge className="bg-primary text-primary-foreground text-[10px] md:text-xs shadow-sm">
                  <Award className="mr-1 h-3 w-3" /> Caso de sucesso
                </Badge>
              )}
            </div>

            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {(testimonial.role || testimonial.age) && (
                <span>
                  {testimonial.role}
                  {testimonial.role && testimonial.age ? ", " : ""}
                  {testimonial.age ? `${testimonial.age} anos` : ""}
                </span>
              )}

              {testimonial.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {testimonial.location}
                </span>
              )}
            </div>

            <div className="mt-2 flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">{renderStars(testimonial.rating)}</div>
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground/80">
                {testimonial.rating.toFixed(1)} / 5.0
              </span>
            </div>
          </div>
        </div>

        {/* Main testimonial content */}
        <div className="space-y-2">
          <h3 className="text-sm md:text-base font-semibold text-foreground leading-snug">
            {testimonial.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-5">
            {testimonial.text}
          </p>
        </div>

        {/* Before / After comparison */}
        <div className="grid gap-3 rounded-lg bg-muted/60 p-3 md:p-4 text-xs md:text-sm">
          <div className="flex gap-2">
            <span className="mt-0.5 h-5 w-5 flex items-center justify-center rounded-full bg-destructive/10 text-[11px] font-semibold text-destructive">
              -
            </span>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground/80">
                Antes
              </p>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                {testimonial.before}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <span className="mt-0.5 h-5 w-5 flex items-center justify-center rounded-full bg-emerald-500/10 text-[11px] font-semibold text-emerald-500">
              +
            </span>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground/80">
                Depois
              </p>
              <p className="text-xs md:text-sm text-foreground leading-relaxed">
                {testimonial.after}
              </p>
            </div>
          </div>
        </div>

        {/* Metrics row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] md:text-xs text-muted-foreground">
          <div className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {testimonial.days_using} dias de MyEnglish
          </div>
          <div className="inline-flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            {testimonial.lessons_completed} lições concluídas
          </div>
          <div className="inline-flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {testimonial.level_start} → {testimonial.level_current}
          </div>
        </div>

        {/* Media / CTA area */}
        {(hasVideo || hasImage) && (
          <div className="mt-1 flex flex-col gap-2">
            {hasImage && (
              <div className="relative overflow-hidden rounded-md border border-border/60 bg-background/40 p-3 text-[11px] text-muted-foreground">
                {/* A imagem em si deve ser renderizada pelo componente pai com <img /> ou <NextImage /> para melhor controle */}
                <p className="font-medium text-foreground mb-0.5">
                  Resultado real
                </p>
                <p className="line-clamp-2">
                  Certificado, print ou conquista compartilhada pelo aluno.
                </p>
              </div>
            )}

            {hasVideo && (
              <Button
                type="button"
                variant="outline"
                className="inline-flex w-full items-center justify-center gap-2 border-primary/40 text-primary hover:bg-primary/10 hover:text-primary"
                onClick={() => onVideoClick?.(testimonial)}
              >
                <PlayCircle className="h-4 w-4" />
                Ver vídeo depoimento
              </Button>
            )}
          </div>
        )}

        {/* Platform hint */}
        <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground/80">
          <span>
            Usa no:
            {" "}
            {testimonial.platform === "both"
              ? "web e mobile"
              : testimonial.platform === "web"
                ? "web"
                : "mobile"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
