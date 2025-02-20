import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { SaveSlot } from "@/hooks/useSaveSystem";
import { format } from "date-fns";
import { Clock, Play, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResumeQuizDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saveSlots: SaveSlot[];
  onResume: (saveId: string) => void;
  onStartNew: () => void;
}

export function ResumeQuizDialog({
  open,
  onOpenChange,
  saveSlots,
  onResume,
  onStartNew,
}: ResumeQuizDialogProps) {
  const [selectedSaveId, setSelectedSaveId] = useState<string | null>(
    // Select the latest save by default
    saveSlots.length > 0 
      ? saveSlots.reduce((latest, current) => 
          current.timestamp > latest.timestamp ? current : latest
        ).id
      : null
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resume Previous Game?</DialogTitle>
          <DialogDescription>
            You have previous saves available. Would you like to resume one of them or start fresh?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4">
          {saveSlots.map((slot) => (
            <div
              key={slot.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg border bg-card cursor-pointer transition-colors",
                selectedSaveId === slot.id && "border-primary",
                "hover:border-primary/50"
              )}
              onClick={() => setSelectedSaveId(slot.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">
                    {slot.name}
                  </span>
                  {slot.isAutosave && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                      Auto
                    </span>
                  )}
                  {slot.timestamp === Math.max(...saveSlots.map(s => s.timestamp)) && (
                    <span className="text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded">
                      Latest
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {format(slot.timestamp, 'MMM d, yyyy h:mm a')}
                </div>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onStartNew}
            className="flex-1 sm:flex-none"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Start Fresh
          </Button>
          <Button
            onClick={() => selectedSaveId && onResume(selectedSaveId)}
            disabled={!selectedSaveId}
            className="flex-1 sm:flex-none"
          >
            <Play className="w-4 h-4 mr-2" />
            Resume Selected
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
