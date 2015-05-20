component name="request" extends="coldbox.system.interceptor" {

	public void function preProcess(event,interceptData) eventPattern="^api:" {
		var prc = event.getCollection(private=true);
		var rc	= event.getCollection();

		//set a header to know which route ran
		var pc = getpagecontext().getresponse();
		pc.setHeader("CurrentRoute",event.getCurrentRoute());


		//Fix for PUT and DELETE issues
		if(event.getHTTPMethod() == "PUT" || event.getHTTPMethod() == "DELETE" || event.getHTTPMethod() == "POST" || event.getHTTPMethod() == "OPTIONS") {

			rc.contentString = event.getHTTPContent();
			//create structure to set name value pairs
			var inMap = {};

			//get HTTP request content

			try {

				if(isBinary(rc.contentString)) {

					rc.contentString = toString(rc.contentString);
				}


				// loop through each iteration and create name value pairs

				for(var x=1; x lte listLen(rc.contentString, "&"); x++) {

					nameValuePair = listGetAt(rc.contentString,x,"&");

					if(!structKeyExists(inMap, getToken(nameValuePair,1,"="))) {
						inMap[getToken(nameValuePair,1,"=")] = urlDecode(getToken(nameValuePair,2,"="));
					} else {
						inMap[getToken(nameValuePair,1,"=")] = listAppend(inMap[getToken(nameValuePair,1,"=")], urlDecode(getToken(nameValuePair,2,"=")));
					}

				}

				if(isJSON(rc.contentString)){
					var json = deserializeJSON(rc.contentString);
					for(var key in json){
						rc[key] = json[key];
					}
				}

				//append to request collection
				event.collectionAppend(inMap);

			} catch(Any e) {

				results.error = true;
				results.messages = "Error in REST Interceptor Pre-Process: #e.detail# #e.message#";

				if( log.canError() ){

					log.error(results.messages,e);
				}

			}

		}

	}

}