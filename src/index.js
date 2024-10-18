const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');

const app = express();
const port = 2000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//routes user
app.use('/api/v1/users', require('./routes/user'));
app.use('/api/v1/accounts', require('./routes/bankaccount'));
app.use('/api/v1/transactions', require('./routes/transaction'));

//error 
app.use((err, req, res, next) => {
    console.error('Error:', err);
  
    if (err.message.includes('validation')) {
      return res.status(400).json({ error: err.message });
    } else if (err.message.includes('Duplicate entry')) {
      return res.status(409).json({ error: err.message });
    } else {
      res.status(500).json({ error: 'Terjadi kesalahan pada server' });
    }
    res.status(500).json({
        message: 'Internal server error',
    });
});


app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});