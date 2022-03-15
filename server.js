const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const authJwtController = require('./auth_jwt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const User = require('./Users');
const Movie = require("./Movies");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.use(passport.initialize());

const router = express.Router();

function getJSONObjectForMovieRequirement(req, msg) {
    let json = {
        message: msg,
        headers: "No headers",
        key: process.env.UNIQUE_KEY,
        body: "No body"
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
        let user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;

        user.save(function (err) {
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
    let userNew = new User();
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({username: userNew.username}).select('name username password').exec(function (err, user) {
        if (err) {
            res.send(err);
        }

        user.comparePassword(userNew.password, function (isMatch) {
            if (isMatch) {
                let userToken = {id: user.id, username: user.username};
                let token = jwt.sign(userToken, process.env.SECRET_KEY, null, null);
                res.json({success: true, token: 'JWT ' + token});
            } else {
                res.status(401).send({success: false, msg: 'Authentication failed.'});
            }
        })
    })
});

router.route('/movies')
    .get(authJwtController.isAuthenticated, function (req, res) {
        console.log(req.body);
        res = res.status(200);

        if (req.get('Content-Type')) {
            res = res.type(req.get('Content-Type'));
        }

        Movie.find().exec(function (err, movies) {
            if (err) {
                res.send(err);
            }
            if (movies.length < 1) {
                res.json({success: false, message: 'No movies found.'});
            }
            else {
                res.json(movies);
            }
        })
    })
    .post(authJwtController.isAuthenticated, function (req, res) {
        const { title, releaseYear, genre, actors } = req.body;
        if(!title){return res.json({success: false, info: "No movie title!"});}
        else if(!releaseYear){return res.json({success: false, info: "No movie release year!"});}
        else if(!genre){return res.json({success: false, info: "No movie genre!"});}
        else if(!actors || actors.length < 3){return res.json({success: false, info: "At least 3 actors info required!"});}
        else {
            let movieNew = new Movie();
            movieNew.title = req.body.title;
            movieNew.releaseYear = req.body.releaseYear;
            movieNew.genre = req.body.genre;
            movieNew.actors = req.body.actors;

            if (req.get('Content-Type')) {
                res = res.type(req.get('Content-Type'));
            }

            movieNew.save(function (err) {
                if (err) {
                    if (err.code == 11000)
                        return res.json({success: false, message: 'Movie already exists!'});
                    else
                        return res.json(err);
                } else {
                    var o = getJSONObjectForMovieRequirement(req, 'New movie was created and saved.');
                    res.json(o)
                }
            });
        }
    })
    .put(authJwtController.isAuthenticated, function (req, res) {
        res.json({success: false, message: 'Specify the movie that user wants to update with movie parameter'});
    })
    .delete(authJwtController.isAuthenticated, function (req, res) {
        res.json({success: false, message: 'Specify the movie that user wants to delete with movie parameter'});
    })


// getting and updating a specific movie with movie title as parameter
router.route('/movies/:title')
    .get(authJwtController.isAuthenticated, function (req, res) {
        console.log(req.body);
        res = res.status(200);

        if (req.get('Content-Type')) {
            res = res.type(req.get('Content-Type'));
        }
        Movie.find({title: req.params.title}).exec(function (err, movie) {
            if (err) {
                res.send(err);
            }
            res.json(movie);
        })
    })
    .delete(authJwtController.isAuthenticated, function (req, res) {
        console.log(req.body);
        res = res.status(200);
        if (req.get('Content-Type')) {
            res = res.type(req.get('Content-Type'));
        }
        Movie.find({title: req.params.title}).exec(function (err, movie) {
            if (err) {
                res.send(err);
            }
            console.log(movie);
            if (movie.length < 1) {
                res.json({success: false, message: 'Title not found.'});
            } else {
                Movie.deleteOne({title: req.params.title}).exec(function (err) {
                    if (err) {
                        res.send(err);
                    } else {
                        var o = getJSONObjectForMovieRequirement(req, 'Movie deleted from system!');
                        res.json(o);
                    }
                })
            }
        })
    })
    .put(authJwtController.isAuthenticated, function (req, res) {
        console.log(req.body);
        res = res.status(200);
        if (req.get('Content-Type')) {
            res = res.type(req.get('Content-Type'));
        }
        Movie.updateOne({title: req.params.title}, {
            title: req.body.title,
            releaseYear: req.body.releaseYear, genre: req.body.genre, actors: req.body.actors
        })
            .exec(function (err) {
                if (err) {
                    res.send(err);
                }
            })
        var o = getJSONObjectForMovieRequirement(req, 'Movie is updated!');
        res.json(o);
    })
    .post(authJwtController.isAuthenticated, function (req, res) {
        res.json({success: false, message: 'Movie with the movie parameter cannot be saved!'});
    });

app.use('/', router);
app.listen(process.env.PORT || 8080);
module.exports = app; // for testing only


