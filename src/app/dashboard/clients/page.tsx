import { getClients } from "@/app/actions/clients";
import ClientsView from "./clients-view";

export default async function ClientsPage() {
  const clients = await getClients().catch(() => []);
  return <ClientsView dbClients={clients} />;
}
