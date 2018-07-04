/**
 * Created by cc on 18/06/12.
 */
define(function (require, exports, module) {
    var native = require("js/modules/hybridapi");
    var Core = require('js/modules/core/core');
    var $vue;
    var driverLoanStatus = Core.Cache.get('driverLoanStatus');
    var App = {
        init: function () {
            console.log("页面js初始化成功");
            $vue = new Vue({
                el: '#vueBound',
                data: {
                    type: "",
                    relationship: "请选择",
                    managerPhone: "",
                    cityAddressIsSet: false,
                    cityAddressProvince: "",
                    cityAddressCity: "",
                    cityAddressDistrict: "",
                    cityAddressDetail: "",
                    headstockPhoto: "",
                    tailstockPhoto: "",
                    photoTransProt: "",
                    photoAffiliatedProt: "",
                    frontOfIdCard: "",
                    behindOfIdCard: "",
                    contactIsSet: false,
                    contactName: "",
                    contactPhone: "",
                    licenseProvinceIsSet: false,
                    licenseProvince: "京",
                    carType: "",
                    carTypeName: "",
                    carTypeIsSet: false,
                    carLength: "",
                    carLengthIsSet: false
                },
                watch: {},
                methods: {
                    gotoNext: function () {

                        var addressCity = $vue.cityAddressCity;
                        var addressDetail = $("#address-detail").val();

                        var contact = $("#contractNameID").val();

                        var contactPhone = $("#contacts-phone").val();

                        var relationship = $vue.relationship;

                        var frontOfIdCard = $vue.frontOfIdCard;
                        var behindOfIdCard = $vue.behindOfIdCard;

                        if (!addressCity.length > 0) {
                            native.showToast('请选择省市区');
                            return;
                        }
                        if (!addressDetail.length > 0) {
                            native.showToast('请输入详细地址');
                            return;
                        }
                        if (!contact.length > 0) {
                            native.showToast('请输入联系人姓名');
                            return;
                        }
                        if (!contactPhone.length > 0) {
                            native.showToast('请输入联系电话');
                            return;
                        }
                        if (relationship == '请选择') {
                            native.showToast('请选择与本人关系');
                            return;
                        }
                        if (!frontOfIdCard.length > 0) {
                            native.showToast('请上传身份证正面照片');
                            return;
                        }
                        if (!behindOfIdCard.length > 0) {
                            native.showToast('请上传身份证背面照片');
                            return;
                        }

                        Core.Page.changePageName('second-step');
                    },
                    showRelationShip: function () {
                        console.log("显示亲属关系对话框");
                        $("#relationship-dialog").css("visibility", "visible");
                        $("#relationship-dialog").css("display", "inline");
                    },

                    hideRelationShip: function () {
                        console.log("隐藏亲属关系对话框");
                        $("#relationship-dialog").css("visibility", "hidden");
                        $("#relationship-dialog").css("display", "none");
                    },
                    setRelationShip: function (chooseShip) {
                        console.log("选择亲属关系");
                        $vue.relationship = chooseShip;
                        $("#relationshipID").css("color", "#333333");
                        this.hideRelationShip();
                    },
                    getCityAddress: function () {
                        native.getCityAddress(function (result) {
                            console.log(result);
                            $vue.cityAddressProvince = result['province'];
                            $vue.cityAddressCity = result['city'];
                            $vue.cityAddressDistrict = result['district'];
                            $vue.cityAddressIsSet = true;
                        });
                    },
                    getContact: function () {
                        native.getContact(function (result) {
                            console.log(result);
                            $vue.contactName = result['name'];
                            $vue.contactPhone = result['phone'];
                            $vue.contactIsSet = true;
                        });
                    },
                    requestOcr: function (type) {
                        native.requestOcr(type, function (result) {
                            console.log(result);
                            var imgElement;
                            switch (type) {
                                case 1:
                                    imgElement = document.getElementById('identify-front');
                                    imgElement.src = result['image'];
                                    $vue.frontOfIdCard = result['image'];
                                    break;
                                case 2:
                                    imgElement = document.getElementById('identify-back');
                                    imgElement.src = result['image'];
                                    $vue.behindOfIdCard = result['image'];
                                    break;
                                case 3:
                                    imgElement = document.getElementById('license-front');
                                    imgElement.src = result['image'];
                                    $vue.photoTransProt = result['image'];
                                    break;
                                case 4:
                                    imgElement = document.getElementById('license-back');
                                    imgElement.src = result['image'];
                                    $vue.photoAffiliatedProt = result['image'];
                                    break;
                                default:
                                    break;
                            }
                        });
                    },
                    selectImage: function (id) {
                        native.selectImage(function (result) {
                            console.log(result);
                            var imgElement;
                            switch (id) {
                                case 1:
                                    imgElement = document.getElementById('car-head');
                                    imgElement.src = result['smallImg'];
                                    $vue.headstockPhoto = result['bigImg'];
                                    break;
                                case 2:
                                    imgElement = document.getElementById('car-footer');
                                    imgElement.src = result['smallImg'];
                                    $vue.tailstockPhoto = result['bigImg'];
                                    break;
                                default:
                                    break;
                            }
                        });
                    },
                    getLicenseProvince: function () {
                        var name = $vue.licenseProvince;
                        native.getLicenseProvince(name, function (result) {
                            console.log(result);
                            $vue.licenseProvince = result['name'];
                            $vue.licenseProvinceIsSet = true;
                        });
                    },
                    getCarType: function () {
                        native.getCarType(function (result) {
                            console.log(result);
                            $vue.carType = result['type'];
                            $vue.carTypeName = result['name'];
                            $vue.carTypeIsSet = true;
                        });
                    },
                    getCarLength: function () {
                        native.getCarLength(function (result) {
                            console.log(result);
                            $vue.carLength = result['carLength'];
                            $vue.carLengthIsSet = true;
                        });
                    },
                    submitForm: function () {
                        var isCarLoanDriver = "0";

                        var addressProvince = $vue.cityAddressProvince;
                        var addressCity = $vue.cityAddressCity;
                        var addressDistrict = $vue.cityAddressDistrict;
                        var addressDetail = $("#address-detail").val();

                        var contact = $("#contractNameID").val();

                        var contactPhone = $("#contacts-phone").val();

                        var relationship = $vue.relationship;
                        var managerPhone = $("#manger-phone").val();

                        var frontOfIdCard = $vue.frontOfIdCard;
                        var behindOfIdCard = $vue.behindOfIdCard;

                        var headstockPhoto = $vue.headstockPhoto;
                        var tailstockPhoto = $vue.tailstockPhoto;

                        var photoTransProt = $vue.photoTransProt;
                        var photoAffiliatedProt = $vue.photoAffiliatedProt;


                        var carOwner = document.getElementsByName('carOwner');
                        var isCarOwner = "";
                        for (var i = 0; i < carOwner.length; i++) {
                            if (carOwner[i].checked) {
                                isCarOwner = carOwner[i].value;
                                break;
                            }
                        }

                        var carNum = $("#carNo").val();

                        var carNo = $vue.licenseProvince + carNum;

                        var carLength = $vue.carLength;

                        var carType = $vue.carType;

                        if (!headstockPhoto.length > 0) {
                            native.showToast('请上传车头合照');
                            return;
                        }
                        if (!tailstockPhoto.length > 0) {
                            native.showToast('请上传车尾合照');
                            return;
                        }
                        if (!photoTransProt.length > 0) {
                            native.showToast('请上传行驶证正面照片');
                            return;
                        }
                        if (!photoAffiliatedProt.length > 0) {
                            native.showToast('请上传行驶证背面照片');
                            return;
                        }
                        if (!carNo.length > 0) {
                            native.showToast('请输入车牌号码');
                            return;
                        }
                        if (!carType.length > 0) {
                            native.showToast('请选择车型');
                            return;
                        }
                        if (!carLength.length > 0) {
                            native.showToast('请选择车长');
                            return;
                        }

                        var data = {
                            isCarLoanDriver: isCarLoanDriver,
                            addressProvince: addressProvince,
                            addressCity: addressCity,
                            addressDistrict: addressDistrict,
                            addressDetail: addressDetail,
                            contact: contact,
                            contactPhone: contactPhone,
                            relationship: relationship,
                            managerPhone: managerPhone,
                            headstockPhoto: headstockPhoto,
                            tailstockPhoto: tailstockPhoto,
                            photoTransProt: photoTransProt,
                            photoAffiliatedProt: photoAffiliatedProt,
                            frontOfIdCard: frontOfIdCard,
                            behindOfIdCard: behindOfIdCard,
                            isCarOwner: isCarOwner,
                            carNo: carNo,
                            carLength: carLength,
                            carType: carType
                        };

                        var dict = {
                            url: serverAddress + '/app/driverLoan/openDriverLoan',
                            type: "post",
                            data: data,
                            isEncrypt: '1'
                        };

                        native.netWorkRequest(dict, function (result) {
                            console.log(result);
                            Core.App.alert('您的申请已成功提交，我们将在一个工作日处理！', '', function () {
                                Core.Page.changePage('driverLoanStatus.html', true);
                            });
                        });

                    }
                }
            });

            this.getDriverLoanInfo();
        },
        getDriverLoanInfo: function () {
            if (driverLoanStatus == '0') {//未申请
                native.getUserInfoImage(function (result) {

                    var IDFront = result['IDFront'];
                    var IDReverse = result['IDReverse'];
                    var TransProt = result['TransProt'];
                    var AffiliatedProt = result['AffiliatedProt'];
                    var isOwner = result['isOwner'];
                    var carNoProvince = result['carNoProvince'];
                    var carNoNum = result['carNoNum'];
                    var carLength = result['carLength'];
                    var carType = result['carType'];
                    var carName = result['carName'];

                    if (IDFront.length > 0) {
                        var imgElement = document.getElementById('identify-front');
                        imgElement.src = IDFront;
                        $vue.frontOfIdCard = IDFront;
                    }
                    if (IDReverse.length > 0) {
                        var imgElement = document.getElementById('identify-back');
                        imgElement.src = IDReverse;
                        $vue.behindOfIdCard = IDReverse;
                    }

                    if (TransProt.length > 0) {
                        var imgElement = document.getElementById('license-front');
                        imgElement.src = TransProt;
                        $vue.photoTransProt = TransProt;
                    }
                    if (AffiliatedProt.length > 0) {
                        var imgElement = document.getElementById('license-back');
                        imgElement.src = AffiliatedProt;
                        $vue.photoAffiliatedProt = AffiliatedProt;
                    }

                    var carOwner = document.getElementsByName('carOwner');
                    for (var i = 0; i < carOwner.length; i++) {
                        if (carOwner[i].value == isOwner) {
                            carOwner[i].checked = true;
                        }
                    }


                    $vue.licenseProvince = carNoProvince;
                    document.getElementById("carNo").value = carNoNum;
                    $vue.licenseProvinceIsSet = true;

                    $vue.carLength = carLength;
                    $vue.carLengthIsSet = true;

                    $vue.carType = carType;
                    $vue.carTypeName = carName;
                    $vue.carTypeIsSet = true;

                });

            } else if (driverLoanStatus == '-1') {//被拒绝

                var returnReason = Core.Cache.get('returnReason');
                var flag1 = 0;
                var flag2 = 0;
                var flag3 = 0;
                var flag4 = 0;
                var flag5 = 0;
                var flag6 = 0;
                for (var i=0;i<returnReason.length;i++)
                {
                    if (returnReason[i].key == 1)
                    {
                        flag1 = 1;
                    }else if (returnReason[i].key == 2)
                    {
                        flag2 = 1;
                    }else if (returnReason[i].key == 3)
                    {
                        flag3 = 1;
                    }else if (returnReason[i].key == 4)
                    {
                        flag4 = 1;
                    }else if (returnReason[i].key == 5)
                    {
                        flag5 = 1;
                    }else if (returnReason[i].key == 6)
                    {
                        flag6 = 1;
                    }
                }

                Core.Service.get('app/driverLoan/getOpenDriverLoanInfo',{

                },function (result) {

                    var content = result['content'];

                    $vue.cityAddressProvince = content['addressProvince'];
                    $vue.cityAddressCity = content['addressCity'];
                    $vue.cityAddressDistrict = content['addressDistrict'];
                    $vue.cityAddressIsSet = true;
                    document.getElementById("address-detail").value = content['addressDetail'];

                    $vue.contactName = content['contact'];
                    $vue.contactPhone = content['contactPhone'];
                    $vue.contactIsSet = true;

                    $vue.relationship = content['relationship'];
                    $("#relationshipID").css("color", "#333333");
                    $("#relationship-dialog").css("visibility", "hidden");
                    $("#relationship-dialog").css("display", "none");

                    if (content['managerPhone']!='undefined' && content['managerPhone'].length>0)
                    {
                        document.getElementById("manger-phone").value = content['managerPhone'];
                    }
                    
                    if (flag5 == 1)
                    {
                        var headNoteTop = document.getElementById("head-note-top");
                        headNoteTop.innerText = '重新上传车头照片';

                        var headNoteBottom = document.getElementById("head-note-bottom");
                        headNoteBottom.innerText = '（车头合照有误）';
                        $("#head-note-bottom").css("color", "#ff0000");

                    }else
                    {
                        var imgElement = document.getElementById('car-head');
                        imgElement.src = content['headstockPhoto'];
                        $vue.headstockPhoto = content['headstockPhoto'];
                    }

                    if (flag6 == 1)
                    {
                        var footerNoteTop = document.getElementById("footer-note-top");
                        footerNoteTop.innerText = '重新上传车尾照片';

                        var footeNoteBottom = document.getElementById("footer-note-bottom");
                        footeNoteBottom.innerText = '（车尾合照有误）';
                        footeNoteBottom.setAttribute("color", '#ff0000');

                    }else
                    {
                        var imgElement = document.getElementById('car-footer');
                        imgElement.src = content['tailstockPhoto'];
                        $vue.tailstockPhoto = content['tailstockPhoto'];
                    }

                    native.getUserInfoImage(function (result) {

                        var IDFront = result['IDFront'];
                        var IDReverse = result['IDReverse'];
                        var TransProt = result['TransProt'];
                        var AffiliatedProt = result['AffiliatedProt'];
                        var isOwner = result['isOwner'];
                        var carNoProvince = result['carNoProvince'];
                        var carNoNum = result['carNoNum'];
                        var carLength = result['carLength'];
                        var carType = result['carType'];
                        var carName = result['carName'];

                        if (flag1 == 1)
                        {
                            var imgElement = document.getElementById('identify-front');
                            imgElement.src = '../img/app/icon_identify_front_refuse.png';
                        }else
                        {
                            if (IDFront.length > 0) {
                                var imgElement = document.getElementById('identify-front');
                                imgElement.src = IDFront;
                                $vue.frontOfIdCard = IDFront;
                            }
                        }

                        if (flag2 == 1)
                        {
                            var imgElement = document.getElementById('identify-back');
                            imgElement.src = '../img/app/icon_identify_back_refuse.png';
                        }else
                        {
                            if (IDReverse.length > 0) {
                                var imgElement = document.getElementById('identify-back');
                                imgElement.src = IDReverse;
                                $vue.behindOfIdCard = IDReverse;
                            }
                        }

                        if (flag3 == 1)
                        {
                            var imgElement = document.getElementById('license-front');
                            imgElement.src = '../img/app/icon_driverlicense_front_refuse.png';
                        }else
                        {
                            if (TransProt.length > 0) {
                                var imgElement = document.getElementById('license-front');
                                imgElement.src = TransProt;
                                $vue.photoTransProt = TransProt;
                            }
                        }

                        if (flag4)
                        {
                            var imgElement = document.getElementById('license-back');
                            imgElement.src = '../img/app/icon_driverlicense_back_refuse.png';
                        }else
                        {
                            if (AffiliatedProt.length > 0) {
                                var imgElement = document.getElementById('license-back');
                                imgElement.src = AffiliatedProt;
                                $vue.photoAffiliatedProt = AffiliatedProt;
                            }
                        }


                        var carOwner = document.getElementsByName('carOwner');
                        for (var i = 0; i < carOwner.length; i++) {
                            if (carOwner[i].value == isOwner) {
                                carOwner[i].checked = true;
                            }
                        }

                        $vue.licenseProvince = carNoProvince;
                        document.getElementById("carNo").value = carNoNum;
                        $vue.licenseProvinceIsSet = true;

                        $vue.carLength = carLength;
                        $vue.carLengthIsSet = true;

                        $vue.carType = carType;
                        $vue.carTypeName = carName;
                        $vue.carTypeIsSet = true;
                        
                        if (flag1 == 0 && flag2 == 0)
                        {
                            if (flag3 == 1 || flag4 == 1 || flag5 == 1 || flag6==1)
                            {
                                Core.Page.changePageName('second-step');
                            }
                        }

                    });

                },function (error) {
                    if (typeof error !== 'undefined'
                        && typeof error['msg'] !== 'undefined') {
                        console.log(error['msg']);
                        native.showToast(error['msg']);
                    }else
                    {
                        native.showToast('网络不给力，请稍后重试！');
                    }
                });
            }
        },
    }


    window.App = App;
    // window.refresh = App.findApplyList;
    Core.init(App);
    module.exports = App;
});