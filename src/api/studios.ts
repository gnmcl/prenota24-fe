import apiClient from "./client";
import type { CreateStudioRequest, Studio, UUID } from "../types";

const STUDIOS_PATH = "/studios";

/**
 * Create a new Studio tenant.
 */
export async function createStudio(payload: CreateStudioRequest): Promise<Studio> {
  const { data } = await apiClient.post<Studio>(STUDIOS_PATH, payload);
  return data;
}

/**
 * Fetch a Studio by its UUID.
 */
export async function getStudio(id: UUID): Promise<Studio> {
  const { data } = await apiClient.get<Studio>(`${STUDIOS_PATH}/${id}`);
  return data;
}
