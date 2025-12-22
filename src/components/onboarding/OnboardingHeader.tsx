import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { Link } from "react-router-dom";

interface OnboardingHeaderProps {
  onExit: () => void;
}

export const OnboardingHeader = ({ onExit }: OnboardingHeaderProps) => {
  return (
    <header className="bg-background/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img 
            src="/lovable-uploads/e26470cf-d11b-4647-83f6-c61857d5de8d.png"
            alt="MyEnglishOne Logo" 
            className="w-10 h-10 object-contain"
          />
          <span className="text-xl font-bold">
            <span className="bg-gradient-hero bg-clip-text text-transparent">MyEnglish</span>
            <span className="text-green-600">One</span>
          </span>
        </Link>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onExit}
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair
        </Button>
      </div>
    </header>
  );
};
