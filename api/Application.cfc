/**
********************************************************************************
Copyright 2005-2007 ColdBox Framework by Luis Majano and Ortus Solutions, Corp
www.coldboxframework.com | www.luismajano.com | www.ortussolutions.com
********************************************************************************
*/
component {
	// Application properties
	this.name = "CBRESTANgular" & hash(getCurrentTemplatePath());
	this.sessionManagement = true;
	this.sessionTimeout = createTimeSpan(0,0,45,0);
	this.setClientCookies = true;
	this.setDomainCookies="yes";


	// Mappings Imports
	import coldbox.system.*;

	// COLDBOX STATIC PROPERTY, DO NOT CHANGE UNLESS THIS IS NOT THE ROOT OF YOUR COLDBOX APP
	COLDBOX_APP_ROOT_PATH = getDirectoryFromPath(getCurrentTemplatePath());
	// The web server mapping to this application. Used for remote purposes or static purposes
	COLDBOX_APP_MAPPING   = "";
	// COLDBOX PROPERTIES
	COLDBOX_CONFIG_FILE 	 = "";
	// COLDBOX APPLICATION KEY OVERRIDE
	COLDBOX_APP_KEY 		 = "";

	// THE DATASOURCE FOR SITE
	this.datasource = "CBRESTAngular";

	// THE LOCATION OF COLDBOX
	this.mappings["/coldbox"] 	 = GetDirectoryFromPath( GetBaseTemplatePath() ) & "coldbox\";
	this.mappings["/models"] = GetDirectoryFromPath( GetBaseTemplatePath() ) & "models\";

	// CONTENTBOX ORM SETTINGS
	this.ormEnabled = true;
	this.ormSettings = {
		cfclocation=["models","modules"],
		logSQL = true,
		flushAtRequestEnd = false,
		eventHandling = true,
		eventHandler = "models.utilities.ORMEventHandler",
		secondarycacheenabled = false,
		cacheprovider = "ehCache",
		autoManageSession	= false,
		dbcreate = "update"

	};

	// application start
	public boolean function onApplicationStart() {
		application.cbBootstrap = new Bootstrap(COLDBOX_CONFIG_FILE,COLDBOX_APP_ROOT_PATH,COLDBOX_APP_KEY);
		application.cbBootstrap.loadColdbox();
		return true;
	}

	// request start
	public boolean function onRequestStart(String targetPage) {

		if( structKeyExists(url,"ormReload") ){ ormReload(); }

		// Bootstrap Reinit
		if( not structKeyExists(application,"cbBootstrap") or application.cbBootStrap.isfwReinit() ) {
			lock name="coldbox.bootstrap_#this.name#" type="exclusive" timeout="5" throwonTimeout=true{
				structDelete(application,"cbBootStrap");
				application.cbBootstrap = new Bootstrap(COLDBOX_CONFIG_FILE,COLDBOX_APP_ROOT_PATH,COLDBOX_APP_KEY,COLDBOX_APP_MAPPING);
			}
		}

		// ColdBox Reload Checks
		application.cbBootStrap.reloadChecks();

		//Process a ColdBox request only
		if( findNoCase('index.cfm',listLast(arguments.targetPage,"/")) ) {
			application.cbBootStrap.processColdBoxRequest();
		}

		return true;
	}


	public void function onSessionStart() {
		application.cbBootStrap.onSessionStart();
	}


	public void function onSessionEnd(struct sessionScope, struct appScope) {
		arguments.appScope.cbBootStrap.onSessionEnd(argumentCollection=arguments);
	}


	public boolean function onMissingTemplate(template) {
		return application.cbBootstrap.onMissingTemplate(argumentCollection=arguments);
	}


}