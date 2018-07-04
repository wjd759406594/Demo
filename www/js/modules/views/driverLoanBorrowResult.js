/**
 * Created by cc on 18/06/12.
 */
define(function (require, exports, module) {
    var native = require("js/modules/hybridapi");
    var Core = require('js/modules/core/core');
    var $vue;
    var App = {
        init: function () {
            console.log("页面js初始化成功");
            $vue = new Vue({
                el: '#vueBound',
                methods: {
                    close: function () {
                        console.log("页面关闭");
                        Core.Page.changePage("driverLoanIndex.html", true);
                    },
                }
            });

        },

    }


    window.App = App;
    // window.refresh = App.findApplyList;
    Core.init(App);
    module.exports = App;
});