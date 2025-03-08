const nodemailer = require("nodemailer");
require("dotenv").config();

// Function to send an email (Cashier Password or OTP)
async function sendMail(recipientEmail, subject, message) {
    try {
        let senderMail = process.env.SENDER_EMAIL;
        let passwd = process.env.EMAIL_APP_PASSWORD;
        let transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: senderMail,
                pass: passwd,
            },
        });

        let mailOptions = {
            from: senderMail,
            to: recipientEmail,
            subject: subject,
            text: message,
        };

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error("Error sending email: ", error);
    }
}

module.exports = sendMail;
