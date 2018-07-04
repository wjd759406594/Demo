/**
 *
 */
define(function (require, exports, module) {
    window.$$ = Dom7;
    var $ = jQuery;
    var Template7 = window.Template7;
    var Parse = window.Parse;
    var block = false;
    var native = require("js/modules/hybridapi");
    var analytics = require("js/modules/core/analytics");
    var loginName = localStorage.getItem("loginName");
    var analytics = require('js/modules/core/analytics');

    var setUserInfo = function (isForced) {
        var userInfo = Core.Cache.get('userInfo');

        var loginName = Core.Cache.get('loginName');
        var companyNo = Core.Cache.get('companyNo');
        if (!loginName || loginName == ''
            || !companyNo || companyNo == '') {
            return;
        }

        if (isForced || !userInfo || typeof userInfo['loginName'] === 'undefined') {
            const userInfoObj = {
                loginName: loginName,
                companyNo: companyNo
            };
            analytics.setUserInfo(userInfoObj);
            Core.Cache.set('userInfo', userInfoObj);
        }
    };

    require('js/modules/core/dexie');
    var db;
    window.Core = {};
    Core.isLoading = false;
    Core.PaymentMode = {
        1: "现金",
        2: "POS机",
        3: "支付宝",
        4: "微信"
    };
    Core.AjaxId = 0;
    Core.SheetStatus = {
        10: "待",
        20: "装",
        21: "发",
        22: "到",
        23: "中",
        30: "提",
        31: "退",
        33: "删"
    };
    // 1-揽货，2-发货，3-到货，4-送货 5-派货 6-装车 7-到达  8:盘点 9:回单签收 10:回单收回 11:回单交客户 12:回单揽活 13:月结开票 14:二次装车 15:送货装车
    Core.ScanType = {
        lh: "1",
        fh: "2",
        dh: "3",
        sh: "4",
        ph: "5",
        zc: "6",
        dd: "7",
        pd: "8",
        hdqs: "9",
        hdsh: "10",
        hdjkh: "11",
        hdlh: "12",
        yj: "13",
        azc: "14",
        shzc: "15"
    };

    Core.ScanCode = {
        ok: 200,
        notRead: 601,
        error: 602
    };

    /**
     * 运单联数
     * @type {{}}
     */
    Core.WaybillNumber = {
        1: "发货客户",
        2: "到货公司",
        3: "交提货人",
        4: "发货公司",
        5: "补打运单"
    };
    /**
     * 默认支持的打印机型号
     * @type {*[]}
     */
    Core.PrintModList = [
        {
            id: 1,
            deviceType: "LPK130",
            name: "富士通LPK130"
        },
        {
            id: 2,
            deviceType: "GP3120TL",
            name: "佳博GP3120TL"
        },
        {
            id: 3,
            deviceType: "HMZ3",
            name: "我的物流云M8"
        },
        {
            id: 4,
            deviceType: "XT4131A",
            name: "芝柯XT4131A"
        }
    ];
    Core.SheetBq = ['WaybillBh', 'WaybillBq', 'WaybillMd', 'WaybillMdt'];
    Core.SheetTemplate = {
        1: "Sheet.label.template",//标签打印
        2: "Sheet.waybill.template",// 便携式标签运单
        3: "Sheet.back.template",//回单
        4: "Sheet.bigWaybill.template"//电子运单套打
    };

    Core.RuleType = {
        // line: "线路",
        fromOrg: "发货业务区",
        fromShop: "发货网点",
        toOrg: "到货业务区",
        toShop: "到货网点"
    };
    /**
     * 初始化
     * @param App
     */
    Core.init = function (App) {
        console.log("核心Core初始化成功");
        Core.App = new Framework7({
            activeState: false,
            material: true,
            materialRipple: false,
            modalButtonOk: '确认',
            modalButtonCancel: '取消',
            modalUsernamePlaceholder: '用户名',
            modalPasswordPlaceholder: '密码',
            modalTitle: '温馨提示',
            pushState: false,
            router: true,
            fastClicks: true,
            swipeBackPage: false,
            smartSelectBackText: '返回',
            smartSelectPopupCloseText: '关闭',
            smartSelectPickerCloseText: '完成',
            modalPreloaderTitle: '加载中... ',
            notificationCloseButtonText: '关闭'
        });
        Core.mainView = Core.App.addView('.view-main', {
            domCache: true,
            dynamicNavbar: true
        });
        Core.Template.init();
        if (navigator.userAgent.indexOf("kjchezhu") === -1) {
            //noinspection JSUnresolvedVariable
            window.seajs.use("native/web", function () {
                native.init();
                App.init();
                Core.Update.init();
                if (window.Vue) {
                    Vue.config.devtools = true;
                }
            });
        } else {
            var count = 0;
            var t = setInterval(function () {
                count++;
                console.log("%c等待设备初始化...", "font-size:1em;color:green;");
                if (count >= 30) {
                    alert("初始化设备出错!");
                    clearInterval(t);
                    return false;
                }
                connectWebViewJavascriptBridge(function () {
                    native.init();
                    clearInterval(t);
                    App.init();
                    Core.Update.init();
                });
            }, 100);
        }
        var tmpKT;
        $('body').on('click', '.back', function (e) {
            e.preventDefault();
            Core.Page.back();
            return false;
        }).on("click", 'input', function () {
            $(this).select();
        }).on('focus', '#my-form input', function () {
            $(this).val('');
        }).on('focus', 'input[type=tel],input[type=text],input[type=number]', function () {
            if (Core.App.device.ios) {
                return false;
            }
            if (Core.App.getCurrentView()) {
                var $pageContent = $(Core.App.getCurrentView()['activePage']['container']).children('.page-content');
                var sT = $pageContent.scrollTop();
                var pH = $pageContent.height();
                var oT = $(this).offset().top;
                var kH = 280;
                tmpKT = new Date().getTime();
                $pageContent.css({
                    'padding-bottom': kH + "px"
                });
                if (pH - oT < kH) {
                    var top = sT + oT - 150;
                    $pageContent.animate({scrollTop: top}, 200, 'linear');
                }
            }


        }).on('blur', 'input[type=tel],input[type=text],input[type=number]', function () {
            if (Core.App.device.ios) {
                return false;
            }
            var t = setTimeout(function () {
                if (new Date().getTime() - tmpKT < 100) {
                    clearTimeout(t);
                } else {
                    $('.page-content').removeAttr("style");
                }
            }, 100);
        });

    };
    /**
     * 更新检查
     * @type {{init}}
     */
    Core.Update = (function () {
        var init = function (flag) {
            var now = (new Date()).getTime();
            var lastCheckTime = Core.Cache.get('lastCheckTime') || 0;
            if (Core.App.device.ios || Core.App.device.android) {
                native.isFirstLoad(function (isFirstLoad) {
                    if (isFirstLoad || (now - lastCheckTime) > checkUpdateTime || flag) {
                        Core.Cache.set('lastCheckTime', now);
                        var AppVersion = Parse.Object.extend("AppVersion");
                        var query = new Parse.Query(AppVersion);
                        query.equalTo('appName', "kjcz");
                        query.descending("createdAt");
                        query.first({
                            success: function (result) {
                                //Core.App.hidePreloader();
                                if (result) {
                                    var data = result['attributes'];
                                    Core.Cache.set('lastUpdate', data);
                                    update(data, true);
                                }
                            },
                            error: function () {
                                //Core.App.hidePreloader();
                            }
                        });

                        setUserInfo(false);
                    } else {
                        update(Core.Cache.get('lastUpdate'));
                    }
                });
            }
        };
        var update = function (data, showToast) {
            if (!data) {
                init(true);
                return false;
            }
            var currentVersion = window.version.replace(/\./g, "") * 1;
            var latestVersion = data['latestVersion'].replace(/\./g, "") * 1;
            var minVersion = data['minVersion'].replace(/\./g, "") * 1;
            var minVersionIos = data['minVersionIos'].replace(/\./g, "") * 1;
            var updateInfo;
            // if ((Core.App.device.os === 'android' && currentVersion < minVersion)
            //     || (Core.App.device.os === 'ios' && currentVersion < minVersionIos)) {
            // updateInfo = {
            //     url: data['apkUrl'],
            //     zip: data['url'],
            //     message: data['message'],
            //     version: data['minVersion'],
            //     versionIos: data['minVersionIos']
            // };
            // console.log(updateInfo);
            // Core.Cache.remove('SheetTmpl');
            // Core.Cache.remove('Template');
            // native.download(updateInfo);
            // } else
            if (currentVersion < latestVersion) {
                updateInfo = {
                    url: data['apkUpdate'] ? data['apkUrl'] : data['url'],
                    zip: data['url'],
                    message: data['message'],
                    version: data['latestVersion'],
                    versionIos: data['minVersionIos']
                };
                console.log(updateInfo);
                Core.Cache.remove('SheetTmpl');
                Core.Cache.remove('Template');
                native.download(updateInfo);
            } else {
                // if (showToast) {
                //     native.showToast("当前已是最新版本");
                // }
                console.log('当前已是最新版本');
            }
        };
        return {
            init: init
        }
    })();
    var syncTids = [];
    Core.lxDb = {
        /**
         * 获取IDB对象
         * @param companyNo
         * @returns {Dexie|*}
         */
        getIDB: function (companyNo) {
            if (!companyNo) {
                return false;
            }
            db = new Dexie("t6_c_" + companyNo);
            db.version(1).stores({
                region: "&id,name",
                agreement: "&id,company,&no",
                logistics: "&id,name",
                customer: "&phone,name",
                seq: "&type",
                sheetNos: "&no",
                print: "&id,[no+deviceType]",
                sheet: "&sheetNoShort,state",
                dict: "&id,type,sort",
                config: "&id,&name",
                feeRule: "&id,feeType" //ruleType,agreementNo,customerPhone,[fromShopId+toShopId],[fromOrgName+toOrgName],priority
            });
            db.version(2).stores({
                region: "&id,name,abbr,pinyin"
            });
            db.version(3).stores({
                feeRule: "&id,feeType,delFlag"
            });
            db.version(4).stores({
                agreement: "&id,company,&no,delFlag",
                print: "&id,[no+deviceType],delFlag",
                dict: "&id,type,sort,delFlag"
            });
            db.version(5).stores({
                org: "&id,name"
            });
            db.version(6).stores({
                newSheetNos: "&no,month"
            });
            db.open()
                .catch(function (error) {
                    console.log('Uh oh : ' + error);
                });
            window.IDB = db;
            //db.delete();
            return db;
        },
        /**
         * 删除数据库
         * @param cb
         */
        clearDb: function (cb) {
            db.delete().catch(function (err) {
                console.error(err);
                native.showToast("删除本地数据库出错");
            }).finally(function () {
                cb()
            });
        },
        networkConnection: function (e) {
            var type = e.detail['type'];
            if (type === "none") {
                Core.lxDb.sync().stop();
            } else {
                Core.lxDb.sync().start();
            }
        },
        grantSheetNoSegment: function (cb) {
            var month = (new Date()).Format('yyMM');
            var day = (new Date()).Format("yyMMdd");
            IDB.newSheetNos
                .where("month")
                .equals(month)
                .count()
                .then(function (count) {
                    //删除非当天的本地单号
                    IDB.newSheetNos.where("month").notEqual(month).delete();
                    if (count < 10) {
                        Core.Service.get('api/auth/v1/ltl/sheet/grantSheetNoSegmentYYMM', {
                            "yyMM": month,
                            "amount": 50
                        }, function (result) {
                            var data = result['data'];
                            var beginNo = data['beginNo'];
                            var endNo = data['endNo'];
                            for (beginNo; beginNo <= endNo; beginNo++) {
                                var s = beginNo + "";
                                var no = s.length >= 6 ? s : new Array(6 - s.length + 1).join("0") + s;
                                IDB.newSheetNos.add({
                                    "no": no,
                                    "month": month
                                });
                            }

                            if (cb && typeof cb == "function") {
                                IDB.newSheetNos
                                    .where("month")
                                    .equals(month)
                                    .first()
                                    .then(function (no) {
                                        cb(day + no['no']);
                                    })
                            }
                        }, function () {
                            Core.App.alert("本地运单号不足,请在网络通畅的情况下,点击确认申请运单号", function () {
                                Core.lxDb.grantSheetNoSegment(cb);
                            })
                        });
                    } else {
                        if (cb && typeof cb == "function") {
                            IDB.newSheetNos
                                .where("month")
                                .equals(month)
                                .first()
                                .then(function (no) {
                                    cb(day + no['no']);
                                })
                        }
                    }
                });
        },
        uploadSheet: function (cb, showLoading) {
            showLoading = showLoading === undefined ? false : showLoading;
            db.transaction("rw", db.sheet, function () {
                db.sheet
                    .where("state")
                    .equals(0)
                    .or("state")
                    .equals(4)
                    .toArray()
                    .then(function (result) {
                        if (result.length > 0) {
                            var sheets = [];
                            result.map(function (sheet) {
                                var tmp = {};
                                $.each(sheet, function (i, v) {
                                    if (!(i === "template" || i === "activity" ||
                                            i === "sheet" || i === "memberCardNo" ||
                                            i === "activity" || i === "localSheets" ||
                                            i === "prePhone" || i === "toOrgAreas" ||
                                            i === "isChange" || i === "printCount" ||
                                            i === "showCreate" || i === "primaryFeeSummaryInfo" ||
                                            i === "secondaryFeeSummaryInfo" || i === "receiptFromCustomerFeeInfo" ||
                                            i === "receiptToCustomerFeeInfo" || i === "message" ||
                                            i === "pickTotalFee" || i === "isPerformanceContainsPremium" || i === "netFee" ||
                                            i === "salesmanName" || i === "salesmanPhone" || i === "totalFee" || i === "companyName" || i === "printSheetNo" ||
                                            i === "customerServicePhone" || i === "deliveryModeDesc" || i === "fromProvinceName" || i === "fromCityName" || i === "fromAreaName" ||
                                            i === "nowTotalFee" || i === "documentFee" || v === ""
                                        )) {
                                        tmp[i] = v;
                                    }
                                });
                                console.log(tmp);
                                sheets.push(tmp);
                            });

                            var now = (new Date()).getTime();
                            var syncUpload = Core.Cache.get("syncUpload");
                            if (!syncUpload || now - timeOut * 1000 > syncUpload * 1) {
                                Core.Cache.set("syncUpload", now);
                                Core.Service.post('api/auth/v1/ltl/sheet/upload', {text: JSON.stringify(sheets)}, function (result) {
                                    localStorage.removeItem("syncUpload");
                                    var rows = result['data'];
                                    var message = "";
                                    if (rows.length > 0) {
                                        rows.map(function (item) {
                                            if (item['state'] === 2) {
                                                db.sheet.delete(item['sheetNoShort']);
                                            } else if (item['state'] === 3 || item['state'] == 4) {
                                                db.sheet.update(item['sheetNoShort'], {
                                                    "state": item['state'],
                                                    "message": item['message']
                                                });
                                                message = ",部分运单开票失败"
                                            }
                                        })
                                    }
                                    sheets.map(function (v) {
                                        if (v['objectId']) {
                                            Parse.Cloud.run('changeOrderState', {
                                                objectId: v['objectId'],
                                                sheetNo: v['sheetNo'],
                                                sheetNoShort: v['sheetNoShort'],
                                                state: "已接货"
                                            }, {
                                                success: function (result) {
                                                },
                                                error: function () {
                                                }
                                            });
                                        }
                                    });

                                    if (cb && typeof cb == "function") {
                                        db.sheet
                                            .toArray()
                                            .then(function (lists) {
                                                cb(lists);
                                            });
                                    }
                                    if (showLoading) {
                                        Core.App.alert("上传成功" + message);
                                    }
                                }, function () {
                                    localStorage.removeItem("syncUpload");
                                    if (cb && typeof cb == "function") {
                                        db.sheet
                                            .toArray()
                                            .then(function (lists) {
                                                cb(lists);
                                            });
                                    }
                                }, showLoading);
                            } else {
                                if (showLoading) {
                                    native.showToast("已经有上传任务在执行...");
                                }
                            }
                        } else {
                            if (showLoading) {
                                Core.App.alert("没有待上传运单,请先处理失败运单");
                            }
                            if (cb && typeof cb == "function") {
                                db.sheet
                                    .toArray()
                                    .then(function (lists) {
                                        cb(lists);
                                    });
                            }
                        }
                    });
            });
        },
        sync: function () {
            var that = this;

            function start() {
                //var now = (new Date()).getTime();
                // var syncTime = Core.Cache.get("syncTime");
                if (syncTids.length == 0) {
                    //stop();
                    console.log('同步开始');
                    that.syncRegion(false);
                    that.syncOrg(false);
                    that.syncAgreement(false);
                    that.syncPrint(false);
                    that.syncDict(false);
                    that.syncConfig(false);
                    that.syncFeeRule(false);
                    that.uploadSheet();
                    //同步
                    // TODO: 临时禁掉避免iOS界面无响应
                    if (Core.App.device.os != 'ios') {
                        syncTids.push(
                            setInterval(function () {
                                that.syncRegion(false);
                                that.syncOrg(false);
                                that.syncAgreement(false);
                                that.syncPrint(false);
                                that.syncDict(false);
                                that.syncConfig(false);
                                that.syncFeeRule(false);
                                that.uploadSheet();
                            }, 10 * 60 * 1000)
                        );
                    }
                }
                //Core.Cache.set('syncTime', now);
            }

            function stop() {
                console.log('同步结束');
                if (syncTids.length > 0) {
                    syncTids.map(function (id) {
                        clearInterval(id);
                    });
                    syncTids = [];
                }
                //Core.Cache.remove('syncTime');
            }

            return {
                start: start,
                stop: stop
            }
        },
        getData: function (type, url, lastSyncDate, showLoading, cb) {
            Core.Service.get(url, {lastSyncDate: lastSyncDate}, function (result) {
                var data = result['data'];
                var rows = data['rows'];
                if (rows.length > 0) {
                    rows.map(function (item) {
                        var content = JSON.parse(item['content']);
                        switch (item['opt']) {
                            case "C":
                            case "U":
                                db.table(type).get(content['id']).then(function (obj) {
                                    if (obj) {
                                        delete  content['id'];
                                        db.table(type).update(obj['id'], content);
                                    } else {
                                        db.table(type).add(content);
                                    }
                                });
                                if (type === "region") {
                                    var toOrgAreaHistory = Core.Cache.get('toOrgAreaHistory') || [];
                                    if (toOrgAreaHistory.length > 0) {
                                        var tmp = [];
                                        toOrgAreaHistory.map(function (v) {
                                            if (v['id'] === content['id']) {
                                                tmp.push(content);
                                            } else {
                                                tmp.push(v);
                                            }
                                        });
                                        Core.Cache.set('toOrgAreaHistory', tmp);
                                    }
                                }
                                break;
                            case "D":
                                db.table(type).delete(content['id']);
                                if (type === "region") {
                                    var toOrgAreaHistory = Core.Cache.get('toOrgAreaHistory') || [];
                                    if (toOrgAreaHistory.length > 0) {
                                        var tmp = [];
                                        toOrgAreaHistory.map(function (v) {
                                            if (v['id'] !== content['id']) {
                                                tmp.push(v);
                                            }
                                        });
                                        Core.Cache.set('toOrgAreaHistory', tmp);
                                    }
                                }
                                break;
                            default:
                                break;
                        }
                    });
                }

                db.seq.get(type).then(function (obj) {
                    if (obj) {
                        db.table(type).count(function (count) {
                            db.seq.update(type, {
                                "lastSyncDate": data['lastSyncDate'],
                                "count": count
                            }).then(function () {
                                if (cb && typeof cb == "function") {
                                    cb()
                                }
                            })
                        });
                    } else {
                        var name = "";
                        switch (type) {
                            case "region":
                                name = "到货区域";
                                break;
                            case "org":
                                name = "机构";
                                break;
                            case "agreement":
                                name = "月结单位";
                                break;
                            case "print":
                                name = "打印模板";
                                break;
                            case "dict":
                                name = "系统字典";
                                break;
                            case "config":
                                name = "系统配置";
                                break;
                            case "feeRule":
                                name = "费用规则";
                                break;
                        }
                        db.seq.add({
                            "type": type,
                            "name": name,
                            "lastSyncDate": data['lastSyncDate'],
                            "count": rows.length
                        }).then(function () {
                            if (cb && typeof cb == "function") {
                                cb()
                            }
                        });
                    }
                });
            }, null, showLoading);
        },
        /**
         * 同步区域
         * @param syncAll 是否全量同步
         * @param showLoading 是否显示等代层
         * @param cb 返回
         */
        syncRegion: function (syncAll, showLoading, cb) {
            showLoading = showLoading == undefined ? false : showLoading;
            db.transaction('rw', db.region, db.seq, function () {
                if (syncAll) {
                    db.table('region').clear().then(function () {
                        Core.lxDb.getData('region', 'api/auth/v1/sys/region/sync', "", showLoading, cb);
                    })
                } else {
                    db.seq.get("region").then(function (region) {
                        var lastSyncDate = region ? region['lastSyncDate'] : "";
                        Core.lxDb.getData('region', 'api/auth/v1/sys/region/sync', lastSyncDate, showLoading, cb);
                    });
                }
            }).catch(function (e) {
                db.seq.delete("region");
                console.log(e);
            })
        },
        /**
         * 同步区域
         * @param syncAll 是否全量同步
         * @param showLoading 是否显示等代层
         * @param cb 返回
         */
        syncOrg: function (syncAll, showLoading, cb) {
            showLoading = showLoading == undefined ? false : showLoading;
            db.transaction('rw', db.org, db.seq, function () {
                if (syncAll) {
                    db.table('org').clear().then(function () {
                        Core.lxDb.getData('org', 'api/auth/v1/sys/org/sync', "", showLoading, cb);
                    })
                } else {
                    db.seq.get("org").then(function (org) {
                        var lastSyncDate = org ? org['lastSyncDate'] : "";
                        Core.lxDb.getData('org', 'api/auth/v1/sys/org/sync', lastSyncDate, showLoading, cb);
                    });
                }
            }).catch(function (e) {
                db.seq.delete("org");
                console.log(e);
            })
        },
        /**
         * 同步月结
         * @param syncAll 全量同步
         * @param showLoading 是否显示等代层
         * @param cb 返回
         */
        syncAgreement: function (syncAll, showLoading, cb) {
            showLoading = showLoading == undefined ? false : showLoading;
            db.transaction('rw', db.agreement, db.seq, function () {
                if (syncAll) {
                    db.table('agreement').clear().then(function () {
                        Core.lxDb.getData('agreement', 'api/auth/v1/ltl/agreement/sync', "", showLoading, cb);
                    })
                } else {
                    db.seq.get("agreement").then(function (region) {
                        var lastSyncDate = region ? region['lastSyncDate'] : "";
                        Core.lxDb.getData('agreement', 'api/auth/v1/ltl/agreement/sync', lastSyncDate, showLoading, cb);
                    });
                }
            }).catch(function (e) {
                db.seq.delete("agreement");
                console.log(e);
            })
        },
        /**
         * 同步打印模板
         * @param syncAll 是否全量同步
         * @param showLoading 是否显示等代层
         * @param cb 返回
         */
        syncPrint: function (syncAll, showLoading, cb) {
            showLoading = showLoading == undefined ? false : showLoading;
            db.transaction('rw', db.print, db.seq, function () {
                if (syncAll) {
                    db.table('print').clear().then(function () {
                        Core.lxDb.getData('print', 'api/auth/v1/sys/com/printTemplate/sync', "", showLoading, cb);
                    })
                } else {
                    db.seq.get("print").then(function (region) {
                        var lastSyncDate = region ? region['lastSyncDate'] : "";
                        Core.lxDb.getData('print', 'api/auth/v1/sys/com/printTemplate/sync', lastSyncDate, showLoading, cb);
                    });
                }
            }).catch(function (e) {
                db.seq.delete("print");
                console.log(e);
            })
        },
        /**
         * 同步字典
         * @param syncAll 是否全量同步
         * @param showLoading 是否显示等代层
         * @param cb 返回
         */
        syncDict: function (syncAll, showLoading, cb) {
            showLoading = showLoading == undefined ? false : showLoading;
            db.transaction('rw', db.dict, db.seq, function () {
                if (syncAll) {
                    db.table('dict').clear().then(function () {
                        Core.lxDb.getData('dict', 'api/auth/v1/sys/com/dict/sync', "", showLoading, cb);
                    })
                } else {
                    db.seq.get("dict").then(function (region) {
                        var lastSyncDate = region ? region['lastSyncDate'] : "";
                        Core.lxDb.getData('dict', 'api/auth/v1/sys/com/dict/sync', lastSyncDate, showLoading, cb);
                    });
                }
            }).catch(function (e) {
                db.seq.delete("dict");
                console.log(e);
            })
        },
        /**
         * 同步配置
         * @param syncAll 是否全量同步
         * @param showLoading 是否显示等代层
         * @param cb 返回
         */
        syncConfig: function (syncAll, showLoading, cb) {
            showLoading = showLoading == undefined ? false : showLoading;
            db.transaction('rw', db.config, db.seq, function () {
                if (syncAll) {
                    db.table('config').clear().then(function () {
                        Core.lxDb.getData('config', 'api/auth/v1/sys/com/config/sync', "", showLoading, cb);
                    })
                } else {
                    db.seq.get("config").then(function (region) {
                        var lastSyncDate = region ? region['lastSyncDate'] : "";
                        Core.lxDb.getData('config', 'api/auth/v1/sys/com/config/sync', lastSyncDate, showLoading, cb);
                    });
                }
            }).catch(function (e) {
                db.seq.delete("config");
                console.log(e);
            })
        },
        /**
         * 同步配置
         * @param syncAll 是否全量同步
         * @param showLoading 是否显示等代层
         * @param cb 返回
         */
        syncFeeRule: function (syncAll, showLoading, cb) {
            showLoading = showLoading == undefined ? false : showLoading;
            db.transaction('rw', db.feeRule, db.seq, function () {
                if (syncAll) {
                    db.table('feeRule').clear().then(function () {
                        Core.lxDb.getData('feeRule', 'api/auth/v1/sys/com/feeRule/sync', "", showLoading, cb);
                    })
                } else {
                    db.seq.get("feeRule").then(function (region) {
                        var lastSyncDate = region ? region['lastSyncDate'] : "";
                        Core.lxDb.getData('feeRule', 'api/auth/v1/sys/com/feeRule/sync', lastSyncDate, showLoading, cb);
                    });
                }
            }).catch(function (e) {
                db.seq.delete("feeRule");
                console.log(e);
            })
        }
    };
    /**
     * 获取后端推送信息
     * @type {{get,set}}
     */
    Core.Receiver = (function () {
        var set = function (data) {
            console.log(data);
            var companyNo = Core.Cache.get('companyNo') || "";
            var IDB = companyNo ? Core.lxDb.getIDB(companyNo) : false;
            switch (data['type']) {
                case "alert":
                    Core.App.closeModal();
                    Core.App.alert(data['message'], function () {
                        if (data['title'] == "微信订单") {
                            if (Core.App.mainView.activePage.name !== 'orderList') {
                                Core.Page.changePage("orderList.html", true);
                            }
                        }
                    });
                    break;
                case "gps":
                    native.gps(function (mLocation) {
                        console.log(mLocation);
                    });
                    break;
                case "activity":
                    Core.Service.get('api/auth/ /v1/ltl/activity/find', {}, function (result) {
                        Core.Cache.set("activity", result['data']);
                    });
                    break;
                case "sync.region":
                    if (IDB) {
                        Core.lxDb.syncRegion(false, false);
                    }
                    break;
                case "sync.org":
                    if (IDB) {
                        Core.lxDb.syncOrg(false, false);
                    }
                    break;
                case "sync.agreement":
                    if (IDB) {
                        Core.lxDb.syncAgreement(false, false);
                    }
                    break;
                case "sync.printTemplate":
                    if (IDB) {
                        Core.lxDb.syncPrint(false, false);
                    }
                    break;
                case "sync.dict":
                    if (IDB) {
                        Core.lxDb.syncDict(false, false);
                    }
                    break;
                case "sync.config":
                    if (IDB) {
                        Core.lxDb.syncConfig(false, false);
                    }
                    break;
                case "sync.feeRule":
                    if (IDB) {
                        Core.lxDb.syncFeeRule(false, false);
                    }
                    break;
                case "saveSheetError":
                    Core.App.alert(data['message']);
                    break;
                default:
                    break;
            }
            if (data['message']) {
                var messages = Core.Cache.get("messages") || [];
                if (messages.length > 20) {
                    messages.pop();
                }
                var createTime = (new Date()).Format('yyyy-MM-dd hh:mm:ss');
                messages.unshift({
                    text: data['message'],
                    createTime: createTime
                });
                Core.Cache.set("messages", messages);
            }
        };
        return {
            set: set
        }
    })();
    /**
     * 用户登录模块
     * @type {{login, logout}}
     */
    Core.User = (function () {
        var login = function (loginName, password, ajax) {
            localStorage.setItem('isLogin', "isLogin");
            Core.Service.get(loginUrl + 'api/anon/v1/auth/login', {
                appKey: appName,
                loginName: loginName,
                password: password,
                deviceCode: "ffffffff-93ea-2e2e-ffff-ffff9c94cccd",
                appVer: "21",
                longitude: 0,
                latitude: 0
            }, function (result) {
                var data = result['data'];
                var config = data['attributes']['config'];
                if (config['serverTime']) {
                    var serverDate = (new Date(config['serverTime'])).Format("yyyyMMdd");
                    if ((new Date()).Format("yyyyMMdd") !== serverDate) {
                        Core.App.alert("本地时间与服务器时间不一致,请在设置中检查一下时间,当前服务器时间为:" + serverDate, function () {
                            if (Core.App.mainView.activePage.name !== 'login') {
                                Core.Page.changePage('login.html', true);
                            }
                        });
                        return false;
                    }
                }
                //var lastLogin = Core.Cache.get("loginName")||"";
                Core.Cache.set('loginName', loginName);
                Core.Cache.set('userId', data['attributes']['id']);
                Core.Cache.set('password', password);
                Core.Cache.set('appUrl', data['appUrl']);
                Core.Cache.set('companyName', data['companyName']);
                Core.Cache.set('companyNo', data['companyNo']);
                Core.Cache.set('sheetPre', Core.Utils.buildSheetPre(data['companyNo']));
                Core.Cache.set('sessionKey', data['sessionKey']);
                Core.Cache.set('sessionSecret', data['sessionSecret']);
                Core.Cache.set('oss', data['attributes']['oss']);
                Core.Cache.set('attributes', data['attributes']);

                setUserInfo(true);

                native.subscribe({
                    "companyNo": Core.Cache.get('sheetPre'),
                    "userId": data['attributes']['id'] + "",
                    "orgId": data['attributes']['orgId'] + ""
                });
                if (Core.App.mainView.activePage.name == "login") {
                    Core.Page.back(true);
                } else {
                    if (ajax && ajax['showLoading'] == true) {
                        console.log("重新登录成功,尝试重新请求");
                        if (ajax.type == "GET") {
                            Core.Service.get(ajax.url, ajax.data, ajax.succ, ajax.fail, false);
                        } else {
                            Core.Service.post(ajax.url, ajax.data, ajax.succ, ajax.fail, false);
                        }
                    }
                }
            });
        };

        var logout = function () {
            Core.Cache.remove('appUrl');
            Core.Cache.remove('attributes');
            Core.Cache.remove('sessionKey');
            Core.Cache.remove('sessionSecret');
            Core.Cache.remove('companyName');
            Core.Cache.remove('companyNo');
            Core.Cache.remove('sheetPre');
            Core.Cache.remove('oss');
            Core.Cache.remove('password');
            Core.lxDb.sync().stop();
            // native.unsubscribe({
            //     "companyNo": Core.Cache.get('sheetPre'),
            //     "userId": data['attributes']['id'] + "",
            //     "orgId": data['attributes']['orgId'] + ""
            // });
            Core.Page.changePage('login.html', true);
        };

        var changePwd = function (oldPassword, newPassword) {
            Core.Service.post('api/auth/v1/sys/user/updatePassword', {
                oldPassword: oldPassword,
                newPassword: newPassword
            }, function () {
                Core.Cache.set("password", newPassword);
                Core.App.alert("修改密码成功", function () {
                    Core.Page.back();
                });
            })
        };

        return {
            login: login,
            logout: logout,
            changePwd: changePwd
        }
    })();


    /**
     *
     * @type {{postJson, post, get, postFile}}
     */
    Core.Service = (function () {
        var lastAjax;
        var post, _ajax, _getServerUrl, _get;
        /**
         * 成功返回
         * @param data
         * @param succ
         * @param fail
         * @returns {boolean}
         */
        var successCallback = function (data, succ, fail) {
            if ('code' in data
                && 'msg' in data
                && 'content' in data) {
                if (data['code'] == 0) {
                    succ(data);
                } else if (data['code'] == 401) {
                    native.loginPage();
                    return false;
                } else {
                    if (typeof(fail) == 'function') {
                        console.log(data['msg']);
                        fail(data);
                        return false;
                    }
                }
            }
        };
        /**
         * 请求失败返回
         * @param error
         * @param fail
         * @param url
         * @param showLoading
         * @returns {boolean}
         */
        var errorCallBack = function (error, fail, url, showLoading) {
            if (error['statusText'] == "abort") {
                if (typeof(fail) === 'function') {
                    fail();
                }
                return false;
            }
            if (error['status'] === 401) {
                console.log(lastAjax);
                var loginName = localStorage.getItem('loginName');
                var pwd = localStorage.getItem('password');
                var isLogin = localStorage.getItem('isLogin') || "";
                if (loginName && pwd && isLogin === "") {
                    Core.User.login(loginName, pwd, lastAjax);
                }
                return false;
            }

            //重新登录失败跳转
            // if ('url' in lastAjax && lastAjax['url'].indexOf('auth/login') > -1) {
            //     Core.Page.changePage('login.html', true);
            //     return false;

            if (error['responseJSON'] && 'message' in error['responseJSON']) {
                //noinspection JSUnresolvedVariable
                native.showToast(error.responseJSON['message']);
                if (typeof(fail) === 'function') {
                    //noinspection JSUnresolvedVariable
                    fail(error.responseJSON['message']);
                }
                return false;
            }
            if (error['status'] === 404 && typeof(fail) === 'function') {
                fail({
                    status: 404
                });
                return false;
            } else if (error['status'] !== 200) {
                if (showLoading) {
                    native.showToast("网络不给力！");
                }
                return false;
            }
        };

        _getServerUrl = function (url) {
            if (url.indexOf('http') > -1) {
                return url;
            }

            var appUrl = serverAddress;
            if (!appUrl) {
                Core.Page.changePage('login.html', true);
                return false;
            }
            appUrl = appUrl.endsWith("/") ? appUrl : appUrl + "/";

            return appUrl + url;
        };

        _ajax = function (url, data, type, succ, fail, showLoading) {
            showLoading = showLoading === undefined ? true : showLoading;
            native.getConnectionInfo(function (connectionInfo) {
                if (connectionInfo === "none") {
                    if (showLoading) {
                        native.showToast("网络连接没开启");
                    }
                    if (fail && typeof fail === "function") {
                        fail();
                    }
                } else {
                    var time1 = (new Date()).getTime();
                    Core.App.closeModal();
                    Core.isLoading = true;
                    var contentType = 'application/x-www-form-urlencoded';
                    data.timestamp = (new Date()).Format("yyyy-MM-dd hh:mm:ss");
                    var Authorization = "";
                    if (url.indexOf('/login') == -1) {
                        data.clientTimeout = timeOut * 1000;
                        data.sessionKey = localStorage.getItem('sessionKey');
                        data.companyNo = localStorage.getItem('companyNo');
                        if ('device' in Core.App) {
                            data.av = Core.App.device.os + "_" + Core.App.device.osVersion + "_" + version;
                        }
                        Authorization = "Basic " + window.Base64.encode(data.companyNo + ":" + data.sessionKey);
                    }
                    lastAjax = {
                        url: url,
                        type: type,
                        data: data,
                        succ: succ,
                        fail: fail,
                        showLoading: showLoading
                    };
                    url = _getServerUrl(url);
                    native.getToken(function (token) {
                        Core.AjaxId = $.ajax({
                            url: url,
                            type: type,
                            data: data,
                            headers: {
                                "YD_OAUTH": token,
                                "Accept": "application/json"
                            },
                            contentType: contentType,
                            dataType: 'json',
                            timeout: timeOut * 1000,
                            beforeSend: function () {
                                if (showLoading) {
                                    Core.App.showPreloader();
                                }
                            },
                            statusCode: {
                                /* 404: function () {
                                 native.showToast("请求服务地址不存在");
                                 }*/
                            },
                            success: function (data) {
                                successCallback(data, succ, fail);
                            },
                            error: function (error, status) {
                                if ('timeout' == status) {
                                    native.showToast("请求超时");
                                    return false;
                                }
                                errorCallBack(error, fail, url, showLoading);
                            },
                            complete: function () {
                                if (showLoading) {
                                    var time2 = (new Date()).getTime();
                                    if ((time2 - time1) < 500) {
                                        setTimeout(function () {
                                            Core.AjaxId = 0;
                                            Core.isLoading = false;
                                            Core.App.closeModal('.modal.modal-in.modal-preloader');
                                            Core.App.pullToRefreshDone();
                                        }, 500);
                                    } else {
                                        Core.AjaxId = 0;
                                        Core.isLoading = false;
                                        Core.App.closeModal('.modal.modal-in.modal-preloader');
                                        Core.App.pullToRefreshDone();
                                    }
                                }
                                if (url.indexOf('auth/login') > -1) {
                                    localStorage.removeItem('isLogin');
                                }
                            }
                        });
                    });
                }
            });
        };
        post = function (url, data, succ, fail, showLoading) {
            _ajax(url, data, 'POST', succ, fail, showLoading);
        };
        _get = function (url, data, succ, fail, showLoading) {
            _ajax(url, data, 'GET', succ, fail, showLoading);
        };
        var run = function (name, data, success, fail) {
            Core.App.showIndicator();
            //noinspection JSUnresolvedVariable
            Parse.Cloud.run(name, data).then(function (result) {
                console.log(result);
                if (result['success']) {
                    success(result['data']);
                } else {
                    Core.App.alert(result['message']);
                }
            }, function (error) {
                if (fail && typeof fail == "function") {
                    fail(error);
                } else {
                    Core.App.alert("请求服务失败:" + error);
                }
            }).always(function () {
                Core.App.pullToRefreshDone();
                Core.App.hideIndicator();
            });
        };
        return {
            post: post,
            get: _get,
            run: run
        }
    })();
    /**
     * 记录错误日志
     * @type {{add}}
     */
    Core.Logs = (function () {
        var Error = Parse.Object.extend("Errors");
        var errorDb = new Error();
        /**
         *  添加错误日志
         * @param url
         * @param param
         * @param message
         */
        var add = function (url, param, message) {
            return "";
            /*if (typeof  message == "object") {
             message = JSON.stringify(message);
             }
             errorDb.save({
             userName: localStorage.getItem('loginName') + "" || "",
             companyName: localStorage.getItem('companyName') + "" || "",
             url: url,
             param: param,
             content: message
             }, {
             success: function () {
             console.log('日志插入成功');
             },
             error: function (gameScore, error) {
             // 添加失败
             console.log('日志插入失败');
             console.log(error);
             }
             });*/
        };
        return {
            add: add
        }
    })();
    /**
     * 模板编译
     * @type {{render}}
     */
    Core.Template = (function () {
        var init = function () {
            Template7.registerHelper('json', function (status) {
                return JSON.stringify(status);
            });

            Template7.registerHelper('date', function (item) {
                return (new Date(item)).Format("yyyy-MM-dd hh:mm:ss");
            });

            Template7.registerHelper('length', function (data) {
                console.log(data);
                return data.length;
            });

            Template7.registerHelper('scanType', function (status) {
                return Core.ScanType[status];
            });

            Template7.registerHelper('scanStatus', function (status) {
                return status == 1 ? '<span class="color-orange">已同步</span>' : '<span class="color-red">未同步</span>';
            });

            Template7.registerHelper('countInput', function (datas) {
                var count = 0;
                console.log(datas);
                if (datas && datas.length > 0) {
                    $.each(datas, function (i, v) {
                        count += v['a'] * 1;
                    });
                }
                return count;
            });


            Template7.registerHelper('stateInfo', function (status) {
                if (status in Core.SheetStatus) {
                    return Core.SheetStatus[status];
                } else {
                    return "未";
                }
            });


        };
        /**
         * 模板展示，返回编译好的html
         * @param domId {string} 模板的id
         * @param data  {object|json} 模板的数据
         * @returns {html}
         */
        var render = function (domId, data) {
            try {
                var template = $$('#' + domId).html();
                var compiledTemplate = Template7.compile(template);
                return compiledTemplate(data);
            } catch (e) {
                console.log(e);
            }
        };

        /**
         * 模板展示，返回编译好的html
         * @param content {string} 模板的content
         * @param data  {object|json} 模板的数据
         * @returns {html}
         */
        var renderConternt = function (content, data) {
            try {
                //var template = $$('#' + domId).html();
                var compiledTemplate = Template7.compile(template);
                return compiledTemplate(data);
            } catch (e) {
                console.log(e);
            }
        };

        return {
            init: init,
            render: render,
            renderConternt: renderConternt
        }
    })();
    /**
     * 页面跳转
     * @type {{changePage, changePageName, back}}
     */
    Core.Page = (function () {
        var changePage = function (url, isNew) {
            if (isNew) {
                url = basePath + "views/" + url;
                native.changePage(url);
            } else {
                Core.App.mainView.loadPage(url);
            }
        };
        var changePageName = function (name) {
            Core.App.mainView.loadPage({
                'pageName': name
            });
        };
        var back = function () {
            // if (!flag) {
            //     if (Core.App.mainView.activePage.name == "updateSheet") {
            //         if (block) {
            //             return false;
            //         }
            //         if (Sheet.hadChange()) {
            //             block = true;
            //             Core.App.confirm('运单已修改,请点击右上角的提交修改按钮,否则不保存运单', '温馨提示', function () {
            //                 block = false;
            //                 Core.Page.back(true);
            //             }, function () {
            //                 block = false;
            //             });
            //             return false;
            //         }
            //     }
            // }
            if (Core.App.mainView.history.length > 1) {
                Core.App.mainView.back();
            } else {
                native.back(true);
            }
        };
        return {
            changePage: changePage,
            changePageName: changePageName,
            back: back
        }
    })();
    /**
     * 缓存
     * @type {{set, get,remove}}
     */
    Core.Cache = (function () {
        var setCache, getCache;

        /**
         * 设置缓存
         * @param id
         * @param data
         */
        setCache = function (id, data) {
            //Core.Cache[id]=data;
            if (data) {
                if (typeof  data == "object") {
                    data = JSON.stringify(data);
                }
                localStorage.setItem(id, data);
            }
        };
        /**
         * 获取缓存
         * @param id
         */
        getCache = function (id) {
            var string = localStorage.getItem(id);
            try {
                if (string.startsWith('{') || string.startsWith('[')) {
                    return JSON.parse(string);
                } else {
                    return string;
                }
            } catch (e) {
                return string;
            }
        };

        var removeCache = function (id) {
            localStorage.removeItem(id);
        };


        return {
            set: setCache,
            get: getCache,
            remove: removeCache
        }
    })();
    /**
     * 通用方法
     * @type {{isMySheet, hadInStock, getShortSheetNo, buildSheetPre, barcodeRuleFilter, barcodePackageSheetNo, getBatchNo, checkPhone, getBackShiftShortSheetNo, fmtBankNo, initDatePicker, getSheetFullLength, getSheetFullLabelLength, getSheetNo, initRangeDatePicker}}
     */
    Core.Utils = (function () {
        //var sheetPre = Core.Cache.get('sheetPre') + "";
        var SUB_START = 0;
        //var SUB_END_CHANG_TONG = 10;//长通物流
        var SUB_END_JIA_YI = 8;     //佳怡物流
        var SUB_END_XIN_BANG = 8;   //新邦物流
        var SUB_END_ZHONG_TIE = 10; //中铁物流
        var SUB_END_DE_BANG = 9;    //德邦物流
        var SUB_END_CITY_STAR = 11; //城市之星

        // var ADD_BY_CHANG_TONG = ".371";  //长通物流
        // var ADD_BY_JIA_YI = ".531";      //佳怡物流
        // var ADD_BY_XIN_BANG = ".02";     //新邦物流
        // var ADD_BY_ZHONG_TIE = ".04";    //中铁物流
        // var ADD_BY_DE_BANG = ".01";      //德邦物流
        // var ADD_BY_CITY_STAR = ".03";    //城市之星

        /**
         * 格式化金额
         * @param s 金额，n 保留的小数位
         */
        var formatMoney = function (s, n) {
            n = n > 0 && n <= 20 ? n : 2;
            s = parseFloat((s + "").replace(/[^\d\.-]/g, "")).toFixed(n) + "";
            var l = s.split(".")[0].split("").reverse(),
                r = s.split(".")[1];
            var t = "";
            for (i = 0; i < l.length; i++) {
                t += l[i] + ((i + 1) % 3 == 0 && (i + 1) != l.length ? "," : "");
            }
            return t.split("").reverse().join("") + "." + r;
        };

        /**
         * 检查是不是物流云运单
         * @param sheetNo
         */
        var isMySheet = function (sheetNo) {
            var sheetPre = Core.Cache.get('sheetPre');
            return !!sheetNo.startsWith(sheetPre);
        };
        /***
         * 条形码截取规则
         * @param barcode
         * @return
         */
        var barcodeRuleFilter = function (barcode) {
            var sheetPre = Core.Cache.get('sheetPre') + "";
            var SUB_START_ZYKY = sheetPre.length;
            var SUB_END_ZYKY = SUB_START_ZYKY + 12; //物流云
            var numBarcode = barcode + "";
            var length = numBarcode.length;
            // 优先判断是否中原货运标签
            if (isMySheet(barcode)) {
                return numBarcode.substring(SUB_START_ZYKY, SUB_END_ZYKY);
            }
            // 当不为中原运单时，再判断是否合作单位货运标签
            if (length == 10) {//长通物流-纯运单号
                return numBarcode;
            }
            else if (length == 11) {//佳怡物流(8+3)
                return numBarcode.substring(SUB_START, SUB_END_JIA_YI);
            }
            else if (length == 12) {//新邦物流(8+4)
                return numBarcode.substring(SUB_START, SUB_END_XIN_BANG);
            }
            else if (length == 13) {//中铁物流(10+3)
                return numBarcode.substring(SUB_START, SUB_END_ZHONG_TIE);
            }
            else if (length == 17) {//德邦物流(9+8)
                return numBarcode.substring(SUB_START, SUB_END_DE_BANG);
            }
            else if (length == 19) {//城市之星(11+4+4)
                return numBarcode.substring(SUB_START, SUB_END_CITY_STAR);
            }
            else if (length == 23) {//城市之星(8+11+4)
                return numBarcode.substring(8, SUB_END_CITY_STAR);
            }
            else {
                return numBarcode;
            }
        };
        /***
         * 通过条码来组装运单号
         * @param barcode
         * @return
         */
        var barcodePackageSheetNo = function (barcode) {
            var numBarcode = barcode + "";
            var length = numBarcode.length;
            // 优先判断是否中原货运标签
            if (isMySheet(barcode)) {
                return numBarcode;
            }
            // 当不为中原运单时，再判断是否合作单位货运标签
            if (length == 10) {//长通物流-纯运单号
                return numBarcode;
            }
            else if (length == 11) {//佳怡物流(8+3)
                return numBarcode.substring(SUB_START, SUB_END_JIA_YI);
            }
            else if (length == 12) {//新邦物流(8+4)
                return numBarcode.substring(SUB_START, SUB_END_XIN_BANG);
            }
            else if (length == 13) {//中铁物流(10+3)
                return numBarcode.substring(SUB_START, SUB_END_ZHONG_TIE);
            }
            else if (length == 17) {//德邦物流(9+8)
                return numBarcode.substring(SUB_START, SUB_END_DE_BANG);
            }
            else if (length == 19) {//城市之星(11+4+4)
                return numBarcode.substring(SUB_START, SUB_END_CITY_STAR);
            }
            else if (length == 23) {//城市之星(8+11+4)
                return numBarcode.substring(8, SUB_END_CITY_STAR);
            }
            else {
                return numBarcode;
            }
        };
        /**
         * 运单是不是在库存中
         * @param sheetNo
         * @param sheetList
         */
        var hadInStock = function (sheetNo, sheetList) {
            var tmp = {
                flag: false,
                sheetNo: sheetNo
            };
            if (sheetList) {
                $.each(sheetList, function (i, v) {
                    if ((v['sheetNoConsign'] && v['sheetNoConsign'].endsWith(sheetNo)) || v['sheetNo'].endsWith(sheetNo)) {
                        tmp = v;
                        tmp.flag = true;
                    }
                });
            }
            return tmp;
        };

        /**
         * 获取运单列表 模糊匹配
         * @param sheetNo
         * @param sheetList
         * @returns {Array}
         */
        var getListInStock = function (sheetNo, sheetList) {
            var list = [];
            if (sheetList) {
                $.each(sheetList, function (i, v) {
                    if ((v['sheetNoConsign'] && v['sheetNoConsign'].endsWith(sheetNo)) || v['sheetNo'].endsWith(sheetNo)) {
                        list.push(v);
                    }
                });
            }
            return list;
        };

        /**
         * 获取短运单号
         * @param sheetLabelNo
         * @returns {*}
         */
        var getShortSheetNo = function (sheetLabelNo) {
            var sheetPre = Core.Cache.get('sheetPre') + "";
            if (isMySheet(sheetLabelNo)) {
                sheetLabelNo = sheetLabelNo.substr(sheetPre.length, sheetLabelNo.length);
            }
            if (sheetLabelNo.length > sheetLength) {
                sheetLabelNo = sheetLabelNo.substr(0, sheetLabelNo.length - 4);
            }
            return sheetLabelNo;
        };

        /**
         * 获取运单号
         * @param sheetLabelNo
         * @returns {*}
         */
        var getSheetNo = function (sheetLabelNo) {
            if (sheetLabelNo.length > sheetLength) {
                sheetLabelNo = sheetLabelNo.substr(0, sheetLabelNo.length - 4);
            }
            return sheetLabelNo;
        };


        /**
         * 获取回单短运单号
         * @param sheetLabelNo
         * @returns {*}
         */
        var getBackShiftShortSheetNo = function (sheetLabelNo) {
            var sheetPre = Core.Cache.get('sheetPre') + "";
            if (isMySheet(sheetPre)) {
                sheetLabelNo = sheetLabelNo.substr(sheetPre.length, sheetLabelNo.length);
            }

            var backSheetArr = sheetLabelNo.split('-');
            var backCounts = 99;
            if (backSheetArr.length == 2) {
                backCounts = backSheetArr[1];
            }
            sheetLabelNo = backSheetArr[0];
            var sheetNo = sheetLabelNo;
            if (sheetLabelNo.length > sheetLength) {
                sheetNo = sheetLabelNo.substr(0, sheetLabelNo.length - 2);
            }
            return {
                no: sheetNo,
                label: sheetLabelNo,
                count: backCounts
            };
        };
        /**
         * 创建sheetPre
         * @param companyNo
         * @returns {*}
         */
        var buildSheetPre = function (companyNo) {
            return appVersion + companyNo.length + companyNo;
        };

        var getSheetFullLength = function () {
            var sheetPre = Core.Cache.get('sheetPre') + "";
            return sheetPre.length + 12;
        };
        var getSheetFullLabelLength = function () {
            return this.getSheetFullLength() + 4;
        };

        var getBatchNo = function (key, isReset) {
            var batchNo = Core.Cache.get("Batch_" + loginName + "_" + key);
            if (!batchNo || isReset) {
                batchNo = (new Date()).getTime();
                Core.Cache.set("Batch_" + loginName + "_" + key, batchNo);
            }
            return batchNo;
        };
        var removeBatchNo = function (key) {
            Core.Cache.remove("Batch_" + loginName + "_" + key);
        };


        var getConfig = function (name) {
            var config = {
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
                "defaultDeliveryMode": 2,
                "defaultPremiumMode": 2
            };
            var attributes = Core.Cache.get('attributes') || [];
            if (attributes['config'] && attributes['config']['customerBank'] && attributes['config']['defaultDeliveryMode']) {
                config = attributes['config'];
            }
            return name ? config[name + ""] : config;
        };

        var fmtBankNo = function (item) {
            if (item) {
                item = item + "";
                if (item.length > 0) {
                    return item.substr(0, 4) + "****" + item.substr(item.length - 4, item.length);
                }
            }
        };
        var checkPhone = function (value) {
            var tel = /^0?(13[0-9]|15[012356789]|17[0678]|18[0-9]|14[57])[0-9]{8}$/;
            if (!tel.test(value)) {
                native.showToast("请输入正确的手机号码");
                return false;
            }
            return true;
        };
        var escape = function (val) {
            var tmp = {};
            $.each(val, function (i, v) {
                tmp[i] = typeof v === "string" ? v.replace(/[\\'"]/g, '') : v;
            });
            return tmp;
        };
        /**
         * 时间单选器
         * @param el
         */
        var initDatePicker = function (el) {
            var today = new Date();
            return Core.App.calendar({
                input: el,
                value: [today],
                monthNames: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
                monthNamesShort: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
                dayNames: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
                dayNamesShort: ['日', '一', '二', '三', '四', '五', '六'],
                toolbarCloseText: '确定',
                headerPlaceholder: '选择日期',
                closeOnSelect: true,
                dateFormat: 'yyyy-mm-dd',
                disabled: function (date) {
                    if (date > today || date.getFullYear() < 2016) {
                        return true;
                    } else {
                        return false;
                    }
                }
            });
        };
        /**
         * 时间多选器
         * @param el {dom}
         * @param cb {function}
         */
        var initRangeDatePicker = function (el, cb) {
            var today = new Date();
            return Core.App.calendar({
                input: el,
                value: [today, today],
                rangePicker: true,
                closeOnSelect: true,
                dateFormat: 'yyyy-mm-dd',
                disabled: function (date) {
                    if (date > today || date.getFullYear() < 2016) {
                        return true;
                    } else {
                        return false;
                    }
                },
                onClose: function (p) {
                    var tmp = p.value;
                    if (tmp.length == 1) {
                        tmp.push(p.value[0]);
                    }
                    p.setValue(tmp);
                    if (typeof  cb == "function") {
                        cb(tmp);
                    }
                }
            });
        };

        var getFullSheetNo = function (sheetLabelNo) {
            sheetLabelNo = this.getShortSheetNo(sheetLabelNo);
            var sheetPre = Core.Cache.get('sheetPre') + "";
            return sheetPre + sheetLabelNo;
        };

        /**
         * 客户端扫码/扫一扫 sheetNo 检测
         * @param label
         * @returns {string}
         */
        var getSheetNoFromScan = function (sheetNo) {
            if (!sheetNo) {
                //native.mediaVibrate(Core.ScanCode.error, "扫描的条码为空");
                return "";
            }
            if (sheetNo.startsWith("http")) {
                var numbs = sheetNo.match(/sheetNo=(\d*)/) || sheetNo.match(/s=(\d*)/) || [];
                if (numbs.length > 1) {
                    sheetNo = numbs[1];
                } else {
                    native.mediaVibrate(Core.ScanCode.error, "扫描网址中未找到运单号");
                }
            }
            return sheetNo;
        };
        /**
         * 获取模板
         * @param name
         * @param deviceType
         * @param cb
         */
        var getPrintTemplate = function (name, deviceType, cb) {
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
        };
        /**
         * 获取蓝牙配置
         * @returns {boolean}
         */
        var getBlueToothSetting = function (cb) {
            native.getBluetoothState(function (state) {
                var print = Core.Cache.get('printSet');
                if (state != 'ready') {
                    Core.App.confirm('蓝牙未打开,现在去配置', function () {
                        Core.Page.changePage('printSetting.html', true);
                    });
                    return false;
                }
                if (!print) {
                    Core.App.confirm('未找到已配置的打印机,现在去配置', function () {
                        Core.Page.changePage('printSetting.html', true);
                    });
                    return false;
                }

                cb(print);
            });
        };
        /**
         * 获取打印机配置
         * @returns {boolean}
         */
        var getPrintSetting = function () {
            var print = Core.Cache.get('printSet');
            var printModSet = Core.Cache.get('printModSet');
            if (!print || !printModSet || typeof printModSet['deviceType'] === 'undefined') {
                Core.App.confirm('未找到已配置的打印机,现在去配置', function () {
                    Core.Page.changePage('printSetting.html', true);
                });
                return false;
            }
            return print;
        };
        /**
         * 获取打印机设备型号
         * @param print
         * @returns {string}
         */
        var getDeviceType = function (print) {
            var deviceType = '';

            var printModSet = Core.Cache.get('printModSet');
            if (printModSet && typeof printModSet['deviceType'] !== 'undefined') {
                deviceType = printModSet['deviceType'];
            }

            return deviceType;
        };

        /**
         * 获取标签的名称
         * @param template
         * @returns {*}
         */
        var getPrintTemplateName = function (template) {
            if (template in Core.SheetTemplate) {
                return Core.SheetTemplate[template];
            } else {
                native.showToast('占不支持标签类型');
                return false;
            }
        };

        /**
         * 统一验证错误提示
         * @param validate
         * @returns {boolean}
         */
        var validate = function (validate) {
            var flag = true;
            if (!validate.valid) {
                var errors = validate.errors;
                $.each(errors, function (i, v) {
                    native.showToast(v['message']);
                    flag = false;
                    return false;
                });
            }
            return flag;
        };

        var mul = function mul(num1, num2) {
            var m = 0;
            try {
                m += num1.toString().split(".")[1].length
            } catch (e) {
            }
            try {
                m += num2.toString().split(".")[1].length
            } catch (e) {
            }
            return (Number(num1.toString().replace(".", "")) * Number(num2.toString().replace(".", ""))) / Math.pow(10, m)
        }

        var add = function add(num1, num2) {
            var r1, r2, m, n;
            try {
                r1 = num1.toString().split(".")[1].length
            } catch (e) {
                r1 = 0
            }
            try {
                r2 = num2.toString().split(".")[1].length
            } catch (e) {
                r2 = 0
            }
            m = Math.pow(10, Math.max(r1, r2));
            n = (r1 >= r2) ? r1 : r2;
            return ((num1 * m + num2 * m) / m).toFixed(n);
        }
        var sub = function sub(num1, num2) {
            var r1, r2, m, n;
            try {
                r1 = num1.toString().split(".")[1].length
            } catch (e) {
                r1 = 0
            }
            try {
                r2 = num2.toString().split(".")[1].length
            } catch (e) {
                r2 = 0
            }
            n = (r1 >= r2) ? r1 : r2;
            m = Math.pow(10, Math.max(r1, r2));
            return ((num1 * m - num2 * m) / m).toFixed(n);
        }
        var div = function div(arg1, arg2) {
            var t1 = 0, t2 = 0, r1, r2;
            try {
                t1 = arg1.toString().split(".")[1].length
            } catch (e) {
            }
            try {
                t2 = arg2.toString().split(".")[1].length
            } catch (e) {
            }
            r1 = Number(arg1.toString().replace(".", ""));
            r2 = Number(arg2.toString().replace(".", ""));
            return (r1 / r2) * Math.pow(10, t2 - t1);
        }


        var intToChinese = function intToChinese(money) {
            //汉字的数字
            var cnNums = new Array('零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖');
            //基本单位
            var cnIntRadice = new Array('', '拾', '佰', '仟');
            //对应整数部分扩展单位
            var cnIntUnits = new Array('', '万', '亿', '兆');
            //对应小数部分单位
            var cnDecUnits = new Array('角', '分', '毫', '厘');
            //整数金额时后面跟的字符
            var cnInteger = '整';
            //整型完以后的单位
            var cnIntLast = '元';
            //最大处理的数字
            var maxNum = 999999999999999.9999;
            //金额整数部分
            var integerNum;
            //金额小数部分
            var decimalNum;
            //输出的中文金额字符串
            var chineseStr = '';
            //分离金额后用的数组，预定义
            var parts;
            if (money == '') { return ''; }
            money = parseFloat(money);
            if (money >= maxNum) {
                //超出最大处理数字
                return '';
            }
            if (money == 0) {
                chineseStr = cnNums[0] + cnIntLast + cnInteger;
                return chineseStr;
            }
            //转换为字符串
            money = money.toString();
            if (money.indexOf('.') == -1) {
                integerNum = money;
                decimalNum = '';
            } else {
                parts = money.split('.');
                integerNum = parts[0];
                decimalNum = parts[1].substr(0, 4);
            }
            //获取整型部分转换
            if (parseInt(integerNum, 10) > 0) {
                var zeroCount = 0;
                var IntLen = integerNum.length;
                for (var i = 0; i < IntLen; i++) {
                    var n = integerNum.substr(i, 1);
                    var p = IntLen - i - 1;
                    var q = p / 4;
                    var m = p % 4;
                    if (n == '0') {
                        zeroCount++;
                    } else {
                        if (zeroCount > 0) {
                            chineseStr += cnNums[0];
                        }
                        //归零
                        zeroCount = 0;
                        chineseStr += cnNums[parseInt(n)] + cnIntRadice[m];
                    }
                    if (m == 0 && zeroCount < 4) {
                        chineseStr += cnIntUnits[q];
                    }
                }
                chineseStr += cnIntLast;
            }
            //小数部分
            if (decimalNum != '') {
                var decLen = decimalNum.length;
                for (var i = 0; i < decLen; i++) {
                    var n = decimalNum.substr(i, 1);
                    if (n != '0') {
                        chineseStr += cnNums[Number(n)] + cnDecUnits[i];
                    }
                }
            }
            if (chineseStr == '') {
                chineseStr += cnNums[0] + cnIntLast + cnInteger;
            } else if (decimalNum == '') {
                chineseStr += cnInteger;
            }
            return chineseStr;
        }

        var getDayOfMonth = function getDayOfMonth(year, month) {

            var days = 0;
            if (month != 2) {
                switch (month) {
                    case 1:
                    case 3:
                    case 5:
                    case 7:
                    case 8:
                    case 10:
                    case 12:
                        days = 31;
                        break;
                    case 4:
                    case 6:
                    case 9:
                    case 11:
                        days = 30;

                }
            } else {

                if (year % 4 == 0 && year % 100 != 0 || year % 400 == 0)
                    days = 29;
                else days = 28;

            }
            return days;
        }

        return {
            getSheetNoFromScan: getSheetNoFromScan,
            isMySheet: isMySheet,
            formatMoney: formatMoney,
            hadInStock: hadInStock,
            getListInStock: getListInStock,
            getShortSheetNo: getShortSheetNo,
            buildSheetPre: buildSheetPre,
            barcodeRuleFilter: barcodeRuleFilter,
            barcodePackageSheetNo: barcodePackageSheetNo,
            getBatchNo: getBatchNo,
            removeBatchNo: removeBatchNo,
            checkPhone: checkPhone,
            getBackShiftShortSheetNo: getBackShiftShortSheetNo,
            fmtBankNo: fmtBankNo,
            initDatePicker: initDatePicker,
            getSheetFullLength: getSheetFullLength,
            getSheetFullLabelLength: getSheetFullLabelLength,
            getFullSheetNo: getFullSheetNo,
            getSheetNo: getSheetNo,
            initRangeDatePicker: initRangeDatePicker,
            getConfig: getConfig,
            getPrintTemplate: getPrintTemplate,
            getPrintSetting: getPrintSetting,
            getBlueToothSetting: getBlueToothSetting,
            getDeviceType: getDeviceType,
            getPrintTemplateName: getPrintTemplateName,
            validate: validate,
            escape: escape,
            mul: mul,
            add: add,
            sub: sub,
            div: div,
            intToChinese: intToChinese,
            getDayOfMonth: getDayOfMonth
        }
    })();

    /**
     * 页面刷新- 已废弃
     * @param msg
     */
    window.reload = function (msg) {
        console.log("reload " + msg);
    };
    /**
     * 页面返回 用户客户端回调
     * @returns {boolean}
     */
    window.back = function () {
        native.hideLoading();
        if ($('.modal.modal-preloader.modal-in').length > 0) {
            Core.App.hidePreloader();
            if (Core.AjaxId != 0) {
                Core.AjaxId.abort();
            }
            return false;
        }
        if (Core.App.mainView.activePage.name == 'home' || Core.App.mainView.activePage.name == 'login') {
            if (block) {
                return false;
            }
            block = true;
            Core.App.confirm('确认退出', '温馨提示', function () {
                block = false;
                native.quit();
            }, function () {
                block = false;
            });
            return false;
        }
        Core.Page.back();
        return false;
    };
    module.exports = Core;
});
