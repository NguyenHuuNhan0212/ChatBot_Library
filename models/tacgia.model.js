const mongoose = require('mongoose')

const tacGiaSchema = new mongoose.Schema({
    TenTG: { type: String, required: true },
    MoTa: { type: String }
    }, 
    { 
        timestamps: true,
        minimize: false,
        collection: 'TACGIA' 
    }
)

module.exports = mongoose.model('bangTacGia', tacGiaSchema)
