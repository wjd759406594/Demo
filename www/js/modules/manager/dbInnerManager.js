define(function (require, exports, module) {
    require('js/modules/core/dexie');
    var native = require("js/modules/hybridapi");
    var Core = require('js/modules/core/core');
    if (!dataBaseName) {
        return false;
    }
    var db = new Dexie(dataBaseName);
    var sheetPre = Core.Cache.get('sheetPre') + "";
    var dbVersion = Core.Cache.get("dbVersion") || 10;

    db.version(1).stores({
        scanList: "++id,[s+t+isConsignNo],[s+t],[t+r+w],[s+t+r+w],t,ss,b,d,l,i,st,goodsAmount,storeAmount,goodsName,inputCount,labelCount,fromShopName,toShopName,sheetNoConsign",
        lineBranch: "id,createDate,delFlag,distance,driverId,driverName,driverPhone,extendInfo,fromShopId,licensePlate,name,no,remarks,sort,truckId,updateDate",
        truck: "id,driverId,driverName,driverNo,driverPhone,licensePlate,truckCode,truckOwnerName,truckOwnerPhone",
        driver: "id,licenseNo,name,no,phone",
        shift: "id,createDate,delFlag,driverId,driverName,driverPhone,extendInfo,fromShopId,licensePlate,lineBranchId,lineBranchName,lineBranchNo, remarks,shiftNo,truckId,updateDate",
        loadShift: "++id,[loadShiftId+shopId]",
        agreement: "id,no,company,fee,scanList",
        pickupScanList: "++id,uuid,name,createDate,scanList,state",
        codScanList: "id"
    });

    db.open()
        .catch(function (error) {
            console.log('Uh oh : ' + error);
        });
    //db.delete();

    var fieldStringToJsonInner = function (obj) {
        if (!obj) {
            return obj;
        }

        if (obj['l'] && typeof obj['l'] == 'string') {
            obj['l'] = JSON.parse(obj['l']);
        }
        if (obj['i'] && typeof obj['i'] == 'string') {
            obj['i'] = JSON.parse(obj['i']);
        }
        if (obj['scanList'] && typeof obj['scanList'] == 'string') {
            obj['scanList'] = JSON.parse(obj['scanList']);
        }

        return obj;
    };

    var fieldStringToJson = function (obj) {
        if (!obj) {
            return obj;
        }

        if (obj instanceof Array) {
            if (obj.length > 0) {
                $.each(obj, function (i, v) {
                    obj[i] = fieldStringToJsonInner(v);
                });
            }
        } else {
            obj = fieldStringToJsonInner(obj);
        }

        return obj;
    };

    var fieldJsonToString = function (obj) {
        if (obj) {
            if (obj['l'] && typeof obj['l'] == 'object') {
                obj['l'] = JSON.stringify(obj['l']);
            }
            if (obj['i'] && typeof obj['i'] == 'object') {
                obj['i'] = JSON.stringify(obj['i']);
            }
            if (obj['scanList'] && typeof obj['scanList'] == 'object') {
                obj['scanList'] = JSON.stringify(obj['scanList']);
            }
        }
        return obj;
    };

    var dbInnerManager = {
        getIDB: function () {
            return db;
        },
        /**
         * 揽活扫码
         * @param param
         * @param callback
         * @returns {boolean}
         */
        addScan: function (param, callback) {
            if (!param['isConsignNo']) {
                if (param['sheetLabelNo'].length != Core.Utils.getSheetFullLabelLength() && param['sheetNo'].length != 12) {
                    native.mediaVibrate(Core.ScanCode.notRead, "不识别条码");
                    return false;
                }
            }
            var sheetNo = dbInnerManager.getTrueSheetNo(param['sheetNo'], param['isConsignNo']);
            dbInnerManager.finScanBySTC(sheetNo, param['type'], param['isConsignNo'], function (scan) {
                var obj;
                if (scan) {
                    var flag = true;
                    if (scan['l'].length > 0) {
                        $.each(scan['l'], function (i, v) {
                            if (param['sheetLabelNo'] == v['l']) {
                                flag = false;
                            }
                        });
                    }
                    if (flag) {
                        obj = dbInnerManager.buildScanData(param, scan);
                        if (obj) {
                            obj = fieldJsonToString(obj);
                            db.scanList.update(scan['id'], obj).then(function (id) {
                                //native.mediaVibrate(Core.ScanCode.ok, "");
                                dbInnerManager.findScanById(scan['id'], callback);
                            });
                        }
                    } else {
                        native.mediaVibrate(Core.ScanCode.error, "重复扫码");
                    }

                } else {
                    obj = dbInnerManager.buildScanData(param, scan);
                    obj = fieldJsonToString(obj);
                    db.scanList.add(obj).then(function (id) {
                        console.log(id);
                        ////native.mediaVibrate(Core.ScanCode.ok, "");
                        dbInnerManager.findScanById(id, callback);
                    });
                }
            });
            return false;
        },
        updateScan: function (id, obj, callback) {
            obj['labelCount'] = obj['l'].length;
            obj['inputCount'] = obj['i'].length > 0 ? obj['i'][0]["a"] * 1 : 0;

            obj = fieldJsonToString(obj);
            db.scanList.update(id, obj).then(function () {
                callback();
            });
        },
        /**
         * 装车扫码
         * @param param
         * @param callback
         * @returns {boolean}
         */
        addZcScan: function (param, callback) {
            db.transaction('rw', db.scanList, function () {
                var sheetNo = dbInnerManager.getTrueSheetNo(param['sheetNo']);
                dbInnerManager.findScanBySTRW(sheetNo, param['type'], param['refId'], param['shopId'], function (scan) {
                    var obj;
                    if (scan) {
                        var flag = true;
                        //检测标签是否已经扫码
                        if (scan['l'].length > 0) {
                            $.each(scan['l'], function (i, v) {
                                if (param['sheetLabelNo'] == v['l']) {
                                    flag = false;
                                    return false;
                                }
                            });
                        }
                        if (flag) {
                            obj = dbInnerManager.buildScanData(param, scan);
                            if (obj) {
                                obj = fieldJsonToString(obj);
                                db.scanList.update(scan['id'], obj).then(function (id) {
                                    native.mediaVibrate(Core.ScanCode.ok, "");
                                    dbInnerManager.findScanById(scan['id'], callback);
                                });
                            }
                        } else {
                            native.mediaVibrate(Core.ScanCode.error, "重复扫码");
                        }
                    } else {
                        obj = dbInnerManager.buildScanData(param, scan);
                        obj = fieldJsonToString(obj);
                        db.scanList.add(obj).then(function (id) {
                            native.mediaVibrate(Core.ScanCode.ok, "");
                            dbInnerManager.findScanById(id, callback);
                        });
                    }
                });
            }).catch(function (e) {
                console.log(e);
            });
        },
        preAddScan: function (param, callback) {
            var obj = dbInnerManager.buildScanData(param, param);
            obj = fieldJsonToString(obj);
            db.scanList.add(obj).then(function (id) {
                dbInnerManager.findScanById(id, callback);
            });
            return false;
        },
        /**
         * 回单扫码
         * @param param
         * @param callback
         * @returns {boolean}
         */
        addHdScan: function (param, callback) {
            var sheetNo = dbInnerManager.getTrueSheetNo(param['sheetNo']);
            dbInnerManager.findScan(sheetNo, param['type'], function (scan) {
                var obj;
                if (scan) {
                    var flag = true;
                    //检测标签是否已经扫码
                    if (scan['l'].length > 0) {
                        $.each(scan['l'], function (i, v) {
                            if (param['sheetLabelNo'] == v['l']) {
                                flag = false;
                                return false;
                            }
                        });
                    }
                    if (flag) {
                        obj = dbInnerManager.buildScanData(param, scan);
                        if (obj) {
                            obj = fieldJsonToString(obj);
                            db.scanList.update(scan['id'], obj).then(function (id) {
                                native.mediaVibrate(Core.ScanCode.ok, "");
                                dbInnerManager.findScanById(scan['id'], callback);
                            });
                        }
                    } else {
                        native.mediaVibrate(Core.ScanCode.error, "重复扫码");
                    }
                } else {
                    obj = dbInnerManager.buildScanData(param, scan);
                    obj = fieldJsonToString(obj);
                    db.scanList.add(obj).then(function (id) {
                        console.log(id);
                        native.mediaVibrate(Core.ScanCode.ok, "");
                        dbInnerManager.findScanById(id, callback);
                    });
                }
            });
            return false;
        },
        getTrueSheetNo: function (no, isConsignNo) {
            if (!no.startsWith(sheetPre) && !isConsignNo) {
                no = sheetPre + no;
            }
            return no;
        },
        buildScanData: function (param, scan) {
            var tmp;
            var scanInputList = scan && scan['i'] ? scan['i'] : [];
            var scanLabelList = scan && scan['l'] ? scan['l'] : [];
            var inputCount = 0;
            var labelCount = 0;
            if (scanInputList.length > 0) {
                $.each(scanInputList, function (i, v) {
                    inputCount += v['a'] * 1;
                });
            }
            param['isConsignNo'] = param['isConsignNo'] != undefined ? param['isConsignNo'] : 0;
            var createTime = (new Date()).Format("yyyy-MM-dd hh:mm:ss");
            var sheetNo, sheetShortNo;
            if (scan) {
                if (param['goodsAmount'] - scan['labelCount'] - scan['inputCount'] <= 0) {
                    native.mediaVibrate(Core.ScanCode.error, "货物多了");
                    return false;
                }
                labelCount = scan['labelCount'];
            }
            if (param['scanType'] == 1) {
                if (param['dq']) {
                    param['goodsInputAmount'] = param['goodsAmount'] - labelCount - inputCount;
                }
                if (param['goodsAmount'] - scanLabelList.length - param['goodsInputAmount'] < 0) {
                    native.mediaVibrate(Core.ScanCode.error, "货物多了");
                    return false;
                }
                if (param['goodsInputAmount'] == "" || param['goodsInputAmount'] < 1) {
                    Core.App.alert("录入数量不能为空");
                    return false;
                }
                //手动运单
                tmp = {
                    // l: param['sheetNo'],  //运单
                    d: createTime,  //扫码时间
                    a: param['goodsInputAmount']   //数量
                };
                scanInputList.push(tmp);
                if (param['isConsignNo']) {
                    sheetNo = param['sheetNo'];
                    sheetShortNo = param['sheetNo'];
                } else {
                    if (param['sheetNo'].startsWith(sheetPre)) {
                        sheetNo = param['sheetNo'];
                        sheetShortNo = Core.Utils.getShortSheetNo(sheetNo);
                    } else {
                        sheetNo = sheetPre + param['sheetNo'];
                        sheetShortNo = param['sheetNo'];
                    }
                }
            } else {
                //扫码单处理
                if (param['sheetLabelNo'] != '') {
                    tmp = {
                        l: param['sheetLabelNo'],
                        d: createTime
                    };
                    scanLabelList.push(tmp);
                    if (param['isConsignNo']) {
                        sheetNo = param['sheetNo'];
                        sheetShortNo = param['sheetNo'];
                    } else {
                        if (param['sheetNo'].startsWith(sheetPre)) {
                            sheetNo = param['sheetNo'];
                            sheetShortNo = Core.Utils.getShortSheetNo(sheetNo);
                        } else {
                            sheetNo = sheetPre + param['sheetNo'];
                            sheetShortNo = param['sheetNo'];
                        }
                    }
                } else {
                    //加急货物默认添加
                    sheetNo = param['sheetNo'];
                    sheetShortNo = param['sheetNoShort'];
                }
            }

            if (scanInputList.length > 0) {
                inputCount = 0;
                $.each(scanInputList, function (i, v) {
                    inputCount += v['a'] * 1;
                });
            }
            return {
                goodsName: param['goodsName'],
                goodsAmount: param['goodsAmount'] * 1 || 1,//总库存
                storeAmount: param['storeAmount'] != undefined ? param['storeAmount'] : param['goodsAmount'],
                fromShopName: param['fromShopName'],
                toShopName: param['toShopName'],
                sheetNoConsign: param['sheetNoConsign'] != undefined ? param['sheetNoConsign'] : "",
                isConsignNo: param['isConsignNo'],
                inputCount: inputCount,
                labelCount: scanLabelList.length,
                requirement: param['requirement'] || "",
                isFlee: param['isFlee'] == 1 ? 1 : 0, //是否窜货
                sendAmount: param['sendAmount'] != undefined ? param['sendAmount'] : param['goodsAmount'],
                b: param['batchNo'] * 1, //batch no
                st: param['scanType'], //手动 /自动
                t: param['type'] * 1,//type
                d: createTime,//create time
                s: sheetNo + "",//sheet no
                ss: sheetShortNo + "",
                r: param['refId'] * 1, //ref id
                w: param['shopId'] * 1 || "",//网点id
                l: scanLabelList, //label list
                i: scanInputList  //input list,
            }
        },
        /**
         * 查询扫码
         * @param sheetNo 运单号
         * @param type  运单类型
         * @param cb
         * @returns {*}
         */
        findScan: function (sheetNo, type, cb) {
            return db.scanList
                .where('[s+t]')
                .equals([sheetNo + "", type * 1])
                .first()
                .then(function (data) {
                    cb(fieldStringToJson(data));
                });
        },
        finScanBySTC: function (sheetNo, type, isConsignNo, cb) {
            return db.scanList
                .where('[s+t+isConsignNo]')
                .equals([sheetNo, type * 1, isConsignNo])
                .first()
                .then(function (data) {
                    cb(fieldStringToJson(data));
                });
        },
        /**
         *
         * @param sheetNo
         * @param type
         * @param refId
         * @param shopId
         * @param cb
         * @returns {*}
         */
        findScanBySTRW: function (sheetNo, type, refId, shopId, cb) {
            return db.scanList
                .where('[s+t+r+w]')
                .equals([sheetNo, type * 1, refId * 1, shopId * 1])
                .first()
                .then(function (data) {
                    cb(fieldStringToJson(data));
                });
        },
        /**
         * 网点 车次 查询运单
         * @param type
         * @param refId
         * @param shopId
         * @param cb
         */
        findScanListByTRW: function (type, refId, shopId, cb) {
            db.transaction("r", db.scanList, function () {
                db.scanList
                    .where('[t+r+w]')
                    .equals([type * 1, refId * 1, shopId * 1])
                    .reverse()
                    .toArray()
                    .then(function (data) {
                        cb(fieldStringToJson(data));
                    });
            });
        },
        findScanListByType: function (type, cb) {
            return db.scanList
                .where('t')
                .equals(type * 1)
                .reverse()
                .toArray()
                .then(function (data) {
                    cb(fieldStringToJson(data));
                });
        },
        findScanById: function (id, cb) {
            return db.scanList
                .where('id')
                .equals(id)
                .first()
                .then(function (data) {
                    cb(fieldStringToJson(data));
                });
        },
        getScanList: function (type, cb) {
            return db.scanList
                .where('t')
                .equals(type * 1)
                .reverse()
                .toArray()
                .then(function (data) {
                    cb(fieldStringToJson(data));
                });
        },
        delScan: function (id, cb) {
            return db.scanList
                .delete(id)
                .then(function () {
                    cb();
                });
        },
        clearScanList: function (type, cb) {
            return db.scanList
                .where("t")
                .equals(type * 1)
                .delete()
                .then(function () {
                    cb();
                });
        },
        clearScanListByTRW: function (type, refId, shopId, cb) {
            return db.scanList
                .where('[t+r+w]')
                .equals([type * 1, refId * 1, shopId * 1])
                .delete()
                .then(function () {
                    cb();
                });
        },
        findLineBranch: function (cb) {
            return db.lineBranch
                .toArray()
                .then(function (data) {
                    cb(data);
                });
        },
        clearLineBranch: function (cb) {
            return db.lineBranch
                .clear()
                .then(function () {
                    cb();
                });
        },
        addLineBranch: function (resultArray, cb) {
            if (resultArray.length > 0) {
                var tmp = [];
                $.each(resultArray, function (i, v) {
                    var obj = v;
                    tmp.push(obj);
                });
                dbInnerManager.clearLineBranch(function () {
                    db.lineBranch
                        .bulkAdd(resultArray)
                        .then(function () {
                            dbInnerManager.findLineBranch(cb);
                        });
                });
            }
        },
        findTruck: function (cb) {
            return db.truck
                .toArray()
                .then(function (data) {
                    console.log(data);
                    cb(data);
                });
        },
        clearTruck: function (cb) {
            return db.truck
                .clear()
                .then(function () {
                    cb();
                });
        },
        addTruck: function (resultArray, cb) {
            if (resultArray.length > 0) {
                var tmp = [];
                $.each(resultArray, function (i, v) {
                    var obj = v;
                    tmp.push(obj);
                });
                dbInnerManager.clearTruck(function () {
                    db.truck
                        .bulkAdd(resultArray)
                        .then(function () {
                            dbInnerManager.findTruck(cb);
                        });
                });
            }
        },
        findDriver: function (cb) {
            return db.driver
                .toArray()
                .then(function (data) {
                    console.log(data);
                    cb(data);
                });
        },
        clearDriver: function (cb) {
            return db.driver
                .clear()
                .then(function () {
                    cb();
                });
        },
        addDriver: function (resultArray, cb) {
            if (resultArray.length > 0) {
                var tmp = [];
                $.each(resultArray, function (i, v) {
                    var obj = v;
                    tmp.push(obj);
                });
                dbInnerManager.clearDriver(function () {
                    db.driver
                        .bulkAdd(resultArray)
                        .then(function () {
                            dbInnerManager.findDriver(cb);
                        });
                });
            }
        },
        findShift: function (cb) {
            return db.shift
                .reverse()
                .toArray()
                .then(function (data) {
                    console.log(data);
                    cb(data);
                });
        },
        findShiftById: function (id, cb) {
            return db.shift
                .where('id')
                .equals(id)
                .first()
                .then(function (data) {
                    console.log(data);
                    cb(data);
                });
        },
        delShiftById: function (id, cb) {
            return db.shift
                .where('id')
                .equals(id)
                .delete()
                .then(function () {
                    cb();
                });
        },
        clearShift: function (cb) {
            return db.shift
                .clear()
                .then(function () {
                    cb();
                });
        },
        addOneShift: function (result, cb) {
            db.shift
                .add(result)
                .then(function (id) {
                    dbInnerManager.findShiftById(id, cb);
                });
        },
        addShift: function (resultArray, cb) {
            if (resultArray.length > 0) {
                var tmp = [];
                $.each(resultArray, function (i, v) {
                    var obj = v;
                    tmp.push(obj);
                });
                db.shift
                    .bulkAdd(resultArray)
                    .then(function () {
                        dbInnerManager.findShift(cb);
                    });
            }
        },
        updateShift: function (id, data, cb) {
            db.shift
                .update(id, data)
                .then(function () {
                    cb();
                });
        },
        /**
         *
         * @param loadShiftId
         * @param shopId
         * @param cb
         * @returns {*}
         */
        findLoadShift: function (loadShiftId, shopId, cb) {
            return db.loadShift
                .where('[loadShiftId+shopId]')
                .equals([loadShiftId * 1, shopId * 1])
                .first()
                .then(function (data) {
                    console.log(data);
                    cb(data);
                });
        },
        findLoadShiftById: function (id, cb) {
            return db.loadShift
                .where('id')
                .equals(id)
                .first()
                .then(function (data) {
                    console.log(data);
                    cb(data);
                });
        },
        findPickupScanList: function (cb) {
            return db.pickupScanList
                .limit(20)
                .reverse()
                .toArray()
                .then(function (data) {
                    //console.log(data);
                    cb(fieldStringToJson(data));
                });
        },
        //添加货款
        getCodScan: function (callback) {
            var defaultInfo = {
                "id": 1,
                "name": "默认扫码",
                "state": 0,
                "preNo": "",
                "printCount": 0,
                "scanList": []
            };
            db.codScanList
                .where('id')
                .equals(1)
                .first()
                .then(function (data) {
                    if (data) {
                        callback(data)
                    } else {
                        db.codScanList.add(defaultInfo).then(function () {
                            callback(defaultInfo);
                        });
                    }
                })
        },
        updateCodeScan: function (id, obj, callback) {
            db.codScanList.update(id, obj).then(function () {
                callback(obj);
            });
        },
        addPickupScan: function (param, callback) {
            param = fieldJsonToString(param);
            db.pickupScanList.add(param).then(function () {
                callback();
            });
        },
        removePickupScan: function (id, callback) {
            db.pickupScanList
                .where('id')
                .equals(id)
                .delete()
                .then(function () {
                    callback();
                });
        },
        clearPickupScan: function (callback) {
            db.pickupScanList
                .where('state')
                .equals(1)
                .delete()
                .then(function () {
                    callback();
                });
        },
        findPickupScanById: function (id, callback) {
            return db.pickupScanList
                .where('id')
                .equals(id)
                .first()
                .then(function (data) {
                    console.log(data);
                    callback(fieldStringToJson(data));
                });
        },

        /**
         * 快递扫码
         * @param id
         * @param obj
         * @param callback
         * @returns {boolean}
         */
        updatePickupScan: function (id, obj, callback) {
            obj = fieldJsonToString(obj);
            db.pickupScanList.update(id, obj).then(function () {
                callback();
            });
        },

        findAgreementList: function (cb) {
            return db.agreement
                .reverse()
                .toArray()
                .then(function (data) {
                    console.log(data);
                    cb(fieldStringToJson(data));
                });
        },
        addAgreement: function (param, callback) {
            db.agreement
                .where('id')
                .equals(param['id'])
                .first()
                .then(function (data) {
                    console.log(data);
                    if (!data) {
                        param = fieldJsonToString(param);
                        db.agreement.add(param).then(function () {
                            callback();
                        });
                    } else {
                        Core.App.alert("已经建过[" + param['company'] + "]月结单位", function () {
                            Core.Page.back();
                        });
                    }
                });
        },
        removeAgreement: function (id, callback) {
            db.agreement
                .where('id')
                .equals(id)
                .delete()
                .then(function () {
                    callback();
                });
        },
        findAgreementById: function (id, callback) {
            return db.agreement
                .where('id')
                .equals(id)
                .first()
                .then(function (data) {
                    console.log(data);
                    callback(fieldStringToJson(data));
                });
        },
        /**
         * 快递扫码
         * @param id
         * @param obj
         * @param callback
         * @returns {boolean}
         */
        updateAgreement: function (id, obj, callback) {
            obj = fieldJsonToString(obj);
            db.agreement.update(id, obj).then(function () {
                callback();
            });
        },
        addLoadShift: function (result, cb) {
            db.loadShift
                .add(result)
                .then(function (id) {
                    dbInnerManager.findLoadShiftById(id, cb);
                });
        },
        updateLoadShift: function (id, result, cb) {
            db.loadShift
                .update(id, result)
                .then(function () {
                    console.log('update' + id + "成功");
                    cb()
                });
        },
        clearLoadShift: function (refId, shopId,cb) {
            return db.loadShift
                .where('[loadShiftId+shopId]')
                .equals([refId * 1, shopId * 1])
                .delete()
                .then(function () {
                    console.log("清楚成功");
                    cb();
                });
        },
        clearDb: function (cb) {
            db.delete().catch(function (err) {
                console.error(err);
                native.showToast("删除本地数据库出错");
            }).finally(function () {
                cb()
            });
        }
    };
    window.db = db;
    window.dbInnerManager = dbInnerManager;
    module.exports = dbInnerManager;
});