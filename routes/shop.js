// express에서 router를 쓰기 위한 설정
const router = require("express").Router();

const isLogin = (req, res, next) => {
    if(req.user) {                    // req.user이 있으면
      next();                         // 통과(next())
    } else {                          // 없으면
      res.send('로그인이 필요합니다');   // 메세지 전송
    }
}

// 라우터 페이지 내에서 전역적으로 미들웨어 적용
router.use(isLogin);

router.get("/shirts" ,function (요청, 응답) {
  응답.send("셔츠 파는 페이지입니다.");
});

router.get("/pants",function (요청, 응답) {
  응답.send("바지 파는 페이지입니다.");
});

// module.exports : 다른 파일에서 js파일을 쓸 수 있도록 내보내는 코드
module.exports = router;