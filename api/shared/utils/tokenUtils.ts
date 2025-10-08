import jwt, { SignOptions } from "jsonwebtoken";
import { IUserPayload } from "../interfaces/IUser.js";
import { JWT_CONFIG } from "../../config/constants.js";

export const generateAccessToken = (payload: IUserPayload): string => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    throw new Error(
      "JWT_ACCESS_SECRET is not defined in environment variables"
    );
  }

  const options: SignOptions = {
    expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRY,
    issuer: JWT_CONFIG.ISSUER,
    audience: JWT_CONFIG.AUDIENCE,
  } as SignOptions;

  return jwt.sign(payload, secret, options);
};

export const generateRefreshToken = (payload: IUserPayload): string => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error(
      "JWT_REFRESH_SECRET is not defined in environment variables"
    );
  }

  const options: SignOptions = {
    expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRY,
    issuer: JWT_CONFIG.ISSUER,
    audience: JWT_CONFIG.AUDIENCE,
  } as SignOptions;

  return jwt.sign(payload, secret, options);
};

export const verifyToken = (token: string, secret: string): IUserPayload => {
  try {
    const decoded = jwt.verify(token, secret, {
      issuer: JWT_CONFIG.ISSUER,
      audience: JWT_CONFIG.AUDIENCE,
    }) as IUserPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error("Invalid token");
    } else if (error instanceof jwt.TokenExpiredError) {
      throw new Error("Token expired");
    } else {
      throw new Error("Token verification failed");
    }
  }
};

export const verifyAccessToken = (token: string): IUserPayload => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    throw new Error(
      "JWT_ACCESS_SECRET is not defined in environment variables"
    );
  }

  return verifyToken(token, secret);
};

export const verifyRefreshToken = (token: string): IUserPayload => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error(
      "JWT_REFRESH_SECRET is not defined in environment variables"
    );
  }

  return verifyToken(token, secret);
};
