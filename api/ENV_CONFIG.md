# Environment Configuration Guide

This document explains all environment variables used in the DORSU Scheduler API.

## Required Environment Variables

### Database Configuration
- `MONGODB_URI` - MongoDB connection string
- `DB_MAX_POOL_SIZE` - Maximum number of connections in the pool (default: 10)
- `DB_SERVER_SELECTION_TIMEOUT` - Server selection timeout in ms (default: 5000)
- `DB_SOCKET_TIMEOUT` - Socket timeout in ms (default: 45000)

### JWT Configuration
- `JWT_ACCESS_SECRET` - Secret key for access tokens (REQUIRED)
- `JWT_REFRESH_SECRET` - Secret key for refresh tokens (REQUIRED)
- `JWT_ACCESS_TOKEN_EXPIRY` - Access token expiry time (default: 15m)
- `JWT_REFRESH_TOKEN_EXPIRY` - Refresh token expiry time (default: 7d)
- `JWT_ISSUER` - JWT issuer identifier (default: dorsu-scheduler)
- `JWT_AUDIENCE` - JWT audience identifier (default: dorsu-scheduler-client)

### Password Security
- `PASSWORD_MIN_LENGTH` - Minimum password length (default: 6)
- `BCRYPT_SALT_ROUNDS` - Bcrypt salt rounds for hashing (default: 12)

### Cookie Configuration
- `COOKIE_REFRESH_TOKEN_NAME` - Refresh token cookie name (default: refreshToken)
- `COOKIE_MAX_AGE` - Cookie max age in milliseconds (default: 604800000 = 7 days)
- `COOKIE_HTTP_ONLY` - HTTP only flag (default: true)
- `COOKIE_SAME_SITE` - SameSite policy: strict/lax/none (default: strict)
- `COOKIE_SECURE` - Secure flag, auto-set to true in production (default: false in dev)

### Server Configuration
- `PORT` - Server port (default: 4000)
- `NODE_ENV` - Environment: development/production (default: development)
- `API_VERSION` - API version (default: v1)
- `API_PREFIX` - API URL prefix (default: /api)

### CORS Configuration
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:4321)

## Environment-Specific Examples

### Development
```env
NODE_ENV=development
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d
COOKIE_SECURE=false
PASSWORD_MIN_LENGTH=6
```

### Production
```env
NODE_ENV=production
JWT_ACCESS_TOKEN_EXPIRY=5m
JWT_REFRESH_TOKEN_EXPIRY=1d
COOKIE_SECURE=true
PASSWORD_MIN_LENGTH=8
BCRYPT_SALT_ROUNDS=14
```

### Testing
```env
NODE_ENV=test
MONGODB_URI=mongodb://localhost:27017/dorsu-scheduler-test
JWT_ACCESS_TOKEN_EXPIRY=1h
JWT_REFRESH_TOKEN_EXPIRY=1d
```

## Security Notes

1. **Always use strong, unique secrets for JWT tokens in production**
2. **Set COOKIE_SECURE=true in production**
3. **Use HTTPS in production for secure cookies**
4. **Consider shorter token expiry times in production**
5. **Use higher salt rounds for production (12-16)**
6. **Regularly rotate JWT secrets**