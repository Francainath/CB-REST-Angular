component extends="modules.API.handlers.v1.APIBaseHandler" singleton hint="I expose needed functionality of the REST API" {

	this.allowedMethods = {
		list = "GET,OPTIONS",
		get = "GET,OPTIONS",
		save = "POST,OPTIONS",
		delete = "DELETE,OPTIONS",
		getUsers = "GET,OPTIONS"
	};


	function preHandler(event,rc,prc) {
		super.preHandler(event,rc,prc);

		if(!event.valueExists("format")) {
			event.setValue("format","JSON");
		}
	}


	function index(event,rc,prc) {
		setNextEvent('api.user.list');
	}


	function list(event,rc,prc) {
		param name="rc.sSortDir_0" default="ASC";
		param name="rc.showAll" default="";

		var c = userService.newCriteria();


		if(!len(rc.showAll)) {
			c.isEQ('isActive',javacast("boolean",true));
		}

		var count = c.count();
		var users = c.list();
		var r = [];

		for(var user in users) {
			var a = {
				userID = user.getUserID(),
				firstName = user.getFirstName(),
				lastName = user.getLastName(),
				fullName = user.getFirstName() & ' ' & user.getLastName(),
				email = user.getEmail(),
				username = user.getUsername(),
				iTotalRecords = count
			};
			ArrayAppend(r, a);
		}
		return r;
	}


	function get(event,rc,prc) {
		param name="rc.userID" default=0;
		var c = userService.get(rc.userID);
		var r = c.toSerializable({depth=2});
		return r;
	}


	function save (event,rc,prc) {
		param name="rc.userID" default=0;

		if(!structKeyExists(rc, "isActive")) {
			rc.isActive = false;
		} else if(rc.isActive eq 'on') {
			rc.isActive = true;
		}

		var oUser = userService.get(rc.userID);

		userService.populate(target=oUser,memento=rc);

		//var vResults = validateModel(oUser);

		var result = false;
		var messageArray = [];

		// if(vResults.hasErrors()) {
		// 	var messageArray = vResults.getAllErrors();
		// } else {
			userService.saveUser(oUser);
			result = true;
		//}

		var data = {
			result = result,
			errors = messageArray
		};

		return data;
	}


	function delete(event,rc,prc) {
		param name="rc.userID" default=0;
		var o = userService.get(rc.userID);
		userService.delete(o);
		return true;
	}


	//array of users
	function getUsers(event,rc,prc) {
		var c = userService.newCriteria();

		c.isEQ('isActive',javacast("boolean",true));
		c.order("lastName","ASC");

		if(!prc.oUser.isAdmin()) {
			var facIDs = [];
			for (var f in prc.oUser.getFacilities()) {
				arrayAppend(facIDs,f.getFacilityID());
			}
			c.withfacilities().isIn('facilityID',facIDs);
		}

		var users = c.list();

		var data = [];
		for(var c in users) {
			if(ArrayLen(c.getFacilities())) {
				var facilities = c.getFacilities();
				var fb = [];
				for(var facility in facilities) {
					var f = facility.getName();
					ArrayAppend(fb,f);
				}
				var facilityList = ArrayToList(fb);
				var s = {
					userID = c.getUserID(),
					fullName = c.getFirstName() & ' ' & c.getLastName() & ' ' & '(' & facilityList & ')'
				};
			} else {
				var s = {
					userID = c.getUserID(),
					fullName = c.getFirstName() & ' ' & c.getLastName()
				};
			}
			arrayAppend(data,s);
		}
		return data;
	}


}