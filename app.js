require('dotenv').config();
require('./db');

const express = require('express');
const app = express();

const { isAuthenticated } = require("./middleware/jwt.middleware");

//middleware
require('./config')(app);

const userRouter = require('./routes/user.routes');
app.use('/api', isAuthenticated, userRouter);

const groupRouter = require('./routes/group.routes');
app.use('/api', isAuthenticated, groupRouter);

const expenseRouter = require('./routes/expense.routes');
app.use('/api', isAuthenticated, expenseRouter);

const transactionRouter = require('./routes/transaction.routes');
app.use('/api', isAuthenticated, transactionRouter);

const authRouter = require("./routes/auth.routes");
app.use("/auth", authRouter);

require('./error-handling')(app);

module.exports = app;
