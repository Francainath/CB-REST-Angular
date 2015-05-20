<cfcomponent hint="The DSL builder for all ColdBox related stuff" implements="coldbox.system.ioc.dsl.IDSLBuilder" output="false">

	<!--- init --->
	<cffunction name="init" output="false" access="public" returntype="any" hint="Configure the DSL for operation and returns itself" colddoc:generic="coldbox.system.ioc.dsl.IDSLBuilder">
		<cfargument name="injector" type="any" required="true" hint="The linked WireBox injector" colddoc:generic="coldbox.system.ioc.Injector"/>
		<cfscript>
			instance = {
				injector = arguments.injector
			};
			instance.coldbox 	= instance.injector.getColdBox();
			instance.cachebox	= instance.injector.getCacheBox();
			instance.log		= instance.injector.getLogBox().getLogger( this );

			return this;
		</cfscript>
	</cffunction>

	<!--- process --->
	<cffunction name="process" output="false" access="public" returntype="any" hint="Process an incoming DSL definition and produce an object with it.">
		<cfargument name="definition" 	required="true"  hint="The injection dsl definition structure to process. Keys: name, dsl"/>
		<cfargument name="targetObject" required="false" hint="The target object we are building the DSL dependency for. If empty, means we are just requesting building"/>
		<cfscript>
			var DSLNamespace 		= listFirst(arguments.definition.dsl,":");
			if(DSLNamespace == "ckh"){
				var DSLNamespace_sub  = getToken(arguments.definition.dsl,2,":");

				switch( DSLNamespace_sub ){
					case "entityService"	: { return getEntityServiceDSL(argumentCollection=arguments);}
				}
			}
		</cfscript>
	</cffunction>

	<!--- getEntityServiceDSL --->
	<cffunction name="getEntityServiceDSL" access="private" returntype="any" hint="Get a virtual entity service object" output="false" >
		<cfargument name="definition" 	required="true" type="any" hint="The dependency definition structure">
		<cfargument name="targetObject" required="false" hint="The target object we are building the DSL dependency for. If empty, means we are just requesting building"/>
		<cfscript>
			var entityName  = getToken(arguments.definition.dsl,3,":");

			// Do we have an entity name? If we do create virtual entity service
			if( len(entityName) ){
				return createObject("component","models.VirtualEntityService").init( entityName );
			}

			// else Return Base ORM Service
			return createObject("component","coldbox.system.orm.hibernate.BaseORMService").init();
		</cfscript>
	</cffunction>

</cfcomponent>