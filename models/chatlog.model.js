const mongoose = require('mongoose');

const chatLogSchema = new mongoose.Schema({
    MaDocGia: { type: mongoose.Schema.Types.ObjectId, ref: 'bangDocGia', required: true },
    question: { type: String, required: true },
    answer: { type: String, required: true }
    },
    {
        timestamps: true,
        collection: 'CHATLOG'
    }
);

module.exports = mongoose.model('ChatLog', chatLogSchema);
