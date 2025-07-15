import dotenv from "dotenv"
import connectDB from "./src/db/index.js";
import {app} from './src/app.js'
dotenv.config({
    path: './.env'
})
import express from 'express';
const app = express();
// your routes and middleware here...

// Add this at the bottom
const axios = require('axios');
const SELF_URL = 'https://prodbackend-1.onrender.com/api/v1'; // <-- Update this
setInterval(() => {
  axios.get(SELF_URL)
    .then(() => console.log(`[PING] Self-pinged at ${new Date().toLocaleTimeString()}`))
    .catch((err) => console.error('[PING ERROR]', err.message));
}, 14 * 60 * 1000);


connectDB()
.then(() => {
    app.listen(process.env.PORT , "0.0.0.0" , () => {
        console.log(`Server is running at port : ${process.env.PORT} `);
    })
})
.catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
})


