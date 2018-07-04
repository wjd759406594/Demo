var appVersion = '6',//C8
    appName = 'T' + appVersion,
    version = "1.0.2",
    env = "debug",
    pageSize = 20,
    sheetLength = 12,
    // Commented by wwp for debug
    // checkUpdateTime = 2 * 60 * 60 * 1000,
    checkUpdateTime = 30 * 60 * 1000,
    timeOut = 60;//请求超时时间
var userId = localStorage.getItem('userId');
var dataBaseName = userId ? "t6_" + userId : false;

var basePath = (function () {
    var pagePath = location.href.match(/[a-zA-Z0-9:_./\-]*\/views\//)[0];
    return pagePath.replace('/views/', '/');
})();

function getUrlParam(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)"); //构造一个含有目标参数的正则表达式对象
    var r = window.location.search.substr(1).match(reg);  //匹配目标参数
    if (r != null) return unescape(r[2]);
    return null; //返回参数值
}


Parse.initialize("No9gLQqPRp9EYApXvuNgY9MNY7ey", "ZgteJYWkgU86sYpW4xWZiNX2sajH");
Parse.serverURL = "http://106.75.10.127:1337/1";

var serverAddress = "https://api.yudianbank.com:6014";

if (location.host.startsWith('localhost') || location.host.startsWith('192.')) {
    version = "9.9.9";
    env = "debug localhost";
    Parse.serverURL = "http://106.75.10.127:1337/1";
    serverAddress = "https://api.yudianbank.com:6014";
}

seajs.config({
    base: basePath
});

function connectWebViewJavascriptBridge(callback) {
    if (window.WebViewJavascriptBridge) {
        callback(WebViewJavascriptBridge)
    } else {
        document.addEventListener('WebViewJavascriptBridgeReady', function () {
            callback(WebViewJavascriptBridge)
        }, false)
    }
    window.WVJBCallbacks = [callback];
    var WVJBIframe = document.createElement('iframe');
    WVJBIframe.style.display = 'none';
    WVJBIframe.src = 'https://__bridge_loaded__';
    document.documentElement.appendChild(WVJBIframe);
    setTimeout(function () {
        document.documentElement.removeChild(WVJBIframe)
    }, 0)
}

if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (searchString, position) {
        position = position || 0;
        return this.substr(position, searchString.length) === searchString;
    };
}
if (!String.prototype.endsWith) {
    String.prototype.endsWith = function (searchString, position) {
        var subjectString = this.toString();
        if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
            position = subjectString.length;
        }
        position -= searchString.length;
        var lastIndex = subjectString.indexOf(searchString, position);
        return lastIndex !== -1 && lastIndex === position;
    };
}
var Base64 = {
    _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", encode: function (e) {
        var t = "";
        var n, r, i, s, o, u, a;
        var f = 0;
        e = Base64._utf8_encode(e);
        while (f < e.length) {
            n = e.charCodeAt(f++);
            r = e.charCodeAt(f++);
            i = e.charCodeAt(f++);
            s = n >> 2;
            o = (n & 3) << 4 | r >> 4;
            u = (r & 15) << 2 | i >> 6;
            a = i & 63;
            if (isNaN(r)) {
                u = a = 64
            } else if (isNaN(i)) {
                a = 64
            }
            t = t + this._keyStr.charAt(s) + this._keyStr.charAt(o) + this._keyStr.charAt(u) + this._keyStr.charAt(a)
        }
        return t
    }, decode: function (e) {
        var t = "";
        var n, r, i;
        var s, o, u, a;
        var f = 0;
        e = e.replace(/[^A-Za-z0-9+/=]/g, "");
        while (f < e.length) {
            s = this._keyStr.indexOf(e.charAt(f++));
            o = this._keyStr.indexOf(e.charAt(f++));
            u = this._keyStr.indexOf(e.charAt(f++));
            a = this._keyStr.indexOf(e.charAt(f++));
            n = s << 2 | o >> 4;
            r = (o & 15) << 4 | u >> 2;
            i = (u & 3) << 6 | a;
            t = t + String.fromCharCode(n);
            if (u != 64) {
                t = t + String.fromCharCode(r)
            }
            if (a != 64) {
                t = t + String.fromCharCode(i)
            }
        }
        t = Base64._utf8_decode(t);
        return t
    }, _utf8_encode: function (e) {
        e = e.replace(/rn/g, "n");
        var t = "";
        for (var n = 0; n < e.length; n++) {
            var r = e.charCodeAt(n);
            if (r < 128) {
                t += String.fromCharCode(r)
            } else if (r > 127 && r < 2048) {
                t += String.fromCharCode(r >> 6 | 192);
                t += String.fromCharCode(r & 63 | 128)
            } else {
                t += String.fromCharCode(r >> 12 | 224);
                t += String.fromCharCode(r >> 6 & 63 | 128);
                t += String.fromCharCode(r & 63 | 128)
            }
        }
        return t
    }, _utf8_decode: function (e) {
        var t = "";
        var n = 0;
        var r = c1 = c2 = 0;
        while (n < e.length) {
            r = e.charCodeAt(n);
            if (r < 128) {
                t += String.fromCharCode(r);
                n++
            } else if (r > 191 && r < 224) {
                c2 = e.charCodeAt(n + 1);
                t += String.fromCharCode((r & 31) << 6 | c2 & 63);
                n += 2
            } else {
                c2 = e.charCodeAt(n + 1);
                c3 = e.charCodeAt(n + 2);
                t += String.fromCharCode((r & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
                n += 3
            }
        }
        return t
    }
};
/**
 * 对Date的扩展，将 Date 转化为指定格式的String
 * 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，
 * 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
 * @param fmt
 * @returns {*}
 * @constructor
 * @example
 * (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
 * (new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18
 *
 */
Date.prototype.Format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
};
/**
 * 获取前几天
 * @param day {int}
 * @param flag
 * @param startDate
 * @returns {*}
 * @constructor
 */
Date.prototype.GetDay = function (day, flag, startDate) {
    day = day - 1;
    var endText = " 00:00:00";
    if (flag == 'end') {
        endText = " 23:59:59";
    } else if (flag == 'none') {
        endText = "";
    }
    var startTime = startDate ? (new Date(startDate)).getTime() : this.getTime();
    var newDay = new Date(startTime - 1000 * 60 * 60 * 24 * day);
    return newDay.Format("yyyy-MM-dd") + endText;
};
/**
 * 删除数组第n个值
 * @param dx
 * @returns {boolean}
 */
Array.prototype.remove = function (dx) {
    if (isNaN(dx) || dx > this.length) {
        return false;
    }
    for (var i = 0, n = 0; i < this.length; i++) {
        if (this[i] != this[dx]) {
            this[n++] = this[i]
        }
    }
    this.length -= 1
};

/**
 * 生成guid
 * @returns {string}
 */
function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}


if (window.Vue) {
    Vue.config.devtools = true;
    Vue.filter('countInput', function (item) {
        var count = item['l'].length;
        if (item['i'] && item['i'].length > 0) {
            $.each(item['i'], function (i, v) {
                count += v['a'] * 1;
            });
        }
        return count;
    });
    Vue.filter('goodsCount', function (goods) {
        var count = 0;
        if (goods.length > 0) {
            $.each(goods, function (i, v) {
                count += v['goodsAmount'] * 1;
            });
        }
        return count;
    });
    Vue.filter('scanGoodsCount', function (scanLists) {
        var count = 0;
        if (scanLists.length > 0) {
            $.each(scanLists, function (i, v) {
                count += v['inputCount'] * 1 + v['labelCount'] * 1;
            });
        }
        return count;
    });

    Vue.filter('inputGoodsCount', function (scanLists) {
        var count = 0;
        if (scanLists.length > 0) {
            $.each(scanLists, function (i, v) {
                count += v['inputCount'] * 1;
            });
        }
        return count;
    });

    Vue.filter('sort', function (item) {
        console.log(1);
        return item;
        /*  item = item + "";
         if (item.length > 0) {
         return "*********" + item.substr(item.length - 4, item.length);
         }

         scanLabelList.sort(function(m,n){
         return m.l*1>n.l*1;
         });*/
    });


    Vue.filter('fmtBank', function (item) {
        return Core.Utils.fmtBankNo(item);
    });

    Vue.filter('toArray', function (data) {
            var tmp = [];
            try {
                if (typeof data == 'string') {
                    tmp = JSON.parse(data);
                }
                if ($.isArray(data)) {
                    tmp = data;
                }
            } catch (e) {
                console.log(e);
            }
            return tmp;
        }
    );
    Vue.filter('money', function (num) {
        //noinspection JSDuplicatedDeclaration
        if (num) {
            var num = num + "";
            return num.indexOf('.') > -1 ? num : num + ".0";
        } else {
            return '0.0';
        }
    });
    Vue.filter('reviewState', function (reviewState) {
        var msg = "";
        switch (reviewState) {
            case 2:
                msg = "不通过";
                break;
            case 3:
                msg = "已通过";
                break;
            default:
                msg = "待审核";
                break;

        }
        return msg;
    });


    Vue.filter('fee', function (sheet) {
        var text = "";
        if (!sheet) {
            return "";
        }
        switch (sheet['paymentMethod']) {
            //1-现付，2-提付，3-发货月结，4-收货月结，5-回单付，6-货款扣，8-现付提付，10-现付回付 11.提付回付
            case 1:
                text = sheet['paymentMethodDesc'] + sheet['nowPayFee'];
                break;
            case 2:
                text = sheet['paymentMethodDesc'] + sheet['pickPayFee'];
                break;
            case 3:
                text = sheet['paymentMethodDesc'] + sheet['fromCustomerMonthFee'];
                break;
            case 4:
                text = sheet['paymentMethodDesc'] + sheet['toCustomerMonthFee'];
                break;
            case 5:
                text = sheet['paymentMethodDesc'] + sheet['backPayFee'];
                break;
            case 6:
                text = sheet['paymentMethodDesc'] + sheet['codPayFee'];
                break;
            case 8:
                text = "现付" + sheet['nowPayFee'] + " 提付" + sheet['pickPayFee'];
                break;
            case 10:
                text = "现付" + sheet['nowPayFee'] + " 回单付" + sheet['backPayFee'];
                break;
            case 11:
                text = "提付" + sheet['pickPayFee'] + " 回单付" + sheet['backPayFee'];
                break;
            default:
                break;
        }
        return text;
    });

    Vue.filter('date', function (item) {
        return (new Date(item)).Format("yyyy-MM-dd hh:mm:ss");
    });
}