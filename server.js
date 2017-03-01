var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
// Requiring our Note and Article models
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");
// Scraping tools
var request = require("request");
var cheerio = require("cheerio");

mongoose.Promise = Promise;


// Initialize Express
var app = express();

app.use(logger("dev"));
app.use(bodyParser.urlencoded({
  extended: false
}));


app.use(express.static("public"));

// Database configuration with mongoose
mongoose.connect("mongodb://localhost/redditscrape" || "mongodb://heroku_hmrbqf9b:do78o513qalvpmqulnbqd7d6gu@ds143737.mlab.com:43737/heroku_hmrbqf9b");
var db = mongoose.connection;

// Show any mongoose errors
db.on("error", function(error) {
  console.log("Mongoose Error: ", error);
});

// Once logged in to the db through mongoose, log a success message
db.once("open", function() {
  console.log("Mongoose connection successful.");
});


// Routes

app.get("/scrape", function(req, res) {
//body of HTML request
  request("https://www.reddit.com/r/Jokes/", function(error, response, body) {
    var $ = cheerio.load(body);

    $("p.title").each(function(i, element) {

      // Save an empty result object
      var result = {};

      result.title = $(this).children("a").text();
      result.link = $(this).children("a").attr("href");

      var entry = new Article(result);

      // Now, save that entry to the db
      entry.save(function(err, doc) {
        // Log any errors
        if (err) {
          console.log(err);
        }
        // Or log the doc
        else {
          console.log(doc);
        }
      });

    });
  });
  // Tell the browser that we finished scraping the text
  res.send("Scrape Complete");
});

app.get("/articles", function(req, res) {
  // Grab every doc in the Articles array
  Article.find({}, function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Or send the doc to the browser as a json object
    else {
      res.json(doc);
    }
  });
});

// Grab an article by it's ObjectId
app.get("/articles/:id", function(req, res) {

  Article.findOne({ "_id": req.params.id })
  .populate("note")
  .exec(function(error, doc) {

    if (error) {
      console.log(error);
    }

    else {
      res.json(doc);
    }
  });
});


// Create a new note or replace an existing note
app.post("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  var newNote = new Note(req.body);

  // And save the new note the db
  newNote.save(function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Otherwise
    else {
      // Use the article id to find and update it's note
      Article.findOneAndUpdate({ "_id": req.params.id }, { "note": doc._id })
      // Execute the above query
      .exec(function(err, doc) {
        // Log any errors
        if (err) {
          console.log(err);
        }
        else {
          // Or send the document to the browser
          res.send(doc);
        }
      });
    }
  });
});

app.post("/delete/:id", function (request, response) {
  Note.find(
    {"_id": request.params.id}.remove().exec, function (error) {
      if (err) {
        console.log(err);
      }
      else {
        res.send();
      }
    });
})


// Listen on port 3000
var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log("App Running on port:", port);

});