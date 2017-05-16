const express = require("express");
const router = express.Router();
const pg = require("pg");
const path = require("path");
var rootFile = require("../index.js");

const dbURL = process.env.DATABASE_URL || "postgres://lpufbryv:FGc7GtCWBe6dyop0yJ2bu0pTXDoBJnEv@stampy.db.elephantsql.com:5432/lpufbryv";
var adminFolder = path.resolve(__dirname, "../client/admin");
var loginForm = path.resolve(__dirname, "../client/admin/login.html");


router.get("/", function (req, resp) {
    if (req.session.user_id === 1) {
        resp.sendFile(adminFolder + "/dashboard.html");
    } else {
        resp.sendFile(loginForm);
    }
});

//temporary route to createitems
router.get("/create", function(req, resp) {
   resp.sendFile(adminFolder + "/createItems.html");
});

router.post("/createItem", function (req, resp) {
    console.log(req.body);

    pg.connect(dbURL, function(err, client, done) {
        if (err) {
            console.log(err);
        }

        var dbQuery = "INSERT INTO menu (name, category, description, price, cook_time, kitchen_station_id) VALUES ($1, $2, $3, $4, $5, $6)";
        client.query(dbQuery, [req.body.name, req.body.category, req.body.desc, req.body.price, req.body.time, req.body.station], function(err, result) {
            done();
            if (err) {
                console.log(err);
                resp.end("ERROR");
            }

            rootFile.getMenuItems();
            resp.send({status: "success", msg: "item created!"})

        });
    });
});

module.exports = router;