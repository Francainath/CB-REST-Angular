/**
* Roles service
*/
component extends="models.VirtualEntityService" singleton{

	/**
	* Constructor
	*/
	RoleService function init(){
		// init it
		super.init(entityName="role");

		return this;
	}

}