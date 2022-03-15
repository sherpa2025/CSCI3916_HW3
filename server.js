/*
CSCI3916_HW3
File: Server.js
Description: Web API scaffolding for Movie API
Modified: Nima Sherpa
 */

var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authController = require('./auth');
var authJwtController = require('./auth_jwt');
var jwt = require('jsonwebtoken');
var cors = require('cors');
var User = require('./Users');
var Movies = require('./Movies');

var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false}));

app.use(passport.initialize());

var router = express.Router();

function getJSONObjectForMovieRequirement(req) {
    var json = {
        headers: "No Headers",
        key: process.env.UNIQUE_KEY,
        body: "No Body",
    };

    if (req.body != null) {
        json.body = req.body;
    }

    if (req.headers != null) {
        json.headers = req.headers;
    }

    return json;
}


router.post('/signup', function (req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please include both username and password to signup.'})
    } else {
        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;

        user.save(function(err){
            if (err) {
                if (err.code == 11000)
                    return res.json({success: false, message: 'A user with that username already exists.'});
                else
                    return res.json(err);
            }

            res.json({success: true, msg: 'Successfully created new user.'})
        });
    }
});

router.post('/signin', function (req, res) {
    var userNew = new User();
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
        if (err) {
            res.send(err);
        }

        user.comparePassword(userNew.password, function(isMatch) {
            if (isMatch) {
                var userToken = { id: user.id, username: user.username };
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json ({success: true, token: 'JWT ' + token});
            }
            else {
                res.status(401).send({success: false, msg: 'Authentication failed.'});
            }
        })
    })
});

router.route('/movies')
    .get(authJwtController.isAuthenticated, function(req, res){
        //DB query based off the title only.
        Movies.findOne( {title: req.body.message}).select('title releaseYear genre actors').exec(function (err, movie) {
            if (err) {
                res.send(err)
            }
            let resMovie = {
                title: movie.title,
                releaseYear: movie.releaseYear,
                genre: movie.genre,
                actors: movie.actors
            }
            res.json(resMovie);
        })
    })
    .post(authJwtController.isAuthenticated, function (req,res){
        const { title, releaseYear, genre, actors } = req.body;
        if(!title){return res.json({success: false, info: "No movie title!"});}
        else if(!releaseYear){return res.json({success: false, info: "No movie release year!"});}
        else if(!genre){return res.json({success: false, info: "No movie genre!"});}
        else if(!actors || actors.length < 3){return res.json({success: false, info: "At least 3 actors info required!"});}
        else{
                var movieNew = new Movies();
                movieNew.title = req.body.title;
                movieNew.releaseYear = req.body.releaseYear;
                movieNew.genre = req.body.genre;
                movieNew.actors = req.body.actors;
                movieNew.save(function (err){
                    if (err) {
                        if (err.code == 11000)
                            return res.json({success: false, message: 'A user with that username already exists.'});
                        else
                            return res.json(err);
                    }
                    res.send({status: 200, message: "movie saved", headers: req.headers, query: req.query, env: process.env.UNIQUE_KEY});
                });
        }

    })
    .put(authJwtController.isAuthenticated, function (req,res){                 //updating the movies
        //DB query based off title only.
        Movies.findOneAndUpdate({title: req.body.title}, {releaseYear: req.body.releaseYear}).exec(function (err, movie) {
            if (err)
                res.send(err)
            else
                res.json( {status: 200, message: "Movie info updated with the given year.", new_releaseYear: req.body.releaseYear})
        });
        Movies.findOneAndUpdate({title: req.body.title}, {actors: req.body.actors}).exec(function (err, movie) {
            if (err)
                res.send(err)
            else
                res.json( {status: 200, message: "Movie info updated with the modified actors list.", new_actors: req.body.actors})
        });
        Movies.findOneAndUpdate({title: req.body.title}, {genre: req.body.genre}).exec(function (err, movie) {
            if (err)
                res.send(err)
            else
                res.json( {status: 200, message: "Movie info updated with the modified genre. ", new_genre: req.body.genre})
        });
    })
    .delete(authJwtController.isAuthenticated, function(req, res) {
        //DB query based off title only.
        Movies.findOneAndDelete( {title: req.body.title}).exec(function (err, movie) {
            if (err)
                res.send(err)
            else
                res.json( {status: 200, message: "movie deleted", deleted_movie: req.body.title})
        });
    });


app.use('/', router);
app.listen(process.env.PORT || 8080);
module.exports = app; // for testing only
