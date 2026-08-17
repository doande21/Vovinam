export type PerformanceStatus = 'pending' | 'active' | 'completed';
export type MatchStatus = 'pending' | 'active' | 'completed';
export type ActiveView = 'forms' | 'combat' | 'combat_led' | 'combat_tv' | 'idle' | 'event';

export interface JudgeScore {
  score: number;
  name: string;
}

export interface Performance {
  id: string;
  name: string;
  competitor: string;
  scores: Record<string, JudgeScore>;
  averageScore: number;
  status: PerformanceStatus;
  order: number;
  category?: 'thi_quyen' | 'vo_nhac';
}

export interface CombatVote {
  id: string;
  judgeId: string; // 'judge_1' | 'judge_2' | 'judge_3' or user.uid
  judgeName: string;
  corner: 'red' | 'blue';
  points: number; // 1 | 2
  timestamp: number;
}

export interface CombatScoreEvent {
  id: string;
  timestamp: number;
  corner: 'red' | 'blue';
  points: number;
  judges: string[];
  description: string;
}

export interface Match {
  id: string;
  redCorner: {
    name: string;
    photoUrl: string;
    celebrationPhotoUrl: string;
    unit?: string;
  };
  blueCorner: {
    name: string;
    photoUrl: string;
    celebrationPhotoUrl: string;
    unit?: string;
  };
  redScore: number;
  blueScore: number;
  redPenalties?: number;
  bluePenalties?: number;
  round: number; // 1, 2, 3
  timeRemaining?: number; // seconds, default 120 (2:00)
  isTimerRunning?: boolean;
  timerLastUpdated?: number;
  winner: 'red' | 'blue' | null;
  status: MatchStatus;
  weightClass?: string;
  victoryMethod?: string;
  activeVotes?: CombatVote[];
  scoreLog?: CombatScoreEvent[];
}

export interface GlobalSettings {
  activeView: ActiveView;
  activeId: string | null;
  showWinnerAnimation: boolean;
  showScoresAndLeaderboard?: boolean; // When false: hide score & leaderboard on public LED for privacy
  eventTitle?: string;
  eventSubtitle?: string;
  organizer?: string;
  eventBgUrl?: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export interface Performance {
  id: string;
  name: string;
  competitor: string;
  scores: Record<string, JudgeScore>;
  averageScore: number;
  status: PerformanceStatus;
  order: number;
  category?: 'thi_quyen' | 'vo_nhac';
  bgUrl?: string; // Đã thêm
}