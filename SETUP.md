# Magazine Booking System - Setup Guide

This is a complete web-based magazine advertising booking system built with React and Node.js. The system handles customer management, magazine publications, content sizing, booking creation, and comprehensive reporting.

## Features

### Core Functionality
- **Customer Management**: Add, edit, and manage customer database with business categories and booking notes
- **Magazine Management**: Set up magazines with multiple issues, start dates, and page counts  
- **Content Size Management**: Define advertising sizes with magazine-specific pricing
- **Booking System**: Create bookings with multi-magazine support, discounts, and scheduling
- **Leaflet Delivery**: Separate booking system for leaflet delivery services
- **Dashboard Analytics**: Visual charts and statistics showing revenue, content breakdown, and performance

### Views and Reports
1. **Dashboard**: Overview with pie charts showing current issue space allocation
2. **Customer View**: Individual customer booking summaries and total values
3. **Publications View**: Revenue breakdown by magazine and content type
4. **Full Reports**: Filterable and exportable booking reports
5. **Current Issue View**: Real-time space allocation with percentage breakdowns

## System Requirements

- Node.js 16+ 
- MongoDB 4.4+
- React 18+
- Modern web browser

## Installation

### 1. Clone and Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies  
cd ../frontend
npm install
```

### 2. Environment Configuration

Create a `.env` file in the backend directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/bookingsapp
JWT_SECRET=your-super-secret-jwt-key-here
FRONTEND_URL=http://localhost:3000

# Email configuration (optional - for password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### 3. Database Setup

Start MongoDB and the database will be created automatically when you first run the application.

### 4. Start the Application

```bash
# Start backend (from backend directory)
npm run dev

# Start frontend (from frontend directory) 
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Initial Setup Workflow

### 1. Create Account
- Navigate to http://localhost:3000
- Click "Sign Up" to create your first account
- Log in with your credentials

### 2. Set Up Base Data

#### Add Customers
1. Go to "Customers" in the navigation
2. Click "Add Customer"
3. Enter customer details:
   - Name (e.g. "JP Plumbing")
   - Business Category (e.g. "Plumbing and Heating Services")  
   - Booking Notes (optional, e.g. "Must go in first 11 pages")

#### Add Magazines
1. Go to "Magazines" in the navigation
2. Click "Add Magazine"
3. Set up magazine with issues:
   - Magazine name (e.g. "Southampton Magazine")
   - Issues with names, page counts, and start dates:
     - Nov25, 40 pages, start date: 2025-09-01
     - Dec25, 36 pages, start date: 2025-10-01
     - Jan26, 40 pages, start date: 2025-11-01

#### Add Content Sizes
1. Go to "Content Sizes"
2. Create different ad sizes:
   - Quarter Page: 0.25 pages, £50 for Southampton, £45 for Winchester
   - Half Page: 0.5 pages, £90 for Southampton, £85 for Winchester  
   - Full Page: 1.0 pages, £160 for Southampton, £150 for Winchester

### 3. Create Bookings

1. Go to "New Booking"
2. Fill out booking form:
   - Select customer
   - Choose content size (pricing updates automatically)
   - Select magazine(s) - supports multiple selection
   - Choose content type (Advert, Article, Puzzle, etc.)
   - Set first and last issue (or mark as ongoing)
   - Apply discounts if needed
   - Add optional notes

### 4. View Analytics

#### Dashboard
- Overview statistics (customers, magazines, bookings, revenue)
- Current issue breakdown with pie chart
- Publications revenue comparison
- Quick action buttons

#### Current Issue Analysis
- Select a magazine to see current/next issue
- Pie chart showing content type allocation
- Percentage breakdown of booked vs available space
- Real-time space utilization

#### Reports
- Filter by magazine, issue, customer, content type
- Export data to CSV/Excel
- Detailed booking information
- Financial summaries

## Key Concepts

### Multi-Magazine Bookings
- Single booking can span multiple magazines
- Each magazine can have different pricing for same content size
- Useful for customers wanting presence across publications

### Issue Scheduling
- Start dates determine when issues become "current"
- Bookings can span multiple issues or be ongoing
- System automatically calculates which bookings apply to current issue

### Pricing and Discounts
- Base price calculated from content size + magazine combination
- Percentage discounts (e.g. 10% off)
- Fixed value discounts (e.g. £20 off)
- Additional charges for special placement
- Net value calculated automatically

### Content Types
- Advert: Paid advertising space
- Article: Editorial content  
- Puzzle: Games/entertainment content
- Advertorial: Paid content that looks editorial
- Front Cover: Premium placement
- In-house: Internal company content

### Leaflet Delivery
- Separate booking system for leaflet insertion
- Uses same customer and magazine data
- Tracks quantity and description
- Independent pricing and discount system

## API Endpoints

### Authentication
- POST `/api/auth/login` - User login
- POST `/api/auth/register` - User registration  
- POST `/api/auth/forgot-password` - Password reset request
- POST `/api/auth/reset-password/:token` - Reset password with token

### Customers
- GET `/api/customers` - List all customers
- POST `/api/customers` - Create customer
- PUT `/api/customers/:id` - Update customer
- DELETE `/api/customers/:id` - Delete customer
- GET `/api/customers/search/:query` - Search customers

### Magazines  
- GET `/api/magazines` - List all magazines
- POST `/api/magazines` - Create magazine with issues
- PUT `/api/magazines/:id` - Update magazine
- DELETE `/api/magazines/:id` - Delete magazine
- GET `/api/magazines/current-issue/:id` - Get current issue info

### Content Sizes
- GET `/api/content-sizes` - List all content sizes with pricing
- POST `/api/content-sizes` - Create content size
- PUT `/api/content-sizes/:id` - Update content size
- DELETE `/api/content-sizes/:id` - Delete content size
- GET `/api/content-sizes/:sizeId/price/:magazineId` - Get specific price

### Bookings
- GET `/api/bookings` - List bookings (supports filtering)
- POST `/api/bookings` - Create booking
- PUT `/api/bookings/:id` - Update booking  
- DELETE `/api/bookings/:id` - Delete booking
- GET `/api/bookings/customer/:id` - Customer booking summary
- GET `/api/bookings/report/data` - Report data with filters

### Dashboard
- GET `/api/dashboard/stats` - Overall statistics
- GET `/api/dashboard/current-issue/:magazineId` - Current issue breakdown
- GET `/api/dashboard/publications` - Publications revenue summary
- GET `/api/dashboard/top-customers` - Top customers by value
- GET `/api/dashboard/recent-activity` - Recent bookings and deliveries

### Leaflet Delivery
- GET `/api/leaflet-delivery` - List leaflet deliveries
- POST `/api/leaflet-delivery` - Create leaflet delivery
- PUT `/api/leaflet-delivery/:id` - Update leaflet delivery
- DELETE `/api/leaflet-delivery/:id` - Delete leaflet delivery
- GET `/api/leaflet-delivery/report/data` - Leaflet delivery reports

## Deployment

### Database Configuration
For production, use MongoDB Atlas or a hosted MongoDB instance:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bookingsapp
```

### Frontend Build
```bash
cd frontend
npm run build
```

### Process Management
Use PM2 for production:

```bash
npm install -g pm2
pm2 start backend/server.js --name "booking-api"
```

### Web Server
Serve frontend build files through Nginx or similar web server.

### Environment Variables
Set all required environment variables on your hosting platform.

## Multi-Tenant Support

The system includes built-in multi-tenant support:
- All data is isolated by user account
- Each user sees only their own customers, magazines, and bookings
- Perfect for SaaS deployment where multiple magazine publishers use the same system
- JWT-based authentication ensures data security

## Export and Integration

### Data Export  
- Reports can be exported to CSV format
- Full booking data with calculated values
- Filter before export for specific date ranges or criteria

### Future CRM Integration
- Customer model includes `crmId` field for external system integration
- API structure supports webhook additions for real-time sync
- RESTful design makes integration straightforward

## Troubleshooting

### Common Issues

**MongoDB Connection Issues**
- Ensure MongoDB is running
- Check connection string in `.env` file
- Verify network connectivity

**Authentication Errors**  
- Check JWT_SECRET is set
- Ensure token isn't expired
- Clear browser localStorage if needed

**Chart/Graph Issues**
- Ensure recharts library is installed
- Check browser console for JavaScript errors
- Verify data format matches expected structure

**Build Errors**
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version compatibility
- Ensure all peer dependencies are installed

For additional support or feature requests, please check the project repository issues section. 