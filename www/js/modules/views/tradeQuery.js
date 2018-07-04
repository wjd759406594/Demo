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
                    list: [],
                    startTime:"",
                    endTIme:"",
                    type:"all"
                },
                watch: {},
                methods: {
                    getReport: function () {
                       // App.getReport();
                    }
                }
            });
            this.initPicker("#start-time");
            this.initPicker("#end-time");

            $('body').on('pageAfterAnimation', '.page[data-page="tradeList"]', function () {
               App.getList();
            }).on('refresh','#queryList',function(){
                App.getList();
            });
        },
        /**
         *库管工资
         */
        getList: function () {
            console.log('aaa');
            $vue.list = [];
            Core.Service.get('api/auth/v1/sap/consumer/privateBill', {
                beginTime: $vue.startTime + " 00:00:00",
                endTime: $vue.endTime + " 23:59:59",
                type:$vue.type
            }, function (result) {
                if (result['data'] && result['data']['rows'].length>0) {
                    $vue.list = result['data']['rows'];
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