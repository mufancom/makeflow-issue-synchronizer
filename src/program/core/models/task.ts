export type TaskStage = 'to-do' | 'in-progress' | 'done' | 'canceled';

export interface TaskTag {
  id: string;
  name: string;
}
