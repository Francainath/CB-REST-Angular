<cfcomponent output="false" hint="My Module Configuration">
	<cfscript>

		// Module Properties
		this.title 				= "API";
		this.author 			= "Curt Gratz";
		this.webURL 			= "http://www.compknowhow.com";
		this.description 		= "API to access the Techtrak";
		this.version			= "1.0";
		// If true, looks for views in the parent first, if not found, then in the module. Else vice-versa
		this.viewParentLookup 	= true;
		// If true, looks for layouts in the parent first, if not found, then in module. Else vice-versa
		this.layoutParentLookup = true;
		// Module Entry Point
		this.entryPoint			= "API";

		function configure() {

			// parent settings
			parentSettings = {};

			// module settings - stored in modules.name.settings
			settings = {
				api_authentication = false
			};

			// Layout Settings
			layoutSettings = {
				defaultLayout = ""
			};

			// datasources
			datasources = {};

			// web services
			webservices = {};

			// SES Routes
			routes = [
				// Module Entry Point
				{ pattern="/v1/auth/login",handler="v1.security",action="doLogin" },
				{ pattern="/v1/auth/updateUser",handler="v1.security",action="getUpdatedUser" },
				{ pattern="/v1/auth/logout",handler="v1.security",action="doLogout" },
				{ pattern="/v1/auth/changePassword",handler="v1.security",action="doChangePassword" },
				{ pattern="/v1/auth/makeTemporaryPassword",handler="v1.security",action="makeTemporaryPassword" },
				{ pattern="/v1/permission/list",handler="v1.permission",action="list" },
				{ pattern="/v1/permission/:permissionID",handler="v1.permission",action={POST="save",GET="get",DELETE="delete",OPTIONS="get"} },
				{ pattern="/v1/permission/",handler="v1.permission",action="list" },
				{ pattern="/v1/user/list",handler="v1.user",action="list" },
				{ pattern="/v1/user/:userID",handler="v1.user",action={POST="save",GET="get",DELETE="delete",OPTIONS="get"} },
				{ pattern="/v1/user/",handler="v1.user",action="list" },
				{ pattern="/v1/role/getRoles",handler="v1.role",action="getRoles" },
				{ pattern="/v1/role/list",handler="v1.role",action="list" },
				{ pattern="/v1/role/:roleID",handler="v1.role",action={POST="save",GET="get",DELETE="delete",OPTIONS="get"} },
				{ pattern="/v1/role/",handler="v1.role",action="list" },
				{ pattern="/", handler="home",action="index" },
				// Convention Route
				{pattern="/:handler/:action?"}
			];
			// Custom Declared Points
			interceptorSettings = {
				customInterceptionPoints = ""
			};

			// Custom Declared Interceptors
			interceptors = [
				// security
				{class="#moduleMapping#.interceptors.apikey"},
				{class="#moduleMapping#.interceptors.apirequest"}
			];

			// Binder Mappings
			// binder.map("Alias").to("#moduleMapping#.model.MyService");
		}


		//Executed whenever the various environment are detected
		function local() {
			settings.api_authentication = false;
		}


		//Fired when the module is registered and activated.
		function onLoad() {}


		//Fired when the module is unregistered and unloaded
		function onUnload() {}
	</cfscript>
</cfcomponent>