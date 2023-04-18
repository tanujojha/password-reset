import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js"
import {client} from "./db.js"

const app = express();
app.use(express.json());
app.use(cors());
const PORT = 5000

if(client){
    await client.connect()
    console.log("mongodb connected !!");
}else{
    console.log("Database not connected");
}

// ROUTES
app.use("/auth", authRoutes)


app.get("/", (req, res)=>{
    res.send("hello from server")
})


app.listen(PORT, ()=>{
    console.log("server connected on 5000");
})