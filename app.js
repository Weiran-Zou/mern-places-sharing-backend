const express = require("express");
const bodyParser = require("body-parser");
const placesRoutes = require("./routes/places-routes");
const usersRoutes = require("./routes/users-routes");
const HttpError = require("./models/http-error");
const app = express();
const mongoose = require('mongoose');
require('dotenv').config();

//app.use(bodyParser.json());
app.use(bodyParser.json({ limit: '10mb' }));

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
        'Access-Control-Allow-Headers', 
        'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    );
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')

    next();
})

app.use('/api/places', placesRoutes);
app.use('/api/users', usersRoutes);
app.use((req, res, next) => {
    const error = new HttpError("Could not find this route", 404);
    throw error;
})
app.use((error, req, res, next) => {
    if (res.headerSet) {
        return next(error);
    }
    res.status(error.code || 500);
    res.json({message: error.message || 'An unknown error occured!'});
})

mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.5mngh.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`)
        .then(() => {
            app.listen(process.env.PORT || 5000);
            console.log(`app is listening on port ${process.env.PORT || 5000}`);
        })
        .catch(err => {
            console.log(err);
        })

