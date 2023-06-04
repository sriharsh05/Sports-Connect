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

  //   test("Creating a Sport ", async () => {
  //     const agent = request.agent(server);
  //     await login(agent, "userA@gmail.com", "12345678");
  //     const res = await agent.get("/createSport");
  //     const csrfToken = extractCsrfToken(res);
  //     const response = await agent.post("/sports").send({
  //       name: "Cricket",
  //       _csrf: csrfToken,
  //     });
  //     expect(response.statusCode).toBe(302);
  //   });
});
