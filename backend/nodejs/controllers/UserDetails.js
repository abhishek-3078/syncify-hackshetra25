const User = require('../models/User');
const axios = require('axios');
const getAccessToken = require('./getAccessToken');
const UserPreference = require('../models/UserPreference');

const GetUserDetails = async (req, res) => {
    try {

        const { username } = req.query;
        const user = await User.findOne({
            username: username
        });
        res.status(200).json({ user });
            
    }catch (error) {
        console.error("Error fetching user details:", error.message);
        res.status(500).json({ message: error.message });
    }
}

const GetTopArtist = async (userId, term, accessToken) => {
    try {
        const response = await axios.get(
            `https://api.spotify.com/v1/me/top/artists?limit=50&time_range=${term}`, 
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        const data = response.data.items;
        const formattedData = data.map((artist, index) => ({
            spotify_id: artist.id,
            name: artist.name,
            popularity: artist.popularity,
            profile_image: artist.images.length > 0 ? artist.images[0].url : null,
            genres: artist.genres,
            rank: index + 1,
            previous_rank: null
        }));

        return formattedData; 
    } catch (error) {
        throw error; 
    }
};



const GetTopSongs = async (userId, term, accessToken) => {
    try {
        const response = await axios.get(
            `https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=${term}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        const data = response.data.items.map((song, index) => ({
            spotify_id: song.id,
            name: song.name,
            artists: song.artists.map((artist) => ({
                spotify_id: artist.id,
                name: artist.name
            })),
            album: {
                spotify_id: song.album?.id || null,
                name: song.album?.name || "Unknown Album",
                cover_image: song.album?.images?.[0]?.url || null // Prevents crashes if no images exist
            },
            duration_ms: song.duration_ms,
            rank: index + 1,
            previous_rank: null,
            popularity: song.popularity
        }));

        return data; // Now correctly returning the formatted array
    } catch (error) {
        throw error; // Ensuring proper error handling
    }
};

const FetchTopItems=async(req,res)=>{
    const username=req.query.user
    const user=await User.findOne({
        username:username
    });
    const userId=user._id;
    try{
        const userPreferences=await UserPreference.findOne({user_id:userId});
        if(userPreferences){
            res.status(200).json({userPreferences});
        }else{
            const accessToken=await getAccessToken(userId);
            const topArtists4week=await GetTopArtist(userId,"short_term",accessToken);
            const topArtists6month=await GetTopArtist(userId,"medium_term",accessToken);
            const topArtistsAllTime=await GetTopArtist(userId,"long_term",accessToken);
            const topSongs4week=await GetTopSongs(userId,"short_term",accessToken);
            const topSongs6month=await GetTopSongs(userId,"medium_term",accessToken);
            const topSongsAllTime=await GetTopSongs(userId,"long_term",accessToken);
            console.log(topSongs4week);
            const userPreference=await UserPreference.create({
                user_id:userId,
                top_artists:{
                    "4_week":topArtists4week,
                    "6_month":topArtists6month,
                    "1_year":topArtistsAllTime
                },
                top_tracks:{
                    "4_week":topSongs4week,
                    "6_month":topSongs6month,
                    "1_year":topSongsAllTime
            }
        });
        res.status(200).json({userPreference});
        }
    }catch(error){
        console.trace("Error fetching top items:",error.message);
        res.status(500).json({ message: error.message });
    }
}
module.exports = { GetUserDetails ,GetTopArtist,FetchTopItems};