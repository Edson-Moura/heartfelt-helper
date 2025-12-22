import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { QuickAssessmentSection } from "@/components/QuickAssessmentSection";
import EbookLeadSection from "@/components/EbookLeadSection";
import { OnboardingSection } from "@/components/OnboardingSection";
import { PricingSection } from "@/components/PricingSection";
import { Footer } from "@/components/Footer";
import { StatsCounter } from "@/components/social-proof/StatsCounter";
import { LiveActivityFeed } from "@/components/social-proof/LiveActivityFeed";
import { TrustBadges } from "@/components/social-proof/TrustBadges";
import { BeforeAfterComparison } from "@/components/social-proof/BeforeAfterComparison";
import { SocialProofPopup } from "@/components/social-proof/SocialProofPopup";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useSearchParams } from "react-router-dom";
import { useEffect } from "react";

const Index = () => {
  const { user, loading } = useAuth();
  const [searchParams] = useSearchParams();

  // Handle safe redirect from external providers (Stripe, etc.)
  const redirectParam = searchParams.get('redirect');
  if (redirectParam) {
    const params = new URLSearchParams(searchParams);
    params.delete('redirect');
    const path = redirectParam.startsWith('/') ? redirectParam : `/${redirectParam}`;
    const qs = params.toString();
    return <Navigate to={qs ? `${path}?${qs}` : path} replace />;
  }

  // Handle scroll to section
  useEffect(() => {
    const scrollTo = searchParams.get('scrollTo');
    if (scrollTo) {
      const element = document.getElementById(scrollTo);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [searchParams]);

  // Redirect authenticated users to dashboard
  if (user && !loading) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      {/* Hero principal da landing */}
      <HeroSection />

      {/* Selos de confiança logo após o hero */}
      <TrustBadges />

      {/* Seção de features / problema-solução */}
      <FeaturesSection />

      {/* Antes / Depois – transformações reais */}
      <BeforeAfterComparison />

      {/* Depoimentos escritos + social proof forte */}
      <TestimonialsSection />

      {/* Bloco de estatísticas agregadas */}
      <StatsCounter className="mt-8" />

      <QuickAssessmentSection />
      <EbookLeadSection />
      <OnboardingSection />
      <PricingSection />
      <Footer />

      {/* Desktop: feed fixo no canto inferior direito */}
      <LiveActivityFeed />
      {/* Mobile: banner fixo no topo da landing, próximo aos depoimentos */}
      <LiveActivityFeed className="fixed inset-x-4 top-24 z-30 block md:hidden" />

      {/* Popup discreto de prova social */}
      <SocialProofPopup />
    </div>
  );
};

export default Index;
