import { useState } from "react";
import { Button } from "../ui/Button";
import { basenameService } from "../../services/basename.service";
import { useUIStore } from "../../store/ui.store";

interface RegisterButtonProps {
  name: string;
  disabled?: boolean;
  fullWidth?: boolean;
}

export function RegisterButton({ name, disabled, fullWidth }: RegisterButtonProps) {
  const [loading, setLoading] = useState(false);
  const addToast = useUIStore((state) => state.addToast);
  const trackEvent = useUIStore((state) => state.trackEvent);

  const handleClick = async () => {
    try {
      setLoading(true);
      trackEvent("registerClicks");
      const { checkoutUrl } = await basenameService.registerIntent(name);
      window.open(checkoutUrl, "_blank", "noopener,noreferrer");
      addToast({ variant: "info", message: "Opening official registrar…" });
    } catch (error) {
      addToast({
        variant: "error",
        message: error instanceof Error ? error.message : "Could not create register intent",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button type="button" onClick={handleClick} disabled={disabled || loading} fullWidth={fullWidth}>
      {loading ? "Loading…" : "Register"}
    </Button>
  );
}
