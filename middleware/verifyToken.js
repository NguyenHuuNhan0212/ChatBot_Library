const jwt = require("jsonwebtoken");
require("dotenv").config();
const verifyTokenUser = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token)
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });

  jwt.verify(token, process.env.JWT_SECRET || "NienLuanNganh", (err, user) => {
    if (err) {
      console.log("❌ Lỗi xác thực token:", err.message);
      return res.status(403).json({ message: "Invalid token." });
    }
    req.user = user;
    next();
  });
};
module.exports = { verifyTokenUser };
