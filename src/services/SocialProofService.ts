import type { Testimonial } from "@/components/social-proof/TestimonialCard";
import { TESTIMONIALS } from "@/data/testimonials";

export interface TestimonialFilters {
  level?: "beginner" | "intermediate" | "advanced";
  minRating?: number;
}

export interface LiveStats {
  activeStudents: number;
  lessonsCompletedToday: number;
  averageRating: number;
  premiumSubscribersThisWeek: number;
}

export interface Activity {
  id: string;
  type: "subscription" | "lesson_completed" | "testimonial";
  message: string;
  createdAt: Date;
  location?: string;
}

export interface TestimonialInput {
  name: string;
  email: string;
  rating: number;
  title: string;
  text: string;
  before: string;
  after: string;
  videoUrl?: string;
  acceptPublicUse: boolean;
}

export class SocialProofService {
  async getTestimonials(filters?: TestimonialFilters): Promise<Testimonial[]> {
    let data = [...TESTIMONIALS];

    if (filters?.minRating) {
      data = data.filter((t) => t.rating >= filters.minRating!);
    }

    if (filters?.level) {
      data = data.filter((t) =>
        t.level_start?.startsWith("A") && filters.level === "beginner"
          ? true
          : t.level_start?.startsWith("B") && filters.level === "intermediate"
          ? true
          : t.level_start?.startsWith("C") && filters.level === "advanced"
          ? true
          : false,
      );
    }

    return data;
  }

  async getLiveStats(): Promise<LiveStats> {
    // Valores simulados por enquanto; substituir por consultas Supabase depois
    return {
      activeStudents: 2847,
      lessonsCompletedToday: 612,
      averageRating: 4.8,
      premiumSubscribersThisWeek: 197,
    };
  }

  async getRecentActivities(): Promise<Activity[]> {
    const now = new Date();
    return [
      {
        id: "1",
        type: "subscription",
        message: "João de Porto Alegre acabou de assinar o plano Premium",
        createdAt: new Date(now.getTime() - 3 * 60 * 1000),
        location: "Porto Alegre, BR",
      },
      {
        id: "2",
        type: "lesson_completed",
        message: "Ana concluiu a lição 'Entrevistas de Emprego'",
        createdAt: new Date(now.getTime() - 8 * 60 * 1000),
        location: "São Paulo, BR",
      },
      {
        id: "3",
        type: "testimonial",
        message: "Mariana deixou um novo depoimento sobre o plano Premium",
        createdAt: new Date(now.getTime() - 15 * 60 * 1000),
        location: "Rio de Janeiro, BR",
      },
    ];
  }

  async submitTestimonial(_data: TestimonialInput): Promise<void> {
    // Futuramente: enviar para Supabase / função edge para moderação
    // No momento apenas simulamos o sucesso
    return;
  }

  async getNPSScore(): Promise<number> {
    // Valor médio simulado; depois podemos calcular a partir de respostas reais
    return 72; // NPS 72 é típico de produtos muito bem avaliados
  }

  async submitNPS(
    _userId: string,
    _score: number,
    _feedback?: string,
  ): Promise<void> {
    // Futuramente: persistir em uma tabela NPS no Supabase
    return;
  }
}

export const socialProofService = new SocialProofService();
