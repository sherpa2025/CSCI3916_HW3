var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

mongoose.Promise = global.Promise;

mongoose.connect(process.env.DB, { useNewUrlParser: true } );
mongoose.set('useCreateIndex', true);


// Review schema
var ReviewSchema = new Schema({
    Name: { type: String, required: [true, "A user name is required"], index: { unique: false }},
    movieTitle: {type: String, required: [true, "Attached the title for movie being reviewed."]},
    review: { type: String, required: false},
    rating: {type: Number, required: [true, "Rate the movie from 1 to 5. "]},

});


// return the model
module.exports = mongoose.model('Review', ReviewSchema);
