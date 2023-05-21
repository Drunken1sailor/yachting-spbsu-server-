const express = require("express");
const mysql = require("mysql");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());


const db = mysql.createConnection({
  user: "u1497732_default",
  host: "localhost",
  password: "KgB63sJwwRE28Gqc",
  database: "u1497732_yachting-spbsu",
});

app.post('/register', (req, res)=>{

	const nameReg = req.body.nameReg;
	const secondNameReg = req.body.secondNameReg;
	const emailReg = req.body.emailReg;
	const passwordReg = req.body.passwordReg;

	db.query(
		"INSERT INTO participant (participant, secondName, email, password) VALUES (?, ?, ?, ?)", 
		[nameReg,secondNameReg,emailReg,passwordReg], 
		(err, result) => {
			console.log(err);
		}
	);
});

app.listen(3001, ()=>{
	console.log("running server");
})