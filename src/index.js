import express from 'express';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import login from './routes/login.js'
import users from './routes/userprofile.js';
import accounts from './routes/bankaccount.js';
import transactions from './routes/transaction.js';
import fs from 'fs';
import swaggerUI from 'swagger-ui-express';


const app = express();
const port = 2000;
const swaggerJSON = JSON.parse(fs.readFileSync('./src/swagger.json', 'utf-8'));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// swagger
app.use('/docs', swaggerUI.serve, swaggerUI.setup(swaggerJSON));

//routes user
app.use('/api/v1/login', login);
app.use('/api/v1/users', users);
app.use('/api/v1/accounts', accounts);
app.use('/api/v1/transactions', transactions);


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
    console.log(`Swagger UI available at http://localhost:${port}/docs`);
});

export default app;