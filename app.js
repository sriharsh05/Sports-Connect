const express = require('express');
const app = express();
var cookieParser = require("cookie-parser");
var csrf = require("tiny-csrf");


app.use(cookieParser("ssh! some secret string"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));



//set ejs as view engine
app.set("view engine", "ejs");



app.get("/", async (request, response) => {
  response.render("index", {
    title: "Sports Scheduler",
    csrfToken: request.csrfToken(),
  });
});

app.get("/signup", async (request, response) => {
    response.render("signup", {title: "Signup",csrfToken: request.csrfToken(),});
  });

  app.get("/login", (request, response) => {
    response.render("login", { title: "Login", csrfToken: request.csrfToken() });
  });

  // app.post("/users", async (request, response) => {
  //   response.render("admin", { title: "users", csrfToken: request.csrfToken() });
  // });

module.exports = app;