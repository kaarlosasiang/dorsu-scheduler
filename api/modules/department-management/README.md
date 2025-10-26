# Department Management Module

This module provides comprehensive department management functionality for the DORSU Scheduler API. It integrates seamlessly with the faculty management system through proper database relationships.

## Overview

The department module manages academic departments within the university, including their basic information, head assignments, contact details, and faculty relationships. Each department can have faculty members assigned to it, and departments can have a designated head (who must be an active faculty member).

## Architecture

### Models
- **Department Model** (`api/models/departmentModel.ts`)
  - Mongoose schema with validation
  - References to Faculty model for head of department
  - Virtual properties for faculty counts
  - Pre-save and validation hooks

### Interfaces
- **IDepartment** (`api/shared/interfaces/IDepartment.ts`)
  - Core department data structure
  - Extended interfaces for populated data
  - Filter and response interfaces

### Services
- **DepartmentService** (`api/modules/department-management/departmentService.ts`)
  - CRUD operations
  - Department validation
  - Faculty integration
  - Statistics and reporting

### Controllers & Routes
- **DepartmentController** (`api/modules/department-management/departmentController.ts`)
- **Department Routes** (`api/modules/department-management/departmentRoutes.ts`)

## Integration with Faculty Module

### Database Relationships
1. **Faculty → Department**: Each faculty member belongs to exactly one department (ObjectId reference)
2. **Department → Faculty**: One-to-many relationship via virtual population
3. **Department Head**: Optional reference to a Faculty document

### Key Integration Features

#### 1. Department Reference in Faculty
```typescript
// Faculty model now references Department by ObjectId
department: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Department',
  required: true
}
```

#### 2. Faculty Validation
When creating/updating faculty:
- Department must exist and be active
- Department ObjectId validation
- Automatic population of department details

#### 3. Department Head Assignment
- Head must be an active faculty member
- Validation ensures head belongs to valid faculty
- Automatic validation on department updates

#### 4. Cascading Operations
- Cannot delete department with active faculty
- Department status affects faculty operations
- Faculty counts are automatically calculated

## API Endpoints

### Department CRUD
- `GET /api/departments` - List all departments (with filtering)
- `GET /api/departments/:id` - Get department by ID
- `GET /api/departments/code/:code` - Get department by code
- `POST /api/departments` - Create new department
- `PUT /api/departments/:id` - Update department
- `DELETE /api/departments/:id` - Delete department

### Department Management
- `PATCH /api/departments/:id/status` - Update department status
- `PATCH /api/departments/:id/head` - Set/remove head of department
- `PATCH /api/departments/:id/contact` - Update contact information

### Specialized Queries
- `GET /api/departments/college/:college` - Get departments by college
- `GET /api/departments/without-head` - Get departments without head
- `GET /api/departments/stats` - Get department statistics

### Bulk Operations
- `POST /api/departments/bulk/status` - Bulk status update

## Usage Examples

### 1. Creating a Department
```javascript
POST /api/departments
{
  "name": "Computer Science",
  "code": "CS",
  "description": "Department of Computer Science and Information Technology",
  "college": "College of Engineering",
  "contactInfo": {
    "email": "cs@dorsu.edu.ph",
    "phone": "+63-123-456-7890",
    "office": "Engineering Building, 2nd Floor"
  }
}
```

### 2. Assigning Faculty to Department
```javascript
POST /api/faculty
{
  "name": {
    "first": "John",
    "last": "Doe"
  },
  "email": "john.doe@dorsu.edu.ph",
  "department": "64f5a1b2c3d4e5f6789012ab", // Department ObjectId
  "employmentType": "full-time"
}
```

### 3. Setting Department Head
```javascript
PATCH /api/departments/64f5a1b2c3d4e5f6789012ab/head
{
  "headOfDepartment": "64f5a1b2c3d4e5f6789012cd" // Faculty ObjectId
}
```

### 4. Querying Faculty by Department
```javascript
// By department name (search)
GET /api/faculty?department=Computer

// By exact department ID
GET /api/faculty?departmentId=64f5a1b2c3d4e5f6789012ab
```

## Migration Considerations

When upgrading from string-based department references to ObjectId references:

1. **Data Migration Required**:
   - Existing faculty records with string department values need conversion
   - Create department documents for unique department strings
   - Update faculty records to reference department ObjectIds

2. **API Breaking Changes**:
   - Faculty creation now requires department ObjectId instead of string
   - Faculty responses include populated department objects
   - New validation rules for department references

3. **Client Updates Needed**:
   - Forms should use department selection dropdowns
   - Department data should be fetched from `/api/departments`
   - Faculty display should show populated department information

## Data Validation

### Department Validation
- **Name**: Required, unique, 2-100 characters
- **Code**: Required, unique, uppercase, 2-10 characters
- **Description**: Optional, max 500 characters
- **College**: Optional, max 100 characters
- **Head**: Must be valid, active faculty member
- **Contact Info**: Email, phone, and office validation

### Faculty Integration Validation
- Department must exist and be active
- Department ObjectId format validation
- Duplicate name checking within department
- Head assignment validation

## Error Handling

Common error scenarios:
- Department not found (404)
- Duplicate department name/code (409)
- Invalid department ObjectId format (400)
- Cannot delete department with faculty (400)
- Invalid head assignment (400)
- Department inactive for faculty assignment (400)

## Performance Considerations

### Indexing
- Department name, code, and status are indexed
- Faculty department references are indexed
- Efficient lookups for common queries

### Population
- Optional faculty count population
- Selective field population for performance
- Aggregation pipelines for statistics

### Caching Recommendations
- Department list caching (departments change infrequently)
- Faculty count caching with invalidation
- Department hierarchy caching for dropdowns

## Testing

Ensure comprehensive testing of:
1. Department CRUD operations
2. Faculty-department integration
3. Head assignment workflows
4. Validation scenarios
5. Cascading delete prevention
6. Statistics accuracy
7. Performance with large datasets

## Future Enhancements

Planned features:
1. Department hierarchy support
2. Budget and resource management
3. Course offerings per department
4. Faculty workload distribution
5. Department scheduling preferences
6. Advanced reporting and analytics