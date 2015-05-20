component {

	// Dependencies
	property name="userService"						inject="id:models.security.UserService";
	property name="roleService"						inject="id:models.security.RoleService";
	property name="permissionService"				inject="id:models.security.PermissionService";
	property name="securityService" 				inject="id:models.security.SecurityService";


	//preHandler
	function preHandler(event,action,eventArguments) {
		var rc 	= event.getCollection();
		var prc = event.getCollection(private=true);
	}


}