# 🏢 OA System - Work From Home Attendance System

A comprehensive **MERN Stack** application for managing work-from-home employee attendance with **face recognition technology**.

## 📊 Project Status: **100% Complete** ✅

## Features

### Employee Features
- 🔐 Secure login with JWT authentication
- 👤 Face recognition for check-in/check-out (8:00 AM - 5:00 PM)
- 📊 Personal attendance tracking
- ✅ Task management and completion
- 🏖️ Leave application system
- 👨‍💼 Profile management

### Admin Features
- 📈 Comprehensive dashboard with statistics
- 👥 Employee management (CRUD operations)
- 📋 Attendance monitoring and reports
- 📝 Task assignment and tracking
- ✓ Leave approval system
- 🏢 Department management
- 📅 Holiday calendar management
- ⚙️ System settings configuration
- 🔍 Audit log tracking

## Tech Stack

### Backend
- Node.js & Express.js
- MongoDB with Mongoose
- JWT for authentication
- Bcrypt for password hashing
- Multer for file uploads
- Express Validator
- Helmet & CORS for security

### Frontend
- React.js 18
- Material-UI (MUI)
- Axios for API calls
- React Router v6
- Face-api.js for face recognition
- Recharts for data visualization

## Project Structure

```
OAS/
├── server/                 # Backend
│   ├── config/            # Database configuration
│   ├── controllers/       # Request handlers
│   ├── middleware/        # Auth & error handling
│   ├── models/           # Mongoose schemas
│   ├── routes/           # API routes
│   ├── utils/            # Helper functions
│   ├── .env              # Environment variables
│   ├── package.json      # Backend dependencies
│   └── server.js         # Entry point
│
├── client/               # Frontend
│   ├── public/          # Static files
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── context/     # Auth context
│   │   ├── pages/       # Route pages
│   │   ├── services/    # API services
│   │   ├── App.js       # Main app component
│   │   └── index.js     # Entry point
│   ├── .env             # Environment variables
│   └── package.json     # Frontend dependencies
│
└── setup-database.js    # Database seeding script
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Setup Steps

1. **Clone and navigate to the project:**
```bash
cd C:\Users\dell\Desktop\OAS
```

2. **Set up the database:**
```bash
npm install
node setup-database.js
```

3. **Start the backend server:**
```bash
cd server
npm install
npm start
```

4. **Start the frontend:**
```bash
cd ../client
npm install
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Default Credentials

**Admin Login:**
- Email: admin@oasystem.com
- Password: Admin@123

## Database Collections

1. **users** - User authentication data
2. **employees** - Employee profiles and face data
3. **departments** - Department information
4. **attendance** - Daily attendance records
5. **tasks** - Task assignments
6. **leaves** - Leave applications
7. **notifications** - User notifications
8. **holidays** - Holiday calendar
9. **settings** - System settings
10. **auditlogs** - Activity tracking

## API Endpoints

### Authentication
- POST `/api/auth/login` - User login
- GET `/api/auth/me` - Get current user
- POST `/api/auth/logout` - User logout
- PUT `/api/auth/change-password` - Change password

### Attendance
- POST `/api/attendance/check-in` - Check in
- PUT `/api/attendance/check-out` - Check out
- GET `/api/attendance/my-attendance` - Get employee attendance
- GET `/api/attendance/today` - Today's attendance status
- GET `/api/attendance` - All attendance (Admin)
- GET `/api/attendance/statistics` - Attendance stats (Admin)

### Tasks
- GET `/api/tasks` - Get all tasks
- POST `/api/tasks` - Create task (Admin)
- GET `/api/tasks/:id` - Get single task
- PUT `/api/tasks/:id` - Update task
- DELETE `/api/tasks/:id` - Delete task (Admin)
- GET `/api/tasks/statistics` - Task statistics

### Leaves
- POST `/api/leaves` - Apply for leave
- GET `/api/leaves/my-leaves` - Get employee leaves
- GET `/api/leaves` - All leaves (Admin)
- PUT `/api/leaves/:id` - Update leave status (Admin)
- DELETE `/api/leaves/:id` - Cancel leave

### Employees
- GET `/api/employees` - All employees (Admin)
- POST `/api/employees` - Create employee (Admin)
- GET `/api/employees/:id` - Get employee
- PUT `/api/employees/:id` - Update employee (Admin)
- DELETE `/api/employees/:id` - Delete employee (Admin)
- GET `/api/employees/profile` - My profile
- PUT `/api/employees/profile` - Update my profile
- POST `/api/employees/register-face` - Register face data

### Departments
- GET `/api/departments` - All departments
- POST `/api/departments` - Create department (Admin)
- PUT `/api/departments/:id` - Update department (Admin)
- DELETE `/api/departments/:id` - Delete department (Admin)

### Holidays
- GET `/api/holidays` - All holidays
- POST `/api/holidays` - Create holiday (Admin)
- PUT `/api/holidays/:id` - Update holiday (Admin)
- DELETE `/api/holidays/:id` - Delete holiday (Admin)

### Dashboard
- GET `/api/dashboard/stats` - Dashboard statistics

## Face Recognition

The system uses Face-api.js for face recognition:
- Employees must register their face before using attendance
- Minimum 3 clear face images required for registration
- Confidence threshold: 0.6 (configurable)
- Check-in captures face image with location data
- Check-out requires face verification

## Work Schedule

- Check-in time: 8:00 AM
- Check-out time: 5:00 PM
- Late threshold: 15 minutes
- Working days: Monday to Friday

## Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- Protected routes with role-based access
- Request rate limiting
- Helmet.js for HTTP headers
- CORS configuration
- Audit logging for critical actions

## Development

### Backend Development
```bash
cd server
npm run dev  # Uses nodemon for auto-reload
```

### Frontend Development
```bash
cd client
npm start  # React development server
```

## Production Build

### Backend
```bash
cd server
npm start
```

### Frontend
```bash
cd client
npm run build
```

## Environment Variables

### Backend (.env)
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/oa_system
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
FACE_MATCH_THRESHOLD=0.6
WORK_START_TIME=08:00
WORK_END_TIME=17:00
LATE_THRESHOLD_MINUTES=15
CLIENT_URL=http://localhost:3000
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_FACE_THRESHOLD=0.6
```

## License

MIT

## Author

OA System Development Team

---

**Note:** This system is designed for Work From Home attendance management with face recognition technology for secure check-in/check-out processes.
