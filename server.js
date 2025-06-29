const express = require('express');
const port = process.env.PORT || 8000;

//utility to help with file paths
const path = require('path');

const app = express();



// Setup static folder
// Middleware - is a function that runs between the incoming request and outgoing response
app.use(express.static(path.join(__dirname, '.')));
 


app.listen(port, () => console.log(`server is running on port ${port}`));