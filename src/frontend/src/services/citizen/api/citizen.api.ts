import { getSessionParams, httpClient } from "@/services/core/client";
import type { CitizenReply } from "../types/citizen.types";

export async function askCitizen(q: string): Promise<CitizenReply> {
  const res = await httpClient<CitizenReply>("/citizen/ask", {
    method: "post",
    data: { q },
    params: { ...getSessionParams() },
  });
  return res.data ?? { reply: "" };
}
