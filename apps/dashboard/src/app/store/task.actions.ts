import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { ITask, CreateTaskDto, UpdateTaskDto, TaskFilterDto } from '@task-manager/data';

export const TaskActions = createActionGroup({
  source: 'Tasks',
  events: {
    'Load Tasks': props<{ filters?: TaskFilterDto }>(),
    'Load Tasks Success': props<{ tasks: ITask[] }>(),
    'Load Tasks Failure': props<{ error: string }>(),

    'Create Task': props<{ dto: CreateTaskDto }>(),
    'Create Task Success': props<{ task: ITask }>(),
    'Create Task Failure': props<{ error: string }>(),

    'Update Task': props<{ id: string; dto: UpdateTaskDto }>(),
    'Update Task Success': props<{ task: ITask }>(),
    'Update Task Failure': props<{ error: string }>(),

    'Delete Task': props<{ id: string }>(),
    'Delete Task Success': props<{ id: string }>(),
    'Delete Task Failure': props<{ error: string }>(),

    'Set Filter': props<{ filters: TaskFilterDto }>(),
    'Clear Error': emptyProps(),
  },
});
