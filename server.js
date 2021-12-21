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

// MongoDB
MongoClient.connect(
  "mongodb+srv://test:Test1234@cluster0.3k3a6.mongodb.net/todoapp?retryWrites=true&w=majority",
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

    app.listen(8080, () => {
      console.log("Listening on port 8080");
    });
  }
);

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

// POST

// app.post('/add', (req, res) => {

//     res.send('전송완료');
//     console.log(req.body);
// });


// 어떤 사람이 /add 경로로 요청하면 데이터 2개 (날짜, 제목)을 보내주는데
// 이 때 post라는 이름을 가진 collection에 두개의 데이터를 저장하기!

app.post("/add", (req, res) => {
  db.collection('count').findOne({name : "postNum"}, (err, result) => {
    // 1. MongoDB에서 데이터 하나를 단건 조회 할 때 : findOne (name이 "postNum" 인 데이터를 하나 조회)
      const totalPost = res.totalPost;
    // 2. 위에서 찾은 데이터를 totalPost 변수에 저장

    db.collection('post').insertOne({ _id: totalPost + 1, ...req.body }, (err, result) => {
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
    res.render('list.ejs', {posts : result});
    });
});

app.delete('/delete', (req, res) => {
  
  req.body._id = parseInt(req.body._id); // String으로 넘어온 _id를 다시 정수로 변환
  console.log(req.body);  // 데이터 출력 확인

  db.collection('post').deleteOne(req.body, (err, result) => {
    if(err){
      console.log(err);
      res.status(400).send({message : '실패했습니다..'});
    } else {
      console.log('삭제 완료');                                 // 삭제완료 여부를 콘솔창에 찍기
      res.status(200).send({message : '성공했습니다!'});        // 200 응답메세지를 보내고 메세지 전달
    }
  });
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