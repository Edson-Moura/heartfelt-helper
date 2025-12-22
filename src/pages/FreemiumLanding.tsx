import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, Sparkles, MessageSquare, Mic, Trophy, BookOpen, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const FreemiumLanding = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-primary/10 to-background">
        <div className="container mx-auto max-w-6xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 rounded-full border border-primary/30 mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Pronto para ir além?</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Desbloqueie Seu
            <span className="block text-primary mt-2">Potencial Completo</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Você já experimentou o poder da nossa plataforma. Agora imagine ter acesso ilimitado 
            a todas as features e aprender inglês 3x mais rápido.
          </p>
          
          <Button asChild size="lg" className="text-lg px-8 py-6">
            <Link to="/pricing">Começar Teste Premium de 7 Dias</Link>
          </Button>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-4xl font-bold text-center mb-12">
            Gratuito vs Premium
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Free Plan */}
            <Card className="border-border/50">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Plano Gratuito</CardTitle>
                <CardDescription className="text-lg">Ótimo para começar</CardDescription>
                <div className="text-3xl font-bold mt-4">R$ 0</div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <span>3 lições gratuitas</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <span>5 minutos de conversação/dia</span>
                </div>
                <div className="flex items-start gap-3">
                  <X className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Lições ilimitadas</span>
                </div>
                <div className="flex items-start gap-3">
                  <X className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Avatar IA interativo</span>
                </div>
                <div className="flex items-start gap-3">
                  <X className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Análise avançada de pronúncia</span>
                </div>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="border-primary shadow-xl shadow-primary/20 scale-105">
              <CardHeader className="text-center bg-primary/5">
                <div className="inline-block px-4 py-1 bg-primary text-primary-foreground text-sm font-semibold rounded-full mb-2">
                  Recomendado
                </div>
                <CardTitle className="text-2xl">Plano Premium</CardTitle>
                <CardDescription className="text-lg">Aprendizado sem limites</CardDescription>
                <div className="text-3xl font-bold mt-4">
                  R$ 29,90
                  <span className="text-base font-normal text-muted-foreground">/mês</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <span className="font-semibold">Lições ilimitadas</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <span className="font-semibold">Conversação ilimitada</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <span className="font-semibold">Avatar IA interativo</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <span className="font-semibold">Análise avançada de pronúncia</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <span className="font-semibold">Suporte prioritário</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
                  <span className="font-semibold">Todas as features de gamificação</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* What You'll Unlock */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-12">
            O Que Você Vai Desbloquear
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader>
                <MessageSquare className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Conversação Ilimitada</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Pratique quantas horas quiser com a IA, sem limites diários
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader>
                <BookOpen className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Todas as 50+ Lições</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Acesso completo a todas as lições do básico ao avançado
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader>
                <Mic className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Avatar IA</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Converse com avatar realista que responde em tempo real
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader>
                <Trophy className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Análise Avançada</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Feedback detalhado sobre pronúncia e progresso
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-4">
            Alunos Que Fizeram Upgrade
          </h2>
          <p className="text-xl text-muted-foreground text-center mb-12">
            Veja o que eles têm a dizer sobre a decisão
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-border/50">
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-foreground mb-4 leading-relaxed">
                  "Fazer o upgrade foi a melhor decisão. Agora pratico todos os dias sem preocupação com limites!"
                </p>
                <p className="font-semibold">Carlos Mendes</p>
                <p className="text-sm text-muted-foreground">Virou Premium em 1 semana</p>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-foreground mb-4 leading-relaxed">
                  "O avatar IA é incrível! Vale cada centavo. Meu inglês melhorou muito mais rápido."
                </p>
                <p className="font-semibold">Juliana Oliveira</p>
                <p className="text-sm text-muted-foreground">Usuária Premium há 3 meses</p>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="pt-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-foreground mb-4 leading-relaxed">
                  "Investimento que realmente vale a pena. Menos de R$ 1 por dia para aprender inglês!"
                </p>
                <p className="font-semibold">Pedro Lima</p>
                <p className="text-sm text-muted-foreground">Virou Premium no primeiro dia</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-4xl font-bold text-center mb-12">
            Perguntas Frequentes
          </h2>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Posso cancelar quando quiser?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Sim! Você pode cancelar a qualquer momento sem multa ou burocracia.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Como funciona o teste de 7 dias?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Você tem 7 dias para testar todas as features Premium. Se não gostar, é só cancelar 
                  antes do fim do período e não será cobrado.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">O que acontece se eu voltar para o plano gratuito?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Seu progresso é mantido! Você volta aos limites gratuitos mas não perde nada do que já aprendeu.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-b from-primary/10 to-background">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Pronto Para Acelerar Seu Inglês?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Junte-se a mais de 5.000 alunos Premium que já transformaram seu inglês
          </p>
          
          <Button asChild size="lg" className="text-lg px-12 py-8">
            <Link to="/pricing">Começar Meu Teste de 7 Dias</Link>
          </Button>
          
          <p className="text-sm text-muted-foreground mt-6">
            ✨ Garantia de 7 dias • 💳 Cancele quando quiser • 🔒 Pagamento 100% seguro
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FreemiumLanding;
