sap.ui.define([], function() {
    "use strict";
    
    return {
        getLogTypeData: function() {
            return [
                { "code": "AU1", "description": "Logon successful." },
                { "code": "AU2", "description": "Logon failed." },
                { "code": "AUC", "description": "User logoff." },
                { "code": "AUM", "description": "User locked in client after erroneous password checks." },
                { "code": "AUN", "description": "User in client unlocked after being locked due to invalid password." },
                { "code": "AUO", "description": "Logon failed." },
                { "code": "BUD", "description": "WS: Delayed logon failed. Refer to Web service log." },
                { "code": "CUA", "description": "Rejected assertion." },
                { "code": "CUB", "description": "SAML 2.0 Logon." },
                { "code": "CUC", "description": "SAML 2.0 Logon" },
                { "code": "CUD", "description": "Subject Name ID." },
                { "code": "CUE", "description": "Attribute value." },
                { "code": "CUF", "description": "Authentication assertion." },
                { "code": "CUG", "description": "Signed logout request rejected." },
                { "code": "CUH", "description": "Unsigned logout request rejected." },
                { "code": "BUE", "description": "WS: Delayed logon successful. Refer to Web service log." },
                { "code": "BUK", "description": "Assertion used." },
                { "code": "BUL", "description": "SAML 2.0 Logon." },
                { "code": "BUM", "description": "Subject Name ID." },
                { "code": "BUN", "description": "Attribute value." },
                { "code": "BUO", "description": "Authentication assertion." },
                { "code": "BUP", "description": "SAML 2.0 Logon" },
                { "code": "BUQ", "description": "Signed logout request accepted." },
                { "code": "BUR", "description": "Unsigned logout request accepted." },
                { "code": "AU5", "description": "RFC/CPIC logon successful." },
                { "code": "AU6", "description": "RFC/CPIC logon failed." },
                { "code": "AUK", "description": "Successful RFC call." },
                { "code": "AUL", "description": "Failed RFC call." },
                { "code": "CUV", "description": "Successful WS call." },
                { "code": "CUW", "description": "Failed Web service call." },
                { "code": "CUZ", "description": "Generic table access by RFC with activity." },
                { "code": "AU3", "description": "Transaction started." },
                { "code": "AU4", "description": "Start of transaction failed." },
                { "code": "AUP", "description": "Transaction locked." },
                { "code": "AUQ", "description": "Transaction unlocked." },
                { "code": "AUW", "description": "Report started." },
                { "code": "AUX", "description": "Start report failed." },
                { "code": "AU7", "description": "User created." },
                { "code": "AU8", "description": "User deleted." },
                { "code": "AU9", "description": "User locked." },
                { "code": "AUA", "description": "User unlocked." },
                { "code": "AUB", "description": "Authorizations for user were changed." },
                { "code": "AUD", "description": "User master record was changed." },
                { "code": "AUU", "description": "Object activated." },
                { "code": "AUR", "description": "Object created." },
                { "code": "AUS", "description": "Object deleted." },
                { "code": "AUT", "description": "Object changed." },
                { "code": "BU2", "description": "Password changed for user in client." },
                { "code": "AUE", "description": "Audit configuration changed." },
                { "code": "AUF", "description": "Audit event for user in client." },
                { "code": "AUG", "description": "Application server started." },
                { "code": "AUH", "description": "Application server stopped." },
                { "code": "AUI", "description": "Audit: slot inactive." },
                { "code": "AUJ", "description": "Audit: Activity status changed." },
                { "code": "AUV", "description": "Digital signature error." },
                { "code": "AUY", "description": "Download bytes to file." },
                { "code": "AUZ", "description": "Digital Signature." },
                { "code": "BU0", "description": "Security audit log event." },
                { "code": "BU1", "description": "Password check failed for user in client." },
                { "code": "BU3", "description": "Change security check during export." },
                { "code": "BU4", "description": "Transport request contains security-critical source objects." },
                { "code": "BU5", "description": "ICF Recorder entry executed for user." }
            ];
        }
    };
}); 