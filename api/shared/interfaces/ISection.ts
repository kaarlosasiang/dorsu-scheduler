export interface ISection {
  _id?: string;
  program: string; // ObjectId ref to Course
  yearLevel: '1st Year' | '2nd Year' | '3rd Year' | '4th Year' | '5th Year';
  sectionCode: string; // "A", "B", "C" ...
  name: string; // stored: e.g. "IT-1A" (courseCode + yearNumber + sectionCode)
  capacity?: number;
  status: 'active' | 'inactive';
  programDetails?: any; // populated Course document
  createdAt?: Date;
  updatedAt?: Date;
}
