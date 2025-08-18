module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define("user", {
    username: {
      type: Sequelize.STRING,
      unique: true 
    },
    email: {
      type: Sequelize.STRING,
      unique: true 
    },
    password: {
      type: Sequelize.STRING
    },
    methodLogin: {
      type: Sequelize.STRING,
    },
    imgAvatar: {
      type: Sequelize.STRING
    },
    refreshToken: { 
      type: Sequelize.STRING
    },
  });
  return User;
};
