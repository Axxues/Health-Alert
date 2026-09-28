import { getSessionParams, httpClient } from "@/services/core/client";
import { buildPaginatedParams } from "@/utils/api";
import type { Playbook, PlaybookExecution } from "../types/playbook.types";

export async function listPlaybooks(): Promise<Playbook[]> {
  const res = await httpClient<Playbook[]>("/playbooks", {
    params: { ...getSessionParams(), ...buildPaginatedParams({}) },
  });
  return res.data ?? [];
}

export async function executePlaybook(id: number): Promise<PlaybookExecution> {
  const res = await httpClient<PlaybookExecution>(`/playbooks/${id}/execute`, {
    method: "post",
    params: { ...getSessionParams() },
  });
  return res.data ?? { id: 0, playbookId: id, status: "done", log: "" };
}
