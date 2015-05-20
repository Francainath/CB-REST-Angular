component persistent="true" entityName="role" table="roles" cachename="role" cacheuse="read-write" extends="models.baseEntity" {

	// Primary Key
	property name="roleID" fieldtype="id" generator="native" setter="false";

	// Properties
	property name="role"  		ormtype="string" notnull="true" length="255" unique="true" default="";
	property name="description" ormtype="string" notnull="false" default="" length="500";
	// M2M -> Permissions
	property name="permissions" singularName="permission" fieldtype="many-to-many" type="array" lazy="extra" orderby="permission" cascade="all" cacheuse="read-write"
			  cfc="models.security.Permission" fkcolumn="FK_roleID" linktable="rolePermissions" inversejoincolumn="FK_permissionID";

	// Calculated Fields
	property name="numberOfPermissions" formula="select count(*) from rolePermissions as rolePermissions where rolePermissions.FK_roleID=roleID";
	property name="numberOfUsers" 	formula="select count(*) from users as theuser where theuser.FK_roleID=roleID";

	// Non-Persistable Fields
	property name="permissionList" 	persistent="false";

	// Constructor
	function init(){
		permissions 	= [];
		permissionList	= '';
		return this;
	}


	/**
	* Check for permission
	*/
	boolean function checkPermission(required slug){
		// cache list
		if( !len( permissionList ) AND hasPermission() ){
			var q = entityToQuery( getPermissions() );
			permissionList = valueList( q.permission );
		}
		// checks
		if( listFindNoCase(permissionList, arguments.slug) ){
			return true;
		}

		return false;
	}

	/**
	* is loaded?
	*/
	boolean function isLoaded(){
		return len( getRoleID() );
	}

	/**
	* manual sql to remove all the permissions from this user cause the "right" way no worky!!
	*/
	public void function deleteAllPermissions(){
		queryService = new query();
		queryService.addParam(name="ID",value=this.getRoleID());
		result = queryService.execute(sql="DELETE FROM rolePermissions WHERE FK_roleID = :ID");
	}
}
