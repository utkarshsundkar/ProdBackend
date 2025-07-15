import dotenv from "dotenv";
dotenv.config({
    path: './.env'
});

import connectDB from "./src/db/index.js";
import { app } from './src/app.js';
import axios from 'axios'; // ✅ Use ES module import if you're using "type": "module"

// 🟢 Self-ping logic to keep Render instance awake
const SELF_URL = 'https://prodbackend-1.onrender.com'; // Replace with your Render root URL
setInterval(() => {
  axios.get(SELF_URL)
    .then(() => console.log(`[PING] Self-pinged at ${new Date().toLocaleTimeString()}`))
    .catch((err) => console.error('[PING ERROR]', err.message));
}, 14 * 60 * 1000); // every 14 minutes

// 🟢 Start server after DB connection
connectDB()
.then(() => {
    app.listen(process.env.PORT , "0.0.0.0" , () => {
        console.log(`Server is running at port : ${process.env.PORT}`);
    });
})
.catch((err) => {
    console.log("MongoDB connection failed!", err);
});
