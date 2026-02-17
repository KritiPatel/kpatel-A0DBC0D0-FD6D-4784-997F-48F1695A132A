import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TaskState, taskAdapter } from './task.reducer';
import { TaskStatus } from '@task-manager/data';

export const selectTaskState = createFeatureSelector<TaskState>('tasks');

const { selectAll, selectEntities, selectTotal } = taskAdapter.getSelectors();

export const selectAllTasks = createSelector(selectTaskState, selectAll);
export const selectTaskEntities = createSelector(selectTaskState, selectEntities);
export const selectTaskTotal = createSelector(selectTaskState, selectTotal);
export const selectTaskLoading = createSelector(selectTaskState, (s) => s.loading);
export const selectTaskError = createSelector(selectTaskState, (s) => s.error);
export const selectTaskFilters = createSelector(selectTaskState, (s) => s.filters);

export const selectTasksByStatus = (status: TaskStatus) =>
  createSelector(selectAllTasks, (tasks) =>
    tasks.filter((t) => t.status === status).sort((a, b) => a.position - b.position)
  );

export const selectTodoTasks = selectTasksByStatus(TaskStatus.TODO);
export const selectInProgressTasks = selectTasksByStatus(TaskStatus.IN_PROGRESS);
export const selectDoneTasks = selectTasksByStatus(TaskStatus.DONE);

export const selectTaskStats = createSelector(selectAllTasks, (tasks) => ({
  total: tasks.length,
  todo: tasks.filter((t) => t.status === TaskStatus.TODO).length,
  inProgress: tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length,
  done: tasks.filter((t) => t.status === TaskStatus.DONE).length,
}));
