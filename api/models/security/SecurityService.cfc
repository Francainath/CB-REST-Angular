/**
* Our security service
*/
component singleton{

	// Dependencies
	property name="userService" 	inject="id:models.security.userService";
	property name="log"				inject="logbox:logger:{this}";
	property name="controller"		inject="coldbox";

	/**
	* Constructor
	*/
	public SecurityService function init(){
		return this;
	}

	/**
	* Update an user's last login timestamp
	*/
	any function updateUserLoginTimestamp(user){
		arguments.user.setLastLogin( now() );
		userService.save( arguments.user );
		return this;
	}

	/**
	* User validator via security interceptor
	*/
	boolean function userValidator(required struct rule, any controller){
		var isAllowed 	= false;
		var user 		= getUserFromToken();

		// First check if user has been authenticated.
		if( user.isLoaded() AND user.isLoggedIn() ){

			// Check if the rule requires roles
			if( len(rule.roles) ){
				for(var x=1; x lte listLen(rule.roles); x++){
					if( listGetAt(rule.roles,x) eq user.getRole().getRole() ){
						isAllowed = true;
						break;
					}
				}
			}

			// Check if the rule requires permissions
			if( len(rule.permissions) ){
				for(var y=1; y lte listLen(rule.permissions); y++){
					if( user.checkPermission( listGetAt(rule.permissions,y) ) ){
						isAllowed = true;
						break;
					}
				}
			}

			// Check for empty rules and perms
			if( !len(rule.roles) AND !len(rule.permissions) ){
				isAllowed = true;
			}
		}

		return isAllowed;
	}

	/**
	* Get an user from session, or returns a new empty user entity
	*/
	User function getUserFromToken(){

		var rc = controller.getRequestService().getContext().getCollection();

		// Check if valid user id in session?
		if( structKeyExists(rc,"apiUserKey") ){
			if(!rc.apiUserKey contains "0A"){
				rc.apiUserKey &= "++%0A";
			}
			var userID = userService.getUserIDFromKey(rc.apiUserKey);
			// try to get it with that ID
			var user = userService.findWhere({userID=userID,isActive=true});
			// If user found?
			if( NOT isNull(user) ){
				user.setLoggedIn( true );
				return user;
			}
		}

		// return new user, not found or not valid
		return userService.new();
	}

	User function getUserFromCredentials(required username, required password){
		// hash password
		arguments.password = hash( arguments.password, userService.getHashType() );
		var user = userService.findWhere({username=arguments.username,password=arguments.password,isActive=true});
		if( not isNull(user) ) {
			return user;
		}

		return userService.new();

	}

	/**
	* Delete user session
	*/
	any function logout(){
		return this;
	}

	/**
	* Verify if an user is valid
	*/
	boolean function authenticate(required username, required password){
		// hash password
		arguments.password = hash( arguments.password, userService.getHashType() );
		var user = userService.findWhere({username=arguments.username,password=arguments.password,isActive=true});

		//check if found and return verification
		if( not isNull(user) ){
			// Set last login date
			updateUserLoginTimestamp( user );
			return true;
		}
		return false;
	}

}
