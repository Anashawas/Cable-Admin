export interface RefundHistory {
  id: number;
  reservationId: number;
  reservationNumber: string;
  previousStatusId?: number | null;
  previousStatusName?: string | null;
  currentStatusId: number;
  currentStatusName: string;
  actionType: string;
  actionByUserId: number;
  actionByUserName: string;
  actionDate: string;
  comments?: string | null;
  changedFields?: string | null;
}

export interface RefundTimelineProps {
  histories: RefundHistory[];
  isLoading?: boolean;
  error?: string | null;
}