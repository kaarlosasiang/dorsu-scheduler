export interface ISection {
  _id?: string;
  program: string; // ObjectId ref to Course
  yearLevel: '1st Year' | '2nd Year' | '3rd Year' | '4th Year' | '5th Year';
  sectionCode: string; // e.g. "BGA1A", "AM1AB", "ES1BB" — this is also used as the display name
  name: string; // same as sectionCode (uppercased), e.g. "BGA1A"
  capacity?: number;
  status: 'active' | 'inactive';
  programDetails?: any; // populated Course document
  createdAt?: Date;
  updatedAt?: Date;
}
