// 모듈 연결
var express = require('express');
var app = express();
var path = require('path');
var mongoose = require('mongoose');
var passport = require('passport');
var session = require('express-session');
var flash = require('connect-flash');
var async = require('async');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');

// DB 접속
mongoose.connect(process.env.MONGO_DB);
var db = mongoose.connection;
db.once("open", function () {
    console.log("DB connected!");
});
db.on("error", function (err) {
    console.log("DB ERROR :", err);
});

// 모델 세팅
var postSchema = mongoose.Schema({
    title: { type: String, required: true },
    body: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: Date
});
var Post = mongoose.model('post', postSchema);

var userSchema = mongoose.Schema({
    email: { type: String, required: true, unique: true },
    nickname: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});
var User = mongoose.model('user', userSchema);

// 뷰 세팅(동적 사이트)
app.set("view engine", 'ejs');

// 미들웨어 설정
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(flash());

app.use(session({ secret: 'MySecret' }));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function (user, done) {
    done(null, user.id);
});
passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

var LocalStrategy = require('passport-local').Strategy;
passport.use('local-login',
    new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
    },
    function (req, email, password, done)
    {
        User.findOne({ 'email': email }, function (err, user) {
            if (err) return done(err);
            if (!user) {
                req.flash("email", req.body.email);
                return done(null, false, req.flash('loginError', '존재하지 않는 메일 주소입니다.'));
            }
            if (user.password != password) {
                req.flash("email", rqe.body.email);
                return done(null, false, req.flash('loginError', '비밀번호가 일치하지 않습니다.'));
            }
            return done(null, user);
        });
    }
  )
);

//set home routes
app.get('/', function (req, res) {
    res.redirect('/posts');
});

app.get('/login', function (req, res) {
    res.render('login/login', { email: req.flash("email")[0], loginError: req.flash('loginError') });
});

app.post('/login',
    function (req, res, next) {
        req.flash("email");
        if (req.body.email.length === 0 || req.body.password.length === 0) {
            req.flash("email", req.body.email);
            req.flash("loginError", "메일주소와 비밀번호를 모두 입력해주세요.");
            res.redirect('/login');
        } else {
            next();
        }
    }, passport.authenticate('local-login', {
        successRedirect: '/posts',
        failureRedirect: '/login',
        failureFlash: true
    })
);

app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

// 루트 설정
app.get('/posts', function (req, res) {
    Post.find({}).sort('-createdAt').exec(function (err, posts) {
        if (err) return res.json({ success: false, message: err });
        res.render("posts/index", { data: posts });
    });
});   //인덱스

app.get('/posts/new', function (req, res) {
    res.render("posts/new");
});   //새로 작성

app.post('/posts', function (req, res) {
    Post.create(req.body.post, function (err, post) {
        if (err) return res.json({ success: false, message: err });
        res.redirect('/posts');
    });
});   //게시글 생성

app.get('/posts/:id', function (req, res) {
    Post.findById(req.params.id, function (err, post) {
        if (err) return res.json({ success: false, message: err });
        res.render("posts/show", { data: post });
    });
});   //게시글 열람

app.get('/posts/:id/edit', function (req, res) {
    Post.findById(req.params.id, function (err, post) {
        if (err) return res.json({ success: false, message: err });
        res.render("posts/edit", { data: post });
    });
});   //게시글 수정

app.put('/posts/:id', function (req, res) {
    req.body.post.updatedAt = Date.now();
    Post.findByIdAndUpdate(req.params.id, req.body.post, function (err, post) {
        if (err) return res.json({ success: false, message: err });
        res.redirect('/posts/' + req.params.id);
    });
});   //게시글 갱신

app.delete('/posts/:id', function (req, res) {
    Post.findByIdAndRemove(req.params.id, function (err, post) {
        if (err) return res.json({ success: false, message: err });
        res.redirect('/posts');
    });
});   //게시글 삭제

// start server
app.listen(3000, function () {
    console.log('Server On!');
});
