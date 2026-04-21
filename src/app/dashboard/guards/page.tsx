import { getGuards } from "@/app/actions/guards";
import GuardsView from "./guards-view";

export default async function GuardsPage() {
  const guards = await getGuards().catch(() => []);
  return <GuardsView dbGuards={guards} />;
}
