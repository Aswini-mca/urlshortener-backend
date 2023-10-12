import { client } from "./index.js";
import bcrypt from "bcrypt"
import randomstring from "randomstring"


async function genPassword(password) {
    const salt = await bcrypt.genSalt(10)//bcrypt.genSalt(no. of rounds)
    const hashedPassword = await bcrypt.hash(password, salt)
    return hashedPassword
}

async function createUser(username,firstname,lastname,hashedPassword,token) {
    return await client.db("FSD").collection("urlusers").insertOne({ username, firstname ,lastname ,password: hashedPassword,activateToken:token,isActivated:false })
}

async function getUserByName(username) {
    return await client.db("FSD").collection("urlusers").findOne({ username: username })
}

async function getUserByToken(activateToken){
    return await client.db("FSD").collection("urlusers").findOne({ activateToken:activateToken })
}

async function updateTokenStatus(token) {
    return await client.db("FSD").collection("urlusers").updateOne({ _id: token._id }, { $set: { isActivated:true,activateToken:null } })
}

function genToken() {
    const resetToken = randomstring.generate(20);
    return resetToken
}

async function storeResetToken(resetToken, userFromDB, resetTokenExpiresAt) {
    return await client.db("FSD").collection("urlusers").updateOne({ _id: userFromDB._id }, { $set: { resetToken: resetToken, resetTokenExpiresAt: resetTokenExpiresAt } })
}

async function getUserByResetToken(resetToken) {
    return await client.db("FSD").collection("urlusers").findOne({ resetToken:resetToken })
}

async function updateNewPassword(resetToken, hashedPassword) {
    return await client.db("FSD").collection("urlusers").updateOne({ _id: resetToken._id }, { $set: { password: hashedPassword, resetToken: null, resetTokenExpiresAt: null } })
}

async function createUrl(longUrl,shortUrl){
    return await client.db("FSD").collection("url").insertOne({longUrl,shortUrl,Date:new Date(),clickCount:0})
}

async function getUrl(shortUrl){
    return await client.db("FSD").collection("url").findOne({shortUrl:shortUrl})
}

export { genPassword, createUser, getUserByName,getUserByToken,updateTokenStatus,genToken,storeResetToken,getUserByResetToken,updateNewPassword,createUrl,getUrl}