const { verifyToken } = require('./jwtMiddleware')

// Function to check user access
function checkUserAccess(req, res, next){
    if (req.user.role != 'user'){
        return res.status(403).json({message: 'Access Denied'});
    } 
    next();
}

// Function to check manager access
function checkManagerAccess(req, res, next){
    if (req.user.role != 'manager'){
        return res.status(403).json({message: 'Access Denied'});
    } 
    next();
}

// Functions to check cashier acess
function checkCashierAccess(req, res, next){
    if (req.user.role != 'cashier'){
        return res.status(403).json({message: 'Access Denied'});
    } 
    next();
}

module.exports = {checkUserAccess, checkManagerAccess, checkCashierAccess};