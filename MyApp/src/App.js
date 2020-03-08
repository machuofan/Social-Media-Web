import React from 'react';
import ReactDOM from 'react-dom';
import './App.css';
import $ from 'jquery';

class UserInfo extends React.Component {
  constructor(props){
    super(props);
    this.JumpToPortfolio = this.JumpToPortfolio.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
  }

  handleLogout(e) {
    this.props.handleLogout(e);
  }

  JumpToPortfolio() {
    this.props.JumpToPortfolio();
  }

  render() {
    return (
      <div className = "userInfo">
        <img src={this.props.icon} onClick={this.JumpToPortfolio} alt={this.props.icon}/>
        <button className="myButton" onClick={this.handleLogout}>Log out</button><br/>
        <span onClick={this.JumpToPortfolio}>{this.props.name}</span><br/><br/>
      </div>
    )
  }
}

class FriendsInfo extends React.Component {
  render() {
    let rows = [];
    let friendsId = this.props.friendsId;
    let friendsName = this.props.friendsName;
    let friendsIcon = this.props.friendsIcon;
    let friendsStar = this.props.friendsStar;
    if (friendsId != null) {
      for (let i = 0; i < friendsId.length; i++) {
        if (friendsStar[i] === 'Y') {
          rows.push(
            <FriendRow
              friendId = {friendsId[i]}
              friendName = {friendsName[i]}
              friendIcon = {friendsIcon[i]}
            />
          );
        }
      }
    }
    return (
      <div className = "friendsInfo">
      <br/>
        <span>Friends List:</span><br/>
        <table>
          <tbody>{rows}</tbody>
        </table>
      </div>
    );
  }
}

class FriendRow extends React.Component {
  render() {
    return (
      <tr id = {this.props.friendId}>
        <td><img src={this.props.friendIcon} alt={this.props.friendIcon}/></td>
        <td>{this.props.friendName}</td>
      </tr>
    );
  }
}

class PostAndCommentInfo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      newComment: null,
      deletedComment: null,
    }
    this.postComment = this.postComment.bind(this);
    this.deleteComment = this.deleteComment.bind(this);
    this.starSwitch = this.starSwitch.bind(this);
    this.updateComment = this.updateComment.bind(this);
  }

  componentDidMount() {
    this.timerID = setInterval(
      () => this.updateComment(),
      10000
    );
  }

  componentWillUnmount() {
    clearInterval(this.timerID);
  }

  postComment(e) {
    this.props.postComment(e);
  }

  deleteComment(e) {
    this.props.deleteComment(e);
  }

  starSwitch(e) {
    this.props.starSwitch(e);
  }

  updateComment() {
    $.ajax({
      url: "http://localhost:3001/loadcommentupdates",
      type: 'GET',
      xhrFields: {withCredentials: true},
      dataType: 'json',
      success: function(data) {
        this.setState({
          newComment: data.newComment,
          deletedComment: data.deletedComment
        })
      }.bind(this),
      error: function (xhr, ajaxOptions, thrownError) {
        alert(xhr.status);
        alert(thrownError);
      }.bind(this)
    });
  }

  render() {
    let rows = [];

    if (this.props.postsAndComments != null) {
      this.props.postsAndComments.map((postAndComment) => {

        if (this.state.deletedComment && this.state.deletedComment.length > 0) {
          for (let i = 0; i < this.state.deletedComment.length; i++) {
            if (postAndComment.comment && postAndComment.comment.length > 0) {
              for (let j = 0; j < postAndComment.comment.length; j++) {
                if (this.state.deletedComment[i].toString() === postAndComment.comment[j]._id.toString()) {
                  postAndComment.comment.splice(j, 1);
                }
              }
            }
          }
        }
        if (this.state.newComment && this.state.newComment.length > 0) {
          for (let m = 0; m < this.state.newComment.length; m++) {
            if (postAndComment.post) {
              if (postAndComment.post._id.toString() === this.state.newComment[m].postId) {
                if (postAndComment.comment && postAndComment.comment.length > 0) {
                  let check = true;
                  for (let n = 0; n < postAndComment.comment.length; n++) {
                    if (this.state.newComment[m]._id.toString() === postAndComment.comment[n]._id.toString()) {
                      check = false;
                    }
                  }
                  if (check) {
                    postAndComment.comment.push(this.state.newComment[m]);
                  }
                }
              }
            }
          }
        }

        rows.push(
          <PostAndCommentBlock
            userName = {this.props.userName}
            postAndComment = {postAndComment}
            postComment = {this.postComment}
            deleteComment = {this.deleteComment}
            starSwitch = {this.starSwitch}
          />
        );
      })
    }
      if (this.state.deletedComment) {

      }
    return(
      <div className = "postsAndComments">
        {rows}
      </div>
    );
  }
}

class PostAndCommentBlock extends React.Component {
  constructor(props){
    super(props);
    this.postComment = this.postComment.bind(this);
    this.deleteComment = this.deleteComment.bind(this);
    this.starSwitch = this.starSwitch.bind(this);
  }
  postComment(e) {
    this.props.postComment(e);
    e.target.firstElementChild.value = '';
  }

  deleteComment(e) {
    this.props.deleteComment(e);
  }

  starSwitch(e) {
    this.props.starSwitch(e);
  }

  render() {
    var path = '';
    if (this.props.postAndComment.owner.star === 'Y') {
      path = "icons/starred.png";
    }
    else {
      path = "icons/notStarred.png";
    }

    var commentRow = [];
    if (this.props.postAndComment.comment != null) {
      this.props.postAndComment.comment.forEach(review => {
        if (review.name == this.props.userName) {
          var element = 
          <div id={review._id} onDoubleClick={this.deleteComment}>
            <img className="clock" src={"icons/clock.png"}/>
            <span className="commentTime">{review.postTime}</span>
            <span className="commentName">You</span> commented: 
            <p className="commentContent">{review.comment}</p>
          </div>;
        }
        else {
          var element = 
          <div id={review._id}>
            <img className="clock" src={"icons/clock.png"}/>
            <span className="commentTime">{review.postTime}</span>
            <span className="commentName">{review.name}</span> commented: 
            <p className="commentContent">{review.comment}</p>
          </div>;
        }
        commentRow.push(element);
      })
    };
    return(
      <div className="pacBlock">
      <p className="postBlock">
        <img src={this.props.postAndComment.owner.icon} className="postIcon" alt="postIcon"/><br/>
        <span className="postName">{this.props.postAndComment.owner.name}</span>
        <img src={path} className="starIcon" id={this.props.postAndComment.owner.id} onClick={this.starSwitch} alt="starIcon"/><br/><br/>
        <img src="icons/clock.png" className="clock" alt="clock"/>
        <span className="postTime">{this.props.postAndComment.post.time}</span>
        <img src="icons/map.png" className="map" alt="map"/>
        <span className="postLocation">{this.props.postAndComment.post.location}</span><br/><br/>
        <span className="postContent">{this.props.postAndComment.post.content}</span>
      </p>
      
      <div className="commentBlock">{commentRow}</div>
      <div className="inputBlock">
      <form id={this.props.postAndComment.post._id} onSubmit={this.postComment}>
        <input className="commentInput"
          type="text"
          placeholder="Write your thoughts here"
        />
      </form>
      </div>
      </div>
    )
  }
}

class UserPortfolio extends React.Component {
  constructor(props) {
    super(props);
    this.handleInfoChange = this.handleInfoChange.bind(this);
    this.handleMobilNumChange = this.handleMobilNumChange.bind(this);
    this.handleHomeNumChange = this.handleHomeNumChange.bind(this);
    this.handleAddressChange = this.handleAddressChange.bind(this);
  }

  handleInfoChange(e) {
    e.preventDefault();
    this.props.handleInfoChange();
  }

  handleMobilNumChange(e) {
    e.preventDefault();
    this.props.handleMobilNumChange(e.target.value);
  }

  handleHomeNumChange(e) {
    e.preventDefault();
    this.props.handleHomeNumChange(e.target.value);
  }

  handleAddressChange(e) {
    e.preventDefault();
    this.props.handleAddressChange(e.target.value);
  }

  render() {
    return(
      <div className="portfolio">
        <div className="portfolioHead">
          <img src={this.props.icon} alt="User icon"/><br/>
          <span>{this.props.name}</span>
        </div><br/>
        <form>
          Mobile Number: 
          <input 
            className="input_text"
            type="text"
            placeholder={this.props.portfolio.mobileNumber}
            onChange={this.handleMobilNumChange}
          /><br/><br/>
          Home Number: 
          <input 
            className="input_text"
            type="text"
            placeholder={this.props.portfolio.homeNumber}
            onChange={this.handleHomeNumChange}
          /><br/><br/>
          Address: 
          <input 
            className="input_text"
            type="text"
            placeholder={this.props.portfolio.address}
            onChange={this.handleAddressChange}
          /><br/><br/>
          <button className="myButton" onClick={this.handleInfoChange}>Save</button>
        </form>
      </div>
    )
  }
}


class MainPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      login: false,
      editInfo: false,
      name: '',
      password: '',
      icon: '',
      friendsId: '',
      friendsStar: '',
      friendsName: '',
      friendsIcon: '',
      postsAndComments: '',
      portfolio: {mobileNumber: '', homeNumber: '', address: ''},
      newMobileNumber: '',
      newHomeNumber: '',
      newAddress: '',
      newComment: ''
    };
    this.handleInputId = this.handleInputId.bind(this);
    this.handleInputPassword = this.handleInputPassword.bind(this);
    this.loadContent = this.loadContent.bind(this);
    this.handleSignin = this.handleSignin.bind(this);
    this.handleLogout = this.handleLogout.bind(this);
    this.postComment = this.postComment.bind(this);
    this.deleteComment = this.deleteComment.bind(this);
    this.JumpToPortfolio = this.JumpToPortfolio.bind(this);
    this.starSwitch = this.starSwitch.bind(this);
    this.handleInfoChange = this.handleInfoChange.bind(this);
    this.handleMobilNumChange = this.handleMobilNumChange.bind(this);
    this.handleHomeNumChange = this.handleHomeNumChange.bind(this);
    this.handleAddressChange = this.handleAddressChange.bind(this);
  }

  handleInputId(e) {
    this.setState({
      name: e.target.value
    });
  }

  handleInputPassword(e) {
    this.setState({
      password: e.target.value
    })
  }

  loadContent() {
    $.ajax({
      type: 'POST',
      url: "http://localhost:3001/signin",
      data: {"name": this.state.name, "password": this.state.password},
      xhrFields: {withCredentials: true},
      dataType: 'json',
      xhrFields: {withCredentials: true},
      success: function(data) {
        if (data.msg === "Log error") {
          alert("Login Error! Wrong user name or password");
        }
        else {
          this.setState({
            login: true, 
            name: data.userName,
            icon: data.userIcon,
            friendsId: data.friendsId,
            friendsStar: data.friendsStar,
            friendsName: data.friendsName,
            friendsIcon: data.friendsIcon,
            postsAndComments: data.postsAndComments,
          });
        } 
      }.bind(this),
      error: function (xhr, ajaxOptions, thrownError) {
        alert(xhr.status);
        alert(thrownError);
      }.bind(this)
    });
  }

  handleSignin(e) {
    e.preventDefault();
    this.loadContent();
  }

  handleLogout(e) {
    e.preventDefault();
    $.ajax({
      type: 'GET',
      url: "http://localhost:3001/logout",
      xhrFields: {withCredentials: true},
      credentials: 'include',
      dataType: 'json',
      success: function(data) {
        if (data === "") {
          this.setState({
            login: false,
            editInfo: false,
            name: '',
            password: '',
            icon: '',
            friendsId: '',
            friendsStar: '',
            friendsName: '',
            friendsIcon: '',
            postsAndComments: '',
            portfolio: {mobileNumber: '', homeNumber: '', address: ''},
            newMobileNumber: '',
            newHomeNumber: '',
            newAddress: '',
            newComment: ''
          });
        }
      }.bind(this),
      error: function (xhr, ajaxOptions, thrownError) {
        alert(xhr.status);
        alert(thrownError);
     }.bind(this)
    });
  }

  JumpToPortfolio() {
    $.ajax({
      type: 'GET',
      url: "http://localhost:3001/getuserprofile",
      xhrFields: {withCredentials: true},
      dataType: 'json',
      success: function(data) {
        this.setState({
          editInfo: true,
          portfolio: {
            'mobileNumber': data.mobileNumber,
            'homeNumber': data.homeNumber,
            'address': data.address
          } 
        });
      }.bind(this),
      error: function (xhr, ajaxOptions, thrownError) {
        alert(xhr.status);
        alert(thrownError);
      }.bind(this)
    });
  }

  postComment(e) {
    e.preventDefault();
    $.ajax({
      type: 'POST',
      url: "http://localhost:3001/postcomment/" + e.target.id,
      xhrFields: {withCredentials: true},
      dataType: 'json',
      data: {"comment": e.target.firstElementChild.value},
      success: function(data) {
        this.loadContent();
      }.bind(this),
      error: function (xhr, ajaxOptions, thrownError) {
        alert(xhr.status);
        alert(thrownError);
      }.bind(this)
    });
  }

  deleteComment(e) {
    e.preventDefault();
    var confirmation = window.confirm('Delete this message?');
    if (confirmation === true) {
      $.ajax({
        url: "http://localhost:3001/deletecomment/" + e.target.id,
        xhrFields: {withCredentials: true},
        type: 'DELETE',
        dataType: 'json',
        success: function(data) {
          this.loadContent();
        }.bind(this),
        error: function (xhr, ajaxOptions, thrownError) {
          alert(xhr.status);
          alert(thrownError);
        }.bind(this)
      });
    }
  }

  starSwitch(e) {
    e.preventDefault();
    $.ajax({
      url: "//localhost:3001/updatestar/" + e.target.id,
      type: 'GET',
      dataType: 'json',
      xhrFields: {withCredentials: true},
      success: function(data) {
        this.loadContent();
      }.bind(this),
      error: function (xhr, ajaxOptions, thrownError) {
        alert(xhr.status);
        alert(thrownError);
    }.bind(this)
    });
  }

  handleMobilNumChange(value) {
    this.setState({
      newMobileNumber: value
    });
  }

  handleHomeNumChange(value) {
    this.setState({
      newHomeNumber: value
    });
  }

  handleAddressChange(value) {
    this.setState({
      newAddress: value
    });
  }

  handleInfoChange() {
    var newInfo = new Object();
    if (this.state.newMobileNumber != '') {
      newInfo.newMobileNumber = this.state.newMobileNumber;
    }
    else {
      newInfo.newMobileNumber = this.state.portfolio.mobileNumber;
    }
    if (this.state.newHomeNumber != '') {
      newInfo.newHomeNumber = this.state.newHomeNumber;
    }
    else {
      newInfo.newHomeNumber= this.state.portfolio.homeNumber;
    }
    if (this.state.newAddress != '') {
      newInfo.newAddress = this.state.newAddress;
    }
    else {
      newInfo.newAddress = this.state.portfolio.address;
    }
    $.ajax({
      url: "http://localhost:3001/saveuserprofile",
      type: 'PUT',
      data: newInfo,
      xhrFields: {withCredentials: true},
      dataType: 'json',
      success: function(data) {
        this.setState({
          portfolio: {
            'mobileNumber': newInfo.newMobileNumber,
            'homeNumber': newInfo.newHomeNumber,
            'address': newInfo.newAddress
          },
          newMobileNumber: '',
          newHomeNumber: '',
          newAddress: '',
          editInfo: false,
        });
      }.bind(this),
      error: function (xhr, ajaxOptions, thrownError) {
        alert(xhr.status);
        alert(thrownError);
      }.bind(this)
    });
  }

  render() {
    if (this.state.login) {
      if (this.state.editInfo) {
        return (
          <div className = 'wrapper'>
          <div className="header">
          <h1>Bai He Hun Lian</h1>
          <p className="sub_header">Find your soul mate here</p>
          </div>
          <UserInfo
            name = {this.state.name}
            icon = {this.state.icon}
            handleLogout = {this.handleLogout}
            JumpToPortfolio = {this.JumpToPortfolio}
          />
          <FriendsInfo
            friendsId = {this.state.friendsId}
            friendsStar = {this.state.friendsStar}
            friendsName = {this.state.friendsName}
            friendsIcon = {this.state.friendsIcon}
          />
          <UserPortfolio
            portfolio = {this.state.portfolio}
            name = {this.state.name}
            icon = {this.state.icon}
            handleInfoChange = {this.handleInfoChange}
            handleMobilNumChange = {this.handleMobilNumChange}
            handleHomeNumChange = {this.handleHomeNumChange}
            handleAddressChange = {this.handleAddressChange}
          />
        </div>
        );
      }
      else {
        return (
          <div className = 'wrapper'>
            <div className="header">
            <h1>Bai He Hun Lian</h1>
            <p className="sub_header">Find your soul mate here</p>
            </div>
            <UserInfo
              name = {this.state.name}
              icon = {this.state.icon}
              handleLogout = {this.handleLogout}
              JumpToPortfolio = {this.JumpToPortfolio}
            />
            <FriendsInfo
              friendsId = {this.state.friendsId}
              friendsStar = {this.state.friendsStar}
              friendsName = {this.state.friendsName}
              friendsIcon = {this.state.friendsIcon}
            />
            <PostAndCommentInfo
              userName = {this.state.name}
              friendsId = {this.state.friendsId}
              friendsName = {this.state.friendsName}
              friendsIcon = {this.state.friendsIcon}
              friendsStar = {this.state.friendsStar}
              postsAndComments = {this.state.postsAndComments}
              postComment = {this.postComment}
              deleteComment = {this.deleteComment}
              starSwitch = {this.starSwitch}
            />
          </div>
        );
      }
      
    }
    else {
      return (
        <div className = 'wrapper'>
          <div className="header">
          <h1>Bai He Hun Lian</h1>
          <p className="sub_header">Find your soul mate here</p>
          </div>
          <div>
            <form className="loginForm">
              UserName:     
              <input
                className = "input_text"
                type = "text"
                placeholder = "User Name"
                value = {this.state.name}
                onChange = {this.handleInputId}
              />
              <br/><br/>
              Password:
              <input
                className = "input_text"
                type = "password"
                placeholder = "Password"
                value = {this.state.password}
                onChange = {this.handleInputPassword}
              />
              <br/><br/>
              <button 
                className="myButton" 
                onClick={this.handleSignin}>
                Sign in
              </button>
            </form>
          </div>
        </div>
      );
    }

  }

}

export default MainPage;
