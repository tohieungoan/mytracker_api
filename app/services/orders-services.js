const db = require("../models");
const Order = db.order;
const Op = db.Sequelize.Op;
const userServices = require("./user-services");
const axios = require('axios');
const API_KEY = "493393B56F8C1A4A979C3D77E41496EB"; 

async function getTrackingInfo(trackingNumber) {
  try {
    const options = {
      method: 'POST',
      url: 'https://api.17track.net/track/v2.4/gettrackinfo',
      headers: {
        'content-type': 'application/json',
        '17token': API_KEY
      },
      data: JSON.stringify([{
        "number": trackingNumber,
        "carrier": 100538
      }])
    };
    
    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    console.error("Lỗi khi gọi API 17TRACK: ", error.message);
    return null;
  }
}
exports.create = async (req, res) => {
  if (!req.body.tracking_number) {
    return res.status(400).send({
      message: "Mã vận đơn không được để trống!"
    });
  }

  try {
    const userId = req.userId;

    const existingOrder = await Order.findOne({
      where: {
        tracking_number: req.body.tracking_number,
        userId: userId
      }
    });

    if (existingOrder) {
      return res.status(409).send({
      message: "Đơn hàng với mã vận đơn này đã tồn tại!"
    });
    }

    const order = {
      tracking_number: req.body.tracking_number,
      carrier_name: req.body.carrier_name,
      status: req.body.status,
      note: req.body.note,
      category: req.body.category,
      userId: userId
    };

    const data = await Order.create(order);

    const registerOptions = {
      method: 'POST',
      url: 'https://api.17track.net/track/v2.4/register',
      headers: {
        '17token': API_KEY,
        'Content-Type': 'application/json'
      },
      data: JSON.stringify([{ "number": req.body.tracking_number }])
    };

    axios.request(registerOptions)
      .then(registerResponse => {
        if (registerResponse.status === 200) {
          console.log("Đăng ký thành công với 17TRACK!");
        } else {
          console.error("Lỗi khi đăng ký với 17TRACK:", registerResponse.data);
        }
      }).catch(error => {
        console.error("Lỗi khi đăng ký với 17TRACK:", error.message);
      });

    res.status(201).send(data);

  } catch (err) {
    res.status(500).send({
      message: err.message || "Đã xảy ra lỗi khi thêm đơn hàng!"
    });
  }
};
exports.findAll = (req, res) => {
  const userId = req.userId;
  Order.findAll({ where: { userId: userId } })
    .then(data => {
      res.send(data);
    })
    .catch(err => {
      res.status(500).send({
        message: err.message || "Đã xảy ra lỗi khi lấy tất cả đơn hàng!"
      });
    });
};

exports.findOne = async (req, res) => {
  if (!req.body.tracking_number) {
    res.status(400).send({
      message: "Mã vận đơn không được để trống!"
    });
    return;
  }
  
  try {
    const userId = req.userId;
    const trackingNumber = req.body.tracking_number;
    
    const orderFromDb = await Order.findOne({
      where: {
        tracking_number: trackingNumber,
        userId: userId
      }
    });

    if (!orderFromDb) {
      return res.status(404).send({
        message: "Không tìm thấy đơn hàng!"
      });
    }

    const trackingInfo = await getTrackingInfo(trackingNumber);
    
    const combinedData = {
      ...orderFromDb.toJSON(), 
      tracking_info: trackingInfo 
    };

    res.status(200).send(combinedData);

  } catch (err) {
    res.status(500).send({
      message: err.message || "Đã xảy ra lỗi khi lấy đơn hàng!"
    });
  }
};

exports.update = (req, res) => {
  const id = req.body.id;
  const userId = req.userId;

  if (!id) {
    res.status(400).send({
      message: "ID không được để trống!"
    });
    return;
  }

  Order.update(req.body, {
    where: {
      id: id,
      userId: userId
    }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "Đơn hàng đã được cập nhật thành công."
        });
      } else {
        res.send({
          message: "Cập nhật thất bại. Đơn hàng có thể không tồn tại hoặc bạn không có quyền!"
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Đã xảy ra lỗi khi cập nhật đơn hàng với ID: " + id
      });
    });
};

exports.delete = (req, res) => {
  const id = req.body.id;
  const userId = req.userId;
  
  if (!id) {
    res.status(400).send({
      message: "ID không được để trống!"
    });
    return;
  }

  Order.destroy({
    where: {
      id: id,
      userId: userId
    }
  })
    .then(num => {
      if (num == 1) {
        res.send({
          message: "Đơn hàng đã được xóa thành công."
        });
      } else {
        res.send({
          message: "Xóa thất bại. Đơn hàng có thể không tồn tại hoặc bạn không có quyền!"
        });
      }
    })
    .catch(err => {
      res.status(500).send({
        message: "Không thể xóa đơn hàng với ID: " + id
      });
    });
};
