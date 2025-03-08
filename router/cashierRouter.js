const express = require('express');
const router = express.Router();

const { authenticateToken } = require('../middleware/jwtMiddleware');
const { checkCashierAccess } = require('../middleware/accessControlMiddleware');
const { cashierLogin, cashierDeposit ,cashierWithdrawal, cashierUserAccountInfo } = require('../controller/cashierController');

router.post("/login", cashierLogin);
router.post("/deposit", authenticateToken, checkCashierAccess, cashierDeposit);
router.post("/withdrawal", authenticateToken, checkCashierAccess, cashierWithdrawal);
router.post("/userAccountInfo", authenticateToken, checkCashierAccess, cashierUserAccountInfo);

module.exports = router; 
