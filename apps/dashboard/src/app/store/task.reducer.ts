import { createReducer, on } from '@ngrx/store';
import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { ITask, TaskFilterDto } from '@task-manager/data';
import { TaskActions } from './task.actions';

export interface TaskState extends EntityState<ITask> {
  loading: boolean;
  error: string | null;
  filters: TaskFilterDto;
}

// entity adapter for tasks
export const taskAdapter: EntityAdapter<ITask> = createEntityAdapter<ITask>({
  selectId: (task) => task.id,
  sortComparer: (a, b) => a.position - b.position,
});

export const initialState: TaskState = taskAdapter.getInitialState({
  loading: false,
  error: null,
  filters: {},
});

export const taskReducer = createReducer(
  initialState,

  // load
  on(TaskActions.loadTasks, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  on(TaskActions.loadTasksSuccess, (state, { tasks }) =>
    taskAdapter.setAll(tasks, { ...state, loading: false })
  ),
  on(TaskActions.loadTasksFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // create
  on(TaskActions.createTask, (state) => ({
    ...state,
    loading: true,
  })),
  on(TaskActions.createTaskSuccess, (state, { task }) =>
    taskAdapter.addOne(task, { ...state, loading: false })
  ),
  on(TaskActions.createTaskFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // update
  on(TaskActions.updateTaskSuccess, (state, { task }) =>
    taskAdapter.upsertOne(task, { ...state, loading: false })
  ),
  on(TaskActions.updateTaskFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  })),

  // delete
  on(TaskActions.deleteTaskSuccess, (state, { id }) =>
    taskAdapter.removeOne(id, state)
  ),
  on(TaskActions.deleteTaskFailure, (state, { error }) => ({
    ...state,
    error,
  })),

  on(TaskActions.setFilter, (state, { filters }) => ({
    ...state,
    filters,
  })),

  on(TaskActions.clearError, (state) => ({
    ...state,
    error: null,
  }))
);
