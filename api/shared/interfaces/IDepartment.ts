export interface IDepartment {
  _id?: string;
  name: string;
  code: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
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