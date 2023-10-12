import express from 'express';
import { createUrl, getUrl} from '../helpers.js';
const router = express.Router()

router.post('/create-short-url',async(req,res)=>{
  const {longUrl} = req.body

  //generate shorturl
  function genShortUrl(){
    const character ='aBcDefghijklmnopqrstuvwxyz0123456789'
    let shortUrl='http:'
    for(let i=0;i<3;i++){
      shortUrl = shortUrl+character[i]+(Math.floor(Math.random()*9+1))
    }
    return shortUrl;
  }
  const shortUrl = genShortUrl()
  const url = await createUrl(longUrl,shortUrl)

  res.status(201).json({ message: "short url created successfully"})
})

router.get('/short-url/:shortUrl',async(req,res)=>{
  try{
   const shortUrl = req.params.shortUrl
   const url = await getUrl(shortUrl)
   const longUrl = url.longUrl
   if(url){
    // res.redirect(url.longUrl)
    res.status(201).json({message:"long url is",longUrl})
   }
   else{
    res.status(404).json({error: "Short Url not found"})
   }
  }
  catch(error){
    return res.status(500).json({ message: 'Internal Server Error' });
  }
})


export const UrlRouter = router