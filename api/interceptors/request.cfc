/**
* This simulates the onRequest start for the admin interface
*/
component extends="coldbox.system.Interceptor"{

	// DI
	property name="securityService" inject="id:security.securityService";
	/**
	* Configure Request
	*/
	function configure(){}

	/**
	* Fired on requests
	*/
	function preProcess(event, interceptData){
		var prc = event.getCollection(private=true);
		var rc	= event.getCollection();
		event.setHTTPHeader(name="Access-Control-Allow-Origin", value="*");
		event.setHTTPHeader(name="Access-Control-Allow-Headers", value="Content-Type, x-xsrf-token");
		event.setHTTPHeader(name="Access-Control-Allow-Methods", value="GET, POST, OPTIONS, DELETE");
		prc.oUser = securityService.getUserFromToken();

	}

}