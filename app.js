const express = require('express');
const app = express();
var cookieParser = require("cookie-parser");
var csrf = require("tiny-csrf");


app.use(cookieParser("ssh! some secret string"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));



//set ejs as view engine
app.set("view engine", "ejs");

app.get('/', (req, res) => {
    res.render("index");
})

app.get("/signup", async (request, response) => {
    response.render("signup", {
      title: "Signup",
      csrfToken: request.csrfToken(),
    });
  });

module.exports = app;