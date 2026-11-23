import { useRef, useState, type ChangeEvent } from "react";
import { Download, MonitorSmartphone, RotateCcw, Upload } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { downloadJson } from "@/lib/menu/files";
import { parseMenuState } from "@/lib/menu/schema";
import { useMenuStore } from "@/lib/menu/store";

import { Section } from "./fields";

export function DataTab() {
  const { draft, replaceDraft, resetToDefault, shared } = useMenuStore();
  const [confirmReset, setConfirmReset] = useState(false);
  const importInput = useRef<HTMLInputElement>(null);

  const onImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const parsed = parseMenuState(JSON.parse(await file.text()));
      if (!parsed) throw new Error("invalid");
      replaceDraft(parsed);
      toast.success("Settings imported", { description: "Review the preview, then press Save changes." });
    } catch {
      toast.error("That file isn't a menu settings export.");
    }
  };

  return (
    <div className="space-y-4">
      {!shared && (
        <div className="flex gap-3 rounded-xl border border-primary/40 bg-accent/60 p-4 text-sm">
          <MonitorSmartphone className="mt-0.5 size-5 flex-none text-primary" />
          <div className="space-y-1">
            <p className="font-medium text-foreground">Saved on this device only</p>
            <p className="text-muted-foreground">
              Changes are stored in this browser. Customers on other phones or computers still see the default menu.
              Use Export to move your setup to another device.
            </p>
          </div>
        </div>
      )}

      <Section title="Backup" description="Export includes every setting and all page images.">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => downloadJson(`${draft.general.restaurantName || "menu"}-settings.json`.toLowerCase(), draft)}
          >
            <Download /> Export settings
          </Button>
          <Button variant="outline" onClick={() => importInput.current?.click()}>
            <Upload /> Import settings
          </Button>
          <input ref={importInput} type="file" accept="application/json,.json" className="hidden" onChange={onImport} />
        </div>
      </Section>

      <Section title="Reset" description="Restore the original cover, pages, text and Midnight Gold theme.">
        <Button variant="destructive" onClick={() => setConfirmReset(true)}>
          <RotateCcw /> Reset to default
        </Button>
      </Section>

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset everything to default?</AlertDialogTitle>
            <AlertDialogDescription>
              All uploaded pages and custom settings on this device will be removed. This can't be undone unless you
              exported a backup.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                void resetToDefault().then(() => toast.success("Menu reset to default"));
              }}
            >
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
