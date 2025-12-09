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
  color?: string; // New property for note theme
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