const { jwtAuth } = require("../middleware");
const ordersServices = require("../services/orders-services.js");

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Headers", "Authorization, Origin, Content-Type, Accept");
    next();
  });

  app.post("/api/auth/add-order", [jwtAuth.verifyToken], ordersServices.create);

  app.get("/api/auth/get-orders", [jwtAuth.verifyToken], ordersServices.findAll);

  app.post("/api/auth/get-order-by-trackingnumber", [jwtAuth.verifyToken], ordersServices.findOne);

  app.post("/api/auth/update-order", [jwtAuth.verifyToken], ordersServices.update);

  app.post("/api/auth/delete-order", [jwtAuth.verifyToken], ordersServices.delete);
};
