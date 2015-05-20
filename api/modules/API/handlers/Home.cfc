component output="false" hint="A normal ColdBox event handler"{

	public function index(event,rc,prc) {
		event.setView("home/index");
	}

	public void function notAuthorized(event,rc,prc) {
		event.renderdata(data="Not Authorized",type="plain",statuscode="401");
	}

}