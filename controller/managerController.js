const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { db } = require("../config/dbConfig");
const { createToken } = require("../middleware/jwtMiddleware");
const sendMail = require("../middleware/mailMiddleware");

// Function to handle manager login
// Route: POST /api/manager/login
async function managerLogin(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const  [managerDetails] = await db.query("SELECT password FROM managers WHERE email = ?", [email]);

        if (managerDetails.length !== 0 && (await bcrypt.compare(password, managerDetails[0].password))){
            const payload = { managerId: managerDetails[0].manager_id, role: "manager" };
            const token = createToken(payload);

            res.cookie("authToken", token, { 
                httpOnly: true, 
                sameSite: "Strict"
            });
            return res.status(200).json({ message: "Login successful"});
        } else {
            return res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// Function to create cashier account
// Route: POST /api/manager/createCashierAccount
async function createCashierAccount(req, res) {
    try {
        const { email, password, fullName } = req.body;

        if (!email || !password || !fullName) {
            return res.status(400).json({ message: "Email, Password, and Full Name is required" });
        }

        const [cashierExist] = await db.query('SELECT * FROM cashiers WHERE email = ?', [email]);
        if (cashierExist.length > 0) {
            return res.status(409).json({ message: "Cashier already exists with given email" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        sendMail(email, "Your Cashier Account Credentials", `Hello,\n\nWe hope you're doing well.
            \n\nYour cashier account password is: ${password}\n\nBest regards,\n[Titan Bank]`);

        await db.query('INSERT INTO cashiers (email, password, full_name) VALUES (?, ?, ?)', [email, hashedPassword, fullName]);
        
        return res.status(201).json({ message: "Cashier account created successfully" });

    } catch (error) {
        console.error("Error creating cashier account:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// Function to get all users details
// Route: GET /api/manager/users
async function getUsersDetails(req, res) {
    try {
        const [usersDetails] = await db.query('SELECT email, account_number, full_name, phone_number, status FROM users');

        return res.status(200).json({ users: usersDetails });

    } catch (error) {
        console.error("Error fetching user details:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// Function to assign account numbers to users
// Route: POST /api/manager/assignAccountNumber
async function assignAccountNumber(req, res) {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }
    
        const [usersDetails] = await db.query('SELECT status FROM users WHERE email = ?', [email]);
        
        if (usersDetails.length === 0) {
            return res.status(404).json({ message: "User does not exist" });
        }

        if (usersDetails[0].status === 'active') {
            return res.status(409).json({ message: "Account number already assigned" });
        }

        let accountNumber;
        let isUnique = false;
        while (!isUnique) {
            accountNumber = crypto.randomInt(100000000000, 999999999999).toString();
            const [existing] = await db.query('SELECT account_number FROM users WHERE account_number = ?', [accountNumber]);
            if (existing.length === 0) {
                isUnique = true;
            }
        }

        await db.query('UPDATE users SET account_number = ?, status = ? WHERE email = ?', [accountNumber, 'active', email]);

        return res.status(201).json({ message: "Account number assigned successfully"});
    } catch (error) {
        console.error("Error assigning account number:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// Function to delete user acccount
// Route: POST /api/manager/deleteUser
async function deleteUser(req, res) {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const [userExist] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        
        if (userExist.length === 0) { 
            return res.status(404).json({ message: "User does not exist" });
        }

        await db.query('DELETE FROM users WHERE email = ?', [email]);

        return res.status(200).json({ message: "User deleted successfully" }); 

    } catch (error) {
        console.error("Error deleting user:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// Function to block user acccount
// Route: POST /api/manager/blockUser
async function blockUser(req, res) {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const [userExist] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        
        if (userExist.length === 0) { 
            return res.status(404).json({ message: "User does not exist" });
        }

        await db.query('UPDATE users SET status = ? WHERE email = ?', ['blocked', email]);

        return res.status(200).json({ message: "User blocked successfully" });

    } catch (error) {
        console.error("Error blocking user:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// Function to activate user acccount
// Route: POST /api/manager/activateUser
async function activateUser(req, res) {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const [userExist] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        
        if (userExist.length === 0) { 
            return res.status(404).json({ message: "User does not exist" });
        }

        await db.query('UPDATE users SET status = ? WHERE email = ?', ['active', email]);

        return res.status(200).json({ message: "User activated successfully" });

    } catch (error) {
        console.error("Error activating user:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

module.exports = { managerLogin , createCashierAccount, getUsersDetails , 
    deleteUser , blockUser, activateUser, assignAccountNumber };

