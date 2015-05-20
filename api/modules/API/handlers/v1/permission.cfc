component extends="modules.API.handlers.v1.APIBaseHandler" singleton hint="I expose needed functionality of the REST API" {

	//specify the http verbs allowed to access each event (e.g. get, post, put, delete)
	this.allowedMethods = {
		list = "GET,OPTIONS",
		get = "GET,OPTIONS",
		save = "POST,OPTIONS",
		delete = "DELETE,OPTIONS",
		getPermissions = "GET,OPTIONS",
		getUserPermissions = "GET,OPTIONS",
		getRolePermissions = "GET,OPTIONS"
	};


	//preHandler
	function preHandler(event,rc,prc){
		super.preHandler(event,rc,prc);

		if(!event.valueExists("format")){
			event.setValue("format","JSON");
		}
	}


	//index
	function index(event,rc,prc) {
		setNextEvent('api.permission.list');
	}


	//list permissions
	function list(event,rc,prc) {
		var c = permissionService.newCriteria();


		var count = c.count();
		var permissions = c.list();
		var r = [];

		for(var permission in permissions){
			var a = {
				permissionID = permission.getPermissionID(),
				permission = permission.getPermission(),
				description = permission.getDescription(),
				iTotalRecords = count
			};
			ArrayAppend(r, a);
		}

		return r;
	}


	//get
	function get(event,rc,prc){
		param name="rc.permissionID" default=0;
		var c = permissionService.get(rc.permissionID);
		var r = c.toSerializable({depth=1});
		return r;
	}


	//save
	function save(event,rc,prc) {
		param name="rc.permissionID" default=0;

		//get permission
		var oPermission = permissionService.get(rc.permissionID);
		//populate w/rc
		permissionService.populate(target=oPermission,memento=rc);

		//var vResults = validateModel(oPermission);
		var messageArray = [];

		// if(vResults.hasErrors()) {
		// 	//throw error and send them back to the form
		// 	var messageArray = vResults.getAllErrors();
		// } else {
			//save contact
			permissionService.save(oPermission);
			result = true;
		//}
		var data = 	{
			result = result,
			errors = messageArray
		};
		return data;
	}


	//delete
	function delete(event,rc,prc) {
		param name="rc.permissionID" default=0;

		//get permission
		var oPermission = permissionService.get(rc.permissionID);
		//delete permission
		permissionService.delete(oPermission);

		return true;
	}

	// list permissions
	function getPermissions(event,rc,prc) {
		var c = permissionService.newCriteria();

		var permissions = c.list(sortOrder="permission");

		var data = {};
		for(var c in permissions){
			var s = {};
			s[c.getPermissionID()] = c.getPermission();
			structAppend(data,s);
		}

		return data;
	}

	function getUserPermissions(event,rc,prc) {
		param name="rc.roleID" default=0;

		var rolePermissions = roleService.get(rc.roleID).getPermissions();
		var userPermissions = [];
		var permissions = permissionService.getAll();
		var q = entityToQuery( rolePermissions );
		var permissionList = valueList( q.permission );
		for(var permission in permissions){
			if(!listFindNoCase(permissionList, permission.getPermission())){
				var up = {
					permissionID = permission.getPermissionID(),
					permission = permission.getPermission()
				};
				arrayAppend(userPermissions, up);
			}
		}
		var data = [];
		for(var p in userPermissions){
			var up = {
				permissionID = p.permissionID,
				permission = p.permission
			};
			arrayAppend(data, up);
		}
		return data;
	}


	//getRolePermissions
	function getRolePermissions(event,rc,prc) {
		param name="rc.roleID" default=0;

		var rolePermissions = roleService.get(rc.roleID).getPermissions();
		var data = [];
		for(var p in rolePermissions) {
			var up = {
				permissionID = p.getPermissionID(),
				permission = p.getPermission()
			};
			arrayAppend(data, up);
		}
		return data;
	}


}