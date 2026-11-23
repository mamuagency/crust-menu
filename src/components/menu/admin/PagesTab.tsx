import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ImagePlus, RefreshCw, Trash2, Upload } from "lucide-react";
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
import { readImageFile } from "@/lib/menu/files";
import { useMenuStore } from "@/lib/menu/store";
import type { MenuImage } from "@/lib/menu/types";
import { cn } from "@/lib/utils";

import { Section } from "./fields";

async function readImages(files: FileList | File[]): Promise<MenuImage[]> {
  const list = Array.from(files);
  const results = await Promise.allSettled(list.map(readImageFile));
  const images: MenuImage[] = [];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") images.push(r.value);
    else toast.error(`Skipped ${list[i]?.name ?? "a file"}: not an image`);
  });
  return images;
}

export function PagesTab() {
  const { draft, updateDraft } = useMenuStore();
  const [pendingDelete, setPendingDelete] = useState<MenuImage | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const addInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const replaceInput = useRef<HTMLInputElement>(null);
  const replaceTarget = useRef<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const addPages = async (files: FileList | File[]) => {
    const images = await readImages(files);
    if (images.length === 0) return;
    updateDraft((s) => ({ ...s, pages: [...s.pages, ...images] }));
    toast.success(`Added ${images.length} page${images.length === 1 ? "" : "s"}`);
  };

  const onAddChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) void addPages(e.target.files);
    e.target.value = "";
  };

  const onCoverChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const [image] = await readImages([file]);
    if (image) {
      updateDraft((s) => ({ ...s, cover: image }));
      toast.success("Cover replaced");
    }
  };

  const onReplaceChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const target = replaceTarget.current;
    e.target.value = "";
    if (!file || !target) return;
    const [image] = await readImages([file]);
    if (image) {
      updateDraft((s) => ({ ...s, pages: s.pages.map((p) => (p.id === target ? image : p)) }));
      toast.success("Page replaced");
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    updateDraft((s) => {
      const from = s.pages.findIndex((p) => p.id === active.id);
      const to = s.pages.findIndex((p) => p.id === over.id);
      if (from < 0 || to < 0) return s;
      return { ...s, pages: arrayMove(s.pages, from, to) };
    });
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) void addPages(e.dataTransfer.files);
  };

  return (
    <div className="space-y-4">
      <Section title="Cover" description="Shown alone on the front of the book. It is never counted as a menu page.">
        <div className="flex items-center gap-4">
          <img
            src={draft.cover.src}
            alt="Current cover"
            className="h-28 w-auto rounded-md border border-border bg-muted object-contain"
          />
          <div className="min-w-0 space-y-2">
            <p className="truncate text-sm text-foreground">{draft.cover.name}</p>
            <Button variant="outline" size="sm" onClick={() => coverInput.current?.click()}>
              <RefreshCw /> Replace cover
            </Button>
          </div>
        </div>
        <input ref={coverInput} type="file" accept="image/*" className="hidden" onChange={onCoverChange} />
      </Section>

      <Section
        title={`Menu pages (${draft.pages.length})`}
        description="Drag to reorder. Pages appear in the book in this order, after the cover."
      >
        <div
          onDragOver={(e) => {
            if (e.dataTransfer.types.includes("Files")) {
              e.preventDefault();
              setDragOver(true);
            }
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={cn(
            "flex flex-col items-center gap-2 rounded-lg border border-dashed border-input px-4 py-5 text-center transition-colors",
            dragOver && "border-primary bg-accent",
          )}
        >
          <Upload className="size-5 text-primary" />
          <p className="text-sm text-foreground">Drop images here, or</p>
          <Button size="sm" onClick={() => addInput.current?.click()}>
            <ImagePlus /> Upload pages
          </Button>
          <p className="text-xs text-muted-foreground">You can select several images at once.</p>
          <input ref={addInput} type="file" accept="image/*" multiple className="hidden" onChange={onAddChange} />
        </div>

        {draft.pages.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">No menu pages yet — only the cover will show.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={draft.pages.map((p) => p.id)} strategy={rectSortingStrategy}>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {draft.pages.map((page, i) => (
                  <SortablePage
                    key={page.id}
                    page={page}
                    number={i + 1}
                    onReplace={() => {
                      replaceTarget.current = page.id;
                      replaceInput.current?.click();
                    }}
                    onDelete={() => setPendingDelete(page)}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
        <input ref={replaceInput} type="file" accept="image/*" className="hidden" onChange={onReplaceChange} />
      </Section>

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this page?</AlertDialogTitle>
            <AlertDialogDescription>
              “{pendingDelete?.name}” will be removed from the menu book. You can still discard this before saving.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep page</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                const target = pendingDelete;
                if (target) updateDraft((s) => ({ ...s, pages: s.pages.filter((p) => p.id !== target.id) }));
                setPendingDelete(null);
              }}
            >
              Delete page
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SortablePage({
  page,
  number,
  onReplace,
  onDelete,
}: {
  page: MenuImage;
  number: number;
  onReplace: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group relative overflow-hidden rounded-lg border border-border bg-muted",
        isDragging && "z-10 border-primary shadow-lg",
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Drag page ${number} to reorder`}
        className="block w-full cursor-grab touch-none active:cursor-grabbing"
      >
        <img src={page.src} alt={`Page ${number}`} className="aspect-[3/4] w-full object-contain" draggable={false} />
      </button>
      <span className="pointer-events-none absolute left-1.5 top-1.5 flex items-center gap-1 rounded-full bg-background/85 px-2 py-0.5 text-[0.65rem] font-medium text-foreground">
        <GripVertical className="size-3 text-muted-foreground" /> {number}
      </span>
      <div className="flex items-center justify-between gap-1 border-t border-border bg-card px-1.5 py-1">
        <span className="min-w-0 truncate px-1 text-[0.65rem] text-muted-foreground" title={page.name}>
          {page.name}
        </span>
        <div className="flex flex-none">
          <Button variant="ghost" size="icon" className="size-7" onClick={onReplace} aria-label={`Replace page ${number}`}>
            <RefreshCw />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-destructive hover:text-destructive"
            onClick={onDelete}
            aria-label={`Delete page ${number}`}
          >
            <Trash2 />
          </Button>
        </div>
      </div>
    </li>
  );
}
