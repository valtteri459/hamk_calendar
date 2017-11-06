const Database = require("./database");
const fetcher = require("./fetchData");

Database.connect().then(db => {

    fetcher.fetchReservationsOfGroup(db, "TRTKP16A3").then(reservations => {
        console.log("reservaatiot ovat saapuneet", reservations);
    }).catch(err => {
        console.error("reservations error", err);
    })
    
});