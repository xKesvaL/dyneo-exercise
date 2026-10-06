import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LEVELS, type Level } from "@/lib/config";

const levelsLabel = (levels: Level[]) => {
  if (levels.length === 0) return "Everything";
  return LEVELS.filter((l) => levels.includes(l.value))
    .map((l) => l.label)
    .join(", ");
};

interface LevelFilterProps {
  levels: Level[];
  onChange: (levels: Level[]) => void;
}

export const LevelFilter = ({ levels, onChange }: LevelFilterProps) => (
  <div className="flex flex-wrap items-center gap-2">
    <span id="filter-label" className="text-sm text-muted-foreground">
      Show
    </span>
    <Select multiple value={levels} onValueChange={(value) => onChange(value as Level[])}>
      <SelectTrigger aria-labelledby="filter-label" className="min-w-44">
        <SelectValue>{levelsLabel(levels)}</SelectValue>
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} align="start" className="min-w-56">
        {LEVELS.map((l) => (
          <SelectItem key={l.value} value={l.value} title={l.hint}>
            <l.icon aria-hidden className={l.tone.icon} />
            {l.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    {levels.length > 0 && (
      <Button size="xs" variant="ghost" onClick={() => onChange([])}>
        Show everything
      </Button>
    )}
  </div>
);
