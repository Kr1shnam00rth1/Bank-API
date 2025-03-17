const express = require('express');
const router = express.Router();

const { authenticateToken } = require('../middleware/jwtMiddleware');
const { checkManagerAccess } = require('../middleware/accessControlMiddleware');
const { managerLogin, createCashierAccount , getUsersDetails, deleteUser, blockUser ,
     activateUser, assignAccountNumber } = require('../controller/managerController');

router.post("/login", managerLogin);
router.post("/createCashierAccount", authenticateToken, checkManagerAccess, createCashierAccount);
router.post("/assignAccountNumber", authenticateToken, checkManagerAccess, assignAccountNumber);
router.get("/users", authenticateToken, checkManagerAccess, getUsersDetails);
router.post("/deleteUser", authenticateToken, checkManagerAccess, deleteUser);
router.post("/blockUser", authenticateToken, checkManagerAccess, blockUser);
router.post("/activateUser", authenticateToken, checkManagerAccess, activateUser);

module.exports = router; 
