/**
 * Created by denonzhu on 15/12/14.
 */
define(function (require, exports, module) {
    var Core = require('js/modules/core/core');
    var native = require('js/modules/hybridapi');
    var Oss = require('js/modules/manager/oss');
    var laytpl = require('js/modules/core/laytpl');
    var analytics = require('js/modules/core/analytics');

    var scanDetail;
    var $vue;
    var $batchVue;
    var $searchVue;
    var App = {
        init: function () {
            console.log("页面js初始化成功");
            analytics.onPageEvent(0x2030005);

            Oss.init();
            Core.batchView = Core.App.addView('.view-batch', {
                domCache: true,
                dynamicNavbar: true
            });
            $vue = new Vue({
                el: '#tab1',
                data: {
                    sheet: null,
                    sheetNo: "",
                    isConsignNo: false,
                    sheetShortNo: "",
                    pickupAmount: 1,//提货件数
                    customerName: "",//提货人
                    customerPhone: "",
                    customerIdNo: "",
                    photoFileId: "",
                    pickPayFeeDecrease: "",
                    chooseList: [],
                    deliveryActualFee: "",
                    chooseDs: true,  //代收
                    chooseTf: true, //提付
                    chooseHd: false  //回单
                },
                watch: {},
                methods: {
                    scan: function () {
                        native.scanQr();
                    },
                    showInput: function () {
                        var sheetPre = Core.Cache.get("sheetPre");
                        Core.App.prompt("如果是中原单,请在运单号前加" + sheetPre, "请输入运单号", function (value) {
                            App.setSheetNo($vue, value);
                        });
                    },
                    findSheet: function () {
                        if ($vue.sheetShortNo.length > 0) {
                            App.getSheet($vue.sheetShortNo, $vue.isConsignNo);
                        } else {
                            native.showToast("请输入运单号");
                        }
                    },
                    pickupFee: function () {
                        App.pickupFee();
                    },
                    showScan: function (index) {
                        $vue.loadIndex = index;
                        Core.Page.changePage({pageName: 'scanDetail'});
                    },
                    setPick: function (item) {
                        $vue.$data.sheet = item;
                        $vue.$data.pickupAmount = $vue.$data.sheet['goodsAmount'];//提货件数
                        $vue.$data.customerName = $vue.$data.sheet['toCustomerName'];//提货人
                        $vue.$data.customerPhone = $vue.$data.sheet['toCustomerPhone'];
                        $vue.$data.customerIdNo = $vue.$data.sheet['toCustomerIdCard'];
                        $vue.$data.photoFileId = "";
                        $vue.$data.chooseDs = true;  //代收
                        $vue.$data.chooseTf = true;  //代收
                        $vue.$data.chooseHd = false;  //代收
                        if ($vue.sheet.backSheetAmount > 0) {
                            $vue.$data.chooseHd = true;
                        }
                        Core.Page.back();
                    },
                    clear: function () {
                        this.sheetNo = "";
                        this.sheetShortNo = "";
                        this.sheet = null;
                    },
                    print: function () {
                        analytics.onClickEvent(0x303000D);
                        var print = Core.Utils.getPrintSetting('WaybillBq');
                        if (print) {
                            var deviceType = Core.Utils.getDeviceType(print);
                            var configName = Core.Utils.getPrintTemplateName(2);
                            var WaybillCount = Core.Cache.get('WaybillCount');
                            Core.Utils.getPrintTemplate(configName, deviceType, function (result) {
                                var tpl = result['content'];
                                var html = laytpl(tpl).render($vue.sheet);
                                console.log(html);

                                native.print(print['address'], deviceType, 1, WaybillCount, html);
                            });
                        }
                    }
                }
            });

            $batchVue = new Vue({
                el: '#tab2',
                data: {
                    sheetNo: "",
                    isConsignNo: false,
                    sheetShortNo: "",
                    customerPhone: "",
                    sheetList: [],
                    info: {}
                },
                watch: {},
                methods: {
                    batchPickup: function () {
                        App.batchPickupFee();
                    },
                    getBatchInfo: function () {
                        if ($batchVue.sheetList.length > 0) {
                            Core.batchView.loadPage({
                                'pageName': 'batchInfo'
                            });
                            App.getBatchInfo();
                        } else {
                            native.showToast('没有任何运单');
                        }
                    },
                    batchPickupFee: function () {
                        var message = "实收总货款" + $batchVue.info['totalCodFee'] + "元 提付总运费" + $batchVue.info['totalPickupFee'] + "元";
                        Core.App.confirm(message, "确认提货", function () {
                            App.batchPickupFee();
                        });
                    },
                    searchSheet: function () {
                        if ($batchVue.sheetShortNo.length > 0) {
                            App.querySheet($batchVue.sheetShortNo, $batchVue.isConsignNo);
                        } else if ($batchVue.customerPhone.length > 0) {
                            Core.Service.get('api/auth/v1/ltl/pickup/querySheet', {
                                toCustomerPhone: $batchVue.customerPhone
                            }, function (result) {
                                if (result['data'] && result['data'].length > 0) {
                                    $.each(result['data'], function (i, v) {
                                        if (!App.hadAdd(v)) {
                                            $batchVue.sheetList.push(v);
                                        }
                                    });
                                } else {
                                    native.showToast("没有找到" + $batchVue.sheetShortNo + "提货信息");
                                }
                                $batchVue.customerPhone = "";
                                $batchVue.sheetNo = "";
                                $batchVue.isConsignNo = false;
                                $(".input-file").removeAttr('style');
                            });
                        } else {
                            native.showToast("运单号/客户电话请输入一个查询条件");
                            return false;
                        }
                    },
                    removeSheet: function (item) {
                        Core.App.confirm("确认删除?", function () {
                            $batchVue.sheetList.$remove(item);
                        });
                    }
                }
            });
            $searchVue = new Vue({
                el: '#tab3',
                data: {
                    sheetNo: "",
                    toCustomerName: "",
                    toCustomerPhone: "",
                    sheetList: []
                },
                methods: {
                    searchPickup: function () {
                        App.searchPickup();
                    }
                }
            });

            this.initEvent();
            document.addEventListener('getQR', App.getQR, false);
            // $vue.$data.sheetNo = '16050500025';
            $vue.$data.chooseDs = true;
            document.addEventListener('getScan', App.addScanFromNative, false);
        },
        getQR: function (e) {
            var sheetNo = Core.Utils.getSheetNoFromScan(e.detail['code']);
            if (sheetNo == "") {
                return false;
            }
            native.mediaVibrate(Core.ScanCode.ok, "");
            App.setSheetNo($vue, sheetNo);
            App.getSheet($vue.sheetShortNo, $vue.isConsignNo);
        },
        searchPickup: function () {
            $searchVue.sheetList = [];
            Core.Service.get('api/auth/v1/ltl/pickup/find', {
                sheetNo: Core.Cache.get("sheetPre") + $searchVue.sheetNo,
                pickupCustomerName: $searchVue.toCustomerName,
                pickupCustomerPhone: $searchVue.toCustomerPhone
            }, function (result) {
                if (result['data'] && result['data']['rows'].length > 0) {
                    $searchVue.sheetList = result['data']['rows'];
                } else {
                    native.showToast("没有找到提货信息");
                }
            });
        },
        getBatchInfo: function () {
            var sheetNos = "";
            $.each($batchVue.sheetList, function (i, v) {
                sheetNos += v['sheetNo'] + ",";
            });
            sheetNos = sheetNos.substr(0, sheetNos.length - 1);

            Core.Service.get('api/auth/v1/ltl/pickup/getBatchInfo', {
                sheetNos: sheetNos
            }, function (result) {
                $batchVue.info = result['data'];
            });
        },
        batchPickupFee: function () {
            if ($batchVue.sheetList.length == 0) {
                native.showToast("提货列表为空");
                return
            }
            var tmp = [];

            $.each($batchVue.sheetList, function (i, v) {
                tmp.push(v['sheetNo']);
            });

            Core.Service.post('api/auth/v1/ltl/pickup/batchSheetPickupNew', {
                sheetNos: tmp,
                photo1: $("#batch_img1").val(),
                photo2: $("#batch_img2").val(),
                photo3: $("#batch_img3").val()
            }, function () {
                Oss.asyncUpload($("#batch_img1").val(), $("#batch_img1").data('base'));
                Oss.asyncUpload($("#batch_img2").val(), $("#batch_img2").data('base'));
                Oss.asyncUpload($("#batch_img3").val(), $("#batch_img3").data('base'));

                native.showToast("提货成功");
                $batchVue.sheetNo = "";
                $batchVue.sheetShortNo = "";
                $batchVue.sheetList = [];
                $batchVue.info = {};
                $(".input-file").removeAttr('style');
                $("#batch_img1").val("");
                $("#batch_img2").val("");
                $("#batch_img3").val("");
                Core.batchView.back();
            });
        },
        pickupFee: function () {
            if ($vue.pickupAmount < 1) {
                native.showToast('提货件数应大于0');
                return false;
            }

            if ($vue.customerName.length < 1) {
                native.showToast('请输入客户姓名');
                return false;
            }

            if ($vue.customerPhone < 1) {
                native.showToast('请输入客户电话');
                return false;
            }

            var photo1, photo2, photo3;
            var img1 = $("#img1").val();
            if (img1.length > 0) {
                photo1 = img1;
            }
            var img2 = $("#img2").val();
            if (img2.length > 0) {
                photo2 = img2;
            }
            var img3 = $("#img3").val();
            if (img3.length > 0) {
                photo3 = img3;
            }


            var signBackSheet = $vue.chooseHd == true ? 1 : 0;
            var pickPayFeeCreditState = $vue.chooseTf == true ? 0 : 1;
            var codCreditState = $vue.chooseDs == true ? 0 : 1;

            var tmp = {
                id: $vue.sheet.id,
                pickupAmount: $vue.pickupAmount,
                pickupCustomerName: $vue.customerName,
                pickupCustomerPhone: $vue.customerPhone,
                pickupCustomerIdNo: $vue.customerIdNo,
                deliveryActualFee: $vue.deliveryActualFee,       //实际送货费
                feeResponsibleId: "",      //费用责任人
                pickPayFeeDecrease: "",      //减免
                pickPayFeeIncrease: "",
                pickupPhotoFileId: "",
                signBackSheet: signBackSheet, //回单 选中1
                pickPayFeeCreditState: pickPayFeeCreditState,  //提付信用状态 勾上是0
                codCreditState: codCreditState,       //代收货款 勾上是0
                photo1: photo1,
                photo2: photo2,
                photo3: photo3
            };

            var message = "实收货款" + (codCreditState == 0 ? $vue.sheet.cod : 0) + "元 提付总运费" + (pickPayFeeCreditState == 0 ? $vue.sheet.pickTotalFee : 0) + "元";
            if ($vue.sheet.backSheetAmount > 0) {
                message += '<br>该运单有回单,请注意签收';
            }

            Core.App.confirm(message, "确认提货", function () {
                App.remotePickupFee(tmp);
            });
        },
        remotePickupFee: function (data) {
            Core.Service.post('api/auth/v1/ltl/pickup/pickupFeeNew', data, function () {
                Oss.asyncUpload($("#img1").val(), $("#img1").data('base'));
                Oss.asyncUpload($("#img2").val(), $("#img2").data('base'));
                Oss.asyncUpload($("#img3").val(), $("#img3").data('base'));
                $vue.$data.sheet = null;
                $vue.$data.sheetNo = "";
                $vue.$data.sheetShortNo = "";
                $vue.$data.isConsignNo = false;
                $vue.$data.chooseDs = true;  //代收
                $vue.$data.chooseTf = true;  //代收
                $vue.$data.chooseHd = false;  //代收
                $(".input-file").removeAttr('style');
                $("#img1").val("");
                $("#img2").val("");
                $("#img3").val("");
                native.showToast("提货成功");
            });
        },
        /**
         * 查询运单号
         * @param sheetNo
         * @param isConsignNo
         */
        getSheet: function (sheetNo, isConsignNo) {
            $vue.sheet = null;
            if (isConsignNo) {
                Core.Service.get('api/auth/v1/ltl/pickup/findConsign', {
                    sheetNoConsign: sheetNo
                }, function (result) {
                    if (result['data'].length == 1) {
                        $vue.$data.sheet = result['data'][0];
                        $vue.$data.pickupAmount = $vue.$data.sheet['goodsAmount'];//提货件数
                        $vue.$data.customerName = $vue.$data.sheet['toCustomerName'];//提货人
                        $vue.$data.customerPhone = $vue.$data.sheet['toCustomerPhone'];
                        $vue.$data.customerIdNo = $vue.$data.sheet['toCustomerIdCard'];
                        $vue.$data.photoFileId = "";
                        $vue.$data.chooseDs = true;  //代收
                        $vue.$data.chooseTf = true;  //代收
                        $vue.$data.chooseHd = false;  //代收
                        if ($vue.sheet.backSheetAmount > 0) {
                            $vue.$data.chooseHd = true;
                        }
                    } else {
                        $vue.$data.chooseList = result['data'];
                        Core.mainView.router.loadPage({"pageName": "choosePick"});
                    }
                }, function () {
                    $vue.sheetNo = "";
                    $vue.sheetShortNo = "";
                });
            } else {
                Core.Service.get('api/auth/v1/ltl/pickup/getBySheetNo', {
                    sheetNo: Core.Cache.get('sheetPre') + sheetNo
                }, function (result) {
                    $vue.$data.sheet = result['data'];
                    $vue.$data.pickupAmount = result['data']['goodsAmount'];//提货件数
                    $vue.$data.customerName = result['data']['toCustomerName'];//提货人
                    $vue.$data.customerPhone = result['data']['toCustomerPhone'];
                    $vue.$data.customerIdNo = result['data']['toCustomerIdCard'];
                    $vue.$data.photoFileId = "";
                    $vue.$data.chooseDs = true;  //代收
                    $vue.$data.chooseTf = true;  //代收
                    $vue.$data.chooseHd = false;  //代收
                    if ($vue.sheet.backSheetAmount > 0) {
                        $vue.$data.chooseHd = true;
                    }
                }, function () {
                    $vue.sheetNo = "";
                    $vue.sheetShortNo = "";
                });
            }
        },
        querySheet: function (sheetNo, isConsignNo) {
            if (isConsignNo) {
                Core.Service.get('api/auth/v1/ltl/pickup/findConsign', {
                    sheetNoConsign: sheetNo
                }, function (result) {
                    if (result['data'] && result['data'].length > 0) {
                        $.each(result['data'], function (i, v) {
                            if (!App.hadAdd(v)) {
                                $batchVue.sheetList.push(v);
                            }
                        });
                    } else {
                        native.showToast("没有找到" + $batchVue.sheetShortNo + "提货信息");
                    }
                    $batchVue.sheetShortNo = "";
                    $batchVue.isConsignNo = false;
                });
            } else {
                Core.Service.get('api/auth/v1/ltl/pickup/querySheet', {
                    sheetNo: Core.Cache.get('sheetPre') + sheetNo
                }, function (result) {
                    if (result['data'] && result['data'].length > 0) {
                        $.each(result['data'], function (i, v) {
                            if (!App.hadAdd(v)) {
                                $batchVue.sheetList.push(v);
                            }
                        });
                    } else {
                        native.showToast("没有找到" + $batchVue.sheetShortNo + "提货信息");
                    }
                    $batchVue.sheetShortNo = "";
                    $batchVue.isConsignNo = false;
                });
            }
        },
        hadAdd: function (sheet) {
            var flag = false;
            if ($batchVue.sheetList.length > 0) {
                $.each($batchVue.sheetList, function (i, v) {
                    if (sheet['id'] == v['id']) {
                        flag = true;
                        return false;
                    }
                });
            }
            return flag;
        },
        initEvent: function () {
            $("#batchInfo").on('click', '.back', function (e) {
                e.preventDefault();
                Core.batchView.back();
                return false;
            })
        },
        /**
         * 客户的扫码事件
         * @param e
         * @returns {boolean}
         */
        addScanFromNative: function (e) {
            var sheetLabelNo = Core.Utils.getSheetNoFromScan(e.detail['sheetLabelNo']);
            if (sheetLabelNo == "") {
                return false;
            }
            native.mediaVibrate(Core.ScanCode.ok, "");
            var pageName = $('.tab.active').data('page');
            if (pageName == "pickUp") {
                App.setSheetNo($vue, sheetLabelNo);
                App.getSheet($vue.sheetShortNo, $vue.isConsignNo);
            }
            if (pageName == "batchPick") {
                App.setSheetNo($batchVue, sheetLabelNo);
                App.querySheet($batchVue.sheetShortNo, $batchVue.isConsignNo);
            }
        },
        setSheetNo: function (obj, sheetLabelNo) {
            obj.sheetNo = sheetLabelNo;
            if (Core.Utils.isMySheet(sheetLabelNo)) {
                obj.sheetShortNo = Core.Utils.barcodeRuleFilter(sheetLabelNo);
                obj.isConsignNo = false;
            } else {
                obj.sheetShortNo = sheetLabelNo;
                obj.isConsignNo = true;
            }
        }
    };
    window.addScanFromNative = App.addScanFromNative;
    Core.init(App);
    module.exports = App;
});