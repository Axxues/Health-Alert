import { httpClient } from "@/services/core/client";
import type { LoginRequest, LoginResponse } from "../types/auth.types";

export const authApi = {
  async login(req: LoginRequest): Promise<LoginResponse> {
    const res = await httpClient<LoginResponse>("/auth/login", {
      method: "post",
      data: req,
    });
    if (!res.data) throw new Error(res.message || "Sign in failed");
    return res.data;
  },
};
