const express = require('express');
const { GetUserDetails,FetchTopItems } = require('../controllers/UserDetails');
const router = express.Router();
const { checkAuth } = require('../middleware/auth');


router.get('/', checkAuth, GetUserDetails);
router.get('/top-items', FetchTopItems);



module.exports = router;