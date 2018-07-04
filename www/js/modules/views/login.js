/**
 * Created by denonzhu on 15/12/14.
 */
define(function (require, exports, module) {
    var Core = require('js/modules/core/core');
    var native = require('js/modules/hybridapi');
    var analytics = require('js/modules/core/analytics');
    var App;
    App = {
        init: function () {
            console.log("应用初始化");
            localStorage.setItem('needReload', "true");
            var userName = Core.Cache.get('loginName');
            var pwd = Core.Cache.get('password');
            $("#loginPage #userName").val(userName);
            $("#loginPage #pwd").val(pwd);
            this.initEvents();
            analytics.onPageEvent(0x2030001);

        },
        initEvents: function () {
            $('#loginPage').on('click', '#login', function () {
                var userName = $("#userName").val();
                if (userName.length < 2) {
                    native.showToast('请输入正确的账号');
                    return false;
                }
                var pwd = $("#pwd").val();
                if (pwd.length < 1) {
                    native.showToast('请输入密码');
                    return false;
                }
                localStorage.setItem('needReload', "true");
                Core.User.login(userName, pwd);
            });
        }
    };
    Core.init(App);
    module.exports = App;
});