import User from '../../models/userModel.js';
import { 
  IRegisterData, 
  ILoginCredentials, 
  ILoginResponse, 
  IUser,
  IUserPayload 
} from '../../shared/interfaces/IUser.js';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyRefreshToken 
} from '../../shared/tokenUtils.js';

export class AuthService {
  
  /**
   * Register a new user
   */
  static async register(data: IRegisterData): Promise<ILoginResponse> {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ 
        username: data.username.toLowerCase() 
      });
      
      if (existingUser) {
        throw new Error('Username already exists');
      }

      // Create new user
      const user = new User({
        username: data.username.toLowerCase(),
        password: data.password,
        role: data.role || 'admin'
      });

      await user.save();

      // Generate tokens
      const payload: IUserPayload = {
        id: user._id.toString(),
        username: user.username,
        role: user.role
      };

      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      return {
        accessToken,
        refreshToken,
        user: {
          id: user._id.toString(),
          username: user.username,
          role: user.role
        }
      };
      
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Registration failed: ${error.message}`);
      }
      throw new Error('Registration failed: Unknown error');
    }
  }

  /**
   * Login user with credentials
   */
  static async login(credentials: ILoginCredentials): Promise<ILoginResponse> {
    try {
      // Find user by username
      const user = await User.findOne({ 
        username: credentials.username.toLowerCase() 
      }).select('+password');

      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Check password
      const isPasswordValid = await user.comparePassword(credentials.password);
      if (!isPasswordValid) {
        throw new Error('Invalid credentials');
      }

      // Generate tokens
      const payload: IUserPayload = {
        id: user._id.toString(),
        username: user.username,
        role: user.role
      };

      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      return {
        accessToken,
        refreshToken,
        user: {
          id: user._id.toString(),
          username: user.username,
          role: user.role
        }
      };
      
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error('Login failed: Unknown error');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshToken(token: string): Promise<{ accessToken: string }> {
    try {
      // Verify refresh token
      const decoded = verifyRefreshToken(token);
      
      // Check if user still exists
      const user = await User.findById(decoded.id);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate new access token
      const payload: IUserPayload = {
        id: user._id.toString(),
        username: user.username,
        role: user.role
      };

      const accessToken = generateAccessToken(payload);

      return { accessToken };
      
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Token refresh failed: ${error.message}`);
      }
      throw new Error('Token refresh failed: Unknown error');
    }
  }

  /**
   * Get all users (admin only)
   */
  static async getUsers(): Promise<IUser[]> {
    try {
      const users = await User.find({})
        .select('-password')
        .sort({ createdAt: -1 });
      
      return users;
      
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch users: ${error.message}`);
      }
      throw new Error('Failed to fetch users: Unknown error');
    }
  }

  /**
   * Delete user by ID (admin only)
   */
  static async deleteUser(id: string): Promise<void> {
    try {
      const user = await User.findById(id);
      
      if (!user) {
        throw new Error('User not found');
      }

      await User.findByIdAndDelete(id);
      
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to delete user: ${error.message}`);
      }
      throw new Error('Failed to delete user: Unknown error');
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(id: string): Promise<IUser | null> {
    try {
      const user = await User.findById(id).select('-password');
      return user;
      
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch user: ${error.message}`);
      }
      throw new Error('Failed to fetch user: Unknown error');
    }
  }
}