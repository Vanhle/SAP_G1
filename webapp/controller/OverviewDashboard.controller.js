sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/ui/model/json/JSONModel",
    "sap/viz/ui5/data/FlattenedDataset",
    "sap/viz/ui5/format/ChartFormatter",
    "sap/viz/ui5/api/env/Format",
    "sap/ui/model/BindingMode"

], function (Controller, ODataModel, JSONModel, BindingMode, FlattenedDataset, ChartFormatter, Format) {
    "use strict";

    return Controller.extend("overviewdashboard.projectdashboard.controller.OverviewDashboard", {
        onInit: function () {
            // Sử dụng ODataModel để kết nối với OData service
            var oDataModel = new ODataModel("/sap/opu/odata/sap/ZL253_TEST_SM20_SEGW_SRV/");
            this.getView().setModel(oDataModel, "dataModel");

            // Lấy ngày hiện tại và ngày 15 ngày trước
            var today = new Date();
            var pastDate = new Date();
            pastDate.setDate(today.getDate() - 15);

            // Định dạng ngày theo chuẩn OData (YYYY-MM-DD)
            var todayString = today.toISOString().split('T')[0];
            console.log('Today is:' + todayString);
            var pastDateString = pastDate.toISOString().split('T')[0];
            console.log('Past date is:' + pastDateString);

            // Sử dụng $filter để lấy dữ liệu trong 15 ngày gần nhất
            oDataModel.read("/SalogSet", {
                urlParameters: {
                    // "$filter": "SalDate ge datetime'" + pastDateString + "' and SalDate le datetime'" + todayString + "'",
                    "$top": 100
                },
                success: function (oData) {
                    var accessCounts = this.processApiData(oData);
                    var oProcessedModel = new JSONModel(accessCounts);
                    this.getView().setModel(oProcessedModel, "processedDataModel");
                }.bind(this),
                error: function (oError) {
                    console.error("Error fetching data from OData service", oError);
                }
            });

            // Tạo mô hình JSON và tải dữ liệu cho biểu đồ tròn
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
        getCurrentTime: function() {
            var now = new Date();
            var hours = String(now.getHours()).padStart(2, '0');
            var minutes = String(now.getMinutes()).padStart(2, '0');
            var seconds = String(now.getSeconds()).padStart(2, '0');
            return hours + ':' + minutes + ':' + seconds;
        },
        getToday: function() {
            var today = new Date();
            today.setHours(0, 0, 0, 0);
            return today;
        },
        processApiData: function(data) {
            if (!data || !data.results) {
                console.error("Invalid data format", data);
                return [];
            }

            var results = data.results;
            var accessCounts = {};
            var today = this.getToday();

            results.forEach(function(entry) {
                // Chuyển đổi SalDate từ Unix timestamp
                var date = new Date(entry.SalDate);
                date.setHours(date.getHours() + 6); // Adjust timezone by adding 6 hours
                var dayDifference = Math.floor((today - date) / (1000 * 60 * 60 * 24));

                if (dayDifference >= 0 && dayDifference < 15) {
                    var dateString = date.toISOString().split('T')[0];
                    if (!accessCounts[dateString]) {
                        accessCounts[dateString] = { date: dateString, count: 0 };
                    }
                    accessCounts[dateString].count++;
                }
            });

            return Object.values(accessCounts);
        }
    });
}); 