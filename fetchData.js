function fetchReservationsOfGroup(db, groupId) {
    return new Promise((fulfill, reject) => {
        db.query("SELECT reservations.* FROM reservations INNER JOIN resourceReservations ON reservations.id = resourceReservations.reservation INNER JOIN resources ON resourceReservations.resource = resources.id WHERE resources.name = ?", groupId, function (err, reservationRows) {
            if(err) return reject(err);

            const resourcePromises = reservationRows.map(row => {
                const genericShit = Object.assign({}, row);
                return getResourcesOfReservation(db, row);
            });

            // Fetch all resources
            // Return array. Each item fuck thattgfhshgosf
            Promise.all(resourcePromises).then(resourceArr => {
                resourceArr.forEach((resourcesOfReservation, reservationIndex) => {
                    reservationRows[reservationIndex].resources = resourcesOfReservation;
                })
                fulfill(reservationRows);
            }).catch(err => {
                return reject(err);
            });
        });
    });
}

function getResourcesOfReservation(db, reservation) {
    return new Promise((fulfill, reject) => {
        db.query("SELECT resources.* FROM resources INNER JOIN resourceReservations ON resources.id = resourceReservations.resource WHERE resourceReservations.reservation = ?", reservation.id, function (err, rows) {
            if (err) return reject(err);

            return fulfill(rows.map(row => {
                return Object.assign({}, row);
            }));
        });
    });
}

module.exports = {
    fetchReservationsOfGroup,
    getResourcesOfReservation,
}

/*
function fetchTimetable() {
    return fetchReservationsOfGroup().then(reservations => {

    })
    return new Promise((fulfill, reject) => {
        // Fetch all reservations of student group
        
            if(err){
                console.log(err);
            }

					const output = rows.map(function(row) {
						Object.assign({}, row);

						console.log("A", row);

						db.query("SELECT resources.* FROM resources INNER JOIN resourceReservations ON resources.id = resourceReservations.resource WHERE resourceReservations.reservation = ?", row.id, function(errAgain, rowTwo, colTwo){
							if(errAgain){
								console.log(errAgain);
							}

							//console.log(output[xy],xy);
							if(rowTwo != undefined){
								//console.log(rowTwo);
								output[xy]["resources"] = rowTwo;
								if(xy == rows.length-1){
									res.end(JSON.stringify(output));
								}
							}else{
								output[xy]["resources"] = null;
								if(xy == rows.length-1){
									res.end(JSON.stringify(output));
								}
							}
						});
					});
					
                });
            }
            */