# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/9871b8f7-ff50-465b-acfb-46985394a14b

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/9871b8f7-ff50-465b-acfb-46985394a14b) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/9871b8f7-ff50-465b-acfb-46985394a14b) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Rate Limiting System

This project includes a comprehensive rate limiting system that controls API usage based on subscription tiers.

### Features

- **Tier-based Limits**: Automatic rate limiting based on user subscription (Free, Premium, Enterprise)
- **Multiple Providers**: Individual limits for each API provider (NVIDIA, ElevenLabs, D-ID, Deepgram, OpenAI)
- **Burst Protection**: Prevents rapid request spikes with burst limiting
- **Abuse Detection**: Integrated with abuse detection system for enhanced security
- **Real-time Monitoring**: Live dashboard showing current usage and limits

### Subscription Tiers

#### Free Tier
- NVIDIA: 20 req/min (burst: 5/10s)
- ElevenLabs: 10 req/min (burst: 3/10s)
- D-ID: 5 req/min (burst: 2/10s)
- Deepgram: 30 req/min (burst: 10/10s)
- OpenAI: 15 req/min (burst: 5/10s)

#### Premium Tier
- NVIDIA: 100 req/min (burst: 20/10s)
- ElevenLabs: 50 req/min (burst: 15/10s)
- D-ID: 30 req/min (burst: 10/10s)
- Deepgram: 150 req/min (burst: 40/10s)
- OpenAI: 75 req/min (burst: 20/10s)

#### Enterprise Tier (Pro)
- NVIDIA: 500 req/min (burst: 100/10s)
- ElevenLabs: 200 req/min (burst: 50/10s)
- D-ID: 100 req/min (burst: 30/10s)
- Deepgram: 500 req/min (burst: 100/10s)
- OpenAI: 300 req/min (burst: 75/10s)

### Usage

#### Using the Hook

```typescript
import { useRateLimiting } from '@/hooks/useRateLimiting';

const MyComponent = () => {
  const { canMakeRequest, tryRequest, getCurrentPlan } = useRateLimiting();
  
  const handleApiCall = async () => {
    // Option 1: Manual check
    if (canMakeRequest('openai')) {
      // Make your API call
    }
    
    // Option 2: Automatic rate limiting
    const result = await tryRequest('openai', async () => {
      return await myApiCall();
    });
  };
};
```

#### Monitoring

Visit `/rate-limits` to view real-time rate limiting status for all providers.

### Architecture

- **RateLimiter Service**: Core service managing limits and tracking requests
- **useRateLimiting Hook**: React integration for components
- **RateLimitMonitor Component**: Visual dashboard for monitoring
- **Integration**: Connected with subscription system and abuse detection

### Storage

Rate limiting data is persisted in localStorage to maintain limits across page reloads while respecting privacy.

## Metrics Dashboard

A comprehensive metrics dashboard to monitor system health and performance in real-time.

### Features

- **Real-time Monitoring**: Auto-updates every 5 seconds
- **Multiple Views**: Overview, APIs, Cache, Queue, and Health tabs
- **Performance Metrics**: Track success rates, latency, and slow operations
- **API Analytics**: Monitor individual provider performance and error rates
- **Cache Statistics**: Visualize cache hit rates and efficiency
- **Request Queue**: Monitor queue size, processing status, and batch operations
- **Health Checks**: Real-time health status of all API providers

### Accessing the Dashboard

Visit `/metrics` (requires authentication) or navigate through:
- Header menu → Métricas
- Mobile menu → Métricas  
- User dropdown → Métricas

### Metrics Tracked

#### Performance
- Success rate across all operations
- Average operation duration
- Slow operations (>3 seconds)

#### APIs
- Total API calls per provider
- Average latency by provider
- Error rates and counts

#### Cache
- Hit/miss rates
- Total hits and misses
- Cache size in KB

#### Queue
- Current queue size
- Operations being processed
- Breakdown by priority and type
- Pending batch operations

#### Health
- Provider health status (healthy/degraded/critical)
- Last check timestamp
- Current latency
- Error rates
- Last error messages

---

## Analytics Integration

Sistema de analytics integrado com Mixpanel e Amplitude para rastreamento de eventos e comportamento do usuário.

### Provedores Suportados

- **Mixpanel** - Analytics avançado com funil e cohorts
- **Amplitude** - Analytics comportamental e product analytics
- **None** - Modo debug sem provider externo

### Configuração

Para habilitar analytics, adicione as variáveis de ambiente:

```typescript
// Para Mixpanel
VITE_MIXPANEL_TOKEN=your_token_here

// Para Amplitude  
VITE_AMPLITUDE_API_KEY=your_api_key_here
```

### Uso no Código

```typescript
import { useAnalytics } from '@/hooks/useAnalytics';

function MyComponent() {
  const { track, trackEvent } = useAnalytics({
    provider: 'mixpanel', // ou 'amplitude' ou 'none'
    autoTrackPages: true
  });

  // Track evento customizado
  track('Button Clicked', { 
    buttonName: 'Subscribe',
    location: 'header' 
  });

  // Eventos pré-definidos
  trackEvent.lessonCompleted('lesson-1', 'Introduction', 95);
  trackEvent.achievementUnlocked('first-lesson', 'First Steps');
  trackEvent.subscriptionStarted('premium', 29.99);
}
```

### Eventos Rastreados Automaticamente

1. **Autenticação**
   - User Signed Up
   - User Logged In
   - User Logged Out

2. **Navegação**
   - Page Viewed (automático com autoTrackPages)

3. **Lições**
   - Lesson Started
   - Lesson Completed

4. **Exercícios**
   - Exercise Completed

5. **Assinatura**
   - Subscription Started (+ revenue)
   - Subscription Canceled

6. **Conquistas**
   - Achievement Unlocked

7. **Engajamento**
   - Chat Message Sent
   - Feedback Submitted
   - Ebook Downloaded

### Funcionalidades

- **Identificação de Usuário**: Automática após login
- **Track de Página**: Automático em mudanças de rota
- **Time Events**: Medir duração de ações
- **Revenue Tracking**: Rastrear receita e conversões
- **Reset**: Limpar dados ao fazer logout

### Debug Panel

Interface de debug disponível em desenvolvimento para testar eventos:

```typescript
import { AnalyticsDebugPanel } from '@/components/AnalyticsDebugPanel';

// Adicionar em uma página de admin/dev
<AnalyticsDebugPanel />
```

### Arquitetura

```
┌─────────────────────┐
│   useAnalytics      │
│   (Hook)            │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ AnalyticsService    │
│ (Singleton)         │
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     ▼           ▼
┌─────────┐ ┌──────────┐
│Mixpanel │ │Amplitude │
└─────────┘ └──────────┘
```

### Integração com Logger

Todos os eventos de analytics também são registrados no sistema de logging estruturado para debug e auditoria.

### Privacy

- Dados do usuário são anonimizados quando possível
- Respeita configurações de opt-out
- Compatível com GDPR/LGPD
