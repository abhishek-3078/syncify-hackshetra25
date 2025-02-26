const axios = require("axios");
const User = require("../models/User"); // Import your User model
const qs = require("qs");

const getAccessToken = async (userId) => {
    try {
        // Fetch the user from the database
        const user = await User.findById(userId);
        if (!user || !user.refresh_token) {
            throw new Error("User not found or refresh token missing");
        }

        // Spotify API endpoint for refreshing the token
        const tokenUrl = "https://accounts.spotify.com/api/token";

        // Prepare the request data
        const data = qs.stringify({
            grant_type: "refresh_token",
            refresh_token: user.refresh_token,
            client_id: process.env.SPOTIFY_CLIENT_ID,
            client_secret: process.env.SPOTIFY_CLIENT_SECRET,
        });

        // Request new access token from Spotify
        const response = await axios.post(tokenUrl, data, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });

        const newAccessToken = response.data.access_token;

        // // Update the user's access token in the database
        // user.access_token = newAccessToken;
        // await user.save();

        return newAccessToken;
    } catch (error) {
        console.error("Error refreshing Spotify access token:", error);
        throw new Error("Failed to refresh access token");
    }
};

module.exports = getAccessToken;
