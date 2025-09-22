# Bookings App

A full-stack booking application built with React/Redux frontend, Node.js backend, and MongoDB database.

## Tech Stack

### Frontend
- React 18
- Redux Toolkit
- React Router
- Tailwind CSS (for responsive design)
- Axios (for API calls)

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- bcrypt for password hashing
- nodemailer for email functionality

## Features

### Authentication
- User signup with name, email, and password
- User login with email and password
- Forgot password functionality
- Input validation on all forms
- Responsive UI design

## Project Structure

```
bookingsapp/
├── frontend/           # React frontend
├── backend/           # Node.js backend
├── package.json       # Root package.json for scripts
└── README.md
```

## Getting Started

1. Install dependencies for both frontend and backend
2. Set up MongoDB database
3. Configure environment variables
4. Run both servers

## Development

- Frontend runs on port 3000
- Backend runs on port 5000
- MongoDB connection string needed in backend/.env
