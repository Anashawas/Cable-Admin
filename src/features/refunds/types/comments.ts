export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  civilId: string;
  applicationRole: {
    id: number | null;
    name: string;
  };
}

export interface RefundComment {
  id: number;
  description: string;
  reservationCampingId: number;
  userId: number;
  user: User;
  createdAt: string | null;
  createdBy: string | null;
  modifiedAt: string | null;
  modifiedBy: string | null;
}