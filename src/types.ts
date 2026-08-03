export type PerformanceStatus = 'pending' | 'active' | 'completed';
export type MatchStatus = 'pending' | 'active' | 'completed';
export type ActiveView = 'forms' | 'combat' | 'idle' | 'event';

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

export interface Match {
  id: string;
  redCorner: {
    name: string;
    photoUrl: string;
    celebrationPhotoUrl: string;
  };
  blueCorner: {
    name: string;
    photoUrl: string;
    celebrationPhotoUrl: string;
  };
  winner: 'red' | 'blue' | null;
  status: MatchStatus;
  weightClass?: string;
  victoryMethod?: string;
}

export interface GlobalSettings {
  activeView: ActiveView;
  activeId: string | null;
  showWinnerAnimation: boolean;
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
