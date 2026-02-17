import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ITask, CreateTaskDto, UpdateTaskDto, TaskStatus, TaskCategory, TaskPriority } from '@task-manager/data';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" (click)="onClose()">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-bold text-gray-900">
            {{ editTask ? 'Edit Task' : 'New Task' }}
          </h2>
          <button (click)="onClose()" class="text-gray-400 hover:text-gray-600 transition">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form (ngSubmit)="onSubmit()" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              [(ngModel)]="title"
              name="title"
              required
              class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder="What needs to be done?"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              [(ngModel)]="description"
              name="description"
              rows="3"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
              placeholder="Add more details..."
            ></textarea>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                [(ngModel)]="status"
                name="status"
                class="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                [(ngModel)]="category"
                name="category"
                class="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
              >
                <option value="work">Work</option>
                <option value="personal">Personal</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                [(ngModel)]="priority"
                name="priority"
                class="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div class="flex gap-3 pt-2">
            <button
              type="button"
              (click)="onClose()"
              class="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition"
            >
              {{ editTask ? 'Save Changes' : 'Create Task' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class TaskFormComponent {
  @Input() editTask: ITask | null = null;
  @Output() save = new EventEmitter<CreateTaskDto | { id: string; dto: UpdateTaskDto }>();
  @Output() close = new EventEmitter<void>();

  title = '';
  description = '';
  status: TaskStatus = TaskStatus.TODO;
  category: TaskCategory = TaskCategory.WORK;
  priority: TaskPriority = TaskPriority.MEDIUM;

  ngOnInit() {
    if (this.editTask) {
      this.title = this.editTask.title;
      this.description = this.editTask.description;
      this.status = this.editTask.status;
      this.category = this.editTask.category;
      this.priority = this.editTask.priority;
    }
  }

  onSubmit() {
    if (!this.title.trim()) return;

    if (this.editTask) {
      this.save.emit({
        id: this.editTask.id,
        dto: {
          title: this.title,
          description: this.description,
          status: this.status,
          category: this.category,
          priority: this.priority,
        },
      });
    } else {
      this.save.emit({
        title: this.title,
        description: this.description,
        status: this.status,
        category: this.category,
        priority: this.priority,
      } as CreateTaskDto);
    }
  }

  onClose() {
    this.close.emit();
  }
}
