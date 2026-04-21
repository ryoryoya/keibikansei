import { getSites } from "@/app/actions/sites";
import SitesView from "./sites-view";

export default async function SitesPage() {
  const sites = await getSites().catch(() => []);
  return <SitesView dbSites={sites} />;
}
