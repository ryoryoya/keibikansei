import { getPayrollRunForView } from "@/app/actions/payroll";
import { PayrollView } from "./payroll-view";

export default async function PayrollPage() {
  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth() + 1;

  const dbRun = await getPayrollRunForView(year, month).catch(() => null);

  return <PayrollView initialRun={dbRun} initialYear={year} initialMonth={month} />;
}
