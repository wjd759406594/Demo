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
                    loadShift: {},
                    shiftLists: []
                },
                watch: {},
                methods: {
                    showDetail: function (item) {
                        App.showDetail(item);
                    }
                }
            });
            window.$vue = $vue;
            this.initPageEvent();
            this.initEvents();
            var today = new Date().GetDay(1, 'none');
            Core.Utils.initRangeDatePicker("#range-time");
            var timeText = today + " - " + today;
            $('#range-time').val(timeText);
            // this.refreshShift();
        },
        showDetail: function (item) {
            Core.Service.get('api/auth/v1/ltl/loadShiftSheet/query', {
                loadShiftId: item['id']
            }, function (result) {
                var rows = result['data']['rows'];
                if (rows && rows.length > 0) {
                    $vue.loadShift = item;
                    $vue.loadShift.shifts = rows;
                    Core.App.mainView.router.load({
                        pageName: "shiftDetail"
                    })
                } else {
                     native.showToast("该车次没有任何运单");
                }
            });
        },
        initPageEvent: function () {
        },
        /**
         * 刷新车次列表
         */
        refreshShift: function () {
            var rangeTimeArray = $('#range-time').val().split(' - ');
            var start = rangeTimeArray[0] + " 00:00:00";
            var end = (rangeTimeArray[1] ? rangeTimeArray[1] : rangeTimeArray[0] ) + " 23:59:59";
            Core.Service.get('api/auth/v1/ltl/loadShift/query', {
                isSend: 1,
                privateFlag: 1,
                beginTime: start,
                endTime: end,
                pageSize: 20
            }, function (result) {
                if (result['data']['rows'].length > 0) {
                    $vue.$data.shiftLists = result['data']['rows'];
                } else {
                     native.showToast("没有找到任何数据");
                    $vue.$data.shiftLists = [];
                }
            });
        },
        initEvents: function () {
            $('body').on('click', '.getShift', function () {
                App.refreshShift();
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