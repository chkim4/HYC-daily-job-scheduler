/**
 * @description 공지사항(notification)에 관련된 라우터들의 콜백 함수 정의. 
 * config/config와 route_loader를 이용하여 등록
 * @author Chang Hee, Taek Joon
 */

const axios = require('axios');
const cheerio = require('cheerio');
const mongoose = require('mongoose'); 
const ObjectId = mongoose.Types.ObjectId;
const moment = require('moment'); 
const utils = require('../config/utils'); 
const localDB = require('../database/database'); // 로컬로 설정한 데이터베이스를 사용하기 위함. insert시 스키마 적용 용도
const getDatabase = require('../database/database').getDatabase;
//번역에 필요한 api
const api = 'AIzaSyATLbXuBnhHhb1Meyv2WFa6Lpw5FCupc8I';
const translate = require('google-translate')(api); 

//전역 변수 선언 시작 //  
const NOTIFICATIONS = 'https://www.dic.hanyang.ac.kr/front/student/notice?page=1&per-page=6'; 

// 공지 사항의 각 항목의 contents를 크롤링 하기 위해 사용. 
// 공지 사항의 각 항목의 내용: NOTIICATIONS에서 각 항목에 접속해야 얻을 수 있음.
// 공지 사항에 사진이 있을 경우, 사진의 url 앞 부분에 사용
const HYU_URL = 'https://www.dic.hanyang.ac.kr'; 

//관리자 계정의 _id, nickNm 값
const ADMIN_ID = '5e538166ae5af8553c58a4dc';  
const ADMIN_NICKNM = 'admin';  

const REGEX_KOR = new RegExp('^[\uac00-\ud7a3]*$'); //한국어 정규표현식
const REGEX_ENG = new RegExp('^[A-Za-z]*$'); //영어 정규표현식
const REGEX_ZH = new RegExp('^[\u4e00-\u9fff]*$','u'); //중국어 정규표현식
//전역 변수 선언 끝 //

/**
 * @description 한양대 홈페이지로부터('https://www.dic.hanyang.ac.kr/front/student/notice?page=1&per-page=6') 
 * 데이터베이스에 등록되지 않은 공지사항들을 크롤링.    
 */    
const crawlData = async function() { 
    
    console.log('notifications/crawldata 호출됨.');
    const database = await getDatabase();

    if (!(database instanceof Error)) {   
        await axios
            .get(NOTIFICATIONS) 
            .then( async response =>  {
                let ulList = []; // 파싱한 데이터(제목, url, 날짜)를 담을 리스트 생성
                const $ = cheerio.load(response.data); 

                // 각각의 제목, 날짜, url이 담겨 있는 DOM 요소(li)를 bodyList로 지정 
                // 'ul.board-default-list': 홈페이지 중 ul의 class 이름. 복수의 li 포함
                // 각 li에 해당 글이 '공지' 인지의 여부, 새 글 이지의 여부, title, 작성 일자에 대한 정보를 포함  
                const $bodyList = $('ul.board-default-list').children('li'); 
                
                // li 각각의 title, url, 공지사항인지의 여부를 ulList에 저장
                $bodyList.each(function(i, elem) { 
                    ulList[i] = {  
                        title: $(elem).find('span.subject').text().trim().replace('수정됨', '').replace('새 글', '').replace(/\t/g,''),
                        url: $(elem).find('a').attr('href'),
                        isNotice: $(elem).find('a div.first span').hasClass('notice')
                    };  
                });  
                
                for(let i = 0; i < ulList.length; i++) {
                
                    // ulList[i].url 은 HYU_URL을 포함하지 않으므로 변경.
                    let url = HYU_URL + ulList[i].url;                     

                    await axios
                        .get(url) 
                        .then( response2 => {
                                const $ = cheerio.load(response2.data);
                                const $contentsList = $('div.content'); 

                                //add를 안 하면 게시물 작성 시간 -9 시간에 해당하는 시간을 반환함
                                const date = moment($('span.datetime').text()).format('YYYY-MM-DD HH:mm:ss'); 
                                const ISOdate = utils.getISODate(date); // 시간,분, 초는 공지 사항 별로 다르므로 일관성 있게 비교하기 위한 date 값이 필요함
                                const today = utils.getISODate(utils.timestamp());
                                //오늘 새로 작성된 공지사항이 아니라면 삽입하지 않고 넘어간다 
                                if (ISOdate < today) {
                                    console.log('오늘 업로드 된 내용이 아니라서 크롤링 하지 않고 다음 항목으로 넘어감');
                                    return;
                                }  
    
                                let contents = ''; // p, div 태그에 있는 내용을 임시로 저장하는 변수  
                                const pictures = $contentsList.find('img').attr('src') === undefined //사진의 링크를 저장하는 변수  
                                                    ? '' 
                                                    : HYU_URL + $contentsList.find('img').attr('src');
                                
                                // DOM 요소 p를 만날 때마다 그 안의 텍스트 저장 + 개행 
                                // 사진 포함해서 공지 사항의 내용이 줄 단위로 p 태그 사용함.
                                if($contentsList.find('p')) { 
                                    $contentsList.find('p').each(function() {
                                        if($(this).text()) {
                                            contents = contents + $(this).text().trim() + '\n';
                                        }  
                                    })
                                }
                                else if($contentsList.find('div')) { // DOM 요소 div를 만날 때마다 그 안의 텍스트 저장 + 개행
                                    $contentsList.find('div').each(function() {
                                        if($(this).text()) {
                                            contents = contents + $(this).text().trim() + '\n';
                                        }
                                    })
                                }     
                                const newNotification = localDB.NotificationModel({
                                    userId: new ObjectId(ADMIN_ID), // 관리자 계정의 ID 부여 
                                    nickNm: ADMIN_NICKNM, //관리자 계정의 닉네임
                                    profile: '',// 게시글 옆 사진
                                    likes: 0, 
                                    likesList: [], //게시물에 좋아요를 누른 사람들의 목록
                                    created_at: utils.timestamp(),
                                    title: ulList[i].title,
                                    contents: contents, 
                                    title_en: '', 
                                    contents_en: '', 
                                    title_zh: '', 
                                    contents_zh: '',
                                    pictures: pictures,  //링크
                                    url: url, 
                                    date: date,
                                    hits: 0, // 조회 수    
                                    comments: [],
                                    isNotice: ulList[i].isNotice
                                }); 
                                database
                                    .collection('notifications')
                                    .insertOne(newNotification, function(err) {
                                        if(err){
                                            console.log('notifications/crawldata에서 크롤링 후 저장 중 에러 발생: ' + err.stack)
                                            
                                            return;
                                        } 
                                        return; 
                                    }); 
                                console.log('삽입 완료'); 
                                return;  
                            })// getNotificationContents.then 닫기 
                            .catch(err => { 
                                console.log( 'notifications/crawldata에서 contents, date 크롤링 중 에러 발생' + err.stack);  
                                return;
                            });
                }//for 문 닫기  
                return;    
            })// getNotificationList.then 닫기  
            .catch(err => { 
                console.log( 'notifications/crawldata에서 title 크롤링 중 에러 발생' + err.stack);  
                return;
            });  
    } else {
        console.log('notifications/crawldata 수행 중 데이터베이스 연결 실패');
        
        return;
    }                
};//crawlData 닫기 

/**
 * @description 현재 게시글들 중 원본 페이지에 존재하지 않은 글 들을 삭제한다. 
 * 각 게시물의 url 속성에 axios로 요청을 보내고 에러가 나올 시 존재하지 않는 페이지로 간주한다. 
 */ 
const deleteOldData = async function() {

    console.log('notifications/deleteolddata 호출됨.');
    const database = await getDatabase();

    if (!(database instanceof Error)) {   
        database
            .collection('notifications')
            .find({},async function(err,results){
                if (err) {
                    console.log('notifications/deleteolddata에서 게시물 조회 중 에러 발생: ' + err.stack); 
                    return;
                } 
                results.forEach(async (items) => {
                    await axios
                        .post(items.url) 
                        .catch(( err ) => {      
                                database
                                    .collection('notifications')
                                    .deleteOne({_id: new ObjectId(items._id)}, function(err1){
                                        if(err1){
                                            console.log('notifications/deleteolddata에서 게시글 삭제 중 에러 발생: '+ err1.stack);
                                            return;
                                        }
                                        console.log('notifications/deleteolddata를 통해 데이터베이스에서 웹 페이지에 존재하지 않은 게시물 제거 완료');
                                        return;
                                    });
                        });   
                });
                console.log('notifications/deleteOldData 작업 완료'); 
                return;
            });
    } else {
        console.log('notifications/deleteolddata 수행 중 데이터베이스 연결 실패'); 
        return;
    }                
};//deleteOldData 닫기

/**
 * @description req.body.language에 해당하는 언어로 게시물의 제목과 내용을 번역함. 
 * 2020/03/01 현재: title_en, contents_en, title_zh, contents_zh 만 두어서 영어, 중국어로 번역한 내용을 데이터베이스에 저장 
 * ex. 영어로 번역 시 (req.body.language = 'en') title_en = '' 인 게시물들만 번역 
 * 크롤링한 게시물의 내용: 첫 글자, 중간 글자의 언어 파악 => 두 글자의 언어가 같고, 
 * 중간 글자로부터 10글자 이내의 언어가 같아야 번역함. 
 *   
 * 가끔씩 동일한 내용을 한국어, 영어, 중국어 로 작성된 게시물이 있어서 위와 같은 작업을 함. 
 * 사진에 있는 언어 번역은 아직 수행 안 함.  
 * @param {String} language - 번역할 언어. ISO-639-1 의 형태로 써야 함.
 */
const translateData = async function(language) {
    const database = await getDatabase();
    console.log('notifications/translatedata 호출됨.');  

    //https://ko.wikipedia.org/wiki/ISO_639-1_%EC%BD%94%EB%93%9C_%EB%AA%A9%EB%A1%9D 
    // 위 사이트에 있는 코드 중 639-1 에 맞게 써야 함 
    
    // updateObj: 업데이트 할 쿼리를 title, contents 순의 array에 저장. ex. [{title_en: ''}, {contents_en: ''}]
    //titleField: 업데이트 할 title의 필드 명 
    //contenstField: 업데이트 할 contents의 필드 
    let updateObj = {};   
    let titleField = 'title_en'; 
    let contentsField = 'contents_en';

    //titleFiled, titleContents를 language에 맞게 업데이트 
    // 새 언어 추가 시 case를 추가하고 titleField 와 contentsField에 필드명을 각각 부여하면 된다.
    switch(language){

        case('en'): 
            titleField = 'title_en'; 
            contentsField = 'contents_en';
            break;
        
        case('zh'):
            titleField = 'title_zh'; 
            contentsField = 'contents_zh';
            break;

        default:
            titleField = 'title_en'; 
            contentsField = 'contents_en';
            break;
    }// switch 닫기 
    
    if (!(database instanceof Error)) {          
        database
            .collection('notifications')
            .find(updateObj)
            .toArray( function(err, results) {   
                if(err) {
                    console.log('notifications/translatedata에서 번역할 게시물 조회 중 에러 발생: '+ err.stack); 
                    return;    
                } 
                
                results.map( (items) =>  {   
                    let startLanguage = 'und'; //첫 글자 언어 (undefined)
                    let middleLanguage = 'und'; // 중간 글자 언어 (undefined)
                    let i=0;  
                    let j=0;
                    
                    // 유효한 첫 글자의 언어를 파악하기 위함. 
                    // 사진만 있는 경우를 구별하기 위해 if 문 사용
                    if(items.contents.length>0){
                        do { 
                            if(REGEX_KOR.test(items.contents.charAt(i))){
                                startLanguage = 'ko' 
                                break;
                            } 
                            if(REGEX_ENG.test(items.contents.charAt(i))){
                                startLanguage = 'en'  
                                break;
                            }                         
                            if(REGEX_ZH.test(items.contents.charAt(i))){  
                                startLanguage = 'zh'
                                break;
                            }    
                            i++;
                        } while (true);  

                        // 유효한 중간 글자와 그 글자로부터 10 글자 이후의 글자들을 이용하여 
                        // 해당 게시글이 복수의 언어로 쓰어진 졌는 지의 여부 판단. 
                        // 게시글 중에 영어, 중국어로 동시에 쓰어져 있는 게시물은 번역을 안 함.
                        // 게시글 중에 한국어와 영어가 섞여 있는 것을 대비해 
                        // 중간 글자로부터 10글자 이후의 글자들을 같이 테스트함 
                        do { 
                            let middleIndex = Math.floor(items.contents.length/2)+j;
                            let middleChar = items.contents.charAt(middleIndex);  

                            if(REGEX_KOR.test(middleChar) && 
                                REGEX_KOR.test(items.contents.substring(middleIndex, middleIndex+10))){
                                
                                    middleLanguage = 'ko';     
                                    break;
                            } 
                            if(REGEX_ENG.test(middleChar) && 
                                REGEX_ENG.test(items.contents.substring(middleIndex, middleIndex+10))){
                                    
                                    middleLanguage = 'en';     
                                    break;       
                            }                   
                            if(REGEX_ZH.test(middleChar) && 
                                REGEX_ZH.test(items.contents.substring(middleIndex, middleIndex+10))){
                                
                                    middleLanguage = 'zh';     
                                    break;
                            }     
                            j++;
                        }while (true); 
                    }//if 문 닫기  
                    console.log('startLanguage: ',startLanguage); 
                    console.log('middleLanguage: ',middleLanguage);
 
                    //title 번역 
                    translate
                        .translate(items.title, language, function(err, translatedTitle) {
                            if(err){        
                                console.log('notifications/translatedata 중 if(toTranslate) 내에서 title 번역 중 에러 발생: ' + err.stack)
                                 
                                return; 
                            }  
                            console.log('title 번역 완료. 번역 내역: ',translatedTitle);
                    
                            //contents 번역시 (contents가 한 가지 언어로만 작성되고, 그 언어가 language와 다를 경우)
                            const toTranslate = (startLanguage === middleLanguage) && startLanguage !== language;
                            
                            //title은 무조건 번역해야 하므로 updateObj에서 title을 수정할 쿼리를 업데이트 
                            updateObj[titleField] = translatedTitle.translatedText;                            ;
                            
                            if (toTranslate) { 
                                translate
                                    .translate(items.contents, language, function(err, translatedContents) {
                                        if(err){
                                            console.log('notifications/translatedata 중 if(toTranslate) 내에서 contents 번역 중 에러 발생: ' + err.stack)
                                            return; 
                                        }   
                                        //contents를 수정할 쿼리 업데이트
                                        updateObj[contentsField] = translatedContents.translatedText; 
                                        
                                        database
                                            .collection('notifications')
                                            .findOneAndUpdate({_id: new ObjectId(items._id)},
                                                {$set: updateObj},
                                            function(err){
                                                if(err){
                                                    console.log('notifications/translatedata 중 if(toTranslate) 내에서 title_en, contents_en 삽입 중 에러 발생: ' + err.stack);
                                                    return; 
                                                } 
                                                console.log('contents를 en으로 번역 완료, 번역 내역: ',translatedContents); 
                                                return;
                                            }) 
                                    })//translate - contents 닫기 
                            }//if(toTranslate) 닫기   
                            else{ //title만 번역. updateObj = {title_(언어): translatedTitle}
                                database
                                    .collection('notifications')
                                    .findOneAndUpdate({_id: new ObjectId(items._id)}, {$set: updateObj},
                                    function(err){
                                        if(err){
                                            console.log('notifications/translatedata 중 title_en, contents_en 삽입 중 에러 발생: ' + err.stack)
                                            return; 
                                        }
                                    }) 
                            }
                        });//translate - title 닫기 
                });//results.map 닫기 
                console.log('translate 완료');   
                return;             
            });//collection('notifications).find 닫기         
    }//if(database) 닫기 
    else{
        console.log('notifications/translatedata 수행 중 데이터베이스 연결 실패'); 
        return;
    }   
};  

module.exports.crawlData = crawlData; 
module.exports.deleteOldData = deleteOldData;
module.exports.translateData = translateData; 
 
