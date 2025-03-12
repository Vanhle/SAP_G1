sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/ui/model/json/JSONModel",
    "sap/viz/ui5/data/FlattenedDataset",
    "sap/viz/ui5/format/ChartFormatter",
    "sap/viz/ui5/api/env/Format",
    "sap/ui/model/BindingMode",
    "sap/m/DateRangeSelection"
], function (Controller, ODataModel, JSONModel, BindingMode, FlattenedDataset, ChartFormatter, Format, DateRangeSelection) {
    "use strict";

    return Controller.extend("overviewdashboard.projectdashboard.controller.OverviewDashboard", {
        onInit: function () {
            // Sử dụng ODataModel để kết nối với OData service
            var oDataModel = new ODataModel("/sap/opu/odata/sap/ZL253_TEST_SM20_SEGW_SRV/");
            this.getView().setModel(oDataModel, "dataModel");

            // Gọi TriggerZG1SALV trước
            oDataModel.callFunction("/TriggerZG1SALV", {
                method: "POST",
                success: function () {
                    // Sau khi trigger thành công, gọi tiếp API lấy dữ liệu cho biểu đồ
                    this.loadChartData(oDataModel);
                }.bind(this),
                error: function (oError) {
                    console.error("Error triggering ZG1SALV", oError);
                    // Nếu có lỗi vẫn tiếp tục load dữ liệu
                    this.loadChartData(oDataModel);
                }.bind(this)
            });

            // Set default date range
            var oDateRange = this.byId("dateRangeSelection");
            var oEndDate = new Date();
            var oStartDate = new Date();
            oStartDate.setDate(oStartDate.getDate() - 7);
            oDateRange.setDateValue(oStartDate);
            oDateRange.setSecondDateValue(oEndDate);
        },
        // Tách phần load dữ liệu biểu đồ ra thành hàm riêng
        getCurrentDateTime: function() {
            var currentDate = new Date();
            var year = currentDate.getFullYear();
            var month = String(currentDate.getMonth() + 1).padStart(2, '0');
            var day = String(currentDate.getDate()).padStart(2, '0');
            // var hours = String(currentDate.getHours()).padStart(2, '0');
            // var minutes = String(currentDate.getMinutes()).padStart(2, '0');
            // var seconds = String(currentDate.getSeconds()).padStart(2, '0');
            
            return `${year}-${month}-${day}T17:00:00`;
        },

        getStartDateTime: function() {
            var startDate = new Date();
            startDate.setDate(startDate.getDate() - 7); // Trừ đi 7 ngày
            // startDate.setHours(0, 0, 0, 0); // Set giờ về 00:00:00
            
            // Tạo string datetime với offset +07:00
            var year = startDate.getFullYear();
            var month = String(startDate.getMonth() + 1).padStart(2, '0');
            var day = String(startDate.getDate()).padStart(2, '0');
            
            return `${year}-${month}-${day}T00:00:00`;
        },

        getCurrentTime: function() {
            var now = new Date();
            var hours = String(now.getHours()).padStart(2, '0');
            var minutes = String(now.getMinutes()).padStart(2, '0');
            var seconds = String(now.getSeconds()).padStart(2, '0');
            return hours + ':' + minutes + ':' + seconds;
        },

        loadChartDataWithParams: function(startDateTime, endDateTime, step) {
            var oDataModel = this.getView().getModel("dataModel");
            // Nếu không có step thì lấy từ Select
            step = step || this.byId("stepSelect").getSelectedKey() || "1d";
            
            oDataModel.read("/SalogCountSet", {
                urlParameters: {
                    "$filter": "StartDateTime eq datetime'" + startDateTime + "' and EndDateTime eq datetime'" + endDateTime + "' and Step eq '" + step + "'",
                    "$format": "json"
                },
                success: function (oData) {
                    var formattedData = oData.results.map(function(item) {
                        return {
                            ...item,
                            StartDateTime: new Date(item.StartDateTime).toISOString().split('T')[0],
                            MediumCount: item.MediumCount,
                            HighCount: item.HighCount
                        };
                    });
                    
                    var oModel = new JSONModel({
                        results: formattedData
                    });
                    this.getView().setModel(oModel, "processedDataModel");
                }.bind(this),
                error: function (oError) {
                    console.error("Error fetching data from OData service", oError);
                }
            });
        },

        loadChartData: function(oDataModel) {
            var endDateTime = this.getCurrentDateTime();
            var startDateTime = this.getStartDateTime();

            this.loadChartDataWithParams(startDateTime, endDateTime, "1d");

            // Load các model khác
            var oLogModel = new JSONModel();
            oLogModel.loadData("../model/logData.json");
            this.getView().setModel(oLogModel, "logDataModel");

            // Tạo mô hình JSON và tải dữ liệu cho biểu đồ severity
            var oSeverityModel = new JSONModel();
            oSeverityModel.loadData("../model/severityLog.json");
            this.getView().setModel(oSeverityModel, "severityModel");

            // Tạo mô hình JSON và tải dữ liệu cho biểu đồ thời gian
            var oEventTimeModel = new JSONModel();
            oEventTimeModel.loadData("../model/eventTimeData.json");
            this.getView().setModel(oEventTimeModel, "eventTimeModel");

            // Tạo mô hình JSON cho thời gian hiện tại
            var oTimeModel = new JSONModel({
                currentTime: this.getCurrentTime()
            });
            this.getView().setModel(oTimeModel, "timeModel");

            // Set title for the column chart
            var oVizFrameColumn = this.byId("idVizFrameColumn");
            oVizFrameColumn.setVizProperties({
                title: {
                    text: "Events by Day"
                },
                plotArea: {
                    dataLabel: {
                        visible: true,
                        position: "outside"
                    }
                }
            });

            // Set title for the pie chart
            var oVizFramePie = this.byId("idVizFramePie");
            oVizFramePie.setVizProperties({
                title: {
                    text: "Log Type"
                },
                plotArea: {
                    dataLabel: {
                        visible: true,
                        position: "outside"
                    }
                }
            });

            // Set title for the severity chart
            var oVizFrameHorizontal = this.byId("idVizFrameHorizontal");
            oVizFrameHorizontal.setVizProperties({
                title: {
                    text: "Severity Levels"
                },
                plotArea: {
                    dataLabel: {
                        visible: true,
                        position: "outside"
                    }
                }
            });

            // Set title for the event time chart
            var oEventTimeVizFrame = this.byId("eventTimeVizFrame");
            oEventTimeVizFrame.setVizProperties({
                title: {
                    text: "Event by Time"
                },
                plotArea: {
                    dataLabel: {
                        visible: true,
                        position: "outside"
                    }
                }
            });
        },
        // Nav to Event Detail Page
        onViewDetail: function () {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("EveDetail");
        },

        onDateRangeChange: function(oEvent) {
            var oDateRange = oEvent.getSource();
            var oStartDate = oDateRange.getDateValue();
            var oEndDate = oDateRange.getSecondDateValue();
            
            if (oStartDate && oEndDate) {
                var startDateTime = this.formatDateToDateTime(oStartDate, true);
                var endDateTime = this.formatDateToDateTime(oEndDate, false);
                this.loadChartDataWithParams(startDateTime, endDateTime);
            }
        },

        formatDateToDateTime: function(date, isStartDate) {
            var year = date.getFullYear();
            var month = String(date.getMonth() + 1).padStart(2, '0');
            var day = String(date.getDate()).padStart(2, '0');
            var time = isStartDate ? "00:00:00" : "17:00:00";
            
            return `${year}-${month}-${day}T${time}`;
        },

        onStepChange: function(oEvent) {
            var sSelectedStep = oEvent.getParameter("selectedItem").getKey();
            var oDateRange = this.byId("dateRangeSelection");
            var oStartDate = oDateRange.getDateValue();
            var oEndDate = oDateRange.getSecondDateValue();
            
            if (oStartDate && oEndDate) {
                var startDateTime = this.formatDateToDateTime(oStartDate, true);
                var endDateTime = this.formatDateToDateTime(oEndDate, false);
                this.loadChartDataWithParams(startDateTime, endDateTime, sSelectedStep);
            }
        },

        onRefreshPress: function() {
            // Reset DateRangeSelection về 7 ngày gần nhất
            var oDateRange = this.byId("dateRangeSelection");
            var oEndDate = new Date();
            var oStartDate = new Date();
            oStartDate.setDate(oStartDate.getDate() - 7);
            
            // Set lại giá trị cho DateRangeSelection
            oDateRange.setDateValue(oStartDate);
            oDateRange.setSecondDateValue(oEndDate);
            
            // Reset Step về 1d
            var oStepSelect = this.byId("stepSelect");
            oStepSelect.setSelectedKey("1d");
            
            // Load lại dữ liệu với khoảng thời gian mặc định
            this.loadChartData(this.getView().getModel("dataModel"));
        },
    });
}); 