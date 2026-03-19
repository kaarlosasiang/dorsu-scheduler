export interface ICourse {
  _id?: string;
  courseCode: string;
  courseName: string;
  description?: string;
  department?: string; // Optional reference to Department _id
  createdAt?: Date;
  updatedAt?: Date;
}
