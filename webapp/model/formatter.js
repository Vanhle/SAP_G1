sap.ui.define([], function () {
    "use strict";

    return {
        formatDateTime: function (timestamp) {
            if (!timestamp) {
                return "";
            }
            var date = new Date(timestamp);
            return date.toLocaleString();
        },

        formatSeverityState: function (severity) {
            if (!severity) {
                return "None";
            }
            switch (severity.toUpperCase()) {
                case "HIGH":
                    return "Error";
                case "MEDIUM":
                    return "Warning";
                case "LOW":
                    return "Success";
                default:
                    return "None";
            }
        },

        formatStatusState: function (status) {
            if (!status) {
                return "None";
            }
            switch (status.toUpperCase()) {
                case "OPEN":
                    return "Warning";
                case "IN_PROGRESS":
                    return "Information";
                case "CLOSED":
                    return "Success";
                default:
                    return "None";
            }
        }
    };
});