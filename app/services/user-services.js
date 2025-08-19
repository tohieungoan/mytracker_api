const database = require("../models");
const configuration = require("../config/config-jwt.js");
const User = database.user;

var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");

const verifyToken = (req, res, next) => {
  let token = req.headers["x-access-token"];

  if (!token) {
    return res.status(403).send({ message: "!" });
  }

  jwt.verify(token, configuration.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Không được ủy quyền!" });
    }
    req.userId = decoded.id; 
    next();
  });
};

exports.signup = (req, res) => {
  const user = {
    username: req.body.username,
    email: req.body.email,
    password: req.body.password,
    methodLogin: req.body.methodLogin || 'email',
    imgAvatar: req.body.imgAvatar,
  };

  if (user.methodLogin === 'email') {
    if (typeof user.password === 'string' && user.password.length > 0) {
      user.password = bcrypt.hashSync(user.password, 8);
    } else {
      return res.status(400).send({ message: "Mật khẩu không được để trống." });
    }
  } else {
    user.password = null;
  }

  User.create(user)
    .then((data) => {
      res.status(201).send(data);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Đã xảy ra lỗi khi tạo người dùng.",
      });
    });
};

exports.signin = (req, res) => {
  validateRequest(req, res);

  User.findOne({
    where: {
      username: req.body.username
    }
  })
    .then(user => {
      if (!user) {
        return res.status(404).send({
          message: "Người dùng không tồn tại."
        });
      }

      if (user.methodLogin === 'email') {
        const passwordIsValid = bcrypt.compareSync(req.body.password, user.password);
        if (!passwordIsValid) {
          return res.status(401).send({
            accessToken: null,
            message: "Mật khẩu không hợp lệ!"
          });
        }
      } else if (user.methodLogin !== 'google') {
        return res.status(401).send({
          message: `Tài khoản này được đăng ký bằng ${user.methodLogin}. Vui lòng đăng nhập bằng phương thức đó.`
        });
      }

      const accessToken = jwt.sign({ id: user.id }, configuration.secret, {
        expiresIn: 86400
      });

      const refreshToken = jwt.sign({ id: user.id }, configuration.secret, {
        expiresIn: "7d"
      });

      user.update({ refreshToken: refreshToken })
        .then(() => {
          res.status(200).send({
            id: user.id,
            username: user.username,
            email: user.email,
            accessToken: accessToken,
            refreshToken: refreshToken,
            message: "Đăng nhập thành công!"
          });
        })
        .catch(err => {
          res.status(500).send({
            message: err.message || "Đã xảy ra lỗi khi lưu refresh token."
          });
        });
    })
    .catch(err => {
      res.status(500).send({ message: err.message });
    });
};

exports.refreshToken = (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(403).send({ message: "Refresh Token không được cung cấp!" });
  }

  User.findOne({ where: { refreshToken: refreshToken } })
    .then(user => {
      if (!user) {
        return res.status(403).send({ message: "Refresh token không hợp lệ!" });
      }

      const newAccessToken = jwt.sign({ id: user.id }, configuration.secret, {
        expiresIn: 86400
      });

      res.status(200).send({
        accessToken: newAccessToken
      });
    })
    .catch(err => {
      res.status(500).send({ message: err.message });
    });
};

exports.getUserInfo = [verifyToken, (req, res) => {
  User.findByPk(req.userId)
    .then(user => {
      if (!user) {
        return res.status(404).send({ message: "Người dùng không tồn tại." });
      }

      res.status(200).send({
        id: user.id,
        username: user.username,
        email: user.email,
        imgAvatar: user.imgAvatar,
        methodLogin: user.methodLogin
      });
    })
    .catch(err => {
      res.status(500).send({ message: err.message });
    });
}];

exports.refreshAccessToken = (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(403).send({ message: "Refresh Token không được cung cấp!" });
  }

  User.findOne({ where: { refreshToken: refreshToken } })
    .then(user => {
      if (!user) {
        return res.status(403).send({ message: "Refresh token không hợp lệ!" });
      }

      const newAccessToken = jwt.sign({ id: user.id }, configuration.secret, {
        expiresIn: 86400
      });

      res.status(200).send({
        accessToken: newAccessToken
      });
    })
    .catch(err => {
      res.status(500).send({ message: err.message });
    });
};

function validateRequest(req, res) {
  if (!req.body || Object.keys(req.body).length === 0) {
    res.status(400).send({
      message: "Yêu cầu không được để trống!"
    });
    return;
  }
}
