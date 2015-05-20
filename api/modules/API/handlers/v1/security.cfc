//security handler
component extends="modules.API.handlers.v1.APIBaseHandler" {

	//specify the http verbs allowed to access each event (e.g. get, post, put, delete)
	this.allowedMethods = {
		doLogin = "GET,POST,OPTIONS",
		doLogout = "GET,POST,OPTIONS",
		doChangePassword = "POST,OPTIONS",
		getUpdatedUser = "POST,OPTIONS"
	};


	//preHandler
	function preHandler(event,rc,prc){
		super.preHandler(event,rc,prc);

		if(!event.valueExists("format")){
			event.setValue("format","JSON");
		}
	}


	//doLogin
	function doLogin(event,rc,prc) {
		event.paramValue("username","");
		event.paramValue("password","");
		event.paramValue("rememberMe",false);
		var data = {
			result = false,
			user = {}
		};
		//authenticate users
		if( securityService.authenticate(rc.username,rc.password) ) {
			data.result = true;
			var loggedInUser = securityService.getUserFromCredentials(rc.username,rc.password);
			//populate the permissionList
			loggedInUser.checkPermission('nada');
			data.user = loggedInUser.toSerializable({depth=1});
			data.user.apiUserKey = userService.createAPIUserKeyFromID(data.user.userID);
			return data;
		}
		else {
			return data;
		}
	}


	//getUpdatedUser
	function getUpdatedUser(event,rc,prc) {
		var data = {
			result = true,
			user = {}
		};
		var loggedInUser = userService.get(rc.userID);
		//populate the permissionList
		loggedInUser.checkPermission('nada');
		data.user = loggedInUser.toSerializable({depth=1});
		data.user.apiUserKey = userService.createAPIUserKeyFromID(data.user.userID);

		return data;
	}


	//doLogout
	function doLogout(event,rc,prc) {
		securityService.logout();

		return true;
	}


	//doChangePassword event
	function doChangePassword(event,rc,prc) {
		if(structKeyExists(rc, "adminChangePassword")) {
			if(rc.newPassword == rc.confirmPassword) {
				try {
					user = userService.findWhere({username=rc.username});
					user.setPassword(rc.newPassword);
					userService.saveUser(user,true);
					return {result=true,message="Password changed"};
				} catch(any e) {
					return { result=false, message=message };
				}
			}
		} else {
			var authenticated = securityService.authenticate(rc.username,rc.currentPassword);
			//if everything is on the up and up...make the change
			if( authenticated && (rc.newPassword == rc.confirmPassword) ) {
				user = userService.findWhere({username=rc.username});
				user.setPassword(rc.newPassword);
				userService.saveUser(user,true);
				return {result=true,message="Password changed"};
			} else {
				//user is NULL or passwords do not match
				if( !authenticated ){
					var message = "We could not authenticate your account. Either user name or current password are not right.";
				} else if (rc.newPassword != rc.confirmPassword) {
					var message = "The new password and confirm password did not match, please try again.";
				} else {
					var message = "An unknown error has occured.";
				}
				return {result=false,message=message};
			}
		}
	}


	//makeTemporaryPassword
	function makeTemporaryPassword(event,rc,prc) {
		param name="rc.userEmail" default="";

		if(rc.userEmail NEQ "") {
			var user = userService.findWhere({email=rc.userEmail});
			if(!isNull(user)) {
				var tempPassword = hash( rc.userEmail, userService.getHashType() );
				user.setPassword(tempPassword);
				rc.firstName = user.getFirstName();
				rc.lastName = user.getLastName();
				rc.password = user.getPassword();
				userService.saveUser(user,true);
				//now send email
				var textbody = renderView('temporaryPasswordEmailText');
				var htmlbody = renderView('temporaryPasswordEmailHTML');
				var mail = new mail();
				mail.setSubject("Password Reset");
				mail.setTo(rc.userEmail);
				mail.setFrom("no-reply@compknowhow.com");
				mail.addPart(type="text/plain", body=textbody);
				mail.addPart(type="text/html", body=htmlbody);
				mail.send();
			}
		}

		var data = "yep";
		return data;
	}


	function unauthorized(event,rc,prc){
		event.setHTTPHeader(statusCode="401",statusText="You are not authorized")
			.renderData( data={error=true,message="Nice try punk!"}, type="json", statusCode=401);
	}

}
