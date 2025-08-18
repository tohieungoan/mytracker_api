module.exports = (sequelize, Sequelize) => {
  const Order = sequelize.define("order", {

    tracking_number: {
      type: Sequelize.STRING,
      unique: true 
    },
    carrier_name: {
      type: Sequelize.STRING
    },
    status: {
      type: Sequelize.STRING
    },
    note: {
      type: Sequelize.STRING
    },
    category: {
      type: Sequelize.STRING
    },
  });

  return Order;
};