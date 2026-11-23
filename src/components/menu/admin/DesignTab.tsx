import { Check } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { THEME_PRESETS } from "@/lib/menu/defaults";
import { useMenuStore } from "@/lib/menu/store";
import type { ThemeSettings } from "@/lib/menu/types";
import { cn } from "@/lib/utils";

import { ColorField, Section } from "./fields";

export function DesignTab() {
  const { draft, updateDraft } = useMenuStore();
  const t = draft.theme;
  const set = (patch: Partial<ThemeSettings>) => updateDraft((s) => ({ ...s, theme: { ...s.theme, ...patch } }));
  const setColor = (key: "background" | "primary" | "accent" | "text" | "page", value: string) =>
    set({ [key]: value, presetId: "custom" });

  return (
    <div className="space-y-4">
      <Section title="Theme" description="Start from a ready-made look, then fine-tune the colors.">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {THEME_PRESETS.map((preset) => {
            const active = t.presetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => set({ ...preset.colors, presetId: preset.id })}
                className={cn(
                  "group relative rounded-lg border p-2 text-left transition-colors",
                  active ? "border-primary bg-accent" : "border-border hover:border-primary/60",
                )}
              >
                <div className="flex h-10 overflow-hidden rounded-md" style={{ background: preset.colors.background }}>
                  <span className="m-auto flex gap-1">
                    {[preset.colors.primary, preset.colors.accent, preset.colors.text].map((c) => (
                      <span key={c} className="size-3 rounded-full" style={{ background: c }} />
                    ))}
                  </span>
                </div>
                <span className="mt-1.5 block text-xs font-medium text-foreground">{preset.name}</span>
                {active && <Check className="absolute right-2 top-2 size-3.5 text-primary" />}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title="Colors">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ColorField id="c-bg" label="Background" value={t.background} onChange={(v) => setColor("background", v)} />
          <ColorField id="c-primary" label="Brand (gold)" value={t.primary} onChange={(v) => setColor("primary", v)} />
          <ColorField id="c-accent" label="Accent" value={t.accent} onChange={(v) => setColor("accent", v)} />
          <ColorField id="c-text" label="Text" value={t.text} onChange={(v) => setColor("text", v)} />
          <ColorField id="c-page" label="Page & spine" value={t.page} onChange={(v) => setColor("page", v)} />
        </div>
      </Section>

      <Section title="Book">
        <SliderField label="Book size" value={Math.round(t.bookScale * 100)} min={60} max={100} unit="%" onChange={(v) => set({ bookScale: v / 100 })} />
        <SliderField label="Page shadows" value={Math.round(t.shadow * 100)} min={0} max={100} unit="%" onChange={(v) => set({ shadow: v / 100 })} />
        <SliderField label="Corner rounding" value={t.radius} min={0} max={20} unit="px" onChange={(v) => set({ radius: v })} />
      </Section>
    </div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="font-mono text-xs text-muted-foreground">
          {value}
          {unit}
        </span>
      </div>
      <Slider value={[value]} min={min} max={max} step={1} onValueChange={(v) => onChange(v[0] ?? value)} aria-label={label} />
    </div>
  );
}
