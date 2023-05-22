const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const bcrypt = require('bcrypt');
const bodyParser = require("body-parser"); 
const cookieParser = require("cookie-parser"); 
const session = require("express-session"); 

const saltRounds = 10;

const app = express();

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

	bcrypt.hash(passwordReg, saltRounds, (err, hash) =>{
		if(err){console.log(err);}
		db.query(
			"INSERT INTO participant (firstName, secondName, email, password) VALUES (?, ?, ?, ?)", 
			[nameReg,secondNameReg,emailReg,hash], 
			(err, result) => {
				console.log(err);
			}
		);
	});
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

			if(result.length > 0){
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

app.post('/news', (req, res) => {
  const title = req.body.title;
  const date = req.body.date;
  const description = req.body.description;

  db.query(
    "INSERT INTO news (title, date, body) VALUES (?, ?, ?)",
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

app.post('/courseReg', (req, res) => {
  const name = req.body.name;
  const secondName = req.body.secondName;
  const mail = req.body.mail;

  db.query(
    "INSERT INTO courseParticipant (name, secondName, mail) VALUES (?, ?, ?)",
    [name, secondName, mail],
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

app.listen(3001, ()=>{
	console.log("running server");
})
