// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');


const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || '*' }));
app.use(morgan('dev'));
app.use(express.json());


//Fetching routes
const authRouter = require('./routes/auth');
const accountsRouter = require('./routes/accounts');
const transactionsRouter = require('./routes/transactions');
const budgetsRouter = require("./routes/budgets");
const subscriptionsRouter = require("./routes/subscriptions");
const investmentsRouter = require("./routes/investments");
const lentRouter = require("./routes/lent");
const emisRouter = require("./routes/emis");
const prepaymentsRouter = require("./routes/prepayments");
const transactionAppRouter = require('./routes/transactions.app');


// mount routers
app.use('/api/auth', authRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/transactions',transactionsRouter);
app.use("/api/budgets", budgetsRouter);
app.use("/api/subscriptions", subscriptionsRouter);
app.use("/api/investments", investmentsRouter);
app.use("/api/lent", lentRouter);
app.use("/api/emis", emisRouter);
app.use("/api/emis/:emiId/prepayments", prepaymentsRouter);

app.use('/api/transactionApp', transactionAppRouter);



app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
