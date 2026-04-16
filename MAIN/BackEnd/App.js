const express = require('express');
const app = express();
const cors = require('cors');
app.use(cors());
const port = 3000;
const servicosRouter = require('./controler');
app.use(express.json());
app.use(servicosRouter);
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
