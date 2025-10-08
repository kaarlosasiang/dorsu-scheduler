export interface IAvailability {
  day: string;
  startTime: string;
  endTime: string;
}

export interface IFaculty {
  _id?: string;
  name: string;
  department: string;
  availability?: IAvailability[];
  maxLoad?: number;
  currentLoad?: number;
  status?: "active" | "inactive";
  createdAt?: Date;
}

export interface IFacultyFilter {
  department?: string;
  status?: "active" | "inactive";
}

export interface IFacultyResponse {
  success: boolean;
  message: string;
  data?: IFaculty | IFaculty[];
  error?: string;
}

export interface IWorkloadUpdate {
  hours: number;
}

export interface IStatusUpdate {
  status: "active" | "inactive";
}