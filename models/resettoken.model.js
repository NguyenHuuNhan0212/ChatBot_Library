const mongoose = require("mongoose");

const resetTokenSchema = new mongoose.Schema({
  DocGiaId: { type: mongoose.Schema.Types.ObjectId, ref: "bangDocGia", required: true },
  Token: { type: String, required: true },
  expiresAt: { type: Date, required: true },
},
{
    timestamps: true,
    collection: 'RESETTOKEN'
}
);

// Xóa tự động sau khi hết hạn
resetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("ResetToken", resetTokenSchema);
