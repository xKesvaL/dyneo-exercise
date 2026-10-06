import { IconAlertCircle, IconRefresh } from "@tabler/icons-react";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export const ConnectionLostAlert = ({ onRetry }: { onRetry: () => void }) => (
  <Alert variant="destructive" className="mx-4 mb-3 w-auto">
    <IconAlertCircle />
    <AlertTitle>We lost the connection</AlertTitle>
    <AlertDescription>
      We tried to reconnect a few times without success. New activity can’t be shown right now, but
      what you see below is still available.
    </AlertDescription>
    <AlertAction>
      <Button size="xs" variant="outline" onClick={onRetry}>
        <IconRefresh data-icon="inline-start" />
        Try again
      </Button>
    </AlertAction>
  </Alert>
);

interface PausedBannerProps {
  newCount: number;
  onResume: () => void;
}

export const PausedBanner = ({ newCount, onResume }: PausedBannerProps) => (
  <div
    role="status"
    className="flex flex-wrap items-center justify-between gap-2 border-y bg-muted px-4 py-2 text-sm"
  >
    <span>
      <strong className="font-medium">Updates are paused.</strong>{" "}
      {newCount > 0
        ? `${newCount.toLocaleString()} new ${newCount === 1 ? "entry is" : "entries are"} waiting.`
        : "Nothing new yet."}
    </span>
    <Button size="xs" onClick={onResume}>
      {newCount > 0 ? "Show latest" : "Resume"}
    </Button>
  </div>
);
