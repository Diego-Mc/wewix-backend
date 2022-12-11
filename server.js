const express = require('express')
const session = require('express-session');

const cors = require('cors')
const path = require('path')
const cookieParser = require('cookie-parser')

const app = express()
const http = require('http').createServer(app)

// Express App Config
app.use(cookieParser())
app.use(express.json())

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve(__dirname, 'public')))
} else {
  const corsOptions = {
    origin: [
      'http://127.0.0.1:5173',
      'http://localhost:5173',
      'http://127.0.0.1:3030',
      'http://localhost:3030',
    ],
    credentials: true,
  }
  app.use(cors(corsOptions))
}

const authRoutes = require('./api/auth/auth.routes')
const userRoutes = require('./api/user/user.routes')
// const userWapRoutes = require('./api/userWap/userWap.routes')
const wapRoutes = require('./api/wap/wap.routes')
const { setupSocketAPI } = require('./services/socket.service')

// routes
const setupAsyncLocalStorage = require('./middlewares/setupAls.middleware')
// app.all('*', setupAsyncLocalStorage)

app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
// app.use('/api/userWap', userWapRoutes)
app.use('/api/wap', wapRoutes)
setupSocketAPI(http)




//google sign in ------------------------------------>
// const passport = require('passport');
// require('./auth');
// function isLoggedIn(req, res, next) {
//   req.user ? next() : res.sendStatus(401);
// }
// app.use(session({ secret: 'cats', resave: false, saveUninitialized: true }));
// app.use(passport.initialize());
// app.use(passport.session());
// app.get('/', (req, res) => {
//   res.redirect('http://localhost:5173')
//   // res.send('<a href="/auth/google">Authenticate with Google</a>');
// });

// app.get('/auth/google',
//   passport.authenticate('google', { scope: ['email', 'profile'] },

//   ));

// app.get('/auth/google/callback',

//   passport.authenticate('google',
//     {
//       successRedirect: '/',
//       failureRedirect: '/auth/google/failure'
//     }),

//   function (req, res) {
//     console.log(req, res);


//     // res.redirect('/~' + req.user.username);
//   },

// )

// app.get('/logout', (req, res) => {
//   req.logout();
//   req.session.destroy();
//   res.send('Goodbye!');
// });

// app.get('/auth/google/failure', (req, res) => {
//   res.send('Failed to authenticate..');
// });

//---------------------------------------------------->


// Make every server-side-route to match the index.html
// so when requesting http://localhost:3030/index.html/wap/123 it will still respond with
// our SPA (single page app) (the index.html file) and allow vue/react-router to take it from there
app.get('/**', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})



const logger = require('./services/logger.service')
const port = process.env.PORT || 3030
http.listen(port, () => {
  logger.info('Server is running on port: ' + port)
})
