import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ITask } from '@task-manager/data';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing group"
    >
      <div class="flex items-start justify-between mb-2">
        <h3 class="font-semibold text-gray-900 text-sm leading-tight flex-1 mr-2">
          {{ task.title }}
        </h3>
        <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            (click)="edit.emit(task); $event.stopPropagation()"
            class="p-1 text-gray-400 hover:text-indigo-600 transition"
            title="Edit"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            (click)="delete.emit(task.id); $event.stopPropagation()"
            class="p-1 text-gray-400 hover:text-red-600 transition"
            title="Delete"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      @if (task.description) {
        <p class="text-gray-500 text-xs mb-3 line-clamp-2">{{ task.description }}</p>
      }

      <div class="flex items-center gap-2 flex-wrap">
        <span
          class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
          [class]="getCategoryClass()"
        >
          {{ task.category === 'work' ? 'Work' : 'Personal' }}
        </span>
        <span
          class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
          [class]="getPriorityClass()"
        >
          {{ task.priority | titlecase }}
        </span>
      </div>
    </div>
  `,
})
export class TaskCardComponent {
  @Input({ required: true }) task!: ITask;
  @Input() canEdit = true;
  @Output() edit = new EventEmitter<ITask>();
  @Output() delete = new EventEmitter<string>();

  getCategoryClass(): string {
    return this.task.category === 'work'
      ? 'bg-blue-100 text-blue-700'
      : 'bg-purple-100 text-purple-700';
  }

  getPriorityClass(): string {
    switch (this.task.priority) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }
}
