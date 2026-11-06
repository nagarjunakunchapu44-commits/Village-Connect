# Village Connect

Village Connect is a community service and village development platform that connects residents with local authorities.

The platform allows residents to report village problems such as roads, drainage, street lights and other civic issues with photographs and GPS locations.

Local authorities can manage complaints, assign offices, update complaint status and monitor village activities.

---

## Features

### Resident Features

- User registration and login
- JWT-based authentication
- Password encryption using bcrypt
- Report village problems
- Upload complaint photographs
- Capture GPS location
- Track complaint status
- View complaint history
- View village information
- View village offices
- View community events
- Register for events
- Participate in community polls
- Register as a volunteer
- Community village chat
- Village issue map
- Analytics dashboard

---

## Admin Features

- Admin login
- Admin dashboard
- Complaint management
- Complaint search and filtering
- Assign complaints to offices
- Update complaint status
- View complaint history
- Village management
- Event management
- Event participant management
- Poll management
- Volunteer management
- Volunteer approval
- Analytics

---

## Technology Stack

### Frontend

- HTML
- CSS
- JavaScript

### Backend

- Node.js
- Express.js

### Database

- MySQL

### Authentication

- JWT
- bcryptjs

### Maps

- Leaflet
- OpenStreetMap

### GPS

- Browser Geolocation API

### File Upload

- Multer

---

## Project Structure

```text
village-connect/
│
├── frontend/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── home.html
│   ├── report.html
│   ├── complaints.html
│   ├── complaint-details.html
│   ├── map.html
│   ├── events.html
│   ├── event-details.html
│   ├── polls.html
│   ├── volunteers.html
│   ├── villages.html
│   ├── village-details.html
│   ├── chat.html
│   ├── analytics.html
│   ├── profile.html
│   │
│   └── admin/
│       ├── login.html
│       ├── dashboard.html
│       ├── complaints.html
│       ├── complaint-details.html
│       ├── users.html
│       ├── villages.html
│       ├── volunteers.html
│       ├── events.html
│       ├── event-participants.html
│       ├── polls.html
│       └── analytics.html
│
├── backend/
│   ├── server.js
│   │
│   ├── config/
│   │   └── db.js
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── complaintController.js
│   │   ├── officeController.js
│   │   ├── villageController.js
│   │   ├── eventController.js
│   │   ├── pollController.js
│   │   ├── volunteerController.js
│   │   ├── chatController.js
│   │   └── analyticsController.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── complaintRoutes.js
│   │   ├── officeRoutes.js
│   │   ├── villageRoutes.js
│   │   ├── eventRoutes.js
│   │   ├── pollRoutes.js
│   │   ├── volunteerRoutes.js
│   │   ├── chatRoutes.js
│   │   └── analyticsRoutes.js
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── uploadMiddleware.js
│   │
│   └── uploads/
│
├── database/
│   ├── schema.sql
│   └── seed.sql
│
├── .env
├── .gitignore
├── package.json
├── package-lock.json
└── README.md