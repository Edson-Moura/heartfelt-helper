import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SkipOnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: () => void;
  onSkip: () => void;
}

export const SkipOnboardingModal = ({
  open,
  onOpenChange,
  onContinue,
  onSkip,
}: SkipOnboardingModalProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl flex items-center gap-2">
            <span>Tem certeza? 🤔</span>
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base space-y-3 pt-2">
            <p className="text-foreground">
              O tour leva apenas <strong className="text-primary">5 minutos</strong> e vai:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Personalizar sua experiência de aprendizado</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Identificar seu nível atual de inglês</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Configurar suas metas e preferências</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">✓</span>
                <span>Garantir o melhor caminho para fluência</span>
              </li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel
            onClick={onSkip}
            className="bg-muted hover:bg-muted/80 text-muted-foreground"
          >
            Pular Mesmo
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onContinue}
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            Continuar Tour
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
