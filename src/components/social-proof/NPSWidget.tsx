import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface NPSWidgetProps {
  userId: string;
  daysUsing: number;
  lessonsCompleted: number;
  hasAnsweredBefore?: boolean;
  className?: string;
  onOpenTestimonialForm?: () => void;
  onSubmit?: (payload: { score: number; feedback?: string }) => void;
}

export function NPSWidget({
  userId,
  daysUsing,
  lessonsCompleted,
  hasAnsweredBefore = false,
  className,
  onOpenTestimonialForm,
  onSubmit,
}: NPSWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (hasAnsweredBefore || !userId) return;

    const meetsUsage = daysUsing >= 7 || lessonsCompleted >= 10;
    if (!meetsUsage) return;

    const timer = setTimeout(() => setIsOpen(true), 3000);
    return () => clearTimeout(timer);
  }, [userId, daysUsing, lessonsCompleted, hasAnsweredBefore]);

  const handleScoreClick = (value: number) => {
    setScore(value);
  };

  const handleSubmit = () => {
    if (score === null) return;
    onSubmit?.({ score, feedback: feedback.trim() || undefined });
    setSubmitted(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!isOpen) return null;

  const isPromoter = score !== null && score >= 9;
  const isDetractor = score !== null && score <= 6;

  return (
    <div
      className={cn(
        "fixed bottom-4 left-1/2 z-40 w-full max-w-md -translate-x-1/2 px-3 md:left-auto md:right-6 md:translate-x-0",
        className,
      )}
    >
      <div className="rounded-3xl border border-border/60 bg-background/95 px-4 py-4 shadow-elevated backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-primary">
              Queremos ouvir você
            </p>
            <p className="text-sm font-semibold text-foreground">
              De 0 a 10, quanto você recomendaria o MyEnglish para um amigo?
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-xs text-muted-foreground/70 hover:text-muted-foreground"
          >
            fechar
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {Array.from({ length: 11 }).map((_, index) => {
            const value = index;
            const active = score === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => handleScoreClick(value)}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border text-xs transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary/70 hover:text-foreground",
                )}
              >
                {value}
              </button>
            );
          })}
        </div>

        {score !== null && (
          <div className="mt-3 space-y-2 text-xs text-muted-foreground">
            {isPromoter && (
              <p className="font-medium text-emerald-600 dark:text-emerald-300">
                Que ótimo! Quer deixar um depoimento público?
              </p>
            )}
            {!isPromoter && !isDetractor && (
              <p className="font-medium">
                Obrigado! Como podemos melhorar para virar um 10/10 para você?
              </p>
            )}
            {isDetractor && (
              <p className="font-medium text-destructive">
                Sentimos muito! O que aconteceu? Sua resposta ajuda a melhorar o MyEnglish.
              </p>
            )}

            {(isDetractor || (!isPromoter && !isDetractor)) && (
              <Textarea
                rows={2}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Conte rapidamente o que poderíamos melhorar."
                className="mt-1 text-xs"
              />
            )}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="text-[10px] text-muted-foreground max-w-[60%]">
            Suas respostas são confidenciais e ajudam a melhorar a experiência de todos os alunos.
          </p>
          <div className="flex items-center gap-2">
            {isPromoter && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  onOpenTestimonialForm?.();
                  handleClose();
                }}
              >
                Deixar depoimento
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              className="text-xs px-3"
              disabled={score === null}
              onClick={() => {
                handleSubmit();
                handleClose();
              }}
            >
              Enviar
            </Button>
          </div>
        </div>

        {submitted && (
          <p className="mt-2 text-[10px] text-emerald-600 dark:text-emerald-300">
            Obrigado! Seu feedback foi enviado.
          </p>
        )}
      </div>
    </div>
  );
}
