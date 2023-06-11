/* eslint-disable no-unused-vars */
const express = require("express");
const app = express()
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
var csrf = require("tiny-csrf");
const path = require("path");

const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const flash = require("connect-flash");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");

const saltRounds = 10;

app.use(cookieParser("ssh! some secret string"));
app.use(
  session({
    secret: "my-super-secret-key-7643643789328",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      User.findOne({ where: { email: username } })
        .then(async function (user) {
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Invalid password" });
          }
        })
        .catch((error) => {
          return done(error);
        });
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serializing user in session", user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});

const { User, Sport, Session, Usersession } = require("./models");

//set ejs as view engine
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "views"));

app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});

// Defining the routes

app.get("/", async (request, response) => {
  response.render("index", {
    title: "Sports Scheduler",
    csrfToken: request.csrfToken(),
  });
});

app.get("/signup", async (request, response) => {
  response.render("signup", {
    title: "Signup",
    csrfToken: request.csrfToken(),
  });
});

app.get("/login", (request, response) => {
  response.render("login", { title: "Login", csrfToken: request.csrfToken() });
});

app.get("/signout", (request, response, next) => {
  request.logout((err) => {
    if (err) {
      return next(err);
    }
    response.redirect("/");
  });
});

app.post("/users", async (request, response) => {
  if (request.body.firstName.length == 0) {
    request.flash("error", "Please, Fill the First name!");
    return response.redirect("/signup");
  }
  if (request.body.email.length == 0) {
    request.flash("error", "Please, Fill the E-Mail!");
    return response.redirect("/signup");
  }
  if (request.body.password.length == 0) {
    request.flash("error", "Please, Fill the Password!");
    return response.redirect("/signup");
  }
  const hashedPwd = await bcrypt.hash(request.body.password, saltRounds);
  //Creating a user
  try {
    const user = await User.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashedPwd,
      role: "player",
    });
    request.login(user, (err) => {
      if (err) {
        console.log(err);
        res.redirect("/signup");
      } else {
        request.flash("success", "Sign up successful");
        response.redirect("/playerhome");
      }
    });
  } catch (error) {
    console.log(error);
    request.flash("error", "User already Exists");
    return response.redirect("/signup");
  }
});

app.post(
  "/session",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  function (request, response) {
    console.log(request.user);
    if (request.user.role === "admin") {
      response.redirect("/adminpage");
    } else {
      response.redirect("/playerhome");
    }
  }
);

//initial routes

app.get(
  "/playerhome",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const loggedInUser = request.user.id;
    const UserName = request.user.firstName;
    const sportsList = await Sport.getAllSports(loggedInUser);
    const joinedsessions = await Usersession.getJoinedSessions({userId:loggedInUser});
    const sessions = new Array(joinedsessions.length);
    const joinedsports =  new Array(joinedsessions.length);
    for (let i = 0;i<joinedsessions.length;i++) {
      sessions[i] = await Session.findSessionById(joinedsessions[i].sessionId); 
      const sportId = sessions[i].sportname;
      joinedsports[i] = await Sport.findSportById(sportId,loggedInUser)
    }
    if (request.accepts("html")) {
      response.render("playerhome", {
        UserName,
        sportsList,
        sessions,
        joinedsports,
        csrfToken: request.csrfToken(),
      });
    } else {
      response.json({ UserName, csrfToken: request.csrfToken() });
    }
  }
);

app.get(
  "/adminpage",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const loggedInUser = request.user.id;
    const UserName = request.user.firstName;
    const sportsList = await Sport.getAllSports(loggedInUser);
    const userdetils = await User.getUserDetails(loggedInUser);
    const joinedsessions = await Usersession.getJoinedSessions({userId:loggedInUser});
    const sessions = new Array(joinedsessions.length);
    const joinedsports =  new Array(joinedsessions.length);
    for (let i = 0;i<joinedsessions.length;i++) {
      sessions[i] = await Session.findSessionById(joinedsessions[i].sessionId); 
      const sportId = sessions[i].sportname;
      joinedsports[i] = await Sport.findSportById(sportId,loggedInUser)
    }
    if (request.accepts("html")) {
    response.render("adminpage", {
      UserName,
      sportsList,
      userdetils,
      sessions,
      joinedsports,
      csrfToken: request.csrfToken(),
    });
  }else {
    response.json({
      UserName,
      sportsList,
      userdetils,
      sessions,
      joinedsports,
    });
  }
  }
);

// Creating sports
app.get(
  "/createSport",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const UserName = request.user.firstName;
    response.render("createSport", {
      UserName,
      csrfToken: request.csrfToken(),
    });
  }
);

app.post(
  "/sports",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (request.body.name.length == 0) {
      request.flash("error", "Please, Fill the sport!");
      return response.redirect("/createSport");
    }
    try {
      const enteredSport = request.body.name;
      const sportsList = await Sport.getAllSports();
      for (const sport of sportsList) {
        if (sport.name == enteredSport) {
          request.flash("error", "Sport already exists!");
          return response.redirect("/createSport");
        }
      }
      await Sport.addSport({
        name: request.body.name,
        userId: request.user.id,
      });
      return response.redirect("/adminpage");
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.get(
  "/editsport/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response, next) => {
    const sport = await Sport.findSportById(request.params.id);
    try {
      response.render("editsport", {
        sport,
        csrfToken: request.csrfToken(),
      });
    } catch (error) {
      console.log(error);
    }
  }
);

app.post(
  "/sport/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const sport = await Sport.findSportById(request.params.id);
    if (request.body.name.length == 0) {
      request.flash("error", "Please, Fill the sport!");
      return response.redirect(`/editsport/${request.params.id}`);
    }
    try {
      await Sport.updateSport(request.body.name, sport.id);
      return response.redirect(`/sessionpage/${request.params.id}`);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.delete(
  "/sports/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      console.log("in delete 0");
      await Usersession.removeSport({sportId:request.params.id});
      console.log("in delete 1");
      await Session.removeSport({sportId:request.params.id});
      console.log("in delete 2");
      await Sport.remove(request.params.id);
      console.log("in delete 3");
      return response.json({ success: true });
    } catch (error) {
      return response.status(422).json(error);
    }
  }
);

// Creating Sessions

app.get(
  "/createsession/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const userdetils = await User.getUserDetails(request.user.id);
    const sport = await Sport.findSportById(request.params.id);
    if (request.accepts("HTML")) {
      response.render("createsession", {
        sport,
        userdetils,
        csrfToken: request.csrfToken(),
      });
    } else {
      response.json({
        sportId: request.params.id,
        userdetils,
        csrfToken: request.csrfToken(),
      });
    }
  }
);

app.post(
  "/createsession",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const players = request.body.playernames.split(",");
    const sport = await Sport.findSportById(request.body.sportId);
    if (request.body.dateTime === "") {
      request.flash("error", "Date should not be empty.");
      return response.redirect(`/createsession/${sport.id}`);
    }
    if (request.body.address.length == 0) {
      request.flash("error", "Address should not be empty.");
      return response.redirect(`/createsession/${sport.id}`);
    }
    if (request.body.playernames.length == 0) {
      request.flash("error", "players cannot be empty");
      return response.redirect(`/createsession/${sport.id}`);
    }
    if (request.body.playersLimit < 2 ) {
      request.flash("error", "Atleast 2 players must be specified");
      return response.redirect(`/createsession/${sport.id}`);
    }
    if (players.length > request.body.playersLimit) {
      request.flash("error", "Number of PLayers exceeded the limit!");
      response.redirect(`/createsession/${sport.id}`);
    }
    try {
        const session = await Session.createSession({
          sportname: sport.id,
          time: request.body.dateTime,
          address: request.body.address,
          playernames: players,
          playerscount: request.body.playersLimit,
          sessioncreated: true,
          userId: request.user.id,
        });
        await Usersession.addUserSession({
          username: request.user.firstName ,
          userId: request.user.id,
          sessionId: session.id,
          sportId: sport.id,
        });
        for (let i = 0; i < players.length; i++) {
          await Usersession.addUserSession({
            username: players[i],
            sessionId: session.id,
            sportId: sport.id,
          });
        }
        response.redirect(`/createdsession/${session.id}`);
    } catch (error) {
      console.log(error);
    }
  }
);

app.get(
  "/sessionpage/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const sport = await Sport.findSportById(
      request.params.id,
      request.user.id
    );
    const sessions = await Session.findSessionsBySportId({
      sportid:sport.id,
      userId:request.user.id,
     });
     const players = new Array(sessions.length);
     for(let i=0;i<sessions.length;i++) {
        players[i] = (await Usersession.getPlayers({sessionId:sessions[i].id})).length;
     }
    const userdetils = await User.getUserDetails(request.user.id);
    if (request.accepts("html")) {
    response.render("sessionpage", {
      userdetils,
      sport,
      sessions,
      players,
      csrfToken: request.csrfToken(),
    });
  }
  else{
    response.json( {
      userdetils,
      sport,
      sessions,
      players,
    });
  }
  }
);


app.get(
  "/previoussessions/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const sport = await Sport.findSportById(
      request.params.id,
      request.user.id
    );
    const sessions = await Session.findPrevSessionsBySportId({
      sportid:sport.id,
      userId:request.user.id,
     });
     const players = new Array(sessions.length);
     for(let i=0;i<sessions.length;i++) {
        players[i] = (await Usersession.getPlayers({sessionId:sessions[i].id})).length;
     }
    const userdetils = await User.getUserDetails(request.user.id);
    if (request.accepts("HTML")) {
    response.render("previoussessions", {
      userdetils,
      sport,
      sessions,
      players,
      csrfToken: request.csrfToken(),
    });
  }else{
    response.json({
      userdetils,
      sport,
      sessions,
      players,
    })
  }
  }
);

app.get(
  "/createdsession/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const session = await Session.findSessionById(request.params.id);
    const sport = await Sport.findSportById(session.sportname);
    const userdetils = await User.getUserDetails(request.user.id);
    const players = await Usersession.getPlayers({sessionId:request.params.id})
    response.render("createdsession", {
      userdetils,
      session,
      sport,
      players,
      csrfToken: request.csrfToken(),
    });
  }
);

app.delete(
  "/player/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      await Usersession.remove(request.params.id);
      return response.json({ success: true });
    } catch (error) {
      return response.status(422).json(error);
    }
  }
);

app.post(
  "/joinsession/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const session = await Session.findSessionById(request.params.id);
      const sport = await Sport.findSportById(session.sportname);
      await Usersession.addUserSession({
        username: request.user.firstName ,
        userId: request.user.id,
        sessionId: request.params.id,
        sportId: sport.id,
      });
      return response.redirect(
        `/createdsession/${request.params.id}`
      );
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.post(
  "/leavesession/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      await Usersession.removeUserSession({
        userId: request.user.id,
        sessionId: request.params.id,
      });
      return response.redirect(
        `/createdsession/${request.params.id}`
      );
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);


app.get(
  "/createdsession/editSession/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const session = await Session.findSessionById(request.params.id);
    const sport = await Sport.findSportById(session.sportname);
    try {
      response.render("editSession", {
        session,
        sport,
        csrfToken: request.csrfToken(),
      });
    } catch (error) {
      console.log(error);
    }
  }
);

app.post(
  "/editsession/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const players = request.body.playernames.split(",");
    const sport = await Sport.findSportById(request.body.sportId);
    const availablePlayers = await Usersession.getPlayers({sessionId:request.params.id});
    if (request.body.dateTime === "") {
      request.flash("error", "Date should not be empty.");
      return response.redirect(`/createdsession/editsession/${request.params.id}`);
    }
    if (request.body.address.length == 0) {
      request.flash("error", "Address should not be empty.");
      return response.redirect(`/createdsession/editsession/${request.params.id}`);
    }
    if (request.body.playersLimit < availablePlayers.length + players.length ) {
      request.flash("error", "Players exceed limit ");
      return response.redirect(`/createdsession/editsession/${request.params.id}`);
    }
    if (request.body.playersLimit < 2 ) {
      request.flash("error", "Atleast 2 players must be specified");
      return response.redirect(`/createdsession/editsession/${request.params.id}`);
    }
    try {
        const session = Session.findSessionById(request.params.id);
        await Session.updateSession({
          sportname: sport.id,
          time: request.body.dateTime,
          address: request.body.address,
          playernames: players,
          playerscount: request.body.playersLimit,
          sessionid: request.params.id
        });
        for (let i = 0; i < players.length; i++) {
          if(players[i]!== ""){
          await Usersession.addUserSession({
            username: players[i],
            sessionId: request.params.id,
            sportId:sport.id,
          });
        }
        }
        response.redirect(`/sessionpage/${sport.id}`);
    } catch (error) {
      console.log(error);
    }
  }
);

app.get(
  "/createdsession/cancelsession/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const session = await Session.findSessionById(request.params.id);
    const sport = await Sport.findSportById(session.sportname);
    try {
      response.render("cancelsession", {
        sport,
        session,
        csrfToken: request.csrfToken(),
      });
    } catch (error) {
      console.log(error);
    }
  }
);

app.post(
  "/cancelsession/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    if (request.body.reason.length == 0) {
      request.flash("error", "Reason should not be empty.");
      return response.redirect(`/createdsession/cancelsession/${id}`);
    }
    try {
      const session = await Session.findSessionById(request.params.id);
      await Session.cancelSession({
        sessionid: request.params.id,
        sessioncreated: false,
        reason: request.body.reason,
      });
      return response.redirect(`/sessionpage/${session.sportname}`);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.get(
  "/reports",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
  const sports = await Sport.findAll();
  const sessionStats = {};
  for (let i = 0; i < sports.length; i++) {
    const sportId = sports[i].id;
    
    sessionStats[sportId] = {
      sessionsFuture: (await Session.findFutureSessionsBySportId({ sportid: sportId })).length,
      sessionsPast: (await Session.findPastSessionsBySportId({ sportid: sportId })).length,
      sessionsCanceled: (await Session.findCanceledSessionsBySportId({ sportid: sportId })).length,
      totalPlayers: (await Usersession.findPlayersBySportId({ sportid: sportId })).length
    };
  }
    try {
      response.render("reports", {
        sessionStats,
        sports,
        csrfToken: request.csrfToken(),
      });
    } catch (error) {
      console.log(error);
    }
  }
);


module.exports = app;
