const mysql = require("mysql")

const config = require("./config")

function connect() {
    return new Promise((fulfill, reject) => {
        var conn = mysql.createConnection({
            host: config.mysql_host,
            user: config.mysql_user,
            password: config.mysql_pass,
            database: config.mysql_db
        });

        conn.connect(err => {
            if(err) return reject(err);
            fulfill(conn);
        });

        conn.on("error", err => {
            if (err.code === 'PROTOCOL_CONNECTION_LOST') {
                console.log("Connection lost, retrying ...")
                conn = mysql.createConnection({
                    host: config.mysql_host,
                    user: config.mysql_user,
                    password: config.mysql_pass,
                    database: config.mysql_db
                });
            } else {
                throw err;
            }
        });
    });
}

module.exports = {
    connect,
}