/**
 * Created by denonzhu on 15/12/14.
 */
define(function (require, exports, module) {
    "use strict";
    var Core = require('js/modules/core/core');
    var native = require('js/modules/hybridapi');
    var echarts = window.echarts;
    var $vue;
    var calendar,calendar1;
    var barChart,barChart1;
    var reportParam;
    var App = {
        init: function () {
            console.log("页面js初始化成功");

            var today = (new Date()).Format('yyyy-MM-dd');
            calendar = Core.Utils.initRangeDatePicker("#calendar-disabled", function () {
                //防止无限调用ajax请求
                setTimeout(function () {
                    App.initLineChart();
                }, 100);
            });
            calendar1 = Core.Utils.initRangeDatePicker("#calendar-disabled1", function () {
                //防止无限调用ajax请求
                setTimeout(function () {
                     App.initLineChart1($vue.detailTitle);
                }, 100);
            });
            var endTime = today + " - " + today;
            console.log(endTime);

            $vue = new Vue({
                el: '#vueBound',
                data: {
                    title: "",
                    endTime: "",
                    data: [],
                    bars: [],
                    xAxis: [],
                    key: "",

                    detailTitle:"",
                    endTime1:"",
                    data1:[],
                    xAxis1:[],
                    bars1: [],
                    key1:""
                },
                watch: {},
                methods: {
                    showCalendar: function (type) {
                        setTimeout(function () {
                            if(type==1){
                                calendar1.open();
                            }else{
                                calendar.open();
                            }
                        }, 100);
                    },
                    show: function (key) {
                        App.renderChart(key);
                    },
                    showDetail:function(key){
                        App.renderDetailChart(key);
                    }
                }
            });
            barChart = echarts.init(document.getElementById('barChart'));
            barChart1 = echarts.init(document.getElementById('barChart1'));
            $vue.endTime = endTime;

            App.initLineChart();
            this.initEvent();
        },
        initLineChart: function () {
            reportParam = Core.Cache.get('reportParam');
            if (!reportParam) {
                native.showToast("页面参数错误");
                Core.Page.back();
                return false;
            }
            $vue.title = reportParam['name'];
            var rangeTimeArray = $vue.endTime.split(' - ');
            var start = rangeTimeArray[0] + " 00:00:00";
            var end = rangeTimeArray[1] + " 23:59:59";
            Core.Service.get('api/auth/v1/ltl/financeReport/' + reportParam['api'], {
                beginTime: start,
                endTime: end
            }, function (result) {
                if (result['data'].length > 0) {
                    $vue.data = result['data'];
                    var tmp = [];
                    $.each($vue.data, function (k, v) {
                        tmp.push(v['xAxis']);
                    });
                    $vue.xAxis = tmp;
                    $vue.bars = [];
                    $.each(result['data'][0], function (k) {
                        if (k != 'xAxis') {
                            $vue.bars.push(k);
                        }
                    });
                    App.renderChart($vue.bars[0])
                } else {
                   native.showToast("没有数据");
                }
            });

        },
        initLineChart1:function(name){
            var rangeTimeArray = $vue.endTime1.split(' - ');
            var start = rangeTimeArray[0] + " 00:00:00";
            var end = rangeTimeArray[1] + " 23:59:59";
            Core.Service.get('api/auth/v1/ltl/financeReport/' + reportParam['detailApi'], {
                key:name,
                beginTime: start,
                endTime: end
            }, function (result) {
                if (result['data'].length > 0) {
                    $vue.data1 = result['data'];
                    var tmp = [];
                    $.each($vue.data1, function (k, v) {
                        tmp.push(v['xAxis']);
                    });
                    $vue.xAxis1 = tmp;
                    $vue.bars1 = [];
                    $.each(result['data'][0], function (k) {
                        if (k != 'xAxis') {
                            $vue.bars1.push(k);
                        }
                    });
                    App.renderDetailChart($vue.bars1[0])
                } else {
                   native.showToast("没有数据");
                }
            });
        },
        renderChart: function (key) {
            var data = [];
            $vue.key = key;
            var count = 0;
            $.each($vue.data, function (k, v) {
                if (v[key] !== undefined) {
                    data.push(v[key]);
                    count += v[key];
                }
            });
            if (data.length == 0) {
                data.push('-');
            }
            var fee = {
                //name: key,
                itemStyle: {
                    normal: {
                        color: "rgb(189, 44, 53)"
                    }
                },
                type: 'bar',
                barWidth: "20",
                smooth: false,
                label: {
                    normal: {
                        show: true,
                        position: 'right'
                    }
                },
                data: data
            };
            var option = {
                title: {
                    text: "总" + key + ":" + count,
                    textStyle: {
                        color: "rgba(255,255,255,0.8)",
                        fontSize: "16"
                    },
                    top: 10
                },
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {            // 坐标轴指示器，坐标轴触发有效
                        type: 'shadow'        // 默认为直线，可选为：'line' | 'shadow'
                    },
                    formatter: '{b}<br/>' + key + ':{c}'
                },
                grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '3%',
                    containLabel: true
                },
                xAxis: [
                    {
                        type: 'value',
                        splitLine: {
                            show: true,
                            lineStyle: {
                                type: "dashed",
                                color: "rgba(255,255,255,0.8)"
                            }
                        },
                        axisTick: {
                            show: false
                        },
                        axisLine: {
                            show: false
                        },
                        boundaryGap: 0,
                        axisLabel: {
                            textStyle: {
                                color: "rgba(255,255,255,0.8)"
                            }
                        }
                    }
                ],
                yAxis: [
                    {
                        type: 'category',
                        data: $vue.xAxis,
                        axisLine: {
                            show: false
                        },
                        axisTick: {
                            show: false
                        },
                        axisLabel: {
                            textStyle: {
                                color: "rgba(255,255,255,0.8)"
                            },
                            rotate: 45
                        }
                    }
                ],
                series: [fee]
            };
            barChart.setOption(option);
            $("#barChart").css({
                'height': data.length * 40 + "px"
            });
            barChart.resize();
        },
        renderDetailChart: function (key) {
            Core.Page.changePageName('detailChart');
            var data = [];
            $vue.key1 = key;
            var count = 0;
            $.each($vue.data1, function (k, v) {
                if (v[key] !== undefined) {
                    data.push(v[key]);
                    count += v[key];
                }
            });
            if (data.length == 0) {
                data.push('-');
            }
            var fee = {
                itemStyle: {
                    normal: {
                        color: "rgb(189, 44, 53)"
                    }
                },
                type: 'bar',
                barWidth: "20",
                smooth: false,
                label: {
                    normal: {
                        show: true,
                        position: 'right'
                    }
                },
                data: data
            };
            var option = {
                title: {
                    text: "总" + key + ":" + count,
                    textStyle: {
                        color: "rgba(255,255,255,0.8)",
                        fontSize: "16"
                    },
                    top: 10
                },
                dataZoom: [
                    {
                        show: true,
                        start: 30,
                        end: 70,
                        xAxisIndex: [0]
                    },
                    {
                        type: 'inside',
                        start: 30,
                        end: 70,
                        xAxisIndex: [0]
                    }
                ],
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {            // 坐标轴指示器，坐标轴触发有效
                        type: 'shadow'        // 默认为直线，可选为：'line' | 'shadow'
                    },
                    formatter: '{b}<br/>' + key + ':{c}'
                },
                grid: {
                    left: '3%',
                    right: '4%',
                    containLabel: true
                },
                yAxis: [
                    {
                        type: 'value',
                        splitLine: {
                            show: true,
                            lineStyle: {
                                type: "dashed",
                                color: "rgba(255,255,255,0.8)"
                            }
                        },
                        axisTick: {
                            show: false
                        },
                        axisLine: {
                            show: false
                        },
                        boundaryGap: 0,
                        axisLabel: {
                            textStyle: {
                                color: "rgba(255,255,255,0.8)"
                            }
                        }
                    }
                ],
                xAxis: [
                    {
                        type: 'category',
                        data: $vue.xAxis1,
                        axisLine: {
                            show: false
                        },
                        axisTick: {
                            show: false
                        },
                        axisLabel: {
                            textStyle: {
                                color: "rgba(255,255,255,0.8)"
                            }
                        }
                    }
                ],
                series: [fee]
            };
            barChart1.setOption(option);
           /* $("#barChart1").css({
                'height': data.length * 40 + "px"
            });*/
            barChart1.resize();
        },
        initEvent: function () {
            $('body').on('refresh', '.pull-to-refresh-content', function () {
                App.initLineChart();
            }).on('click', '.panel a', function () {
                if ($(this).data('name') != $vue.title) {
                    Core.Cache.set('reportParam', {
                        api: $(this).data('val'),
                        name: $(this).data('name'),
                        detailApi:$(this).data('detail')
                    });
                    App.initLineChart();
                }
            });
            barChart.on('click', function (params) {
                if(reportParam['detailApi']){
                    $vue.detailTitle = params.name;
                    $vue.endTime1 = $vue.endTime+"";
                    App.initLineChart1(params.name);
                }
            });
        }
    };
    window.refresh = App.initLineChart;
    Core.init(App);
    module.exports = App;
});