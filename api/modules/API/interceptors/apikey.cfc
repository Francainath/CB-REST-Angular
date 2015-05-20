component name="apikey" hint="This interceptor checks apikeys" output="false" extends="coldbox.system.interceptor" autowire="true" {

	public void function preProcess(event) eventPattern="^api:" {
		var rc = event.getCollection();
		var httpheader = GetHttpRequestData();
		param name="rc.apikey" default="";
		param name="rc.token" default="";

		//get the api security settings
		var api_authentication = getModuleSettings(module='api').api_authentication;

		//merge our apikey and tokens from the headers into the rc (for logging into extra info)
		if (structKeyExists(httpheader.headers, "apikey") and structKeyExists(httpheader.headers, "token")) {
			rc.apikey = httpheader.headers.apikey;
			rc.token = httpheader.headers.token;
		}

		//should we authenticate api transactions
		if (api_authentication){
			//check for api key / token
			if (((len(rc.apikey)) and (len(rc.token))) or (event.getCurrentEvent() eq "API:v1.home.notAuthorized")) {
				var found = false;
				var integrations = getModuleSettings(module='api').api_integrations;

				//check for key validity
				for(integration in integrations) {
					if((integration.apikey eq rc.apikey) and (integration.token eq rc.token)) {
						var found = true;
						break;
					}
				}

				//if we didn't find the api key/token combo
				if(!found) {
					event.overrideEvent("api:home.notAuthorized");
				}
			} else {
				event.overrideEvent("api:home.notAuthorized");
			}
		}
	}
}