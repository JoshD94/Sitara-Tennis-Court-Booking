# Sitara Tennis Court Booking System

A comprehensive web application for booking tennis courts at the Sitara residential complex. This system allows residents to book tennis courts up to a week in advance through an intuitive user interface.

## 🎾 Project Overview

The Sitara Tennis Court Booking System is designed to streamline the court reservation process for residents. Users can view court availability, make bookings within their weekly quota, and manage their upcoming reservations, all within a simple web interface.

## 📸 Screenshots

![Main Calendar View](public/calendar.png)
*Main calendar view showing all bookings*

![Booking Interface](public/booking.png)
*Booking interface with time slot selection*

## ✨ Features

- **Interactive Calendar**: View all existing bookings in a calendar format
- **Time Slot Selection**: Book courts in 1-hour or 2-hour increments
- **Quota Management**: Each user has a weekly booking quota (default: 3 hours)
- **Booking Window**: Bookings are open from 6pm to midnight each day
- **Date Range Restriction**: Book courts from tomorrow up to a week in advance
- **User Authentication**: Secure login system for residents
- **Upcoming Bookings**: View and manage your upcoming reservations
- **Responsive Design**: Works seamlessly on both desktop and mobile devices
- **Real-time Availability**: Instantly see which time slots are available
- **Analytics**: Track court usage patterns (admin feature)

## 🛠️ Tech Stack

- **Frontend**:
  - [Next.js 15](https://nextjs.org/) - React framework
  - [React 19](https://react.dev/) - UI library
  - [TailwindCSS 4](https://tailwindcss.com/) - Utility-first CSS framework
  - [React Big Calendar](https://github.com/jquense/react-big-calendar) - Calendar component

- **Backend**:
  - [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction) - API implementation
  - [Prisma 6](https://www.prisma.io/) - ORM for database access
  - [PostgreSQL](https://www.postgresql.org/) - Database

- **Authentication**:
  - Custom JWT-based authentication system
  - Secure password handling with bcrypt

- **Time Handling**:
  - [date-fns-tz](https://github.com/marnusw/date-fns-tz) - Timezone support
  - [Moment.js](https://momentjs.com/) - Date manipulation

- **Analytics**:
  - [Vercel Analytics](https://vercel.com/analytics) - Usage tracking

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [PostgreSQL](https://www.postgresql.org/) database

### Environment Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/sitara-tennis-court-booking.git
   cd sitara-tennis-court-booking
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/tennis_booking"
   JWT_SECRET="your-jwt-secret-key"
   ```

4. Set up the database:
   ```bash
   npx prisma migrate dev --name init
   ```

### Running the Application

1. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

2. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 📝 Database Schema

The application uses two main data models:

1. **User**:
   - Stores resident information and authentication details
   - Includes booking quota configuration
   - Tracks created bookings

2. **Booking**:
   - Stores court reservation details
   - Linked to users for ownership tracking
   - Includes start and end times for reservations

## 🧪 Testing

```bash
npm test
# or
yarn test
```

## 🌐 Deployment

The application is optimized for deployment on [Vercel](https://vercel.com/), but can be deployed to any platform that supports Next.js.

1. Push your code to a Git repository
2. Connect your repository to Vercel
3. Configure environment variables
4. Deploy!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- Thanks to all the residents of Sitara for their feedback and support
- Special thanks to the Sitara management for supporting this digital initiative