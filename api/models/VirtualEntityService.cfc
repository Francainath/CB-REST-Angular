component extends="modules.cborm.models.VirtualEntityService" {

	//Hijack the delete and run a soft delete instead....
	any function delete(required any entity, boolean flush=false, boolean transactional=getUseTransactions()) {
		arguments.entity.softDelete();
		return this;
	}

}