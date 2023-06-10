const request = require("supertest");
var cheerio = require("cheerio");
const db = require("../models/index");
const app = require("../app");

function extractCsrfToken(res) {
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

const login = async (agent, username, password) => {
  let res = await agent.get("/login");
  let csrfToken = extractCsrfToken(res);
  res = await agent.post("/session").send({
    email: username,
    password: password,
    _csrf: csrfToken,
  });
};

let server, agent;

describe("Sport Application", function () {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(4000, () => {});
    agent = request.agent(server);
  });

  afterAll(async () => {
    try {
      await db.sequelize.close();
      await server.close();
    } catch (error) {
      console.log(error);
    }
  });

  test("Signup for admin", async () => {
    let res = await agent.get("/signup");
    const csrfToken = extractCsrfToken(res);
    res = await agent.post("/users").send({
      firstName: "admin",
      lastName: "User",
      email: "admin@gmail.com",
      password: "12345678",
      role: "admin",
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });

  test("Signup for player", async () => {
    let res = await agent.get("/signup");
    const csrfToken = extractCsrfToken(res);
    res = await agent.post("/users").send({
      firstName: "player",
      lastName: "User",
      email: "player@gmail.com",
      password: "87654321",
      role: "player",
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });

  test("Sign out", async () => {
    let res = await agent.get("/adminpage");
    expect(res.statusCode).toBe(200);
    res = await agent.get("/signout");
    expect(res.statusCode).toBe(302);
    res = await agent.get("/adminpage");
    expect(res.statusCode).toBe(302);
  });

    test("Creating a Sport ", async () => {
      const agent = request.agent(server);
      await login(agent, "admin@gmail.com", "12345678");
      let res = await agent.get("/adminpage");
      res = await agent.get("/createSport");
      const csrfToken = extractCsrfToken(res);
      const response = await agent.post("/sports").send({
        name: "Cricket",
        _csrf: csrfToken,
      });
      expect(response.statusCode).toBe(302);
    });

    test("Edit a Sport", async () => {
      const agent = request.agent(server);
      await login(agent, "admin@gmail.com", "12345678");
      let res = await agent.get("/adminpage");
      res = await agent.get("/createSport");
      let csrfToken = extractCsrfToken(res);
      const response = await agent.post("/sports").send({
        name: "Cricket",
        _csrf: csrfToken,
      });

      const groupedSportsResponse = await agent
        .get("/adminpage")
        .set("Accept", "application/json");

      let parsedGroupedResponse = JSON.parse(groupedSportsResponse.text);
      const NoOfSports = parsedGroupedResponse.sportsList.length;
      const latestSport = parsedGroupedResponse.sportsList[NoOfSports - 1];

      res = await agent.get(`/sessionpage/${latestSport.id}`);
      res = await agent.get(`/editsport/${latestSport.id}`);
      csrfToken = extractCsrfToken(res);
      res = await agent.post(`/sport/${latestSport.id}`).send({
        name: "Football",
        _csrf: csrfToken,
      });
      const groupedSportsResponse1 = await agent
        .get(`/sessionpage/${latestSport.id}`)
        .set("Accept", "application/json");
        console.log("hello",groupedSportsResponse1.text);
      parsedGroupedResponse = JSON.parse(groupedSportsResponse1.text);
      const name = parsedGroupedResponse.sport.name;
      expect(name).toBe("Football");
    });

    test("Deleting a sport", async () => {
      const agent = request.agent(server);
      await login(agent, "admin@gmail.com", "12345678");
      let res = await agent.get("/adminpage");
      res = await agent.get("/createSport");
      let csrfToken = extractCsrfToken(res);
      const response = await agent.post("/sports").send({
        name: "Cricket",
        _csrf: csrfToken,
      });

      const groupedSportsResponse = await agent
        .get("/adminpage")
        .set("Accept", "application/json");

      const parsedGroupedResponse = JSON.parse(groupedSportsResponse.text);
      const NoOfSports = parsedGroupedResponse.sportsList.length;
      const latestSport = parsedGroupedResponse.sportsList[NoOfSports - 1];

      res = await agent.get(`/adminpage/${latestSport.id}`);
      csrfToken = extractCsrfToken(res);
      const DeletedResponse = await agent
        .delete(`/adminpage/${latestSport.id}`)
        .send({
          _csrf: csrfToken,
        });
      const parseRes = Boolean(DeletedResponse.text);
      expect(parseRes).toBe(true);
    });

    // test("Creating a Session", async () => {
    //   const agent = request.agent(server);
    //   await login(agent, "admin@gmail.com", "12345678");
    //   let res = await agent.get("/adminpage");
    //   res = await agent.get("/createSport");
    //   let csrfToken = extractCsrfToken(res);
    //   const response = await agent.post("/sports").send({
    //      name: "Cricket",
    //     _csrf: csrfToken,
    //   });
    //   const groupedSportsResponse = await agent
    //   .get("/adminpage")
    //   .set("Accept", "application/json");

    //   const parsedGroupedResponse = JSON.parse(groupedSportsResponse.text);
    //   const NoOfSports = parsedGroupedResponse.sportsList.length;
    //   const latestSport = parsedGroupedResponse.sportsList[NoOfSports - 1];

    //   res = await agent.get(`/sessionpage/${latestSport.id}`);
    //   res = await agent.get(`/createsession/${latestSport.id}`);
    //   console.log("latest sport ID",latestSport.id);
    //   csrfToken = extractCsrfToken(res);
    //   const response2 = await agent.post("/createsession").send({
    //     sportname: latestSport.id,
    //     time: new Date(),
    //     address: "Stadium",
    //     playernames: "Alan,Alex,Ben,John",
    //     playerscount: 10,
    //     sessioncreated:true,
    //     _csrf: csrfToken,
    //   });
    //   expect(response2.statusCode).toBe(302);
    // });

});
