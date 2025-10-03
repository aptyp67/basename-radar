import { Button } from "../ui/Button";
import { useUIStore } from "../../store/ui.store";
import { useLocation, useNavigate } from "react-router-dom";
import type { Availability, NameKind } from "../../types/basename";

interface RegisterButtonProps {
  name: string;
  priceWei?: string;
  availability: Availability;
  reasons: string[];
  kinds: NameKind[];
  length: number;
  disabled?: boolean;
  fullWidth?: boolean;
}

export function RegisterButton({
  name,
  priceWei,
  availability,
  reasons,
  kinds,
  length,
  disabled,
  fullWidth,
}: RegisterButtonProps) {
  const trackEvent = useUIStore((state) => state.trackEvent);
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = () => {
    trackEvent("registerClicks");
    navigate(
      {
        pathname: `/register/${encodeURIComponent(name)}`,
        search: location.search,
      },
      {
        state: {
          priceWei,
          availability,
          reasons,
          kinds,
          length,
        },
      }
    );
  };

  return <Button type="button" onClick={handleClick} disabled={disabled} fullWidth={fullWidth}>Register</Button>;
}
