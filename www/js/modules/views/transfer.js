/**
 * Created by denonzhu on 15/12/14.
 */
define(function (require, exports, module) {
    var Core = require('js/modules/core/core');
    var native = require('js/modules/hybridapi');
    var $sheetConfig = require('js/modules/manager/fastSheetConfig');
    var beginTime = (new Date()).GetDay(1, "");
    var endTime = (new Date()).GetDay(1, "end");
    var scanDetail;
    var $vue;
    var App = {
        init: function () {
            console.log("页面js初始化成功");

            $vue = new Vue({
                el: '#vueBound',
                data: {
                    chooseTime: "1",
                    beginTime: beginTime,
                    endTime: endTime,
                    findSheetNo: "",
                    queryList:[],
                    fee:null,
                    sheet: null,
                    transferMode: "1",
                    sheetNo: "",
                    transferId: 0,
                    transferName: "",
                    transferDate: (new Date()).Format('yyyy-MM-dd hh:mm:ss'),
                    logisticsId: "",
                    transferSheetNo: "",
                    transferPhone: "",
                    transferLinkman: "",
                    transferRemoteLinkman: "",
                    transferRemotePhone: "",
                    transferFee: 0,
                    transferRemarks: "",
                    totalFeeDesc:"",
                    transferFeeCalculateMode: "1"    //1:重量 2:体积 3:件数 4:比例
                },
                watch: {
                    "sheetNo": function (val, oldVal) {
                        //Core.Cache.set('lastScanNextShopName', val);
                        if (val != "") {
                            App.getSheet();
                        }
                    },
                    "transferMode": function (val, oldVal) {
                        if (this.sheetNo != "") {
                            App.getSheet();
                        }
                    },
                    "transferFeeCalculateMode":function (val, oldVal) {
                        if($vue.fee){
                            switch (val){
                                case "1":
                                    $vue.$data.transferFee = $vue.fee['weightFee'];
                                    break;
                                case "2":
                                    $vue.$data.transferFee = $vue.fee['volumeFee'];
                                    break;
                                case "3":
                                    $vue.$data.transferFee = $vue.fee['amountFee'];
                                    break;
                                case "4":
                                    $vue.$data.transferFee = $vue.fee['ratioFee'];
                                    break;
                            }
                        }
                    },
                    "transferId": function (val, oldVal) {
                        if(val != 0){
                            App.getTransferFee();
                        }
                    },
                    "chooseTime": function (val, oldVal) {
                        console.log(val);

                        if (val == "0") {
                            App.initSearchPicker("#start-time", 'start');
                            App.initSearchPicker("#end-time", 'end');
                        } else {
                            $vue.$data.beginTime = (new Date()).GetDay(val, "");
                        }
                        /*
                         if (id == 0) {
                         $('.chooseTime').show();
                         } else {
                         $("#start-time").val(new Date().GetDay(id, "start"));
                         $("#end-time").val(new Date().Format("yyyy-MM-dd") + " 23:59:59");
                         $('.chooseTime').hide();
                         }*/
                    }
                },
                methods: {
                    showInput: function () {
                        Core.App.prompt("请输入运单号", function (value) {
                            $vue.$data.sheetNo = value;
                        });
                    },
                    clear:function(){
                        $vue.$data.sheetNo="";
                    },
                    showPicker: function () {
                        App.initPicker();
                    },
                    findTransfer: function () {
                        App.findTransfer();
                    },
                    cancelTransfer:function(item){
                        Core.Service.post('api/auth/v1/ltl/transfer/cancelTransfer', {
                            sheetNo:item['sheetNo']
                        }, function () {
                            $vue.$data.queryList.$remove(item);
                            native.showToast('取消中转成功');
                        });
                    },
                    searchToCustomer: function () {
                        Core.Service.get('api/auth/v1/ltl/logistics/find', {}, function (result) {
                            if (result['data'].length > 0) {
                                var ids = [];
                                var displayValues = [];
                                $.each(result['data'], function (i, v) {
                                    //限制最多显示100个记录
                                    if (i < 100) {
                                        ids.push(v['id']);
                                        displayValues.push(v['name'])
                                    }
                                });
                                var toCustomerPicker = Core.App.picker({
                                    input: '#picker-input',
                                    cols: [
                                        {
                                            values: ids,
                                            displayValues: displayValues
                                        }
                                    ],
                                    onClose: function (picker) {
                                        $.each(result['data'], function (i, v) {
                                            if (v['id'] == picker['value'][0]) {
                                                $vue.$data.transferName = v['name'];
                                                $vue.$data.transferId = v['id'];
                                                $vue.$data.transferRemoteLinkman = v['localLinkman'];
                                                $vue.$data.transferRemotePhone = v['localPhone'];
                                                $vue.$data.logisticsId = v['id'];
                                            }
                                        });
                                    }
                                });
                                toCustomerPicker.open();
                            } else {
                               native.showToast('未找到任何中转公司');
                            }
                        });
                    },
                    doTransfer: function () {
                        App.doTransfer();
                    },
                    showScan: function (index) {
                        $vue.loadIndex = index;
                        Core.Page.changePage({pageName: 'scanDetail'});
                    }
                }
            });
            window.vv = $vue;
            this.initEvent();
            document.addEventListener('getScan', App.addScanFromNative, false);
        },
        doTransfer: function () {
            if ($vue.transferSheetNo.length == 0) {
               native.showToast('请输入中转单号');
                return false;
            }
            Core.Service.post('api/auth/v1/ltl/transfer/transfer', {
                sheetNo: $sheetConfig.getFullSheetNo($vue.sheetNo),
                transferId: $vue.transferId,
                transferName: $vue.transferName,
                transferDate: $vue.transferDate,
                transferSheetNo: $vue.transferSheetNo,
                transferPhone: $vue.transferPhone,
                transferLinkman: $vue.transferLinkman,
                transferRemoteLinkman: $vue.transferRemoteLinkman,
                transferRemotePhone: $vue.transferRemotePhone,
                transferFee: $vue.transferFee,
                transferRemarks: $vue.transferRemarks,
                transferFeeCalculateMode: $vue.transferFeeCalculateMode
            }, function (result) {
                //$vue.$data.sheet = result['data'];
                App.resetData();
               native.showToast('中转成功');

            });
        },
        getSheet: function () {
            if ($vue.sheetNo.length != sheetLength) {
               native.showToast('请输入'+sheetLength+'位的运单号');
                return false;
            }
            $vue.transferId = 0;
            $vue.transferName = "";
            Core.Service.get('api/auth/v1/ltl/transfer/getBySheetNo', {
                sheetNo: Core.Cache.get('sheetPre') + $vue.sheetNo,
                transferMode: $vue.transferMode
            }, function (result) {
                $vue.$data.sheet = result['data'];
                console.log($vue.$data.sheet);
            });
        },
        resetData: function () {
            $vue.$data = {
                chooseTime: "1",
                beginTime: beginTime,
                endTime: endTime,
                findSheetNo: "",
                queryList:[],
                fee:null,
                sheet: null,
                transferMode: "1",
                sheetNo: "",
                transferId: 0,
                transferName: "",
                transferDate: (new Date()).Format('yyyy-MM-dd hh:mm:ss'),
                logisticsId: "",
                transferSheetNo: "",
                transferPhone: "",
                transferLinkman: "",
                transferRemoteLinkman: "",
                transferRemotePhone: "",
                transferFee: 0,
                transferRemarks: "",
                totalFeeDesc:"",
                transferFeeCalculateMode: "1"    //1:重量 2:体积 3:件数 4:比例
            };
        },
        /**
         * 计算中转费
         */
        getTransferFee: function () {
            Core.Service.post('api/auth/v1/ltl/transfer/calculateFee', {
                sheetId: $vue.sheet['id'],
                logisticsArrivalId: "",
                logisticsId: $vue.logisticsId
            }, function (result) {
                $vue.$data.totalFeeDesc= result['data']['totalFeeDesc'];
                $vue.$data.fee= result['data'];
                $vue.$data.transferFee = result['data']['weightFee'];
                // $vue.$data.transferFee = 1;
            });
        },
        /**
         * 查询中转
         */
        findTransfer: function () {
            var sheetNo = "";
            if($vue.findSheetNo.length>0){
                if($vue.findSheetNo.length !=sheetLength){
                   native.showToast("请输入"+sheetLength+"位的运单号");
                    return false;
                }
                sheetNo = $sheetConfig.getFullSheetNo($vue.findSheetNo);
            }
            
            Core.Service.get('api/auth/v1/ltl/transfer/find', {
                sheetNo: sheetNo,
                beginTime: $vue.beginTime,
                endTime: $vue.endTime
            }, function (result) {
                if(result['data'] && result['data']['rows'].length >0){
                    $vue.$data.queryList =result['data']['rows'];
                }else{
                   native.showToast("查询不到中转单");
                }
            });
        },
        initEvent: function () {
        },
        /**
         * 客户的扫码事件
         * @param e
         * @returns {boolean}
         */
        addScanFromNative: function (e) {
            var pageName = $('.tab.active').data('page');
            if (pageName == "pickUp") {
                var sheetLabelNo = Core.Utils.getSheetNoFromScan(e.detail['sheetLabelNo']);
                if (sheetLabelNo == "") {
                    return false;
                }
                if ($sheetConfig.checkLabel(sheetLabelNo)) {
                    $vue.$data.sheetNo = $sheetConfig.getShortSheetNo(sheetLabelNo);
                }
            }
            if (pageName == "batchPick") {

            }
        },
        initPicker: function () {
            var today = new Date();
            var year = today.getFullYear();
            var month = today.getMonth();
            var day = (today.getDate() < 10 ? '0' + today.getDate() : today.getDate());
            var hour = (today.getHours() < 10 ? '0' + today.getHours() : today.getHours());
            var minute = (today.getMinutes() < 10 ? '0' + today.getMinutes() : today.getMinutes());
            var seconds = (today.getSeconds() < 10 ? '0' + today.getSeconds() : today.getSeconds());
            Core.App.picker({
                input: "#transferDate",
                toolbar: true,
                rotateEffect: false,
                value: [year, month, day, hour, minute, today.getSeconds()],

                onChange: function (picker, values) {
                    var daysInMonth = new Date(picker.value[0], picker.value[1] * 1 + 1, 0).getDate();
                    if (values[2] > daysInMonth) {
                        picker.cols[2].setValue(daysInMonth);
                    }
                },

                formatValue: function (p, values) {
                    var displayMonth = values[1] * 1 + 1;
                    var displayDay = values[2] * 1;
                    displayMonth = displayMonth < 10 ? "0" + displayMonth : displayMonth;
                    displayDay = displayDay < 10 ? "0" + displayDay : displayDay;
                    return values[0] + '-' + displayMonth + '-' + displayDay + ' ' + values[3] + ':' + values[4] + ":" + seconds;
                },

                cols: [
                    // Years
                    {
                        values: (function () {
                            var arr = [];
                            for (var i = 2013; i <= today.getFullYear(); i++) {
                                arr.push(i);
                            }
                            return arr;
                        })()
                    },
                    // Months
                    {
                        values: ('0 1 2 3 4 5 6 7 8 9 10 11').split(' '),
                        displayValues: ('一月 二月 三月 四月 五月 六月 七月 八月 九月 十月 十一月 十二月').split(' '),
                        textAlign: 'left'
                    },
                    // Days
                    {
                        values: (function () {
                            var arr = [];
                            for (var i = 1; i <= 31; i++) {
                                arr.push(i < 10 ? '0' + i : i);
                            }
                            return arr;
                        })()
                    },
                    // Space divider
                    {
                        divider: true,
                        content: '  '
                    },
                    // Hours
                    {
                        values: (function () {
                            var arr = [];
                            for (var i = 0; i <= 23; i++) {
                                arr.push(i < 10 ? '0' + i : i);
                            }
                            return arr;
                        })()
                    },
                    // Divider
                    {
                        divider: true,
                        content: ':'
                    },
                    // Minutes
                    {
                        values: (function () {
                            var arr = [];
                            for (var i = 0; i <= 59; i++) {
                                arr.push(i < 10 ? '0' + i : i);
                            }
                            return arr;
                        })()
                    }
                ]
            });
        },
        initSearchPicker: function (el, flag) {
            var today = new Date();
            var year = today.getFullYear();
            var month = today.getMonth();
            var day = (today.getDate() < 10 ? '0' + today.getDate() : today.getDate());
            var minutes = flag == "start" ? "00" : "23";
            var seconds = flag == "start" ? "00" : "59";
            Core.App.picker({
                input: el,
                toolbar: true,
                rotateEffect: false,
                value: [year, month, day, minutes, seconds],

                onChange: function (picker, values) {
                    var daysInMonth = new Date(picker.value[0], picker.value[1] * 1 + 1, 0).getDate();
                    if (values[2] > daysInMonth) {
                        picker.cols[2].setValue(daysInMonth);
                    }
                    if (values[1] > month) {
                        picker.cols[1].setValue(month);
                    }
                    if (values[2] > day) {
                        picker.cols[2].setValue(day);
                    }
                },

                formatValue: function (p, values) {
                    var displayMonth = values[1] * 1 + 1;
                    displayMonth = displayMonth < 10 ? "0" + displayMonth : displayMonth;
                    return values[0] + '-' + displayMonth + '-' + values[2] + ' ' + values[3] + ':' + values[4] + ":" + seconds;
                },

                cols: [
                    // Years
                    {
                        values: (function () {
                            var arr = [];
                            for (var i = 2013; i <= today.getFullYear(); i++) {
                                arr.push(i);
                            }
                            return arr;
                        })()
                    },
                    // Months
                    {
                        values: ('0 1 2 3 4 5 6 7 8 9 10 11').split(' '),
                        displayValues: ('一月 二月 三月 四月 五月 六月 七月 八月 九月 十月 十一月 十二月').split(' '),
                        textAlign: 'left'
                    },
                    // Days
                    {
                        values: (function () {
                            var arr = [];
                            for (var i = 1; i <= 31; i++) {
                                arr.push(i < 10 ? '0' + i : i);
                            }
                            return arr;
                        })()
                    },
                    // Space divider
                    {
                        divider: true,
                        content: '  '
                    },
                    // Hours
                    {
                        values: (function () {
                            var arr = [];
                            for (var i = 0; i <= 23; i++) {
                                arr.push(i < 10 ? '0' + i : i);
                            }
                            return arr;
                        })()
                    },
                    // Divider
                    {
                        divider: true,
                        content: ':'
                    },
                    // Minutes
                    {
                        values: (function () {
                            var arr = [];
                            for (var i = 0; i <= 59; i++) {
                                arr.push(i < 10 ? '0' + i : i);
                            }
                            return arr;
                        })()
                    }
                ]
            });
        }
    };
    window.addScanFromNative = App.addScanFromNative;
    Core.init(App);
    module.exports = App;
});