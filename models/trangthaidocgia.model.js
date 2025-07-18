const mongoose = require('mongoose')

const trangThaiDocGiaSchema = new mongoose.Schema(
    {
        TenTT: {
            type: String,
            required: true,
            enum: ['active', 'blocked']
        },
        MoTa: { type: String, required: true }
    },
    {
        timestamps: true,
        minimize: false,
        collection: 'TRANGTHAIDOCGIA'
    }
)

module.exports = mongoose.model('bangTTDocGia', trangThaiDocGiaSchema)