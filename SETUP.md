# Bookings App Setup Guide

This guide will help you set up and run the full-stack bookings application with authentication.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v4.4 or higher) - [Download](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **Git** - [Download](https://git-scm.com/)

## Project Structure

```
bookingsapp/
├── frontend/           # React frontend
├── backend/           # Node.js backend
├── package.json       # Root package.json for scripts
├── README.md
└── SETUP.md
```

## Quick Start

### 1. Clone and Install Dependencies

```bash
# Install root dependencies
npm install

# Install all dependencies (frontend + backend)
npm run install-all
```

### 2. Set up MongoDB

**Option A: Local MongoDB**
- Install MongoDB locally
- Start MongoDB service
- Database will be automatically created at: `mongodb://localhost:27017/bookingsapp`

**Option B: MongoDB Atlas (Cloud)**
- Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Create a new cluster
- Get your connection string

### 3. Configure Backend Environment

Create a `.env` file in the `backend/` directory:

```bash
# backend/.env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/bookingsapp
JWT_SECRET=your_jwt_secret_key_change_this_in_production
JWT_EXPIRE=30d

# Email configuration (optional for development)
EMAIL_FROM=noreply@bookingsapp.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
# EMAIL_USER=your_email@gmail.com
# EMAIL_PASS=your_email_password_or_app_password

# Frontend URL for password reset links
FRONTEND_URL=http://localhost:3000
```

**Important Notes:**
- Replace `your_jwt_secret_key_change_this_in_production` with a secure random string
- For production, use a strong JWT secret (32+ characters)
- Email configuration is optional for development (forgot password will work without it)

### 4. Start the Application

```bash
# Start both frontend and backend simultaneously
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend React app on `http://localhost:3000`

## Individual Server Commands

If you prefer to run servers separately:

```bash
# Start backend only
npm run server

# Start frontend only (in another terminal)
npm run client
```

## Features Implemented

### Authentication System
✅ **User Registration (Signup)**
- Name, email, password validation
- Password strength requirements (6+ chars, uppercase, lowercase, number)
- Password confirmation
- Secure password hashing with bcrypt

✅ **User Login**
- Email and password validation
- JWT token generation
- Persistent login state

✅ **Forgot Password**
- Email validation
- Reset token generation
- Email sending (when configured)
- Development mode shows reset URL in response

✅ **Reset Password**
- Token validation
- New password requirements
- Automatic login after reset

✅ **Form Validation**
- Client-side validation with React Hook Form + Yup
- Server-side validation with express-validator
- Real-time error feedback

✅ **Responsive Design**
- Mobile-first design with Tailwind CSS
- Works on all screen sizes
- Modern, clean UI

## API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/signup` | Register new user |
| POST | `/login` | Login user |
| POST | `/forgot-password` | Request password reset |
| PUT | `/reset-password/:token` | Reset password with token |
| GET | `/me` | Get current user info |

## Frontend Routes

| Route | Description |
|-------|-------------|
| `/` | Redirects to login |
| `/login` | Login page |
| `/signup` | Registration page |
| `/forgot-password` | Forgot password page |
| `/reset-password/:token` | Reset password page |
| `/dashboard` | Protected dashboard |

## Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - MongoDB object modeling
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **express-validator** - Input validation
- **nodemailer** - Email sending
- **cors** - Cross-origin resource sharing

### Frontend
- **React 18** - Frontend library
- **Redux Toolkit** - State management
- **React Router** - Client-side routing
- **React Hook Form** - Form handling
- **Yup** - Schema validation
- **Tailwind CSS** - Styling
- **Axios** - HTTP client

## Development

### Backend Development
```bash
cd backend
npm run dev  # Uses nodemon for auto-restart
```

### Frontend Development
```bash
cd frontend
npm start    # React development server
```

### Building for Production
```bash
# Build frontend
npm run build

# Frontend files will be in frontend/build/
```

## Testing User Accounts

You can create test accounts through the signup page or test the authentication flow:

1. Go to `http://localhost:3000`
2. Click "create a new account"
3. Fill in the signup form
4. After registration, you'll be redirected to the dashboard
5. Test logout and login functionality

## Forgot Password Testing

Without email configuration:
1. Go to forgot password page
2. Enter an email address
3. Check the browser's developer console or backend logs for the reset URL
4. Use the reset URL to test password reset functionality

## Troubleshooting

### Common Issues

**MongoDB Connection Error:**
- Ensure MongoDB is running
- Check connection string in `.env`
- For Atlas, ensure IP whitelist is configured

**Port Already in Use:**
- Change PORT in `backend/.env`
- Kill existing processes: `lsof -ti:5000 | xargs kill -9`

**Frontend Build Issues:**
- Clear node_modules: `rm -rf node_modules package-lock.json && npm install`
- Clear browser cache

**CORS Issues:**
- Ensure backend is running on port 5000
- Check proxy setting in `frontend/package.json`

### Environment Variables

Make sure these are set in `backend/.env`:
- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - A secure random string (required)
- `PORT` - Backend port (default: 5000)

## Next Steps

This authentication system is ready for extension with:
- Booking functionality
- User profiles
- Admin panel
- Email verification
- Social login
- Two-factor authentication

## Security Notes

For production deployment:
1. Use a strong JWT secret (32+ random characters)
2. Set NODE_ENV=production
3. Use HTTPS
4. Configure proper CORS origins
5. Set up email service (Gmail, SendGrid, etc.)
6. Use environment variables for all secrets
7. Enable MongoDB authentication
8. Set up proper logging and monitoring 