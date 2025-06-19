import express from "express"
import cors from "cors"
import exerciseRouter from "./routes/exercise.routes.js"
import cookieParser from "cookie-parser"
import diyRouter from "./routes/diy.routes.js"
import onboardingRouter from "./routes/onBoarding.routes.js"

import lifestyleRouter from "./routes/lifeStyle.routes.js"

const app = express()

// app.use((req, res, next) => {
//     console.log(`Received ${req.method} request to ${req.url}`);
//     console.log("Request Headers:", req.headers);
//     console.log("Request Body:", req.body);
//     next();
// });

app.use(cors({
    origin: "*", 
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    preflightContinue: true
}));



app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(express.static("public"))
app.use(cookieParser())

//routes import
import userRouter from './routes/user.routes.js'
// import dietRouter from './routes/diet.routes.js'
// import LeaderBoardRouter from "./routes/leaderBoard.routes.js";

//routes declaration
app.use("/api/v1/users", userRouter)
// app.use("/api/v1/diet", dietRouter)
app.use("/api/v1/exercise", exerciseRouter)
app.use("/api/v1/diy", diyRouter)
app.use("/api/v1/onboarding", onboardingRouter)
app.use("/api/v1/lifestyle", lifestyleRouter)

export { app }