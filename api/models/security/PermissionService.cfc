component extends="models.VirtualEntityService" singleton {


	//Constructor
	PermissionService function init() {
		super.init(entityName="permission");

		return this;
	}


	//Delete a Permission which also removes itself from all many-to-many relationships
	boolean function deletePermission(required permissionID) transactional {
		// We do SQL deletions as those relationships are not bi-directional
		// delete role relationships
		var q = new Query(sql="delete from rolePermissions where FK_permissionID = :permissionID");
		q.addParam(name="permissionID",value=arguments.permissionID,cfsqltype="numeric");
		q.execute();
		// delete user relationships
		var q = new Query(sql="delete from userPermissions where FK_permissionID = :permissionID");
		q.addParam(name="permissionID",value=arguments.permissionID,cfsqltype="numeric");
		q.execute();
		// delete permission now
		return deleteById( arguments.permissionID );
	}


}