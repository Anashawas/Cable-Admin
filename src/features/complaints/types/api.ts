export enum ComplaintStatus {
  New = 0,
  NotComplaint = 1,
  Solved = 2,
  Opened = 3,
  FollowUp = 4,
  Unsolved = 5,
  SystemIssue = 6,
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
  /** Audit timestamps — when it was submitted, and when it last changed. */
  createdAt?: string | null;
  modifiedAt?: string | null;
  // Sprint 5 (§13.1): "problem with this session" complaints carry their session.
  /** General | ChargingSession */
  kind?: "General" | "ChargingSession" | string | null;
  /** ChargingSession: WrongCost | StoppedEarly | NoEnergy | CableStuck | PlugBroken | Other */
  reason?: string | null;
  imageFileName?: string | null;
  /** The partner's / admin's answer, shown to the driver in the app. */
  reply?: string | null;
  ocppTransactionId?: number | null;
  session?: ComplaintSessionDto | null;
}

/** The session behind a ChargingSession complaint (Application/Ocpp/LiveCharging/SessionIssues.cs). */
export interface ComplaintSessionDto {
  sessionId: number;
  chargerId: number;
  chargerName?: string | null;
  connectorId: number;
  startedAt: string;
  stoppedAt?: string | null;
  energyKwh?: number | null;
  costFils?: number | null;
  costJod?: number | null;
  /** App | Sticker | Card | Operator */
  startMethod: string;
  stopReasonText?: string | null;
  receiptNo?: string | null;
}
