import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { MessageSquare, User, LogOut, Settings, BookOpen, Home, BarChart3, Trophy, Users, Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Link } from "react-router-dom";
import { FeedbackWidget } from "@/components/FeedbackWidget";
import whatsappIcon from "@/assets/whatsapp-icon.svg";
import { useState } from "react";

export const Header = () => {
  const { user, signOut, loading } = useAuth();
  const { profile } = useProfile();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  const getUserInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-3 md:px-4 lg:px-6 py-3 md:py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 md:gap-3 min-w-0 flex-shrink-0">
          <img 
            src="/lovable-uploads/e26470cf-d11b-4647-83f6-c61857d5de8d.png"
            alt="MyEnglishOne Logo" 
            className="w-8 h-8 md:w-10 md:h-10 object-contain flex-shrink-0"
          />
          <span className="text-sm md:text-lg lg:text-xl font-bold">
            <span className="hidden lg:inline">
              <span className="bg-gradient-hero bg-clip-text text-transparent">MyEnglish</span><span className="text-green-600">One</span>
            </span>
            <span className="lg:hidden">
              <span className="bg-gradient-hero bg-clip-text text-transparent">MyEnglish</span>
            </span>
          </span>
        </Link>
        
        <nav className="hidden lg:flex items-center gap-6">
          {user ? (
            <>
              <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-smooth">
                Dashboard
              </Link>
              <Link to="/lessons" className="text-muted-foreground hover:text-foreground transition-smooth">
                Lições
              </Link>
              <Link to="/chat" className="text-muted-foreground hover:text-foreground transition-smooth">
                Chat IA
              </Link>
              <Link to="/quiz" className="text-muted-foreground hover:text-foreground transition-smooth">
                Quiz
              </Link>
              <a 
                href="https://comunidade.myenglishone.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-smooth"
              >
                Comunidade
              </a>
            </>
          ) : (
            <>
              <Link to="/?scrollTo=features" className="text-muted-foreground hover:text-foreground transition-smooth">
                Funcionalidades
              </Link>
              <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-smooth">
                Preços
              </Link>
              <Link to="/about" className="text-muted-foreground hover:text-foreground transition-smooth">
                Sobre
              </Link>
              <a 
                href="https://comunidade.myenglishone.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-smooth"
              >
                Comunidade
              </a>
            </>
          )}
        </nav>

        <div className="flex items-center gap-1 md:gap-2 lg:gap-3">
          {/* Mobile/Tablet Menu */}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="sm" className="px-2">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] bg-background/95 backdrop-blur-lg">
              <SheetHeader>
                <SheetTitle className="text-left">
                  <span className="bg-gradient-hero bg-clip-text text-transparent">MyEnglish</span>
                  <span className="text-green-600">One</span>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-8">
                {user ? (
                  <>
                    <Link 
                      to="/dashboard" 
                      className="flex items-center gap-3 text-foreground hover:text-primary transition-smooth py-2"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Home className="h-5 w-5" />
                      Dashboard
                    </Link>
                    <Link 
                      to="/lessons" 
                      className="flex items-center gap-3 text-foreground hover:text-primary transition-smooth py-2"
                      onClick={() => setMenuOpen(false)}
                    >
                      <BookOpen className="h-5 w-5" />
                      Lições
                    </Link>
                    <Link 
                      to="/chat" 
                      className="flex items-center gap-3 text-foreground hover:text-primary transition-smooth py-2"
                      onClick={() => setMenuOpen(false)}
                    >
                      <MessageSquare className="h-5 w-5" />
                      Chat IA
                    </Link>
                    <Link 
                      to="/achievements" 
                      className="flex items-center gap-3 text-foreground hover:text-primary transition-smooth py-2"
                      onClick={() => setMenuOpen(false)}
                    >
                      <BarChart3 className="h-5 w-5" />
                      Conquistas
                    </Link>
                    <Link 
                      to="/quiz" 
                      className="flex items-center gap-3 text-foreground hover:text-primary transition-smooth py-2"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Trophy className="h-5 w-5" />
                      Quiz
                    </Link>
                    <a 
                      href="https://comunidade.myenglishone.com/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-foreground hover:text-primary transition-smooth py-2"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Users className="h-5 w-5" />
                      Comunidade
                    </a>
                    <Link 
                      to="/settings" 
                      className="flex items-center gap-3 text-foreground hover:text-primary transition-smooth py-2"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Settings className="h-5 w-5" />
                      Configurações
                    </Link>
                    <Button 
                      variant="ghost" 
                      className="justify-start text-destructive hover:text-destructive hover:bg-destructive/10 px-0 py-2"
                      onClick={() => {
                        handleSignOut();
                        setMenuOpen(false);
                      }}
                      disabled={loading}
                    >
                      <LogOut className="mr-3 h-5 w-5" />
                      Sair
                    </Button>
                  </>
                ) : (
                  <>
                    <Link 
                      to="/?scrollTo=features" 
                      className="flex items-center gap-3 text-foreground hover:text-primary transition-smooth py-2"
                      onClick={() => setMenuOpen(false)}
                    >
                      Funcionalidades
                    </Link>
                    <Link 
                      to="/pricing" 
                      className="flex items-center gap-3 text-foreground hover:text-primary transition-smooth py-2"
                      onClick={() => setMenuOpen(false)}
                    >
                      Preços
                    </Link>
                    <Link 
                      to="/about" 
                      className="flex items-center gap-3 text-foreground hover:text-primary transition-smooth py-2"
                      onClick={() => setMenuOpen(false)}
                    >
                      Sobre
                    </Link>
                    <a 
                      href="https://comunidade.myenglishone.com/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-foreground hover:text-primary transition-smooth py-2"
                      onClick={() => setMenuOpen(false)}
                    >
                      Comunidade
                    </a>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
          
          <Button
            variant="ghost" 
            size="sm" 
            className="px-2 md:px-3 text-green-600 hover:text-green-700 hover:bg-green-50"
            asChild
          >
            <a 
              href="https://wa.me/5516991779261?text=Ola%20eu%20tenho%20uma%20d%C3%BAvida" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 md:gap-2"
            >
              <img src={whatsappIcon} alt="WhatsApp" className="w-5 h-5 md:w-6 md:h-6" />
              <span className="hidden md:inline text-sm">WhatsApp</span>
            </a>
          </Button>
          
          <FeedbackWidget 
            trigger={
              <Button variant="ghost" size="sm" className="px-2 md:px-3">
                <MessageSquare className="w-4 h-4" />
                <span className="hidden md:inline text-sm">Feedback</span>
              </Button>
            }
          />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || ''} alt="Avatar do usuário" />
                    <AvatarFallback className="bg-gradient-primary text-white text-sm">
                      {profile?.display_name ? profile.display_name[0].toUpperCase() : getUserInitials(user.email || 'U')}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-2">
                  <p className="text-sm font-medium leading-none">
                    {profile?.display_name || user.email}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    Estudante MyEnglishOne
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/dashboard">
                    <Home className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/lessons">
                    <BookOpen className="mr-2 h-4 w-4" />
                    <span>Lições</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/achievements">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    <span>Conquistas</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/quiz">
                    <Trophy className="mr-2 h-4 w-4" />
                    <span>Quiz</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <a 
                    href="https://comunidade.myenglishone.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    <span>Comunidade</span>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link to="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configurações</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer text-destructive focus:text-destructive"
                  onClick={handleSignOut}
                  disabled={loading}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="text-xs md:text-sm px-2 md:px-3" asChild>
                <Link to="/auth">Entrar</Link>
              </Button>
              <Button variant="hero" size="sm" className="text-xs md:text-sm px-2 md:px-3" asChild>
                <Link to="/auth">
                  <span className="hidden sm:inline">Começar Grátis</span>
                  <span className="sm:hidden">Grátis</span>
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};