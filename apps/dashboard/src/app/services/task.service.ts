import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ITask, CreateTaskDto, UpdateTaskDto, TaskFilterDto, ReorderTaskDto } from '@task-manager/data';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly baseUrl = '/api/tasks';

  constructor(private http: HttpClient) {}

  getTasks(filters?: TaskFilterDto): Observable<ITask[]> {
    let params = new HttpParams();
    // add filter params if present
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value);
        }
      });
    }
    return this.http.get<ITask[]>(this.baseUrl, { params });
  }

  getTask(id: string): Observable<ITask> {
    return this.http.get<ITask>(`${this.baseUrl}/${id}`);
  }

  createTask(dto: CreateTaskDto): Observable<ITask> {
    // console.log('creating task:', dto.title);
    return this.http.post<ITask>(this.baseUrl, dto);
  }

  updateTask(id: string, dto: UpdateTaskDto): Observable<ITask> {
    return this.http.put<ITask>(`${this.baseUrl}/${id}`, dto);
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  reorderTask(dto: ReorderTaskDto): Observable<ITask> {
    return this.http.put<ITask>(`${this.baseUrl}/reorder/batch`, dto);
  }
}
