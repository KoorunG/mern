const express = require("express");
const app = express();

const MongoClient = require("mongodb").MongoClient;
let db; // DB 선언 (페이지 전체에서 쓰는 전역변수로 선언)

// BodyParser

app.use(express.urlencoded({ extended: true }));

// ejs

app.set('view engine', 'ejs');

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
  res.sendFile(__dirname + "/index.html");
});

app.get("/pet", (req, res) => {
  res.send("펫용품 쇼핑할 수 있는 페이지입니다!");
});

app.get("/beauty", (req, res) => {
  res.send("뷰티용품 쇼핑할 수 있는 페이지입니다!");
});

app.get("/write", (req, res) => {
  res.sendFile(__dirname + "/write.html");
});

// POST

// app.post('/add', (req, res) => {

//     res.send('전송완료');
//     console.log(req.body);
// });


// 어떤 사람이 /add 경로로 요청하면 데이터 2개 (날짜, 제목)을 보내주는데
// 이 때 post라는 이름을 가진 collection에 두개의 데이터를 저장하기!

app.post("/add", (req, res) => {
  console.log(req.body);
  db.collection('post').insertOne({ _id: 2, ...req.body }, (err, res) => {
    if (err) {
      console.log(err);
    }
  });
  res.send('전송 완료');
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