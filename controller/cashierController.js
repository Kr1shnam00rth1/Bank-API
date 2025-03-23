const bcrypt = require("bcrypt");
const { db } = require("../config/dbConfig");
const { createToken } = require("../middleware/jwtMiddleware");

// Function to handle cashier login
// Route: POST /api/cashier/login
async function cashierLogin(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }
        
        const [cashierDetails] = await db.query("SELECT cashier_id, password FROM cashiers WHERE email = ?", [email]);

        if (cashierDetails.length !== 0 && (await bcrypt.compare(password, cashierDetails[0].password))){
            const payload = { cashierId: cashierDetails[0].cashier_id, role: "cashier" };
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

// Function to handle cashier getting user account info
// Route: POST /api/cashier/userAccountInfo
async function cashierUserAccountInfo(req, res) {
    try {
        const { accountNumber } = req.body;

        if (!accountNumber) {
            return res.status(400).json({ message: "Account number is required" });
        }
        
        const [userDetails] = await db.query('SELECT account_number, full_name, balance, status FROM users WHERE account_number = ?', [accountNumber]);

        if (userDetails.length === 0) {
            return res.status(404).json({ message: "User account does not exist" });
        }

        if (userDetails[0].status === 'blocked') {
            return res.status(423).json({ message: "User account is blocked" });
        }

        return res.status(200).json({
            accountNumber: userDetails[0].account_number,
            fullName: userDetails[0].full_name,
            balance: userDetails[0].balance
        });

    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// Function to handle cashier deposits
// Route: POST /api/cashier/deposit
async function cashierDeposit(req, res) {
    try {

        const { accountNumber, amount } = req.body;

        if (!accountNumber || !amount) {
            return res.status(400).json({ message: "Account number and amount are required" });
        }
        
        if (typeof amount !== "number") {
            return res.status(400).json({ message: "Amount must be a number." });
        }

        if (amount <= 0) {
            return res.status(400).json({ message: "Amount Invalid." });
        }

        const [userDetails] = await db.query('SELECT status FROM users WHERE account_number = ?', [accountNumber]);

        if (userDetails.length === 0) {
            return res.status(404).json({ message: "User account does not exist" });
        }

        if (userDetails[0].status === 'blocked') {
            return res.status(423).json({ message: "User account is blocked" });
        }

        await db.query('UPDATE users SET balance = balance + ? WHERE account_number = ?', [amount, accountNumber]);

        await db.query(`INSERT INTO transactions (account_number, amount, type) VALUES (?, ?, 'deposit')`,[accountNumber, amount]);
        
        return res.status(200).json({ message: "Deposit successful"});

    } catch (error) {
        console.error("Deposit error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// Function to handle cashier withdrawal
// Route: POST /api/cashier/withdrawal
async function cashierWithdrawal(req, res) {
    try {
        const { accountNumber, amount } = req.body;

        if (!accountNumber || !amount) {
            return res.status(400).json({ message: "Account number and amount are required" });
        }
        
        if (typeof amount !== "number") {
            return res.status(400).json({ message: "Amount must be a number." });
        }

        if (amount <= 0) {
            return res.status(400).json({ message: "Amount Invalid." });
        }
        
        const [userDetails] = await db.query('SELECT balance, status FROM users WHERE account_number = ?', [accountNumber]);

        if (userDetails.length === 0) {
            return res.status(404).json({ message: "User account does not exist" });
        }

        if (userDetails[0].status === 'blocked') {
            return res.status(423).json({ message: "User account is blocked" });
        }

        if (userDetails[0].balance < amount) {
            return res.status(400).json({ message: "Insufficient balance" });
        }

        await db.query('UPDATE users SET balance = balance - ? WHERE account_number = ?', [amount, accountNumber]);

        await db.query(`INSERT INTO transactions (account_number, amount, type) VALUES (?, ?, 'withdrawal')`,[accountNumber, amount]);

        return res.status(200).json({ message: "Withdrawal successful" });

    } catch (error) {
        console.error("Withdrawal error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// Function to handle cashier password change
// Route: POST /api/cashier/changePassword
async function cashierChangePassword(req, res) {
    try {
        const { newPassword, oldPassword } = req.body;

        if (!newPassword || !oldPassword) {
            return res.status(400).json({ message: "New Password and Old Password are required" });
        }

        const [cashierDetails] = await db.query("SELECT password FROM cashiers WHERE cashier_id = ?", [req.user.cashierId]);

        if (cashierDetails.length === 0) {
            return res.status(404).json({ message: "Cashier not found" });
        }

        const existingHashedPassword = cashierDetails[0].password;

        const isMatch = await bcrypt.compare(oldPassword, existingHashedPassword);
        if (!isMatch) {
            return res.status(401).json({ message: "Your Old Password is incorrect" });
        }

        const newPasswordHashed = await bcrypt.hash(newPassword, 10);

        await db.query("UPDATE cashiers SET password = ? WHERE cashier_id = ?", [newPasswordHashed, req.user.cashierId]);

        return res.status(200).json({ message: "Password changed successfully" });

    } catch (error) {
        console.error("Password change error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

module.exports = { cashierLogin, cashierDeposit , cashierWithdrawal, cashierUserAccountInfo, cashierChangePassword };
