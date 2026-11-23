import { useMenuStore } from "@/lib/menu/store";
import type { GeneralSettings } from "@/lib/menu/types";

import { Section, TextField, ToggleField } from "./fields";

export function GeneralTab() {
  const { draft, updateDraft } = useMenuStore();
  const g = draft.general;
  const set = <K extends keyof GeneralSettings>(key: K, value: GeneralSettings[K]) =>
    updateDraft((s) => ({ ...s, general: { ...s.general, [key]: value } }));

  return (
    <div className="space-y-4">
      <Section title="Header text" description="Shown above the menu book as plain text.">
        <TextField id="name" label="Restaurant name" value={g.restaurantName} onChange={(v) => set("restaurantName", v)} />
        <TextField id="subtitle" label="Subtitle" value={g.subtitle} placeholder="Optional" onChange={(v) => set("subtitle", v)} />
        <TextField id="menuTitle" label="Menu title" value={g.menuTitle} placeholder="e.g. The Menu" onChange={(v) => set("menuTitle", v)} />
        <TextField
          id="headerText"
          label="Header note"
          value={g.headerText}
          placeholder="e.g. Tap the cover to open"
          onChange={(v) => set("headerText", v)}
        />
      </Section>

      <Section title="What customers see">
        <ToggleField id="showHeader" label="Header" checked={g.showHeader} onChange={(v) => set("showHeader", v)} />
        <ToggleField id="showCounter" label="Page counter" checked={g.showCounter} onChange={(v) => set("showCounter", v)} />
        <ToggleField id="showArrows" label="Navigation arrows" hint="Swipe, click and keyboard still work when hidden." checked={g.showArrows} onChange={(v) => set("showArrows", v)} />
        <ToggleField id="showFullscreen" label="Full screen button" checked={g.showFullscreen} onChange={(v) => set("showFullscreen", v)} />
      </Section>
    </div>
  );
}
