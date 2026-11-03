import { GrowthPanel } from "../components/GrowthPanel.tsx";
import { HubExtras } from "../components/HubExtras.tsx";

export function WorkspaceOperationsPage() {
  return (
    <>
      <HubExtras sections={["receipt"]} />
      <GrowthPanel sections={["event", "invoice"]} />
    </>
  );
}
