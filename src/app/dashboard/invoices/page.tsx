import { getInvoicesForView } from "@/app/actions/invoices";
import { InvoicesView } from "./invoices-view";

export default async function InvoicesPage() {
  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth() + 1;

  const dbInvoices = await getInvoicesForView(year, month).catch(() => []);

  return <InvoicesView initialInvoices={dbInvoices} initialYear={year} initialMonth={month} />;
}
