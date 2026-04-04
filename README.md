# StayFinder - Your Perfect Stay Companion

A modern, full-stack listing platform built with Node.js, Express, MongoDB, and EJS.

## 🚀 Features

- JWT Cookie Authentication: Secure signup and login with token-based sessions
- Email Verification (OTP): OTP-based account verification with Resend
- Listings Management: Create, read, update, and delete stay listings
- Image Upload: Cloudinary integration for listing images
- Reviews & Ratings: Users can leave reviews and 1-5 star ratings
- Search Functionality: Search listings by title/destination
- Booking Payments: Razorpay order creation and payment capture flow
- Security Enhancements: Helmet headers and auth rate limiting
- Modern UI: Responsive interface with Bootstrap 5 and EJS templates

## 📁 Project Structure
```text
StayFinder/
├── app.js # Main application entry point
├── cloudConfig.js # Cloudinary configuration
├── middleware.js # Custom middleware (auth, validation, guards)
├── schema.js # Joi validation schemas
├── package.json # Dependencies and scripts
├── package-lock.json # Locked dependency versions
├── .gitignore # Git ignore rules
│
├── controllers/ # Route controllers
│ ├── listings.js # Listing operations
│ ├── paymentController.js # Razorpay payment operations
│ ├── reviews.js # Review operations
│ └── users.js # Signup, login, OTP verification
│
├── models/ # Mongoose models
│ ├── listing.js # Listing schema
│ ├── review.js # Review schema
│ └── user.js # User schema
│
├── routes/ # Express routes
│ ├── listing.js # Listing routes
│ ├── payment.js # Payment routes
│ ├── review.js # Review routes
│ └── user.js # Auth and user routes
│
├── utils/ # Utility modules
│ ├── ExpressError.js # Custom error class
│ ├── jwtAuth.js # JWT sign/verify and auth cookie helpers
│ └── wrapAsync.js # Async error wrapper
│
├── public/ # Static assets
│ ├── css/
│ │ ├── style.css # Main stylesheet
│ │ └── rating.css # Rating component styles
│ └── js/
│ └── script.js # Client-side JavaScript
│
├── views/ # EJS templates
│ ├── layouts/
│ │ └── boilerplate.ejs # Main layout
│ ├── includes/
│ │ ├── navbar.ejs # Navigation bar
│ │ ├── footer.ejs # Footer
│ │ └── flash.ejs # Flash messages
│ ├── listings/
│ │ ├── index.ejs # Listings list
│ │ ├── show.ejs # Listing details + booking flow
│ │ ├── new.ejs # Create listing
│ │ ├── edit.ejs # Edit listing
│ │ └── searchResults.ejs # Search results
│ ├── users/
│ │ ├── login.ejs # Login page
│ │ ├── signup.ejs # Signup page
│ │ └── verify.ejs # OTP verification page
│ ├── home.ejs # Home page
│ └── error.ejs # Error page
│
└── init/ # Database initialization
├── index.js # Init script
└── data.js # Sample seed data
```
## 🛠️ Technologies Used

- Backend: Node.js, Express.js
- Database: MongoDB with Mongoose
- Authentication: JWT (jsonwebtoken) + HTTP-only cookies
- Account Security: OTP email verification with Resend
- File Upload: Multer + Cloudinary
- Frontend: EJS, Bootstrap 5, Font Awesome
- Validation: Joi
- Session & Flash: express-session, connect-mongo, connect-flash
- Payments: Razorpay
- Security: Helmet, express-rate-limit

## 📦 Installation

1. Clone the repository

   git clone <repository-url>
   cd StayFinder

2. Install dependencies

   npm install

3. Set up environment variables

   Create a .env file in the project root:

   NODE_ENV=development
   PORT=8080

   # Database

   ATLASDB_URL=your-mongodb-connection-string

   # App secrets

   SECRET=your-session-secret
   JWT_SECRET=your-jwt-secret
   JWT_EXPIRES_IN=7d

   # Cloudinary

   CLOUD_NAME=your-cloudinary-cloud-name
   CLOUD_API_KEY=your-cloudinary-api-key
   CLOUD_API_SECRET=your-cloudinary-api-secret

   # Resend (OTP email)

   RESEND_API_KEY=your-resend-api-key
   RESEND_FROM_EMAIL=onboarding@resend.dev

   # Razorpay

   RAZORPAY_ID_KEY=your-razorpay-key-id
   RAZORPAY_SECRET_KEY=your-razorpay-secret

4. Start MongoDB

   If ATLASDB_URL is not set, the app falls back to local MongoDB:

   mongodb://127.0.0.1:27017/wanderlust

5. Run the application

   node app.js

6. Open in browser

   http://localhost:8080

## 🎨 Feature Overview

### For Users

- Browse and search stay listings
- View detailed listing information
- Leave ratings and reviews
- Sign up, verify email with OTP, and log in securely
- Book listings with online payment flow

### For Hosts

- Create and manage listings
- Upload and update listing images
- Edit and delete listings
- View feedback via user reviews

## 📝 License

ISC

## 👨‍💻 Author

StayFinder Development Team

## 🤝 Contributing

Contributions are welcome. Feel free to open an issue or submit a pull request with improvements.

## ⚠️ Security Note

Keep your .env file private and never commit it to version control.
