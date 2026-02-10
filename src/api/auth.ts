import apiClient from "./client";
import type { LoginRequest, LoginResponse } from "../types";

const AUTH_PATH = "/auth";

/**
 * Authenticate a user with email + password.
 * Returns a JWT access token and the user profile.
 */
export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>(`${AUTH_PATH}/login`, payload);
  return data;
}
