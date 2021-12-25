const express = require("express");
const app = express();

const MongoClient = require("mongodb").MongoClient;
let db; // DB 선언 (페이지 전체에서 쓰는 전역변수로 선언)

// BodyParser
app.use(express.urlencoded({ extended: true }));

// ejs
app.set('view engine', 'ejs');

// PUBLIC-middleware
app.use('/public', express.static('public'));

// method-override (form에서 get/post 이외의 요청도 가능)
const methodOverride = require('method-override');
app.use(methodOverride('_method'));

// Session
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

// Session-Middleware
app.use(session({secret : '비밀코드', resave : true, saveUninitialized : false}));
app.use(passport.initialize());
app.use(passport.session());


// dotenv
require('dotenv').config();


// router
app.use('/shop', require('./routes/shop'));
app.use('/board', require('./routes/board'));


// MongoDB
MongoClient.connect(
  process.env.DB_URL,
  { useUnifiedTopology: true }, // Warning Message를 제거해줌 (선택사항...)
  (err, client) => {
    if (err) return console.log(err);

    db = client.db("todoapp"); // Client를 MongoDB에 연결하는 부분! (todoapp이라는 DB에 연결해주세요...)

    // post라는 collection에 값을 입력하는 부분! (Object형으로 자료를 저장할 수 있다!)
    // MongoDB에서는 자료를 식별자로 _id 를 쓰는데 입력하지 않으면 자동으로 MongoDB에서 입력해줌...

    // db.collection('post').insertOne({name : 'test', _id : 101}, (err, res) => {
    //     if(err){
    //         return console.log(err);
    //     }
    //     console.log('저장완료!');
    // });

    // Server listening

    app.listen(process.env.PORT, () => {
      console.log(`Listening on port ${process.env.PORT}`);
    });
  }
);


// #################### PASSPORT ###################### //
passport.use(new LocalStrategy({
  usernameField : 'id',
  passwordField : 'pw',         // form의 name 속성을 기반으로 바인딩되는 부분!
  session : true,               // session 정보 저장
  passReqToCallback : false     // 아이디, 비밀번호 이외에 다른 정보 검증 시 true로 설정...
}, (inputId, inputPw, done) => {          // 이 콜백함수에서 검증 로직을 수행한다
                                // done(서버에러, 성공시 사용자 DB 데이터, 에러메세지) => 라이브러리 문법이므로 그렇구나하고 넘어가자
  console.log(inputId, inputPw);
  db.collection('login').findOne({id : inputId}, (error, result) => {
    if(error){
      return done(error);
    }
    if(!result){
      return done(null, false, {message : '존재하지 않는 아이디입니다'});
    }
    if(inputPw == result.pw){
      return done(null, result)
    } else {
      return done(null, false, {message : '비밀번호가 일치하지 않습니다'});
    }
  });
}));  // 인증 방식을 선언


// id를 이용하여 세션을 저장시키는 코드
passport.serializeUser((user, done) => {  // 여기서 user에 위 코드의 두번째 파라미터인 result가 들어갈 것
  done(null, user.id);                    // 세션 데이터를 만들고 세션의 id 정보를 쿠키로 보냄
});

// 이 세션 데이터를 가진 유저를 DB에서 조회
passport.deserializeUser((id, done) => {
  db.collection('login').findOne({id : id}, (error, result) => {  // 로그인한 유저의 아이디를 바탕으로 정보를 DB에서 조회
    done(null, result);   // 마이페이지 접속시 result를 보내줌! (마이페이지의 요청에 user으로 정보를 보냄!)
  });
});

// #################### PASSPORT ###################### //

// GET

app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.get("/pet", (req, res) => {
  res.send("펫용품 쇼핑할 수 있는 페이지입니다!");
});

app.get("/beauty", (req, res) => {
  res.send("뷰티용품 쇼핑할 수 있는 페이지입니다!");
});

app.get("/write", (req, res) => {
  res.render("write.ejs");
});

app.get('/detail/:id', (req, res) => {
  req.params.id = parseInt(req.params.id);
  db.collection('post').findOne({_id : req.params.id}, (err, result) => {
    console.log(result);
    res.render('detail.ejs', {data : result});
  });
});

app.get('/edit/:id', (req, res) => {
  db.collection('post').findOne({_id : parseInt(req.params.id)}, (err, result) => {
    res.render('edit.ejs', {data : result});
  });
});

app.put('/edit/:id', (req, res) => {
  const id = parseInt(req.params.id);
  db.collection('post').updateOne({_id : id}, {$set : {...req.body}}, (err, result) => {
    res.redirect('/list');
  });
});

app.get('/login', (req, res) => {
  res.render('login.ejs');
});

app.post('/login', passport.authenticate('local', {
  failureRedirect : '/fail',  // 로그인이 실패하면 '/fail'로 리다이렉트
}) ,(req, res) => {
  res.redirect('/');          // 로그인이 성공하면 root로 리다이렉트
});

const isLogin = (req, res, next) => {
  if(req.user) {                    // req.user이 있으면
    next();                         // 통과(next())
  } else {                          // 없으면
    res.send('로그인이 필요합니다');   // 메세지 전송
  }
}

app.get('/mypage', isLogin ,(req, res) => { // 두번째 파라미터는 미들웨어가 온다!
  console.log(req.user);
  res.render('mypage.ejs', {user : req.user});  // ejs로 사용자에 관한 정보 보내기!
});


app.get('/search', (req, res) => {

  // 검색조건 설정
  const searchCondition = [
    {
      $search : {
        index : 'titleSearch',
        text : {
          query : req.query.value,
          path : 'title'
        }
      }
    },
    { $sort : { _id : 1} },
    { $limit : 10}  
  ]

  db.collection('post').aggregate(searchCondition).toArray((error, result) => {
      console.log(result);
      res.render('search.ejs', {posts : result}); // list.ejs를 복붙하여 search.ejs를 만들고 결과를 posts에 실어보냄
  });
});

app.post('/register', (req, res) => {
  db.collection('login').insertOne(req.body, (error, result) => {
    res.redirect('/');
  });
});




// /list로 접속하면 데이터를 보여주기
// 실제 DB에 저장된 데이터들로 꾸며진 HTML을 보여줌

app.get('/list', (req, res) => {

  // 'post'라는 컬렉션 안에 저장된 모든 데이터 꺼내기
  db.collection('post').find().toArray((err, result) => {
      if(err){
          console.log(err);
      }
      console.log(result);

  // 결과를 posts로 저장 후 list.ejs 랜더링!
  res.render('list.ejs', {posts : result, user : req.user});
  });
});



// 어떤 사람이 /add 경로로 요청하면 데이터 2개 (날짜, 제목)을 보내주는데
// 이 때 post라는 이름을 가진 collection에 두개의 데이터를 저장하기!

app.post("/add", (req, res) => {

  db.collection('count').findOne({name : "postNum"}, (err, result) => {

    // 1. MongoDB에서 데이터 하나를 단건 조회 할 때 : findOne (name이 "postNum" 인 데이터를 하나 조회)
      const totalPost = result.totalPost;
    // 2. 위에서 찾은 데이터를 totalPost 변수에 저장

    db.collection('post').insertOne({ _id: totalPost + 1, author_id : req.user._id , author : req.user.id, ...req.body }, (err, result) => {
      if (err) {
        console.log(err);
      } else {
        db.collection('count').updateOne({name : 'postNum'}, {$inc : {totalPost : 1}}, (err, result) => {
          // 3. 값이 들어갈 때 마다 count 컬렉션의 totalPost 값을 1 증가시켜주기
          if(err){
            console.log(err);
          }
        });
      }
    });
  });
  res.redirect('/list');
});


app.delete('/delete', (req, res) => {
  
  req.body._id = parseInt(req.body._id); // String으로 넘어온 _id를 다시 정수로 변환
  console.log(req.body);  // 데이터 출력 확인

  const deleteData = {_id : req.body._id, author_id : req.user._id};

  db.collection('post').deleteOne(deleteData, (err, result) => {
    if(err){
      console.log(err);
      res.status(400).send({message : '실패했습니다..'});
    } else {
      console.log('삭제 완료');                                 // 삭제완료 여부를 콘솔창에 찍기
      res.status(200).send({message : '성공했습니다!'});        // 200 응답메세지를 보내고 메세지 전달
    }
  });
});


// ########### multer ########### //
const multer = require('multer');
const storage = multer.diskStorage({  // 메모리에 저장하고 싶으면 memoryStorage
  destination : function(req, file, cb){
    cb(null, './public/images')
  },
  filename : function(req, file, cb){   // 파일 이름을 설정하는 부분
    cb(null, file.originalname)
  },
  filefilter : function(req, file, cb){ // 파일에 필터링을 걸고 싶을 때
    const ext = path.extname(file.originalname);
    if(ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
      return cb(new Error('이미지 파일만 업로드하시오!'))
    }
    cb(null, true);
  },
  limits : {  // 파일의 사이즈 제한을 걸고 싶을 때
    fileSize : 1024 * 1024
  }
});

const upload = multer({storage : storage});
// ########### multer ########### //


app.get('/upload', (req, res) => {
  res.render('upload.ejs');
});


app.post('/upload', upload.single('profile'), (req, res) => {
  res.send('이미지 업로드 완료!');
});

app.get('/image/:imageName', (req, res) => {
  res.sendFile(__dirname + '/public/images/' + req.params.imageName);
});