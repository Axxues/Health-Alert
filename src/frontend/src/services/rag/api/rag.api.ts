import { getSessionParams, httpClient } from "@/services/core/client";
import type { RagAnswer } from "../types/rag.types";

export async function askLibrary(q: string): Promise<RagAnswer> {
  const res = await httpClient<RagAnswer>("/rag/ask", {
    method: "post",
    data: { q },
    params: { ...getSessionParams() },
  });
  return res.data ?? { answer: "No answer yet.", citations: [] };
}
