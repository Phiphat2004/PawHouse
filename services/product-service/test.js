const express = require('express');
const app = express();

app.get('/test', (req, res) => {
  console.log('Received request');
  res.json({ message: 'OK' });
});

app.listen(5003, () => {
  console.log('Test server running on 5003');
});
