/**
 * @description 다양한 function 저장  
 * @author Chang Hee
 */

const moment = require('moment');

/**
 * @description GMT + 9 기준 현재 시간을 'YYYY-MM-DD HH:mm:ss' 꼴로 반환
 * @returns {*} moment().format()   
 */ 
const timestamp = function(){
  return new Date(moment().add(9, 'hours').format("YYYY-MM-DD HH:mm:ss"));
};

/**
 * @description 날짜 형식을 ISO 형식으로 반환  
 * @param {String} Data - ISO 형식으로 바꾸고자 하는 날짜. '2019-01-01' 형식 등
 * @returns {Object} date - ISO Date 형식. T00:00:00.000Z. EventCalendar에서만 사용하므로 시간, 분, 초는 미지정  
 */ 
const getISODate = function(Data){ 
  // eventCalendar/addEvent 처럼 인풋 값이 ISO 형식으로 들어오는 경우도 있으므로 moment(Data).format을 먼저 쓴다
  const date = new Date(moment(Data).format("YYYY-MM-DD")+"T00:00:00.000Z");
  return date;
};

/**
 * @description EventCalendar로 보낼 때 contents에 포함될 날짜 정보. 그 날짜와 더불어 들어갈 내용을 정의
 *              (프런트 엔드에서 개발을 진행하지 못해서 들어갈 내용은 날짜 앞 "Date: "를 붙이는 것으로 임의로 정함)
 * @param {String} date - '2019-01-01' 형식 
 * @returns {String} - 'Date: 2019-01-01' 형식   
 */
const dateToContents = function(date){ 
  return "Date: " + date;
}; 

////////////////////전역변수////////////////////

/**
 * @description ObjectId 값이 0일 때 사용하는 string 
 */
const ZEROID = '000000000000000000000000'; 

module.exports.timestamp = timestamp; 
module.exports.getISODate = getISODate;
module.exports.dateToContents = dateToContents;  
module.exports.ZEROID = ZEROID;