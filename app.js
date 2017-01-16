const express = require('express');
var app = express();
const fs = require('fs');

// app.use(express.static('html'));

app.get("/", function(req, res) {
    fs.readFile("./html/index.html", "utf8", (err, data) => {
       if (err) {
           res.sendStatus(404);
           res.end();
       };
       
       res.send(data);
       
    });
});

app.get("/url/:parm", function(req, res) {
    console.log(`Incoming URL parameter is ${req.params.parm}`);
    res.end();
});

app.listen(process.env.PORT || 8080);
console.log("Server is running");