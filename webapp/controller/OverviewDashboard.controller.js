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
        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

        /**
         * Called when controller is instantiated
         * @public
         */
        onInit: function () {
            // Khởi tạo OData Model
            var oDataModel = new ODataModel("/sap/opu/odata/sap/ZL253_TEST_SM20_SEGW_SRV/");
            this.getView().setModel(oDataModel, "dataModel");

            // Gọi API để cập nhật dữ liệu mới nhất
            this._triggerDataUpdate(oDataModel);

            // Khởi tạo giá trị mặc định cho DateRangeSelection
            this._initializeDateRange();
        },

        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */

        /**
         * Xử lý sự kiện khi thay đổi khoảng thời gian
         * @param {sap.ui.base.Event} oEvent Event object
         * @public
         */
        onDateRangeChange: function (oEvent) {
            var oDateRange = oEvent.getSource();
            var oStartDate = oDateRange.getDateValue();
            var oEndDate = oDateRange.getSecondDateValue();

            if (oStartDate && oEndDate) {
                var startDateTime = this._formatDateToDateTime(oStartDate, true);
                var endDateTime = this._formatDateToDateTime(oEndDate, false);
                this._loadChartDataWithParams(startDateTime, endDateTime);
            }
        },

        /**
         * Xử lý sự kiện khi thay đổi Step
         * @param {sap.ui.base.Event} oEvent Event object
         * @public
         */
        onStepChange: function (oEvent) {
            var sSelectedStep = oEvent.getParameter("selectedItem").getKey();
            var oDateRange = this.byId("dateRangeSelection");
            var oStartDate = oDateRange.getDateValue();
            var oEndDate = oDateRange.getSecondDateValue();

            if (oStartDate && oEndDate) {
                var startDateTime = this._formatDateToDateTime(oStartDate, true);
                var endDateTime = this._formatDateToDateTime(oEndDate, false);
                this._loadChartDataWithParams(startDateTime, endDateTime, sSelectedStep);
            }
        },

        /**
         * Xử lý sự kiện khi nhấn nút Refresh
         * @public
         */
        onRefreshPress: function () {
            this._resetToDefaultState();
            this.loadChartData(this.getView().getModel("dataModel"));
        },

        /**
         * Điều hướng đến trang chi tiết
         * @public
         */
        onViewDetail: function () {
            var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
            oRouter.navTo("EveDetail");
        },

        /* =========================================================== */
        /* internal methods                                            */
        /* =========================================================== */

        /**
         * Khởi tạo giá trị mặc định cho DateRangeSelection
         * @private
         */
        _initializeDateRange: function () {
            var oDateRange = this.byId("dateRangeSelection");
            var oEndDate = new Date();
            var oStartDate = new Date();
            oStartDate.setDate(oStartDate.getDate() - 7);
            oDateRange.setDateValue(oStartDate);
            oDateRange.setSecondDateValue(oEndDate);
        },

        /**
         * Reset về trạng thái mặc định
         * @private
         */
        _resetToDefaultState: function () {
            // Reset DateRangeSelection
            this._initializeDateRange();

            // Reset Step về 1d
            var oStepSelect = this.byId("stepSelect");
            oStepSelect.setSelectedKey("1d");
        },

        /**
         * Trigger cập nhật dữ liệu mới
         * @param {sap.ui.model.odata.v2.ODataModel} oDataModel OData model
         * @private
         */
        _triggerDataUpdate: function (oDataModel) {
            oDataModel.callFunction("/TriggerZG1SALV", {
                method: "POST",
                success: function () {
                    this.loadChartData(oDataModel);
                }.bind(this),
                error: function (oError) {
                    console.error("Error triggering ZG1SALV", oError);
                    this.loadChartData(oDataModel);
                }.bind(this)
            });
        },

        /**
         * Load dữ liệu cho biểu đồ với các tham số
         * @param {string} startDateTime Thời gian bắt đầu
         * @param {string} endDateTime Thời gian kết thúc
         * @param {string} [step] Step (mặc định là 1d)
         * @private
         */
        _loadChartDataWithParams: function (startDateTime, endDateTime, step) {
            var oDataModel = this.getView().getModel("dataModel");
            step = step || this.byId("stepSelect").getSelectedKey() || "1d";

            oDataModel.read("/SalogCountSet", {
                urlParameters: {
                    "$filter": "StartDateTime eq datetime'" + startDateTime +
                        "' and EndDateTime eq datetime'" + endDateTime +
                        "' and Step eq '" + step + "'",
                    "$format": "json"
                },
                success: this._onDataLoadSuccess.bind(this),
                error: this._onDataLoadError.bind(this)
            });
        },

        /**
         * Xử lý khi load dữ liệu thành công
         * @param {Object} oData Dữ liệu trả về từ server
         * @private
         */
        _onDataLoadSuccess: function (oData) {
            var formattedData = oData.results.map(function (item) {
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
        },

        /**
         * Xử lý khi load dữ liệu thất bại
         * @param {Object} oError Đối tượng lỗi
         * @private
         */
        _onDataLoadError: function (oError) {
            console.error("Error fetching data from OData service", oError);
        },

        /**
         * Format date thành datetime string
         * @param {Date} date Đối tượng Date cần format
         * @param {boolean} isStartDate True nếu là ngày bắt đầu (00:00:00), false nếu là ngày kết thúc (17:00:00)
         * @returns {string} Datetime string đã format
         * @private
         */
        _formatDateToDateTime: function (date, isStartDate) {
            var year = date.getFullYear();
            var month = String(date.getMonth() + 1).padStart(2, '0');
            var day = String(date.getDate()).padStart(2, '0');
            var time = isStartDate ? "00:00:00" : "17:00:00";

            return `${year}-${month}-${day}T${time}`;
        },

        /**
         * Lấy thời gian hiện tại
         * @returns {string} Thời gian hiện tại format HH:mm:ss
         * @private
         */
        _getCurrentTime: function () {
            var now = new Date();
            var hours = String(now.getHours()).padStart(2, '0');
            var minutes = String(now.getMinutes()).padStart(2, '0');
            var seconds = String(now.getSeconds()).padStart(2, '0');
            return hours + ':' + minutes + ':' + seconds;
        },

        // Tách phần load dữ liệu biểu đồ ra thành hàm riêng
        getCurrentDateTime: function () {
            var currentDate = new Date();
            var year = currentDate.getFullYear();
            var month = String(currentDate.getMonth() + 1).padStart(2, '0');
            var day = String(currentDate.getDate()).padStart(2, '0');
            // var hours = String(currentDate.getHours()).padStart(2, '0');
            // var minutes = String(currentDate.getMinutes()).padStart(2, '0');
            // var seconds = String(currentDate.getSeconds()).padStart(2, '0');

            return `${year}-${month}-${day}T17:00:00`;
        },

        getStartDateTime: function () {
            var startDate = new Date();
            startDate.setDate(startDate.getDate() - 7); // Trừ đi 7 ngày
            // startDate.setHours(0, 0, 0, 0); // Set giờ về 00:00:00

            // Tạo string datetime với offset +07:00
            var year = startDate.getFullYear();
            var month = String(startDate.getMonth() + 1).padStart(2, '0');
            var day = String(startDate.getDate()).padStart(2, '0');

            return `${year}-${month}-${day}T00:00:00`;
        },

        loadChartData: function (oDataModel) {
            var endDateTime = this.getCurrentDateTime();
            var startDateTime = this.getStartDateTime();

            this._loadChartDataWithParams(startDateTime, endDateTime, "1d");

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
                currentTime: this._getCurrentTime()
            });
            this.getView().setModel(oTimeModel, "timeModel");

            // Set title for the column chart
            var oVizFrameColumn = this.byId("idVizFrameColumn");
            oVizFrameColumn.setVizProperties({
                title: {
                    text: "Events by Day"
                },

                dataLabel: {
                    visible: true,
                    position: "outside"
                },

                valueAxis: {
                    title: {
                        visible: false
                    }
                },
                categoryAxis: {
                    title: {
                        visible: false
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
    });
}); 