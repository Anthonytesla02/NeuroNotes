export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  isLocked: boolean;
  lockPin?: string;
  tags: string[];
  isSecret?: boolean;
  isPinned?: boolean;
}

export enum ViewMode {
  LIST = 'LIST',
  EDIT = 'EDIT',
  SETTINGS = 'SETTINGS'
}

export interface AIState {
  isGenerating: boolean;
  error: string | null;
}
