import express from 'express';
import bcrypt from 'bcrypt'
import nodemailer from 'nodemailer'
import jwt from "jsonwebtoken"
import{getUserByName,genPassword,createUser,getUserByToken,updateTokenStatus,genToken,storeResetToken,getUserByResetToken,updateNewPassword} from '../helpers.js'
const router = express.Router()

//registration API
router.post('/registration', async (req, res) => {
    const { username,firstname,lastname,password } = req.body;
    const isUserExist = await getUserByName(username)
  
    //validate username
    if (isUserExist) {
      res.status(400).send({ error: "Username already exists" })
      return
    }
    //validate username pattern
    if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(username)) {
      res.status(400).send({ error: "username pattern does not match" })
      return
    }
  
    //validate password pattern
    if (!/^(?=.*?[0-9])(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[#!@%$_]).{8,}$/g.test(password)) {
      res.status(400).send({ error: "password pattern does not match" })
      return
    }

    //validate firstname
    if(!firstname){
      res.status(400).send({ error: "first name required" })
      return
    }

    //validate lastname
    if(!lastname){
      res.status(400).send({ error: "last name required" })
      return
    }

    const hashedPassword = await genPassword(password)
    const token = jwt.sign({username},process.env.secret_key)
    const result = await createUser(username,firstname,lastname,hashedPassword,token)
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.email,
        pass: process.env.password
      }
    });
  
    // Function to send the email
    const sendEmail = {
      from: process.env.email,
      to: username,
      subject: "Account Activation Link",
      text: `Account activation${token}`,
      html: `<h2>Your requested for activation <a href='https://incredible-scone-98d7d6.netlify.app/activation/${token}'>https://incredible-scone-98d7d6.netlify.app/activation/${token}</a> click this link to active your account</h2>`
    };
  
    transporter.sendMail(sendEmail, (err, info) => {
      if (err) {
        console.log("Error sending email", err)
        res.status(500).json({ error: "Email not sent" })
      }
      else {
        console.log("Email sent", info.response)
        res.status(200).json({ message: "Successfully created, Email also sent.click that Account Activate Link", token })
      }
    })
})

//to activate the user account
router.post('/activation/:activateToken', async (req, res) => {
    const activateToken =req.params.activateToken
    const token = await getUserByToken(activateToken)

    //validate activate token
    if(!token){
        res.status(400).send({ error: "Invalid Token" })
      return
    }
    const updateIsActivatedToDb = await updateTokenStatus(token)
    res.status(201).json({ message: "User Account Activated Successfully"})
})    

//login API
router.post('/login', async (req, res) => {
  const { username, password } = req.body
  const userFromDB = await getUserByName(username)

  //validate username
  if (!userFromDB) {
    res.status(400).send({ error: "Invalid Credentials" })
    return
  }
  const storedDbPassword = userFromDB.password
  const isPasswordMatch = await bcrypt.compare(password, storedDbPassword)
  if (!isPasswordMatch) {
    res.status(400).send({ error: "Invalid Credentials" })
    return
  }
  //validate user is activated
  if(!userFromDB.isActivated){
    res.status(400).send({ error: "User is not activated" })
    return
  }
  const token = jwt.sign({_id:userFromDB._id},process.env.secret_key)
  res.status(201).json({ message: "Login successfully", token })
})

//forget password API
router.post('/forget-password', async (req, res) => {
  const { username } = req.body
  const userFromDB = await getUserByName(username)

  //validate username
  if (!userFromDB) {
    res.status(400).send({ error: "Invalid Credentials" })
    return
  }
  //generating random string
  const resetToken = genToken()
  const expirationTime = Date.now() + 60 * 60 * 1000 //Expires in 1 hour
  const resetTokenExpiresAt = new Date(expirationTime)
  const storeRandomStringDb = await storeResetToken(resetToken, userFromDB, resetTokenExpiresAt)

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.email,
      pass: process.env.password
    }
  });

  // Function to send the email
  const sendEmail = {
    from: process.env.email,
    to: username,
    subject: "Password Reset Link",
    text: `random string is${resetToken}`,
    html: `<h2>The link for reset your password will expire in 1 hour.<a href='https://incredible-scone-98d7d6.netlify.app/reset-password/${resetToken}'>https://incredible-scone-98d7d6.netlify.app/reset-password/${resetToken}</a></h2>`
  };

  transporter.sendMail(sendEmail, (err, info) => {
    if (err) {
      console.log("Error sending email", err)
      res.status(500).json({ error: "Email not sent" })
    }
    else {
      console.log("Email sent", info.response)
      res.status(200).json({ message: "Email sent successfully,click that Reset Password Link", resetToken })
    }
  })

})

//reset password API
router.post('/reset-password/:token', async (req, res) => {
  const token = req.params.token
  const { newPassword, confirmPassword } = req.body

  try {
    const resetToken = await getUserByResetToken(token)

    // Check if the reset token exists in the database
    if (!resetToken) {
      return res.status(404).json({ error: 'Invalid reset token' });
    }
    const currentTime = Date.now();
    const resetTokenExpiration = resetToken.resetTokenExpiresAt.getTime();

    // Check if the reset token has expired
    if (currentTime > resetTokenExpiration) {
      return res.status(400).json({ error: 'reset token has expired' });
    }

    //check newPassword pattern
    if (!/^(?=.*?[0-9])(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[#!@%$_]).{8,}$/g.test(newPassword)) {
      res.status(400).send({ error: "password pattern does not match" })
      return
    }

    //check newPassword and confirmPassword are same
    if (newPassword !== confirmPassword) {
      return res.status(404).json({ error: 'New password and confirm password are not same' });
    }
    else {

      // Update the user's password
      const hashedPassword = await genPassword(newPassword)
      const updatePassword = await updateNewPassword(resetToken, hashedPassword)
      return res.json({ message: 'Password reset successful' });
    }

  }
  catch (error) {
    return res.status(500).json({ message: 'Internal Server Error' });
  }
})

export const UsersRouter = router