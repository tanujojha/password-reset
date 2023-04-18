import express from "express"
import {client} from '../db.js';
import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import randomstring from "randomstring";
import transporter from "../nodemailerConfig.js";

const router = express.Router()

// SEND LINK TO EMAIL AFTER EMAIL VERIFICATION
router.post("/fopa", async(req, res)=>{

    const {email} = req.body

    try {

        const emailExists = await client.db("prf").collection("users").findOne({email: email});
        if(!emailExists || emailExists.length === 0){
            res.status(401).send("Email not Registered")
        }else{
            const randString = randomstring.generate({
                length: 20,
                charset: "alphanumeric"
            })

            const setRandStr = await client.db("prf").collection("users").findOneAndUpdate({ _id: new ObjectId(emailExists._id)}, {$set: {randomString: randString}});

            const info = await transporter.sendMail({
                from: process.env.NODEMAILER_EMAIL,
                to: email,
                subject: "Password Reset Link",
                text: "Go to this link and Authorize to reset your Password",
                html: `<p>Go to this link to reset your password</p>
                        <br/>
                        <a>http://localhost:3000/verify/${randString}</a>`
            })

            if(info.messageId){
                res.status(200).send("A link has been sent to your registered Email")
            }else{
                res.status(401).send({message: "Cant send Email", randStr: randString})
            }

        }   
        
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");
    }
})


// VERIFY LINK 
router.post("/verifylink", async(req, res)=>{

    const {linkToken} = req.body
    // console.log(linkToken);

    try {

        const checkLinkToken = await client.db("prf").collection("users").findOne({randomString: linkToken});
        if(!checkLinkToken){
            res.status(401).send("Link did not match")
        }else{
            res.status(200).send({message: "Authorized", userEmail: checkLinkToken.email})
        }
        
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error")
    }
})


// CHANGE/UPDATE PASSWORD
router.put("/changepassword", async(req, res)=>{
    // console.log(req.headers.user);
    // console.log(req.body);
    const password = req.body.password;
    const userEmail = req.headers.user
    try {

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const updatePass = await client.db("prf").collection("users").findOneAndUpdate({email: userEmail}, {$set: {password: hashedPassword}, $unset: {randomString: ""}})
        res.status(200).send("Password Updated")
        
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error")
    }
})



// REGISTER
router.post("/register", async(req, res)=>{
    const {name, email, password} = req.body
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = {
            name: name,
            email: email,
            password: hashedPassword
        }

        const insertResult = await client.db("prf").collection("users").insertOne(newUser);
        res.status(200).send(insertResult)
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error")
    }
})


// LOGIN
router.post("/login", async(req, res)=>{
    const {email, password} = req.body;
    try {

        const user = await client.db("prf").collection("users").findOne({email: email});
        if(!user){
            res.status(400).send("No such User")
        }else{
            const validatePassword = await bcrypt.compare(password, user.password);
            if(!validatePassword){
                res.status(400).send("wrong password");
            }else{
                res.status(200).send({message: "Login Successfull", user: user.email})
            }
        }
        
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error")
    }
})


export default router