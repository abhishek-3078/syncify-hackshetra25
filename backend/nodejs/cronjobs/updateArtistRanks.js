const UserPreferences = require("./models/UserPreferences");
const ListeningHistory = require("./models/ListeningHistory");
const fetchSpotifyTopArtists = require("./utils/UserDetails"); // Fetches data from Spotify API
const cron = require("node-cron");

// 1️⃣ Update User's Top 10 Artists & Ranks (Handles New Users)
async function updateUserArtistRanks() {
    const users = await UserPreferences.find(); // Get all users

    for (const user of users) {
        // Check if user has listening history in the last 4 weeks
        const listeningData = await ListeningHistory.aggregate([
            { $match: { userId: user.user_id, playedAt: { $gte: getStartDate(28) } } },
            { $group: { _id: "$artistId", totalMinutes: { $sum: "$duration" } } },
            { $sort: { totalMinutes: -1 } }, // Sort by most listened
            { $limit: 10 } // Keep top 10
        ]);

        let updatedArtists;

        if (listeningData.length > 0) {
            // User has history → Update ranks based on listening time
            updatedArtists = listeningData.map((artist, index) => ({
                spotify_id: artist._id,
                rank: index + 1,
                previous_rank: getPreviousRank(user, artist._id, "4_week"),
                total_listen_time: artist.totalMinutes, // Store total minutes
                last_updated: new Date()
            }));
        } else {
            // New User → Fetch default data from Spotify
            const globalTopArtists = await fetchSpotifyTopArtists("4_week");

            updatedArtists = globalTopArtists.map((artist, index) => ({
                spotify_id: artist.id,
                rank: index + 1,
                previous_rank: null,
                total_listen_time: artist.popularity * 10, // Approximate listen time
                last_updated: new Date()
            }));
        }

        // Replace old rankings with new ones
        await UserPreferences.updateOne(
            { user_id: user.user_id },
            { $set: { "top_artists.4_week": updatedArtists } },
            { upsert: true } // Create entry if it doesn’t exist
        );
    }
}

// 2️⃣ Fetch "4-Week Top Artists" from Spotify and Replace Old Data
async function updateGlobalTopArtists() {
    const newSpotifyTopArtists = await fetchSpotifyTopArtists("4_week"); // Fetch from Spotify API

    // Replace old data with new data in a separate collection or document
    await UserPreferences.updateMany({}, { $set: { "top_artists.global_4_week": newSpotifyTopArtists } });
}

// 3️⃣ Schedule Cron Job to Run Every 24 Hours
cron.schedule("0 0 * * *", async () => {
    console.log("🔄 Updating user rankings and fetching Spotify top artists...");
    await updateUserArtistRanks();
    await updateGlobalTopArtists();
    console.log("✅ Update complete!");
});

// Utility: Get Start Date (28 Days Ago)
function getStartDate(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
}

// Utility: Get Previous Rank
function getPreviousRank(user, artistId, timePeriod) {
    const artist = user.top_artists[timePeriod]?.find(a => a.spotify_id === artistId);
    return artist ? artist.rank : null;
}
