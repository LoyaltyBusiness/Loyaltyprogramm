import { GrowthPanel } from "../components/GrowthPanel.tsx";
import { HubExtras } from "../components/HubExtras.tsx";

export function WorkspaceBenefitsPage() {
  return (
    <>
      <HubExtras sections={["coupon"]} />
      <GrowthPanel sections={["campaign"]} />
    </>
  );
}
