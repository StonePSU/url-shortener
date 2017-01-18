const express = require('express');
var app = express();
const fs = require('fs');
const urlExists = require('url-exists');
var mongo = require('mongodb').MongoClient
var dbURL = 'mongodb://localhost:27017/urls';

app.use(function(req, res, next) {
   console.log(`LOG: Request.URL is ${req.url}`);
   next();
});

app.get("/", function(req, res) {
    fs.readFile("./html/index.html", "utf8", (err, data) => {
       if (err) {
           res.sendStatus(404);
           res.end();
       };
       
       res.send(data);
       
    });
});

app.get("/:id", function(req, res) {
   
   var id = parseInt(req.params.id);
   // console.log(`ID is: ${id}`);
   
   if (!isNaN(id)) {
       mongo.connect(dbURL, function(err, db) {
           if (err) throw err;
           console
           var urls = db.collection('url');
           urls.find({"id": id}).toArray(function(err, results) {
              if (err) throw err;
              
              // console.log(results);
              db.close();
              if (results.length !== 0) {
                res.redirect(results[0]["url"]);    
              } else {
                  res.json({"error":"This URL is not in the database"});
              }
              
           });
       })
       
   } else {
       res.json({"error":"This URL is not in the database"});
   }
});

app.get("*", function(req, res) {
   var url = req.url;
   var retVal;
   
   if (url.slice(0, 5) === "/url/") {
       var oldURL = url.slice(5);
       urlExists(oldURL, function(err, exists) {
           if (err) throw err;
           
           if (exists) {
               findURL(oldURL, req, res);
           } else { // url does not exists
                retVal = {"error":"Invalid URL"};
                res.json(retVal);
           }
       });
   }
   
});

app.listen(process.env.PORT || 8080);
console.log("Server is running");

function findURL(url, req, res) {
  mongo.connect(dbURL, function(err, db) {
    if (err) {
      throw err
    } else {
      // console.log("was able to connect to db");
      var urls = db.collection('url');
      urls.find({"url": url}).toArray(function(err, documents) {
         if (!err) {
             if (documents.length >=1) {
                // console.log(`URL: ${documents[0]["id"]}`);
                sendJSONResponse(url, documents[0]["id"], req, res);
             } else {
                insertURL(url, req, res);
             }
         } 
      });
      db.close();
    }
  });
}

function insertURL(oldURL, req, res) {
    
    // first we have to find the maximum id of any url in the system so we can increment for the new url
    mongo.connect(dbURL, function(err, db) {
       if (err) {
           throw err;
       } else {
           var urls = db.collection('url');
           urls.aggregate([{
            $group: {
                _id: '',
                id: {
                    $max: "$id"
                }
            }
            }]).toArray(function(err, results) {
                //console.log(results);
                
                // if we have no results then we can set the id to 1.
                var maxID = 0;
                if (results.length ===0) {
                    maxID = 1;
                } else {
                    maxID = results[0]['id'] + 1;
                }
                // now we need to insert the new value
                urls.insert({"id": maxID, "url": oldURL});
                db.close();
                sendJSONResponse(oldURL, maxID, req, res);
            });
       }
    });
}

function sendJSONResponse(oldURL, id, req, res) {
    var payload = {
        "original-url": oldURL,
        "new-url": req.protocol + "://" + req.hostname + "/" + id
    }
    
    res.json(payload);
}