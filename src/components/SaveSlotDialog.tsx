import { useState } from "react";
import { SaveSlot } from "@/hooks/useSaveSystem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saveToDelete, setSaveToDelete] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleSave = () => {
    if (!newSaveName.trim()) {
      toast.error("Please enter a name for the save");
      return;
    }
    onSave(newSaveName.trim());
    setNewSaveName("");
  };

  const handleDelete = (id: string) => {
    setSaveToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (saveToDelete) {
      onDelete(saveToDelete);
      setShowDeleteConfirm(false);
      setSaveToDelete(null);
    }
  };

  const handleClearAll = () => {
    setShowClearConfirm(true);
  };

  const confirmClearAll = () => {
    onClearAll();
    setShowClearConfirm(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Save Slots</DialogTitle>
            <DialogDescription>
              Manage your quiz progress saves
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Save Slots List */}
            <div className="space-y-2">
              <h3 className="font-medium">Existing Saves</h3>
              {saveSlots.length === 0 ? (
                <p className="text-sm text-muted-foreground">No saves found</p>
              ) : (
                <div className="space-y-2">
                  {saveSlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{slot.name}</span>
                        {slot.isAutosave && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                            Auto
                          </span>
                        )}
                        <span className="text-sm text-muted-foreground">
                          ({format(slot.timestamp, "MMM d, h:mm a")})
                        </span>
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
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(slot.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* New Save Input */}
            <div className="space-y-2">
              <h3 className="font-medium">Create New Save</h3>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter save name"
                  value={newSaveName}
                  onChange={(e) => setNewSaveName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSave();
                    }
                  }}
                />
                <Button onClick={handleSave}>Save</Button>
              </div>
            </div>

            {/* Clear All Button */}
            {saveSlots.length > 0 && (
              <Button
                variant="destructive"
                onClick={handleClearAll}
                className="w-full"
              >
                Clear All Saves
              </Button>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Save?</AlertDialogTitle>
            <AlertDialogDescription>
              {saveToDelete && saveSlots.find(s => s.id === saveToDelete)?.isAutosave
                ? "This is an autosave. Deleting it will reset the quiz and create a new autosave when you restart."
                : "Are you sure you want to delete this save? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSaveToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear All Confirmation Dialog */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Saves?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete all saves, including autosaves. The quiz will be reset and a new autosave will be created when you restart.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClearAll}>
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
