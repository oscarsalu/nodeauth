var express = require('express')
var router = express.Router()
var multer = require('multer')
var upload = multer({
    dest: 'uploads/'
})
var passport = require('passport')
var localStrategy = require('passport-local').Strategy

var User = require('../models/user')

/* GET users listing. */
router.get('/', function(req, res, next) {
    res.send('respond with a resource')
})

router.get('/register', function(req, res, next) {
    res.render('register', {
        'title': 'Register'
    })
})
router.get('/login', function(req, res, next) {
    res.render('login', {
        'title': 'Login'
    })
})
router.post('/register', upload.single('profileimage'), function(req, res, next) {
    var name = req.body.name
    var email = req.body.email
    var username = req.body.username
    var password = req.body.password
    var password2 = req.body.password2

    // check foe image field
    if (req.file) {
        console.log('Upload File...')

        // file infor
        var profileImageOriginalName = req.file.profileimage.originalname
        var profileImageName = req.file.profileimage.name
        var profileImageMime = req.file.profileimage.mimetype
        var profileImagePath = req.file.profileimage.path
        var profileImageExt = req.file.profileimage.extension
        var profileImageSize = req.file.profileimage.size
    } else {
        var profileImageName = 'noimage.png'
    }

    // form validation
    req.checkBody('name', 'Name Field is Required').notEmpty()
    req.checkBody('email', 'Email Field is Required').notEmpty()
    req.checkBody('email', 'Email Field is Not Valid').isEmail()
    req.checkBody('username', 'Username Field is Required').notEmpty()
    req.checkBody('password', 'Password Field is Required').notEmpty()
    req.checkBody('password2', 'Passwords do not match').equals(req.body.password)

    // check for erroes
    var errors = req.validationErrors()

    if (errors) {
        res.render('register', {
            'title': 'Register',
            errors: errors,
            name: name,
            email: email,
            username: username,
            password: password,
            password2: password2
        })
    } else {
        var newUser = new User({
            name: name,
            email: email,
            username: username,
            password: password,
            profileimage: profileImageName
        })

        // create user
        User.createUser(newUser, function(err, user) {
            if (err) throw err
            console.log(user)
        })

        // success Message
        req.flash('success', 'You are now registered')

        res.location('/')
        res.redirect('/')
    }
})

passport.serializeUser(function(user, done) {
    done(null, user.id)
})

passport.deserializeUser(function(id, done) {
    User.getUserById(id, function(err, user) {
        done(err, user)
    })
})

passport.use(new localStrategy(
    function(username, password, done) {
        User.getUserByUsername(username, function(err, user) {
            if (err) throw err
            if (!user) {
                console.log('Unknown User')
                return done(null, false, { message: 'Unknown User' })
            }
            User.comparePassword(password, user.password, function(err, isMatch) {
                if (err) throw err
                if (isMatch) {
                    return done(null, user)
                } else {
                    console.log('Invalid Password')
                    return done(null, false, { message: 'Invalid Password' })
                }
            })
        })
    }
))

router.post('/login', passport.authenticate('local', { failureRedirect: '/users/login', failureFlash: 'Invalid username or password' }), function(req, res) {
    console.log('Authentication Successful')
    req.flash('success', 'You are logged in')
    res.redirect('/')
})

router.get('/logout', function(req, res) {
    req.logout();
    req.flash('success', 'You have logged out');
    res.redirect('/users/login');
})

module.exports = router