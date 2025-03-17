## Bank API

### Description

+ Devised backend APIs to streamline CRUD operations of banks.
+ Managed requests by setting up a Node JS backend server to communicate with the MySQL database holding 100+ users, ensuring efficient data management and retrieval.
+ Implemented JWT authentication, Role-based access control (RBAC), and Multi-factor authentication (MFA) for security.

### Routes

#### User Routes

```
POST /api/user/register       - Register a new user account  
POST /api/user/login          - Handle user login and send OTP via mail
POST /api/user/verifyOtp      - Verify OTP for authentication and receive JWT token 
POST /api/user/fundTransfer   - Transfer funds to another account  
GET  /api/user/transactionHistory - Get transaction history  
GET  /api/user/accountProfile - View account profile  
POST /api/user/updateProfile  - Update user profile
POST /api/user/sendOtp         - Send OTP for password reset via mail
POST /api/user/resetPassword   - Reset password using OTP  
```
#### Manager Routes

```
POST /api/manager/login                 - Manager login and receive JWT token 
POST /api/manager/createCashierAccount  - Create a new cashier account and send cashier password via mail
GET  /api/manager/users                 - Get all user details  
POST /api/manager/assignAccountNumber   - Assign account number to a user  
POST /api/manager/deleteUser            - Delete a user account  
POST /api/manager/blockUser             - Block a user account  
POST /api/manager/activateUser          - Activate a blocked user account  
```
#### Cashier Routes

```
POST /api/cashier/login             - Cashier login and receive JWT token 
POST /api/cashier/userAccountInfo   - Get user account information  
POST /api/cashier/deposit           - Deposit funds into a user's account  
POST /api/cashier/withdrawal        - Withdraw funds from a user's account  
```

### Installation

```sh
  git clone https://github.com/Kr1shnam00rth1/Bank-API
  cd Bank-API
  npm install package.json
  node app.js
```
+ Add an .env file in the Bank API directory to store key-value pairs for:
  
```
JWT_SECRET="Your secret"
SENDER_EMAIL="Your email address"
EMAIL_APP_PASSWORD="Your app password corresponding to your email"
DB_HOST="MySQL server host"
DB_USER="MySQL username"
DB_PASSWORD="MySQL password"
DB_NAME="Database name"
DB_PORT="MySQL server port"
```
