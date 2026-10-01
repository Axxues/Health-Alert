import { httpClient } from "@/services/core/client";
import type { User, CreateUserReq } from "../types/users.types";

export async function listUsers(): Promise<User[]> {
  const res = await httpClient<User[]>("/users", { method: "get" });
  return res.data ?? [];
}
export async function createUser(req: CreateUserReq): Promise<User> {
  const res = await httpClient<User>("/users", { method: "post", data: req });
  if (!res.data) throw new Error("create failed");
  return res.data;
}
export async function setUserActive(id: number, active: boolean): Promise<void> {
  await httpClient(`/users/${id}/active`, { method: "post", data: { active } });
}
export async function setUserRole(id: number, role: string): Promise<void> {
  await httpClient(`/users/${id}/role`, { method: "post", data: { role } });
}
