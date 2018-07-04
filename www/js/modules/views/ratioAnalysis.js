/**
 * Created by denonzhu on 15/12/14.
 */
define(function (require, exports, module) {
    "use strict";
    var Core = require('js/modules/core/core');
    var attributes = Core.Cache.get('attributes');
    var $vue;
    var today,datePicker;
    var App = {
        init: function () {
            console.log("初始化成功");
            $vue = new Vue({
                el: '#vueBound',
                data: {
                    customerPhone:"",
                    goodsName:"",
                    report: ""
                },
                watch: {},
                methods: {
                    showDetail: function (item) {
                       App.showDetail(item);
                    },
                    getReport:function(){
                        App.getReport();
                    }
                }
            });
            window.$vue = $vue;
            today = new Date().GetDay(1, 'none');
            datePicker = Core.Utils.initRangeDatePicker("#range-time");
            var timeText = new Date().GetDay(7, 'none') + " - " + today;
            $('#range-time').val(timeText);

            $('body').on('pageBeforeAnimation','#resultList',function () {
                    App.getReport();
            });
        },
        /**
         * 刷新车次列表
         */
        getReport: function () {
            $vue.report = "";
            var rangeTimeArray = $('#range-time').val().split(' - ');
            var start = rangeTimeArray[0] + " 00:00:00";
            var end = rangeTimeArray[1] + " 23:59:59";
            Core.Service.get('api/auth/v1/ltl/operationReport/ratioAnalysis', {
                customerPhone: $vue.customerPhone,
                goodsName:$vue.goodsName,
                beginTime: start,
                endTime: end
            }, function (result) {
                if (result['data'] && result['data'].length >0) {
                    $vue.report= result['data'][0];
                }
            });
        }
    };
    Core.init(App);
    module.exports = App;
});