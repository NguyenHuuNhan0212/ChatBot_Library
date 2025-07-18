const mongoose = require("mongoose");
const counterModel = require("./counter");

const sachSchema = new mongoose.Schema(
  {
    MaSach: { type: String, unique: true },
    TenSach: { type: String, required: true },
    NamXuatBan: { type: String, required: true },
    TacGia: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "bangTacGia",
        required: true,
      },
    ], // mảng tác giả
    SoLuotMuon: { type: Number, default: 0 },
    MoTa: { type: String },
    MaLoai: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "bangLoaiSach",
        required: true,
      },
    ],
    image: { type: String },
  },
  {
    timestamps: true,
    minimize: false,
    collection: "SACH",
  }
);
sachSchema.pre("save", async function (next) {
  if (this.isNew) {
    const counter = await counterModel.findOneAndUpdate(
      {
        _id: "sach",
      },
      {
        $inc: { seq: 1 },
      },
      {
        new: true,
        upsert: true,
      }
    );
    this.MaSach = "S" + String(counter.seq).padStart(4, "0");
  }
  next();
});

module.exports = mongoose.model("bangSach", sachSchema);
