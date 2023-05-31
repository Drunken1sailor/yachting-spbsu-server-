const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const bcrypt = require("bcrypt");
const multer = require("multer");
const bodyParser = require("body-parser"); 
const cookieParser = require("cookie-parser"); 
const session = require("express-session"); 
const fileUpload = require("express-fileupload");
const path = require('path');

const saltRounds = 10;
const app = express();

app.use(express.static(path.join(__dirname, 'src')));
app.use(express.json());
app.use(cors({
	origin: ["http://localhost:3000"],
	methods: ["GET", "POST"],
	credentials: true
}));
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
	key: "userID",
	secret: "anjhsa2AJHab0asAS7Dhjliuvn",
	resave: false,
	saveUninitialized: false,
	cookie: {
		expires:60*60*24
	}
}));
app.use(fileUpload());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './src/img/news/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const uploadNews = multer({ storage });

const db = mysql.createConnection({
  user: "u1497732_default",
  host: "server114.hosting.reg.ru",
  password: "KgB63sJwwRE28Gqc",
  database: "u1497732_yachting-spbsu",
  port:3306,
});

db.connect((err)=>{
	if(err){
		console.log(err)
	}else{
		console.log("Connected!")
	}
});

app.post('/register', (req, res)=>{
	const nameReg = req.body.nameReg;
	const secondNameReg = req.body.secondNameReg;
	const emailReg = req.body.emailReg;
	const passwordReg = req.body.passwordReg;


  db.query(
    "SELECT * FROM participant WHERE email = ?", 
    emailReg, 
    (err, result) => {
      if(err){
        res.send({message: err.message});
        return;
      }

      if(result && result.length > 0){
        res.send({message: "Пользователь с таким адресом почты уже существует!"});
        return;
      }else{
        bcrypt.hash(passwordReg, saltRounds, (errBcrypt, hash) =>{
          if(errBcrypt){console.log(errBcrypt);}
          db.query(
            "INSERT INTO participant (firstName, secondName, email, password) VALUES (?, ?, ?, ?)", 
            [nameReg,secondNameReg,emailReg,hash], 
            (err2, result2) => {
              if(err2){
                res.send({message: err2.message});
                return;
              }
              else{
                req.session.user = result2;
                console.log(req.session.user);
                res.send(result2);
              }
            }
          );
        });
      }
    }
  );	
});

app.get('/login', (req,res)=>{
	if(req.session.user){
		res.send({loggedIn: true, user: req.session.user});
	}else{
		res.send({loggedIn: false});
	}
});

app.post('/login', (req, res)=>{
	const email = req.body.email;
	const password = req.body.password;

	db.query(
		"SELECT * FROM participant WHERE email = ?", 
		email, 
		(err, result) => {
			if(err){
				res.send({err: err});
			}

			if(result && result.length > 0){
				bcrypt.compare(password, result[0].password, (error, response) => {
					if(response){
						req.session.user = result;
						console.log(req.session.user);
						res.send(result)
					}else{
						res.send({message: "Неправильный пароль!"})
					}
				});
			}else{
				res.send({message: "Пользователь с таким адресом почты не найден!"})
			}
			
		}
	);
});


app.get('/getNews', (req,res)=>{
	db.query(
    "SELECT * FROM news",
    (err, result) => {
      if (err) {
	      console.error('Ошибка при выполнении запроса:', err);
	      res.status(500).json({ err: 'Ошибка при выполнении запроса' });
	    } else {
	      res.json(result);
	    }
    }
  );
});
app.get('/getEvents', (req,res)=>{
  db.query(
    "SELECT * FROM event",
    (err, result) => {
      if (err) {
        console.error('Ошибка при выполнении запроса:', err);
        res.status(500).json({ err: 'Ошибка при выполнении запроса' });
      } else {
        res.json(result);
      }
    }
  );
});

app.get('/getNewsElement', (req,res)=>{
  const newsID = req.body.newsID;

  db.query(
    "SELECT * FROM news WHERE newsId = ?",
    [newsID],
    (err, result) => {
      if (err) {
        console.error('Ошибка при выполнении запроса:', err);
        res.send({ message: err.message });
      } else {
        res.json(result);
      }
    }
  );
});

app.post('/news', (req, res) => {
  const title = req.body.title;
  const date = req.body.date;
  const description = req.body.description;
  const file = req.files.file;
  const filePath = './src/img/news/' + file.name;
  let checkbox = req.body.checkbox;

  if (checkbox=="true"){
  	checkbox=1
  }else{checkbox=0}

  file.mv(filePath , (error) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ message: 'Ошибка при сохранении файла' });
    }	
  	});

  db.query(
    "INSERT INTO news (title, date, body, img, isMain) VALUES (?, ?, ?, ?, ?)",
    [title, date, description, filePath, checkbox],
    (err, result) => {
      if (err) {
        console.log(err);
        res.send({ message: "Ошибка при сохранении данных в базу данных" });
      } else {
        console.log(result);
        res.send({ message: "Данные успешно сохранены в базу данных" });
      }
    }
  );
});

app.post('/event', (req, res) => {
  const title = req.body.title;
  const date = req.body.date;
  const description = req.body.description;
  const file = req.files.file;
  const filePath = './src/img/events/' + file.name;

  file.mv(filePath , (error) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ message: 'Ошибка при сохранении файла' });
    } 
    });

  db.query(
    "INSERT INTO event (title, date, body, img) VALUES (?, ?, ?, ?)",
    [title, date, description, filePath],
    (err, result) => {
      if (err) {
        console.log(err);
        res.send({ message: "Ошибка при сохранении данных в базу данных" });
      } else {
        console.log(result);
        res.send({ message: "Данные успешно сохранены в базу данных" });
      }
    }
  );
});

app.post('/course', (req, res) => {
  const title = req.body.title;
  const date = req.body.date;
  const anons = req.body.anons;
  const beginTime = req.body.beginTime;
  const duration = req.body.duration;

  db.query(
    "UPDATE course SET title = ?, date = ?, anons = ?, beginTime = ?, duration = ? WHERE courseID = 1",
    [title, date, anons, beginTime, duration],
    (err, result) => {
      if (err) {
        res.send({ message: "Ошибка при сохранении данных в базу данных" });
      } else {
        res.send({ message: "Данные успешно сохранены в базу данных" });
      }
    }
  );
});

app.get('/getCourse', (req,res)=>{
	db.query(
    "SELECT * FROM course WHERE courseID = 1",
    (err, result) => {
      if (err) {
        console.error('Ошибка при выполнении запроса:', err);
        res.status(500).json({ err: 'Ошибка при выполнении запроса' });
      } else {
        res.json(result);
      }
    }
  );
});

app.post('/regOnCourse', (req, res) => {
  const participantID = req.body.participantID;
  const courseID = 1;

  db.query("SELECT * FROM courseParticipantList WHERE participantID = ?",[participantID],(err,result)=>{
    if (err) {
        res.send({message: err.message});
        return;
    }
    if(result && result.length > 0){
      res.send({message: "Вы уже записаны на данный курс!"});
      return;
    }else{
      db.query(
        "INSERT INTO courseParticipantList (courseID, participantID) VALUES (?, ?)",
        [courseID, participantID],
        (err2, result2) => {
          if (err2) {
            res.send({message: err2.message});
          } else {
            res.send(result2);
          }
        }
      );
    }
  });

  
});

app.post('/orgLogin', (req, res)=>{
  const email = req.body.email;
  const password = req.body.password;

  db.query(
    "SELECT * FROM organizer WHERE mail = ?", 
    email, 
    (err, result) => {
      if(err){
        res.send({message: err.message});
        return;
      }

      if(result && result.length > 0){
        bcrypt.compare(password, result[0].password, (error, response) => {
          if(response){
            req.session.user = result;
            console.log(req.session.user);
            res.send(result);
            return;
          }else{
            res.send({message: "Неправильный пароль!"});
            return;
          }
        });
      }else{
        res.send({message: "Пользователь с таким адресом почты не найден!"});
        return;
      }
      
    }
  );
});

app.post('/orgReg', (req, res)=>{
	const nameReg = req.body.nameReg;
	const secondNameReg = req.body.secondNameReg;
	const emailReg = req.body.emailReg;
	const passwordReg = req.body.passwordReg;

	bcrypt.hash(passwordReg, saltRounds, (error, hash) =>{
		if(err){console.log(err);}
		db.query(
			"INSERT INTO organizer (firstName, secondName, mail, password) VALUES (?, ?, ?, ?)", 
			[nameReg,secondNameReg,emailReg,hash], 
			(err, result) => {
				console.log(err);
        res.send(result);
			}
		);
	});
});

app.post('/logout', async (req, res) => {
  try{
    res.clearCookie('userID');
    res.send('Сookie удалено!');
  }
  catch(err){
    console.log(err);
    res.send({message: "Что-то пошло не так!"})
  }
});


app.post('/getCourses', async (req, res) => {
  const participantID = req.body.participantID;
  const courseID = 1;
  let isRegistered = false;
    
  db.query("SELECT * FROM course INNER JOIN courseParticipantList ON course.courseID = courseParticipantList.courseID WHERE courseParticipantList.participantID = ?",
   participantID, (err,result)=>{
    if(err){
      res.send({message: err.message});
      return;
    }
    if(result && result.length > 0){
      res.send(result);
      return;
    }else{
      res.send({message: "Записи на курсы отсутствуют!"});
      return;
    }
  });
  
});


app.get('/participants', async (req, res) => {
  db.query(
  "SELECT * FROM participant INNER JOIN courseParticipantList ON participant.participantID = courseParticipantList.participantID WHERE courseParticipantList.courseID = 1",
  (err, result) => {
    if(err){
      res.send({message: err.message});
      return;
    }
    if(result && result.length > 0){
      res.send(result);
      return;
    }else{
      res.send({message: "Пользователей нет!"});
      return;
    }
  }
  );
});

app.listen(3001, ()=>{
	console.log("running server");
})
