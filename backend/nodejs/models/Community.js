const mongoose = require("mongoose");

const communitySchema = new mongoose.Schema({
  id: { type: Number, unique: true }, // Unique ID
  name: { type: String }, // Example: "Rock Lovers"
  description: { type: String, maxlength: 500 }, // About the community
  coverImage: { type: String }, // Community banner image
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // User IDs
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }], // Post IDs
  createdAt: { type: Date, default: Date.now },
});

const Community = mongoose.model("Community", communitySchema);
module.exports = Community;
