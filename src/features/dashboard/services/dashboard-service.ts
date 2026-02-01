import { server } from "../../../lib/@axios";
import type { DashboardStats } from "../types/api";
import { MOCK_DASHBOARD_STATS } from "../types/api";

/**
 * GET api/dashboard/stats
 * Returns real counts. Falls back to mock data if API is not implemented (404/network error).
 */
const getDashboardStats = async (
  signal?: AbortSignal
): Promise<DashboardStats> => {
  try {
    const { data } = await server.get<DashboardStats>(
      "api/dashboard/stats",
      { signal }
    );
    if (data && typeof data.totalUsers === "number" && typeof data.totalStations === "number") {
      return {
        totalUsers: data.totalUsers ?? 0,
        totalStations: data.totalStations ?? 0,
        activeStations: data.activeStations,
        pendingRequests: data.pendingRequests ?? 0,
        totalComplaints: data.totalComplaints,
        emergencyServicesCount: data.emergencyServicesCount,
      };
    }
  } catch {
    // API may not exist yet; use mock
  }
  return { ...MOCK_DASHBOARD_STATS };
};

export { getDashboardStats };
