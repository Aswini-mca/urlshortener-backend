import express from 'express';
import {MongoClient} from 'mongodb';
import cors from 'cors';
import 'dotenv/config'
import { UsersRouter } from './routes/users.js';
import { UrlRouter } from './routes/url.js'; 

const app = express()
const PORT = 9000;

//Inbuilt middleware
app.use(express.json())
app.use(cors())

//mongoDB connection
const MONGO_URL = "mongodb://127.0.0.1:27017"
// process.env.MONGO_URL

async function createConnection() {
    const client = new MongoClient(MONGO_URL)
    await client.connect()
    console.log("Mongodb is connected")
    return client;
}

export const client = await createConnection()

app.get('/',(req,res)=>{
    res.send('URL Shortener Application')
})

app.use('/users',UsersRouter)
app.use('/url',UrlRouter)

app.listen(PORT,()=> console.log('The server started on the port',PORT))


