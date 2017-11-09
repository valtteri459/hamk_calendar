const express = require('express')
const path = require('path');
const http = require("https");

const config = require("./config")

const Database = require("./database")
const fetcher = require("./fetchData")
const updater = require("./updater")

const app = express()

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/www_files/index.html'));
});

app.use("/css", express.static(__dirname + "/www_files/css"));
app.use("/fonts", express.static(__dirname + "/www_files/fonts"));
app.use("/js", express.static(__dirname + "/www_files/js"));

Database.connect().then((databaseConnectionFactory) => {
    app.get("/api/groupSchedule/:group", (req, res) => {
        databaseConnectionFactory((dberr, db)=>{
            fetcher.fetchReservationsOfGroup(db, req.params.group).then(reservations => {
                res.json(reservations);
                db.destroy();
            }).catch(err => {
                res.status(500).end(err);
            });
        })

    });
    app.get("/api/resource/:resourceId", (req, res)=>{
        databaseConnectionFactory((dberr, db)=>{
            fetcher.getResource(db, req.params.resourceId).then(resource => {
                res.json(resource);
                db.destroy();
            }).catch(err => {
                res.status(500).end(err);
            })
        });
    });


    app.get("/api/groups", function(req,res){
        databaseConnectionFactory((dberr, db)=>{
            fetcher.getGroups(db).then(results => {
                res.end(JSON.stringify(results));
                db.destroy();
            }).catch(err =>{
                res.status(500).end(err);
            });
        });
    });


    app.get('/refresh', (req, res) => {
        databaseConnectionFactory((dberr, db)=>{
            updater.refreshCalendars(db).then(err =>{
                db.destroy();
            });
        });
        res.end("update done");
    });

    app.get("/api/amicaVi", (req, res)=>{
        http.get("https://www.amica.fi/modules/json/json/Index?costNumber=0831&language=fi", (resp)=>{
            var data = "";
            resp.on('data', (chunk) => {
                data += chunk;
            });
             
            // The whole response has been received. Print out the result.
            resp.on('end', () => {
                res.end(data);
            });
            resp.on("error", (err)=>{
                res.status(500).end("unable to request info from amica.fi");
            });
        });
    });

    //update things once per day
    setInterval(function(){
        databaseConnectionFactory((dberr, db)=>{
            updater.refreshCalendars(db).then(err =>{
                db.destroy();
            });
        });
    },86400000);
});

app.listen(config.desired_port, () => console.log('App listening on port ' + config.desired_port))