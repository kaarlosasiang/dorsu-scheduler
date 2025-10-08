import mongoose from 'mongoose';
import { DB_CONFIG, ERROR_MESSAGES } from './constants.js';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || DB_CONFIG.DEFAULT_CONNECTION_STRING;
    
    await mongoose.connect(mongoURI, DB_CONFIG.CONNECTION_OPTIONS);
    
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('📴 MongoDB disconnected');
  } catch (error) {
    console.error('❌ MongoDB disconnection error:', error);
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err: any) => {
  console.error('🚨 Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('📴 Mongoose disconnected from MongoDB');
});