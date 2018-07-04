/**
 * Created by denonzhu on 15/12/14.
 */
define(function (require, exports, module) {
    "use strict";
    var Core = require('js/modules/core/core');
    var native = require('js/modules/hybridapi');
    var echarts = window.echarts;
    var $vue;
    var calendar;
    var lineChart, lineChart1, pieChart;
    var App = {
        init: function () {
            console.log("页面js初始化成功");

            var today = (new Date()).Format('yyyy-MM-dd');
            var startDate = (new Date()).GetDay(1, 'none');
            var endTime = startDate + " - " + today;
            calendar = Core.Utils.initRangeDatePicker("#calendar-disabled", function () {
                //防止无限调用ajax请求
                setTimeout(function () {
                    App.initChart();
                }, 100);
            });

            $vue = new Vue({
                el: '#vueBound',
                data: {
                    endTime: "",
                    rangeTime: "",
                    summary: ""
                },
                watch: {},
                methods: {
                    showCalendar: function () {
                        setTimeout(function () {
                            calendar.open();
                        }, 100);
                    }
                }
            });

            lineChart = echarts.init(document.getElementById('lineChart'));
            lineChart1 = echarts.init(document.getElementById('lineChart1'));
            pieChart = echarts.init(document.getElementById('pieChart'));
            $vue.endTime = endTime;
            this.initChart();
            this.initLineChart();
            this.initEvent();
        },
        initChart: function () {
            var rangeTimeArray = $vue.endTime.split(' - ');
            var start = rangeTimeArray[0] + " 00:00:00";
            var end = rangeTimeArray[1] + " 23:59:59";
            Core.Service.get('api/auth/v1/sys/dashboard/company/summary', {
                beginTime: start,
                endTime: end
            }, function (result) {
                if (result['data'].length > 0) {
                    $('#pieChart').show();
                    $vue.summary = result['data'][0];
                    var data = [];
                    $.each(result['data'][0], function (k, v) {
                        if ((k == "现付" || k == "提付" || k == "发货月结" || k == "收货月结" || k == "回单付" || k == "货款扣") && v > 0) {
                            data.push({
                                name: k,
                                value: v
                            });
                        }
                    });
                    pieChart.setOption({
                        title: {
                            text: "运费构成",
                            textStyle: {
                                color: "#333333",
                                fontSize: "16"
                            }
                        },
                        animationDuration: 1500,
                        tooltip: {
                            trigger: 'item',
                            formatter: "{b}<br/>{c}({d}%)"
                        },
                        series: [
                            {
                                type: 'pie',
                                radius: '70%',
                                center: ['50%', '60%'],
                                data: data
                            }
                        ]
                    });

                } else {
                    $vue.summary = "";
                    $('#pieChart').hide();
                    native.showToast($vue.endTime + "没有汇总数据");
                }

            });
        },
        initLineChart: function () {
            var totalFee;
            var jixiao;
            var data;
            Core.Service.get('api/auth/v1/sys/dashboard/company/analysis', {
                beginTime: (new Date()).GetDay(7, 'start'),
                endTime: (new Date()).GetDay(1, 'end')
            }, function (result) {
                if (result['data']['data'].length > 0) {
                    $.each(result['data']['data'], function (k, v) {
                        if (v['name'] == '总运费') {
                            totalFee = v;
                        } else if (v['name'] == '业绩') {
                            jixiao = v;
                        }
                    });
                    var data = totalFee['data'];
                    lineChart.setOption({
                        title: {
                            text: "近七日运费走势",
                            textStyle: {
                                color: "#333333",
                                fontSize: "16"
                            }
                        },
                        animationDuration: 1500,
                       /* dataZoom: [
                            {
                                show: true,
                                //realtime: true,
                                start: 30,
                                end: 70,
                                xAxisIndex: [0]
                            },
                            {
                                type: 'inside',
                                //  realtime: true,
                                start: 30,
                                end: 70,
                                xAxisIndex: [0]
                            }
                        ],*/
                        series: [{
                            name: "运费",
                            type: "line",
                            smooth: !0,
                            itemStyle: {
                                normal: {
                                    color: "#333333"
                                }
                            },
                            areaStyle: {
                                normal: {
                                    color: "#ECF8FF"
                                }
                            },
                            label: {
                                normal: {
                                    show: true,
                                    position: 'top'
                                }
                            },
                            lineStyle: {
                                normal: {
                                    width: 1,
                                    color: "#2F81E8"
                                }
                            },
                            data: totalFee['data']
                        }],
                        xAxis: [{
                            type: "category",
                            splitLine: {
                                show: true,
                                lineStyle: {
                                    type: "dashed",
                                    color: "#2F81E8"
                                }
                            },
                            axisLine: {
                                show: false
                            },
                            axisTick: {
                                show: true
                            },
                            data: result['data']['xAxis'],
                            boundaryGap: 1,
                            axisLabel: {
                                textStyle: {
                                    color: "#333333"
                                }
                            }
                        }],
                        yAxis: [{
                            type: "value",
                            show: false
                        }],
                        grid: {
                            borderWidth: 0,
                            x: 20,
                            y: 40,
                            x2: 20,
                            y2: 40
                        }
                    });
                    lineChart1.setOption({
                        title: {
                            text: "近七日业绩走势",
                            textStyle: {
                                color: "#333333",
                                fontSize: "16"
                            }
                        },
                        animationDuration: 1500,
                       /* dataZoom: [
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
                        ],*/
                        series: [{
                            name: "业绩",
                            type: "line",
                            smooth: !0,
                            itemStyle: {
                                normal: {
                                    color: "#333333"
                                }
                            },
                            areaStyle: {
                                normal: {
                                    color: "#ECF8FF"
                                }
                            },
                            label: {
                                normal: {
                                    show: true,
                                    position: 'top'
                                }
                            },
                            lineStyle: {
                                normal: {
                                    width: 1,
                                    color: "#2F81E8"
                                }
                            },
                            data: jixiao['data']
                        }],
                        xAxis: [{
                            type: "category",
                            splitLine: {
                                show: true,
                                lineStyle: {
                                    type: "dashed",
                                    color: "#2F81E8"
                                }
                            },
                            axisLine: {
                                show: false
                            },
                            axisTick: {
                                show: true
                            },
                            data: result['data']['xAxis'],
                            boundaryGap: 1,
                            axisLabel: {
                                textStyle: {
                                    color: "#333333"
                                }
                            }
                        }],
                        yAxis: [{
                            type: "value",
                            show: false
                        }],
                        grid: {
                            borderWidth: 0,
                            x: 20,
                            y: 40,
                            x2: 20,
                            y2: 40
                        }
                    });

                } else {
                    native.showToast("没有数据");
                }
            });

        },
        initEvent: function () {
            $('body').on('refresh', '.pull-to-refresh-content', function () {
                App.initChart();
            }).on('click', '.panel a', function () {
                Core.Cache.set('reportParam', {
                    api: $(this).data('val'),
                    name: $(this).data('name'),
                    detailApi:$(this).data('detail')
                });
                Core.Page.changePage("barReport.html", true);
            });
        }
    };
    //window.refresh = App.initChart;
    Core.init(App);
    module.exports = App;
});