/**
 * Created by Wang Wenpeng on 2018/5/23.
 */
define(function (require, exports, module) {
    var native = require('js/modules/hybridapi');
    var App = {
        setUserInfo: function (userInfo) {
            native.setUserInfo(userInfo);
        },
        onPageEvent: function (eventId, data) {
            var o = {
                type: 2,
                eid: eventId,
                data: typeof data === 'undefined' ? '' : data
            };
            native.statisticsEvent(o);
        },
        onClickEvent: function (eventId, data) {
            var o = {
                type: 3,
                eid: eventId,
                data: typeof data === 'undefined' ? '' : data
            };
            native.statisticsEvent(o);
        }
    };
    module.exports = App;
});
