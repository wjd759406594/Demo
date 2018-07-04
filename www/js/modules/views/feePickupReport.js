/**
 * Created by denonzhu on 15/12/14.
 */
define(function (require, exports, module) {
    "use strict";
    var Core = require('js/modules/core/core');
    var native = require('js/modules/hybridapi');
    var attributes = Core.Cache.get('attributes');
    var $vue;
    var App = {
        init: function () {
            console.log("初始化成功");
            $vue = new Vue({
                el: '#vueBound',
                data: {
                    pickupState: false,
                    report: ""
                },
                watch: {},
                methods: {
                    getReport: function () {
                        App.getReport();
                    }
                }
            });
            window.$vue = $vue;
            this.initPicker("#start-time");
            this.initPicker("#end-time");
        },
        /**
         * 刷新车次列表
         */
        getReport: function () {
            $vue.report = "";
            Core.Service.get('api/auth/v1/ltl/operationReport/feePickup', {
                pickupState: $vue.pickupState ? 1 : 0,
                beginTime: $("#start-time").val() + " 00:00:00",
                endTime: $("#end-time").val() + " 23:59:59"
            }, function (result) {
                if (result['data']) {
                    $vue.report = result['data'];
                } else {
                    native.showToast("没有找到任何数据");
                }
            });
        },
        initPicker: function (el) {
            Core.App.calendar({
                input: el,
                value: [new Date()],
                dateFormat: 'yyyy-mm-dd'
            });
        }
    };
    Core.init(App);
    module.exports = App;
});