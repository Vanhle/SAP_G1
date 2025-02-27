import BaseComponent from "sap/ui/core/UIComponent";

/**
 * @namespace secondapp
 */
export default class Component extends BaseComponent {

    public static metadata = {
        manifest: "json",
        interfaces: [
            "sap.ui.core.IAsyncContentCreation"
        ],
        config: {
            fullWidth: true
        }
    };

    public init() : void {
        // call the base component's init function
        super.init();

        // enable routing
        this.getRouter().initialize();
    }
} 