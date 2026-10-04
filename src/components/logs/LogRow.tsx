import { memo, useEffect, useState } from "react";
import { IconCheck, IconChevronDown, IconCopy } from "@tabler/icons-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { LEVELS, type LogEntry } from "@/lib/config";
import { formatDuration, metadataRows, serviceName } from "@/lib/log-format";

const LOCALE = "fr-FR";

const timeFormat = new Intl.DateTimeFormat(LOCALE, {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const fullDateFormat = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: "full",
  timeStyle: "medium",
});

const formatTime = (date: Date) =>
  Number.isNaN(date.getTime()) ? "--:--:--" : timeFormat.format(date);

const formatFullDate = (date: Date, fallback: string) =>
  Number.isNaN(date.getTime()) ? fallback : fullDateFormat.format(date);

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <Button
      size="xs"
      variant="outline"
      onClick={() => navigator.clipboard.writeText(text).then(() => setCopied(true))}
    >
      {copied ? <IconCheck data-icon="inline-start" /> : <IconCopy data-icon="inline-start" />}
      {copied ? "Copied" : "Copy for support"}
    </Button>
  );
};

export const LogRow = memo(({ entry }: { entry: LogEntry }) => {
  const [showTechnical, setShowTechnical] = useState(false);
  const level = LEVELS.find((l) => l.value === entry.level) ?? LEVELS[1];
  const Icon = level.icon;
  const service = serviceName(entry.service);
  const rows = metadataRows(entry.metadata);
  const rawJson = JSON.stringify(entry.raw, null, 2);

  return (
    <li className={cn("group/row border-l-4 text-sm", level.tone.stripe, level.tone.row)}>
      <Collapsible>
        <CollapsibleTrigger className="flex w-full items-center gap-3 px-3 py-2.5 text-left outline-none hover:bg-foreground/5 focus-visible:bg-foreground/5 [&[data-panel-open]>svg:last-child]:rotate-180">
          <Icon aria-hidden className={cn("size-5 shrink-0", level.tone.icon)} />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate font-medium group-has-[[data-panel-open]]/row:whitespace-normal">
              {entry.message}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              <time dateTime={entry.timestamp} className="tabular-nums">
                {formatTime(entry.date)}
              </time>
              {service && ` · ${service}`}
            </span>
          </span>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
              level.tone.badge,
            )}
          >
            {level.label}
          </span>
          <IconChevronDown
            aria-hidden
            className="size-4 shrink-0 text-muted-foreground transition-transform"
          />
        </CollapsibleTrigger>

        <CollapsibleContent className="flex flex-col gap-3 bg-background/60 px-4 py-3 pl-11 text-sm">
          <p className="text-muted-foreground">{level.hint}</p>

          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5">
            <dt className="text-muted-foreground">When</dt>
            <dd>{formatFullDate(entry.date, entry.timestamp)}</dd>
            {service && (
              <>
                <dt className="text-muted-foreground">Where</dt>
                <dd>{service}</dd>
              </>
            )}
            {entry.durationMs !== null && (
              <>
                <dt className="text-muted-foreground">Took</dt>
                <dd>{formatDuration(entry.durationMs)}</dd>
              </>
            )}
            {rows.map((row) => (
              <div key={row.key} className="col-span-2 grid grid-cols-subgrid">
                <dt className="text-muted-foreground">{row.label}</dt>
                <dd className="break-all">{row.value}</dd>
              </div>
            ))}
          </dl>

          <div className="flex flex-wrap items-center gap-2">
            <CopyButton text={rawJson} />
            <Button size="xs" variant="ghost" onClick={() => setShowTechnical((v) => !v)}>
              {showTechnical ? "Hide technical details" : "Show technical details"}
            </Button>
          </div>

          {showTechnical && (
            <pre className="overflow-x-auto rounded-md border bg-background p-2 font-mono text-xs">
              {rawJson}
            </pre>
          )}
        </CollapsibleContent>
      </Collapsible>
      <Separator />
    </li>
  );
});
