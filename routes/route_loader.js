/**
 * @description config/config에서 route_info[]에 작성된 모든 객체를 현재 서버(app) 설정에 추가
 * @author Chang Hee
 */

const config = require('../config/config');
let route_loader = {};

/**
 * @description config/config에서 route_info[]에 작성된 모든 객체를 현재 서버(app) 설정에 추가 
 * @param {Object} app - 파라미터로 받은 router 의 설정을 적용하는 app.  
 * @param {Object} router - config/config의 route_info[]의 설정들을 적용하는 express.Router() 객체 
 */
route_loader.init = function(app, router) {
	console.log('route_loader.init 호출됨.'); 
	const infoLen = config.route_info.length;
	
	console.log('설정에 정의된 라우팅 모듈의 수 : %d', infoLen);
 
	for (let i = 0; i < infoLen; i++) {
		const curItem = config.route_info[i];
		// 모듈 파일에서 모듈 불러옴  
		
		const curModule = require(curItem.file);
		console.log('%s 파일에서 모듈정보를 읽어옴.', curItem.file);
		
		//  라우팅 처리
		switch(curItem.type) {
			
			case('get'): 
				router.route(curItem.path).get(curModule[curItem.method]);
				break;  
			
			case('post'): 
				router.route(curItem.path).post(curModule[curItem.method]); 
				break; 
				
			case('put'): 
				router.route(curItem.path).put(curModule[curItem.method]); 
				break; 
			
			case('delete'): 
				router.route(curItem.path).delete(curModule[curItem.method]); 
				break;

			default:  
            	router.route(curItem.path).post(curModule[curItem.method]); 
				break;
		
		} 
		console.log('라우팅 모듈 [%s]이(가) 설정됨.', curItem.method);
	}
    // 라우터 객체 등록
    app.use('/', router);
};

module.exports = route_loader;

