import { motion } from 'framer-motion';

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

export const OnboardingProgress = ({ currentStep, totalSteps }: OnboardingProgressProps) => {
  const percentage = (currentStep / totalSteps) * 100;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4 py-4">
        {/* Steps Indicators */}
        <div className="flex items-center justify-center gap-2 mb-3">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{
                scale: index < currentStep ? 1.1 : index === currentStep ? 1.2 : 0.8,
                opacity: index < currentStep ? 1 : index === currentStep ? 1 : 0.3,
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="relative"
            >
              <div
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index < currentStep
                    ? 'bg-gradient-to-r from-green-500 to-green-600 shadow-lg shadow-green-500/50'
                    : index === currentStep
                    ? 'bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/50 animate-pulse'
                    : 'bg-muted'
                }`}
              />
              {index < currentStep && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-primary/90 to-primary/80"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* Animated shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </motion.div>

          {/* Percentage indicator */}
          <motion.div
            className="absolute -top-8 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold shadow-lg"
            initial={{ left: 0 }}
            animate={{ left: `calc(${percentage}% - 20px)` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {Math.round(percentage)}%
          </motion.div>
        </div>

        {/* Step Title */}
        <motion.p
          key={currentStep}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center text-sm text-muted-foreground mt-2"
        >
          Etapa {currentStep} de {totalSteps}
        </motion.p>
      </div>
    </div>
  );
};
