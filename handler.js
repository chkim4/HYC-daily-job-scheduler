/**
 * @description 하루에 한 번씩 실행해야하는 함수들 등록 
 * @author Chang Hee
 */


const notifications = require('./routes/notifications'); 
const eventCalendarRequests = require('./routes/eventCalendarRequests');
const app = require('./app');

const handler = async function(){ 
    await app.handler(); // 이걸 해야 원래 서버 및 데이터베이스 설정을 사용 가능.
    await notifications.crawlData();
    await notifications.translateData('en'); 
    await notifications.translateData('zh'); 
    await notifications.deleteOldData();
    await eventCalendarRequests.checkAndMoveRequests();
}; 

module.exports.handler = handler; 