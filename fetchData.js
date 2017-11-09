function fetchReservationsOfGroup(db, groupId) {
    return new Promise((fulfill, reject) => {
        db.query("SELECT reservations.* FROM reservations INNER JOIN resourceReservations ON reservations.id = resourceReservations.reservation INNER JOIN resources ON resourceReservations.resource = resources.id WHERE resources.name = ?", groupId, function (err, reservationRows) {
            if (err){
                console.log(err);
                return reject(err);
            } 

            const resourcePromises = reservationRows.map(row => {
                const mystery = Object.assign({}, row);
                return getResourcesOfReservation(db, row);
            });

            // Fetch all resources
            // append resources to the reservations
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
            if (err){
                console.log(err);
                return reject(err);
            } 

            return fulfill(rows.map(row => {
                return Object.assign({}, row);
            }));
        });
    });
}
function getResource(db, resourceId) {
    return new Promise((fulfill, reject)  => {
        db.query("SELECT * FROM resources WHERE id = ?", resourceId, function(err, rows){
            if(err){
                console.log(err);
                return reject(err);
            }

            return fulfill(rows.map(row=>{
                return Object.assign({}, row);
            }));
        });
    });
}
function getGroups(db, resourceId){
    return new Promise((fulfill, reject) =>{
        db.query("SELECT * FROM existing_groups", function(err, rows, fields){
            if(err){
                console.log(err);
                return(reject(err));
            }
            var groups = [];
            for(var groupCount = 0;groupCount<rows.length;groupCount++){
                groups.push(rows[groupCount].name);
                
            }
            return fulfill(groups);
            
        });
    });
}
module.exports = {
    fetchReservationsOfGroup,
    getResourcesOfReservation,
    getResource,
    getGroups,
}