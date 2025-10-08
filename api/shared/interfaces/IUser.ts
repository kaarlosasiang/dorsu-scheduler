import { Document } from 'mongoose';

export interface IUser extends Document {
  _id: string;
  username: string;
  password: string;
  role: 'admin' | 'faculty' | 'staff';
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IUserPayload {
  id: string;
  username: string;
  role: string;
}

export interface IRegisterData {
  username: string;
  password: string;
  role?: 'admin' | 'faculty' | 'staff';
}

export interface ILoginCredentials {
  username: string;
  password: string;
}

export interface ILoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: string;
    username: string;
    role: string;
  };
}