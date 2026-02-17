import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { AuthService } from '../../services/auth.service';
import { TaskService } from '../../services/task.service';
import { TaskActions } from '../../store/task.actions';
import {
  selectTodoTasks,
  selectInProgressTasks,
  selectDoneTasks,
  selectTaskLoading,
  selectTaskError,
  selectTaskStats,
} from '../../store/task.selectors';
import { TaskCardComponent } from './task-card.component';
import { TaskFormComponent } from './task-form.component';
import {
  ITask,
  CreateTaskDto,
  UpdateTaskDto,
  TaskStatus,
  TaskCategory,
  TaskPriority,
} from '@task-manager/data';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, TaskCardComponent, TaskFormComponent],
  template: `
    <!-- Header -->
    <header class="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="inline-flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-xl">
              <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h1 class="text-xl font-bold text-gray-900">Task Manager</h1>
              <p class="text-xs text-gray-500">
                {{ authService.user()?.firstName }} {{ authService.user()?.lastName }}
                <span class="ml-1 px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-medium uppercase">
                  {{ authService.user()?.role }}
                </span>
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            @if (authService.isAdmin()) {
              <button
                (click)="showForm.set(true)"
                class="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 transition shadow-sm"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                New Task
              </button>
            }
            <button
              (click)="authService.logout()"
              class="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium text-sm hover:bg-gray-50 transition"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <!-- Stats -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <p class="text-sm text-gray-500">Total</p>
          <p class="text-2xl font-bold text-gray-900">{{ stats().total }}</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <p class="text-sm text-gray-500">To Do</p>
          <p class="text-2xl font-bold text-blue-600">{{ stats().todo }}</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <p class="text-sm text-gray-500">In Progress</p>
          <p class="text-2xl font-bold text-yellow-600">{{ stats().inProgress }}</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <p class="text-sm text-gray-500">Done</p>
          <p class="text-2xl font-bold text-green-600">{{ stats().done }}</p>
        </div>
      </div>

      <!-- Progress Bar (bonus visualization) -->
      @if (stats().total > 0) {
        <div class="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-700">Completion Progress</span>
            <span class="text-sm font-bold text-gray-900">{{ completionPercent() }}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div
              class="bg-indigo-500 h-2 rounded-full"
              [style.width.%]="completionPercent()"
            ></div>
          </div>
        </div>
      }

      <!-- Filters -->
      <div class="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div class="flex flex-wrap items-center gap-3">
          <div class="flex-1 min-w-[200px]">
            <input
              type="text"
              [(ngModel)]="searchTerm"
              (ngModelChange)="onFilterChange()"
              placeholder="Search tasks..."
              class="w-full px-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
          </div>
          <select
            [(ngModel)]="filterCategory"
            (ngModelChange)="onFilterChange()"
            class="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
          >
            <option value="">All Categories</option>
            <option value="work">Work</option>
            <option value="personal">Personal</option>
          </select>
          <select
            [(ngModel)]="filterPriority"
            (ngModelChange)="onFilterChange()"
            class="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
          >
            <option value="">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      <!-- Error -->
      @if (error()) {
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm flex items-center justify-between">
          <span>{{ error() }}</span>
          <button (click)="store.dispatch(TaskActions.clearError())" class="text-red-500 hover:text-red-700">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      }

      <!-- Kanban Board -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- To Do Column -->
        <div class="bg-gray-50 rounded-2xl p-4">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-3 h-3 rounded-full bg-blue-500"></div>
            <h2 class="font-semibold text-gray-900">To Do</h2>
            <span class="ml-auto text-sm text-gray-500 bg-white px-2 py-0.5 rounded-full">{{ todoTasks().length }}</span>
          </div>
          <div
            cdkDropList
            #todoList="cdkDropList"
            [cdkDropListData]="todoTasks()"
            [cdkDropListConnectedTo]="[inProgressList, doneList]"
            (cdkDropListDropped)="onDrop($event, 'todo')"
            class="space-y-3 min-h-[100px]"
          >
            @for (task of todoTasks(); track task.id) {
              <div cdkDrag>
                <app-task-card
                  [task]="task"
                  [canEdit]="authService.isAdmin()"
                  (edit)="onEditTask($event)"
                  (delete)="onDeleteTask($event)"
                />
              </div>
            }
            @empty {
              <div class="text-center py-8 text-gray-400 text-sm">No tasks yet</div>
            }
          </div>
        </div>

        <!-- In Progress Column -->
        <div class="bg-gray-50 rounded-2xl p-4">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
            <h2 class="font-semibold text-gray-900">In Progress</h2>
            <span class="ml-auto text-sm text-gray-500 bg-white px-2 py-0.5 rounded-full">{{ inProgressTasks().length }}</span>
          </div>
          <div
            cdkDropList
            #inProgressList="cdkDropList"
            [cdkDropListData]="inProgressTasks()"
            [cdkDropListConnectedTo]="[todoList, doneList]"
            (cdkDropListDropped)="onDrop($event, 'in_progress')"
            class="space-y-3 min-h-[100px]"
          >
            @for (task of inProgressTasks(); track task.id) {
              <div cdkDrag>
                <app-task-card
                  [task]="task"
                  [canEdit]="authService.isAdmin()"
                  (edit)="onEditTask($event)"
                  (delete)="onDeleteTask($event)"
                />
              </div>
            }
            @empty {
              <div class="text-center py-8 text-gray-400 text-sm">No tasks in progress</div>
            }
          </div>
        </div>

        <!-- Done Column -->
        <div class="bg-gray-50 rounded-2xl p-4">
          <div class="flex items-center gap-2 mb-4">
            <div class="w-3 h-3 rounded-full bg-green-500"></div>
            <h2 class="font-semibold text-gray-900">Done</h2>
            <span class="ml-auto text-sm text-gray-500 bg-white px-2 py-0.5 rounded-full">{{ doneTasks().length }}</span>
          </div>
          <div
            cdkDropList
            #doneList="cdkDropList"
            [cdkDropListData]="doneTasks()"
            [cdkDropListConnectedTo]="[todoList, inProgressList]"
            (cdkDropListDropped)="onDrop($event, 'done')"
            class="space-y-3 min-h-[100px]"
          >
            @for (task of doneTasks(); track task.id) {
              <div cdkDrag>
                <app-task-card
                  [task]="task"
                  [canEdit]="authService.isAdmin()"
                  (edit)="onEditTask($event)"
                  (delete)="onDeleteTask($event)"
                />
              </div>
            }
            @empty {
              <div class="text-center py-8 text-gray-400 text-sm">Nothing completed yet</div>
            }
          </div>
        </div>
      </div>
    </main>

    <!-- Task Form Modal -->
    @if (showForm()) {
      <app-task-form
        [editTask]="editingTask()"
        (save)="onSaveTask($event)"
        (close)="closeForm()"
      />
    }
  `,
})
export class DashboardComponent implements OnInit {
  TaskActions = TaskActions;

  showForm = signal(false);
  editingTask = signal<ITask | null>(null);

  searchTerm = '';
  filterCategory = '';
  filterPriority = '';

  store = inject(Store);
  authService = inject(AuthService);
  private taskService = inject(TaskService);

  // selectors
  todoTasks = this.store.selectSignal(selectTodoTasks);
  inProgressTasks = this.store.selectSignal(selectInProgressTasks);
  doneTasks = this.store.selectSignal(selectDoneTasks);
  loading = this.store.selectSignal(selectTaskLoading);
  error = this.store.selectSignal(selectTaskError);
  stats = this.store.selectSignal(selectTaskStats);

  completionPercent = computed(() => {
    const s = this.stats();
    if (s.total === 0) return 0;
    return Math.round((s.done / s.total) * 100);
  });

  // load tasks when component initalize
  ngOnInit() {
    // console.log('dashboard loaded');
    this.loadTasks();
  }

  loadTasks() {
    this.store.dispatch(TaskActions.loadTasks({ filters: this.buildFilters() }));
  }

  buildFilters() {
    const filters: any = {};
    if (this.searchTerm) filters.search = this.searchTerm;
    if (this.filterCategory) filters.category = this.filterCategory;
    if (this.filterPriority) filters.priority = this.filterPriority;
    return filters;
  }

  onFilterChange() {
    this.loadTasks();
  }

  onEditTask(task: ITask) {
    this.editingTask.set(task);
    this.showForm.set(true);
  }

  onDeleteTask(id: string) {
    if (confirm('Are you sure you want to delete this task?')) {
      this.store.dispatch(TaskActions.deleteTask({ id }));
    }
  }

  onSaveTask(data: any) {
    if (data.id) {
      this.store.dispatch(TaskActions.updateTask({ id: data.id, dto: data.dto }));
    } else {
      this.store.dispatch(TaskActions.createTask({ dto: data as CreateTaskDto }));
    }
    this.closeForm();
  }

  closeForm() {
    this.showForm.set(false);
    this.editingTask.set(null);
  }

  // handle drag and drop - update task status when moved to diffrent column
  onDrop(event: CdkDragDrop<ITask[]>, newStatus: string) {
    if (event.previousContainer === event.container) {
      // reorder in same column
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      const task = event.container.data[event.currentIndex];
      this.store.dispatch(
        TaskActions.updateTask({
          id: task.id,
          dto: { position: event.currentIndex },
        })
      );
    } else {
      // Move between columns
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      const task = event.container.data[event.currentIndex];
      this.store.dispatch(
        TaskActions.updateTask({
          id: task.id,
          dto: { status: newStatus as TaskStatus, position: event.currentIndex },
        })
      );
    }
  }
}
