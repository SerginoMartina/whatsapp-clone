// importing
import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js";
import Pusher from "pusher";
import cors from "cors";

// app config
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher ({
    appId: '1069123',
    key: '74bb5068fc75874fcf05',
    secret: '52e773e70eaeace26982',
    cluster: 'eu',
    encrypted: true
});

// middleware
app.use(express.json());
app.use(cors())

// db config
const connection_url = 
"mongodb+srv://admin:uPo1i91Zb0wF98RL@whatsapp-clone.luvnr.mongodb.net/whatsappdb?retryWrites=true&w=majority";

mongoose.connect(connection_url, 
    { useCreateIndex: true, useNewUrlParser: true, useUnifiedTopology: true 
    });

    const db = mongoose.connection;

    db.once('open', () => {
        console.log("DB connected")
        
        const msgCollection = db.collection("messagecontents");
        const changeStream = msgCollection.watch();

        
        changeStream.on("change", (change) => {
            if (change.operationType === 'insert') {
                const messageDetails = change.fullDocument;
                pusher.trigger('messages', 'inserted',
                    {
                        name: messageDetails.name,
                        message: messageDetails.message,
                        timestamp: messageDetails.timestamp,
                        received: messageDetails.received,
                    });
            }  else {
                console.log("error triggering Pusher");    
            }
        });
    });

// api routes
app.get('/', (req,res) => res.status(200).send("Server is online"));

app.get('/messages/sync', (req, res) => {
    Messages.find((err,data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(200).send(data)
        }
    });
});

app.post('/messages/new', (req, res) => {
    const dbMessage = req.body

    Messages.create(dbMessage, (err,data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(201).send(data)
        }
    });
});

// listener
app.listen(port, () => console.log('listening on local host:${port}'))
