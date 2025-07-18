const mongoose = require('mongoose')
const counterModel = require('./counter')
const loaiSachSchema = new mongoose.Schema(
    {
        MaLoai: {type: String, unique: true},
        TenLoai: {type: String, required: true},
        MoTa: {type: String}
    },
    {
        timestamps: true,
        minimize: false, //Trường object rỗng vẫn sẽ được lưu, đảm bảo cấu trúc JSON đầy đủ
        collection: 'LOAISACH'
    }
)
loaiSachSchema.pre('save', async function (next){
    if(this.isNew){
        const counter = await counterModel.findOneAndUpdate(
            {
                _id: 'loaisach'
            },
            {
                $inc: {seq: 1}
            },
            {
                new: true,
                upsert: true
            }
        )
        this.MaLoai = 'LS' +  String(counter.seq).padStart(3, '0')//ĐỊNH DẠNG CÓ 4 CHỮ SỐ SAU LS
    }
    next()
})

module.exports = mongoose.model('bangLoaiSach', loaiSachSchema)