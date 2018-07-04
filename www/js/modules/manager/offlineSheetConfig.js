define(function (require, exports, module) {
    "use strict";
    var $ = window.$;
    var _ = window._;
    var Base64 = window.Base64;
    var native = require('js/modules/hybridapi');
    var Core = require('js/modules/core/core');
    var Sheet = require('js/modules/model/sheet');
    var laytpl = require('js/modules/core/laytpl');
    var analytics = require('js/modules/core/analytics');

    var lxDb = Core.lxDb;
    var IDB = lxDb.getIDB(Core.Cache.get('companyNo'));
    var config = Core.Utils.getConfig();
    var loginName = Core.Cache.get("loginName");
    var feeInfo = "";
    var sheet = {
        vSheet: {},
        lastSearch: [],
        init: function () {
            var that = this;
            that.initConfig();
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
                .on('pageInit', '.page[data-page="findAgreement"]', function () {
                    var html = Core.Template.render('findAgreementTmpl', sheet.lastSearch);
                    $('#findAgreement .searchbar-found ul').html(html);
                })
                .on('pageInit', '.page[data-page="findFromCustomer"]', function () {
                    var html = Core.Template.render('findFromCustomerTmpl', sheet.lastSearch);
                    $('#findFromCustomer .searchbar-found ul').html(html);
                })
                .on('pageInit', '.page[data-page="findToCustomer"]', function () {
                    var html = Core.Template.render('findFromCustomerTmpl', sheet.lastSearch);
                    $('#findToCustomer .searchbar-found ul').html(html);
                })
                .on('pageInit', '.page[data-page="findToOrgArea"]', function () {
                    var html = Core.Template.render('toAreaTmpl', sheet.lastSearch);
                    $('#findToOrgArea .searchbar-found ul').html(html);
                })
                .on('pageInit', '.page[data-page="findFromShop"]', function () {
                    var html = Core.Template.render('findFromShopTmpl', sheet.lastSearch);
                    $('#findFromShop .searchbar-found ul').html(html);
                })
                .on('pageInit', '.page[data-page="findFromOrg"]', function () {
                    var html = Core.Template.render('findFromShopTmpl', sheet.lastSearch);
                    $('#findFromOrg .searchbar-found ul').html(html);
                }).on('pageInit', '.page[data-page="findPreSheet"]', function () {
                var phone = Core.Cache.get('searchPreUserPhone') || "";
                var userCode = Core.Cache.get('searchPreUserCode') || "";
                $("#searchPreUserPhone").val(phone);
                $("#searchPreUserCode").val(userCode);
            });


            $("body")
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
         * 初始化config配置
         */
        initConfig: function () {
            var options = "";
            $.each(config['customerBank'], function (i, v) {
                options += '<option value="' + v['value'] + '">' + v['label'] + '</option>';
            });
            $('#fromCustomerBank').append(options);
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
            if (type == "toArea") {
                val = $("#searchToInput").val() || name;
                if (!val) {
                    native.showToast("目的地最少输入一个字");
                    return false;
                }
                var toOrgAreaHistory = Core.Cache.get('toOrgAreaHistory') || [];
                if (toOrgAreaHistory.length > 0) {
                    $.each(toOrgAreaHistory, function (k, v) {
                        if (v['areaName'] == val || v['abbr'] === val || v['pinyin'] === val) {
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
                    IDB.region
                        .filter(function (region) {
                            var reg = new RegExp(val);
                            return reg.test(region.name) || reg.test(region.abbr) || reg.test(region.pinyin);
                        })
                        .toArray()
                        .then(function (result) {
                            if (result.length > 0) {
                                if (result.length == 1) {
                                    Core.Cache.set('toOrgArea', result[0]);
                                    that.initToOrgArea();
                                    if (needBack) {
                                        Core.Page.back();
                                    }
                                } else {
                                    var tmp = {
                                        toOrgAreas: result
                                    };
                                    var html = Core.Template.render('toAreaTmpl', tmp);
                                    $('#searchToArea .search-found').show().children().html(html);
                                }
                            } else {
                                that.vSheet.toAreaName = "";
                                native.showToast("<span class='color-red'>" + val + "</span>暂不支持到货");
                            }
                        }).catch(function (e) {
                        console.log(e);
                    });
                }
            }
        },
        editSheet: function (sheetObj, isEdit) {
            var that = this;
            sheetObj = sheetObj ? sheetObj : {};
            if (isEdit) {
                sheetObj.printCount = 1;
                that.initSheet(sheetObj, null, isEdit);
            } else {
                that.setSheetNoShort(function (no) {
                    that.initSheet(sheetObj, no, isEdit);
                });
            }

        },
        refreshSheetNo: function (sheetNoShort, cb) {
            var no = sheetNoShort.substr(6, sheetNoShort.length - 1);
            IDB.newSheetNos.delete(no).then(function () {
                if (cb && typeof cb === "function") {
                    cb();
                }
            });
        },
        setSheetNoShort: function (cb) {
            lxDb.grantSheetNoSegment(cb);
        },
        initSheet: function (sheetObj, sheetNoShort, isEdit) {
            if (sheetNoShort) {
                sheetObj['sheetNoShort'] = sheetNoShort;
            }
            var that = this;
            this.vSheet = new Vue({
                el: '#fastKpPage',
                data: Object.assign(Sheet.get(), sheetObj),
                watch: {
                    'agreementNo': function (val) {
                        if (!val || val == "") {
                            that.vSheet.agreementId = "";
                            that.vSheet.agreementNo = "";
                            that.vSheet.agreementCompany = "";
                        }
                    },
                    "fromCustomerCodCardNo": function (val) {
                        if (val) {
                            that.vSheet.fromCustomerMonthFee = "";
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
                    uploadSheet: function () {
                        lxDb.uploadSheet(function () {
                            that.getLocalSheets();
                        }, true);
                    },
                    refreshNo: function () {
                        that.refreshSheetNo(that.vSheet.sheetNoShort, function () {
                            that.setSheetNoShort(function (no) {
                                that.vSheet.sheetNoShort = no;
                                Core.App.alert("换号成功");
                            })
                        });
                    },
                    edit: function (item) {
                        var sheetObj = Sheet.get();
                        Core.Cache.set("lastEditSheetNoShort", item['sheetNoShort']);
                        item.isEdit = true;
                        that.vSheet.$data = Object.assign(sheetObj, JSON.parse(JSON.stringify(item)));
                        $("#tab2 input").removeAttr("disabled");
                        $("#tab2 select").removeAttr("disabled");
                        that.getLocalSheets();
                    },
                    remove: function (item) {
                        Core.App.confirm("确认删除该运单？", function () {
                            IDB.sheet.delete(item['sheetNoShort']).then(function () {
                                native.showToast('删除成功');
                                that.vSheet.localSheets.$remove(item);
                            })
                        })
                    },
                    showSearchPage: function (url, name) {
                        if (name) {
                            Core.Cache.set('searchName', that.vSheet[name]);
                        }
                        Core.Page.changePage(url);
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
                     * 查询月结编号
                     * @param value
                     * @returns {boolean}
                     */
                    searchAgreement: function (value) {
                        if (!value) {
                            native.showToast("月结编号/名称不能为空");
                            return false;
                        }
                        that.vSheet.agreementId = "";             //协议id
                        that.vSheet.agreementNo = value;          //协议编号
                        that.vSheet.agreementCompany = "";     //协议单位

                        IDB.transaction('r', IDB.agreement, function () {
                            IDB.agreement
                                .where('delFlag')
                                .equals(0)
                                .filter(function (agreement) {
                                    return (new RegExp(value)).test(agreement.no) || (new RegExp(value)).test(agreement.company);
                                })
                                .toArray()
                                .then(function (result) {
                                    if (result.length > 0) {
                                        if (result.length == 1) {
                                            Core.Cache.set('agreement', result[0]);
                                            that.setAgreement();
                                        } else {
                                            sheet.lastSearch = {
                                                agreements: result
                                            };
                                            Core.Page.changePage("findAgreement.html");
                                        }
                                    } else {
                                        native.showToast('未找到月结单位');
                                        if (Core.App.mainView.activePage.name == 'findAgreement') {
                                            Core.Page.back();
                                        }
                                    }
                                });
                        }).catch(function (e) {
                            console.log(e);
                        });
                    },
                    /**
                     * 查询客户
                     * @param text
                     * @param key
                     * @param value
                     * @param remote 远程查找
                     * @returns {boolean}
                     */
                    searchFromCustomer: _.throttle(function (text, key, value, remote) {
                        if (!value) {
                            native.showToast(text + "最少输入一个字");
                            return false;
                        }
                        that.clearFromCustomer();
                        if (remote) {
                            var tmp = {};
                            tmp[key] = value;
                            tmp.areaId = that.vSheet.fromAreaId || "";
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
                        } else {
                            IDB.customer
                                .filter(function (customer) {
                                    return customer.phone === value || (new RegExp(value)).test(customer.name);
                                })
                                //.where(key).equals(value)
                                .toArray()
                                .then(function (result) {
                                    if (result.length > 0) {
                                        if (result.length == 1) {
                                            var user = result[0];
                                            Core.Cache.set('fromCustomer', user);
                                            that.initFromCustomer();
                                        } else {
                                            sheet.lastSearch = {
                                                toOrgAreas: result
                                            };
                                            Core.Page.changePage("findFromCustomer.html");
                                        }
                                    } else {
                                        //本地查询不到 检测网络 联网查询
                                        native.getConnectionInfo(function (type) {
                                            if (type !== "none") {
                                                var tmp = {};
                                                tmp[key] = value;
                                                tmp.areaId = that.vSheet.fromAreaId || "";
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
                                            } else {
                                                native.showToast('未找到发货客户');
                                                if (Core.App.mainView.activePage.name == 'findFromCustomer') {
                                                    Core.Page.back();
                                                }
                                            }
                                        });
                                    }
                                });
                        }
                    }, 100),
                    searchToCustomer: _.throttle(function (text, key, value, remote) {
                        if (!value) {
                            native.showToast(text + "最少输入一个字");
                            return false;
                        }
                        if (remote) {
                            var tmp = {};
                            tmp[key] = value;
                            tmp.areaId = that.vSheet.fromAreaId || "";
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
                        } else {
                            IDB.customer
                                .filter(function (customer) {
                                    return (new RegExp(value)).test(customer.phone) || (new RegExp(value)).test(customer.name);
                                })
                                .toArray()
                                .then(function (result) {
                                    if (result.length > 0) {
                                        if (result.length == 1) {
                                            var user = result[0];
                                            Core.Cache.set('toCustomer', user);
                                            that.initToCustomer();
                                        } else {
                                            sheet.lastSearch = {
                                                toOrgAreas: result
                                            };
                                            Core.Page.changePage("findToCustomer.html");
                                        }
                                    } else {
                                        native.getConnectionInfo(function (type) {
                                            if (type !== "none") {
                                                var tmp = {};
                                                tmp[key] = value;
                                                tmp.areaId = that.vSheet.fromAreaId || "";
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
                                            } else {
                                                native.showToast('未找到收货客户');
                                                if (Core.App.mainView.activePage.name == 'findToCustomer') {
                                                    Core.Page.back();
                                                }
                                            }
                                        });
                                    }
                                });
                        }
                    }, 100),
                    submit: function ($validate) {
                        analytics.onClickEvent(0x3030001)
                        if ($validate.valid) {
                            if(that.vSheet.goodsWeight !== "" && that.vSheet.goodsWeight <= 0){
                                native.showToast("请输入正确的货物重量");
                                return false;
                            }
                            if(that.vSheet.goodsVolume !== "" && that.vSheet.goodsVolume <= 0){
                                native.showToast("请输入正确的货物体积");
                                return false;
                            }

                            that.saveSheet();
                        } else {
                            native.showToast($validate.errors.pop()['message']);
                        }
                    },
                    update: function ($validate, flag) {
                        if ($validate.valid) {
                            // if(that.vSheet.goodsWeight !== "" && that.vSheet.goodsWeight <= 0){
                            //     native.showToast("请输入正确的货物重量");
                            //     return false;
                            // }
                            // if(that.vSheet.goodsVolume !== "" && that.vSheet.goodsVolume <= 0){
                            //     native.showToast("请输入正确的货物体积");
                            //     return false;
                            // }
                            that.updateSheet(flag);
                        } else {
                            native.showToast($validate.errors[0]['message']);
                        }
                    },
                    trialPremium: function () {
                        if (!that.vSheet.declaredValue || that.vSheet.declaredValue < 1) {
                            native.showToast("请输入正确的声明价值");
                            return false;
                        }
                        that.getFees({
                            "declaredValue": that.vSheet.declaredValue,
                            "defaultPremiumMode": that.vSheet.defaultPremiumMode,
                            "fromCustomerPhone": that.vSheet.fromCustomerPhone,
                            "toCustomerPhone": that.vSheet.toCustomerPhone,
                            "agreementNo": that.vSheet.agreementNo,
                            "fromShopName": that.vSheet.fromShopName,
                            "toRegionName": that.vSheet.toRegionName,
                            "requirement": that.vSheet.requirement
                        }, function (fees) {
                            Core.App.alert("保费:" + fees['premium'], '试算结果');
                        });
                        /* Core.Service.get('api/auth/v1/ltl/sheet/trialPremium', {
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
                         });*/
                    },
                    crateNew: function () {
                        that.createNew();
                    },
                    print: function (mod, template, sheet) {
                        native.getBluetoothInfo(function (lists) {
                            if (lists.length > 0) {
                                that.print(mod, template, sheet);
                            } else {
                                Core.App.alert("请打开蓝牙");
                            }
                        });
                    },
                    printList: function () {
                        native.getBluetoothInfo(function (lists) {
                            if (lists.length > 0) {
                                that.printList();
                            } else {
                                Core.App.alert("请打开蓝牙");
                            }
                        });
                    }
                }
            });
            if (!isEdit) {
                that.initToOrgArea();
                that.initFromShop();
                that.initFromCustomer(true);
            }
            that.getLocalSheets();
            IDB.sheet.hook('deleting', function () {
                console.log('deleting');
                that.getLocalSheets();
            });
        },
        createNew: function () {
            var that = this;
            feeInfo = "";
            that.setSheetNoShort(function (no) {
                that.vSheet.$data = Sheet.get();
                that.vSheet.sheetNoShort = no;
                $("#tab2 input").removeAttr("disabled");
                $("#tab2 select").removeAttr("disabled");
                Core.Cache.remove('toOrgArea');
                Core.Cache.remove('toCustomer');
                that.initToOrgArea();
                that.initFromShop();
                that.getLocalSheets();
                Core.App.confirm("是否保存发货客户信息", function () {
                    //debugger;
                    that.initFromCustomer(true);
                }, function () {
                    Core.Cache.remove('fromCustomer');
                    that.initFromCustomer(true);
                });
                $('.page-content').scrollTop(0);
            });
        },
        getLocalSheets: _.throttle(function () {
            var that = this;
            IDB.sheet
                .reverse()
                .toArray()
                .then(function (sheets) {
                    that.vSheet.localSheets = sheets;
                });
        }, 100),
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
            IDB.transaction('rw', IDB.sheet, function () {
                IDB.sheet.update(sheetView['sheetNoShort'], sheetView);
            }).catch(function (e) {
                console.log(e);
            })
        },
        print: _.throttle(function (mod, template, sheet) {
            var that = this;
            Core.Utils.getBlueToothSetting(function (print) {
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
                        analytics.onClickEvent(0x3030012);
                        that.renderPrintLabel(deviceType, sheetView, false, function (printObj) {
                            native.printList(print['address'], deviceType, [printObj]);
                        })
                    } else if (mod == "WaybillBh" && configName == Core.SheetTemplate[3]) {
                        analytics.onClickEvent(0x3030013);
                        var backSheetAmount = sheetView['backSheetAmount'] || 0;
                        if (backSheetAmount == 0) {
                            native.showToast('没有回单');
                            return false;
                        }
                        that.renderPrintBack(deviceType, sheetView, function (printObj) {
                            native.printList(print['address'], deviceType, [printObj]);
                        });
                    } else {
                        analytics.onClickEvent(0x3030011);
                        that.renderPrintWaybill(deviceType, sheetView, function (printObj) {
                            var printList = [];
                            printList.push(printObj);

                            native.printList(print['address'], deviceType, printList, function () {
                                that.addPrintCount(sheetView);
                            });

                            // if (sheetView['backSheetAmount'] > 0) {
                            //     that.renderPrintBack(deviceType, sheetView, function (backObj) {
                            //         printList.push(backObj);
                            //         native.printList(print['address'], deviceType, printList, function () {
                            //             that.addPrintCount(sheetView);
                            //         });
                            //     });
                            // } else {
                            //
                            // }
                        });
                    }
                }
            });
        }, 500),
        printList: _.throttle(function () {
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
        }, 500),
        buildSendSheet: function () {
            var tmp = {};
            $.each(this.vSheet.$data, function (i, v) {
                if (!(i == "template" || i == "activity" || i == "sheet" ||
                    i == "memberCardNo" || i == "activity" || i == "localSheets" ||
                    i == "prePhone" || i == "toOrgAreas" || i == "isChange" ||
                    i == "printCount" || i == "showCreate")) {
                    tmp[i] = v == null ? "" : v;
                }
            });

            var attributes = Core.Cache.get("attributes");

            tmp['companyName'] = Core.Cache.get('companyName');
            tmp['companyNo'] = Core.Cache.get('companyNo');
            tmp['sheetCreateDate'] = (new Date()).Format('yyyy-MM-dd hh:mm:ss');

            tmp['sheetNo'] = Core.Cache.get("sheetPre") + this.vSheet.sheetNoShort;
            tmp['printSheetNo'] = this.vSheet.sheetNoShort;
            tmp['printSheetNoAbbr'] = this.vSheet.sheetNoShort.substring(6, this.vSheet.sheetNoShort.length) || '';
            tmp['printSheetNoYmd'] = this.vSheet.sheetNoShort.substring(0 ,6) || '';
            tmp['salesmanName'] = attributes['name'];
            tmp["salesmanPhone"] = attributes['mobile'] || attributes['phone'];
            tmp['customerServicePhone'] = attributes['customerServicePhone'];

            tmp["fromProvinceName"] = attributes['provinceName'];
            tmp["fromCityName"] = attributes['cityName'];
            tmp["fromAreaName"] = attributes['areaName'];
            tmp['deliveryModeDesc'] = tmp['deliveryMode'] == 1 ? "自提" : "送货";

            var batchNo = Core.Cache.get('Batch_Fast') || guid();
            Core.Cache.set('Batch_Fast', batchNo);
            tmp.tid = batchNo;
            tmp.salesmanId = Core.Cache.get("userId");
            tmp.state = 0; // 0 :待上传 2:上传生成成功 3:上传成功生成失败 4:余额不足
            tmp.message = "";
            //tmp.message = "编号[80223],名称[业务员-龙哥],结余[-1197],信用额度[1000],余额不足无法操作,请联系相关部门";
            return tmp;
        },
        /**
         * 检测运单合法性
         * @param sheetView
         * @param cb {function}
         * @returns {boolean}
         */
        checkSheet: function (sheetView, cb) {
            var that = this;
            IDB.org.where('id').equals(sheetView['toShopId']).first().then(function (org) {
                if (!org) {
                    native.showToast(sheetView['toShopName'] + "不支持到货");
                    return false;
                }

                sheetView['toShopPhone'] = org['phone'];
                sheetView['nowPayFee'] = sheetView['nowPayFee'] * 1;
                sheetView['fromCustomerMonthFee'] = sheetView['fromCustomerMonthFee'] * 1;
                sheetView['backPayFee'] = sheetView['backPayFee'] * 1;
                sheetView['codPayFee'] = sheetView['codPayFee'] * 1;
                sheetView['pickPayFee'] = sheetView['pickPayFee'] * 1;
                sheetView['toCustomerMonthFee'] = sheetView['toCustomerMonthFee'] * 1;
                sheetView['cod'] = sheetView['cod'] * 1;

                //发货方附加费用>0,必填主费用(工本费系统自动计算,不能作为判断依据)
                if (!(sheetView['nowPayFee'] || sheetView['pickPayFee'] || sheetView['fromCustomerMonthFee'] || sheetView['toCustomerMonthFee'] || sheetView['backPayFee'] || sheetView['codPayFee'])) {
                    native.showToast("现付、提付、发货月结、收货月结、回单付和货款扣不允许都为0,至少必填一项");
                    return false;
                }
                //提货方附件费用>0,必填主费用(工本费系统自动计算,不能作为判断依据)
                // if (!(sheetView['pickPayFee'] || sheetView['toCustomerMonthFee'])) {
                //     native.showToast("提付和提货月结不允许都为0,至少必填一项");
                //     return false;
                // }
                //如果存在发货月结或提货月结或垫付未返,必须有月结编号(仅仅需要校验月结编号的网点或者业务区)
                if (sheetView['fromCustomerMonthFee'] || sheetView['toCustomerMonthFee'] || (2 == sheetView['payOutFeeSettleMode']) && sheetView['payOutFee']) {
                    //存在发货月结或者提货月结
                    if (!sheetView['agreementNo']) {
                        native.showToast("发货、提货月结或垫付未返,月结编号必填");
                        return false;
                    }
                }

                //如果要求送货必填送货地址
                var deliveryAddressRequired = Core.Utils.getConfig('deliveryAddressRequired') || false;
                if(deliveryAddressRequired && (2 == sheetView['deliveryMode'])){
                    if(!sheetView['toCustomerAddress']){
                        native.showToast("送货请填写送货地址");
                        return false;
                    }
                }

                //如果存在货款扣,必须有代收货款且代收货款大于货款扣
                if (sheetView['codPayFee'] && (sheetView['cod'] < sheetView['codPayFee'])) {
                    native.showToast("代收货款必须大于货款扣金额");
                    return false;
                }


                if (sheetView['rebates'] > 0 || sheetView['payOutFee'] > 0) {
                    if (sheetView['nowPayFee'] + sheetView['fromCustomerMonthFee'] + sheetView['backPayFee'] +
                        sheetView['codPayFee'] + sheetView['pickPayFee'] + sheetView['toCustomerMonthFee']
                        - sheetView['rebates'] - sheetView['payOutFee'] < 0) {
                        native.showToast("劳务费、垫付不允许大于开单主运费");
                        return false;
                    }
                }

                //计算货款手续费
                that.getFees(sheetView, function (fees) {
                    console.log(fees);
                    sheetView['codFee'] = fees['codFee'];
                    sheetView['premium'] = fees['premium'];
                    sheetView['documentFee'] = fees['documentFee'];
                    cb(sheetView);
                });
            });
        },
        /**
         *
         * @param rules  规则
         * @param num    值
         * @param requirement 特殊需求
         * @returns {number}
         */
        calculateFee: function (rules, num, requirement) {
            //round  舍入模式（1-四舍五入，2-向上取整，3-向下取整）
            var BILLING_MODE_RANGE = "1";         //计费方式-区间
            var BILLING_MODE_RATE = "2";          //计费方式-费率
            var BILLING_MODE_FIXED_VALUE = "3";   //计费方式-固定值
            var fee = 0;
            if (rules.length == 0) {
                return fee;
            }
            var rule;
            if (rules.length == 1) {
                rule = rules[0];
            } else {
                rule = rules.reduce(function (a, b) {
                    return a['priority'] > b['priority'] ? b : a;
                });
            }
            var billingTemplate = {};
            if (rule['billingTemplate'] && rule['billingTemplate'].startsWith('{')) {
                billingTemplate = JSON.parse(rule['billingTemplate']);
            }
            var basic = billingTemplate['basic'] || [];
            var requirementRule = billingTemplate ? (billingTemplate['requirement'] || []) : [];
            num = num * 1;
            basic.map(function (rule) {
                switch (rule['billingMode']) {
                    case BILLING_MODE_RANGE:
                        if (num >= rule['stepBegin'] * 1 && num <= rule['stepEnd']) {
                            fee = rule['value'] * 1;
                        }
                        break;
                    case BILLING_MODE_RATE:
                        if (num >= rule['stepBegin'] * 1 && num <= rule['stepEnd']) {
                            fee = num * parseFloat(rule['value']);
                            fee = fee > rule['feeMax'] * 1 ? rule['feeMax'] * 1 : (fee < rule['feeMin'] * 1 ? rule['feeMin'] * 1 : fee);
                        }
                        break;
                    case BILLING_MODE_FIXED_VALUE:
                        fee = rule['value'] * 1;
                        break;
                }
            });

            if (requirementRule && requirement) {
                requirementRule.map(function (rule) {
                    if (rule['requirement'] == requirement) {
                        fee = fee * parseFloat(rule['rate']);
                    }
                })
            }
            switch (rule['round']) {
                case 2:
                    fee = Math.ceil(fee);
                    break;
                case 3:
                    fee = Math.floor(fee);
                    break;
                case 1:
                default:
                    fee = Math.round(fee);
                    break;
            }
            return fee;
        },
        /**
         * 保费计算
         * @param sheetView
         * @param cb
         */
        getFees: function (sheetView, cb) {
            var that = this;
            var fees = {
                codFee: 0,
                premium: sheetView['premium'] ? sheetView['premium'] * 1 : 0,
                documentFee: 0
            };
            IDB.feeRule.where("delFlag").equals(0).toArray().then(function (feeRules) {
                if (feeRules.length > 0) {
                    var codRules = [], premiumRules = [], documentFeeRules = [];

                    var FEE_TYPE_COD_FEE = 1;           //手续费类型-代收货款手续费
                    var FEE_TYPE_PREMIUM = 2;           //手续费类型-保费
                    var FEE_TYPE_DOCUMENT_FEE = 3;      //手续费类型-工本费

                    var RULE_TYPE_CUSTOMER = 1;         //规则类型-客户
                    var RULE_TYPE_AGREEMENT = 2;        //规则类型-月结单位
                    var RULE_TYPE_SHOP = 3;             //规则类型-收发网点
                    var RULE_TYPE_ORG = 4;              //规则类型-月结单位

                    //格式化费用规则
                    feeRules.map(function (rule) {
                        switch (rule['ruleType']) {
                            case RULE_TYPE_AGREEMENT:
                                if (rule['agreementNo'] == sheetView['agreementNo']) {
                                    switch (rule['feeType']) {
                                        case FEE_TYPE_COD_FEE:
                                            codRules.push(rule);
                                            break;
                                        case FEE_TYPE_PREMIUM:
                                            premiumRules.push(rule);
                                            break;
                                        case FEE_TYPE_DOCUMENT_FEE:
                                            documentFeeRules.push(rule);
                                            break;
                                    }
                                }
                                break;
                            case RULE_TYPE_CUSTOMER:
                                if (rule['customerPhone'] == sheetView['fromCustomerPhone'] || rule['customerPhone'] == sheetView['toCustomerPhone']) {
                                    switch (rule['feeType']) {
                                        case FEE_TYPE_COD_FEE:
                                            codRules.push(rule);
                                            break;
                                        case FEE_TYPE_PREMIUM:
                                            premiumRules.push(rule);
                                            break;
                                        case FEE_TYPE_DOCUMENT_FEE:
                                            documentFeeRules.push(rule);
                                            break;
                                    }
                                }
                                break;
                            case RULE_TYPE_SHOP:
                                if ((rule['fromShopId'] == sheetView['fromShopId'] && rule['toShopId'] == sheetView['toShopId']) || (rule['fromShopId'] == -1 && rule['toShopId'] == -1)) {
                                    switch (rule['feeType']) {
                                        case FEE_TYPE_COD_FEE:
                                            codRules.push(rule);
                                            break;
                                        case FEE_TYPE_PREMIUM:
                                            premiumRules.push(rule);
                                            break;
                                        case FEE_TYPE_DOCUMENT_FEE:
                                            documentFeeRules.push(rule);
                                            break;
                                    }
                                }
                                break;
                            case RULE_TYPE_ORG:
                                if (rule['toOrgName'] == sheetView['toOrgName']) {
                                    switch (rule['feeType']) {
                                        case FEE_TYPE_COD_FEE:
                                            codRules.push(rule);
                                            break;
                                        case FEE_TYPE_PREMIUM:
                                            premiumRules.push(rule);
                                            break;
                                        case FEE_TYPE_DOCUMENT_FEE:
                                            documentFeeRules.push(rule);
                                            break;
                                    }
                                }
                                break;
                        }
                    });

                    if (sheetView['cod']) {
                        fees.codFee = that.calculateFee(codRules, sheetView['cod'], sheetView['requirement']);
                    }
                    if (sheetView['declaredValue'] && sheetView['defaultPremiumMode'] == 1) {
                        fees.premium = that.calculateFee(premiumRules, sheetView['declaredValue'], sheetView['requirement']);
                    }
                    fees.documentFee = that.calculateFee(documentFeeRules, 1, sheetView['requirement']);
                }
                cb(fees);
            });
        },
        wrapSheet: function (sheet, isSysPerformanceContainsPremium, printPrimaryFeeMode) {
            var getVal = function (fee) {
                return (fee == undefined || fee == null || fee == "") ? 0 : parseFloat(fee).toFixed(2) * 1;
            };
            sheet.nowPayFee = getVal(sheet.nowPayFee);
            sheet.pickPayFee = getVal(sheet.pickPayFee);
            sheet.fromCustomerMonthFee = getVal(sheet.fromCustomerMonthFee);
            sheet.toCustomerMonthFee = getVal(sheet.toCustomerMonthFee);
            sheet.backPayFee = getVal(sheet.backPayFee);
            sheet.codPayFee = getVal(sheet.codPayFee);

            sheet.fromPremium = getVal(sheet.fromPremium);
            sheet.fromBackSheetFee = getVal(sheet.fromBackSheetFee);
            sheet.fromOtherFee = getVal(sheet.fromOtherFee);
            sheet.fromReceiptFee = getVal(sheet.fromReceiptFee);
            sheet.fromDeliveryFee = getVal(sheet.fromDeliveryFee);
            sheet.fromDocumentFee = getVal(sheet.fromDocumentFee);
            sheet.toPremium = getVal(sheet.toPremium);
            sheet.toBackSheetFee = getVal(sheet.toBackSheetFee);
            sheet.toOtherFee = getVal(sheet.toOtherFee);
            sheet.toReceiptFee = getVal(sheet.toReceiptFee);
            sheet.toDeliveryFee = getVal(sheet.toDeliveryFee);
            sheet.toDocumentFee = getVal(sheet.toDocumentFee);
            //规则判断(优先级):现付>提付>发货月结>提货月结>回单付>货款扣
            if (sheet.nowPayFee > 0) {
                sheet.fromPremium = getVal(sheet.premium);
                sheet.fromBackSheetFee = getVal(sheet.backSheetFee);
                sheet.fromOtherFee = getVal(sheet.otherFee);
                sheet.fromReceiptFee = getVal(sheet.receiptFee);
                sheet.fromDeliveryFee = getVal(sheet.deliveryFee);
                sheet.fromDocumentFee = getVal(sheet.documentFee);
            } else if (sheet.pickPayFee > 0) {
                sheet.toPremium = getVal(sheet.premium);
                sheet.toBackSheetFee = getVal(sheet.backSheetFee);
                sheet.toOtherFee = getVal(sheet.otherFee);
                sheet.toReceiptFee = getVal(sheet.receiptFee);
                sheet.toDeliveryFee = getVal(sheet.deliveryFee);
                sheet.toDocumentFee = getVal(sheet.documentFee);
            } else if (sheet.fromCustomerMonthFee > 0) {
                sheet.fromPremium = getVal(sheet.premium);
                sheet.fromBackSheetFee = getVal(sheet.backSheetFee);
                sheet.fromOtherFee = getVal(sheet.otherFee);
                sheet.fromReceiptFee = getVal(sheet.receiptFee);
                sheet.fromDeliveryFee = getVal(sheet.deliveryFee);
                sheet.fromDocumentFee = getVal(sheet.documentFee);
            } else if (sheet.toCustomerMonthFee > 0) {
                sheet.toPremium = getVal(sheet.premium);
                sheet.toBackSheetFee = getVal(sheet.backSheetFee);
                sheet.toOtherFee = getVal(sheet.otherFee);
                sheet.toReceiptFee = getVal(sheet.receiptFee);
                sheet.toDeliveryFee = getVal(sheet.deliveryFee);
                sheet.toDocumentFee = getVal(sheet.documentFee);
            } else {
                //回单付 货款扣 其他
                sheet.fromPremium = getVal(sheet.premium);
                sheet.fromBackSheetFee = getVal(sheet.backSheetFee);
                sheet.fromOtherFee = getVal(sheet.otherFee);
                sheet.fromReceiptFee = getVal(sheet.receiptFee);
                sheet.fromDeliveryFee = getVal(sheet.deliveryFee);
                sheet.fromDocumentFee = getVal(sheet.documentFee);
            }

            if (sheet['codFeeMode'] == 1) {
                sheet.toCodFee = 0;
            } else {
                sheet.toCodFee = sheet.codFee;
                sheet.codFee = 0;
            }


            sheet.payOutFee = getVal(sheet.payOutFee);
            sheet.transferFee = getVal(sheet.transferFee);
            sheet.rebates = getVal(sheet.rebates);
            sheet.codPayTotalFee = getVal(sheet.codPayFee);

            sheet.primaryFee = sheet.nowPayFee + sheet.pickPayFee + sheet.fromCustomerMonthFee + sheet.toCustomerMonthFee + sheet.backPayFee + sheet.codPayFee;
            sheet.fromSecondaryFee = sheet.fromPremium + sheet.fromBackSheetFee + sheet.fromDocumentFee + sheet.fromOtherFee + sheet.fromReceiptFee + sheet.fromDeliveryFee;
            sheet.toSecondaryFee = sheet.toPremium + sheet.toBackSheetFee + sheet.toDocumentFee + sheet.toOtherFee + sheet.toReceiptFee + sheet.toDeliveryFee + sheet.toCodFee;
            sheet.receiptDeliveryFee = sheet.fromReceiptFee + sheet.fromDeliveryFee + sheet.toReceiptFee + sheet.toDeliveryFee;
            // sheet.premium = sheet.fromPremium + sheet.toPremium;
            sheet.backSheetFee = sheet.fromBackSheetFee + sheet.toBackSheetFee;
            // sheet.documentFee = sheet.fromDocumentFee + sheet.toDocumentFee;
            sheet.otherFee = sheet.fromOtherFee + sheet.toOtherFee;
            sheet.receiptFee = sheet.fromReceiptFee + sheet.toReceiptFee;
            sheet.deliveryFee = sheet.fromDeliveryFee + sheet.toDeliveryFee;

            sheet.isPerformanceContainsPremium = isSysPerformanceContainsPremium == undefined ? 1 : isSysPerformanceContainsPremium;

            /*寄方费用*/
            if (sheet.nowPayFee > 0) {
                sheet.nowTotalFee = sheet.nowPayFee + sheet.fromSecondaryFee;
            } else if ((sheet.fromCustomerMonthFee + sheet.backPayFee + sheet.codPayFee) > 0) {
                sheet.nowTotalFee = 0;
            } else {
                sheet.nowTotalFee = sheet.fromSecondaryFee;
            }

            if (sheet.fromCustomerMonthFee > 0) {
                sheet.fromCustomerMonthTotalFee = sheet.fromCustomerMonthFee + (sheet.nowPayFee > 0 ? 0 : sheet.fromSecondaryFee);
            } else {
                sheet.fromCustomerMonthTotalFee = 0;
            }

            if (sheet.backPayFee > 0) {
                sheet.backTotalFee = sheet.backPayFee + ((sheet.nowPayFee + sheet.fromCustomerMonthFee) > 0 ? 0 : sheet.fromSecondaryFee);
            } else {
                sheet.backTotalFee = 0;
            }

            if (sheet.codPayTotalFee > 0) {
                sheet.codPayTotalFee = sheet.codPayTotalFee + ((sheet.nowPayFee + sheet.fromCustomerMonthFee + sheet.backPayFee) > 0 ? 0 : sheet.fromSecondaryFee);
            } else {
                sheet.codPayTotalFee = 0;
            }
            /*到方费用*/
            if (sheet.pickPayFee > 0) {
                sheet.pickTotalFee = sheet.pickPayFee + sheet.toSecondaryFee;
            } else if (sheet.toCustomerMonthFee > 0) {
                sheet.pickTotalFee = 0;
            } else {
                sheet.pickTotalFee = sheet.toCustomerMonthFee;
            }

            if (sheet.toCustomerMonthFee > 0) {
                sheet.toCustomerMonthTotalFee = sheet.toCustomerMonthFee + (sheet.pickPayFee > 0 ? 0 : sheet.toSecondaryFee);
            } else {
                sheet.toCustomerMonthTotalFee = 0;
            }
            /*其他费用*/
            sheet.totalFee = sheet.primaryFee + sheet.fromSecondaryFee + sheet.toSecondaryFee;
            sheet.performance = sheet.totalFee - (sheet.rebates + sheet.payOutFee + sheet.transferFee);
            sheet.netFee = sheet.totalFee - (sheet.receiptDeliveryFee + sheet.rebates + sheet.payOutFee);
            if (sheet.codPayFee > 0) {
                sheet.codSettle = sheet.codPayFee + ((sheet.nowPayFee + sheet.fromCustomerMonthFee + sheet.backPayFee) > 0 ? 0 : sheet.fromSecondaryFee);
            } else {
                sheet.codSettle = 0;
            }

            sheet.salesmanPerformance = sheet.primaryFee + sheet.premium + sheet.backSheetFee + sheet.documentFee - (sheet.rebates + sheet.payOutFee + sheet.transferFee);
            sheet.transferFeeSettle = 0;

            if (sheet.pickPayFee > 0) {
                sheet.pickTotalFee = sheet.pickPayFee + sheet.toSecondaryFee;
            } else if (sheet.toCustomerMonthFee > 0) {
                sheet.pickTotalFee = 0;
            } else {
                sheet.pickTotalFee = sheet.toSecondaryFee;
            }


            sheet['primaryFeeSummaryInfo'] = "";
            sheet['secondaryFeeSummaryInfo'] = "";
            sheet['receiptFromCustomerFeeInfo'] = "";
            sheet['receiptToCustomerFeeInfo'] = "";

            printPrimaryFeeMode = printPrimaryFeeMode == undefined ? 1 : printPrimaryFeeMode;
            if (printPrimaryFeeMode == 1) {
                sheet['primaryFeeSummaryInfo'] += sheet['nowPayFee'] ? "现付:" + sheet['nowPayFee'] : "";
                sheet['primaryFeeSummaryInfo'] += sheet['fromCustomerMonthFee'] ? "发货月结:" + sheet['fromCustomerMonthFee'] : "";
                sheet['primaryFeeSummaryInfo'] += sheet['backPayFee'] ? "回单付:" + sheet['backPayFee'] : "";
                sheet['primaryFeeSummaryInfo'] += sheet['codPayFee'] ? "货款扣:" + sheet['codPayFee'] : "";
                if (sheet['fromReceiptFee'] || sheet['fromDeliveryFee'] || sheet['fromBackSheetFee'] || sheet['fromDocumentFee'] || sheet['fromOtherFee']) {
                    sheet['primaryFeeSummaryInfo'] += "寄付[";
                    sheet['primaryFeeSummaryInfo'] += sheet['fromReceiptFee'] ? "接货费:" + sheet['fromReceiptFee'] : "";
                    sheet['primaryFeeSummaryInfo'] += sheet['fromDeliveryFee'] ? "送货费:" + sheet['fromDeliveryFee'] : "";
                    sheet['primaryFeeSummaryInfo'] += sheet['fromBackSheetFee'] ? "回单费:" + sheet['fromBackSheetFee'] : "";
                    sheet['primaryFeeSummaryInfo'] += sheet['fromDocumentFee'] ? "工本费:" + sheet['fromDocumentFee'] : "";
                    sheet['primaryFeeSummaryInfo'] += sheet['fromOtherFee'] ? "服务费:" + sheet['fromOtherFee'] : "";
                    sheet['primaryFeeSummaryInfo'] += "]";
                }
                sheet['primaryFeeSummaryInfo'] += sheet['pickPayFee'] ? "提付:" + sheet['pickPayFee'] : "";
                sheet['primaryFeeSummaryInfo'] += sheet['toCustomerMonthFee'] ? "提货月结:" + sheet['toCustomerMonthFee'] : "";
                if (sheet['toReceiptFee'] || sheet['toDeliveryFee'] || sheet['toBackSheetFee'] || sheet['toDocumentFee'] || sheet['toCodFee'] || sheet['toOtherFee']) {
                    sheet['primaryFeeSummaryInfo'] += "到付[";
                    sheet['primaryFeeSummaryInfo'] += sheet['toReceiptFee'] ? "接货费:" + sheet['toReceiptFee'] : "";
                    sheet['primaryFeeSummaryInfo'] += sheet['toDeliveryFee'] ? "送货费:" + sheet['toDeliveryFee'] : "";
                    sheet['primaryFeeSummaryInfo'] += sheet['toBackSheetFee'] ? "回单费:" + sheet['toBackSheetFee'] : "";
                    sheet['primaryFeeSummaryInfo'] += sheet['toDocumentFee'] ? "工本费:" + sheet['toDocumentFee'] : "";
                    sheet['primaryFeeSummaryInfo'] += sheet['toOtherFee'] ? "服务费:" + sheet['toOtherFee'] : "";
                    sheet['primaryFeeSummaryInfo'] += sheet['toCodFee'] ? "货款手续费:" + sheet['toCodFee'] : "";
                    sheet['primaryFeeSummaryInfo'] += "]";
                }
            } else {
                sheet['primaryFeeSummaryInfo'] += sheet['nowTotalFee'] ? "总现付:" + sheet['nowTotalFee'] : "";
                sheet['primaryFeeSummaryInfo'] += sheet['fromCustomerMonthTotalFee'] ? "总发货月结:" + sheet['fromCustomerMonthTotalFee'] : "";
                sheet['primaryFeeSummaryInfo'] += sheet['backTotalFee'] ? "总回单付:" + sheet['backTotalFee'] : "";
                sheet['primaryFeeSummaryInfo'] += sheet['codPayTotalFee'] ? "总货款扣:" + sheet['codPayTotalFee'] : "";
                sheet['primaryFeeSummaryInfo'] += sheet['pickTotalFee'] ? "总提付:" + sheet['pickTotalFee'] : "";
                sheet['primaryFeeSummaryInfo'] += sheet['toCustomerMonthTotalFee'] ? "总提货月结:" + sheet['toCustomerMonthTotalFee'] : "";
            }

            sheet['secondaryFeeSummaryInfo'] += sheet['declaredValue'] ? "价值:" + sheet['declaredValue'] : "";
            sheet['secondaryFeeSummaryInfo'] += sheet['premium'] ? "保费:" + sheet['premium'] : "";
            sheet['secondaryFeeSummaryInfo'] += sheet['payOutFee'] ? "垫付:" + sheet['payOutFee'] + (sheet['payOutFeeSettleMode'] == 1 ? "现返" : "未返" ) : "";

            sheet['receiptFromCustomerFeeInfo'] += sheet['nowTotalFee'] ? "寄付:" + sheet['nowTotalFee'] : "";
            sheet['receiptFromCustomerFeeInfo'] += sheet['fromCustomerMonthTotalFee'] ? "寄月结:" + sheet['fromCustomerMonthTotalFee'] : "";
            sheet['receiptFromCustomerFeeInfo'] += sheet['backTotalFee'] ? "总回单付:" + sheet['backTotalFee'] : "";
            sheet['receiptFromCustomerFeeInfo'] += sheet['codPayTotalFee'] ? "总货款扣:" + sheet['codPayTotalFee'] : "";

            var receiptToCustomerFee = sheet['cod'] + sheet['pickTotalFee'];
            sheet['receiptToCustomerFeeInfo'] += receiptToCustomerFee ? "到付:" + receiptToCustomerFee + "元" : "";
            sheet['receiptToCustomerFeeInfo'] += sheet['toCustomerMonthTotalFee'] ? "到月结:" + sheet['toCustomerMonthTotalFee'] + "元" : "";

            return sheet;
        },
        /**
         * 保存运单
         */
        saveSheet: _.throttle(function () {
            var that = this;
            var message = that.vSheet.isEdit ? "修改成功" : "开票成功";
            var tmp = that.buildSendSheet(this.vSheet.$data);
            IDB.transaction("rw", IDB.sheet, IDB.newSheetNos, IDB.config, IDB.feeRule, IDB.org, function () {
                //查询保费配置
                IDB.config.where("name").equals("sys.performance.contains.premium").first().then(function (sys) {
                    IDB.config.where("name").equals("print.primary.fee.mode").first().then(function (printPrimaryFeeMode) {
                        //主要费用信息
                        var isSysPerformanceContainsPremium = sys ? sys['value'] * 1 : "";
                        printPrimaryFeeMode = printPrimaryFeeMode ? printPrimaryFeeMode['value'] * 1 : 1;
                        that.checkSheet(tmp, function (sheet) {
                            if (!sheet) {
                                throw null;
                            }
                            sheet = that.wrapSheet(sheet, isSysPerformanceContainsPremium, printPrimaryFeeMode);
                            IDB.transaction("rw", IDB.sheet, IDB.newSheetNos, function () {
                                if (!sheet.isEdit) {
                                    sheet.printCount = 0;
                                }
                                Core.Cache.set("lastSaveSheet", sheet);
                                console.log(sheet);

                                feeInfo = sheet['primaryFeeSummaryInfo'] + "<br>" + sheet['secondaryFeeSummaryInfo'] + "<br>" + sheet['receiptToCustomerFeeInfo'];
                                $("#feeInfo").html(feeInfo);

                                if (sheet.isEdit) {
                                    sheet.version = sheet.version + 1;
                                    var lastEditSheetNoShort = Core.Cache.get("lastEditSheetNoShort");
                                    if (lastEditSheetNoShort != sheet['sheetNoShort']) {
                                        IDB.sheet.add(sheet);
                                        that.refreshSheetNo(sheet['sheetNoShort']);
                                        IDB.sheet.delete(lastEditSheetNoShort).then(function () {
                                            Core.Cache.remove('lastEditSheetNoShort');
                                        });
                                    } else {
                                        delete sheet['sheetNoShort'];
                                        IDB.sheet.update(lastEditSheetNoShort, sheet).then(function () {
                                            Core.Cache.remove('lastEditSheetNoShort');
                                        });
                                    }
                                } else {
                                    Core.Cache.set("lastSaveSheet", sheet);
                                    IDB.sheet.add(sheet);
                                    that.refreshSheetNo(sheet['sheetNoShort']);
                                }
                            }).then(function () {
                                Core.Cache.remove('Batch_Fast');
                                native.showToast(message);
                                Core.Cache.set("lastGoodsName", that.vSheet.goodsName);
                                that.vSheet.showCreate = true;
                                lxDb.uploadSheet(function () {
                                    that.getLocalSheets();
                                });
                                $("#tab2 input").attr("disabled", "disabled");
                                $("#tab2 select").attr("disabled", "disabled");
                                setTimeout(function () {
                                    //noinspection JSValidateTypes
                                    $('.page-content').scrollTop(999);
                                }, 100);
                            });
                        });
                    });
                });
            }).catch(function (e) {
                if (e['message']) {
                    Core.App.alert("开票失败,错误信息:<br>" + e['message']);
                }
                console.log(e);
            });
            that.saveCustomer();
        }, 100),
        updateSheet: function (flag) {
            var that = this;
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
         * 初始化目的地
         */
        initToOrgArea: function () {
            var toOrgAreaObj = Core.Cache.get('toOrgArea') || {};
            if ('name' in toOrgAreaObj || 'id' in toOrgAreaObj) {
                this.vSheet.toAreaId = toOrgAreaObj['areaId'];
                this.vSheet.toRegionName = toOrgAreaObj['name'];
                this.vSheet.toProvinceName = toOrgAreaObj['provinceName'];
                this.vSheet.toCityName = toOrgAreaObj['cityName'];
                this.vSheet.toAreaName = toOrgAreaObj['areaName'];
                this.vSheet.toShopId = toOrgAreaObj['shopId'];
                this.vSheet.toShopName = toOrgAreaObj['shopName'];
                this.vSheet.toRegionMarkerPen = toOrgAreaObj['markerPen'];

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
                Core.Cache.set('toOrgAreaHistory', toOrgAreaHistory);
            }
        },
        /**
         * 设置月结编号
         */
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
            this.vSheet.fromAreaName = fromShop['orgAreaName'];
            this.vSheet.fromShopId = fromShop['orgId'];
            this.vSheet.fromShopName = fromShop['orgName'];

            var goodsName = Core.Cache.get("lastGoodsName") || "";
            this.vSheet.goodsName = goodsName;
            if (goodsName) {
                var goodsHistory = Core.Cache.get('goodsHistory') || [];
                if (goodsHistory.indexOf(goodsName) == -1) {
                    goodsHistory.push(goodsName);
                }
                Core.Cache.set('goodsHistory', goodsHistory);
            }
        },
        /**
         * 清楚发货客户
         */
        clearFromCustomer: function () {
            Core.Cache.remove('fromCustomer');
            Core.Cache.remove('CodCard');
            this.vSheet.fromCustomerId = "";
            this.vSheet.fromCustomerName = "";
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
        /**
         * 确认用户
         * @param fromCustomer
         */
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
                    this.vSheet.fromCustomerPhone1 = fromCustomer['phone1'] ? fromCustomer['phone1'] : "";
                    this.vSheet.fromCustomerAddress = fromCustomer['address'];

                    this.vSheet.fromCustomerBank = fromCustomer['bank'];
                    this.vSheet.fromCustomerAccount = fromCustomer['account'];
                    this.vSheet.fromCustomerBranchBank = fromCustomer['branchBank'];
                    this.vSheet.fromCustomerHolder = fromCustomer['holder'];
                    //this.vSheet.memberCardNo= fromCustomer['memberCardNo'];
                    this.vSheet.fromCustomerMemberCardNo = fromCustomer['memberCardNo'];

                    this.saveCustomer();
                    sheet.lastSearch = [];
                } else {
                    this.confirmCustomer(fromCustomer);
                }
            }
        },
        /**
         * 保存客户信息
         */
        saveCustomer: function () {
            var that = this;
            var fromCustomer = Core.Cache.get('fromCustomer') || "";
            if (!fromCustomer) {
                Core.Cache.set('fromCustomer', {
                    id: this.vSheet.fromCustomerId,
                    name: this.vSheet.fromCustomerName,
                    phone: this.vSheet.fromCustomerPhone + "",
                    address: this.vSheet.fromCustomerAddress,
                    bank: this.vSheet.fromCustomerBank,
                    account: this.vSheet.fromCustomerAccount,
                    holder: this.vSheet.fromCustomerHolder,
                    branchBank: this.vSheet.fromCustomerBranchBank
                });
            }
            IDB.transaction("rw", IDB.customer, function () {
                var fromCustomer = {
                    name: that.vSheet.fromCustomerName,
                    phone: that.vSheet.fromCustomerPhone + "",
                    bank: that.vSheet.fromCustomerBank || "",
                    account: that.vSheet.fromCustomerAccount || "",
                    holder: that.vSheet.fromCustomerHolder || "",
                    branchBank: that.vSheet.fromCustomerBranchBank || ""
                };
                var toCustomer = {
                    name: that.vSheet.toCustomerName,
                    phone: that.vSheet.toCustomerPhone + "",
                    bank: that.vSheet.toCustomerBank || "",
                    account: that.vSheet.toCustomerAccount || "",
                    holder: that.vSheet.toCustomerHolder || "",
                    branchBank: that.vSheet.fromCustomerBranchBank || ""
                };

                if (fromCustomer.phone != "") {
                    IDB.customer.get(fromCustomer.phone).then(function (customer) {
                        if (customer) {
                            IDB.customer.update(customer['phone'], fromCustomer);
                        } else {
                            IDB.customer.add(fromCustomer);
                        }
                    });
                }

                if (toCustomer.phone != "" && fromCustomer.phone != toCustomer.phone) {
                    IDB.customer.get(toCustomer.phone).then(function (customer) {
                        if (customer) {
                            IDB.customer.update(customer['phone'], toCustomer);
                        } else {
                            IDB.customer.add(toCustomer);
                        }
                    });
                }
            }).catch(function (e) {
                console.log(e);
            });
        },
        /**
         * 初始化货款
         * @param flag
         */
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

            this.saveCustomer();
            Core.Cache.remove('toCustomer');

            sheet.lastSearch = [];
        },
        getBatchNo: function (key, isReset) {
            var batchNo = Core.Cache.get("Batch_" + loginName + "_" + key);
            if (!batchNo || isReset) {
                batchNo = (new Date()).getTime();
                Core.Cache.set("Batch_" + loginName + "_" + key, batchNo);
            }
            return batchNo;
        },
        initPreOrder: function (val, needBack) {
            var that = this;
            that.vSheet.$data.objectId = val.objectId;
            that.clearFromCustomer();
            $.each(val, function (i, v) {
                if (i != "codCardNo" && i != "createdAt" && i != "updatedAt" && i != "ACL" && i != "userId" && i != "toAreaName") {
                    that.vSheet.$data[i] = v;
                }
            });
            that.vSheet.$data['memberCardNo'] = val['fromCustomerCodCardNo'] ||'';
            if (val['fromCustomerCity'] && val['fromCustomerAddress']) {
                that.vSheet.$data['fromCustomerAddress'] = val['fromCustomerCity'] + val['fromCustomerAddress'];
            }
            if (val['toCustomerCity'] && val['toCustomerAddress']) {
                that.vSheet.$data['toCustomerAddress'] = val['toCustomerCity'] + val['toCustomerAddress'];
            }


            if (needBack) {
                Core.mainView.router.back();
            }
            var toRegionName = val['toAreaName'];

            IDB.region
                .filter(function (region) {
                    var reg = new RegExp(toRegionName);
                    return reg.test(region.name) || reg.test(region.abbr) || reg.test(region.pinyin);
                })
                .toArray()
                .then(function (result) {
                    if (result.length > 0) {
                        if (result.length == 1) {
                            Core.Cache.set('toOrgArea', result[0]);
                            that.initToOrgArea();
                        } else {
                            native.showToast("<span class='color-red'>" + toRegionName + "</span>有多条记录,请手动选择");
                            setTimeout(function () {
                                Core.Page.changePage("searchToArea.html");
                                setTimeout(function () {
                                    $("#searchToInput").val(toRegionName);
                                    var tmp = {
                                        toOrgAreas: result
                                    };
                                    var html = Core.Template.render('toAreaTmpl', tmp);
                                    $('#searchToArea .search-found').show().children().html(html);
                                }, 500);
                            }, 500);
                        }
                    } else {
                        that.vSheet.toAreaName = "";
                        native.showToast("<span class='color-red'>" + val['toAreaName'] + "</span>暂不支持到货");
                    }
                }).catch(function (e) {
                console.log(e);
            });
        }
    };
    sheet.init();
    module.exports = sheet;
});
