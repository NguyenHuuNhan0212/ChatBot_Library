const mongoose = require("mongoose");
const counterModel = require("./counter");

const sachCopySchema = new mongoose.Schema(
  {
    MaSachCopy: { type: String, unique: true },
    MaSach: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "bangSach",
      required: true,
    },
    MaNXB: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "bangNXB",
      required: true,
    },
    MaViTri: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "bangViTri",
      required: true,
    },
    SoQuyen: { type: Number, required: true },
    TenLoaiBanSao: { type: String, required: true },
    SoLuongDaMuon: { type: Number, required: true, default: 0 },
  },
  {
    timestamps: true,
    minimize: false,
    collection: "SACHCOPY",
  }
);
sachCopySchema.pre("save", async function (next) {
  if (this.isNew) {
    const counter = await counterModel.findOneAndUpdate(
      {
        _id: "sachcopy",
      },
      {
        $inc: { seq: 1 },
      },
      {
        new: true,
        upsert: true,
      }
    );
    this.MaSachCopy = "SCP" + String(counter.seq).padStart(4, "0");
  }
  next();
});

module.exports = mongoose.model("bangSachCopy", sachCopySchema);
