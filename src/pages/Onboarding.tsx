import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Volume2, CheckCircle, XCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress';
import { WelcomeAnimation } from '@/components/onboarding/WelcomeAnimation';
import { AvatarIntro } from '@/components/onboarding/AvatarIntro';
import { VoiceTestButton } from '@/components/onboarding/VoiceTestButton';
import { CompletionCelebration } from '@/components/onboarding/CompletionCelebration';
import { onboardingAnalytics } from '@/services/OnboardingAnalytics';

interface OnboardingData {
  learningGoal: string;
  proficiencyLevel: string;
  assessmentScore: number;
  preferredTrainingMode: string;
  dailyReminderTime?: string;
  enableStreakReminder: boolean;
  enableDailyReminder: boolean;
}

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  
  const [formData, setFormData] = useState<OnboardingData>({
    learningGoal: '',
    proficiencyLevel: '',
    assessmentScore: 0,
    preferredTrainingMode: 'balanced',
    enableStreakReminder: true,
    enableDailyReminder: true,
  });

  // Assessment state
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [assessmentAnswers, setAssessmentAnswers] = useState<boolean[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState(false);

  // Demo conversation state
  const [conversationMessages, setConversationMessages] = useState<Array<{ role: string; text: string }>>([]);
  const [currentAvatarMessage, setCurrentAvatarMessage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceUsed, setVoiceUsed] = useState(false);

  // Track step changes for analytics
  useEffect(() => {
    if (user) {
      onboardingAnalytics.trackStepStarted(currentStep, user.id);
    }
  }, [currentStep, user]);

  const learningGoals = [
    { value: 'travel', label: 'Viajar para o exterior', icon: '✈️' },
    { value: 'career', label: 'Avançar na carreira', icon: '💼' },
    { value: 'certification', label: 'Passar em certificação (TOEFL, IELTS)', icon: '📚' },
    { value: 'conversation', label: 'Conversar com nativos', icon: '💬' },
    { value: 'entertainment', label: 'Assistir filmes sem legenda', icon: '🎬' },
  ];

  const proficiencyLevels = [
    {
      value: 'beginner',
      label: 'Iniciante (A1-A2)',
      description: 'Sei apenas o básico ou nada',
      icon: '🟢',
      color: 'from-green-500/20 to-green-600/20',
    },
    {
      value: 'intermediate',
      label: 'Intermediário (B1-B2)',
      description: 'Consigo me comunicar mas tenho dificuldades',
      icon: '🟡',
      color: 'from-yellow-500/20 to-yellow-600/20',
    },
    {
      value: 'advanced',
      label: 'Avançado (C1-C2)',
      description: 'Falo bem mas quero fluência total',
      icon: '🔴',
      color: 'from-red-500/20 to-red-600/20',
    },
  ];

  const assessmentQuestions = {
    beginner: [
      {
        question: "Ouça: 'Hello, how are you?'",
        audio: true,
        options: ["I'm fine, thank you", "Me chamo João", "Yes, please"],
        correct: 0,
      },
      {
        question: "What is this? 🍎",
        options: ["Apple", "Orange", "Banana"],
        correct: 0,
      },
      {
        question: "Complete: 'My name ___ John'",
        options: ["is", "are", "am"],
        correct: 0,
      },
    ],
    intermediate: [
      {
        question: "Where ___ you go yesterday?",
        options: ["did", "do", "does"],
        correct: 0,
      },
      {
        question: "I ___ been to Paris twice",
        options: ["have", "has", "had"],
        correct: 0,
      },
      {
        question: "He works ___ a hospital",
        options: ["in", "at", "on"],
        correct: 1,
      },
    ],
    advanced: [
      {
        question: "Choose the correct synonym for 'ubiquitous'",
        options: ["Omnipresent", "Rare", "Ancient"],
        correct: 0,
      },
      {
        question: "Identify the grammatical error: 'She don't like coffee'",
        options: ["don't should be doesn't", "like should be likes", "No error"],
        correct: 0,
      },
      {
        question: "Complete: 'Had I known, I ___ told you'",
        options: ["would have", "will have", "would"],
        correct: 0,
      },
    ],
  };

  const handleNext = useCallback(() => {
    if (currentStep === 1 && !formData.learningGoal) {
      toast({
        title: "Selecione um objetivo",
        description: "Por favor, escolha seu principal objetivo de aprendizado",
        variant: "destructive",
      });
      return;
    }
    
    if (currentStep === 2 && !formData.proficiencyLevel) {
      toast({
        title: "Selecione um nível",
        description: "Por favor, escolha seu nível atual de inglês",
        variant: "destructive",
      });
      return;
    }

    // Track completion of current step
    if (user) {
      onboardingAnalytics.trackStepCompleted(currentStep, user.id, {
        level_selected: formData.proficiencyLevel,
        goal_selected: formData.learningGoal,
      });
    }

    setCurrentStep(prev => prev + 1);
  }, [currentStep, formData, toast, user]);

  const handleAssessmentAnswer = (answerIndex: number) => {
    const questions = assessmentQuestions[formData.proficiencyLevel as keyof typeof assessmentQuestions];
    const isCorrect = questions[currentQuestion].correct === answerIndex;
    
    setLastAnswerCorrect(isCorrect);
    setShowFeedback(true);
    setAssessmentAnswers([...assessmentAnswers, isCorrect]);

    setTimeout(() => {
      setShowFeedback(false);
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
      } else {
        const score = assessmentAnswers.filter(a => a).length + (isCorrect ? 1 : 0);
        setFormData(prev => ({ ...prev, assessmentScore: score }));
        
        if (user) {
          onboardingAnalytics.trackStepCompleted(3, user.id, { score });
        }
        
        setCurrentStep(4);
      }
    }, 1500);
  };

  // Initialize conversation with Alex
  useEffect(() => {
    if (currentStep === 4 && conversationMessages.length === 0) {
      setCurrentAvatarMessage("Hi! I'm Alex, your English teacher. What's your name?");
    }
  }, [currentStep, conversationMessages.length]);

  const handleVoiceInput = async (transcript: string) => {
    if (!transcript || isProcessing) return;

    setVoiceUsed(true);
    if (user) {
      onboardingAnalytics.trackVoiceUsed(user.id);
    }

    setConversationMessages(prev => [...prev, { role: 'user', text: transcript }]);
    setIsProcessing(true);
    setCurrentAvatarMessage('');

    try {
      // Call OpenAI chat function for Alex's response
      const { data, error } = await supabase.functions.invoke('openai-chat', {
        body: {
          messages: [
            {
              role: 'system',
              content: 'You are Alex, a friendly English teacher doing a quick onboarding conversation. Keep responses very short (1-2 sentences). Ask about their name, where they are from, and why they want to learn English. After 3 exchanges, encourage them to continue.',
            },
            ...conversationMessages.map(m => ({ role: m.role, content: m.text })),
            { role: 'user', content: transcript },
          ],
        },
      });

      if (error) throw error;

      const response = data?.response || "Great! Let's start your first lesson!";
      setCurrentAvatarMessage(response);
      setConversationMessages(prev => [...prev, { role: 'assistant', text: response }]);

      // After 3 user messages, move to next step
      if (conversationMessages.filter(m => m.role === 'user').length >= 2) {
        setTimeout(() => {
          if (user) {
            onboardingAnalytics.trackStepCompleted(4, user.id, { voice_used: voiceUsed });
          }
          setCurrentStep(5);
        }, 3000);
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      setCurrentAvatarMessage("Great! Let's continue with your journey!");
      
      setTimeout(() => {
        if (user) {
          onboardingAnalytics.trackStepCompleted(4, user.id, { voice_used: voiceUsed });
        }
        setCurrentStep(5);
      }, 2000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinishOnboarding = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          learning_goal: formData.learningGoal,
          proficiency_level: formData.proficiencyLevel,
          preferred_training_mode: formData.preferredTrainingMode,
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      if (user) {
        onboardingAnalytics.trackOnboardingCompleted(user.id, {
          level: formData.proficiencyLevel,
          goal: formData.learningGoal,
          voice_used: voiceUsed,
        });
      }

      setShowCelebration(true);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast({
        title: "Erro ao finalizar",
        description: "Tente novamente",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleCelebrationContinue = () => {
    navigate('/onboarding-complete');
  };

  if (showCelebration) {
    return (
      <CompletionCelebration
        level={formData.proficiencyLevel}
        goal={learningGoals.find(g => g.value === formData.learningGoal)?.label || formData.learningGoal}
        onContinue={handleCelebrationContinue}
      />
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            {showWelcome && (
              <WelcomeAnimation onComplete={() => setShowWelcome(false)} />
            )}
            
            {!showWelcome && (
              <>
                <div className="text-center space-y-2">
                  <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    Bem-vindo ao MyEnglish! 🎉
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    Em 5 minutos você terá sua primeira conversa em inglês com IA
                  </p>
                </div>

                <div className="space-y-4">
                  <Label className="text-lg font-semibold">Qual é seu principal objetivo?</Label>
                  <RadioGroup
                    value={formData.learningGoal}
                    onValueChange={(value) => setFormData({ ...formData, learningGoal: value })}
                    className="grid gap-3"
                  >
                    {learningGoals.map((goal) => (
                      <Card
                        key={goal.value}
                        className={`p-4 cursor-pointer transition-all hover:scale-105 ${
                          formData.learningGoal === goal.value
                            ? 'border-primary border-2 bg-primary/5'
                            : 'border-border'
                        }`}
                        onClick={() => setFormData({ ...formData, learningGoal: goal.value })}
                      >
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value={goal.value} id={goal.value} />
                          <Label
                            htmlFor={goal.value}
                            className="flex items-center space-x-3 cursor-pointer flex-1"
                          >
                            <span className="text-2xl">{goal.icon}</span>
                            <span className="font-medium">{goal.label}</span>
                          </Label>
                        </div>
                      </Card>
                    ))}
                    <Card
                      className={`p-4 cursor-pointer transition-all hover:scale-105 ${
                        formData.learningGoal === 'other' ? 'border-primary border-2 bg-primary/5' : 'border-border'
                      }`}
                      onClick={() => setFormData({ ...formData, learningGoal: 'other' })}
                    >
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="other" id="other" />
                        <div className="flex-1 space-y-2">
                          <Label htmlFor="other" className="cursor-pointer flex items-center space-x-3">
                            <span className="text-2xl">🎯</span>
                            <span className="font-medium">Outro:</span>
                          </Label>
                          {formData.learningGoal === 'other' && (
                            <Input
                              placeholder="Descreva seu objetivo..."
                              className="mt-2"
                              onClick={(e) => e.stopPropagation()}
                            />
                          )}
                        </div>
                      </div>
                    </Card>
                  </RadioGroup>
                </div>
              </>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Qual é seu nível atual?</h2>
              <p className="text-muted-foreground">
                Seja honesto! Vamos personalizar sua jornada
              </p>
            </div>

            <div className="grid gap-4">
              {proficiencyLevels.map((level) => (
                <Card
                  key={level.value}
                  className={`p-6 cursor-pointer transition-all hover:scale-105 bg-gradient-to-br ${level.color} ${
                    formData.proficiencyLevel === level.value
                      ? 'border-primary border-2 shadow-lg'
                      : 'border-border'
                  }`}
                  onClick={() => setFormData({ ...formData, proficiencyLevel: level.value })}
                >
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">{level.icon}</span>
                      <div>
                        <h3 className="text-xl font-bold">{level.label}</h3>
                        <p className="text-sm text-muted-foreground">{level.description}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 3:
        const questions = assessmentQuestions[formData.proficiencyLevel as keyof typeof assessmentQuestions];
        const question = questions[currentQuestion];

        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Vamos confirmar seu nível!</h2>
              <p className="text-muted-foreground">3 perguntas rápidas (30 segundos)</p>
              <div className="flex justify-center space-x-2 mt-4">
                {questions.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-2 w-12 rounded-full transition-colors ${
                      idx === currentQuestion
                        ? 'bg-primary'
                        : idx < currentQuestion
                        ? 'bg-green-500'
                        : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
            </div>

            <Card className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  {'audio' in question && question.audio && <Volume2 className="h-5 w-5 text-primary" />}
                  <h3 className="text-xl font-semibold">{question.question}</h3>
                </div>

                <div className="grid gap-3">
                  {question.options.map((option, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      className="h-auto p-4 text-left justify-start hover:bg-primary/10 transition-all"
                      onClick={() => handleAssessmentAnswer(idx)}
                      disabled={showFeedback}
                    >
                      <span className="text-lg">{option}</span>
                    </Button>
                  ))}
                </div>

                {showFeedback && (
                  <div
                    className={`flex items-center space-x-2 p-4 rounded-lg animate-in slide-in-from-bottom ${
                      lastAnswerCorrect ? 'bg-green-500/20' : 'bg-red-500/20'
                    }`}
                  >
                    {lastAnswerCorrect ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="font-medium text-green-600">Correto!</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-red-500" />
                        <span className="font-medium text-red-600">Tente novamente na próxima!</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 animate-in fade-in duration-500 min-h-[600px] flex flex-col">
            <div className="text-center space-y-2">
              <h2 className="text-3xl md:text-4xl font-bold flex items-center justify-center space-x-2">
                <span>🎤 Sua Primeira Conversa!</span>
              </h2>
              <p className="text-muted-foreground text-lg">
                Conheça Alex, seu professor de inglês virtual
              </p>
            </div>

            <Card className="flex-1 p-6 flex flex-col items-center justify-center space-y-6 bg-gradient-to-br from-primary/5 to-secondary/5">
              {currentAvatarMessage && (
                <AvatarIntro
                  message={currentAvatarMessage}
                  autoPlay={true}
                />
              )}

              <div className="w-full max-w-lg space-y-4">
                {conversationMessages.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {conversationMessages.slice(-4).map((msg, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg ${
                          msg.role === 'user'
                            ? 'bg-primary/10 ml-8'
                            : 'bg-muted mr-8'
                        }`}
                      >
                        <p className="text-sm">{msg.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                <VoiceTestButton
                  onTranscript={handleVoiceInput}
                  placeholder="Toque para falar com Alex"
                />
              </div>
            </Card>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold">Quase lá! ⚙️</h2>
              <p className="text-muted-foreground">Escolha suas preferências</p>
            </div>

            <Card className="p-6 space-y-6">
              <div className="space-y-4">
                <Label className="text-lg font-semibold">Modo de treino preferido:</Label>
                <RadioGroup
                  value={formData.preferredTrainingMode}
                  onValueChange={(value) => setFormData({ ...formData, preferredTrainingMode: value })}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="conversation" id="conversation" />
                    <Label htmlFor="conversation" className="cursor-pointer">
                      💬 Conversação (foco em fala)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="reading" id="reading" />
                    <Label htmlFor="reading" className="cursor-pointer">
                      📖 Leitura (foco em vocabulário)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="writing" id="writing" />
                    <Label htmlFor="writing" className="cursor-pointer">
                      ✍️ Escrita (foco em gramática)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="balanced" id="balanced" />
                    <Label htmlFor="balanced" className="cursor-pointer">
                      ⚖️ Balanceado
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="daily-reminder"
                    checked={formData.enableDailyReminder}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, enableDailyReminder: checked as boolean })
                    }
                  />
                  <Label htmlFor="daily-reminder" className="cursor-pointer">
                    Notificações diárias de prática
                  </Label>
                </div>
                {formData.enableDailyReminder && (
                  <Input
                    type="time"
                    value={formData.dailyReminderTime}
                    onChange={(e) => setFormData({ ...formData, dailyReminderTime: e.target.value })}
                    className="w-32 ml-6"
                  />
                )}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="streak-reminder"
                    checked={formData.enableStreakReminder}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, enableStreakReminder: checked as boolean })
                    }
                  />
                  <Label htmlFor="streak-reminder" className="cursor-pointer">
                    Lembrete de streak
                  </Label>
                </div>
              </div>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <OnboardingProgress currentStep={currentStep} totalSteps={5} />
      
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          {renderStep()}
        </div>

        {!showWelcome && currentStep !== 4 && (
          <div className="flex justify-between pt-6">
            <Button
              variant="ghost"
              onClick={() => setCurrentStep(prev => prev - 1)}
              disabled={currentStep === 1 || loading}
            >
              Voltar
            </Button>
            
            {currentStep < 5 ? (
              <Button
                onClick={handleNext}
                disabled={loading}
                size="lg"
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                Continuar
              </Button>
            ) : (
              <Button
                onClick={handleFinishOnboarding}
                disabled={loading}
                size="lg"
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                {loading ? 'Finalizando...' : 'Começar Minha Jornada! 🚀'}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
