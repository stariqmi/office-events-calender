var server = require('./server');
var router = require('./router');
var authHelper = require('./authHelper');
var handlers = require('./handlers');
var microsoftGraph = require("@microsoft/microsoft-graph-client");
var pug = require('pug');

var handle = {};
handle['/'] = home;
handle['/authorize'] = authorize;
handle['/events'] = events;
handle['/map']  = map;
handle['/public/js/main.js'] = handlers.static;
handle['/public/css/main.css'] = handlers.static;

server.start(router.route, handle);

function home(response, request) {
  const html = pug.renderFile('./templates/home.pug', { authLink: authHelper.getAuthUrl()})
  response.writeHead(200, { 'Content-Type': 'text/html' })
  response.write(html)
  response.end();
}

var url = require('url');
function authorize(response, request) {
  console.log('Request handler \'authorize\' was called.');
  
  // The authorization code is passed as a query parameter
  var url_parts = url.parse(request.url, true);
  var code = url_parts.query.code;
  console.log('Code: ' + code);
  authHelper.getTokenFromCode(code, tokenReceived, response);
}

function tokenReceived(response, error, token) {
  if (error) {
    console.log('Access token error: ', error.message);
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.write('<p>ERROR: ' + error + '</p>');
    response.end();
  } else {
    getUserEmail(token.token.access_token, function(error, email){
      if (error) {
        console.log('getUserEmail returned an error: ' + error);
        response.write('<p>ERROR: ' + error + '</p>');
        response.end();
      } else if (email) {
        var cookies = ['node-tutorial-token=' + token.token.access_token + ';Max-Age=4000',
                       'node-tutorial-refresh-token=' + token.token.refresh_token + ';Max-Age=4000',
                       'node-tutorial-token-expires=' + token.token.expires_at.getTime() + ';Max-Age=4000',
                       'node-tutorial-email=' + email + ';Max-Age=4000'];
        response.setHeader('Set-Cookie', cookies);
        var location = process.env.ENV === 'development' ? 'http://localhost:8000/map' : 'https://office-events-map.herokuapp.com/map';
        response.writeHead(302, {'Location': location});
        response.end();
      }
    }); 
  }
}

function getUserEmail(token, callback) {
  // Create a Graph client
  var client = microsoftGraph.Client.init({
    authProvider: (done) => {
      // Just return the token
      done(null, token);
    }
  });

  // Get the Graph /Me endpoint to get user email address
  client
    .api('/me')
    .get((err, res) => {
      if (err) {
        callback(err, null);
      } else {
        callback(null, res.mail);
      }
    });
}

function getValueFromCookie(valueName, cookie) {
  if (cookie.indexOf(valueName) !== -1) {
    var start = cookie.indexOf(valueName) + valueName.length + 1;
    var end = cookie.indexOf(';', start);
    end = end === -1 ? cookie.length : end;
    return cookie.substring(start, end);
  }
}

function getAccessToken(request, response, callback) {
  var expiration = new Date(parseFloat(getValueFromCookie('node-tutorial-token-expires', request.headers.cookie)));

  if (expiration <= new Date()) {
    // refresh token
    console.log('TOKEN EXPIRED, REFRESHING');
    var refresh_token = getValueFromCookie('node-tutorial-refresh-token', request.headers.cookie);
    authHelper.refreshAccessToken(refresh_token, function(error, newToken){
      if (error) {
        callback(error, null);
      } else if (newToken) {
        var cookies = ['node-tutorial-token=' + newToken.token.access_token + ';Max-Age=4000',
                       'node-tutorial-refresh-token=' + newToken.token.refresh_token + ';Max-Age=4000',
                       'node-tutorial-token-expires=' + newToken.token.expires_at.getTime() + ';Max-Age=4000'];
        response.setHeader('Set-Cookie', cookies);
        callback(null, newToken.token.access_token);
      }
    });
  } else {
    // Return cached token
    var access_token = getValueFromCookie('node-tutorial-token', request.headers.cookie);
    callback(null, access_token);
  }
}

function buildAttendeeString(attendees) {

  var attendeeString = '';
  if (attendees) {
    attendees.forEach(function(attendee) {
      attendeeString += '<p>Name:' + attendee.emailAddress.name + '</p>';
      attendeeString += '<p>Email:' + attendee.emailAddress.address + '</p>';
      attendeeString += '<p>Type:' + attendee.type + '</p>';
      attendeeString += '<p>Response:' + attendee.status.response + '</p>';
      attendeeString += '<p>Respond time:' + attendee.status.time + '</p>';
    });
  }

  return attendeeString;
}

function events(response, request) {
  var token = getValueFromCookie('node-tutorial-token', request.headers.cookie);
  console.log('Token found in cookie: ', token);
  var email = getValueFromCookie('node-tutorial-email', request.headers.cookie);
  console.log('Email found in cookie: ', email);
  if (token) {
    response.writeHead(200, { 'Content-Type': 'application/json' });
    // response.writeHead(200, {'Content-Type': 'text/html'});
    // response.write('<div><h1>Your calendar</h1></div>');

    // Create a Graph client
    var client = microsoftGraph.Client.init({
      authProvider: (done) => {
        // Just return the token
        done(null, token);
      }
    });

    client
      .api('/me/events')
      .header('X-AnchorMailbox', email)
      // .top(10)
      .select('subject,start,end,attendees,location,body')
      .get((err, res) => {
        if (err) {
          response.end(JSON.stringify({ events: [], error: err }));
        } else {
          response.end(JSON.stringify({ events: res.value }))
        }
      });
  } else {
    response.writeHead(200, {'Content-Type': 'text/html'});
    response.write('<p> No token found in cookie!</p>');
    response.end();
  }
}

function map(response, request) {
  const html = pug.renderFile('./templates/events.pug')
  response.writeHead(200, { 'Content-Type': 'text/html' })

  response.write(html)
  response.end()
}