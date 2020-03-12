/**
 * @description 서버 포트, db 주소, 라우팅 정보 등록 (요청 패스를 통해 이를 처리 가능한 함수로 기능을 전달) 
 * @author Chang Hee
 */

require('dotenv').config();

module.exports = {
	server_port: 3000,
	db_url: process.env.db_url,
        
        db_schemas: [ 
                {file: './eventCalendar_schema', collection: 'eventCalendars', schemaName: 'eventCalendarSchema', modelName: 'EventCalendarModel'} 
                ,{file: './notification_schema', collection: 'notifications', schemaName: 'notificationSchema', modelName: 'NotificationModel'} 
        ], 

        // RESTful 방식에 맞게 path naming을 할까 생각했다. 
        // 하지만 method 이름은 동사명인데, path 이름은 명사형으로 작성해야 하므로 보수 및 확장에 큰 어려움이 생길 것으로 예상된다. 
        // 따라서 2020/03/06 현재 path 이름을 작성할 때 아래와 같은 기준을 적용한다. 
        // 1. path의 가장 앞에는 파일명을 적고 하위에 method 명을 소문자로 적는다. ex. users/deleteaccount 
        // 2. HTTP method는 전부 post 로 작성한다. (RESTful 방식과 다르므로 method를 달리 쓰는 것이 무의미하다고 생각함)   
	route_info: [
                //notification과 관련된 패스들 
                {file:'./notifications', path:'/notifications/crawldata', method:'crawlData', type:'post'}
                ,{file:'./notifications', path:'/notifications/deleteolddata', method:'deleteOldData', type:'post'}
                ,{file:'./notifications', path:'/notifications/translatedata', method:'translateData', type:'post'}
                
                //eventCalendarRequest와 관련된 패스들
                ,{file:'./eventCalendarRequests', path:'/eventcalendarrequests/checkandmoverequests', method:'checkAndMoveRequests', type:'post'}
        ],      
};  

