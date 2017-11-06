const http = require("https")

function refreshCalendars(db) {
    console.log("fetching new reservation schedules from HAMK API");
    var time = new Date();
    time.setDate(time.getDate() - 10);
    var endTime = new Date();
    endTime.setMonth(endTime.getMonth() + 1);
    var endTimeString = endTime.toISOString();
    var timeString = time.toISOString();
    var options = {
        host: 'opendata.hamk.fi',
        port: 8443,
        path: '/r1/reservation/search',
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            'Authorization': 'Basic ' + new Buffer(conf.hamk_token + ':').toString('base64')
        }
    };
    var body = JSON.stringify({
        startDate: timeString,
        endDate: endTimeString,
        size: 5000
    });
    getJSON(options, body, function (res) {
        if (res.status == "success") {
            var studentGroups = [];
            var studentGroupsCheck = [];
            var info = res.reservations;
            for (var i = 0; i < res.reservations.length; i++) {
                var crow = res.reservations[i];
                for (var j = 0; j < crow.resources.length; j++) {
                    var cres = crow.resources[j];
                    if (cres.type == "student_group") {
                        if (studentGroupsCheck.indexOf(cres.code) < 0) {
                            studentGroupsCheck.push(cres.code);
                            studentGroups.push([null, cres.code]);
                        }
                    }
                }
            }
            console.log("updating group listings");
            if (studentGroups.length > 0) {
                db.query("DELETE FROM existing_groups", function (error, rows, fields) {
                    if (error) {
                        console.log(error);
                    }
                    db.query("INSERT INTO existing_groups VALUES ?", [studentGroups], function (err, res) {
                        if (err) {
                            console.log(err);
                        }
                    });
                    console.log("group refresh done :)");

                });
            }
            console.log("updating schedule database");
            var updated = 0;
            var added = 0;
            db.query("DELETE FROM resourceReservations WHERE startTime > NOW()", function (err3, dbResourceReservations, dbResourceReservationFields) {
                if (err3) {
                    console.log(err3);
                }
            });
            db.query("SELECT * FROM reservations", function (err1, dbReservations, dbReservationFields) {
                var dbReserves = [];

                for (var yy = 0; yy < dbReservations.length; yy++) {
                    var crow = dbReservations[yy];
                    if (crow.id != undefined) {
                        dbReserves[crow.id] = crow;
                    }
                }

                db.query("SELECT * FROM resources", function (err2, dbResourcesOrig, dbResourceFields) {
                    var dbResources = [];
                    for (var i = 0; i < dbResourcesOrig.length; i++) {
                        var crow = dbResourcesOrig[i];
                        dbResources[crow.id] = crow;
                    }
                    if (err1) {
                        console.log(err1);
                    }
                    if (err2) {
                        console.log(err2);
                    }
                    console.log("fetching schedules");
                    var gained = 1;
                    var loopCount = 0;
                    var insertReservations = [];
                    var insertResources = [];
                    var insertConns = [];
                    var insertedIDs = [];
                    function getCalendars() {
                        console.log("starting loop " + loopCount);
                        if (gained > 0) {
                            gained = 0;

                            timeString = new Date();
                            timeString.setDate(timeString.getDate() - 5);
                            timeString = timeString.toISOString();
                            var fromThis = 0 + (loopCount * 1000)


                            var body = JSON.stringify({
                                startDate: timeString,
                                size: 1000,
                                from: fromThis
                            });
                            loopCount++;
                            var waitForCB = false;
                            getJSON(options, body, function (res) {
                                console.log("request " + loopCount + " done");
                                var curResults = res.reservations;

                                for (var i = 0; i < curResults.length; i++) {
                                    var creservation = curResults[i];

                                    //if reservation doesn't exist, create it, if it does and something has changed, update it
                                    var desiredOne = "modifiedDate";
                                    if (desiredOne in creservation) {
                                        var modifiedDate = new Date("1970-01-01T00:00:00" + ".989Z");
                                    }
                                    else {
                                        var modifiedDate = new Date(creservation.modifiedDate + ".989Z");
                                    }
                                    var startDate = new Date(creservation.startDate + ".989Z");
                                    var endDate = new Date(creservation.endDate + ".989Z");
                                    if (dbReserves[creservation.id] == undefined || insertReservations[creservation.id] == undefined) {

                                        added++;
                                        gained++;

                                        insertReservations.push([creservation.id, creservation.subject, modifiedDate, startDate, endDate, creservation.description]);
                                    }
                                    else {

                                        var remmod = new Date(dbReserves[creservation.id].modified);

                                        if (remmod < modifiedDate) {
                                            updated++;
                                            added++;
                                            gained++;
                                            console.log(remmod + " - " + modifiedDate);
                                            db.query("DELETE FROM reservations WHERE id = ?", creservation.id, function (err, res) {
                                                insertReservations.push([creservation.id, creservation.subject, modifiedDate, startDate, endDate, creservation.description]);
                                                if (err) { console.log(err); }
                                            });
                                        }
                                    }






                                    /*************************************************************************************************************************/
                                    for (var j = 0; j < creservation.resources.length; j++) {
                                        var cresource = creservation.resources[j];
                                        //if resource doesn't exist, create it, if it does and something has changed, update it
                                        if (dbResources[cresource.id] == undefined) {

                                            if (insertedIDs.indexOf(cresource.id) < 0) {
                                                insertedIDs.push(cresource.id);
                                                //row doesn't exist
                                                if (cresource.parent == undefined) {
                                                    var parentIfExists = null;
                                                }
                                                else {
                                                    parentIfExists = cresource.parent.id;
                                                }
                                                insertResources.push([
                                                    cresource.id,
                                                    cresource.type,
                                                    cresource.code || null,
                                                    cresource.name || null,
                                                    parentIfExists
                                                ]);
                                                added++;
                                                gained++;
                                            }
                                        }
                                        /*************************************************************************************************************************/
                                        //re-add all the dependencies, lightweight enough operation on the DB to do separately from the rest
                                        insertConns.push([creservation.id, cresource.id, startDate, endDate]);

                                        /*************************************************************************************************************************/
                                    }
                                }

                                if (gained > 0) {
                                    console.log("more to get, fetching again");
                                    getCalendars();
                                } else {
                                    console.log("we are done :)");
                                    getCalendars();
                                }
                            });
                        } else {
                            console.log("nothing gained, exit loop hopefully ");
                            ending();
                            console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
                        }
                    }
                    /*reservations insert*/
                    function ending() {


                        console.log("inserting info");
                        if (insertReservations.length > 0) {
                            db.query("INSERT INTO reservations VALUES ? ON DUPLICATE KEY UPDATE id=id", [insertReservations], function (err, res) {
                                if (err) {
                                    console.log("error in reservations");
                                    console.log(err.toString());
                                }
                            });
                        }

                        if (insertResources.length > 0) {
                            db.query("INSERT INTO resources VALUES ?", [insertResources], function (err, res) {
                                if (err) {
                                    console.log("error in resources");
                                    console.log(err.toString());
                                }
                            });
                        }
                        if (insertConns.length > 0) {
                            db.query("INSERT INTO resourceReservations VALUES ? ON DUPLICATE KEY UPDATE startTime = startTime", [insertConns], function (err, res) {
                                if (err) {
                                    console.log("error in resource reservations");
                                    console.log(err.toString());
                                }
                            });
                        }

                        console.log("schedule database update complete - " + updated + " records removed and " + added + " added");
                    }
                    console.log("/**********************ENTERING LOOP**********************************/");
                    getCalendars();
                    console.log("update done");

                });

            });

        }
        else {
            console.log("UNABLE TO UPDATE INFO --- " + res.message);
        }
    });
}

			function getJSON(options, input, cb){
				var body = "";
				console.log("JSON request to remote server done");
				http.request(options, function(res){
					res.on("data", function(chunk){
						body+=chunk;
					});
					res.on("end", function(){
						
						var magic = JSON.parse(body);
						cb(magic);

					});
					
				}).end(input);
			}

module.exports = {
    refreshCalendars,
}