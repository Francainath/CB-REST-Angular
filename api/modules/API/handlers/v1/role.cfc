component extends="modules.API.handlers.v1.APIBaseHandler" singleton hint="I expose needed functionality of the REST API" {
	/*
	 *  specify the http verbs allowed to access each event.
	 *  e.g. get, post, put, delete
	*/
	this.allowedMethods = {
		list = "GET,OPTIONS",
		get = "GET,OPTIONS",
		save = "POST,OPTIONS",
		delete = "DELETE,OPTIONS",
		getRoles = "GET,OPTIONS"
	};


	function preHandler(event,rc,prc){
		super.preHandler(event,rc,prc);

		if(!event.valueExists("format")){
			event.setValue("format","JSON");
		}
	}


	function index(event,rc,prc) {
		setNextEvent('api.role.list');
	}


	//list
	function list(event,rc,prc) {
		var c = roleService.newCriteria();


		var count = c.count();
		var roles = c.list();
		var r = {};

		r['aaData'] = [];

		for(var role in roles) {
			var links = '';
			var a = {
				roleID = role.getRoleID(),
				role = role.getRole(),
				description = role.getDescription(),
				iTotalRecords = count
			};
			ArrayAppend(r.aaData,a);
		}

		return r.aaData;
	}


	//get
	function get(event,rc,prc) {
		param name="rc.roleID" default=0;
		var c = roleService.get(rc.roleID);
		var r = c.toSerializable({depth=1});
		return r;
	}


	//save
	function save(event,rc,prc) {
		param name="rc.roleID" default=0;

		rc.permissions = listToArray(rc.permissions);

		//get role
		var oRole = roleService.get(rc.roleID);
		//populate w/rc
		roleService.populate(target=oRole,memento=rc);

		//var vResults = validateModel(oRole);
		var messageArray = [];

		// if(vResults.hasErrors()) {
		// 	//throw error and send them back to the form
		// 	var messageArray = vResults.getAllErrors();
		// } else {
			//save contact
			roleService.save(oRole);
			result = true;
		//}
		var data = {
			result = result,
			errors = messageArray
		};
		return data;
	}


	//delete
	function delete(event,rc,prc) {
		param name="rc.roleID" default=0;

		//get role
		var oRole = roleService.get(rc.roleID);
		//delete role
		roleService.delete(oRole);

		return true;
	}


	// list Roles
	function getRoles(event,rc,prc) {
		var c = roleService.newCriteria();

		var roles = c.list(sortOrder="role");

		var data = {};
		for(var c in roles){
			var s = {};
			s[c.getRoleID()] = c.getRole();
			structAppend(data,s);
		}

		return data;
	}


}