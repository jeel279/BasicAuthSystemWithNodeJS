const path = require('path')
const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer'); 
var admin = require('firebase-admin');
var CryptoJS = require("crypto-js");
var serviceAccount = require("./serviceAccount.json");
var fs = require('fs');

var API_KEY = '9588d458538b9847db5348f5b3973317-1b6eb03d-b1711c0d';
var DOMAIN = 'sandbox6692a6b6113048b5988729b53f2e2516.mailgun.org';
var mailgun = require('mailgun-js')({apiKey: API_KEY, domain: DOMAIN});


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

app.use(express.static('public'))


var allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  next();
}

app.use(bodyParser.json());       
app.use(allowCrossDomain);
app.use(bodyParser.urlencoded({   
  extended: true
})); 

app.get("/", function (req, res) {
    res.write('Under Constuction');
});


async function gd(){
  const snapshot = await db.collection('users').get();
  snapshot.forEach((doc) => {
    console.log(doc.id, '=>', doc.data());
  });
}

app.post('/getData', (req, res) => {
  gd();
})

var Ob = Object();

app.post('/addData', (req,res) => {
  var otp = Math.floor(1000 + Math.random() * 9000);
  Ob[req.body.email] = otp;
  let mailDetails = { 
    from:"AuthSys <authSys@admin.ml>",
    to: req.body.email,
    subject: 'Verification AuthSystem',
    html: "Veification code is <b>"+otp+"</b>"
   }; 
     
   mailgun.messages().send(mailDetails, (error, body) => {
    if(body["message"] == "Queued. Thank you.") res.send(true);
  });

})

async function ax(email){
  const cityRef = db.collection('users').doc(email);
  const doc = await cityRef.get();
  if (!doc.exists) {
    return false;
  }else{
    return true;
  }
}

async function ax2(uid,passwd){
  const cityRef = db.collection('users').doc(uid);
  const doc = await cityRef.get();
  if (doc.exists) {
    if(doc.data()["password"] == CryptoJS.SHA512(passwd).toString(CryptoJS.enc.Hex)) 
      return true;
    else
      return false;
  }else{
    const cityRefa = db.collection('users').where('phone','==',uid);
  const doca = await cityRefa.get();
  var oi = Object();
  if (!doca.empty) {
    doca.forEach(a => {
      oi = a.data();
    });
    if(oi["password"] == CryptoJS.SHA512(passwd).toString(CryptoJS.enc.Hex)){
      return true;
    }else{
      return false;
    }
  }else{
    return false;
  }
  }

  
}

async function ax3(passwd){
  const cityRef = db.collection('users').where('password','==',CryptoJS.SHA512(req.body.passwd).toString(CryptoJS.enc.Hex));
  const doc = await cityRef.get();
  if (!doc.empty) {
    return false;
  }else{
    return true;
  }
}

app.post('/auth', (req,res) => {
  ax2(req.body.userid,req.body.passwd).then(function(reas){res.send(reas)});

})

app.post('/qaz', (req,res) => {
  ax(req.body.email,req,res);
})

app.post('/checkOTP', (req,res) => {
  if(Ob[req.body.email] == req.body.otp){
    ax(req.body.email).then(function(rees){
      if(!rees){
        db.collection("users").doc(req.body.email).set({
          name: req.body.name,
          phone: req.body.phone,
          dob: req.body.dob,
          batch: req.body.batchid,
          password: CryptoJS.SHA512(req.body.password).toString(CryptoJS.enc.Hex)
        }).then(function() {
          res.send("Registered !");
          delete Ob[req.body.email];
        });  
      }else{
        res.send("Already Registered !");
        delete Ob[req.body.email];
      }})
    }else{
      res.send("Wrong");
      delete Ob[req.body.email];
    }
});

app.post('/checkStat', (req,res)=>{
var localS = JSON.parse(req.body.ls);
if(localS["auth"] != undefined){
fs.readFile('logged-in.html', function(err, data) {
  res.send(data);
  return res.end();
});
}else{
  fs.readFile('index.html', function(err, data) {
    res.send(data);
    return res.end();
  });
}
})

app.listen(process.env.PORT || 8080, function () {
 console.log("Server is running on localhost 8080");
});

