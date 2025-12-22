import { Testimonial } from "@/components/social-proof/TestimonialCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Share2 } from "lucide-react";

interface VideoTestimonialModalProps {
  open: boolean;
  testimonial: Testimonial;
  transcript?: string;
  onClose: () => void;
}

export const VideoTestimonialModal = ({
  open,
  testimonial,
  transcript,
  onClose,
}: VideoTestimonialModalProps) => {
  const initials = testimonial.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (!testimonial.video_url) return null;

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-3xl w-full h-[90vh] sm:h-[80vh] flex flex-col gap-4 bg-background/95 backdrop-blur-xl border-border/70 animate-enter">
        <DialogHeader className="space-y-1">
          <DialogTitle className="flex items-center gap-3 text-lg md:text-xl">
            <Avatar className="h-9 w-9 border border-border/60">
              {testimonial.avatar_url && (
                <AvatarImage
                  src={testimonial.avatar_url}
                  alt={`Foto de ${testimonial.name}`}
                  className="object-cover"
                />
              )}
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-foreground">{testimonial.name}</span>
          </DialogTitle>
          <DialogDescription className="flex flex-wrap items-center justify-between gap-2 text-xs md:text-sm text-muted-foreground">
            <span>{testimonial.title}</span>
            <span className="hidden sm:inline-flex items-center gap-1">
              <Share2 className="h-3.5 w-3.5" />
              Compartilhe esse resultado com quem também precisa destravar o inglês.
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* Player de vídeo */}
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-muted/80 border border-border/70">
          <video
            src={testimonial.video_url}
            controls
            className="h-full w-full object-cover"
          />
        </div>

        {/* Transcrição + CTA */}
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)] gap-4 md:gap-6 items-start flex-1 min-h-0">
          <div className="flex flex-col gap-2 rounded-lg bg-muted/70 p-3 md:p-4 overflow-hidden min-h-[120px]">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground/80 mb-1">
              Transcrição do depoimento
            </p>
            <div className="flex-1 overflow-y-auto pr-1 text-xs md:text-sm text-muted-foreground leading-relaxed">
              {transcript ? (
                <p>{transcript}</p>
              ) : (
                <p>
                  Este depoimento em vídeo está disponível com legendas para
                  garantir acessibilidade. Em breve adicionaremos a transcrição
                  completa aqui.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-lg bg-gradient-to-b from-primary/10 via-primary/5 to-background border border-primary/30 p-4 animate-fade-in">
            <p className="text-sm md:text-base font-semibold text-foreground">
              Quer viver um resultado como o da {testimonial.name.split(" ")[0]}?
            </p>
            <p className="text-xs md:text-sm text-muted-foreground">
              Comece agora seu teste grátis e tenha sua primeira conversa em
              inglês com IA nos próximos minutos.
            </p>

            <Button
              type="button"
              size="lg"
              className="mt-1 w-full shadow-elevated hover:shadow-glow hover-scale"
            >
              Começar meu teste grátis
            </Button>

            <div className="mt-1 flex flex-col gap-1 text-[11px] text-muted-foreground/80">
              <p>Compartilhe esse depoimento com alguém que precisa de motivação:</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-[11px] h-7 px-2"
                >
                  WhatsApp
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-[11px] h-7 px-2"
                >
                  Instagram
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-[11px] h-7 px-2"
                >
                  LinkedIn
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
