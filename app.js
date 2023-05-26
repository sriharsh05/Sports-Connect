const express = require('express');
const app = express();

//set ejs as view engine
app.set("view engine", "ejs");

app.get('/', (req, res) => {
    res.render("index");
})

module.exports = app;