const { verifyUser } = require("../middleware");
const userServices = require("../services/user-services.js");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Authorization, Origin, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    next();
  });

  app.post("/api/v1/signup", 
    [verifyUser.checkExistingUsername, verifyUser.checkExistingEmail], 
    userServices.signup
  );
  app.post("/api/v1/signin", userServices.signin);

  app.get("/api/v1/user", userServices.getUserInfo);

  app.post("/api/v1/refresh-token", userServices.refreshAccessToken); 

};
