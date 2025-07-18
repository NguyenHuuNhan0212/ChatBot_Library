require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const connectDB = require("./configs/database");
const chatbotRoutes = require("./routes/chatbot");

const app = express();
const PORT = process.env.PORT || 3000;

// Kết nối database
connectDB();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use("/api/chatbot", chatbotRoutes);

// Route test
app.get("/", (req, res) => {
  res.json({ message: "Library Chatbot API is running!" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
