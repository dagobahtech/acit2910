const express = require("express");
const router = express.Router();
const pg = require("pg");
const path = require("path");
const bcrypt = require("bcryptjs");
const MenuItemValidator = require("./menuItemValidator");

const dbURL = process.env.DATABASE_URL || "postgres://lpufbryv:FGc7GtCWBe6dyop0yJ2bu0pTXDoBJnEv@stampy.db.elephantsql.com:5432/lpufbryv";
var adminFolder = path.resolve(__dirname, "../client/admin");

/* Menu Access code section */

function getMenuItems(pg, dbURL, dagobah) {
    pg.connect(dbURL, function(err, client, done){
        if(err){
            console.log(err);
        }
        client.query("SELECT * FROM menu", function(err, results){
            done();
            dagobah.menuItems = results.rows;
            console.log("Menu array in the server updated!");
        });
    });
}


router.get("/", function (req, resp) {
    if (req.session.user_id === 1) {
        resp.sendFile(adminFolder + "/index.html");
    } else {
        resp.redirect("/login");
    }
});

router.post("/page/:page", function (req, resp) {
    resp.sendFile(adminFolder+"/"+req.params.page+".html");
});

router.get("/logout", function(req, resp) {
    req.session.destroy();

    resp.redirect("/login");

});

var menuTester = new MenuItemValidator();

/****************** ITEM CRUD *************************/
router.post("/createItem", function (req, resp) {

    // const pg = req.app.get("dbInfo").pg;
    // const dbURL = req.app.get("dbInfo").dbURL;

    console.log(req.body);
    var testedItem = menuTester.testItem(req.body);
    if (testedItem.passing) {
        pg.connect(dbURL, function(err, client, done) {
            if (err) {console.log(err)}

            let dbQuery = "INSERT INTO menu (name, category, description, price, image_name, kitchen_station_id) VALUES ($1, $2, $3, $4, $5, $6)";
            client.query(dbQuery, [req.body.name, req.body.category, req.body.desc, req.body.price, req.body.image, req.body.station], function(err, result) {
                done();
                if (err) {
                    console.log(err);
                    resp.end("ERROR");
                }

                getMenuItems(pg, dbURL, req.app.get("dagobah").menuItems);
                resp.send({status: "success", msg: "item created!"});

            });
        });
    } else {
        var message = testedItem.err;
        resp.send({status: "fail", msg: message});
    }

});

// router.post("/deleteItem", function(req, resp) {
// //    console.log("name recieved: " + req.body.name);
//     let dbQuery = "DELETE FROM menu WHERE name = $1";
//     pg.connect(dbURL, function(err, client, done) {
//         if(err) {
//             console.log(err);
//         }
//         client.query(dbQuery, [req.body.name], function(err, result) {
//             done();
//             if(err) {
//                 console.log("error");
//                 console.log(err);
//                 resp.send(err);
//             }
//             else {
//                 console.log("success");
//                 console.log(result);
//                 resp.send("success");
//             }
//         });
//     })
// });

/**************** ACCOUNT CRUD ***********************/

router.post("/createAdmin", function(req, resp) {
    console.log(req.body);
    let dbQuery = "INSERT INTO user_login (username, password, type_id) VALUES ($1, $2, $3)";
    bcrypt.hash(req.body.pass, 5, function(err, bpass){
        pg.connect(dbURL, function(err, client, done) {
            if(err){console.log(err)}
            client.query(dbQuery, [req.body.user, bpass, req.body.type], function(err, result) {
                if(err) {
                    console.log(err);
                    resp.send("error");
                }
                else {
                    console.log(result);
                    resp.send(result);
                }
            });
        });
    });
});

router.post("/deleteUser", function(req, resp) {
    console.log(req.session.user);
    console.log(req.body);
    let dbQuery = "SELECT * FROM user_login WHERE id = ($1)";
    pg.connect(dbURL, function(err, client, done) {
        if(err){console.log(err)}
        client.query(dbQuery, [req.session.SPK_user], function(err, result) {
            var del = req.session.SPK_user;
            if(err) {
                done();
                console.log(err);
            }
            else {
                console.log(result);
                if(result.rows[0].password == req.body.pass) {
                    req.session.destroy();
                    let dbQuery = "DELETE FROM user_login WHERE id = ($1)";
                    client.query(dbQuery, [del], function(err, result) {
                        done();
                        if(err) {
                            console.log(err);
                        }
                        else {
                            resp.send("success");
                        }
                    });
                }
                else {
                    done();
                    resp.send("error");
                }
            }
        });
    });
});

/*************** STATISTICS *************************/
router.post("/getSummary", function(req, resp) {

    let summary = {};

    pg.connect(dbURL, function(err, client, done) {
        if(err){console.log(err)}

        let dbQuery = "SELECT to_char(date AT TIME ZONE 'MST', 'YYYY-MM-DD') as date, COUNT(id) AS orders FROM order_submitted GROUP BY to_char(date AT TIME ZONE 'MST', 'YYYY-MM-DD') ORDER BY date;";
        client.query(dbQuery,[], function(err, result){
            done();
            if(err){console.log(err)}

            summary.ordersDate = result.rows;

            resp.send(summary);
        });
    });
});

//statistics post
router.post("/getStatData", function (req, resp) {

    let category = req.body.category;
    let year = req.body.year;
    let type = req.body.type;

    if(category === undefined) {
        resp.send({
            status: "fail"
        });
    }
    pg.connect(dbURL, function(err, client, done) {
        if(err){console.log(err)}

        let dbQuery;
        let params;
        if(category === 'yearly') {

            if(type === 'sales') {
                dbQuery = "SELECT EXTRACT (YEAR FROM date) as category, SUM(total) as value from order_submitted GROUP BY EXTRACT (YEAR FROM date)";
            } else {
                dbQuery = "SELECT EXTRACT (YEAR FROM item_discarded.date) as category, SUM(menu.price) as value FROM item_discarded, menu where item_discarded.item_id = menu.id GROUP BY EXTRACT (YEAR FROM item_discarded.date)"
        }
        params = [];
        } else if(category === 'monthly') {
            if(year === undefined) {
                resp.send({
                    status: "fail"
                });
                done();
                return;
            }
            if(type === 'sales') {
                dbQuery = "SELECT EXTRACT (MONTH FROM date) as category, SUM(total) as value FROM order_submitted WHERE EXTRACT (YEAR FROM date) = $1 GROUP BY EXTRACT (MONTH FROM date)";
            } else {
                dbQuery = "SELECT EXTRACT (MONTH FROM item_discarded.date) as category, SUM(menu.price) as value FROM item_discarded, menu where item_discarded.item_id = menu.id AND EXTRACT (YEAR FROM item_discarded.date) = $1 GROUP BY EXTRACT (MONTH FROM item_discarded.date)"
            }
            params = [year];
        } else if(category === 'weekly') {
            if(year === undefined) {
                resp.send({
                    status: "fail"
                });
                done();
                return;
            }
            if(type === 'sales') {
                dbQuery = "SELECT EXTRACT (WEEK FROM date) as category, SUM(total) as value from order_submitted WHERE EXTRACT (YEAR FROM date) = $1 GROUP BY EXTRACT (WEEK FROM date)";
            } else {
                dbQuery = "SELECT EXTRACT (WEEK FROM item_discarded.date) as category, SUM(menu.price) as value FROM item_discarded, menu where item_discarded.item_id = menu.id AND EXTRACT (YEAR FROM item_discarded.date) = $1 GROUP BY EXTRACT (WEEK FROM item_discarded.date)"
            }
            params = [year];
        } else {
            done();
            return false;
        }
        //if can't make the query, don't continue
        if(dbQuery === undefined) {
            done();
            resp.send({
                status: "fail"
            });
            return false;
        }
        client.query(dbQuery,params, function(err, result){
            done();
            if(err){console.log(err)}

            resp.send({
                status: "success",
                data: result.rows,
                category: category,
                type: type
            });
        });
    });
});

router.post("/getOrderStat", function (req, resp) {

    let year = req.body.year;

    if(year === undefined) {
        resp.send({
            status: "fail"
        });
    }

    pg.connect(dbURL, function (err, client, done) {
        if(err) {
            console.log(err);
            return false;
        }

        client.query("SELECT EXTRACT (MONTH FROM date) AS category, COUNT(*) AS value from order_submitted WHERE EXTRACT (YEAR FROM date) = $1 GROUP BY EXTRACT (MONTH FROM date)",
        [year], function (err, result) {
                done();
                if(err) {
                    console.log(err);
                    resp.send({
                        status: "fail"
                    });
                    return false;
                }

                resp.send({
                    status: "success",
                    data: result.rows
                });

            });
    })
});

router.post("/getDiscardStat", function (req, resp) {

    let year = req.body.year;

    if(year === undefined) {
        resp.send({
            status: "fail"
        });
    }
    pg.connect(dbURL, function (err, client, done) {
        if(err) {
            console.log(err);
            return false;
        }

        client.query("SELECT EXTRACT (WEEK FROM date) AS category, COUNT(*) AS value from item_discarded WHERE EXTRACT (YEAR FROM date) = $1 GROUP BY EXTRACT (WEEK FROM date)",
            [year], function (err, result) {
                done();
                if(err) {
                    console.log(err);
                    resp.send({
                        status: "fail"
                    });
                    return false;
                }

                resp.send({
                    status: "success",
                    data: result.rows
                });

            });
    })
});

router.post("/getOrderAvgStat", function (req, resp) {

    let year = req.body.year;

    if(year === undefined) {
        resp.send({
            status: "fail"
        });
    }

    pg.connect(dbURL, function (err, client, done) {
        if(err) {
            console.log(err);
            return false;
        }
        client.query("SELECT EXTRACT (MONTH FROM date) AS category, ROUND(AVG(count),2) AS value from " +
            "(SELECT order_submitted.id AS id, count(*) AS count, order_submitted.date AS date " +
            "from order_submitted, item_in_order WHERE order_submitted.id = item_in_order.order_id " +
            "AND EXTRACT (YEAR FROM order_submitted.date) = $1 GROUP BY order_submitted.id) " +
            "AS order_table GROUP BY EXTRACT (MONTH FROM date);",
            [year], function (err, result) {
            done();
            if(err) {
                console.log(err);
                return false;
            }

            resp.send({
                status: "success",
                data: result.rows
            });


        })
    });
});

router.post("/getItemStatAll", function (req, resp) {
    let year = req.body.year;
    let category = req.body.category;

    if(year === undefined || category === undefined) {
        resp.send({
            status: "fail"
        });

        return;
    }

    pg.connect(dbURL, function (err, client, done) {
        if(err) {
            console.log(err);
            return false;
        }
        let dbQuery = "SELECT menu_category.name AS category, COALESCE(items_in_orders.count, 0) AS value " +
            "FROM (SELECT menu.name as name, menu.id as id FROM menu " +
            "WHERE menu.category=$2) as menu_category " +
            "LEFT OUTER JOIN (SELECT item_in_order.item_id as item_id, count(*) AS count " +
            "FROM item_in_order, order_submitted " +
            "WHERE item_in_order.order_id = order_submitted.id AND EXTRACT(YEAR FROM order_submitted.date) = $1 " +
            "GROUP BY item_in_order.item_id) AS items_in_orders ON menu_category.id = items_in_orders.item_id";

        client.query(dbQuery,[year, category], function (err, result) {
            done();
            if(err) {
                console.log(err);
                return false;
            }

            resp.send({
                status: "success",
                data: result.rows
            });
        });
    });
});


router.post("/getItemStatForMonth", function (req, resp) {
    let year = req.body.year;
    let category = req.body.category;
    let month = req.body.month;

    if(year === undefined || category === undefined || month === undefined) {
        resp.send({
            status: "fail"
        });

        return;
    }

    pg.connect(dbURL, function (err, client, done) {
        if(err) {
            console.log(err);
            return false;
        }
        let dbQuery = "SELECT menu_category.name AS category, COALESCE(items_in_orders.count, 0) AS value " +
            "FROM (SELECT menu.name as name, menu.id as id FROM menu " +
            "WHERE menu.category=$3) as menu_category " +
            "LEFT OUTER JOIN (SELECT item_in_order.item_id as item_id, count(*) AS count " +
            "FROM item_in_order, order_submitted " +
            "WHERE item_in_order.order_id = order_submitted.id AND EXTRACT(YEAR FROM order_submitted.date) = $1 AND EXTRACT (MONTH FROM order_submitted.date) = $2 " +
            "GROUP BY item_in_order.item_id) AS items_in_orders ON menu_category.id = items_in_orders.item_id";

        client.query(dbQuery,[year, month, category], function (err, result) {
            done();
            if(err) {
                console.log(err);
                return false;
            }

            resp.send({
                status: "success",
                data: result.rows
            });
        });
    });
});



router.post("/updateAll", function(req, resp) {

    var testedItem = menuTester.testItem(req.body);
    if (testedItem.passing) {
        pg.connect(dbURL, function(err, client, done) {
            if (err) {console.log(err)}

            let dbQuery = "UPDATE menu SET name = $1, price = $2, category = $3, description = $4, kitchen_station_id = $5  WHERE id = $6";
            client.query(dbQuery, [req.body.name, parseFloat(req.body.price), parseInt(req.body.category), req.body.desc, parseInt(req.body.station), parseInt(req.body.itemID)], function(err, result) {
                done();
                if (err) {
                    console.log(err);
                    resp.end("ERROR");
                }

                getMenuItems(pg, dbURL, req.app.get("dagobah").menuItems);
                resp.send({status: "success", msg: "item updated!"});

            });
        });
    } else {
        var message = testedItem.err.replace("\n\n", "<br>");
        resp.send({status: "success", msg: message});
    }
});
var updateObject = {};
router.post("/sendUpdate", function(req, resp){
    
    if(req.body.type == "request"){

        resp.send({status:"sent", item:updateObject});
    }else{
        updateObject = req.body;
        console.log(updateObject);
        resp.send({status:"recieved"});
    }
});
router.post("/restStatChange", function(req, resp) {
     if(req.body.status == "true") {
         req.app.get("dagobah").isOpen = false;
         req.app.get("socketio").emit("store status", (req.app.get("dagobah").isOpen));
         resp.send(false);
     }
     else if (req.body.status == "false") {
         req.app.get("dagobah").isOpen = true;
         req.app.get("socketio").emit("store status", (req.app.get("dagobah").isOpen));
         resp.send(true);
     }
     else {
         resp.send(null);
         console.log("sending: error");
     }
});

router.post("/itemStatus", function(req, resp) {
    // console.log(req.body.status);
    

    // var conv = null;
    // if(req.body.status == "true") {
    //     conv = false;
    // } else if (req.body.status == "false") {
    //     conv = true;
    // } else {console.log("ERROR");}
    //
    // pg.connect(dbURL, function(err, client, done) {
    //     if(err) {console.log(err);}
    //     let dbQuery = "UPDATE menu SET active = ($1) where name = ($2)";
    //     client.query(dbQuery, [conv, req.body.item], function(err, result) {
    //         done();
    //         if (err) {
    //             console.log(err);
    //             resp.send("ERROR");
    //         }
    //         else {
    //             resp.send({
    //                 item: req.body.item,
    //                 status: conv
    //             });
    //         }
    //     });
    // });
    var itemId = parseInt(req.body.id);

    pg.connect(dbURL, function (err, client, done) {
        if(err) {
            return false;
        }

        client.query("UPDATE menu set active = not active where id=$1 returning active",[req.body.id], function (err, result) {

    // var conv;
    // if(req.body.status == "true") {
    //     conv = false;
    // } else if (req.body.status == "false") {
    //     conv = true;
    // } else {console.log("ERROR");}
    
    // pg.connect(dbURL, function(err, client, done) {
    //     if(err) {console.log(err);}
    //     let dbQuery = "UPDATE menu SET active = ($1) where name = ($2)";
    //     client.query(dbQuery, [conv, req.body.item], function(err, result) {

            done();
            if(err) {
                return false;
            }
            //update the menu items
            updateMenuItems(req.app.get('dagobah').menuItems, itemId, ['active'], [result.rows[0].active])
            resp.send(result.rows[0].active);
        })
    })
});


//update fields of menuItems field array with new values
function updateMenuItems(menuItems, id, fields, newValues) {
    console.log("updating items");
    if(fields.length !== newValues.length) {
        return false;
    }
    console.log(menuItems.length);
    for(let x = 0 ; x < menuItems.length ; x++) {

        let item = menuItems[x];
        console.log(item.id, id);
        if(item.id === id) {
            console.log("item found");
            for(let index = 0 ; index < fields.length ; index++) {
                if(!item.hasOwnProperty(fields[index])) {
                    console.log('no property found on', item, "with ", fields[index]);
                    continue;
                }
                console.log("updating", item[fields[index]], newValues[index]);
                item[fields[index]] = newValues[index];
            }
        }
    }
}
module.exports = {router, getMenuItems, bcrypt};
