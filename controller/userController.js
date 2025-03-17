const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { db } = require("../config/dbConfig");
const { createToken , verifyToken } = require("../middleware/jwtMiddleware");
const sendMail = require("../middleware/mailMiddleware");

// Function to register user account
// POST /api/user/register
async function userRegister(req, res) {
    try {
        const { email, password, fullName, phoneNumber } = req.body;

        if (!email || !password || !fullName || !phoneNumber) {
            return res.status(400).json({ message: "Missing required input fields" });
        }

        const [userExist] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

        if (userExist.length > 0) {
            return res.status(409).json({ message: "User already exists with the given email" }); 
        }

        const passwordHashed = await bcrypt.hash(password, 10);

        await db.query(
            'INSERT INTO users (email, password, full_name, phone_number) VALUES (?, ?, ?, ?)', 
            [email, passwordHashed, fullName, phoneNumber]
        );

        return res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error("Registration error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// Function to handle user login
// Route: POST /api/user/login
async function userLogin(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const [userDetails] = await db.query("SELECT password FROM users WHERE email = ?", [email]);

        if (userDetails.length !== 0 && (await bcrypt.compare(password, userDetails[0].password))) {
            const otp = Math.floor(1000 + Math.random() * 9000).toString();
            const otpHashed = await bcrypt.hash(otp, 10);

            sendMail(email, "Your OTP for Verification", `Hello,\n\nYour One-Time Password (OTP) is: ${otp}
                \n\nThis OTP is valid for a short duration of 5 minutes.\n\nBest regards,\n[Titan Bank]`);

            const expiryTime = new Date();
            expiryTime.setMinutes(expiryTime.getMinutes() + 5); 
            
            await db.query(
                "INSERT INTO otps (email, otp_code, expiry_time) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE otp_code = VALUES(otp_code), expiry_time = VALUES(expiry_time)",
                [email, otpHashed, expiryTime]
            );
            
            return res.status(200).json({ 
                message: "OTP sent to your registered email", 
                email: email 
            });
        } else {
            return res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// Function to verify OTP
// Route: POST /api/user/verifyOtp
async function verifyOtp(req, res) {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP are required" });
        }
        
        const [userOtpDetails] = await db.query("SELECT otp_code FROM otps WHERE email = ?", [email]);
        
        if ( userOtpDetails.length === 0){
            return res.status(410).json({ message: "Expired OTP" });
        }
        
        const isOtpValid = await bcrypt.compare(otp, userOtpDetails[0].otp_code);
        if (!isOtpValid) {
            return res.status(401).json({ message: "Invalid OTP" });
        }
        
        const [userDetails] = await db.query('SELECT user_id from users WHERE email = ?',[email]);

        const payload = { userId: userDetails[0].user_id, role: "user" };
            const token = createToken(payload);

            res.cookie("authToken", token, { 
                httpOnly: true, 
                sameSite: "Strict"
            });

        return res.status(200).json({ message: "OTP verified successfully" });

    } catch (error) {
        console.error("OTP verification error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// Function to handle fund transfer
// Route: POST /api/user/fundTransfer
async function fundTransfer(req, res) {
    try {
        const { referenceAccount, amount } = req.body;

        if (!referenceAccount || !amount) {
            return res.status(400).json({ message: "Account number and amount are required" });
        }
        
        if (typeof amount !== "number") {
            return res.status(400).json({ message: "Amount must be a number." });
        }

        if (amount <= 0) {
            return res.status(400).json({ message: "Amount Invalid." });
        }
        
        const userId = req.user.userId;

        const [senderDetail] = await db.query('SELECT account_number, status, balance FROM users WHERE user_id = ?', [userId]);

        const senderAccount = senderDetail[0].account_number; 

        if (senderDetail[0].status !== 'active') {
            return res.status(423).json({ message: "Transfer denied. Your account is blocked or pending" });
        }
        if (senderDetail[0].balance < amount) {
            return res.status(400).json({ message: "Insufficient balance" });
        }
        if (senderDetail[0].account_number == referenceAccount) {
            return res.status(400).json({ message: "Transfer denied. Cannot transfer funds to your own account." });
        }        

        const [receiverDetail] = await db.query('SELECT status FROM users WHERE account_number = ?', [referenceAccount]);

        if (receiverDetail.length === 0) {
            return res.status(404).json({ message: "Receiver account does not exist" });
        }
        if (receiverDetail[0].status === 'blocked') {
            return res.status(423).json({ message: "Transfer denied. Receiver account is blocked." });
        }

        await db.query('UPDATE users SET balance = balance - ? WHERE user_id = ?', [amount, userId]);

        await db.query(
            'INSERT INTO transactions (account_number, reference_account, amount, type) VALUES (?, ?, ?, ?)',
            [senderAccount, referenceAccount, amount, 'transfer_out']
        );

        await db.query('UPDATE users SET balance = balance + ? WHERE account_number = ?', [amount, referenceAccount]);

        await db.query(
            'INSERT INTO transactions (account_number, reference_account, amount, type) VALUES (?, ?, ?, ?)',
            [referenceAccount, senderAccount, amount, 'transfer_in']
        );

        return res.status(200).json({ message: "Fund transferred successfully" });

    } catch (error) {
        console.error("Fund transfer error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// Function to display transaction history
// Route: GET /api/user/transactionHistory
async function transactionHistory(req, res) {
    try {
        const userId = req.user.userId;

        const [userDetails] = await db.query('SELECT account_number FROM users WHERE user_id = ?', [userId]);

        const accountNumber = userDetails[0].account_number;

        const [transactions] = await db.query('SELECT * FROM transactions WHERE account_number = ?', [accountNumber]);
        return res.status(200).json({ transactions });

    } catch (error) {
        console.error("Transaction history error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// Function to view account Profile
// Route: GET /api/user/accountProfile
async function accountProfile(req, res) {
    try {
        const userId = req.user.userId;

        const [userDetails] = await db.query('SELECT account_number, email, full_name, balance, status, phone_number FROM users WHERE user_id = ?', [userId]);

        return res.status(200).json({ userDetails });

    } catch (error) {
        console.error("Transaction history error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// Function to update profile
// Route: POST /api/user/updateProfile
async function updateProfile(req, res) {
    try {
        const { phoneNumber, fullName } = req.body;
        const userId = req.user.userId;

        if (!phoneNumber && !fullName) {
            return res.status(400).json({ message: "Provide at least one field to update" });
        }

        await db.query('UPDATE users SET phone_number = COALESCE(?, phone_number), full_name = COALESCE(?, full_name) WHERE user_id = ?', 
                       [phoneNumber, fullName, userId]);

        return res.status(200).json({ message: "Profile updated successfully" });

    } catch (error) {
        console.error("Update profile error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}


// Function to sendOTP to reset password
// Route: POST /api/user/sendOtp
async function sendOtp(req,res) {
    try{
        const { email } = req.body;
        if (!email){
            return res.status(400).json({ message: "Email is required" });
        }
        const [userDetails] = await db.query('SELECT * FROM users WHERE email =?',[email]);
        if (userDetails.length == 0){
            return res.status(404).json({message: "No user account with given email"});
        }
    
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        const otpHashed = await bcrypt.hash(otp, 10);

        sendMail(email, "Your OTP for Verification", `Hello,\n\nYour One-Time Password (OTP) is: ${otp}
            \n\nThis OTP is valid for a short duration of 5 minutes.\n\nBest regards,\n[Titan Bank]`);

        const expiryTime = new Date();
        expiryTime.setMinutes(expiryTime.getMinutes() + 5); 
    
        await db.query(
            "INSERT INTO otps (email, otp_code, expiry_time) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE otp_code = VALUES(otp_code), expiry_time = VALUES(expiry_time)",
            [email, otpHashed, expiryTime]
        );
    
        return res.status(200).json({ 
            message: "OTP sent to your email", 
            email: email 
        });
    } catch (error) {
        console.error("Send Otp error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }

}

// Function to reset password
// Route: POST /api/user/resetPassword
async function resetPassword(req, res) {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: "Missing required input fields" });
        }

        const [userOtpDetails] = await db.query("SELECT otp_code FROM otps WHERE email = ?", [email]);

        if (userOtpDetails.length == 0) {
            return res.status(410).json({ message: "Expired OTP" });
        }

        const isOtpValid = await bcrypt.compare(otp, userOtpDetails[0].otp_code);
        if (!isOtpValid) {
            return res.status(401).json({ message: "Invalid OTP" });
        }

        const passwordHashed = await bcrypt.hash(newPassword, 10);

        await db.query("UPDATE users SET password = ? WHERE email = ?", [passwordHashed, email]);

        return res.status(200).json({ message: "Password reset successful" });

    } catch (error) {
        console.error("Reset password error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

module.exports = { userLogin , verifyOtp , userRegister , fundTransfer , transactionHistory, 
    accountProfile, sendOtp, resetPassword, updateProfile};