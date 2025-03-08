const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require('cors');
const cashierRouter = require("./router/cashierRouter"); 
const managerRouter = require("./router/managerRouter"); 
const userRouter = require("./router/userRouter"); 

const app = express();
const port = 5000;

app.use(express.json());
app.use(cookieParser());
app.use(cors());

app.use("/api/cashier", cashierRouter); 
app.use("/api/manager", managerRouter);
app.use("/api/user", userRouter);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
