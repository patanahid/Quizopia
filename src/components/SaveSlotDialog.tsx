import { useState, useEffect } from "react";
import { SaveSlot } from "@/hooks/useSaveSystem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Save, Trash2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface SaveSlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  saveSlots: SaveSlot[];
  onSave: (name: string) => void;
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export function SaveSlotDialog({
  open,
  onOpenChange,
  saveSlots,
  onSave,
  onLoad,
  onDelete,
  onClearAll,
}: SaveSlotDialogProps) {
  const [newSaveName, setNewSaveName] = useState("");

  // Clear input when dialog closes
  useEffect(() => {
    if (!open) {
      setNewSaveName("");
    }
  }, [open]);

  const handleSave = () => {
    if (!newSaveName.trim()) return;
    onSave(newSaveName.trim());
    setNewSaveName("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Save Game</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* New Save Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Enter save name..."
              value={newSaveName}
              onChange={(e) => setNewSaveName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSave();
                }
              }}
            />
            <Button onClick={handleSave} disabled={!newSaveName.trim()}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>

          {/* Save Slots List */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Saved Games</h3>
              {saveSlots.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onClearAll}
                >
                  Clear All Saves
                </Button>
              )}
            </div>
            {saveSlots.map((slot) => (
              <div
                key={slot.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border bg-card",
                  slot.timestamp === Math.max(...saveSlots.map(s => s.timestamp)) && "border-primary"
                )}
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
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onLoad(slot.id)}
                  >
                    Load
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(slot.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            {saveSlots.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No saves found
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
