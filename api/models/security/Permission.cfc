component persistent="true" entityName="permission" table="permissions" cachename="permission" cacheuse="read-write" extends="models.baseEntity" {

	// Primary Key
	property name="permissionID" fieldtype="id" generator="native" setter="false";

	// Properties
	property name="permission"  ormtype="string" notnull="true" length="255" unique="true" default="";
	property name="description" ormtype="string" notnull="false" default="" length="500";


	// Constructor
	function init() {
		return this;
	}


	//is loaded?
	boolean function isLoaded() {
		return len( getPermissionID() );
	}


}