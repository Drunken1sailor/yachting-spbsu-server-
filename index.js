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
        res.send({err: err});
      }

      if(result && result.length > 0){
        res.send({message: "Пользователь с таким адресом почты уже существует!"})
      }else{
        bcrypt.hash(passwordReg, saltRounds, (errBcrypt, hash) =>{
          if(errBcrypt){console.log(errBcrypt);}
          db.query(
            "INSERT INTO participant (firstName, secondName, email, password) VALUES (?, ?, ?, ?)", 
            [nameReg,secondNameReg,emailReg,hash], 
            (err2, result2) => {
              console.log(err);
              if(result2.length > 0){
                
                db.query("SELECT * FROM participant WHERE email = ?", emailReg, (err3, result3)=>{

                  if(result3.length > 0){
                    req.session.user = result3;
                    console.log(req.session.user);
                    res.send(result3);
                  }else{
                    res.send({message: err3});
                  }

                });


                res.send(result2);
              }else{
                res.send({message: err2});
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

  db.query(
    "INSERT INTO event (title, date, body) VALUES (?, ?, ?)",
    [title, date, description],
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

app.get('/getCourse', (req,res)=>{
	db.query(
    "SELECT * FROM course",
    (err, result) => {
      if (err) {
	      console.error('Ошибка при выполнении запроса:', error);
	      res.status(500).json({ error: 'Ошибка при выполнении запроса' });
	    } else {
	      res.json(result);
	    }
    }
  );
});

app.post('/courseReg', (req, res) => {
  const participantID = req.body.participantID;
  const courseID = 1;

  db.query(
    "INSERT INTO courseParticipantList (courseID, participantID) VALUES (?, ?)",
    [courseID, participantID],
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

app.post('/orgLogin', (req, res)=>{
  const email = req.body.email;
  const password = req.body.password;

  db.query(
    "SELECT * FROM organizer WHERE email = ?", 
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
            res.send(result);
            return;
          }else{
            res.send({message: "Неправильный пароль!"})
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

	bcrypt.hash(passwordReg, saltRounds, (err, hash) =>{
		if(err){console.log(err);}
		db.query(
			"INSERT INTO organizer (name, secondName, mail, password) VALUES (?, ?, ?, ?)", 
			[nameReg,secondNameReg,emailReg,hash], 
			(err, result) => {
				console.log(err);
        res.send(result);
			}
		);
	});
});

// app.get('/lk', (req,res)=>{
// 	const participantID = req.body.participantID;
// 	db.query(
//     "SELECT * FROM courseParticipantList WHERE participantID = ?",
//     [participantID],
//     (err, result) => {
//       if (err) {
// 	      console.error('Ошибка при выполнении запроса:', error);
// 	      res.status(500).json({ error: 'Ошибка при выполнении запроса' });
// 	    } else {
// 	       res.json(result);
// 	      console.log(result);
// 	      db.query(
// 		    "SELECT * FROM course WHERE courseID = ?",
// 		    [participantID],
// 		    (err, result) => {
// 		      if (err) {
// 			      console.error('Ошибка при выполнении запроса:', error);
// 			      res.status(500).json({ error: 'Ошибка при выполнении запроса' });
// 			    } else {
// 			      // res.json(result);
// 			    }
// 		    }
// 		  );
// 	    }
//     }
//   );
// });

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


app.post('/lk', async (req, res) => {
  try {
    const participantID = req.body.participantID;
    
    // Получение данных из таблицы courseParticipantList
    const participantListData = await queryDatabase("SELECT * FROM courseParticipantList WHERE participantID = ?", [participantID]);
    
    if (participantListData.length === 0) {
      res.status(404).json({ error: 'Данные не найдены' });
      return;
    }
    
    const courseID = participantListData[0].courseID;
    
    // Получение данных из таблицы course
    const courseData = await queryDatabase("SELECT * FROM course WHERE courseID = ?", [courseID]);
    
    res.json(courseData);
  } catch (error) {
    console.error('Ошибка при выполнении запроса:', error);
    res.status(500).json({ error: 'Ошибка при выполнении запроса' });
  }
});

// Функция для выполнения запросов к базе данных
function queryDatabase(sql, params) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}


app.listen(3001, ()=>{
	console.log("running server");
})
