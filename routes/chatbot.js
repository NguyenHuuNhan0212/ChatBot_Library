const express = require("express");
const router = express.Router();
const aiService = require("../services/aiService");

const ChatLog = require("../models/chatlog.model");
const { verifyTokenUser } = require("../middleware/verifyToken");
router.post("/chat", verifyTokenUser, async (req, res) => {
  try {
    const { message } = req.body;
    const MaDocGia = req.user._id;
    if (!message || !MaDocGia) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin message hoặc MaDocGia",
      });
    }

    // Lấy 5 lịch sử chat gần nhất của người dùng này
    const recentHistory = await ChatLog.find({ MaDocGia })
      .sort({ createdAt: -1 })
      .limit(5);

    const historyContext = recentHistory
      .reverse() // để giữ thứ tự thời gian
      .map((item) => ({
        role: "user",
        content: item.question,
      }))
      .concat(
        recentHistory.map((item) => ({
          role: "assistant",
          content: item.answer,
        }))
      );

    // Gửi sang AI để xử lý, với ngữ cảnh hội thoại
    const response = await aiService.processUserQuery(message, historyContext);

    // Lưu lại câu hỏi - câu trả lời
    await ChatLog.create({
      MaDocGia,
      question: message,
      answer: response,
    });

    res.json({
      success: true,
      response: response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Lỗi chatbot:", error);
    res.status(500).json({
      success: false,
      message: "Có lỗi xảy ra, vui lòng thử lại",
    });
  }
});

module.exports = router;
