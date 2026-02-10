import apiClient from "./client";
import type { AppUser, CreateAppUserRequest, UUID } from "../types";

const USERS_PATH = "/users";

/**
 * Create a new AppUser inside a Studio.
 */
export async function createAppUser(payload: CreateAppUserRequest): Promise<AppUser> {
  const { data } = await apiClient.post<AppUser>(USERS_PATH, payload);
  return data;
}

/**
 * Fetch an AppUser by UUID.
 */
export async function getAppUser(id: UUID): Promise<AppUser> {
  const { data } = await apiClient.get<AppUser>(`${USERS_PATH}/${id}`);
  return data;
}
