var express = require('express');
var router = express.Router();

//user login post
router.post('/signin',
  //look up if the user exists in database
  function(req, res, next) {
    var db = req.db;
    var collection = db.get('userList');
    var name = req.body.name;
    var password = req.body.password;
    var id = null;
    res.set({
      "Access-Control-Allow-Origin": "http://localhost:3000",
      "Access-Control-Allow-Credentials": "true",
    });
    collection.findOne({'name': name, 'password': password}, {}, function(err, data) {
	    if (err === null) {
        if (data === null) {
          res.json({msg: "Log error"});
        }
        else {
          id = data._id;
          res.cookie('userId', id.toString());
          req.id = id;
          next();
        }
      }
      else {
        res.send({msg: err});
      }
    });
  }, 
  //retrieve related information
  function(req, res) {
    var db = req.db;
    var userList = db.get('userList');
    var postList = db.get('postList');
    var commentList = db.get('commentList');

    var mainPageData = new Object();
    mainPageData.userId = req.id;
    mainPageData.userName = null;
    mainPageData.userIcon = null;
    mainPageData.friendsId = [];
    mainPageData.friendsStar = [];
    mainPageData.friendsName = [];
    mainPageData.friendsIcon = [];
    mainPageData.postsAndComments = [];
    
    var today = new Date();
    var Month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var Week = ['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat'];
    var date = Week[today.getDay()] + ' ' + Month[today.getMonth()] + ' ' + today.getDate() + ' ' + today.getFullYear();
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    var dateTime = time +' '+ date;

    var ready = false;

    function timeConvert (timeString) {
      let splitTime = timeString.split(" ");
      let dayTime = splitTime[0];
      let month = Month.findIndex(function(ele) {return ele === splitTime[2]});
      let day = splitTime[3];
      let year = splitTime[4];
      let splitHour = dayTime.split(":");
      let hour = splitHour[0];
      let minute = splitHour[1];
      let second = splitHour[2];
      let date = new Date();
      date.setDate(day);
      date.setMonth(month);
      date.setFullYear(year);
      date.setHours(hour, minute, second);
      return date;
    }
    //update lastCommentRetrievalTime of the user’s record
    userList.update({"_id": mainPageData.userId}, {$set: {'lastCommentRetrievalTime': dateTime}});

    userList.findOne({"_id": mainPageData.userId}, {}, function(err, info) {
      if (err === null) {
        //user information
        mainPageData.userName = info.name;
        mainPageData.userIcon = info.icon;
        //friend information (id, star or not)
        if (info.friends != null && info.friends != "") {
          info.friends.map( friend => {
            //friend info part 1
            mainPageData.friendsId.push(friend.friendId);
            mainPageData.friendsStar.push(friend.starredOrNot);

            //friend info part 2
            userList.findOne({"_id": friend.friendId}, {}, function(err, data) { 
              if (err === null) {
                mainPageData.friendsName.push(data.name);
                mainPageData.friendsIcon.push(data.icon);
              }
              else {
                res.send({msg: err});
              }
            });

            //post information
            postList.find({"userId": friend.friendId}, {}, function(err, posts) {
              if (err === null) {
                if (posts != null && posts.length != 0) {
                  //comment Info
                  posts.map( post => {
                    var postAndComment = new Object();
                    postAndComment.post = post;
                    //info of the person who post this post
                    userList.findOne({"_id": post.userId}, {}, function(err, data) {
                      if (err === null) {
                        let postOwner = new Object();
                        postOwner.id = post.userId.toString();
                        postOwner.name = data.name;
                        postOwner.icon = data.icon;
                        mainPageData.friendsId.map(friendId => {
                          if (friendId === data._id.toString()) {
                            let index = mainPageData.friendsId.findIndex(x => x == friendId);
                            postOwner.star = mainPageData.friendsStar[index];
                          }
                        });
                        postAndComment.owner = postOwner;
                      }
                      else {
                        res.send({msg: err});
                      }
                    })
                    commentList.find({"postId": post._id.toString(), "deleteTime": ""}, {}, function(err, comments) {
                      if (err === null) {
                        if (comments != null && comments.length != 0) {
                          for (let n = 0; n < comments.length; n++) {
                            for (let m = 0; m < mainPageData.friendsId.length; m++) {
                              if (mainPageData.friendsId[m].toString() === comments[n].userId) {
                                comments.splice(n, 1);
                                n--;
                                break;
                              }
                            }
                          }
                          if (comments != null && comments.length != 0) {
                            //handle multiple comments of one post
                            comments.map( comment => {
                              userList.findOne({"_id": comment.userId}, {name: 1, _id: 1}, function(err, commentName) {
                                if (err === null) {
                                  if (commentName.name != null) {
                                    comment.name = commentName.name;
                                  }
                                  //concantenate posts and comments
                                  if (comment === comments[comments.length-1]) {
                                    postAndComment.comment = comments;
                                    mainPageData.postsAndComments.push(postAndComment);
                                    if (post === posts[posts.length-1] && (friend === info.friends[info.friends.length-1] || ready)) {
                                      //sort posts
                                      mainPageData.postsAndComments.sort(function(a, b) {
                                        if (timeConvert(a.post.time) < timeConvert(b.post.time)) {
                                          return -1;
                                        }
                                        else {
                                          return 1;
                                        }
                                      })
                                      //sort comments
                                      for (let i = 0; i < mainPageData.postsAndComments.length; i++) {
                                        if (mainPageData.postsAndComments[i].comment != null) {
                                          mainPageData.postsAndComments[i].comment.sort(function(a, b) {
                                            if (timeConvert(a.postTime) < timeConvert(b.postTime)) {
                                              return -1;
                                            }
                                            else {
                                              return 1;
                                            }
                                          })
                                        }
                                      }
                                      //send back the retrieved data
                                      res.json(mainPageData);
                                    }
                                  }
                                }
                                else {
                                  res.send({msg: err});
                                }
                              });
                            })
                          }
                          else {
                            postAndComment.comment = null;
                            mainPageData.postsAndComments.push(postAndComment);
                            if (post === posts[posts.length-1] && friend === info.friends[info.friends.length-1]) {
                              //sort posts
                              mainPageData.postsAndComments.sort(function(a, b) {
                                if (timeConvert(a.post.time) < timeConvert(b.post.time)) {
                                  return -1;
                                }
                                else {
                                  return 1;
                                }
                              })
                              //sort comments
                              for (let i = 0; i < mainPageData.postsAndComments.length; i++) {
                                if (mainPageData.postsAndComments[i].comment != null) {
                                  mainPageData.postsAndComments[i].comment.sort(function(a, b) {
                                    if (timeConvert(a.postTime) < timeConvert(b.postTime)) {
                                      return -1;
                                    }
                                    else {
                                      return 1;
                                    }
                                  })
                                }
                              }
                              //send back the retrieved data
                              res.json(mainPageData);
                            }
                          }
                        }
                        else {
                          postAndComment.comment = null;
                          mainPageData.postsAndComments.push(postAndComment);
                          if (post === posts[posts.length-1] && friend === info.friends[info.friends.length-1]) {
                            //sort posts
                            mainPageData.postsAndComments.sort(function(a, b) {
                              if (timeConvert(a.post.time) < timeConvert(b.post.time)) {
                                return -1;
                              }
                              else {
                                return 1;
                              }
                            })
                            //sort comments
                            for (let i = 0; i < mainPageData.postsAndComments.length; i++) {
                              if (mainPageData.postsAndComments[i].comment != null) {
                                mainPageData.postsAndComments[i].comment.sort(function(a, b) {
                                  if (timeConvert(a.postTime) < timeConvert(b.postTime)) {
                                    return -1;
                                  }
                                  else {
                                    return 1;
                                  }
                                })
                              }
                            }
                            //send back the retrieved data
                            res.json(mainPageData);
                          }
                        }
                      }
                      else {
                        res.send({msg: err});
                      }
                    });
                  });
                }
                else{
                  //handle case of no posts
                  if (friend === info.friends[info.friends.length-1]) {
                    ready = true;
                  }
                }
              }
              else {
                res.send({msg: err});
              }
            });
          })
        }
        //handle case of no friends
        else {
          res.json(mainPageData);
        }
      }
      else {
        res.send({msg: err});
      }
    });
  }
);

//user logout
router.get('/logout', function(req, res) {
  var db = req.db;
  var userList = db.get('userList');
  var id = req.cookies.userId;
  res.set({
    "Access-Control-Allow-Origin": "http://localhost:3000",
    "Access-Control-Allow-Credentials": "true",
  });
  userList.update({"_id": id}, {$set: {'lastCommentRetrievalTime': ''}});
  res.clearCookie('userId');
  res.json("");
});

//user profile
router.get('/getuserprofile', function(req, res) {
  var db = req.db;
  var userList = db.get('userList');
  var id = req.cookies.userId;
  res.set({
    "Access-Control-Allow-Origin": "http://localhost:3000",
    "Access-Control-Allow-Credentials": "true",
  });
  userList.findOne({"_id": id}, {mobileNumber: 1, homeNumber: 1, address: 1}, function(err, data) {
    if (err === null) {
      res.json(data);
    }
    else {
      res.send({msg: err});
    }
  })
});

//user update portfolio
router.put('/saveuserprofile', function(req, res) {
  var db = req.db;
  var userList = db.get('userList');
  var id = req.cookies.userId;
  res.set({
    "Access-Control-Allow-Origin": "http://localhost:3000",
    "Access-Control-Allow-Credentials": "true",
  });
  var mobileNumber = req.body.newMobileNumber;
  var homeNumber = req.body.newHomeNumber;
  var address = req.body.newAddress;

  userList.update({"_id": id}, {$set: {'mobileNumber': mobileNumber, 'homeNumber': homeNumber, 'address': address}}, function(err) {
    if (err === null) {
      res.json("");
    }
    else {
      res.send({msg: err});
    }
  })
});

//update friends star
router.get('/updatestar/:friendid', function(req, res) {
  var db = req.db;
  var userList = db.get('userList');
  var id = req.cookies.userId;
  res.set({
    "Access-Control-Allow-Origin": "http://localhost:3000",
    "Access-Control-Allow-Credentials": "true",
  });
  var friendid = req.params.friendid.toString();
  var friendsInfo = null;
  userList.findOne({"_id": id}, {friends: 1, _id: 0}, function(err, data) {
    if (err === null) {
      friendsInfo = data.friends;
      for (var i = 0; i < friendsInfo.length; i++) {
        if (friendsInfo[i].friendId === friendid) {
          if (friendsInfo[i].starredOrNot === 'Y') {
            friendsInfo[i].starredOrNot = 'N';
          }
          else {
            friendsInfo[i].starredOrNot = 'Y';
          }
          break;
        } 
      }
      userList.update({"_id": id}, {$set: {'friends': friendsInfo}}, function(err) {
        if (err === null) {
          res.json("");
        }
        else {
          res.send({msg: err});
        }
      });
    }
    else {
      res.send({msg: err});
    }
  })
});

//add comment
router.post('/postcomment/:postid', function(req, res) {
  var db = req.db;
  var commentList = db.get('commentList');
  var id = req.cookies.userId;
  res.set({
    "Access-Control-Allow-Origin": "http://localhost:3000",
    "Access-Control-Allow-Credentials": "true",
  });
  var postid = req.params.postid;

  var today = new Date();
  var Month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var Week = ['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat'];
  var date = Week[today.getDay()] + ' ' + Month[today.getMonth()] + ' ' + today.getDate() + ' ' + today.getFullYear();
  var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  var dateTime = time +' '+ date;

  var newComment = new Object();
  newComment.postId = postid;
  newComment.userId = id;
  newComment.postTime = dateTime;
  newComment.comment = req.body.comment;
  newComment.deleteTime = '';
  commentList.insert(newComment, function(err) {
    if (err === null) {
      res.json("");
    }
    else {
      res.send({msg: err});
    }
  });
});

//delete comment
router.delete('/deletecomment/:commentid', function(req, res) {
  var db = req.db;
  var commentList = db.get('commentList');
  res.set({
    "Access-Control-Allow-Origin": "http://localhost:3000",
    "Access-Control-Allow-Credentials": "true",
  });
  var commentid = req.params.commentid;
  var today = new Date();
  var Month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var Week = ['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat'];
  var date = Week[today.getDay()] + ' ' + Month[today.getMonth()] + ' ' + today.getDate() + ' ' + today.getFullYear();
  var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  var dateTime = time +' '+ date;

  commentList.update({"_id": commentid}, {$set: {'deleteTime': dateTime}}, function(err) {
    if (err === null) {
      res.json("");
    }
    else {
      res.send({msg: err});
    }
  });
});

//load updated comment
router.get('/loadcommentupdates', function(req, res) {
  var db = req.db;
  var userList = db.get('userList');
  var commentList = db.get('commentList');
  var id = req.cookies.userId;
  res.set({
    "Access-Control-Allow-Origin": "http://localhost:3000",
    "Access-Control-Allow-Credentials": "true",
  });
  var today = new Date();
  var Month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var Week = ['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat'];
  var date = Week[today.getDay()] + ' ' + Month[today.getMonth()] + ' ' + today.getDate() + ' ' + today.getFullYear();
  var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  var dateTime = time + ' ' + date;

  var timeConvert = function (timeString) {
    let splitTime = timeString.split(" ");
    let dayTime = splitTime[0];
    let month = Month.findIndex(function(ele) {return ele === splitTime[2]});
    let day = splitTime[3];
    let year = splitTime[4];
    let splitHour = dayTime.split(":");
    let hour = splitHour[0];
    let minute = splitHour[1];
    let second = splitHour[2];
    let date = new Date();
    date.setDate(day);
    date.setMonth(month);
    date.setFullYear(year);
    date.setHours(hour, minute, second);
    return date;
  }
  var lastCommentRetrievalTime = null;
  var newComment = [];
  var deletedComment = [];
  var updateInfo = new Object();

  //find lastRetrievalTime
  userList.findOne({"_id": id}, {'lastCommentRetrievalTime': 1}, function(err, data) {
    if (err === null) {
      lastCommentRetrievalTime = timeConvert(data.lastCommentRetrievalTime);
      
      commentList.find({}, {}, function(error, docs) {
        if (error === null) {
          //find new comment and deleted comment
          docs.forEach(doc => {
            if (timeConvert(doc.postTime) > lastCommentRetrievalTime) {
              newComment.push(doc);
            }
            if (timeConvert(doc.deleteTime) > lastCommentRetrievalTime) {
              deletedComment.push(doc._id);
            }
          });
          
          //update lastCommentRetrievalTime
          userList.update({"_id": id}, {$set: {'lastCommentRetrievalTime': dateTime}}, function(err) {
            if (err === null) {
              //compose json string
              if (newComment && newComment.length != 0) {
                newComment.forEach(nc => {
                  userList.findOne({"_id": nc.userId}, {name: 1, _id: 1}, function(err, commentName) {
                    if (err === null) {
                      nc.name = commentName.name;
                      if (nc === newComment[newComment.length-1]) {
                        updateInfo.newComment = newComment;
                        updateInfo.deletedComment = deletedComment;
                        res.json(updateInfo);
                      }
                    }
                    else {
                      res.send({msg: err});
                    }
                  })
                })
              }
              else {
                updateInfo.newComment = newComment;
                updateInfo.deletedComment = deletedComment;
                res.json(updateInfo);
              }
            }
            else {
              res.send({msg: err});
            }
          });
        }
        else {
          res.send({msg: error});
        }
      });
    }
    else {
      res.send({msg: err});
    }
  });
});

//Handle preflighted request

router.options("/*", function(req, res, next){
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header("Access-Control-Allow-Credentials", "true");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
  res.send(200);
});


module.exports = router;
