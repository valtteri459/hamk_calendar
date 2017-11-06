const express = require('express')
const path = require('path');

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

Database.connect().then(db => {
    app.get("/api/groupSchedule/:group", (req, res) => {

        fetcher.fetchReservationsOfGroup(db, req.params.group).then(reservations => {
            res.json(reservations);
        }).catch(err => {
            res.status(500).end("EWWOW");
        });

    });
    app.get("/api/resource/:resourceId", (req, res)=>{
        fetcher.getResource(db, req.params.resourceId).then(resource => {
            res.json(resource);
        }).catch(err => {
            res.status(500).end("error occured with resource gathering");
        })
    });


    app.get("/api/groups", function(req,res){
        db.query("SELECT * FROM existing_groups", function(err, rows, fields){
            var groups = [];
            for(var groupCount = 0;groupCount<rows.length;groupCount++){
                groups.push(rows[groupCount].name);
            }
            res.end(JSON.stringify(groups));
        });
    });


    app.get('/refresh', (req, res) => {
        updater.refreshCalendars(db);
        res.end("update done");
    });

    //update things once per day
    setInterval(function(){
        updater.refreshCalendars(db);
    },86400000);
});

app.listen(config.desired_port, () => console.log('App listening on port ' + config.desired_port))