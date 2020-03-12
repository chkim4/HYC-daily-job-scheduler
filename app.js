/**
 * @description 서버 app 설정 (하루에 한 번씩 실행하는 함수 용) 
 * 				../config/config, ../database/database에 설정되어 있는 내용으로 서버 생성 및 데이터베이스 연결 
 * @author Chang Hee
 */

// Express 기본 모듈 불러오기
const express = require('express');
const http = require('http');
const serverless = require('serverless-http'); 

// Express의 미들웨어 불러오기. (이거 없으면 let a = req.body.~id 이런 식으로 데이터 받기 불가능)
const bodyParser = require('body-parser');

// 모듈로 분리한 설정 파일 불러오기
const config = require('./config/config');

// 모듈로 분리한 데이터베이스 파일 불러오기
const database = require('./database/database');

// 모듈로 분리한 라우팅 파일 불러오기
const route_loader = require('./routes/route_loader');

// 익스프레스 객체 생성
const app = express(); 

//===== 서버 변수 설정 및 연결  =====//
console.log('config.server_port : %d', config.server_port);
app.set('port', process.env.PORT || 3000);
 

// body-parser를 이용해 application/x-www-form-urlencoded 파싱
app.use(bodyParser.urlencoded({ extended: false }))

// body-parser를 이용해 application/json 파싱
app.use(bodyParser.json());

//라우팅 정보를 읽어들여 라우팅 설정
const router = express.Router();
route_loader.init(app, router);  

//===== 서버 시작 =====//   

//확인되지 않은 예외 처리 - 서버 프로세스 종료하지 않고 유지함
process.on('uncaughtException', (err) => {
	console.log('uncaughtException 발생함 : ' + err);
	console.log('서버 프로세스 종료하지 않고 유지함.');
	console.log(err.stack);
});

// 프로세스 종료 시에 데이터베이스 연결 해제
process.on('SIGTERM', () => {
    console.log("프로세스가 종료됩니다.");
    app.close();
});

app.on('close', () => {
	console.log("Express 서버 객체가 종료됩니다.");
	if (database.db) {
		database.db.close();
	}
});

/**
 * @description 서버 생성 및 데이터베이스 연결 
 * @param {Object} app - 위에서 설정한 app 객체
 * @returns {Promise<{app: import("express").Express>}>} 
 * @fires createServer#callback  
 */ 
const server = http.createServer(app).listen(app.get('port'), () => { 

	console.log('서버가 시작되었습니다. 포트 : ' + app.get('port'));
	// 데이터베이스 초기화
	database.connect(app, config); 
});

//AWS에서 사용하기 위해 export 함.
module.exports.handler = serverless(app)  

