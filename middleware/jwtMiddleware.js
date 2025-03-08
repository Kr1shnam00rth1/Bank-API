require("dotenv").config();
const jwt = require("jsonwebtoken");

const secretKey = process.env.JWT_SECRET; 

// Function to sign JWT token
function createToken(payload) {
    return jwt.sign(payload, secretKey, { expiresIn: '1h' });
}

// Function to verify JWT token
function verifyToken(token) {
    try {
        return jwt.verify(token, secretKey);
    } catch (error) {
        console.error('Token verification failed:', error.message);
        return null;
    }
}

// Function to authenticate JWT session token
function authenticateToken(req, res, next) {
    const token = req.cookies.authToken; 
    if (!token) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(401).json({ message: "Invalid or expired token." });
    }
    req.user = decoded; 
    next();
}

module.exports = { createToken, verifyToken, authenticateToken };
