import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import CreateQuiz from "./pages/CreateQuiz";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <TooltipProvider>
          <div className="min-h-screen bg-background text-foreground">
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/quiz/new" element={<CreateQuiz />} />
                <Route path="/quiz/:id" element={<Index />} />
                <Route path="/quiz/:id/edit" element={<Index />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Toaster />
              <Sonner />
            </BrowserRouter>
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
