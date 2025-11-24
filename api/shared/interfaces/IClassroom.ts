export interface IClassroom {
  _id?: string;
  roomNumber: string;
  building?: string;
  capacity: number;
  type?: 'lecture' | 'laboratory' | 'computer-lab' | 'conference' | 'other';
  facilities?: string[]; // e.g., ['projector', 'whiteboard', 'computer', 'air-conditioning']
  status?: 'available' | 'maintenance' | 'reserved';
  createdAt?: Date;
  updatedAt?: Date;
  // Virtual fields
  displayName?: string;
}

export interface IClassroomFilter {
  roomNumber?: string;
  building?: string;
  type?: string;
  status?: string;
  minCapacity?: number;
  maxCapacity?: number;
}

export interface IClassroomResponse {
  success: boolean;
  message: string;
  data?: IClassroom | IClassroom[];
  error?: string;
}

