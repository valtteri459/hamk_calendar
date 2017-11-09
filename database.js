const mysql = require("mysql")

const config = require("./config")

function connect() {
    return new Promise((fulfill, reject) => {

        var conn = mysql.createPool({
            host: config.mysql_host,
            user: config.mysql_user,
            password: config.mysql_pass,
            database: config.mysql_db
        });
            
        var databaseConMaker = function(cb){
            return conn.getConnection(cb);
        }
        fulfill(databaseConMaker);

        conn.on("error", err => {
            if (err.code === 'PROTOCOL_CONNECTION_LOST') {
                console.log("Connection lost, retrying ...")
                conn = mysql.createPool({
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