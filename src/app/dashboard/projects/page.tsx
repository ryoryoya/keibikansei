import { getProjects } from "@/app/actions/projects";
import ProjectsView from "./projects-view";

export default async function ProjectsPage() {
  const projects = await getProjects().catch(() => []);
  return <ProjectsView dbProjects={projects} />;
}
