import { MessageCircleQuestion, Moon, Sun, Home, PlusCircle, BarChart, Menu } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "./ui/button";
import { Link, useLocation } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "./ui/sheet";

export function Header() {
  const { theme, setTheme } = useTheme();
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 md:h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <MessageCircleQuestion className="h-5 w-5 md:h-6 md:w-6" />
            <span className="text-lg md:text-xl font-bold">Quizopia</span>
          </Link>
        </div>
        
        {/* Mobile navigation */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[240px] px-6">
              <div className="flex flex-col gap-3 pt-6">
                <Link to="/">
                  <Button 
                    variant={location.pathname === "/" ? "default" : "ghost"} 
                    size="lg" 
                    className="w-full justify-start"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Home
                  </Button>
                </Link>
                <Link to="/quiz/new">
                  <Button 
                    variant={location.pathname === "/quiz/new" ? "default" : "ghost"} 
                    size="lg" 
                    className="w-full justify-start"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create Quiz
                  </Button>
                </Link>
                <Link to="/results">
                  <Button 
                    variant={location.pathname === "/results" ? "default" : "ghost"} 
                    size="lg" 
                    className="w-full justify-start"
                  >
                    <BarChart className="h-4 w-4 mr-2" />
                    Results
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full justify-start mt-2"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4 mr-2" />
                  ) : (
                    <Moon className="h-4 w-4 mr-2" />
                  )}
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        
        {/* Desktop navigation */}
        <div className="hidden md:flex items-center gap-4">
          <nav className="flex items-center gap-4">
            <Link to="/">
              <Button variant={location.pathname === "/" ? "default" : "ghost"} size="sm" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Button>
            </Link>
            <Link to="/quiz/new">
              <Button variant={location.pathname === "/quiz/new" ? "default" : "ghost"} size="sm" className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                <span>Create Quiz</span>
              </Button>
            </Link>
            <Link to="/results">
              <Button variant={location.pathname === "/results" ? "default" : "ghost"} size="sm" className="flex items-center gap-2">
                <BarChart className="h-4 w-4" />
                <span>Results</span>
              </Button>
            </Link>
          </nav>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
