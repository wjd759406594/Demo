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
                    report: "",
                    xfReport:"",
                    fhReport:""
                },
                watch: {},
                methods: {
                    showDetail: function (item) {
                       App.showDetail(item);
                    },
                    getReport:function(){
                        App.getReport();
                    },
                    getXfReport:function(){
                        App.getXfReport();
                    },
                    getFhReport:function(){
                        App.getFhReport();
                    }
                }
            });
            window.$vue = $vue;
            this.initPicker("#start-time");
            this.initPicker("#end-time");
            this.initPicker("#start-time1");
            this.initPicker("#end-time1");
            this.initPicker("#start-time2");
            this.initPicker("#end-time2");
        },
        /**
         * 刷新车次列表
         */
        getReport: function () {
            $vue.report = "";
            Core.Service.get('api/auth/v1/ltl/salesmanReport/salesmanPerformance', {
                beginTime: $("#start-time").val()+" 00:00:00",
                endTime: $("#end-time").val()+" 23:59:59"
            }, function (result) {
                if (result['data']) {
                    $vue.report= result['data'];
                } else {
                    native.showToast("没有找到任何数据");
                }
            });
        },
        getXfReport:function(){
            $vue.xfReport = "";
            Core.Service.get('api/auth/v1/ltl/salesmanReport/salesmanNowTotalFee', {
                beginTime: $("#start-time1").val()+" 00:00:00",
                endTime: $("#end-time1").val()+" 23:59:59"
            }, function (result) {
                if (result['data']) {
                    $vue.xfReport= result['data'];
                } else {
                    native.showToast("没有找到任何数据");
                }
            });
        },
        getFhReport:function(){
            $vue.fhReport = "";
            Core.Service.get('api/auth/v1/ltl/salesmanReport/salesmanDeliveryGoods', {
                beginTime: $("#start-time2").val()+" 00:00:00",
                endTime: $("#end-time2").val()+" 23:59:59"
            }, function (result) {
                if (result['data']) {
                    console.log(result['data']);
                    $vue.fhReport= result['data'];
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