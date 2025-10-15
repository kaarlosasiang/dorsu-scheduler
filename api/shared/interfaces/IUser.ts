import { Document } from 'mongoose';

export interface IUser extends Document {
  _id: string;
  email: string;
  password: string;
  role: 'admin' | 'faculty' | 'staff';
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IUserPayload {
  id: string;
  email: string;
  role: string;
}

export interface IRegisterData {
  email: string;
  password: string;
  role?: 'admin' | 'faculty' | 'staff';
}

export interface ILoginCredentials {
  email: string;
  password: string;
}

export interface ILoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}