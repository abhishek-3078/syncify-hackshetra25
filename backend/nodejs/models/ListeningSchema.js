const mongoose = require('mongoose');

const listeningSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    artistId: { type: String, required: true }, // Use Spotify Artist ID
    totalMinutes: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
});

const ListeningHistory = mongoose.model('ListeningHistory', listeningSchema);
module.exports = ListeningHistory;
