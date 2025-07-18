const mongoose = require('mongoose')
const counterModel = require('./counter')

const trangThaiSchema = new mongoose.Schema(
    {
        MaTrangThai: {type: String, unique: true},
        TenTrangThai: {
            type: String, 
            required: true
        },
        MoTa: { type: String}
    },
    {
        timestamps: true,
        minimize: false,
        collection: 'TRANGTHAISACH'
    }
)
trangThaiSchema.pre('save', async function(next){
    if(this.isNew){
        const counter = await counterModel.findOneAndUpdate(
            {
                _id: 'trangthai'
            },
            {
                $inc: {seq: 1}
            },
            {
                new: true,
                upsert: true
            }
        )
        this.MaTrangThai = 'TT' + String(counter.seq).padStart(3, '0')
    }
})

module.exports = mongoose.model('bangTrangThai', trangThaiSchema)