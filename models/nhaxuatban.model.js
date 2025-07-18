const mongoose = require('mongoose')
const counterModel = require('./counter')
const nhaXuatBangSchema = new mongoose.Schema(
    {
        MaNXB: {type: String, unique: true},
        TenNXB: {type: String, required: true},
        DiaChi: {type: String, required: true}
    },
    {
        timestamps: true,
        minimize: false,
        collection: 'NHAXUATBAN'
    }
)
nhaXuatBangSchema.pre('save', async function (next){
    if (this.isNew){
        const counter = await counterModel.findOneAndUpdate(
            {
                _id: 'nxb'
            },
            {
                $inc: { seq: 1}
            },
            { 
                new: true, upsert: true
            }
        )
        this.MaNXB = 'NXB' +  String(counter.seq).padStart(4, '0')
    }
    next()
})
module.exports = mongoose.model('bangNXB', nhaXuatBangSchema)
