const mongoose = require("mongoose");
const counterModel = require("./counter");

const nhanVienSchema = new mongoose.Schema(
  {
    MSNV: { type: String, unique: true },
    HoTenNV: { type: String, required: true },
    Password: { type: String, required: true },
    ChucVu: { type: String, required: true, default: "Nhân viên bình thường" },
    DiaChi: { type: String, required: true },
    // SoDienThoai VA Email FRONTEND check trước khi cho người dùng đăng ký
    SoDienThoai: { type: String, required: true },
    NgaySinh: { type: Date, required: true },
    Email: { type: String, required: true },
    Phai: { type: String, required: true },
    RefreshToken: { type: String },
  },
  {
    timestamps: true,
    minimize: false,
    collection: "NHANVIEN",
  }
);
nhanVienSchema.pre("save", async function (next) {
  if (this.isNew) {
    const counter = await counterModel.findOneAndUpdate(
      {
        _id: "nhanvien",
      },
      {
        $inc: { seq: 1 },
      },
      {
        new: true,
        upsert: true,
      }
    );
    this.MSNV = "NV" + String(counter.seq).padStart(3, "0");
  }
});
module.exports = mongoose.model("bangNhanVien", nhanVienSchema);
