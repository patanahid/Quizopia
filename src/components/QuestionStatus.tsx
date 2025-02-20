import { cn } from "@/lib/utils";

interface QuestionStatusProps {
  number: number;
  status: "unattempted" | "attempted" | "review";
  isActive: boolean;
  onClick: () => void;
}

export function QuestionStatus({ number, status, isActive, onClick }: QuestionStatusProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200",
        {
          "bg-muted text-muted-foreground dark:bg-muted/50": status === "unattempted" && !isActive,
          "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300": status === "attempted" && !isActive,
          "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300": status === "review" && !isActive,
          "ring-2 ring-offset-2 ring-offset-background scale-110 shadow-lg": isActive,
          "ring-primary": isActive && status === "unattempted",
          "ring-green-500": isActive && status === "attempted",
          "ring-amber-500": isActive && status === "review",
          "hover:ring-2 hover:ring-offset-2 hover:ring-offset-background hover:scale-105": !isActive,
          "hover:ring-primary": !isActive && status === "unattempted",
          "hover:ring-green-500": !isActive && status === "attempted",
          "hover:ring-amber-500": !isActive && status === "review",
        }
      )}
    >
      {number}
    </button>
  );
}
