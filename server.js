import express from "express"
import mongoose from "mongoose"
import Messages from './dbMessages.js'
import Pusher from 'pusher'
import cors from 'cors'

//app config
const app = express()
const port = process.env.PORT || 9000

const pusher = new Pusher({
  appId: "1288765",
  key: "6b329b6307acac453705",
  secret: "94b1ecc2122da539af6a",
  cluster: "ap2",
  useTLS: true
});

//middleware
app.use(express.json())

app.use(cors())

// app.use((req, res, next) => {
//     res.setHeader("Access-Control-Allow-Origin", "*");
//     res.setHeader("Access-Control-Allow-Header", "*");
//     next();
// })

//DB config
const connection_url = "mongodb+srv://admin:4VWxHyWqbRIeacMg@cluster0.f4urh.mongodb.net/whatsappDB?retryWrites=true&w=majority"
mongoose.connect(connection_url)

mongoose.connect(connection_url, {
    //useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
})

//change stream
const db = mongoose.connection

db.once('open', () => {
    console.log('DB is connected')

    const msgCollection = db.collection("messagecontents")
    const changeStream = msgCollection.watch()

    changeStream.on('change', (change) => {
        console.log("A change occured", change)

        if (change.operationType === 'insert') {
            const messageDetails = change.fullDocument;
            pusher.trigger("messages", "inserted", {
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received
            })
        } else {
            console.log('Error triggring Pusher')
        }
    })
})

//api routes
app.get('/', (req, res) => res.status(200).send('HEllo World'))

app.get('/messages/sync', (req, res) => {
    Messages.find((err, data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(200).send(data)
        }
    })
})

app.post('/messages/new', (req, res) => {
    const dbMessage = req.body

    Messages.create(dbMessage, (err, data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(201).send(`new message created: \n ${data}`)
        }
    })
})

//listner
app.listen(port, () => console.log(`Listning on localhost:${port}`))

//pass db 4VWxHyWqbRIeacMg