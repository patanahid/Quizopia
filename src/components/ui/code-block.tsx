import { Copy } from "lucide-react";
import { Button } from "./button";
import { toast } from "sonner";

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

export function CodeBlock({ code, language, className }: CodeBlockProps) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard!");
  };

  return (
    <div className="relative group">
      <Button 
        variant="outline" 
        size="sm" 
        className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={copyToClipboard}
      >
        <Copy className="h-4 w-4" />
      </Button>
      <pre className={`p-4 bg-muted rounded-lg overflow-x-auto text-sm max-h-[60vh] whitespace-pre-wrap ${className}`}>
        {language && <div className="text-xs text-muted-foreground mb-2">{language}</div>}
        <code>{code}</code>
      </pre>
    </div>
  );
}
