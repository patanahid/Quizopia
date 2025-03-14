import { MessageCircleQuestion, Moon, Sun, Home, PlusCircle, BarChart } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "./ui/button";
import { Link, useLocation } from "react-router-dom";

export function Header() {
  const { theme, setTheme } = useTheme();
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <MessageCircleQuestion className="h-6 w-6" />
            <span className="text-xl font-bold">Quizopia</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <nav className="hidden md:flex items-center gap-4">
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
