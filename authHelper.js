var devCredentials = {
  id: '89b5146f-9b7b-4a5b-919a-9067bd6e14e9',
  secret: 'a1TbvWUndsHoyfm2ywKMDYF',
}

var prodCredentials = {
  id: 'c307a8c7-f617-4cf4-8110-222dc16fea45',
  secret: 'frmeBOL5924{)mopINBD9!_',
}

var credentials = {
  client: prodCredentials,
  auth: {
    tokenHost: 'https://login.microsoftonline.com',
    authorizePath: 'common/oauth2/v2.0/authorize',
    tokenPath: 'common/oauth2/v2.0/token'
  }
};
var oauth2 = require('simple-oauth2').create(credentials);

var redirectUri = process.env.ENV === 'development' ? 'http://localhost:8000/authorize' : 'https://office-events-map.herokuapp.com/authorize';

// The scopes the app requires
var scopes = [ 'openid',
               'offline_access',
               'User.Read',
               'Mail.Read',
               'Calendars.Read',
               'Contacts.Read' ];

function getAuthUrl() {
  var returnVal = oauth2.authorizationCode.authorizeURL({
    redirect_uri: redirectUri,
    scope: scopes.join(' ')
  });
  return returnVal;
}

function getTokenFromCode(auth_code, callback, response) {
  var token;
  oauth2.authorizationCode.getToken({
    code: auth_code,
    redirect_uri: redirectUri,
    scope: scopes.join(' ')
    }, function (error, result) {
      if (error) {
        console.log('Access token error: ', error.message);
        callback(response, error, null);
      } else {
        token = oauth2.accessToken.create(result);
        console.log('Token created: ', token.token);
        callback(response, null, token);
      }
    });
}

function refreshAccessToken(refreshToken, callback) {
  var tokenObj = oauth2.accessToken.create({refresh_token: refreshToken});
  tokenObj.refresh(callback);
}

exports.getAuthUrl = getAuthUrl;
exports.getTokenFromCode = getTokenFromCode; 
exports.refreshAccessToken = refreshAccessToken;