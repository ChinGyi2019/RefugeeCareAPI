require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const morgan = require("morgan");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(morgan("dev"));

// MongoDB connection
// mongoose.connect(process.env.MONGODB_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

// Routes
const userRoutes = require("./routes/users");
const authRoutes = require("./routes/auth");
const communityRoutes = require("./routes/community");
const cardCommunity = require("./routes/cards");
const notificationRoutes = require("./routes/notification");
const advertisementRoutes = require("./routes/advertisement");
const directoryRoutes = require("./routes/directory");

app.use("/api", userRoutes);
app.use("/api", authRoutes);
app.use("/api", communityRoutes);
app.use("/api", cardCommunity);
app.use("/api", notificationRoutes);
app.use("/api", advertisementRoutes);
app.use("/api", directoryRoutes);

app.get("/", (req, res) => {
  res.send("Welcome to the Express CRUD API");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ error: "Something went wrong!" });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
