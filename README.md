Công nghệ sử dụng
Node.js

Express.js

PostgreSQL

Sequelize

JWT Auth

Cài đặt cơ sở dữ liệu
Cài đặt PostgreSQL: Nếu bạn chưa có, hãy cài đặt PostgreSQL trên hệ thống của mình.

Tạo người dùng và cơ sở dữ liệu: Mở terminal và thực hiện các lệnh sau để tạo người dùng và cơ sở dữ liệu cần thiết cho dự án.

psql postgres (để kết nối vào database mặc định)

CREATE ROLE postgresdb WITH LOGIN PASSWORD 'Yuhu123'; (tạo người dùng postgresdb với mật khẩu)

ALTER ROLE postgres CREATEDB; (cấp quyền tạo database cho người dùng mặc định)

\q hoặc exit (để thoát khỏi psql)

psql postgres -U postgresdb (kết nối lại với người dùng postgresdb)

CREATE DATABASE mytracker; (tạo cơ sở dữ liệu mới với tên mytracker)

Lưu ý: Các bảng sẽ được Sequelize tự động tạo khi ứng dụng chạy lần đầu.

API Documentation với Postman
Hướng dẫn chạy dự án
Cài đặt các gói phụ thuộc:
npm install

Chạy ứng dụng:
npm start
