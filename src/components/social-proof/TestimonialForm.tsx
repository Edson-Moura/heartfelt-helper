import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

const testimonialSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Digite seu nome completo")
    .max(120, "Nome muito longo"),
  email: z
    .string()
    .trim()
    .email("Digite um e-mail válido")
    .max(255, "E-mail muito longo"),
  rating: z.number().min(1, "Escolha uma nota de 1 a 5").max(5),
  title: z
    .string()
    .trim()
    .min(5, "Título muito curto")
    .max(120, "Título muito longo"),
  text: z
    .string()
    .trim()
    .min(30, "Conte pelo menos um pouco da sua história")
    .max(1500, "Texto muito longo"),
  before: z
    .string()
    .trim()
    .min(10, "Descreva como era antes")
    .max(400, "Texto muito longo"),
  after: z
    .string()
    .trim()
    .min(10, "Descreva como está agora")
    .max(400, "Texto muito longo"),
  videoUrl: z
    .string()
    .trim()
    .url("Informe um link de vídeo válido")
    .max(500, "URL muito longa")
    .optional()
    .or(z.literal("")),
  acceptPublicUse: z.literal(true, {
    errorMap: () => ({ message: "É necessário aceitar o uso público do depoimento" }),
  }),
});

export type TestimonialFormValues = z.infer<typeof testimonialSchema>;

interface TestimonialFormProps {
  className?: string;
  onSubmitted?: (data: TestimonialFormValues) => void;
}

export function TestimonialForm({ className, onSubmitted }: TestimonialFormProps) {
  const [values, setValues] = useState<TestimonialFormValues>({
    name: "",
    email: "",
    rating: 5,
    title: "",
    text: "",
    before: "",
    after: "",
    videoUrl: "",
    acceptPublicUse: false as unknown as true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    field: keyof TestimonialFormValues,
    value: string | number | boolean,
  ) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    const result = testimonialSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as string;
        if (!fieldErrors[path]) fieldErrors[path] = issue.message;
      });
      setErrors(fieldErrors);
      setSubmitting(false);
      return;
    }

    try {
      // Aqui futuramente chamaremos o SocialProofService.submitTestimonial
      setSubmitted(true);
      onSubmitted?.(result.data);
    } finally {
      setSubmitting(false);
    }
  };

  const ratingValue = values.rating ?? 0;

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "space-y-6 rounded-3xl border border-border/60 bg-background/80 px-4 py-5 md:px-6 md:py-6 shadow-elevated",
        className,
      )}
    >
      <div className="space-y-1">
        <h3 className="text-lg md:text-xl font-semibold text-foreground">
          Envie seu depoimento
        </h3>
        <p className="text-xs md:text-sm text-muted-foreground max-w-xl">
          Conte para outros alunos como o MyEnglish está ajudando você a destravar o inglês.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Nome completo</label>
          <Input
            value={values.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Como gostaria que aparecesse no site"
          />
          {errors.name && <p className="text-[11px] text-destructive">{errors.name}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            E-mail (usado apenas para verificar se é aluno)
          </label>
          <Input
            type="email"
            value={values.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="seuemail@exemplo.com"
          />
          {errors.email && <p className="text-[11px] text-destructive">{errors.email}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Nota (1 a 5 estrelas)</label>
        <div className="flex items-center gap-2">
          {Array.from({ length: 5 }).map((_, index) => {
            const starValue = index + 1;
            const active = starValue <= ratingValue;
            return (
              <button
                type="button"
                key={starValue}
                onClick={() => handleChange("rating", starValue)}
                className="group"
              >
                <Star
                  className={cn(
                    "h-6 w-6 transition-colors",
                    active
                      ? "text-amber-400 fill-amber-300/80"
                      : "text-muted-foreground/40 group-hover:text-muted-foreground/80",
                  )}
                />
              </button>
            );
          })}
          <span className="ml-2 text-xs text-muted-foreground">
            {ratingValue.toFixed(1).replace(".", ",")}/5
          </span>
        </div>
        {errors.rating && <p className="text-[11px] text-destructive">{errors.rating}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Título do depoimento</label>
        <Input
          value={values.title}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="Ex: Consegui meu emprego dos sonhos no exterior"
        />
        {errors.title && <p className="text-[11px] text-destructive">{errors.title}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Texto completo</label>
        <Textarea
          rows={5}
          value={values.text}
          onChange={(e) => handleChange("text", e.target.value)}
          placeholder="Conte em detalhes como era sua relação com o inglês, como você usa o MyEnglish e quais resultados já percebeu."
        />
        {errors.text && <p className="text-[11px] text-destructive">{errors.text}</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Antes</label>
          <Textarea
            rows={3}
            value={values.before}
            onChange={(e) => handleChange("before", e.target.value)}
            placeholder="Ex: travava em entrevistas, precisava de legenda em tudo, evitava falar em público..."
          />
          {errors.before && <p className="text-[11px] text-destructive">{errors.before}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Depois</label>
          <Textarea
            rows={3}
            value={values.after}
            onChange={(e) => handleChange("after", e.target.value)}
            placeholder="Ex: fiz entrevista em inglês, assisto séries sem legenda, apresento projetos para o time global..."
          />
          {errors.after && <p className="text-[11px] text-destructive">{errors.after}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Link de vídeo (opcional)
        </label>
        <Input
          value={values.videoUrl ?? ""}
          onChange={(e) => handleChange("videoUrl", e.target.value)}
          placeholder="Cole um link de vídeo (YouTube, Loom, etc.) se quiser aparecer em vídeo também"
        />
        {errors.videoUrl && <p className="text-[11px] text-destructive">{errors.videoUrl}</p>}
      </div>

      <div className="flex items-start gap-2 rounded-2xl bg-muted/60 px-3 py-2.5 text-[11px] md:text-xs">
        <input
          id="accept-public-use"
          type="checkbox"
          className="mt-0.5 h-3.5 w-3.5 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
          checked={values.acceptPublicUse === true}
          onChange={(e) =>
            handleChange("acceptPublicUse", e.target.checked as unknown as true)
          }
        />
        <label htmlFor="accept-public-use" className="cursor-pointer text-muted-foreground">
          Autorizo o uso deste depoimento (texto e opcionalmente vídeo) nas páginas e materiais
          de divulgação do MyEnglish.
        </label>
      </div>
      {errors.acceptPublicUse && (
        <p className="text-[11px] text-destructive">{errors.acceptPublicUse}</p>
      )}

      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="text-[11px] md:text-xs text-muted-foreground max-w-xs">
          Ao enviar seu depoimento, nossa equipe irá revisar o conteúdo antes de publicar. Você
          pode solicitar a remoção a qualquer momento.
        </div>
        <Button type="submit" size="lg" disabled={submitting} className="px-6 text-sm">
          {submitting ? "Enviando..." : "Enviar meu depoimento"}
        </Button>
      </div>

      {submitted && (
        <div className="mt-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-[11px] md:text-xs text-emerald-700 dark:text-emerald-300">
          <p className="font-medium">Obrigado! Vamos revisar e publicar em breve. 🎉</p>
          <p className="mt-0.5">
            Como agradecimento, você poderá ganhar +100 XP ou 1 dia de Premium grátis na sua conta
            após a aprovação do depoimento.
          </p>
        </div>
      )}
    </form>
  );
}
