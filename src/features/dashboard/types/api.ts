/** Stats from GET api/dashboard/stats (or mock). */
export interface DashboardStats {
  totalUsers: number;
  totalStations: number;
  activeStations?: number;
  pendingRequests: number;
  totalComplaints?: number;
  emergencyServicesCount?: number;
}

/** Mock stats when API is not available. */
export const MOCK_DASHBOARD_STATS: DashboardStats = {
  totalUsers: 1240,
  totalStations: 89,
  activeStations: 82,
  pendingRequests: 5,
  totalComplaints: 12,
  emergencyServicesCount: 4,
};
