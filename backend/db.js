const mysql = require("mysql2");

const db = mysql.createPool({
    host: "127.0.0.1",
    port: 3306,
    user: "root",
    password: "",
    database: "hospital_ecg",

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.getConnection((err, connection) => {

    if (err) {
        console.error("MySQL connection failed:");
        console.error(err.message);
        return;
    }

    console.log("MySQL connected successfully");

    connection.release();
});

module.exports = db;