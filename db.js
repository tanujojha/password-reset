import dotenv from "dotenv";
dotenv.config();
import { MongoClient } from "mongodb";


const client = new MongoClient(process.env.MONGO_ATLAS_URL);

export {client}