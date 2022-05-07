const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 5000;
//middleware

app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    console.log(authHeader);
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        console.log('decoded', decoded);
        req.decoded = decoded;
        next();
    })
    //console.log('inside verifyJWT',authHeader);
}

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.USER}:${process.env.PASS}@cluster0.sk73k.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        console.log("database connected");
        const productsCollection = client.db("electronic").collection("products");
        app.get("/products",async(req,res)=>{
            const query = {};
            const cursor = productsCollection.find(query);
            const products = await cursor.toArray();
            res.send(products);
        })
        //jwt on login
        app.post("/login",async(req,res)=>{
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1d'
            });
            res.send({ accessToken });
        })
        //single product route
        app.get("/products/:id",async(req,res)=>{
            const id = req.params.id;
            const query = {_id:ObjectId(id)};
            const result = await productsCollection.findOne(query);
            res.send(result);
        })
        //updating quantity
        app.put("/products/:id",async(req,res)=>{
            const id = req.params.id;
            const body = req.body;
            const filter = {_id:ObjectId(id)};
            const options = {upsert:true};
            const updateDoc = {
                $set: {
                  quantity: body.quantity
                },
              };
            const result = await productsCollection.updateOne(filter,updateDoc,options);
            res.send(result);
        })
        //Add new Product
        app.post("/products",async(req,res)=>{
            const product = req.body.product; 
            //console.log(product);
            const result = await productsCollection.insertOne(product);
            res.send(result);
        })
        //delete product
        app.delete("/products/:id",async(req,res)=>{
            const id = req.params.id;
            const query = {_id:ObjectId(id)};
            const result = productsCollection.deleteOne(query);
            res.send(result);
        })
        //get user products
        app.get("/myproducts",verifyJWT, async(req,res)=>{
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
            if(email === decodedEmail){
                const query = {email:email};
                const cursor = productsCollection.find(query);
                const result = await cursor.toArray();
                res.send(result);
            }else{
                res.status(403).send({message:'forbidden access'}); 
            }
        })
    }
    finally {
        //await client.close();
    }
}
run().catch(console.dir);
app.get("/", (req, res) => {
    res.send("wassup polapain.?");
})
app.listen(port, () => {
    console.log("connected");
})