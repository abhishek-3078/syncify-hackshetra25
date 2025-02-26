const cron = require("node-cron");
const User = require("../models/User"); // Assuming your user schema is in models/User.js
const UserPreference = require("../models/UserPreference"); // Your user preferences schema
const { GetTopArtist, GetTopSongs } = require("../controllers/UserDetails"); // Your existing Spotify API functions
const getAccessToken = require("../controllers/getAccessToken"); // Function to fetch access token

// Function to update preferences based on term
const updateUserPreferences = async (term) => {
    try {
        const users = await User.find(); // Fetch all users

        for (const user of users) {
            try {
                const userId = user._id;
                const accessToken = await getAccessToken(userId);

                // Fetch existing user preferences
                const existingPreferences = await UserPreference.findOne({ user_id: userId });

                // Fetch fresh Spotify data
                const newTopArtists = await GetTopArtist(userId, term, accessToken);
                const newTopSongs = await GetTopSongs(userId, term, accessToken);

                // Determine which category to update
                const category = term === "short_term" ? "4_week" 
                               : term === "medium_term" ? "6_month" 
                               : "1_year";

                // Function to update previous rank while keeping only 50
                const updatePreviousRank = (newData, oldData) => {
                    const oldRankMap = new Map();
                    if (oldData) {
                        oldData.forEach((item) => {
                            oldRankMap.set(item.spotify_id, item.rank);
                        });
                    }
                    return newData.map((item) => ({
                        ...item,
                        previous_rank: oldRankMap.get(item.spotify_id) || null,
                    })).slice(0, 50);
                };

                // Update ranks
                const updatedArtists = updatePreviousRank(newTopArtists, existingPreferences?.top_artists[category]);
                const updatedSongs = updatePreviousRank(newTopSongs, existingPreferences?.top_songs[category]);

                // Remove old data and insert new 50 records
                await UserPreference.findOneAndUpdate(
                    { user_id: userId },
                    {
                        [`top_artists.${category}`]: updatedArtists,
                        [`top_songs.${category}`]: updatedSongs
                    },
                    { upsert: true, new: true }
                );

                console.log(`Updated ${category} preferences for user: ${user.username}`);
            } catch (error) {
                console.error(`Error updating ${term} preferences for user ${user.username}:`, error.message);
            }
        }
    } catch (error) {
        console.error("Error fetching users:", error.message);
    }
};

// Schedule the cron jobs

// 🕒 Every 24 hours → Updates 4-week data
cron.schedule("0 0 * * *", () => {
    console.log("Running cron job: Updating 4-week top artists and songs...");
    updateUserPreferences("short_term");
});

// 🕖 Every 7 days → Updates 6-month data
cron.schedule("0 0 * * 0", () => {
    console.log("Running cron job: Updating 6-month top artists and songs...");
    updateUserPreferences("medium_term");
});

// 🗓 Every 30 days → Updates 1-year data
cron.schedule("0 0 1 * *", () => {
    console.log("Running cron job: Updating 1-year top artists and songs...");
    updateUserPreferences("long_term");
});

module.exports = { updateUserPreferences };
