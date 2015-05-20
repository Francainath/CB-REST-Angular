component{

	// Configure ColdBox Application
	function configure(){

		// coldbox directives
		coldbox = {
			//Application Setup
			appName 				= "cb-rest-angular",
			eventName 				= "event",

			//Development Settings
			debugMode				= false,
			debugPassword			= "cb-rest-angular!@",
			reinitPassword			= "cb-rest-angular!@",
			handlersIndexAutoReload = false,

			//Implicit Events
			requestStartHandler		= "Main.onRequestStart",
			applicationStartHandler = "Main.onAppInit",

			//Application Aspects
			handlerCaching 			= true,
			eventCaching			= false,
			proxyReturnCollection 	= false
		};

		environments = {
			local = ".local$"
		};

		//Layout Settings
		layoutSettings = {
			defaultLayout = "Layout.Main.cfm",
			defaultView   = ""
		};

		//Interceptor Settings
		interceptorSettings = {
			throwOnInvalidStates = false,
			customInterceptionPoints = ""
		};

		//Register interceptors as an array, we need order
		interceptors = [
			//SES
			{class="coldbox.system.interceptors.SES",
			 properties={}
			},
			//Request
			{class="interceptors.request",
			 name="request"
			},
			// Security
			{class="cbsecurity.interceptors.Security",
			 name="security",
			 properties={
			 	 rulesSource 	= "model",
			 	 rulesModel		= "models.security.securityRuleService",
			 	 rulesModelMethod = "getSecurityRules",
			 	 validatorModel = "models.security.securityService"}
			}
		];

		// Module Directives
		modules = {
			//Turn to false in production
			autoReload = false,
			// An array of modules names to load, empty means all of them
			include = [],
			// An array of modules names to NOT load, empty means none
			exclude = []
		};

		orm = {
			injection = {
				// enable entity injection
				enabled = true,
				// a list of entity names to include in the injections
				include = "",
				// a list of entity names to exclude from injection
				exclude = ""
			}
		};
	}


	/**
	* Executed whenever the ckhdevelopment environment is detected
	*/
	function local(){
		// Override coldbox directives
		coldbox.handlerCaching = false;
		coldbox.handlersIndexAutoReload = true;
		coldbox.eventCaching = false;
		coldbox.debugPassword = "";
		coldbox.reinitPassword = "";
		coldbox.debugMode = true;
		coldbox.customErrorTemplate = "/coldbox/system/includes/BugReport.cfm";
		models.objectCaching = false;
		wireBox.singletonReload = false;
	}

}