import { Eye, Save, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMenuStore } from "@/lib/menu/store";

import { DataTab } from "./DataTab";
import { DesignTab } from "./DesignTab";
import { GeneralTab } from "./GeneralTab";
import { PagesTab } from "./PagesTab";

interface AdminPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  livePreview: boolean;
  onLivePreviewChange: (on: boolean) => void;
}

export function AdminPanel({ open, onOpenChange, livePreview, onLivePreviewChange }: AdminPanelProps) {
  const { dirty, save, discard } = useMenuStore();

  const handleSave = async () => {
    try {
      await save();
      toast.success("Changes saved", { description: "They'll still be here after a refresh on this device." });
    } catch (error) {
      console.error(error);
      toast.error("Couldn't save — the browser may be out of storage space.");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        overlayClassName="bg-overlay"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-xl"
      >
        <SheetHeader className="border-b border-border px-5 pb-4 pt-5 text-left">
          <SheetTitle className="font-display text-2xl font-semibold">Menu settings</SheetTitle>
          <SheetDescription>Edit text, colors and pages. Press Save to keep your changes.</SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="pages" className="flex min-h-0 flex-1 flex-col">
          <div className="px-5 pt-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pages">Pages</TabsTrigger>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="design">Design</TabsTrigger>
              <TabsTrigger value="data">Backup</TabsTrigger>
            </TabsList>
          </div>
          <ScrollArea className="min-h-0 flex-1">
            <div className="px-5 pb-6 pt-2">
              <TabsContent value="pages"><PagesTab /></TabsContent>
              <TabsContent value="general"><GeneralTab /></TabsContent>
              <TabsContent value="design"><DesignTab /></TabsContent>
              <TabsContent value="data"><DataTab /></TabsContent>
            </div>
          </ScrollArea>
        </Tabs>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-card px-5 py-3">
          <div className="flex items-center gap-2">
            <Switch id="live-preview" checked={livePreview} onCheckedChange={onLivePreviewChange} />
            <Label htmlFor="live-preview" className="flex items-center gap-1.5 text-xs">
              <Eye className="size-3.5" /> Live preview
            </Label>
          </div>
          <div className="flex items-center gap-2">
            {dirty && <span className="hidden text-xs text-primary sm:inline">Unsaved changes</span>}
            <Button variant="ghost" size="sm" onClick={discard} disabled={!dirty}>
              <Undo2 /> Discard
            </Button>
            <Button size="sm" onClick={() => void handleSave()} disabled={!dirty}>
              <Save /> Save changes
            </Button>
          </div>
        </footer>
      </SheetContent>
    </Sheet>
  );
}
