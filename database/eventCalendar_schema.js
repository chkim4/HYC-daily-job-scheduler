/**
 * @description 이벤트 캘린더의 스키마 정의 (프런트 엔드 개발 완료 후 수정 가능)
 * @author Chang Hee
 */

//createSchema 함수를 저장할 객체. module.exports에 할당하기 위함 
let SchemaObj = {}; 

const utils = require('../config/utils');

/**
 * @description 이벤트 캘린더의 스키마 정의 
 * @param {Object} mongoose
 * @returns {Object} eventCalendarSchema
 */
SchemaObj.createSchema = function(mongoose) {
	
	// eventcalendar 스키마 정의
	const eventCalendarSchema = mongoose.Schema({ 
        
        startDate: {type: Date, default: utils.getISODate(utils.timestamp())}, //행사 시작 날짜  
        endDate: {type: Date, default: utils.getISODate(utils.timestamp())}, // 행사 종료 날짜 
        title: {type: String, trim:true, default: ' '},
        contents: {type: String, trim:true, default: ' '},     
        userId: {type: mongoose.Schema.ObjectId, ref: 'users'}, //작성한 사용자의 고유 식별 번호
        nickNm: {type: String, default: 'noName'},  
        adminWrote: {type: Boolean, default: false}, //해당 이벤트가 관리자가 작성한 것인 지를 나타냄.
        url: {type: String, default: ' '}, 
        type: [], // 행사의 type들 ex. Official 
        created_at: {type: Date, default: utils.timestamp()}
    });  
    eventCalendarSchema.index({date: -1},{autoIndex: false}, {unique: false});
    console.log('eventCalendarSchema 정의함.');
	return eventCalendarSchema;
};

module.exports = SchemaObj;

