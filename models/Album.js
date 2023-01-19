const mongoose = require('mongoose');

const albumSchema = new mongoose.Schema({
    title: { type: String, required: true },
    images: [String
        // {
        //     title: String,
        //     description: String,
        //     filename: String,
        //     size: Number,
        //     type: String
        // }
    ],
}, { timestamps: true });

module.exports = mongoose.model('Albums', albumSchema);