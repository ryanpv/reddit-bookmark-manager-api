const admin = require('../firebase-config')
const axios = require('axios')
const jwt = require('jsonwebtoken');


// Middleware to verify firebase auth - passing to routes for user verification before database access
const decodeToken = async (req, res, next) => {
  const token = req.headers.authorization.split(' ')[1]

  try {

    const decodeValue = await admin.auth().verifyIdToken(token)
      if (decodeValue) {
        console.log("firebase token verified");
        
        req.user = decodeValue
        return next()
      }

  return res.status(401).send('unauthorized') //403 for forbidden
} catch (error) {
  return res.status(500).json({error, message: "internal error"})
}
}

// Middleware to acquire redditAPI token and user data (ie. username)
const redditCookieAuth = async (req, res, next) => {
  const reddCookieToken = req.cookies.access_token;
  // console.log("cookie?", reddCookieToken);     reddit token in cookie
  if(!reddCookieToken) {
    return console.log("no token avail");
    // res.json({message: "no token avail"})
  }

  try {
    req.thisCookie = reddCookieToken
    
    // req.reddToken = response.access_token;
    // console.log("Reddit API data: ", response);

    // const reddProfile = await axios.get('https://oauth.reddit.com/api/v1/me', 
    //     { headers: {'authorization':`bearer ${response.access_token}`}}
    //     )
    // req.reddUser = reddProfile.data.name;

    next()

}  catch (err) {
  console.log(err)
  res.send({msg: "something is wrong..."});
};
};


module.exports = {
  decodeToken,
  redditCookieAuth
}