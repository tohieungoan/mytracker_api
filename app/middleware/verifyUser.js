const database = require("../models");
const User = database.user;

/**
 * Middleware để kiểm tra username đã tồn tại hay chưa.
 */
checkExistingUsername = (req, res, next) => {
  // Chỉ kiểm tra khi đăng nhập bằng email
  if (req.body.methodLogin && req.body.methodLogin !== 'email') {
    next();
    return;
  }
  
  User.findOne({
    where: {
      username: req.body.username
    }
  })
  .then(user => {
    if (user) {
      res.status(400).send({
        message: "Username đã được sử dụng!"
      });
      return;
    }
    next();
  });
};

/**
 * Middleware để kiểm tra email đã tồn tại hay chưa.
 */
checkExistingEmail = (req, res, next) => {
  // Chỉ kiểm tra khi đăng nhập bằng email
  if (req.body.methodLogin && req.body.methodLogin !== 'email') {
    next();
    return;
  }

  User.findOne({
    where: {
      email: req.body.email
    }
  }).then(user => {
    if (user) {
      res.status(400).send({
        message: "Email đã được sử dụng!"
      });
      return;
    }
    next();
  });
};

const verifyUser = {
  checkExistingUsername: checkExistingUsername,
  checkExistingEmail: checkExistingEmail
};

module.exports = verifyUser;
