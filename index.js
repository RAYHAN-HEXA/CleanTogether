const express = require('express')
const app = express();
const cors = require('cors');
const port = process.env.PORT || 3000;

require("dotenv").config();
// middleware
app.use(cors());
app.use(express.json());

// MongoDB Server Connection

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
