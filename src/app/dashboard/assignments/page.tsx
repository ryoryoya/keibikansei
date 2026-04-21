import { getAssignmentPageData } from "@/app/actions/assignments";
import AssignmentsView from "./assignments-view";

export default async function AssignmentsPage() {
  const now  = new Date();
  const data = await getAssignmentPageData(now.getFullYear(), now.getMonth() + 1).catch(() => ({
    projects: [], guards: [], assignments: [], shiftMap: {},
  }));
  return <AssignmentsView initialData={data} />;
}
