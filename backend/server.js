require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const officeRoutes = require("./routes/officeRoutes");
const villageRoutes = require("./routes/villageRoutes");
const eventRoutes = require("./routes/eventRoutes");
const pollRoutes = require("./routes/pollRoutes");
const volunteerRoutes = require("./routes/volunteerRoutes");
const chatRoutes = require("./routes/chatRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const userRoutes = require("./routes/userRoutes");
const mapRoutes = require("./routes/mapRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const errorMiddleware = require("./middleware/errorMiddleware");

const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    "/uploads",
    express.static(
        path.join(__dirname, "uploads")
    )
);

app.use(
    express.static(
        path.join(__dirname, "../frontend")
    )
);

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/complaints",
    complaintRoutes
);

app.use(
    "/api/offices",
    officeRoutes
);

app.use(
    "/api/villages",
    villageRoutes
);

app.use(
    "/api/events",
    eventRoutes
);

app.use(
    "/api/polls",
    pollRoutes
);

app.use(
    "/api/volunteers",
    volunteerRoutes
);

app.use(
    "/api/chat",
    chatRoutes
);

app.use(
    "/api/map",
    mapRoutes
);

app.use(
    "/api/analytics",
    analyticsRoutes
);

app.use(
    "/api/users",
    userRoutes
);

app.use(
    "/api/notifications",
    notificationRoutes
);

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

app.get(
    "/api/health",
    (req, res) => {
        res.json({
            success: true,
            message:
                "Village Connect API is running"
        });
    }
);

/*
|--------------------------------------------------------------------------
| Frontend Home Page
|--------------------------------------------------------------------------
*/

app.get(
    "/",
    (req, res) => {
        res.sendFile(
            path.join(
                __dirname,
                "../frontend/index.html"
            )
        );
    }
);

/*
|--------------------------------------------------------------------------
| Unknown API Route
|--------------------------------------------------------------------------
*/

app.use(
    "/api",
    (req, res) => {
        res.status(404).json({
            success: false,
            message:
                "API route not found"
        });
    }
);

/*
|--------------------------------------------------------------------------
| Global Error Handler
|--------------------------------------------------------------------------
*/

app.use(errorMiddleware);

/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/

app.listen(
    PORT,
    () => {
        console.log(
            `Village Connect server running on port ${PORT}`
        );

        console.log(
            `http://localhost:${PORT}`
        );
    }
);