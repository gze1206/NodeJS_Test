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

var bcrypt = require("bcrypt-nodejs");

var userSchema = mongoose.Schema({
    email: { type: String, required: true, unique: true },
    nickname: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

userSchema.pre("save", function (next) {
  var user = this;
  if(!user.isModified("password")){
    return next();
  } else {
    user.password = bcrypt.hashSync(user.password);
    return next();
  }
});
userSchema.methods.authenticate = function (password) {
  var user = this;
  return bcrypt.compareSync(password,user.password);
};
userSchema.methods.hash = function (password) {
  return bcrypt.hashSync(password);
};

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
                return done(null, false, req.flash('loginError', "존재하지 않는 메일 주소입니다."));
            }
            if (!user.authenticate(password)) {
                req.flash("email", req.body.email);
                return done(null, false, req.flash('loginError', '비밀번호가 일치하지 않습니다.'));
            }
            return done(null, user);
        });
    }
  )
);

//홈 루트 설정
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

//유저 루트 설정
app.get('/users/new', function (req, res) {
    res.render('users/new', {
        formData: req.flash('formData')[0],
        emailError: req.flash('emailError')[0],
        nicknameError: req.flash('nicknameError')[0],
        passwordError: req.flash('passwordError')[0]
    });
});     //유저 생성 뷰

app.post('/users', checkUserRegValidation, function (req, res, next) {
    User.create(req.body.user, function (err, user) {
        if (err) return res.json({ success: false, message: err });
        res.redirect('/login');
    });
});     //유저 생성

app.get('/users/:id', IsLoggedIn, function (req, res) {
    User.findById(req.params.id, function (err, user) {
        if (err) return res.json({ success: false, message: err });
        res.render("users/show", { user: user });
    });
});     //유저 보기

app.get('/users/:id/edit', IsLoggedIn, function (req, res) {
  if (req.user._id != req.params.id) return res.json({success:false, message:"접근 거부"});
    User.findById(req.params.id, function (err, user) {
        if (err) return res.json({ success: false, message: err });
        res.render("users/edit", {
            user: user,
            formData: req.flash('formData')[0],
            emailError: req.flash('emailError')[0],
            nicknameError: req.flash('nicknameError')[0],
            passwordError: req.flash('passwordError')[0]
        });
    });
});     //유저 정보 수정

app.put('users/:id', IsLoggedIn, checkUserRegValidation, function (req, res) {
  if (req.user._id != req.params.id) return res.json({success:false, message:"접근 거부"});
    User.findById(req.params.id, req.body.user, function (err, user) {
        if (err) return res.json({ success: false, message: err });
        if (user.authenticate(req.body.user.password)) {
            if (req.body.user.newPassword) {
                req.body.user.password = user.hash(req.body.user.newPassword);
            } else {
                delete req.body.user.password;
            }
            User.findByIdAndUpdate(req.params.id, req.body.user, function (err, user) {
                if (err) return res.json({ success: false, message: err });
                res.redirect('/users/' + rq.params.id);
            });
        } else {
            req.flash("formData", req.body.user);
            req.flash("passwordError", "- 존재하지 않는 비밀번호");
        }
    });
});     //유저 정보 갱신

// 루트 설정
app.get('/posts', function (req, res) {
    Post.find({}).sort('-createdAt').exec(function (err, posts) {
        if (err) return res.json({ success: false, message: err });
        res.render("posts/index", { data: posts, user: req.user });
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

//함수
function IsLoggedIn(req,res,next) {
  if (req.isAuthenticated()){
    return next();
  }
  res.redirect('/');
}

function checkUserRegValidation(req, res, next) {
    var isValid = true;

    async.waterfall(
        [function (callback) {
            User.findOne({ email: req.body.user.email, _id: { $ne: mongoose.Types.ObjectId(req.params.id) } },
            function (err, user) {
                if (user) {
                    isValid = false;
                    req.flash("emailError", "- 이 메일주소는 이미 사용되고 있습니다.");
                }
                callback(null, isValid);
            });
        }, function (isValid, callback) {
            User.findOne({ nickname: req.body.user.nickname, _id: { $ne: mongoose.Types.ObjectId(req.params.id) } },
                function (err, user) {
                    if (user) {
                        ifValid = false;
                        req.flash("nicknameError", "- 이 닉네임은 이미 사용되고 있습니다.");
                    }
                    callback(null, isValid);
                });
        }], function (err, isValid) {
            if (err) return res.json({ success: false, message: err });
            if (isValid) {
                return next();
            } else {
                req.flash("formData", req.body.user);
                res.redirect("back");
            }
        }
    );
}

// 서버 가동
app.listen(3000, function () {
    console.log('Server On!');
});
