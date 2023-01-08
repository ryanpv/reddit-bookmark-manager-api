const { Router } = require("express");
const cors = require("cors");
const express = require("express");
const routing = express.Router();
const dbo = require("../db/conn");
const { ObjectId } = require("mongodb");
const { decodeToken, redditCookieAuth } = require('../middleware/index')
const axios = require('axios');
const jwt = require("jsonwebtoken");
const redditClientId = process.env.REDDIT_APP_ID
const redditSecretId = process.env.REDDIT_APP_SECRET


// GET ENTIRE CATEGORY*** only collection
routing.route("/categorylist").get(decodeToken, function (req, res) {
  // console.log('request headers ', req.headers);
  let db_connect = dbo.getDb("Category_List")
  // let query = { owner: req.user.uid }
  let query = { userId: req.user.uid }
  const projection = { categoryName: 1 } // if we want other fields, just add to this object. ie { field1: 1, field2: 1 }
  db_connect
  .collection("Category_List")
  .find(query)
  .project(projection)
  .sort(projection)
  .toArray(function (err, result) {
    if (err) throw err;
    // const resultArr = result.map(el => {return el.categoryName})
    console.log("query result", result);
    res.json(result)
  })
})


// GET SINGLE record
routing.route("/querycategory/:categoryId/:pageNum").get(decodeToken, async function (req, res) {
  let db_connect = dbo.getDb()
  // let query = { owner: req.user.uid, categoryName: req.params.categoryName };
  // let query = { _id: ObjectId(req.params.id) };
  let query = { userId: req.user.uid, categoryId: req.params.categoryId }
  // console.log(query);
  const countquery = await db_connect
  .collection("Bookmark_List")
  .countDocuments(query)

  db_connect
  .collection("Bookmark_List")
  .find(query)
  .sort({ title: 1 })
  .skip(req.params.pageNum > 1 ? parseInt(req.params.pageNum) : 0)
  // .skip(req.params.pageNum === 1 ? 0 : parseInt(req.params.pageNum))
  .limit(5) // limit for amount of posts you want to see on client side - should match client side pagination
  // .forEach(each => { if (each.title !== null)  {console.log(each.title) } else { console.log(each.link_title) } })
  .toArray(function (err, result) {
    if (err) throw err;

    // console.log("category data results", {result: result, count: countquery});
    res.send({result: result, count: countquery})
  });

});

// GET ALL saved bookmarks
routing.route("/bookmarks/:searchItem").get(decodeToken, function (req, res) {
  let db_connect = dbo.getDb("Category_List")
  let query = { '$text': { '$search' : `\"${req.params.searchItem}\"` } } // THIS QUERY METHOD IS NON-CASE SENSITIVE. split params for "and" inclusion?
  const projection = { categoryName: 1, pathName: 1, title: 1, link_title: 1 }
  // console.log(query);
  db_connect
    .collection("Bookmark_List")
    .find(query)
    .project(projection)
    .toArray(function (err, result) {
      if (err) throw err;
      console.log("query result", result);
      res.json(result) 

  })
})

// POST a CATEGORY
routing.route("/categorylist/add").post(decodeToken, function (req, res) {
  let db_connect = dbo.getDb("Category_List")
  let newObj = {
    userId: req.user.uid,
    categoryName: req.body.categoryName,
  };
  db_connect
  .collection("Category_List")
  .insertOne(newObj, function (err, response) {
    if (err) throw err;
    res.json(response)
  });

  // db_connect
  // .collection("Bookmark_List")
  // .insertOne(newObj, function (err, response) {
  //   if (err) throw err;
  //   res.json(response);
  // })
  console.log("new category", req.body);
});

// POST bookmark
routing.route("/addbookmark").post(decodeToken, function (req, res) {
  let db_connect = dbo.getDb("Category_List")
  let newObj = {
    userId: req.user.uid,
    pathName: req.body.pathname,
    title: req.body.title,
    body: req.body.body,
    link_title: req.body.link_title,
    author: req.body.author,
    subreddit: req.body.subreddit,
    categoryName: req.body.categoryName,
    categoryId: req.body.categoryId,
    over_18: req.body.over_18
  }

  db_connect
  .collection("Bookmark_List")
  .insertOne(newObj, function (err, response) {
    if (err) throw err;
    res.json(response)
    console.log(`sucessfully added bookmark`, req.body);
  })
})


// UPDATE a record
routing.route("/update/:id").post(decodeToken, function (req, res) {
  let db_connect = dbo.getDb();
  let query = { _id: ObjectId(req.params.id) };
  let newValues = {
    // $addToSet: {
    //   list: req.body
    // }
    $set: {
      pathName: req.body.pathname,
      title: req.body.title,
      link_title: req.body.link_title,
      author: req.body.author,
      subreddit: req.body.subreddit
    }
  }
  db_connect
  .collection("Bookmark_List")
  .updateOne(query, newValues)
});


// DELETE a CATEGORY
routing.route("/remove-category/:categoryName").delete(decodeToken, function (req, res) {
  let db_connect = dbo.getDb();
  // let query = { _id: ObjectId(req.params.id), userId: req.user.uid };
  let query = { userId: req.user.uid, categoryName: req.params.categoryName }
  db_connect
  .collection("Category_List")
  .deleteOne(query, function (req, response) {
    console.log("sucessfully deleted from Category_List", query);
  });

  db_connect
  .collection("Bookmark_List")
  .deleteMany(query, function (req, response) {

    console.log("sucessfully deleted from Bookmark_List", query);
    res.json(response)
  });
});

// DELETE a BOOKMARK
routing.route("/remove-bookmark/:bookmarkId").delete(decodeToken, function (req, res) {
  let db_connect = dbo.getDb();
  let query = { userId: req.user.uid, _id: ObjectId(req.params.bookmarkId) }

  db_connect
  .collection("Bookmark_List")
  .deleteOne(query, function (req, response) {
    console.log(query);
    console.log(response);
    res.json(response)
  })
})

// REDDIT API CALL FOR ACCESS TOKEN*******

routing.route('/log_callback').get(async (req, res) => {
  const code = req.query.code;
  const buf = Buffer.from(`${redditClientId}:${redditSecretId}`).toString('base64')
  const body = `grant_type=authorization_code&code=${code}&redirect_uri=http://localhost:3000/log_callback`
  const headers = {
      'Authorization': `Basic ${buf}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Access-Control-Allow-Origin': '*'
  };

  try {
    const redditResToken = await axios.post('https://www.reddit.com/api/v1/access_token', body, { headers: headers} )
    .then((res) => res.data) // returns expected response JSON body for tokens, scope, etc...

    const reddToken= redditResToken.access_token
    console.log("reddkey", reddToken);

    return res
    .cookie("access_token", reddToken, {
      httpOnly: true,
      maxAge: 86400
    })
    .status(200)
    .json({ message: "logged in successfully"})


}  catch (err) {
  console.log(err)
  res.send({msg: "something is wrong..."});
  };
});

//////////////////////////////////////////

routing.route('/saved-reddit-posts').get(redditCookieAuth, async (req, res) => {
  const reddToken = req.thisCookie;
  // console.log("reddToken: ", reddToken); // reddit token retrieved from cookie

  try{
    const reddProfile = await axios.get('https://oauth.reddit.com/api/v1/me', 
    { headers: {'authorization':`bearer ${reddToken}`}}
    )
    const redditName = reddProfile.data.name;

    const savedPosts = await axios.get(`https://oauth.reddit.com/user/${redditName}/saved`,
    { headers: {'authorization':`bearer ${reddToken}`}}
    )
    // console.log("saved posts", savedPosts.data.data.children
    // );

    const postsDataArr = savedPosts.data.data.children
    // .kind = data prefix/type (ie. t3_ = a link)
    // .data.title = title
    // .data.permalink = permalink without base url
    // .data.name = fullname/name (ie. t3_xcfot3 - kind 't3', which is link name)
    // .data.id = post id
    // .data.subreddit = subreddit name
    // .data.author = post author
    const savedData = postsDataArr.map((postData) => (postData.data))
    res.json(savedData)

  } catch (error) {
    console.log(error);
  }

})
module.exports = routing;

// instead of jwt, since firebase uses jwt, use firebase to post the reddit token?