/**
* Installs ContentBox
*/
component accessors="true"{

	// DI
	property name="userService"					inject="id:models.security.userService";
	property name="roleService"					inject="id:models.security.roleService";
	property name="permissionService"			inject="id:models.security.permissionService";
	property name="securityRuleService"			inject="id:models.security.securityRuleService";
	property name="securityInterceptor"			inject="coldbox:interceptor:security";
	property name="coldbox"						inject="coldbox";

	/**
	* Constructor
	*/
	InstallerService function init(){
		permissions = {};
		return this;
	}

	/**
	* Execute the installer
	*/
	function execute() transactional{
		var c = userService.count();
		if (c == 0) {
			// create roles
			var roles = createRoles();
			// create User
			var user = createUser( roles );
			// create all security rules
			createSecurityRules();
			// Reload Security Rules
			securityInterceptor.loadRules();


		}
	}

	function createSecurityRules(){
		securityRuleService.resetRules();
	}

	/**
	* Create permissions
	*/
	function createPermissions(){
		var perms = {
			"SETTINGS_ADMIN" = "Access to the system settings",
			"MAIN_DASHBOARD" = "Access to the main dashboard page",
			"USER_ADMIN" = "Access to the users data input",
			"REPORTS_ADMIN" = "Access to the reports"
		};

		var allperms = [];
		for(var key in perms){
			var props = {permission=key, description=perms[key]};
			permissions[ key ] = permissionService.new(properties=props);
			arrayAppend(allPerms, permissions[ key ] );
		}
		permissionService.saveAll( allPerms );
	}

	/**
	* Create roles and return the admin
	*/
	function createRoles(){
		// Create Permissions
		createPermissions();

		var results = {};

		// Create Editor
		var oRole = roleService.new(properties={role="datainput",description="A Data Input Role"});
		// Add Editor Permissions
		oRole.addPermission( permissions["MAIN_DASHBOARD"] );
		roleService.save( oRole );

		results.datainputRole = oRole;

		// Create staff
		var oRole = roleService.new(properties={role="staff",description="A Staff Role"});
		// Add Editor Permissions
		oRole.addPermission( permissions["REPORTS_ADMIN"] );
		oRole.addPermission( permissions["MAIN_DASHBOARD"] );

		roleService.save( oRole );

		results.staffinputRole = oRole;

		// Create Admin
		var oRole = roleService.new(properties={role="admin",description="A Administrator"});
		// Add All Permissions To Admin
		for(var key in permissions){
			oRole.addPermission( permissions[key] );
		}
		roleService.save( oRole );

		results.adminRole = oRole;

		return results;
	}

	/**
	* Create user
	*/
	function createUser(required roles){
		var oUser = userService.new(properties=getAdminUserData());
		oUser.setIsActive( true );
		oUser.setRole( roles.adminRole );
		userService.saveUser( oUser );

		var oUser = userService.new(properties=getTeemoData());
		oUser.setIsActive( true );
		oUser.setRole( roles.datainputRole );
		userService.saveUser( oUser );

		var oUser = userService.new(properties=getCaitlynData());
		oUser.setIsActive( true );
		oUser.setRole( roles.staffinputRole );
		userService.saveUser( oUser );

		var oUser = userService.new(properties=getTangoTwistedFateData());
		oUser.setIsActive( true );
		oUser.setRole( roles.datainputRole );
		userService.saveUser( oUser );

		return oUser;
	}

	function getAdminUserData(){
		var results = {
			firstname = "Wukong",
			lastName = "MonkeyKing",
			email = "wu@kong.com",
			username = "admin",
			password = "admin"
		};
		return results;
	}

	function getTeemoData(){
		var results = {
			firstname = "Captian",
			lastName = "Teemo",
			email = "captian@teemo.com",
			username = "user",
			password = "user"
		};
		return results;
	}

	function getCaitlynData(){
		var results = {
			firstname = "Officer",
			lastName = "Caitlyn",
			email = "officer@caitlyn.com",
			username = "caitlyn",
			password = "caitlyn"
		};
		return results;
	}

	function getTangoTwistedFateData(){
		var results = {
			firstname = "Tango",
			lastName = "Twisted Fate",
			email = "tango@tf.com",
			username = "tf",
			password = "tf"
		};
		return results;
	}

}