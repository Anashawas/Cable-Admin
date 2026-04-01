export enum ComplaintStatus {
  Pending = 0,
  Rejected = 1,
  Solved = 2,
}

/** User who reported the complaint. */
export interface ComplaintUserDto {
  id: number;
  name?: string | null;
}

/** Station concerned by the complaint. */
export interface ComplaintStationDto {
  id: number;
  name?: string | null;
}

/** Single user complaint (UserComplaintDto). Use id for Delete. */
export interface UserComplaintDto {
  id: number;
  note?: string | null;
  status: ComplaintStatus;
  userAccount?: ComplaintUserDto | null;
  chargingPoint?: ComplaintStationDto | null;
}
