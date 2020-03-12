/**
 * @description 공지사항의 스키마 정의
 * @author Chang Hee
 */

const utils = require('../config/utils');
//createSchema 함수를 저장할 객체. module.exports에 할당하기 위함
let SchemaObj = {}; 

/**
 * @description 공지사항의 스키마 정의 
 * @param {Object} mongoose
 * @returns {Object} notificationSchema
 */
SchemaObj.createSchema = function(mongoose) {
	
	// 공지사항 스키마 정의
	const notificationSchema = mongoose.Schema({ 
 
            userId: {type: mongoose.Schema.ObjectId, ref: 'users'}, 
            nickNm: {type: String, default: 'noName'},
            profile: {type: String, trim:true, default: ' '},// 게시글 옆 사진
            likes: {type: Number, unique: false, default: 0}, 
            likesList: [{
                userId: {type: mongoose.Schema.ObjectId, ref: 'users'},  
                nickNm: {type: String, default: 'noName'}
            }], 
            created_at: {type: Date, default: utils.timestamp(), index: {unique: false}}, //크롤링한 날짜
            title: {type: String, trim:true, default: ' '},
            contents: {type: String, trim:true, default: ' '}, 
            /* 다른 언어로 번역된 title, contents_ 뒤에 붙는 언어 명: 
            https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes 
            */
            title_en: {type: String, trim:true, default: ' '},
            contents_en: {type: String, trim:true, default: ' '}, 
            title_en: {type: String, trim:true, default: ' '},
            contents_en: {type: String, trim:true, default: ' '}, 
            title_zh: {type: String, trim:true, default: ' '},
            contents_zh: {type: String, trim:true, default: ' '}, 
            // 다른 언어로 번역된 title, contents_ 끝
            pictures: {type: String, trim:true, default: ' '},  //게시글에 첨부된 사진
            hits: {type: Number, unique: false, default: 0}, // 조회 수     
            url: {type: String, trim:true, default: ' '}, //원본 url
            date: {type: Date, default: utils.timestamp()}, //게시글 작성일.
            isNotice: {type: Boolean, unique: false, default: false}, // 웹 페이지에서 '공지'라고 분류된 글이 따로 있음
            comments: [{   // 댓글           
                _id: {type: mongoose.Schema.ObjectId, default: new mongoose.Types.ObjectId()},
                userId: {type: mongoose.Schema.ObjectId, ref: 'users'},  
                nickNm: {type: String, default: 'noName'},
                boardId: {type: String, trim:true, default: ' '}, 
                parentReplyId: {type: mongoose.Schema.ObjectId, default: new mongoose.Types.ObjectId(utils.ZEROID)}, //부모 댓글의 id
                likes: {type: Number, unique: false, default: 0},
                contents: {type: String, trim:true, default: ' '},
                pictures: {type: String, trim:true, default: ' '}, 
                created_at: {type: Date, default: utils.timestamp()}, 
            }]
    });  
    notificationSchema.index({created_at: -1},{autoIndex: false}, {unique: false});
    console.log('notificationSchema 정의함.');
	return notificationSchema;
};

module.exports = SchemaObj;

