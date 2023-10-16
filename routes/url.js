import express from 'express';
import { createUrl, getShortUrl,updateCount,getAllUrls,totalUrlsPerDay} from '../helpers.js';
const router = express.Router()

//Api to create short url
router.post('/create-short-url',async(req,res)=>{
  const {longUrl} = req.body

  //validate longurl
  if(!longUrl){
    res.status(400).send({ error: "long url required" })
    return
  }

  //generate shorturl
  function genShortUrl(){
    const character ='aBcDefG'
    let shortUrl=''
    for(let i=0;i<3;i++){
      shortUrl = shortUrl+character[i]+(Math.floor(Math.random()*9+1))
    }
    return shortUrl;
  }
  const shortUrl = genShortUrl()
  const url = await createUrl(longUrl,shortUrl)

  res.status(201).json({ message: "short url created successfully",shortUrl})
})

//Api to update click count
router.post('/short-url/:shortUrl',async(req,res)=>{
  try{
   const shortUrl = req.params.shortUrl
   const url = await getShortUrl(shortUrl)

   //short url is there update click count
   if(url){
    const shortUrlId = url._id
    const updateCountDb = await updateCount(shortUrlId)
    res.status(201).json({message:"Short Url count updated successfully"})
   }
   else{
    return res.status(404).json({ error:"Short url not found"})
  }
  }
  
  catch(error){
    return res.status(500).json({ message: 'Internal Server Error' });
  }
})

//Api to get all urls
router.get('/get-all-urls',async(req,res)=>{
  
  const getAllUrlsFromDb = await getAllUrls(req)
  res.json(getAllUrlsFromDb)
})

router.get('/urls-per-day',async(req,res)=>{
  try {
    const result = await totalUrlsPerDay(req);
    res.json({ success: true, result });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
})

export const UrlRouter = router