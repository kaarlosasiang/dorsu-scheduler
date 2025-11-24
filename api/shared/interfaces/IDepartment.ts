export interface IDepartment {
  _id?: string;
  name: string;
  code: string;
  description?: string;
  courses?: string[]; // Array of Course ObjectId references
  createdAt?: Date;
  updatedAt?: Date;
  // Virtual fields
  coursesCount?: number;
  facultyCount?: number;
  displayName?: string;
}

export interface IDepartmentFilter {
  name?: string;
  code?: string;
}

export interface IDepartmentResponse {
  success: boolean;
  message: string;
  data?: IDepartment | IDepartment[];
  error?: string;
}