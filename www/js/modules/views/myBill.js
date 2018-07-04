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
                    bills:[],
                    sqList: []
                },
                watch: {},
                methods: {
                    showDetail: function (item) {
                        App.showDetail(item);
                    },
                    getBill: function () {
                        //工资报表
                        App.getBill();
                    }
                }
            });
            window.$vue = $vue;
            this.initPicker("#start-time");
            this.initPicker("#end-time");
            this.initPicker("#start-time1");
            this.initPicker("#end-time1");
            $("body").on('pageAfterAnimation', '.page[data-page="myBill"]', function () {
               $vue.sqList =[];
            });
        },
        getBill: function () {
            $vue.report = "";
            Core.Service.get('api/auth//v1/sap/consumer/findIncomePayout', {
                beginTime: $("#start-time").val() + " 00:00:00",
                endTime: $("#end-time").val() + " 23:59:59"
            }, function (result) {
                if (result['data']) {
                    $vue.bills = result['data'];
                } else {
                    native.showToast("没有找到任何数据");
                }
            });
        },
        showDetail: function (item) {
            Core.Service.get('api/auth/v1/sap/consumer/incomePayoutDetail', {
                consumerNo:item['consumerNo'],
                type:item['type'],
                beginTime: $("#start-time").val() + " 00:00:00",
                endTime: $("#end-time").val() + " 23:59:59"
            }, function (result) {
                if (result['data'] && result['data']['rows'].length > 0) {
                    $vue.sqList = result['data']['rows'];
                } else {
                    native.showToast("暂无数据");
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