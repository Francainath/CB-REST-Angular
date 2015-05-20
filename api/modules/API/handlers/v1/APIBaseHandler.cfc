component extends="handlers.base" singleton {

	//dependencies

	// aroundHandler for try/catch and render
	function aroundHandler(event,targetAction,eventArguments) {
		param name="args.rc.format" default="json";
		if(event.getCurrentEvent() != "API:v1.security.unauthorized") {
			try {
				// for testing purposes only
				if (event.getValue("testError",false))
					throw(message="Oops", detail="forced an error");
			// prepare arguments for action call
			var args = {
				event = arguments.event,
				rc 	  = arguments.event.getCollection(),
				prc   = arguments.event.getCollection(private=true)
			};
			structAppend(args,eventArguments);

			// execute the action, return data
			var data = arguments.targetAction(argumentCollection=args);

			//catch any errors
			} catch (any e) {
				var data = {
					status = "ERROR",
					errorMessage = e.message
				};
			}
			//return the data
			event.renderdata(data=data,type=args.rc.format);
		} else {
			// prepare arguments for action call
			var args = {
				event = arguments.event,
				rc 	  = arguments.event.getCollection(),
				prc   = arguments.event.getCollection(private=true)
			};
			structAppend(args,eventArguments);

			// execute the action, return data
			arguments.targetAction(argumentCollection=args);
		}
	}

	/**
	* Executes when an exception occurs in this handler
	*/
	function onError(event,rc,prc,faultAction,exception,eventArguments){

		// display
		event.setHTTPHeader(statusCode="500",statusText="Error executing resource #arguments.exception.message#")
			.renderData( data={error=true,message="#arguments.exception.message#"}, type="json", statusCode=500);
	}


}