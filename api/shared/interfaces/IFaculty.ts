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
  program: string; // Course (Program) ObjectId as string
  employmentType: "full-time" | "part-time";
  designation?: string; // Administrative designation (e.g., Program Head)
  image?: string;
  minLoad?: number;
  maxLoad?: number;
  currentLoad?: number;
  adminLoad?: number;   // Load from administrative designation (only if designation is set)
  maxPreparations?: number;
  currentPreparations?: number;
  status?: "active" | "inactive";
  createdAt?: Date;
  // Virtuals
  totalLoad?: number;  // currentLoad + adminLoad
  overload?: number;   // max(0, totalLoad - minLoad)
}

export interface IFacultyWithProgram extends Omit<IFaculty, 'program'> {
  program: {
    _id: string;
    courseCode: string;
    courseName: string;
  };
}

export interface IFacultyFilter {
  program?: string; // Course (Program) ObjectId or name search
  programId?: string; // Exact Course ObjectId
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