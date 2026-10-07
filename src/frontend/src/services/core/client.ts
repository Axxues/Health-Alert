import axios, { type AxiosRequestConfig } from "axios";
import { clearSession, getToken } from "@/utils/auth";
import type { ApiResponse } from "./types";

const apiBase = import.meta.env.VITE_API_URL
  ? `${(import.meta.env.VITE_API_URL as string).replace(/\/+$/, "")}/api`
  : "/api";

export const api = axios.create({ baseURL: apiBase });

// ponytail: in-memory GET cache + array offline queue; IndexedDB/Workbox if offline matters
const getCache = new Map<string, unknown>();
const offlineQueue: Array<() => Promise<unknown>> = [];

export function getSessionParams() {
  return { sessionId: sessionStorage.getItem("ha.session") ?? "anon" };
}

export function queueWhenOffline<T>(fn: () => Promise<T>): Promise<T> | "queued" {
  if (navigator.onLine) return fn();
  offlineQueue.push(fn as () => Promise<unknown>);
  return "queued" as const;
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.params = { ...getSessionParams(), ...config.params };
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) clearSession(); // ponytail: hard logout, no refresh flow until SSO lands
    return Promise.reject(err);
  },
);

export async function httpClient<T>(url: string, config?: AxiosRequestConfig) {
  if (config?.method === undefined || config.method === "get") {
    const key = `${url}?${new URLSearchParams(config?.params).toString()}`;
    const hit = getCache.get(key);
    if (hit) return hit as ApiResponse<T>;
  }
  const res = await api.request<ApiResponse<T>>({ ...config, url });
  if (res.config.method === "get" || res.config.method === undefined) {
    const key = `${url}?${new URLSearchParams(res.config.params).toString()}`;
    getCache.set(key, res.data);
  }
  return res.data;
}
