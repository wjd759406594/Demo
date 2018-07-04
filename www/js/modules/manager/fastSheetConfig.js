define(function (require, exports, module) {
    "use strict";
    var Parse = window.Parse;
    var native = require('js/modules/hybridapi');
    var Core = require('js/modules/core/core');
    var loginName = Core.Cache.get("loginName");
    var laytpl = require('js/modules/core/laytpl');
    var Sheet = require('js/modules/model/sheet');
    var Order = Parse.Object.extend("Order");
    var analytics = require('js/modules/core/analytics');

    var lxDb = Core.lxDb;
    var IDB = lxDb.getIDB(Core.Cache.get('companyNo'));
    var config;
    var Base64 = window.Base64;
    var sheet = {
        vSheet: {},
        content: {},
        lastSearch: [],
        /**
         * 初始化config配置
         */
        initConfig: function () {
            config = Core.Utils.getConfig();
            var options = "";
            $.each(config['customerBank'], function (i, v) {
                options += '<option value="' + v['value'] + '">' + v['label'] + '</option>';
            });
            $('#fromCustomerBank').append(options);
        },
        init: function () {
            this.initConfig();
            var sheetTmpl = Core.Cache.get('FastSheetTmpl');
            if (!sheetTmpl || Core.Cache.get("FastSheetTmplVersion") != '2.1.4') {
                Core.Cache.set("FastSheetTmplVersion", '2.1.4');
                sheetTmpl = {
                    toCustomerPhone1: {
                        name: "收货客户备用电话",
                        show: false
                    },
                    toCustomerAddress: {
                        name: "收货客户地址",
                        show: true
                    },
                    requirement: {
                        name: "特殊需求",
                        show: false
                    },
                    rebates: {
                        name: "劳务费",
                        show: true
                    },
                    goodsWV: {
                        name: "重量/体积",
                        show: false
                    },
                    receiptDeliveryFee: {
                        name: "接货费/送货费",
                        show: true
                    },
                    declaredPremium: {
                        name: "声明价值/保费",
                        show: true
                    },
                    backSheet: {
                        name: "回单",
                        show: false
                    }

                };
                Core.Cache.set('FastSheetTmpl', sheetTmpl);
            }

            var that = this;

            $$(document)
                .on('pageInit', '.page[data-page="searchFromArea"]', function (e) {
                    var fromOrgAreaHistory = Core.Cache.get('fromOrgAreaHistory') || [];
                    var html = "";
                    if (fromOrgAreaHistory.length > 0) {
                        $.each(fromOrgAreaHistory, function (i, v) {
                            html += "<li  data-val='" + JSON.stringify(v) + "'>" + v['name'] + " <span class='search-item'>" + JSON.stringify(v) + "</span></li>";
                        });
                        $('#searchFromArea .history').html(html);
                    }
                    setTimeout(function () {
                        $('#searchFromInput').focus();
                    }, 100);
                })
                .on('pageInit', '.page[data-page="searchToArea"]', function (e) {
                    var toOrgAreaHistory = Core.Cache.get('toOrgAreaHistory') || [];
                    var html = "";
                    if (toOrgAreaHistory.length > 0) {
                        $.each(toOrgAreaHistory, function (i, v) {
                            var name = v['name'] ? v['name'] : v['areaName'];
                            html += "<li data-val='" + JSON.stringify(v) + "'>" + name + " <span class='search-item'>" + JSON.stringify(v) + "</span></li>";
                        });
                        $('#searchToArea .history').html(html);
                    }
                    setTimeout(function () {
                        $('#searchToInput').focus();
                    }, 100);
                })
                .on('pageBeforeAnimation', '.page[data-page="goodsHistory"]', function (e) {
                    var goodsHistory = Core.Cache.get('goodsHistory') || [];
                    var html = "";
                    if (goodsHistory.length > 0) {
                        $.each(goodsHistory, function (i, v) {
                            html += "<li>" + v + "</li>";
                        });
                        $('#goodsHistory .history').html(html);
                    }
                })
                .on('pageInit', '.page[data-page="findAgreement"]', function (e) {
                    var html = Core.Template.render('findAgreementTmpl', sheet.lastSearch);
                    $('#findAgreement .searchbar-found ul').html(html);
                })
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
                .on('click', '.scanQr', function () {
                    native.scanQr();
                })
                .on('click', '.searchbar-clear', function () {
                    $('.search-found').hide();
                })
                .on('click', '#searchFromArea .history li', function () {
                    var v = $(this).data('val');
                    Core.Cache.set('fromOrgArea', v);
                    that.initFromShop();
                    Core.Page.back();
                })
                .on('click', '#searchToArea .history li', function () {
                    var v = $(this).data('val');
                    Core.Cache.set('toOrgArea', v);
                    that.initToOrgArea();
                    Core.Page.back();
                })
                .on('click', '#goodsHistory .history li', function () {
                    that.vSheet.goodsName = $(this).text();
                    Core.Page.back();
                })
                .on('click', '.clearHistory', function () {
                    var type = $(this).data('type');
                    if (type == 'fromArea') {
                        Core.App.confirm("确认清除历史记录？", function () {
                            $('#searchFromArea .history').empty();
                            Core.Cache.remove('fromOrgAreaHistory');
                        });
                    } else if (type == "toArea") {
                        Core.App.confirm("确认清除历史记录？", function () {
                            $('#searchToArea .history').empty();
                            Core.Cache.remove('toOrgAreaHistory');
                        });
                    } else if (type == "goodsHistory") {
                        Core.App.confirm("确认清除历史记录？", function () {
                            $('#goodsHistory .history').empty();
                            Core.Cache.remove('goodsHistory');
                        });
                    }
                })
                .on('submit', 'form', function () {
                    if ($(this).hasClass('searchbar')) {
                        var type = $(this).data('type');
                        that.searchArea(type);
                    }
                    return false;
                })
                .on('click', '.search-btn', function () {
                    var type = $(this).data('type');
                    that.searchArea(type);
                })
                .on('click', '#findFromCustomer .searchbar-found .item-link', function () {
                    Core.Cache.set('fromCustomer', $(this).data('val'));
                    var fromCustomer = $(this).data('val');
                    if (fromCustomer['codCardNo'] == null || fromCustomer['codCardNo'] == "") {
                        Core.Cache.remove('CodCard');
                    }
                    if (fromCustomer['isBlacklist'] == 1) {
                        native.showToast("此客户已列入黑名单,原因:" + fromCustomer['blacklistReason']);
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
                        native.showToast("此客户已列入黑名单,原因:" + val['blacklistReason']);
                    }
                    that.initToCustomer();
                    Core.mainView.router.back();
                })
                .on('click', '#findToOrgArea  .searchbar-found  .item-link', function () {
                    Core.Cache.set('toOrgArea', $(this).data('val'));
                    that.initToOrgArea();
                    Core.mainView.router.back();
                })
                .on('click', '#searchToArea  .searchbar-found  .item-link', function () {
                    Core.Cache.set('toOrgArea', $(this).data('val'));
                    that.initToOrgArea();
                    Core.mainView.router.back();
                })
                .on('click', '#searchFromArea  .searchbar-found  .item-link', function () {
                    Core.Cache.set('fromOrgArea', $(this).data('val'));
                    that.initFromShop();
                    Core.mainView.router.back();
                })
                .on('click', '#findFromShop  .searchbar-found  .item-link', function () {
                    Core.Cache.set('fromShop', $(this).data('val'));
                    that.initFromShop();
                    Core.mainView.router.back();
                })
                .on('click', '#findAgreement  .searchbar-found  .item-link', function () {
                    Core.Cache.set('agreement', $(this).data('val'));
                    Core.mainView.router.back();
                    that.setAgreement();
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
        /**
         * 查询网点
         * @param type
         * @param name
         * @param needBack
         * @returns {boolean}
         */
        searchArea: function (type, name, needBack) {
            needBack = needBack != undefined ? needBack : true;
            var that = this;
            var val, tmp;
            if (type == "fromArea") {
                val = $("#searchFromInput").val();
                if (!val) {
                    native.showToast("发货网点最少输入一个字");
                    return false;
                }

                var fromOrgAreaHistory = Core.Cache.get('fromOrgAreaHistory') || [];

                if (fromOrgAreaHistory.length > 0) {
                    $.each(fromOrgAreaHistory, function (k, v) {
                        if (v['name'] == val) {
                            tmp = v;
                            return false;
                        }
                    });
                }
                if (tmp) {
                    Core.Cache.set('fromOrgArea', tmp);
                    that.initFromShop();
                    if (needBack) {
                        Core.Page.back();
                    }
                } else {
                    Core.Service.get('api/auth/v1/sys/org/findFromShop', {
                        keyword: val
                    }, function (result) {
                        if (result['data'].length > 0) {
                            if (result['data'].length == 1) {
                                Core.Cache.set('fromOrgArea', result['data'][0]);
                                that.initFromShop();
                                if (needBack) {
                                    Core.Page.back();
                                }
                            } else {
                                var tmp = {
                                    toOrgAreas: result['data']
                                };
                                var html = Core.Template.render('findFromShopTmpl', tmp);
                                $('#searchFromArea .search-found').show().children().html(html);
                            }
                        } else {
                            native.showToast("没有找到发货网点:" + val);
                            that.vSheet.fromShopName = "";
                        }
                    });
                }

            } else if (type == "toArea") {
                val = $("#searchToInput").val() || name;
                if (!val) {
                    native.showToast("目的地最少输入一个字");
                    return false;
                }

                var toOrgAreaHistory = Core.Cache.get('toOrgAreaHistory') || [];

                if (toOrgAreaHistory.length > 0) {
                    $.each(toOrgAreaHistory, function (k, v) {
                        if (v['areaName'] == val) {
                            tmp = v;
                            return false;
                        }
                    });
                }
                if (tmp) {
                    Core.Cache.set('toOrgArea', tmp);
                    that.initToOrgArea();
                    if (needBack) {
                        Core.Page.back();
                    }
                } else {
                    Core.Service.get('api/auth/v1/sys/region/findByKeyword', {
                        keyword: val
                    }, function (result) {

                        if (result['data'].length > 0) {
                            if (result['data'].length == 1) {
                                Core.Cache.set('toOrgArea', result['data'][0]);
                                that.initToOrgArea();
                                if (needBack) {
                                    Core.Page.back();
                                }
                            } else {
                                var tmp = {
                                    toOrgAreas: result['data']
                                };
                                var html = Core.Template.render('toAreaTmpl', tmp);
                                $('#searchToArea .search-found').show().children().html(html);
                            }
                        } else {
                            that.vSheet.toAreaName = "";
                            native.showToast("<span class='color-red'>" + val + "</span>暂不支持到货");
                        }
                    });
                }
            }
        },
        initPreOrder: function (val, needBack) {
            var that = this;
            that.vSheet.$data.objectId = val.objectId;
            that.clearFromCustomer();
            $.each(val, function (i, v) {
                if (i != "codCardNo" && i != "createdAt" && i != "updatedAt" && i != "ACL" && i != "userId") {
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
            this.searchArea("toArea", that.vSheet.toAreaName, needBack);
        },
        updateFastSheetTmpl: function () {
            this.vSheet.template = Core.Cache.get('FastSheetTmpl');
        },
        editSheet: function (sheetObj) {
            var that = this;
            this.vSheet = new Vue({
                el: '#fastKpPage',
                data: sheetObj ? sheetObj : Sheet.get(), //Object.assign(Sheet.get(), sheetObj),
                watch: {
                    'agreementNo': function (val) {
                        if (!val || val == "") {
                            // that.vSheet.fromCustomerMonthFee = "";
                            // that.vSheet.toCustomerMonthFee = "";
                            that.vSheet.agreementId = "";
                            that.vSheet.agreementNo = "";
                            that.vSheet.agreementCompany = "";
                        }
                    },
                    'prePhone': function (val) {
                        /* if (val == "") {
                         Core.Cache.remove('searchPreUserPhone');
                         }*/
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
                    showSearchPage: function (url, name) {
                        if (name) {
                            Core.Cache.set('searchName', that.vSheet[name]);
                        }
                        Core.Page.changePage(url);
                    },
                    updateActivity: function () {
                        Core.Service.get('api/auth/ /v1/ltl/activity/find', {}, function (result) {
                            Core.Cache.set("activity", result['data']);
                            native.showToast("同步活动信息成功");
                            that.initToOrgArea();
                        });
                    },
                    searchMemberCardNo: function (value) {
                        if (!value) {
                            native.showToast("会员卡号不能为空");
                            return false;
                        }
                        Core.Service.get('api/auth/v1/ltl/customer/findByMemberCardNo', {
                            memberCardNo: value
                        }, function (result) {
                            var data = result['data'];
                            if (data.length > 0) {
                                Core.Cache.set('fromCustomer', data[0]);
                                that.initFromCustomer(true);
                            } else {
                                native.showToast("会员卡号[" + value + "]不存在");
                            }
                        });
                    },
                    /**
                     * 查询最终目的地
                     * @param val
                     * @returns {boolean}
                     */
                    searchToOrgArea: function (val) {
                        if (!val) {
                            native.showToast("最终目的地最少输入一个字");
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
                                    sheet.lastSearch = {
                                        toOrgAreas: result['data']
                                    };
                                    Core.Page.changePage("findToOrgArea.html");
                                }
                            } else {
                                native.showToast(val + "暂不支持到货");
                            }
                        });

                    },
                    findPreSheet: function (prePhone) {
                        if (Core.Utils.checkPhone(prePhone)) {
                            Core.Cache.set('searchPreUserPhone', prePhone);
                            Core.Service.run('queryOrder', {
                                prePhone: prePhone + "",
                                receiptType: "门店发货",
                                companyNo: Core.Cache.get('sheetPre') + ""
                            }, function (results) {
                                console.log(results);
                                if (results.length == 0) {
                                    native.showToast("微信登录手机号为" + prePhone + "的没有预开票记录");
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
                            native.showToast("发货网点最少输入一个字");
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
                                native.showToast("云端查不到数据");
                            }
                        });
                    },
                    searchAgreement: function (value) {
                        if (!value) {
                            native.showToast("月结编号不能为空");
                            return false;
                        }
                        that.vSheet.agreementId = "";             //协议id
                        that.vSheet.agreementNo = "";             //协议编号
                        that.vSheet.agreementCompany = "";     //协议单位
                        Core.Service.get('api/auth/v1/ltl/agreement/findByKeyword', {
                            keyword: value
                        }, function (result) {
                            if (result['data'].length > 0) {
                                if (result['data'].length == 1) {
                                    Core.Cache.set('agreement', result['data'][0]);
                                    that.setAgreement();
                                } else {
                                    sheet.lastSearch = {
                                        agreements: result['data']
                                    };
                                    Core.Page.changePage("findAgreement.html");
                                }
                            } else {
                                native.showToast('未找到月结单位');
                                if (Core.App.mainView.activePage.name == 'findFromCustomer') {
                                    Core.Page.back();
                                }
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
                            native.showToast(text + "最少输入一个字");
                            return false;
                        }
                        that.clearFromCustomer();
                        var tmp = {};
                        tmp[key] = value;
                        tmp.areaId = that.vSheet.fromAreaId || "";
                        console.log(tmp);
                        Core.Service.get('api/auth/v1/ltl/customer/findFromCustomer', tmp, function (result) {
                            if (result['data'].length > 0) {
                                if (result['data'].length == 1) {
                                    var user = result['data'][0];
                                    Core.Cache.set('fromCustomer', user);
                                    if (user['isBlacklist'] == 1) {
                                        native.showToast("此客户已列入黑名单,原因:" + user['blacklistReason']);
                                    }
                                    that.initFromCustomer();
                                } else {
                                    sheet.lastSearch = {
                                        toOrgAreas: result['data']
                                    };
                                    Core.Page.changePage("findFromCustomer.html");
                                }
                            } else {
                                native.showToast('未找到发货客户');
                                if (Core.App.mainView.activePage.name == 'findFromCustomer') {
                                    Core.Page.back();
                                }
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
                            native.showToast(text + "最少输入一个字");
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
                                        native.showToast("此客户已列入黑名单,原因:" + user['blacklistReason']);
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
                                native.showToast('未找到收货客户');
                                if (Core.App.mainView.activePage.name == 'findToCustomer') {
                                    Core.Page.back();
                                }
                            }
                        });

                    },
                    submit: function ($validate) {
                        if ($validate.valid) {


                            that.vSheet.paymentModeDesc = Core.PaymentMode[that.vSheet.paymentMethod];
                            that.vSheet.transportModeDesc = that.vSheet.transportMode == 1 ? '普通汽运' : "精准汽运";
                            var lastSheet = Core.Cache.get("lastSaveSheet");
                            if (lastSheet) {
                                var cheekArray = ['fromShopName', 'toShopId', 'fromCustomerPhone', 'toCustomerPhone', 'goodsName', 'goodsAmount'];
                                var hadOpen = 0;

                                $.each(cheekArray, function (i, v) {
                                    if (lastSheet[v] == that.vSheet[v]) {
                                        hadOpen++;
                                    }
                                });
                                if (hadOpen == cheekArray.length) {
                                    Core.App.confirm("重复开票,是否仍要提交!", '温馨提示', function () {
                                        Core.App.confirm("重复开票,是否仍要提交!", '温馨提示', function () {
                                            that.saveSheet();
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
                            native.showToast($validate.errors[0]['message']);
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
                            native.showToast($validate.errors[0]['message']);
                        }
                    },
                    showDetail: function () {
                        Core.Cache.set('sheetNo', that.vSheet.sheetNo);
                        Core.Page.changePage("sheetDetail.html", true);
                    },
                    trialPremium: function () {
                        if (!that.vSheet.declaredValue || that.vSheet.declaredValue < 1) {
                            native.showToast("请输入正确的声明价值");
                            return false;
                        }
                        Core.Service.get('api/auth/v1/ltl/sheet/trialPremium', {
                            money: that.vSheet.declaredValue,
                            fromCustomerPhone: that.vSheet.fromCustomerPhone,
                            toCustomerPhone: that.vSheet.toCustomerPhone,
                            agreementNo: that.vSheet.agreementNo,
                            fromShopName: that.vSheet.fromShopName,
                            toRegionName: that.vSheet.toRegionName,
                            requirement: that.vSheet.requirement
                        }, function (result) {
                            var data = result['data'];
                            Core.App.alert("保费:" + data['fee'] + "<br/>" + data['feeInfo'], '试算结果');
                        });
                    },
                    crateNew: function () {
                        that.vSheet.$data = Sheet.get();
                        $("#tab2 input").removeAttr("disabled");
                        $("#tab2 select").removeAttr("disabled");
                        Core.Cache.remove('toOrgArea');
                        Core.Cache.remove('toCustomer');
                        //that.updateFastSheetTmpl();
                        that.initToOrgArea();
                        that.initFromShop();
                        Core.App.confirm("是否保存发货客户信息", function () {
                            //debugger;
                            that.initFromCustomer(true);
                        }, function () {
                            Core.Cache.remove('fromCustomer');
                            that.initFromCustomer(true);
                        });
                        $('.page-content').scrollTop(0);
                    },
                    print: function (mod, template) {
                        that.print(mod, template);
                    },
                    printList: function () {
                        analytics.onClickEvent(0x3030002);
                        var sheetView = Core.Cache.get("lastSaveSheet");
                        if (sheetView.goodsAmount <= 10) {
                            that.printList(1, sheetView.goodsAmount);
                        } else {
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
                                    native.showToast("开始标签不能大于结束标签");
                                    return false;
                                }
                                if (start > sheetView.goodsAmount) {
                                    native.showToast("开始标签不能大于货物数量");
                                    return false;
                                }
                                if (end > sheetView.goodsAmount) {
                                    native.showToast("结束标签不能大于货物数量");
                                    return false;
                                }
                                that.printList(start, end);
                            });
                        }
                    }
                }
            });
            this.updateFastSheetTmpl();
            return this.vSheet;
        },
        /**
         * 获取标签渲染模板
         * @param deviceType
         * @param sheetView
         * @param isFast 提示选择
         * @param cb
         */
        renderPrintLabel: function (deviceType, sheetView, isFast, cb) {
            IDB.print
                .where("[no+deviceType]")
                .equals([Core.SheetTemplate[1], deviceType])
                .first()
                .then(function (template) {
                    if (!template) {
                        native.showToast("标签模板未找到,请联系管理员添加");
                        return false;
                    }
                    var tpl = template['content'];
                    var text = laytpl(tpl).render(sheetView);
                    if (isFast && sheetView['goodsAmount'] < 30) {
                        cb({
                            start: 1,
                            end: sheetView['goodsAmount'],
                            html: Base64.encode(text)
                        });
                    } else {
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
                                native.showToast("开始标签不能大于结束标签");
                                return false;
                            }
                            if (start > sheetView.goodsAmount) {
                                native.showToast("开始标签不能大于货物数量");
                                return false;
                            }
                            if (end > sheetView.goodsAmount) {
                                native.showToast("结束标签不能大于货物数量");
                                return false;
                            }
                            // console.log(text);
                            cb({
                                start: start,
                                end: end,
                                html: Base64.encode(text)
                            });
                        });
                    }
                });
        },
        /**
         * 渲染打印回单信息
         * @param deviceType
         * @param sheetView
         * @param cb
         */
        renderPrintBack: function (deviceType, sheetView, cb) {
            IDB.print
                .where("[no+deviceType]")
                .equals([Core.SheetTemplate[3], deviceType])
                .first()
                .then(function (template) {
                    if (!template) {
                        native.showToast("回单模板未找到,请联系管理员添加");
                        return false;
                    }
                    var tpl = template['content'];
                    var text = laytpl(tpl).render(sheetView);
                    // console.log(text);
                    cb({
                        start: 1,
                        end: sheetView['backSheetAmount'],
                        html: Base64.encode(text)
                    });
                });
        },
        /**
         * 打印运单和回单
         * @param deviceType
         * @param sheetView
         * @param cb
         */
        renderPrintWaybill: function (deviceType, sheetView, cb) {
            var WaybillCount = Core.Cache.get('WaybillCount');
            IDB.print
                .where("[no+deviceType]")
                .equals([Core.SheetTemplate[2], deviceType])
                .first()
                .then(function (template) {
                    if (!template) {
                        native.showToast("运单模板未找到,请联系管理员添加");
                        return false;
                    }
                    var tpl = template['content'];
                    var text = laytpl(tpl).render(sheetView);
                    // console.log(text);
                    cb({
                        start: 1,
                        end: WaybillCount,
                        html: Base64.encode(text)
                    });
                });
        },
        addPrintCount: function (sheetView) {
            sheetView.printCount = sheetView.printCount + 1;
            Core.Cache.set("lastSaveSheet", sheetView);
        },
        print: function (mod, template, sheet) {
            var that = this;
            var print = Core.Utils.getPrintSetting();
            var sheetView = sheet ? sheet : Core.Cache.get("lastSaveSheet");
            sheetView = Core.Utils.escape(sheetView);
            if (print) {
                var deviceType = Core.Utils.getDeviceType(print);
                var configName = Core.Utils.getPrintTemplateName(template);
                if (!deviceType || !configName) {
                    native.showToast("打印机型号或者打印模板不存在");
                    return false;
                }
                //打印标签
                if (mod == "WaybillBh" && configName == Core.SheetTemplate[1]) {
                    analytics.onClickEvent(0x3030004);
                    this.renderPrintLabel(deviceType, sheetView, false, function (printObj) {
                        native.printList(print['address'], deviceType, [printObj]);
                    })
                } else if (mod == "WaybillBh" && configName == Core.SheetTemplate[3]) {

                    analytics.onClickEvent(0x3030003);
                    var backSheetAmount = sheetView['backSheetAmount'] || 0;
                    if (backSheetAmount == 0) {
                        native.showToast('没有回单');
                        return false;
                    }
                    this.renderPrintBack(deviceType, sheetView, function (printObj) {
                        native.printList(print['address'], deviceType, [printObj]);
                    });
                } else {
                    analytics.onClickEvent(0x3030005);
                    this.renderPrintWaybill(deviceType, sheetView, function (printObj) {
                        var printList = [];
                        printList.push(printObj);
                        native.printList(print['address'], deviceType, printList, function () {
                            that.addPrintCount(sheetView);
                        });
                    });
                }
            }
        },
        printList: function () {
            var that = this;
            var print = Core.Utils.getPrintSetting();
            var sheetView = Core.Cache.get("lastSaveSheet");
            sheetView = Core.Utils.escape(sheetView);
            if (print) {
                var deviceType = Core.Utils.getDeviceType(print);
                if (!deviceType) {
                    native.showToast("不识别的打印机型号");
                    return false;
                }
                var printList = [];
                that.renderPrintWaybill(deviceType, sheetView, function (waybillObj) {
                    that.renderPrintBack(deviceType, sheetView, function (backObj) {
                        that.renderPrintLabel(deviceType, sheetView, true, function (labelObj) {
                            printList.push(waybillObj);
                            if (sheetView['backSheetAmount'] > 0) {
                                printList.push(backObj);
                            }
                            printList.push(labelObj);
                            console.log(printList);
                            native.printList(print['address'], deviceType, printList, function () {
                                that.addPrintCount(sheetView);
                            });
                        });
                    });
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
        buildSendSheet: function () {
            var tmp = {};

            $.each(this.vSheet.$data, function (i, v) {
                if (i != "template" && i != "activity" && i != "sheet" && i != "memberCardNo" && i != "activity"
                    && i != "prePhone" && i != "toOrgAreas" && i != "isChange" && i != "printCount" && i != "showCreate" && v != "") {
                    tmp[i] = v;
                }
            });
            var batchNo = Core.Cache.get('Batch_Fast') || guid();
            Core.Cache.set('Batch_Fast', batchNo);
            tmp.tid = batchNo;

            return tmp;
        },
        /**
         * 保存运单
         */
        saveSheet: function () {
            analytics.onClickEvent(0x3030001)
            var that = this;
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

            Core.Service.post("api/auth/v1/ltl/sheet/saveNewSheet", this.buildSendSheet(), function (result) {
                Core.Cache.remove('Batch_Fast');
                $.each(result['data'], function (i, v) {
                    if (v == null || v == "null") {
                        that.vSheet[i] = "";
                    } else {
                        that.vSheet[i] = v;
                    }
                });
                if (that.vSheet.objectId) {
                    Parse.Cloud.run('changeOrderState', {
                        objectId: that.vSheet.objectId,
                        sheetNo: result['data']['sheetNo'],
                        sheetNoShort: result['data']['sheetNoShort'],
                        state: "已接货"
                    }, {
                        success: function (result) {
                        },
                        error: function () {
                        }
                    });
                    Core.Cache.remove('lastOrder');
                }
                native.showToast("开票成功");
                Core.Cache.set("lastSaveSheet", that.vSheet.$data);
                Core.Cache.set("lastGoodsName", that.vSheet.goodsName);
                that.saveFromCustomer();
                that.vSheet.showCreate = true;
                $("#tab2 input").attr("disabled", "disabled");
                $("#tab2 select").attr("disabled", "disabled");
                setTimeout(function () {
                    $('.page-content').scrollTop(999);
                }, 100);
            });
        },
        /**
         * 更新运单
         */
        updateSheet: function (flag) {
            var that = this;
            // if (this.vSheet.nowPayFee > 0) {
            //     this.vSheet.paymentMethod = 1;
            // }
            // if (this.vSheet.pickPayFee > 0) {
            //     this.vSheet.paymentMethod = 2;
            // }
            // if (this.vSheet.nowPayFee > 0 && this.vSheet.pickPayFee > 0) {
            //     this.vSheet.paymentMethod = 8;
            // }
            // if (this.vSheet.agreementNo && this.vSheet.agreementNo > 0) {
            //     this.vSheet.paymentMethod = 3;
            // }
            if (that.vSheet.isReturn) {
                Core.Service.post("api/auth/v1/ltl/sheet/saveReturnNewSheet", this.buildSendSheet(), function (result) {
                    Core.Cache.remove('Batch_Fast');
                    $.each(result['data'], function (i, v) {
                        that.vSheet[i] = v;
                    });
                    Core.Cache.set("lastSaveSheet", result['data']);
                    Core.App.alert("修改成功", function () {
                        if (!flag) {
                            Core.Page.back();
                        }
                    });
                });
            } else {
                Core.Service.post("api/auth/v1/ltl/sheet/updateSheet", this.buildSendSheet(), function (result) {
                    Core.Cache.remove('Batch_Fast');
                    $.each(result['data'], function (i, v) {
                        that.vSheet[i] = v;
                    });
                    Core.Cache.set("lastSaveSheet", result['data']);
                    Core.App.alert("修改成功", function () {
                        if (!flag) {
                            Core.Page.back();
                        }
                    });
                });
            }
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
                this.vSheet.toRegionName = toOrgAreaObj['name'];
            }

            if ('name' in toOrgAreaObj || 'id' in toOrgAreaObj) {
                var toOrgAreaHistory = Core.Cache.get('toOrgAreaHistory') || [];
                if (toOrgAreaHistory.length > 0) {
                    var flag = false;
                    $.each(toOrgAreaHistory, function (i, v) {
                        if ((v['id'] && v['id'] == toOrgAreaObj['id'])) {
                            flag = true;
                            return false;
                        }
                    });
                    if (!flag) {
                        toOrgAreaHistory.push(toOrgAreaObj);
                    }

                } else {
                    toOrgAreaHistory.push(toOrgAreaObj);
                }
                this.showActivity(this.vSheet.toAreaName);
                Core.Cache.set('toOrgAreaHistory', toOrgAreaHistory);
            }
            //Core.Cache.remove('toOrgArea');
        },
        showActivity: function (areaName) {
            var that = this;
            that.vSheet.activity = "";
            var activity = Core.Cache.get("activity") || [];
            if (activity.length > 0) {
                $.each(activity, function (i, v) {
                    if (v['areaList'].length > 0) {
                        $.each(v['areaList'], function (i1, v1) {
                            if (areaName == v1['areaName']) {
                                that.vSheet.activity += v['content'] + "<br>";
                            }
                        });
                    }
                });
            }
        },
        /**
         * 初始化到货网点
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

        setAgreement: function () {
            var that = this;
            var agreement = Core.Cache.get('agreement') || '';
            if (agreement) {
                Core.App.confirm('单位名称:' + agreement['company'], "请核实信息", function () {
                    that.vSheet.agreementId = agreement['id'];             //协议id
                    that.vSheet.agreementNo = agreement['no'];             //协议编号
                    that.vSheet.agreementCompany = agreement['company'];     //协议单位
                });
                Core.Cache.remove('agreement');
            }
        },
        /**
         * 初始化始发网点
         */
        initFromShop: function () {
            var fromShop = Core.Cache.get('attributes') || {};
            this.vSheet.fromAreaId = fromShop['orgAreaId'];
            this.vSheet.fromShopName = fromShop['orgName'];

            var fromOrgArea = Core.Cache.get('fromOrgArea') || {};
            if ('name' in fromOrgArea) {
                this.vSheet.fromAreaId = fromOrgArea['areaId'];
                this.vSheet.fromShopName = fromOrgArea['name'];
                var fromOrgAreaHistory = Core.Cache.get('fromOrgAreaHistory') || [];
                if (fromOrgAreaHistory.length > 0) {
                    var flag = false;
                    $.each(fromOrgAreaHistory, function (i, v) {
                        if (v['name'] == fromOrgArea['name']) {
                            flag = true;
                            return false;
                        }
                    });
                    if (!flag) {
                        fromOrgAreaHistory.push(fromOrgArea);
                    }

                } else {
                    fromOrgAreaHistory.push(fromOrgArea);
                }
                Core.Cache.set('fromOrgAreaHistory', fromOrgAreaHistory);
            }

            var goodsName = Core.Cache.get("lastGoodsName") || "";
            this.vSheet.goodsName = goodsName;
            if (goodsName) {
                var goodsHistory = Core.Cache.get('goodsHistory') || [];
                if (goodsHistory.indexOf(goodsName) == -1) {
                    goodsHistory.push(goodsName);
                }
                Core.Cache.set('goodsHistory', goodsHistory);
            }
            //Core.Cache.remove('fromOrgArea');
        },
        clearFromCustomer: function () {
            Core.Cache.remove('fromCustomer');
            Core.Cache.remove('CodCard');
            this.vSheet.fromCustomerId = "";
            this.vSheet.fromCustomerName = "";
            // this.vSheet.fromCustomerPhone = "";
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
                    this.vSheet.fromCustomerMemberCardNo = fromCustomer['memberCardNo'];

                    //this.vSheet.memberCardNo= fromCustomer['memberCardNo'];
                    sheet.lastSearch = [];
                } else {
                    this.confirmCustomer(fromCustomer);
                }
            }
        },
        saveFromCustomer: function () {
            var fromCustomer = Core.Cache.get('fromCustomer') || "";
            if (!fromCustomer) {
                Core.Cache.set('fromCustomer', {
                    id: this.vSheet.fromCustomerId,
                    name: this.vSheet.fromCustomerName,
                    phone: this.vSheet.fromCustomerPhone,
                    address: this.vSheet.fromCustomerAddress,
                    bank: this.vSheet.fromCustomerBank,
                    account: this.vSheet.fromCustomerAccount,
                    holder: this.vSheet.fromCustomerHolder,
                    branchBank: this.vSheet.fromCustomerBranchBank
                });
            }
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
            var objectId = e.detail['code'];
            Core.Service.run('queryOrderById', {
                id: objectId
            }, function (data) {
                sheet.initPreOrder(JSON.parse(JSON.stringify(data)), false);
            });
        }
    };
    sheet.init();
    document.addEventListener('getQR', sheet.scanPre, false);
    window.Sheet = sheet;
    module.exports = sheet;
});
