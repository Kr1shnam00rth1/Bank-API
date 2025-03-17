const express = require('express');
const router = express.Router();

const { authenticateToken } = require('../middleware/jwtMiddleware');
const { checkUserAccess } = require('../middleware/accessControlMiddleware');
const { userLogin, verifyOtp, userRegister, fundTransfer, transactionHistory, accountProfile, 
         sendOtp, resetPassword, updateProfile } = require('../controller/userController');

router.post("/login", userLogin);
router.post("/verifyOtp", verifyOtp);
router.post("/register", userRegister);
router.post("/sendOtp", sendOtp);
router.post("/resetPassword", resetPassword);
router.post("/fundTransfer", authenticateToken, checkUserAccess, fundTransfer);
router.get("/transactionHistory", authenticateToken, checkUserAccess, transactionHistory);
router.get("/accountProfile", authenticateToken, checkUserAccess, accountProfile);
router.post("/updateProfile", authenticateToken, checkUserAccess, updateProfile);

module.exports = router; 
