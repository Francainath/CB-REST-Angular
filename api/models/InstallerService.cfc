/**
* Setup Users, Roles, and Permissions
*/
component accessors="true" {

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
	InstallerService function init() {
		permissions = {};
		return this;
	}

	/**
	* Execute the installer
	*/
	function execute() transactional {
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


	function createSecurityRules() {
		securityRuleService.resetRules();
	}


	/**
	* Create permissions
	*/
	function createPermissions() {
		var perms = {
			"MAIN_DASHBOARD" = "Access to the main dashboard page",
			"USER_VIEW" = "Access to view users",
			"USER_ADD/EDIT" = "Access to add/edit users",
			"USER_ADMIN" = "Access to delete users",
			"ROLE_VIEW" = "Access to view roles",
			"ROLE_ADD/EDIT" = "Access to add/edit roles",
			"ROLE_ADMIN" = "Access to delete roles",
			"PERMISSION_VIEW" = "Access to view permissions",
			"PERMISSION_ADD/EDDIT" = "Access to add/edit permissions",
			"PERMISSION_MANAGE" = "Access to delete permissions"
		};

		var allperms = [];
		for(var key in perms) {
			var props = {permission=key, description=perms[key]};
			permissions[ key ] = permissionService.new(properties=props);
			arrayAppend(allPerms, permissions[ key ] );
		}
		permissionService.saveAll( allPerms );
	}

	/**
	* Create roles and return
	*/
	function createRoles() {
		// Create Permissions
		createPermissions();

		var results = {};

		// Create loser
		var oRole = roleService.new(properties={role="loser",description="A Loser: can only see self & dashboard"});
		// Add Editor Permissions
		oRole.addPermission( permissions["MAIN_DASHBOARD"] );
		roleService.save( oRole );

		results.loserRole = oRole;

		// Create viewer
		var oRole = roleService.new(properties={role="viewer",description="A Viewer: can see everything, but not edit or administrate"});
		// Add Editor Permissions
		oRole.addPermission( permissions["MAIN_DASHBOARD"] );
		oRole.addPermission( permissions["USER_VIEW"] );
		oRole.addPermission( permissions["ROLE_VIEW"] );
		oRole.addPermission( permissions["PERMISSION_VIEW"] );

		roleService.save( oRole );

		results.viewerRole = oRole;

		// Create editor
		var oRole = roleService.new(properties={role="editor",description="An Editor: can add/edit all features, but not administrate"});
		// Add Editor Permissions
		oRole.addPermission( permissions["MAIN_DASHBOARD"] );
		oRole.addPermission( permissions["USER_VIEW"] );
		oRole.addPermission( permissions["USER_ADD/EDIT"] );
		oRole.addPermission( permissions["ROLE_VIEW"] );
		oRole.addPermission( permissions["ROLE_ADD/EDIT"] );
		oRole.addPermission( permissions["PERMISSION_VIEW"] );
		oRole.addPermission( permissions["PERMISSION_ADD/EDIT"] );

		roleService.save( oRole );

		results.editorRole = oRole;

		// Create Admin
		var oRole = roleService.new(properties={role="admin",description="An Administrator: can do EVERYTHING"});
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
		var oUser = userService.new(properties=getWukongUserData());
		oUser.setIsActive( true );
		oUser.setRole( roles.adminRole );
		userService.saveUser( oUser );

		var oUser = userService.new(properties=getTeemoData());
		oUser.setIsActive( true );
		oUser.setRole( roles.loserRole );
		userService.saveUser( oUser );

		var oUser = userService.new(properties=getCaitlynData());
		oUser.setIsActive( true );
		oUser.setRole( roles.viewerRole );
		userService.saveUser( oUser );

		var oUser = userService.new(properties=getTangoTwistedFateData());
		oUser.setIsActive( true );
		oUser.setRole( roles.editorRole );
		userService.saveUser( oUser );

		return oUser;
	}


	function getWukongUserData() {
		var results = {
			firstname = "Wukong",
			lastName = "MonkeyKing",
			email = "wu@kong.com",
			username = "admin",
			password = "admin"
		};
		return results;
	}


	function getTeemoData() {
		var results = {
			firstname = "Captian",
			lastName = "Teemo",
			email = "captain@teemo.com",
			username = "teemo",
			password = "teemo"
		};
		return results;
	}


	function getCaitlynData() {
		var results = {
			firstname = "Officer",
			lastName = "Caitlyn",
			email = "officer@caitlyn.com",
			username = "caitlyn",
			password = "caitlyn"
		};
		return results;
	}


	function getTangoTwistedFateData() {
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