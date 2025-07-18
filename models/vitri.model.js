const mongoose = require('mongoose')
const counterModel = require('./counter')

const viTriSchema = new mongoose.Schema(
    {
        MaViTri: {type: String, unique: true},
        TenViTri: {type: String, required: true},
        MoTa: { type: String}
    },
    {
        timestamps: true,
        minimize: false,
        collection: 'VITRI'
    }
)
viTriSchema.pre('save', async function (next) {
    if(this.isNew){
        const counter = await counterModel.findOneAndUpdate(
            {
                _id: 'vitri'
            },
            {
                $inc: { seq: 1}
            },
            {
                new: true,
                upsert: true
            }
        )
        this.MaViTri = 'VT' + String(counter.seq).padStart(3, '0')
    }
    next()
})
module.exports = mongoose.model('bangViTri', viTriSchema)