# Faculty Management Module

This module provides complete CRUD operations for faculty management in the DORSU Scheduler API.

## 📂 Structure

```
api/
├── interfaces/
│   └── IFaculty.ts                 # TypeScript interfaces
├── models/
│   └── facultyModel.ts             # Mongoose model and schema
├── modules/
│   └── faculty-management/
│       ├── facultyController.ts    # Request handlers
│       ├── facultyService.ts       # Business logic
│       ├── facultyRoutes.ts        # Route definitions
│       └── facultyValidator.ts     # Zod validation schemas
└── shared/
    └── timeUtils.ts               # Time-related utilities
```

## 🚀 API Endpoints

All endpoints require JWT authentication.

### Main CRUD Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/faculty` | Get all faculty (supports filtering) |
| `GET` | `/api/faculty/:id` | Get faculty by ID |
| `POST` | `/api/faculty` | Create new faculty |
| `PUT` | `/api/faculty/:id` | Update faculty |
| `DELETE` | `/api/faculty/:id` | Remove faculty |

### Specific Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/faculty/stats` | Get faculty statistics |
| `PATCH` | `/api/faculty/:id/availability` | Update faculty availability |
| `PATCH` | `/api/faculty/:id/workload` | Update faculty workload |
| `PATCH` | `/api/faculty/:id/status` | Update faculty status |

## 📋 Data Models

### Faculty Model

```typescript
interface IFaculty {
  _id?: string;
  name: string;                    // Required
  department: string;              // Required
  availability?: IAvailability[];  // Optional
  maxLoad?: number;               // Default: 18
  currentLoad?: number;           // Default: 0
  status?: "active" | "inactive"; // Default: "active"
  createdAt?: Date;               // Auto-generated
}

interface IAvailability {
  day: string;        // Monday-Sunday
  startTime: string;  // HH:MM format
  endTime: string;    // HH:MM format
}
```

## 📝 Request Examples

### Create Faculty

```bash
POST /api/faculty
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "name": "Dr. John Smith",
  "department": "Computer Science",
  "availability": [
    {
      "day": "Monday",
      "startTime": "08:00",
      "endTime": "17:00"
    },
    {
      "day": "Wednesday",
      "startTime": "10:00",
      "endTime": "15:00"
    }
  ],
  "maxLoad": 20
}
```

### Get Faculty with Filters

```bash
GET /api/faculty?department=Computer Science&status=active
Authorization: Bearer <jwt-token>
```

### Update Availability

```bash
PATCH /api/faculty/:id/availability
Content-Type: application/json
Authorization: Bearer <jwt-token>

[
  {
    "day": "Tuesday",
    "startTime": "09:00",
    "endTime": "16:00"
  }
]
```

### Update Workload

```bash
PATCH /api/faculty/:id/workload
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "hours": 15
}
```

### Update Status

```bash
PATCH /api/faculty/:id/status
Content-Type: application/json
Authorization: Bearer <jwt-token>

{
  "status": "inactive"
}
```

## ✅ Validation Features

- **Name & Department**: Required, 2-100 characters
- **Time Format**: HH:MM (24-hour format)
- **Time Range**: Start time must be before end time
- **No Overlaps**: Availability slots cannot overlap on the same day
- **Workload Limits**: Current load cannot exceed max load
- **Unique Names**: No duplicate names within the same department

## 🔧 Integration Hooks

The service layer includes event emission for future integration:

```typescript
// Events emitted by FacultyService
'faculty.created'           // When faculty is created
'faculty.updated'           // When faculty is updated
'faculty.deleted'           // When faculty is removed
'faculty.availability.updated'  // When availability changes
'faculty.workload.updated'      // When workload changes
'faculty.status.updated'        // When status changes
'faculty.queried'              // When faculty list is requested
'faculty.retrieved'            // When single faculty is retrieved
```

## 📊 Statistics Endpoint

Get comprehensive faculty statistics:

```bash
GET /api/faculty/stats?department=Computer Science
Authorization: Bearer <jwt-token>
```

Response:
```json
{
  "success": true,
  "message": "Faculty statistics retrieved successfully",
  "data": {
    "total": 25,
    "active": 23,
    "inactive": 2,
    "totalWorkload": 420,
    "averageWorkload": 16.8,
    "departments": ["Computer Science", "Mathematics", "Physics"]
  }
}
```

## 🚀 Future Integration Ready

This module is designed for easy integration with:

- **Course Assignment System**: Reference faculty by `_id`
- **Schedule Management**: Use availability data for conflict detection
- **Workload Calculator**: Track and update current load automatically
- **Notification System**: Hook into events for real-time updates

## 🔒 Security

- All endpoints protected by JWT authentication
- Input validation using Zod schemas
- MongoDB injection prevention
- Structured error responses
- No sensitive data exposure

## 🧪 Testing

To test the endpoints, ensure:

1. MongoDB is running
2. JWT authentication is working
3. Environment variables are configured
4. Use valid faculty data in requests

Example cURL test:

```bash
# Get all faculty
curl -X GET "http://localhost:4000/api/faculty" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create faculty
curl -X POST "http://localhost:4000/api/faculty" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"name":"Dr. Jane Doe","department":"Mathematics"}'
```