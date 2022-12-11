// const passport = require('passport');
// const GoogleStrategy = require('passport-google-oauth2').Strategy;
// const {findAndModify} = require('./api/user/user.service')

// const GOOGLE_CLIENT_ID = '334191761722-mrbnm826mvlhehv0bqru4vh9shk7a1dp.apps.googleusercontent.com';
// const GOOGLE_CLIENT_SECRET = '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';

// passport.use(new GoogleStrategy({
//   clientID: GOOGLE_CLIENT_ID,
//   clientSecret: GOOGLE_CLIENT_SECRET,
//   callbackURL: "http://localhost:3030/auth/google/callback",
//   passReqToCallback: true,
// },

// async function(request, accessToken, refreshToken, profile, done) {
//   const user = await findAndModify(profile)
//   return done(null, user);
// }));

// passport.serializeUser(function(user, done) {
//   done(null, user);
// });

// passport.deserializeUser(function(user, done) {
//   done(null, user);
// });
