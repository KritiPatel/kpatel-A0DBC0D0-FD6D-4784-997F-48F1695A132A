import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, mergeMap, catchError, switchMap } from 'rxjs/operators';
import { TaskService } from '../services/task.service';
import { TaskActions } from './task.actions';

@Injectable()
export class TaskEffects {
  private actions$ = inject(Actions);
  private taskService = inject(TaskService);

  // load tasks effect
  loadTasks$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TaskActions.loadTasks),
      switchMap(({ filters }) => {
        // console.log('loading tasks with filters:', filters);
        return this.taskService.getTasks(filters).pipe(
          map((tasks) => TaskActions.loadTasksSuccess({ tasks })),
          catchError((err) =>
            of(TaskActions.loadTasksFailure({ error: err?.error?.message || 'Failed to load tasks' }))
          )
        );
      })
    )
  );

  createTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TaskActions.createTask),
      mergeMap(({ dto }) =>
        this.taskService.createTask(dto).pipe(
          map((task) => TaskActions.createTaskSuccess({ task })),
          catchError((err) =>
            of(TaskActions.createTaskFailure({ error: err?.error?.message || 'Failed to create task' }))
          )
        )
      )
    )
  );

  updateTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TaskActions.updateTask),
      mergeMap(({ id, dto }) =>
        this.taskService.updateTask(id, dto).pipe(
          map((task) => TaskActions.updateTaskSuccess({ task })),
          catchError((err) =>
            of(TaskActions.updateTaskFailure({ error: err?.error?.message || 'Failed to update task' }))
          )
        )
      )
    )
  );

  deleteTask$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TaskActions.deleteTask),
      mergeMap(({ id }) =>
        this.taskService.deleteTask(id).pipe(
          map(() => TaskActions.deleteTaskSuccess({ id })),
          catchError((err) =>
            of(TaskActions.deleteTaskFailure({ error: err?.error?.message || 'Failed to delete task' }))
          )
        )
      )
    )
  );
}
