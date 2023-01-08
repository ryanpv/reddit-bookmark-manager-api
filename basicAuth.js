const admin = require('firebase-admin/app');

const app = admin.initializeApp({
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
})

module.exports = {
  app
}

// function authUser(req, res, next) {
//   if (req.user) {
//   auth.getAuth()
//   .verifyIdToken(idToken)
//   .then((decodedToken) => {
//     const uid = decodedToken.uid
//     console.log(uid);
//   })
//   next()
// } else {
//   res.send({message: "you need to sign in"})
// }
// }
// module.exports = { 
//   authUser
// }