export interface IName {
  first: string;
  middle?: string;
  last: string;
  ext?: string;
}

export interface IFaculty {
  _id?: string;
  name: IName;
  email: string;
  department: string; // Department ObjectId as string
  employmentType: "full-time" | "part-time";
  image?: string;
  minLoad?: number;
  maxLoad?: number;
  currentLoad?: number;
  maxPreparations?: number;
  currentPreparations?: number;
  status?: "active" | "inactive";
  createdAt?: Date;
}

export interface IFacultyWithDepartment extends Omit<IFaculty, 'department'> {
  department: {
    _id: string;
    name: string;
    code: string;
    college?: string;
  };
}

export interface IFacultyFilter {
  department?: string; // Department ObjectId or name search
  departmentId?: string; // Exact department ObjectId
  status?: "active" | "inactive";
  employmentType?: "full-time" | "part-time";
  email?: string;
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

export interface IPreparationUpdate {
  preparations: number;
}

export interface IStatusUpdate {
  status: "active" | "inactive";
}

export interface IAvailabilityInfo {
  startTime: string;
  endTime: string;
  workDays: string[];
}