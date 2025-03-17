### Bank Management System Database Schema

### Users Table

| Column          | Data Type        | Constraints                                    |
|----------------|----------------|-----------------------------------------------|
| `user_id`      | CHAR(36)        | Primary Key, UUID Default                     |
| `email`        | VARCHAR(255)    | Unique, Not Null                             |
| `password`     | VARCHAR(255)    | Not Null                                     |
| `account_number` | CHAR(12)       | Unique, Nullable                             |
| `full_name`    | VARCHAR(255)    | Not Null                                     |
| `phone_number` | VARCHAR(15)     | Not Null                                     |
| `balance`      | DECIMAL(10,2)   | Not Null, Default 0.0                        |
| `status`       | ENUM            | Not Null, Default 'pending' (Values: pending, blocked, active) |

### Managers Table

| Column         | Data Type        | Constraints                                    |
|---------------|----------------|-----------------------------------------------|
| `manager_id`  | CHAR(36)        | Primary Key, UUID Default                     |
| `email`       | VARCHAR(255)    | Unique, Not Null                             |
| `password`    | VARCHAR(255)    | Not Null                                     |
| `full_name`   | VARCHAR(255)    | Not Null                                     |

### Cashiers Table

| Column        | Data Type        | Constraints                                    |
|--------------|----------------|-----------------------------------------------|
| `cashier_id` | CHAR(36)        | Primary Key, UUID Default                     |
| `email`      | VARCHAR(255)    | Unique, Not Null                             |
| `password`   | VARCHAR(255)    | Not Null                                     |
| `full_name`  | VARCHAR(255)    | Not Null                                     |

### Transactions Table

| Column          | Data Type        | Constraints                                    |
|----------------|----------------|-----------------------------------------------|
| `transaction_id` | CHAR(36)        | Primary Key, UUID Default                     |
| `timestamp`    | DATETIME       | Not Null, Default CURRENT_TIMESTAMP                     |
| `account_number` | CHAR(12)       | Not Null, Foreign Key (users.account_number), Cascade Delete |
| `reference_account` | CHAR(12)       | Nullable, Foreign Key (users.account_number), Cascade Delete |
| `amount`       | DECIMAL(10,2)   | Not Null                                     |
| `type`         | ENUM            | Not Null (Values: deposit, withdrawal, transfer) |

### Otps Table

| Column     | Data Type      | Constraints                          |  
|------------|--------------|-------------------------------------|  
| `email`    | VARCHAR(255) | Not Null, Primary Key               |  
| `otp_code` | VARCHAR(255) | Not Null                            |  
| `expiry_time` | DATETIME   |  Not Null          | 

+ Made a MySQL event scheduler to delete expired OTPs
