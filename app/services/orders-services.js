const db = require("../models");
const Order = db.order;
const Op = db.Sequelize.Op;
const userServices = require("./user-services");
const axios = require('axios');
const API_KEY = "493393B56F8C1A4A979C3D77E41496EB";

/**
 * Lấy thông tin theo dõi từ API 17track.
 *
 * @param {Array|Object} trackingData - Một mảng hoặc một đối tượng chứa thông tin theo dõi.
 * @param {string} trackingData.number - Mã vận đơn.
 * @param {string|number} trackingData.carrier - Mã nhà vận chuyển.
 * @returns {Promise<Object>} Dữ liệu theo dõi từ API.
 */
async function getTrackingInfo(trackingData) {
  try {
    const dataToSend = Array.isArray(trackingData) ? trackingData : [trackingData];
    const formattedData = dataToSend.map(item => ({
      number: item.number,
      carrier: parseInt(item.carrier)
    }));
    
    const options = {
      method: 'POST',
      url: 'https://api.17track.net/track/v2.4/gettrackinfo',
      headers: {
        'content-type': 'application/json',
        '17token': API_KEY
      },
      data: JSON.stringify(formattedData)
    };

    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    console.error("Lỗi khi gọi API 17TRACK: ", error.message);
    if (error.response) {
      console.error("Thông tin lỗi từ API:", error.response.data);
    }
    throw error;
  }
}

async function changecarrier(trackingNumber, carrierold, carriernew) {
  try {
    const options = {
      method: 'POST',
      url: 'https://api.17track.net/track/v2.4/changecarrier',
      headers: {
        'content-type': 'application/json',
        '17token': API_KEY
      },
      data: JSON.stringify([
        {
          number: trackingNumber,
          carrier_old: parseInt(carrierold),
          carrier_new: parseInt(carriernew)
        }
      ])
    };

    const response = await axios(options);
    return response.data;

  } catch (error) {
    console.error('Error changing carrier:', error);
    throw error;
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
      userId: userId,
      carrier_code: req.body.carrier_code
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

exports.findAll = async (req, res) => {
  try {
    const userId = req.userId;
    const orders = await Order.findAll({ where: { userId: userId } });

    const trackingData = orders.map(order => ({
      number: order.tracking_number,
      carrier: order.carrier_code
    }));
    
    const trackingInfo = await getTrackingInfo(trackingData);

    const combinedData = orders.map(order => {
      const info = trackingInfo.data.accepted.find(item => item.number === order.tracking_number);
      return {
        ...order.toJSON(),
        tracking_info: info || null
      };
    });

    res.status(200).send(combinedData);
  } catch (err) {
    res.status(500).send({
      message: err.message || "Đã xảy ra lỗi khi lấy tất cả đơn hàng!"
    });
  }
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
    const carrier = req.body.carrier_code;
    
    const orderFromDb = await Order.findOne({
      where: {
        tracking_number: trackingNumber,
        carrier_code: carrier,
        userId: userId
      }
    });

    if (!orderFromDb) {
      return res.status(404).send({
        message: "Không tìm thấy đơn hàng!"
      });
    }

    const trackingInfo = await getTrackingInfo({ number: trackingNumber, carrier: carrier });
    
    const combinedData = {
      ...orderFromDb.toJSON(), 
      tracking_info: trackingInfo.data.accepted[0] || null
    };

    res.status(200).send(combinedData);

  } catch (err) {
    res.status(500).send({
      message: err.message || "Đã xảy ra lỗi khi lấy đơn hàng!"
    });
  }
};

exports.update = async (req, res) => {
  const id = req.body.id;
  const userId = req.userId;

  if (!id) {
    return res.status(400).send({
      message: "ID không được để trống!"
    });
  }

  try {
    const order = await Order.findOne({ where: { id: id, userId: userId } });
    if (!order) {
      return res.status(404).send({ message: "Không tìm thấy đơn hàng!" });
    }

    let carrierChangeResult = null;
    if (req.body.carrier_code && req.body.carrier_code.toString() !== order.carrier_code.toString()) {
      carrierChangeResult = await changecarrier(order.tracking_number, order.carrier_code, req.body.carrier_code);
    }

    const [num] = await Order.update(req.body, { where: { id: id, userId: userId } });
    
    let responseMessage = "Đơn hàng đã được cập nhật thành công.";
    if (carrierChangeResult) {
        responseMessage += " Đã cập nhật nhà vận chuyển trên 17TRACK. Kết quả: " + JSON.stringify(carrierChangeResult);
    }

    if (num === 1) {
      res.send({ message: responseMessage });
    } else {
      res.send({ message: "Cập nhật thất bại. Đơn hàng có thể không tồn tại hoặc bạn không có quyền!" });
    }
  } catch (err) {
    console.error("Error updating order:", err);
    res.status(500).send({ message: "Đã xảy ra lỗi khi cập nhật đơn hàng với ID: " + id });
  }
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
