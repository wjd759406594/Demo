define(function (require, exports, module) {
    "use strict";
    var native = require('js/modules/hybridapi');
    var Core = require('js/modules/core/core');
    var loginName = Core.Cache.get("loginName");
    var laytpl = require('js/modules/core/laytpl');
    var Parse = window.Parse;
    var Order = Parse.Object.extend("Order");
    var config;
    var sheet = {
        vSheet: {},
        content: {},
        lastSearch: [],
        /**
         * 初始化config配置
         */
        initConfig: function () {
            config = {
                "customerBank": [
                    {"label": "工商银行", "value": "工商银行"},
                    {"label": "农业银行", "value": "农业银行"},
                    {"label": "中国银行", "value": "中国银行"},
                    {"label": "建设银行", "value": "建设银行"},
                    {"label": "交通银行", "value": "交通银行"},
                    {"label": "招商银行", "value": "招商银行"},
                    {"label": "邮政储蓄", "value": "邮政储蓄"},
                    {"label": "徽商银行", "value": "徽商银行"},
                    {"label": "信用社", "value": "信用社"}
                ],
                "defaultDeliveryMode": 2
            };

            var attributes = Core.Cache.get('attributes');
            if (attributes['config'] && attributes['config']['customerBank'] && attributes['config']['defaultDeliveryMode']) {
                config = attributes['config'];
            }
            var options = "";
            $.each(config['customerBank'], function (i, v) {
                options += '<option value="' + v['value'] + '">' + v['label'] + '</option>';
            });

            $('#fromCustomerBank').append(options);
        },
        init: function () {
            this.initConfig();
            var sheetTmpl = Core.Cache.get('SheetTmpl');
            if (!sheetTmpl || Core.Cache.get("SheetTmplVersion") != '2.0.7') {
                Core.Cache.set("SheetTmplVersion", '2.0.7');
                sheetTmpl = {
                    toCustomerPhone1: {
                        name: "收货客户备用电话",
                        show: false
                    },
                    toCustomerAddress: {
                        name: "收货客户地址",
                        show: true
                    },
                    /* agreementCompany: {
                     name: "月结单位",
                     show: false
                     },*/
                    goodsPackage: {
                        name: "包装",
                        show: false
                    },
                    goodsWeight: {
                        name: "重量",
                        show: false
                    },
                    goodsVolume: {
                        name: "体积",
                        show: false
                    },
                    requirement: {
                        name: "特殊需求",
                        show: false
                    },
                    backPayFee: {
                        name: "回单付",
                        show: false
                    },
                    receiptFee: {
                        name: "接货费",
                        show: false
                    },
                    deliveryFee: {
                        name: "送货费",
                        show: false
                    },
                    declaredValue: {
                        name: "声明价值",
                        show: true
                    },
                    premium: {
                        name: "保费",
                        show: true
                    },
                    rebates: {
                        name: "劳务费",
                        show: true
                    },
                    backSheetAmount: {
                        name: "回单张数",
                        show: false
                    },
                    backSheetFee: {
                        name: "回单费",
                        show: false
                    },
                    backSheetRequirement: {
                        name: "回单要求",
                        show: false
                    }
                };
                Core.Cache.set('SheetTmpl', sheetTmpl);
            }

            var that = this;

            $$(document)
                .on('pageInit', '.page[data-page="findFromCustomer"]', function (e) {
                    var html = Core.Template.render('findFromCustomerTmpl', sheet.lastSearch);
                    $('#findFromCustomer .searchbar-found ul').html(html);
                })
                .on('pageInit', '.page[data-page="findToCustomer"]', function (e) {
                    var html = Core.Template.render('findFromCustomerTmpl', sheet.lastSearch);
                    $('#findToCustomer .searchbar-found ul').html(html);
                })
                .on('pageInit', '.page[data-page="findToOrgArea"]', function (e) {
                    var html = Core.Template.render('toAreaTmpl', sheet.lastSearch);
                    $('#findToOrgArea .searchbar-found ul').html(html);
                })
                .on('pageInit', '.page[data-page="findFromShop"]', function (e) {
                    var html = Core.Template.render('findFromShopTmpl', sheet.lastSearch);
                    $('#findFromShop .searchbar-found ul').html(html);
                })
                .on('pageInit', '.page[data-page="findFromOrg"]', function (e) {
                    var html = Core.Template.render('findFromShopTmpl', sheet.lastSearch);
                    $('#findFromOrg .searchbar-found ul').html(html);
                })
                .on('pageInit', '.page[data-page="findAllOrg"]', function (e) {
                })
                .on('pageInit', '.page[data-page="findAllShop"]', function (e) {
                })
                .on('pageInit', '.page[data-page="findPreSheet"]', function () {
                    var phone = Core.Cache.get('searchPreUserPhone') || "";
                    var userCode = Core.Cache.get('searchPreUserCode') || "";
                    $("#searchPreUserPhone").val(phone);
                    $("#searchPreUserCode").val(userCode);
                });

            $("body")
                .on('click', '#findFromCustomer .searchbar-found .item-link', function () {
                    Core.Cache.set('fromCustomer', $(this).data('val'));
                    var fromCustomer = $(this).data('val');
                    if (fromCustomer['codCardNo'] == null || fromCustomer['codCardNo'] == "") {
                        Core.Cache.remove('CodCard');
                    }
                    if (fromCustomer['isBlacklist'] == 1) {
                        Core.App.alert("此客户已列入黑名单,原因:" + fromCustomer['blacklistReason']);
                    }
                    that.initFromCustomer();
                    Core.mainView.router.back();
                })
                .on('click', '#findPreSheetPage .searchbar-found .item-link', function () {
                    var val = $(this).data('val');
                    that.initPreOrder(val, true);
                })
                .on('click', '#findToCustomer .searchbar-found .item-link', function () {
                    var val = $(this).data('val');
                    Core.Cache.set('toCustomer', val);
                    if (val['isBlacklist'] == 1) {
                        Core.App.alert("此客户已列入黑名单,原因:" + val['blacklistReason']);
                    }
                    that.initToCustomer();
                    Core.mainView.router.back();
                })
                .on('click', '#findToOrgArea  .searchbar-found  .item-link', function () {
                    Core.Cache.set('toOrgArea', $(this).data('val'));
                    that.initToOrgArea();
                    Core.mainView.router.back();
                })
                .on('click', '#findFromOrgPage  .searchbar-found  .item-link', function () {
                    Core.Cache.set('fromOrgArea', $(this).data('val'));
                    that.initFromShop();
                    Core.mainView.router.back();
                })
                .on('click', '#findFromShop  .searchbar-found  .item-link', function () {
                    Core.Cache.set('fromShop', $(this).data('val'));
                    that.initFromShop();
                    Core.mainView.router.back();
                })
                .on('click', '#findAllOrg .item-link', function () {
                    var org = $(this).data('val');
                    $("#ruleFindOrgName").val(org['orgName']);
                    $("#ruleFindOrgId").val(org['orgId']);
                    Core.mainView.router.back();
                })
                .on('click', '#findAllShop .item-link', function () {
                    var org = $(this).data('val');
                    $("#ruleFindShopName").val(org['orgName']);
                    $("#ruleFindShopId").val(org['orgId']);
                    $("#nextShopName").val(org['orgName']).trigger('change');
                    $("#nextShopId").val(org['orgId']).trigger('change');
                    Core.mainView.router.back();
                });
        },
        initPreOrder: function (val, needBack) {
            var that = this;
            that.vSheet.$data.objectId = val.objectId;
            that.clearFromCustomer();
            $.each(val, function (i, v) {
                if (i != "codCardNo" && i != "createdAt" && i != "updatedAt") {
                    that.vSheet.$data[i] = v;
                }
            });
            if (val['fromCustomerCity'] && val['fromCustomerAddress']) {
                that.vSheet.$data['fromCustomerAddress'] = val['fromCustomerCity'] + val['fromCustomerAddress'];
            }
            if (val['toCustomerCity'] && val['toCustomerAddress']) {
                that.vSheet.$data['toCustomerAddress'] = val['toCustomerCity'] + val['toCustomerAddress'];
            }
            if (needBack) {
                Core.mainView.router.back();
            }
        },
        getSheetObj: function () {
            var initData = {
                objectId: "",
                id: "",
                prePhone: "",  //预填单手机号
                sheetNo: "",                 //运单号
                printSheetNo: "",
                printSheetNoAbbr: "",
                printSheetNoYmd: "",
                sheetNoShort: "",            //运单短号码
                sheetNoManual: "",           //手工单号
                toAreaProvince: "",
                orgOrProvinceName: "",

                fromAreaId: "",                //启运地id
                fromAreaName: "",            //启运地名称
                fromOrgId: "",                 //发货业务区id
                fromOrgName: "",             //发货业务区名称
                fromShopId: "",                //发货网点id
                fromShopName: "",            //发货网点名称

                toAreaId: "",                  //目的地id
                toAreaName: "",              //目的地名称
                toOrgId: "",                   //到达业务区id
                toOrgName: "",               //到达业务区名称
                toShopId: "",                  //到货网点id
                toShopName: "",              //到货网点名称
                orgStorageLocation: "",      //库位

                /*---------------------------发货客户-----------------------------*/
                fromCustomerId: "",            //发货客户id
                fromCustomerName: "",        //发货客户名称
                fromCustomerPhone: "",       //发货客户电话
                fromCustomerPhone1: "",      //发货客户备用电话
                fromCustomerAddress: "",     //发货客户地址
                fromCustomerLongitude: "",   //发货客户经度
                fromCustomerLatitude: "",    //发货客户纬度
                fromCustomerIdCard: "",      //发货客户身份证
                fromCustomerCodCardNo: "",      //发货客户卡号（代收货款卡号）
                fromCustomerBank: "",        //发货客户开户行
                fromCustomerBranchBank: "",  //发货客户支行
                fromCustomerAccount: "",     //发货客户账号
                fromCustomerHolder: "",      //发货客户持卡人
                agreementId: "",               //协议id
                agreementNo: "",             //协议编号  月结编号
                agreementCompany: "",        //协议单位  月结单位

                companyNo: "",
                thirdFeeSummaryInfo: "",
                customerServicePhone: "",
                lineBranchNo: "",
                lineBranchName: "",
                /*---------------------------收货客户-----------------------------*/
                toCustomerId: "",              //收货客户id
                toCustomerName: "",          //收货客户名称
                toCustomerPhone: "",         //收货客户电话
                toCustomerPhone1: "",        //收货客户备用电话
                toCustomerAddress: "",       //收货客户地址
                toCustomerLongitude: "",     //收货客户经度
                toCustomerLatitude: "",      //收货客户纬度
                toCustomerIdCard: "",        //收货客户身份证
                /*---------------------------货物信息-----------------------------*/
                goodsName: "",               //货物名称
                goodsAmount: "",            //货物件数
                goodsWeight: "",         //货物重量（千克）
                goodsVolume: "",         //货物体积（立方米）
                goodsSquare: "",       //货物平方 (平方米)
                goodsPackage: "纸",            //货物包装
                requirement: "",             //特殊需求（加急，易碎，贵重）
                deliveryMode: config['defaultDeliveryMode'],           //交货方式(1-自提，2-送货)
                /*---------------------------新费用信息-----------------------------*/
                fromPremium: "",              //发货方保费
                fromBackSheetFee: "",         //发货方回单费
                fromDocumentFee: "",          //发货方工本费
                fromReceiptFee: "",           //发货方接货费
                fromDeliveryFee: "",          //发货方送货费
                fromOtherFee: "",             //发货方其他费（服务费）
                fromForkliftFee: "",          //发货方叉车费
                fromUpFee: "",                //发货方上楼费
                fromPackageFee: "",           //发货方包装费
                toPremium: "",                //提货方保费
                toBackSheetFee: "",           //提货方回单费
                toDocumentFee: "",            //提货方工本费
                toReceiptFee: "",             //提货方接货费
                toDeliveryFee: "",            //提货方送货费
                toOtherFee: "",               //提货方其他费（服务费）
                toForkliftFee: "",            //提货方叉车费
                toUpFee: "",                  //提货方上楼费
                toPackageFee: "",             //提货方包装费
                /*---------------------------费用信息-----------------------------*/
                cod: "",                 //代收货款
                //receivedCod:"",         //已收货款
                //codState:"",            //代收货款状态(1-未收回，2-已收回，3-已交财务，4-已交客户)
                codFee: "",              //代收货款手续费
                billingMode: "",            //计费方式(1-重量体积，2-件数)
                settlePayFee: "",        //转运垫付
                nowPayFee: "",           //现付
                pickPayFee: "",          //提付
                fromCustomerMonthFee: "",//发货方月结
                toCustomerMonthFee: "",  //收货方月结
                backPayFee: "",          //回单付
                pickPayDeduct: "",     //提付扣(三方单存在发货方付时存在)
                codPayFee: "",           //货款付
                rebates: "",             //劳务费
                rebatesSettleMode: 2,      //劳务费（劳务费）结算方式(1-现结，2-月结)
                declaredValue: "",       //申明价值
                premium: "",             //保费
                backSheetFee: "",        //回单费
                backSheetRequirement: "", //回单要求
                documentFee: 0,         //工本费
                receiptFee: "",          //上门收货费
                deliveryFee: "",         //送货费
                //transportCost:"",       //干线运费成本
                payOutFee: "",           //垫付
                otherFee: "",            //服务费
                //receivedFee:"",         //已收费用
                //     performance:"",         //业绩
                /*---------------------------托运公司和中转公司-----------------------------*/
                consignId: "",                 //托运公司id
                consignName: "",             //托运公司名称
                transferId: "",                //中转公司id
                transferName: "",            //中转公司名称
                transferSheetNo: "",         //中转单号
                transferFee: "",         //中转费
                /*---------------------------其他信息-----------------------------*/
                isInvoice: "",              //是否开票(0-否，1-是)
                invoiceTitle: "",            //开票抬头
                sheetFrom: "",              //运单来源（1-手机开票，2-pc开票，3-客户自助）
                //    sheetState:"",             //运单状态
                //    previousAreaId:"",            //上一地区id
                //     previousAreaName:"",        //上一地区名称
                //    curAreaId:"",                 //当前所在地id
                //     curAreaName:"",             //当前所在地名称
                //    nextAreaId:"",                //下一地区id
                //     nextAreaName:"",            //下一地区名称
                salesmanId: "",                //业务员id
                salesmanName: "",            //业务员名称
                salesmanPhone: "",           //业务员电话
                //    inputUserId:"",               //录入员id
                //     inputUserName:"",           //录入员名称
                /*---------------------------回单信息-----------------------------*/
                backSheetAmount: "",        //回单张数
                //    backSheetState:"",         //回单状态(1-待寄出，2-已签收，3-已收回，4-已交客户)
                //    bsCurAreaId:"",               //当前所在地id
                //     bsCurAreaName:"",           //当前所在地名称
                //    bsNextAreaId:"",              //下一地区id
                //     bsNextAreaName:"",          //下一地区名称
                //    bsCurOrgId:"",                //当前所在机构id
                //     bsCurOrgName:"",            //当前所在机构名称

                createDate: "",                //创建时间
                remarks: "",                 //备注
                version: "",                   //版本号
                totalFee: "",                //总运费
                billingModeDesc: "",             //计费方式（重量体积/件数）
                deliveryModeDesc: "",            //收货方式（自提/送货）
                fromCustomerInfo: "",            //发货人[卡XXX编YYY]
                receiptFromCustomerFeeInfo: "",  //收发货人xx元
                receiptToCustomerFeeInfo: "",    //收提货人xx元
                sheetCreateDate: "",             //运单创建日期（字符串）
                effectiveDate: "",               //有效期（字符串）
                transportModeDesc: "",           //运输方式
                paymentMethodDesc: "",           //付款方式
                paymentModeDesc: "",             //支付方式
                consignPrintSummaryInfo: "",     //三方单部分汇总信息
                otherFeeSummaryInfo: "",         //打印大运单时，其他费汇总信息
                primaryFeeSummaryInfo: "",       //打印小运单时，主要费用汇总信息
                secondaryFeeSummaryInfo: "",     //打印小运单时，次要费用汇总信息
                primaryFeeKey: "",               //打印双纸运单时，运费1描述
                primaryFeeValue: "",         //打印双纸运单时，运费1费用
                secondaryFeeKey: "",             //打印双纸运单时，运费2描述
                secondaryFeeValue: "",       //打印双纸运单时，运费2费用

                transportMode: 1,              //运输方式
                paymentMethod: 1,            //付款方式（1-现付，2-提付，3-发货月结，4-收货月结，5-回单付，6-货款扣，7-提付扣，8-现付提付）
                paymentMode: 1,              //支付方式（1-现金，2-pos机，3-支付宝，4-微信）
                isGoodsControl: "",           //要求控货（0-否，1-是）
                nowPayFeeCreditState: "",     //现付赊账状态（0-正常，1-未结清 2-已结清）
                pickPayFeeCreditState: "",    //提付赊账状态（0-正常，1-未结清 2-已结清）
                codCreditState: "",           //代收货款赊账状态（0-正常，1-未结清 2-已结清）
                settlePayFeeCreditState: "",  //转运垫付状态（0-正常，1-已付 2-未付）
                template: Core.Cache.get('SheetTmpl'),
                toOrgAreas: [],
                showCreate: false,
                isChange: false,
                printCount:0,
                sheet: {}
            };
            return initData;
        },
        updateSheetTmpl: function () {
            this.vSheet.template = Core.Cache.get('SheetTmpl');
        },
        editSheet: function (sheetObj) {
            var that = this;
            this.vSheet = new Vue({
                el: '#fastKpPage',
                data: sheetObj,
                watch: {
                    'agreementNo': function (val) {
                        if (!val || val == "") {
                            that.vSheet.fromCustomerMonthFee = "";
                            that.vSheet.toCustomerMonthFee = "";
                            that.vSheet.agreementId = "";
                        } else {
                            that.vSheet.nowPayFee = "";
                            that.vSheet.pickPayFee = "";
                        }
                    },
                    'prePhone': function (val) {
                        if (val == "") {
                            Core.Cache.remove('searchPreUserPhone');
                        }
                    },
                    "fromCustomerCodCardNo": function (val) {
                        if (val) {
                            that.vSheet.fromCustomerMonthFee = "";
                        }
                    },
                    "toAreaName": function (val) {
                        var lastSheet = Core.Cache.get('lastSaveSheet') || {};
                        var toOrgAreaObj = Core.Cache.get('toOrgArea') || {};
                        if (val != lastSheet['toAreaName'] && val != toOrgAreaObj['areaName']) {
                            that.vSheet.toAreaId = "";
                            that.vSheet.toShopName = "";
                            that.vSheet.toShopId = "";
                        }
                    },
                    "toCustomerPhone": function (val) {
                        var toCustomer = Core.Cache.get('toCustomer');
                        if (toCustomer && toCustomer['phone'] != val && !that.vSheet.objectId) {
                            that.vSheet.toCustomerId = "";
                            that.vSheet.toCustomerName = "";
                            that.vSheet.toCustomerPhone1 = "";
                            that.vSheet.toCustomerAddress = "";
                            that.vSheet.toCustomerIdCard = "";
                            that.vSheet.toCustomerAccount = "";
                            that.vSheet.toCustomerBank = "";
                            that.vSheet.toCustomerBranchBank = "";
                            that.vSheet.toCustomerHolder = "";
                        }
                    }
                },
                methods: {
                    /**
                     * 查询最终目的地
                     * @param val
                     * @returns {boolean}
                     */
                    searchToOrgArea: function (val) {
                        if (!val) {
                            Core.App.alert("最终目的地最少输入一个字");
                            return false;
                        }
                        Core.Service.get('api/auth/v1/sys/areaShop/findAreaShop', {
                            keyword: val
                        }, function (result) {
                            if (result['data'].length > 0) {
                                if (result['data'].length == 1) {
                                    Core.Cache.set('toOrgArea', result['data'][0]);
                                    that.initToOrgArea();
                                } else {
                                    var tmp = {
                                        toOrgAreas: result['data']
                                    };
                                    sheet.lastSearch = tmp;
                                    Core.Page.changePage("findToOrgArea.html");
                                }
                            } else {
                                Core.App.alert("云端查不到数据");
                            }
                        });

                    },
                    searchFromOrgArea: function (val) {
                        if (!val) {
                            Core.App.alert("发货区域最少输入一个字");
                            return false;
                        }
                        Core.Service.get('api/auth/v1/sys/area/findFromArea', {
                            keyword: val
                        }, function (result) {
                            if (result['data'].length > 0) {
                                if (result['data'].length == 1) {
                                    Core.Cache.set('fromOrgArea', result['data'][0]);
                                    that.initFromShop();
                                } else {
                                    var tmp = {
                                        toOrgAreas: result['data']
                                    };
                                    sheet.lastSearch = tmp;
                                    Core.Page.changePage("findFromOrg.html");
                                }
                            } else {
                                Core.App.alert("云端查不到数据");
                            }
                        });
                    },
                    findPreSheet: function (prePhone) {
                        if (Core.Utils.checkPhone(prePhone)) {
                            Core.Cache.set('searchPreUserPhone', prePhone);
                            Core.App.showPreloader();

                            var query1 = new Parse.Query(Order);
                            query1.equalTo("status", '待确认');

                            var query2 = new Parse.Query(Order);
                            query2.equalTo("status", '已确认');

                            var mainQuery = Parse.Query.or(query1, query2);
                            mainQuery.equalTo("loginName", prePhone);
                            mainQuery.equalTo("receiptType", "门店发货");
                            //mainQuery.equalTo("employeeId", Core.Cache.get('userId') + "");
                            mainQuery.equalTo("companyNo", Core.Cache.get('companyNo') + "");
                            mainQuery.descending("updatedAt");
                            mainQuery.find({
                                success: function (results) {
                                    Core.App.hidePreloader();
                                    if (results.length == 0) {
                                        Core.App.alert("微信登录手机号为" + prePhone + "的没有预开票记录");
                                        return false;
                                    }
                                    console.log("共查询到 " + results.length + " 条记录");
                                    // 循环处理查询到的数据
                                    var tmp = {
                                        sheets: results
                                    };
                                    var html = Core.Template.render('preSheetTmpl', tmp);
                                    $('#findPreSheetPage .searchbar-found ul').html(html);
                                    Core.App.mainView.loadPage({"pageName": "findPreSheet"});
                                },
                                error: function (error) {
                                    Core.App.hidePreloader();
                                    Core.App.alert("查询失败: " + error.code + " " + error.message);
                                }
                            });
                        }
                    },
                    /**
                     * 查询到货网点
                     * @param val
                     * @returns {boolean}
                     */
                    searchFromShop: function (val) {
                        if (!val) {
                            Core.App.alert("发货网点最少输入一个字");
                            return false;
                        }
                        Core.Service.get('api/auth/v1/sys/org/findFromShop', {
                            keyword: val
                        }, function (result) {
                            if (result['data'].length > 0) {
                                if (result['data'].length == 1) {
                                    Core.Cache.set('fromShop', result['data'][0]);
                                    that.initFromShop();
                                } else {
                                    var tmp = {
                                        toOrgAreas: result['data']
                                    };
                                    sheet.lastSearch = tmp;
                                    Core.Page.changePage("findFromShop.html");
                                }
                            } else {
                                Core.App.alert("云端查不到数据");
                            }
                        });
                    },
                    searchAgreement: function (value) {
                        if (!value) {
                            Core.App.alert("月结编号不能为空");
                            return false;
                        }
                        that.vSheet.agreementId = "";             //协议id
                        that.vSheet.agreementNo = "";             //协议编号
                        that.vSheet.agreementCompany = "";     //协议单位
                        Core.Service.get('api/auth/v1/ltl/customer/findByAgreementNo', {
                            agreementNo: value
                        }, function (result) {
                            if (result['data'].length > 0) {
                                if (result['data'].length == 1) {
                                    var agreement = result['data'][0];
                                    Core.App.confirm('用户姓名:' + agreement['name'] + '<br>单位名称:' + agreement['agreementCompany'], "请核实信息", function () {
                                        that.vSheet.agreementId = agreement['agreementId'];             //协议id
                                        that.vSheet.agreementNo = agreement['agreementNo'];             //协议编号
                                        that.vSheet.agreementCompany = agreement['agreementCompany'];     //协议单位
                                    });
                                }
                            } else {
                                Core.App.alert('未找到月结单位', function () {
                                    if (Core.App.mainView.activePage.name == 'findFromCustomer') {
                                        Core.Page.back();
                                    }
                                });
                            }
                        });
                    },
                    /**
                     * 查询发货人
                     * @param text
                     * @param key
                     * @param value
                     * @returns {boolean}
                     */
                    searchFromCustomer: function (text, key, value) {
                        if (!value) {
                            Core.App.alert(text + "最少输入一个字");
                            return false;
                        }
                        that.clearFromCustomer();
                        var tmp = {};
                        tmp[key] = value;
                        tmp.areaId = that.vSheet.fromAreaId;
                        console.log(tmp);
                        Core.Service.get('api/auth/v1/ltl/customer/findFromCustomer', tmp, function (result) {
                            if (result['data'].length > 0) {
                                if (result['data'].length == 1) {
                                    var user = result['data'][0];
                                    Core.Cache.set('fromCustomer', user);
                                    if (user['isBlacklist'] == 1) {
                                        Core.App.alert("此客户已列入黑名单,原因:" + user['blacklistReason']);
                                    }
                                    that.initFromCustomer();
                                } else {
                                    var tmp = {
                                        toOrgAreas: result['data']
                                    };
                                    sheet.lastSearch = tmp;
                                    Core.Page.changePage("findFromCustomer.html");
                                }
                            } else {
                                Core.App.alert('未找到发货客户', function () {
                                    if (Core.App.mainView.activePage.name == 'findFromCustomer') {
                                        Core.Page.back();
                                    }
                                });
                            }
                        });
                    },
                    /**
                     * 查询收货人
                     * @param text
                     * @param key
                     * @param value
                     * @returns {boolean}
                     */
                    searchToCustomer: function (text, key, value) {
                        if (!value) {
                            Core.App.alert(text + "最少输入一个字");
                            return false;
                        }
                        var tmp = {};
                        //areaId: that.vSheet.toAreaId
                        tmp[key] = value;
                        tmp.areaId = that.vSheet.toAreaId;
                        console.log(tmp);
                        Core.Service.get('api/auth/v1/ltl/customer/findToCustomer', tmp, function (result) {
                            if (result['data'].length > 0) {
                                if (result['data'].length == 1) {
                                    var user = result['data'][0];
                                    Core.Cache.set('toCustomer', user);
                                    if (user['isBlacklist'] == 1) {
                                        Core.App.alert("此客户已列入黑名单,原因:" + user['blacklistReason']);
                                    }
                                    that.initToCustomer();
                                } else {
                                    var tmp = {
                                        toOrgAreas: result['data']
                                    };
                                    sheet.lastSearch = tmp;
                                    Core.Page.changePage("findToCustomer.html");
                                }
                            } else {
                                Core.App.alert('未找到收货客户', function () {
                                    if (Core.App.mainView.activePage.name == 'findToCustomer') {
                                        Core.Page.back();
                                    }
                                });
                            }
                        });

                    },
                    submit: function ($validate) {
                        if ($validate.valid) {
                            that.vSheet.paymentModeDesc = Core.PaymentMode[that.vSheet.paymentMethod];
                            that.vSheet.transportModeDesc = that.vSheet.transportMode == 1 ? '普通汽运' : "精准汽运";
                            var lastSheet = Core.Cache.get("lastSaveSheet");
                            if (lastSheet) {
                                var cheekArray = ['fromShopId', 'toShopId', 'fromCustomerPhone', 'toCustomerPhone', 'goodsName', 'goodsAmount'];
                                var hadOpen = 0;

                                $.each(cheekArray, function (i, v) {
                                    console.log(v);
                                    if (lastSheet[v] == that.vSheet[v]) {
                                        hadOpen++;
                                    }
                                });
                                if (hadOpen == cheekArray.length) {
                                    Core.App.confirm("重复开票,是否仍要提交!", '温馨提示', function () {
                                        Core.App.confirm("重复开票,是否仍要提交!", '温馨提示', function () {
                                            Core.App.confirm("重复开票,是否仍要提交!", '温馨提示', function () {
                                                that.saveSheet();
                                            });
                                        });
                                    });
                                    return false;
                                }
                            }
                            if (that.vSheet['nowPayFee'] == 0 && that.vSheet['pickPayFee'] == 0 && that.vSheet['fromCustomerMonthFee'] == 0 &&
                                that.vSheet['toCustomerMonthFee'] == 0 && that.vSheet['backPayFee'] == 0 &&
                                that.vSheet['cod'] == 0) {
                                Core.App.confirm("无提付、现付、月结、代收货款,该票无业绩,是否仍要提交!", '温馨提示', function () {
                                    that.saveSheet();
                                });
                                return false;
                            }
                            that.saveSheet();
                        } else {
                            Core.App.alert($validate.errors[0]['message']);
                        }
                    },
                    update: function ($validate, flag) {
                        if ($validate.valid) {
                            that.vSheet.paymentModeDesc = Core.PaymentMode[that.vSheet.paymentMethod];
                            that.vSheet.transportModeDesc = that.vSheet.transportMode == 1 ? '普通汽运' : "精准汽运";

                            if (that.vSheet['nowPayFee'] == 0 && that.vSheet['pickPayFee'] == 0 && that.vSheet['fromCustomerMonthFee'] == 0 &&
                                that.vSheet['toCustomerMonthFee'] == 0 && that.vSheet['backPayFee'] == 0 &&
                                that.vSheet['cod'] == 0) {
                                Core.App.confirm("无提付、现付、月结、代收货款,该票无业绩,是否仍要提交!", '温馨提示', function () {
                                    that.updateSheet(flag);
                                });
                                return false;
                            }
                            that.updateSheet(flag);
                        } else {
                            Core.App.alert($validate.errors[0]['message']);
                        }
                    },
                    showDetail: function () {
                        Core.Cache.set('sheetNo', that.vSheet.sheetNo);
                        Core.Page.changePage("sheetDetail.html", true);
                    },
                    crateNew: function () {
                        //Core.App.showTab("#tab2");
                        that.vSheet.$data = that.getSheetObj();
                        $("#tab2 input").removeAttr("disabled");
                        $("#tab2 select").removeAttr("disabled");
                        Core.Cache.remove('toOrgArea');
                        Core.Cache.remove('toCustomer');
                        //that.updateSheetTmpl();
                        that.initToOrgArea();
                        that.initFromShop();
                        Core.App.confirm("是否保存发货客户信息", function () {
                            //debugger;
                            that.initFromCustomer(true);
                        }, function () {
                            Core.Cache.remove('fromCustomer');
                            that.initFromCustomer(true);
                        });
                    },
                    print: function (mod, template) {
                        that.print(mod, template);
                    }
                }
            });

            // this.updateSheetTmpl();
            return this.vSheet;
        },
        print: function (mod, template) {
            Core.App.alert('in print...', function () {
                var that = this;
                var print = that.getPrintSetting();
                var sheetView = Core.Cache.get("lastSaveSheet");
                if (print) {
                    var deviceType = that.getDeviceType(print);
                    var configName = that.getPrintTemplateName(template);
                    if (!deviceType || !configName) {
                        native.showToast("打印机型号或者打印模板不存在");
                        return false;
                    }
                    if (mod == "WaybillBh" && configName == Core.SheetTemplate[1]) {
                        //打印标签
                        Core.App.confirm('<div id="my-form" class="list-block">\
                                            <ul>\
                                                <li>\
                                                    <div class="item-content">\
                                                    <div class="item-inner">\
                                                    <div class="item-title label">开始</div>\
                                                    <div class="item-input">\
                                                        <input type="number" id="startNumber" value="1">\
                                                    </div>\
                                                    </div>\
                                                    </div>\
                                                </li>\
                                                <li>\
                                                    <div class="item-content">\
                                                        <div class="item-inner">\
                                                            <div class="item-title label">结束</div>\
                                                            <div class="item-input">\
                                                                <input type="number" id="endNumber" value="' + sheetView.goodsAmount + '">\
                                                            </div>\
                                                    </div>\
                                                </div>\
                                            </li>\
                                        </ul>\
                    </div>', "请选择打印位置", function () {
                            var start = $("#startNumber").val() * 1;
                            var end = $("#endNumber").val() * 1;
                            if (start > end) {
                                Core.App.alert("开始标签不能大于结束标签");
                                return false;
                            }
                            if (start > sheetView.goodsAmount) {
                                Core.App.alert("开始标签不能大于货物数量");
                                return false;
                            }
                            if (end > sheetView.goodsAmount) {
                                Core.App.alert("结束标签不能大于货物数量");
                                return false;
                            }
                            that.getPrintTemplate(configName, deviceType, function (result) {
                                var tpl = result['content'];
                                sheetView.companyName = Core.Cache.get('companyName');
                                var html = laytpl(tpl).render(sheetView);
                                native.print(print['address'], deviceType, start, end, html);
                            });
                        });
                    } else if (mod == "WaybillBh" && configName == Core.SheetTemplate[3]) {
                        //回单打印
                        var backSheetAmount = sheetView['backSheetAmount'] || 0;
                        if (backSheetAmount == 0) {
                            Core.App.alert('没有回单');
                            return false;
                        }
                        that.getPrintTemplate(configName, deviceType, function (result) {
                            var tpl = result['content'];
                            sheetView.companyName = Core.Cache.get('companyName');
                            var html = laytpl(tpl).render(sheetView);
                            native.print(print['address'], deviceType, 1, backSheetAmount, html);
                        });
                    } else {
                        // 运单打印
                        var WaybillCount = Core.Cache.get('WaybillCount');
                        that.getPrintTemplate(configName, deviceType, function (result) {
                            var tpl = result['content'];
                            sheetView.companyName = Core.Cache.get('companyName');
                            var html = laytpl(tpl).render(sheetView);
                            native.print(print['address'], deviceType, 1, WaybillCount, html,function () {
                                sheetView.printCount = sheetView.printCount + 1;
                                Core.Cache.set("lastSaveSheet", sheetView);
                            });
                            /*   var backSheetAmount = sheetView['backSheetAmount'] || 0;
                             if (backSheetAmount > 0) {
                             that.getPrintTemplate(Core.SheetTemplate[3], deviceType, function (result) {
                             var tpl = result['content'];
                             sheetView.companyName = Core.Cache.get('companyName');
                             var html = laytpl(tpl).render(sheetView);
                             native.print(print['address'], deviceType, 1, backSheetAmount, html);
                             });
                             }*/

                        });
                    }
                }
            });
        },
        /**
         * 获取打印机设备型号
         * @param print
         * @returns {string}
         */
        getDeviceType: function (print) {
            console.log(print);
            var deviceType = '';
            $.each(Core.PrintModList, function (i, v) {
                if (v['id'] == print['mod']) {
                    deviceType = v['deviceType'];
                    return false;
                }
            });
            return deviceType;
        },
        /**
         * 获取打印机配置
         * @returns {boolean}
         */
        getPrintSetting: function () {
            var print = Core.Cache.get('printSet');
            if (!print) {
                Core.App.alert('未找到已配置的打印机,现在去配置', function () {
                    Core.Page.changePage('printSetting.html', true);
                });
                return false;
            }
            return print;
        },
        /**
         * 获取标签的名称
         * @param template
         * @returns {*}
         */
        getPrintTemplateName: function (template) {
            if (template in Core.SheetTemplate) {
                return Core.SheetTemplate[template];
            } else {
                Core.App.alert('占不支持标签类型');
                return false;
            }
        },
        /**
         * 获取模板
         * @param name
         * @param deviceType
         * @param cb
         */
        getPrintTemplate: function (name, deviceType, cb) {
            var updateTime = (new Date()).getTime();
            var id = name + deviceType;
            var tmp = Core.Cache.get("Template") || {};
            if (id in tmp) {
                var oldTime = tmp[id]['update'] + "";
                if (oldTime.startsWith('2016') || tmp[id]['update'] + 6 * 60 * 60 * 1000 < updateTime) {
                    Core.Service.get('api/auth/v1/ltl/sheet/getPrintTemplate', {
                        deviceType: deviceType,
                        configName: name
                    }, function (result) {
                        tmp[id] = {
                            update: updateTime,
                            content: result['data']['content']
                        };
                        Core.Cache.set("Template", tmp);
                        cb(tmp[id]);
                    });
                } else {
                    cb(tmp[id]);
                }
            } else {
                Core.Service.get('api/auth/v1/ltl/sheet/getPrintTemplate', {
                    deviceType: deviceType,
                    configName: name
                }, function (result) {
                    tmp[id] = {
                        update: updateTime,
                        content: result['data']['content']
                    };

                    Core.Cache.set("Template", tmp);
                    cb(tmp[id]);
                });
            }
        },
        /**
         * 验证运单提交表单
         * @returns {boolean}
         */
        validate: function () {
            return true;
        },
        /**
         * 保存运单
         */
        saveSheet: function () {
            var that = this;
            var tmp = {};
            if (this.vSheet.nowPayFee > 0) {
                this.vSheet.paymentMethod = 1;
            }
            if (this.vSheet.pickPayFee > 0) {
                this.vSheet.paymentMethod = 2;
            }
            if (this.vSheet.nowPayFee > 0 && this.vSheet.pickPayFee > 0) {
                this.vSheet.paymentMethod = 8;
            }

            if (this.vSheet.agreementNo && this.vSheet.agreementNo > 0) {
                this.vSheet.paymentMethod = 3;
            }

            this.vSheet.paymentMethod = 9;

            $.each(this.vSheet.$data, function (i, v) {
                if (i != "template") {
                    tmp[i] = v;
                }
            });
            var batchNo = Core.Cache.get('Batch_Fast') || guid();
            Core.Cache.set('Batch_Fast', batchNo);
            tmp.tid = batchNo;
            Core.Service.post("api/auth/v1/ltl/sheet/saveNewSheet", tmp, function (result) {
                Core.Cache.remove('Batch_Fast');
                $.each(result['data'], function (i, v) {
                    if (v == null || v == "null") {
                        that.vSheet[i] = "";
                    } else {
                        that.vSheet[i] = v;
                    }
                });
                if (that.vSheet.objectId) {
                    Parse.Cloud.run('updateOrderStatus', {
                        objectId: that.vSheet.objectId,
                        companyNo: Core.Cache.get('companyNo') + "",
                        loginName: Core.Cache.get('userId'),
                        sheetNo: result['data']['sheetNo'],
                        sheetNoShort: result['data']['sheetNoShort'],
                        status: "已接货"
                    }, {
                        success: function (result) {
                        },
                        error: function () {
                        }
                    });
                    Core.Cache.remove('lastOrder');
                }
                Core.App.alert("开票成功");
                Core.Cache.set("lastSaveSheet", that.vSheet.$data);
                Core.Cache.set("lastGoodsName", that.vSheet.goodsName);
                that.saveFromCustomer();
                that.vSheet.showCreate = true;
                $("#tab2 input").attr("disabled", "disabled");
                $("#tab2 select").attr("disabled", "disabled");
            });
        },
        /**
         * 更新运单
         */
        updateSheet: function (flag) {
            var that = this;
            var tmp = {};
            if (this.vSheet.nowPayFee > 0) {
                this.vSheet.paymentMethod = 1;
            }
            if (this.vSheet.pickPayFee > 0) {
                this.vSheet.paymentMethod = 2;
            }
            if (this.vSheet.nowPayFee > 0 && this.vSheet.pickPayFee > 0) {
                this.vSheet.paymentMethod = 8;
            }
            if (this.vSheet.agreementNo && this.vSheet.agreementNo > 0) {
                this.vSheet.paymentMethod = 3;
            }
            $.each(this.vSheet.$data, function (i, v) {
                if (i != "template") {
                    tmp[i] = v;
                }
            });
            Core.Service.post("api/auth/v1/ltl/sheet/updateSheet", tmp, function (result) {
                /* $.each(result['data'], function (i, v) {
                 that.vSheet[i] = v;
                 });*/
                $.each(result['data'], function (i, v) {
                    that.vSheet[i] = v;
                });
                Core.Cache.set("lastSaveSheet", result['data']);
                Core.App.alert("修改成功", function () {
                    if (!flag) {
                        Core.Cache.set("needRefresh", "true");
                        Core.Page.back();
                    }
                });
            });
        },
        /**
         * 判断运单是否修改
         * @returns {boolean}
         */
        hadChange: function () {
            return false;
        },
        /**
         *
         * 签名比对服务器
         * @param sheet
         * @param cb {function}
         * @returns {boolean}
         */
        check: function (sheet, cb) {
            return false;
            // var sign = native.sign(sheet, function (sign) {
            //     console.log(sign);
            //     //828aeef3543e09ee10d60a049b82e2fe
            //     //sign="293258e36358259143a713b2916f3ea2";
            //     Core.Service.get('api/auth/v1/ltl/sheet/getSignBySheetNo', {
            //         sheetNo: sheet['sheetNo'],
            //         sign: sign
            //     }, function (result) {
            //         cb(sign == result['data']['sign']);
            //     });
            // });

        },
        /**
         * 初始化目的地
         */
        initToOrgArea: function () {
            var toOrgAreaObj = Core.Cache.get('toOrgArea') || {};
            if ('orgName' in toOrgAreaObj) {
                $("#shopId").val(toOrgAreaObj['orgId']);
                $("#shopName").val(toOrgAreaObj['orgName']);
            } else {
                $("#shopId").val(toOrgAreaObj['id']);
                $("#shopName").val(toOrgAreaObj['name']);
            }


            if ('belongAreaId' in toOrgAreaObj) {
                this.vSheet.toAreaId = toOrgAreaObj['belongAreaId'];
                this.vSheet.toAreaName = toOrgAreaObj['belongAreaName'];
            } else {
                this.vSheet.toAreaId = toOrgAreaObj['areaId'];
                this.vSheet.toAreaName = toOrgAreaObj['areaName'];
            }
            if (toOrgAreaObj['shopId'] > 0) {
                this.vSheet.toShopId = toOrgAreaObj['shopId'];
                this.vSheet.toShopName = toOrgAreaObj['shopName'];
            }

            //Core.Cache.remove('toOrgArea');
        },
        /**
         * 初始化目的地
         */
        initToShop: function () {
            var toOrgAreaObj = Core.Cache.get('toShop') || {};
            if ('orgName' in toOrgAreaObj) {
                if ('orgId' in toOrgAreaObj) {
                    $("#shopId").val(toOrgAreaObj['orgId']);
                } else {
                    $("#shopId").val(toOrgAreaObj['id']);
                }
                $("#shopName").val(toOrgAreaObj['orgName']);
            } else {
                $("#shopId").val(toOrgAreaObj['id']);
                $("#shopName").val(toOrgAreaObj['name']);
            }
            this.vSheet.toShopId = toOrgAreaObj['orgId'];
            this.vSheet.toShopName = toOrgAreaObj['orgName'];
            //Core.Cache.remove('toShop');
        },
        /**
         * 初始化始发网点
         */
        initFromShop: function () {
            var fromShop = Core.Cache.get('attributes') || {};
            this.vSheet.fromShopId = fromShop['orgId'];
            this.vSheet.fromShopName = fromShop['orgName'];

            var fromOrgArea = Core.Cache.get('fromOrgArea') || {};
            if ('id' in fromOrgArea) {
                //this.vSheet.fromAreaId = fromOrgArea['id'];
                this.vSheet.fromAreaName = fromOrgArea['name'];
            } else {
                this.vSheet.fromAreaId = fromShop['belongAreaId'];
                this.vSheet.fromAreaName = fromShop['belongAreaName'];
            }
            this.vSheet.goodsName = Core.Cache.get("lastGoodsName") || "";
            //Core.Cache.remove('fromOrgArea');
        },
        clearFromCustomer: function () {
            Core.Cache.remove('fromCustomer');
            Core.Cache.remove('CodCard');
            this.vSheet.fromCustomerId = "";
            this.vSheet.fromCustomerName = "";
            //this.vSheet.fromCustomerPhone = "";
            this.vSheet.fromCustomerBank = "";
            this.vSheet.fromCustomerAccount = "";
            this.vSheet.fromCustomerBranchBank = "";
            this.vSheet.fromCustomerHolder = "";
            this.vSheet.fromCustomerPhone1 = "";
            this.vSheet.fromCustomerAddress = "";
            this.vSheet.fromCustomerCodCardNo = "";
            this.vSheet.fromCustomerAccount = "";
            this.vSheet.fromCustomerHolder = "";
        },
        confirmCustomer: function (fromCustomer) {
            var that = this;
            if (fromCustomer['agreementId'] > 0) {
                Core.App.confirm('用户姓名:' + fromCustomer['name'] + '<br>单位名称:' + fromCustomer['agreementCompany'], "请核实信息", function () {
                    that.initFromCustomer(true);
                }, function () {
                    sheet.lastSearch = [];
                    that.clearFromCustomer();
                });

            } else if (fromCustomer['codCardNo'] > 0) {
                Core.App.confirm('持卡用户:' + fromCustomer['holder'] + '<br>银行卡号:' + Core.Utils.fmtBankNo(fromCustomer['account']), "请核实信息", function () {
                    that.initFromCustomer(true);
                }, function () {
                    sheet.lastSearch = [];
                    debugger;
                    that.clearFromCustomer();
                });
            } else {
                that.initFromCustomer(true);
            }
        },
        /**
         * 初始化发货客户
         */
        initFromCustomer: function (flag) {
            var searchPreUserPhone = Core.Cache.get('searchPreUserPhone') || "";
            if (searchPreUserPhone) {
                this.vSheet.prePhone = searchPreUserPhone;
            }
            var fromCustomer = Core.Cache.get('fromCustomer');
            if (fromCustomer) {
                if (flag == true) {
                    this.vSheet.fromCustomerId = fromCustomer['id'];
                    this.vSheet.fromCustomerName = fromCustomer['name'];
                    this.vSheet.fromCustomerPhone = fromCustomer['phone'];
                    this.vSheet.fromCustomerPhone1 = fromCustomer['phone1'];
                    this.vSheet.fromCustomerAddress = fromCustomer['address'];

                    this.vSheet.fromCustomerBank = fromCustomer['bank'];
                    this.vSheet.fromCustomerAccount = fromCustomer['account'];
                    this.vSheet.fromCustomerBranchBank = fromCustomer['branchBank'];
                    this.vSheet.fromCustomerHolder = fromCustomer['holder'];

                    /*if (fromCustomer['agreementId'] > 0) {
                     this.vSheet.agreementId = fromCustomer['agreementId'];             //协议id
                     this.vSheet.agreementNo = fromCustomer['agreementNo'];             //协议编号
                     this.vSheet.agreementCompany = fromCustomer['agreementCompany'];     //协议单位
                     // this.vSheet.fromCustomerAccount = fromCustomer['account'];
                     // this.vSheet.fromCustomerHolder = fromCustomer['holder'];
                     }*/
                    // else {
                    //     this.initCode(true);
                    // }

                    sheet.lastSearch = [];
                    //Core.Cache.remove('fromCustomer');
                } else {
                    this.confirmCustomer(fromCustomer);
                }
            }
        },
        saveFromCustomer:function(){
            var fromCustomer ={
                id:this.vSheet.fromCustomerId,
                name:this.vSheet.fromCustomerName,
                phone:this.vSheet.fromCustomerPhone,
                address:this.vSheet.fromCustomerAddress,
                bank:this.vSheet.fromCustomerBank,
                account:this.vSheet.fromCustomerAccount,
                holder:this.vSheet.fromCustomerHolder,
                branchBank:this.vSheet.fromCustomerBranchBank
            };
            Core.Cache.set('fromCustomer',fromCustomer);
        },
        initCode: function (flag) {
            var fromCustomer = Core.Cache.get('CodCard') || Core.Cache.get('fromCustomer') || {};
            if (flag == true) {
                if (fromCustomer && fromCustomer['codCardNo']) {
                    this.vSheet.fromCustomerName = fromCustomer['holder'];
                    this.vSheet.fromCustomerPhone = fromCustomer['phone'] == null ? 0 : fromCustomer['phone'];
                    this.vSheet.fromCustomerCodCardNo = fromCustomer['codCardNo'] * 1;
                    this.vSheet.fromCustomerAccount = fromCustomer['account'];
                    this.vSheet.fromCustomerHolder = fromCustomer['holder'];
                }
            } else {
                this.confirmCustomer(fromCustomer);
            }
        },
        /**
         * 初始化到货客户
         */
        initToCustomer: function () {
            var toCustomer = Core.Cache.get('toCustomer') || {};
            this.vSheet.toCustomerId = toCustomer['id'];
            this.vSheet.toCustomerName = toCustomer['name'];
            this.vSheet.toCustomerPhone = toCustomer['phone'];
            this.vSheet.toCustomerPhone1 = toCustomer['phone1'];
            this.vSheet.toCustomerAddress = toCustomer['address'];
            this.vSheet.toCustomerCardNo = toCustomer['customerNo'];

            this.vSheet.toCustomerIdCard = toCustomer['idCard'];
            this.vSheet.toCustomerAccount = toCustomer['account'];
            this.vSheet.toCustomerBank = toCustomer['bank'];
            this.vSheet.toCustomerBranchBank = toCustomer['branchBank'];
            this.vSheet.toCustomerHolder = toCustomer['holder'];

            Core.Cache.remove('toCustomer');

            sheet.lastSearch = [];
        },
        /**
         *
         * @param sheetLabelNo {string}
         * @returns {boolean}
         */
        checkLabel: function (sheetLabelNo) {
            var sheetPre = Core.Cache.get('sheetPre');
            if (!sheetLabelNo.startsWith(sheetPre)) {
                native.mediaVibrate(Core.ScanCode.notRead, "不识别条码");
                return false;
            }
            return true;
        },
        getShortSheetNo: function (sheetLabelNo) {
            var sheetPre = Core.Cache.get('sheetPre') + "";
            if (sheetLabelNo.startsWith(sheetPre)) {
                sheetLabelNo = sheetLabelNo.substr(sheetPre.length, sheetLabelNo.length);
            }
            if (sheetLabelNo.length > sheetLength) {
                sheetLabelNo = this.getSheetNo(sheetLabelNo);
            }
            return sheetLabelNo;
        },
        getFullSheetNo: function (sheetLabelNo) {
            sheetLabelNo = this.getShortSheetNo(sheetLabelNo);
            var sheetPre = Core.Cache.get('sheetPre') + "";
            return sheetPre + sheetLabelNo;
        },
        getSheetNo: function (sheetLabelNo) {
            return sheetLabelNo.substr(0, sheetLabelNo.length - 4);
        },
        getBatchNo: function (key, isReset) {
            var batchNo = Core.Cache.get("Batch_" + loginName + "_" + key);
            if (!batchNo || isReset) {
                batchNo = (new Date()).getTime();
                Core.Cache.set("Batch_" + loginName + "_" + key, batchNo);
            }
            return batchNo;
        },
        scanPre: function (e) {
            if (Core.App.mainView.activePage.name !== "findPreSheet") {
                return false;
            }
            var objectId = e.detail['sheetLabelNo'];
            var query = new Parse.Query(Order);
            query.equalTo("objectId", objectId);
            query.equalTo("state", false);
            query.find({
                success: function (results) {
                    Core.App.hidePreloader();
                    if (results.length == 0) {
                        Core.App.alert("未找到任何记录");
                        return false;
                    }
                    console.log("共查询到 " + results.length + " 条记录");
                    // 循环处理查询到的数据
                    var tmp = {
                        sheets: results
                    };
                    var html = Core.Template.render('preSheetTmpl', tmp);
                    $('#findPreSheetPage .searchbar-found ul').html(html);
                },
                error: function (error) {
                    Core.App.hidePreloader();
                    Core.App.alert("查询失败: " + error.code + " " + error.message);
                }
            });
        }
    };
    sheet.init();
    document.addEventListener('getScan', sheet.scanPre, false);
    window.Sheet = sheet;
    module.exports = sheet;
});
