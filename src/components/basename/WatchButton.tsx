import { useState } from "react";
import { Button } from "../ui/Button";
import { basenameService } from "../../services/basename.service";
import { useUIStore } from "../../store/ui.store";

interface WatchButtonProps {
  name: string;
  fullWidth?: boolean;
}

export function WatchButton({ name, fullWidth }: WatchButtonProps) {
  const [loading, setLoading] = useState(false);
  const addToast = useUIStore((state) => state.addToast);
  const trackEvent = useUIStore((state) => state.trackEvent);

  const handleClick = async () => {
    try {
      setLoading(true);
      trackEvent("watchClicks");
      await basenameService.watchName(name);
      addToast({ variant: "success", message: `${name} added to watchlist` });
    } catch (error) {
      addToast({
        variant: "error",
        message: error instanceof Error ? error.message : "Could not add to watchlist",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button type="button" variant="secondary" onClick={handleClick} disabled={loading} fullWidth={fullWidth}>
      {loading ? "Adding…" : "Watch"}
    </Button>
  );
}
