/**
 * @description 데이터베이스(MongoDB)와 관련된 설정. 
 * app.js에서 database.db 와 같이 외부에서 객체를 직접 참조하는 경우가 있으므로 객체 전체를 export 함 
 * @author Chang Hee
 */

require('dotenv').config();
const mongoose = require('mongoose');  

// database 객체에 db, schema, model 모두 추가
let database = {};
const MongoClient = require("mongodb").MongoClient; 

/**
 * @description 데이터베이스에 연결하고 응답 객체의 속성으로 db 객체 추가 
 * @param {Object} app - app.js에서 설정한 app 객체
 * @param {Object} config - config/config.js에서 설정한 config 객체  
 */
database.connect = (app, config) => { 
	console.log('connect() 호출됨.');
	
	// 데이터베이스 연결: config의 설정 사용
	mongoose.connect(config.db_url, { useNewUrlParser: true, useUnifiedTopology: true }); 
	
	// 워닝 안 뜨게 하려는 거
	mongoose.set('useFindAndModify', false);
	mongoose.set('useCreateIndex', true);
	
	//데이터베이스 설정
	database.db = mongoose.connection;
	database.db.on('error', console.error.bind(console, 'mongoose connection error.'));	
	database.db.on('open', () => {
		console.log('데이터베이스에 연결되었습니다. : ' + config.db_url);

		// config/config.js에 등록된 스키마 및 모델 객체 생성
		createSchema(app, config);
	});
	database.db.on('disconnected', database.connect);
}

/**
 * @description config/config.js에 정의된 스키마 및 모델 객체 생성 
 * @param {Object} app - app.js에서 설정한 app 객체
 * @param {Object} config - config/config.js에서 설정한 config 객체  
 */
const createSchema = (app, config) => {
	const schemaLen = config.db_schemas.length;
	console.log('설정에 정의된 스키마의 수 : %d', schemaLen);
	
	for (let i = 0; i < schemaLen; i++) {
		let curItem = config.db_schemas[i];
		
		// config/config.js의 db_schemas의 모든 원소를 로드함으로써 각 스키마의 createSchema() 함수 호출
		let curSchema = require(curItem.file).createSchema(mongoose);
		console.log('%s 모듈을 불러들인 후 스키마 정의함.', curItem.file);
		
		// config/config.js의 db_schemas의 모든 원소를 로드함으로써 각 컬렉션의 모델 정의
		let curModel = mongoose.model(curItem.collection, curSchema);
		console.log('%s 컬렉션을 위해 모델 정의함.', curItem.collection);
		
		// database 객체에 속성으로 각각의 스키마와 모델을 추가
		database[curItem.schemaName] = curSchema;
		database[curItem.modelName] = curModel;
		console.log('스키마 이름 [%s], 모델 이름 [%s] 이 database 객체의 속성으로 추가됨.', curItem.schemaName, curItem.modelName);
	}
	
	app.set('database', database);
	console.log('database 객체가 app 객체의 속성으로 추가됨.');
} 

/**
 * @description 데이터베이스에 연결 여부를 확인 후, 연결이 안 되어 있을 시 연결. 데이터베이스 객체 반환   
 * @returns {Object} database - MongoDB 데이터베이스 객체 
 */
database.getDatabase = async () => {
	console.log("getDatabase 호출");
	const client = new MongoClient(process.env.db_url, {
		useNewUrlParser: true, useUnifiedTopology: true
	  });
	  
	  /**
 		* @description 데이터베이스 연결 후 데이터베이스 객체 반환  
 		* @returns {Object} database - MongoDB 데이터베이스 객체 
 		*/
	  const createConn = async () => {
		await client.connect();
		const database = client.db('db');  
		return database;		
	  }; 
	  
	  /**
 		* @description 데이터베이스 연결 시도(try) 하는 함수  
		* @returns {Object} createConn() 
		* @throws createConn()에 에러 생길 시 에러를 throw함   
 		*/
	  const connection = async function(){  
		if (!client.isConnected()) { 
			// Cold start or connection timed out. Create new connection.
			try { 
				console.log("connection completed"); 
				return await createConn();
			} catch (e) { 
				return e;
			}
		}    
	  } 
	return await connection();
}

// database 객체를 module.exports에 할당
module.exports = database;
