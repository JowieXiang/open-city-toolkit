const express = require('express')
const router = express.Router()

const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
const methodOverride = require('method-override')

// connect to db
const { authURI } = require('../config/keys')
mongoose.connect(authURI, { useNewUrlParser: true })
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.log(err))
const User = require('../models/User');

const initializePassport = require('../config/passport-config')
initializePassport(
    passport,
    email => User.findOne({ email: email }),
    id => User.findById(id)
)

router.use(express.urlencoded({ extended: false }))
router.use(flash())
router.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))
router.use(passport.initialize())
router.use(passport.session())
router.use(methodOverride('_method'))

router.get('/login', checkNotAuthenticated, (req, res) => {
    res.render('login', {})
})

// passport.authenticate will automatically call req.login(), which will attach req.user to every following request object
router.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}))

router.delete('/logout', (req, res) => {
    // req.logOut() removes the session and req.user
    req.logOut()
    res.redirect('/login')
})

router.get('/register', checkNotAuthenticated, (req, res) => {
    res.render('register', {})
})

router.post('/register', checkNotAuthenticated, async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10)

        // db persistence
        const newUser = new User({
            name,
            email,
            password: hashedPassword
        });
        newUser.save()

        res.redirect('/login')
    } catch {
        res.redirect('/register')
    }
})

// FIXME: merge with checkAuthenticated
function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/')
    }
    next()
}

module.exports = router