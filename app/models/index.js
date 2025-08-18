const configuration = require("../config/config-db.js");
const Sequelize = require("sequelize");

const sequelize = new Sequelize(
  configuration.DB,
  configuration.USER,
  configuration.PASSWORD, {
  host: configuration.HOST,
  dialect: configuration.dialect,
  pool: {
    max: configuration.pool.max,
    min: configuration.pool.min,
    acquire: configuration.pool.acquire,
    idle: configuration.pool.idle
  }
});

const database = {};
database.Sequelize = Sequelize;
database.sequelize = sequelize;

database.user = require("./user.js")(sequelize, Sequelize);
database.order = require("./order.js")(sequelize, Sequelize);

database.user.hasMany(database.order, { as: "orders" });
database.order.belongsTo(database.user, {
  foreignKey: "userId",
  as: "user",
});

module.exports = database;