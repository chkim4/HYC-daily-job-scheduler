/**
 * @description 사용자의 등록 후, 관리자의 승인을 받지 않은 일정 일정(eventCalenderRequests)에 
 * 관련된 라우터의 콜백 함수 정의. eventCalendar 와는 달리 contents 부재. title만 존재. 
 * config/config와 route_loader를 이용하여 등록
 * @author Chang Hee
 */
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;  
const moment = require('moment');   
const utils = require('../config/utils'); 
const localDB = require('../database/database'); // 로컬로 설정한 데이터베이스를 사용하기 위함. insert시 스키마 적용 용도
const getDatabase = require('../database/database').getDatabase;

///////////함수들 및 전역 변수 시작/////////// 
const REQUEIRED_REQUESTS = 2;  // eventcalendar 로 이동하기 위해 필요한 요구 수 
const DISPLAY_DATES = 2; // eventcalendar로 이동할 때 보여 지는 날짜의 수  
///////////함수들  및 전역 변수 끝///////////

/**
 * @description 동일한 title을 가진 request들이 REQUEIRED_REQUESTS 보다 많이 저장될 경우 
 * 해당 request를 eventcalendarrequests에서 전부 삭제 후 eventcalendars로 옮긴다. 
 * 작성자 정보: 가장 처음에 request를 작성한 사람 
 * 날짜 정보: 모든 request 들 중에서 가장 많은 startDate와 endDate
 * 이전 시 contents: localContents에 저장된 방식
 *  
 */
const checkAndMoveRequests = async function(){ 
  console.log('eventcalendarrequests/checkandmoverequests 호출됨.');
  const database = await getDatabase();  

  if (!(database instanceof Error)) {   
    database
      .collection('eventcalendarrequests')
      .aggregate([
        {
          $group:
            { //_id: 그룹화 할 field를 설정.
              //count: 그룹 당 포함된 원소의 갯수
               _id : {title: '$title'}, 
              count: { $sum: 1}
            } 
        }, 
        {
          $match:
            {
              count: {$gte: REQUEIRED_REQUESTS}
            }
        }
      ], function(err,titles){
          if(err){
            console.log('eventcalendarrequests/checkandmoverequests에서 title 그룹화 중 에러 발생: ' + err.stack); 
            return;
          } 
          titles.forEach( function(items) {  
            //옮겨야 하는 title 들을 날짜 별로 나누어서 날짜의 최빈값과 2번째로 많이 나오는 date 값을 추출
            database
              .collection('eventcalendarrequests')
              .aggregate([
                {
                  $match:
                    {
                      title: items._id.title
                    }
                }, 
                {
                  $group:
                    {
                      _id : {startDate: '$startDate'}, 
                      count: { $sum: 1}
                    }  
                }, 
                {
                  $sort: 
                    {
                      count: -1
                    }
                }
              ])
              .toArray( function(err,dates){
                  if (err) {
                    console.log('eventcalendarrequests/checkandmoverequests에서 date 그룹화 중 에러 발생: ' + err.stack);  
                    return;
                  }  
                  database
                    .collection('eventcalendarrequests')
                    .find({title: items._id.title}) 
                    .sort({created_at: 1})
                    .toArray( function(err,results) {
                      if (err) {
                        console.log('eventcalendarrequests/checkandmoverequests에서 일정 조회 중 에러 발생: ' + err.stack); 
                        return;
                      }  
                      //user에 대한 정보를 찾기 위함: 현재: 요청을 가장 처음 보냈던 사람
                      database
                        .collection('users')
                        .findOne({_id: new ObjectId(results[0].userId)}, function (err,user){
                          if (err) {
                            console.log('eventcalendarrequests/checkandmoverequests에서 사용자 조회 중 에러 발생: ' + err.stack);  
                            return;
                          }    
                          let localContents = utils.dateToContents(moment(dates[0]._id.startDate).format('YYYY-MM-DD')) + 
                                              ' ~ ' + utils.dateToContents(moment(dates[0]._id.endDate).format('YYYY-MM-DD'));
                          
                          //dates.length < DISPLAY_DATES 일 때를 고려하여 loopCount 추가
                          const loopCount = dates.length < DISPLAY_DATES 
                                              ? dates.length 
                                              : DISPLAY_DATES;
                          
                          for(let i=1; i<loopCount; i++){  
                            localContents = localContents + '\n' + utils.dateToContents(moment(dates[i]._id.startDate).format('YYYY-MM-DD')) 
                                            + ' ~ ' + utils.dateToContents(moment(dates[0]._id.endDate).format('YYYY-MM-DD'));   
                          }   
                          //Request => EventCalendar로 저장
                          const newEvent = localDB.EventCalendarModel({
                            startDate: dates[0]._id.startDate, 
                            endDate: results[0].endDate, 
                            title: results[0].title,
                            contents: localContents,     
                            userId: new ObjectId(user._id),
                            nickNm: user.nickNm,  
                            adminWrote: user.isadmin, 
                            url: results[0].url, 
                            type: results[0].type, 
                            created_at: utils.timestamp()
                          });
                          database
                            .collection('eventcalendars')
                            .insertOne(newEvent, function(err) {
                              if (err) {
                                  console.log('eventcalendarrequests/checkandmoverequests 안에서 일정을 eventcalendars에 저장 중 에러 발생: '+ err.stack);
                                  return;
                              } 
                            }); 
                          console.log('EventCalendar에 추가 완료.');   		    
                          //eventcalendarrequests에서 해당 일정 전부 삭제
                          database
                            .collection('eventcalendarrequests')
                            .deleteMany({title: items._id.title}, function (err) {
                              if (err) {
                                console.log('eventcalendarrequests/checkandmoverequests에서 저장 완료한 Request 제거 중 에러 발생: '+ err.stack)
                                return;
                              }  
                              console.log('EventRequest에서 삭제 완료.');
                              return;
                            }); 
                        });//collection('users').findOne닫기
                    });//collection('eventcalendarrequests').find 닫기 
              });//aggregate - date 닫기 
          });//titles.forEach닫기  
          return;
        });//aggregate - title 닫기 
  } else {  
    console.log('eventcalendarrequests/checkandmoverequests 수행 중 데이터베이스 연결 실패');
    return;
  } 
}; //checkAndMoveRequests 닫기   

module.exports.checkAndMoveRequests = checkAndMoveRequests; 