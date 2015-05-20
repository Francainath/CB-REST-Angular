/**
* Service to handle auhtor operations.
*/
component extends="models.VirtualEntityService" accessors="true" singleton {

	// User hashing type
	property name="hashType";
	property name="key";

	/**
	* Constructor
	*/
	UserService function init() {
		// init it
		super.init(entityName="user");
		setHashType( "SHA-256" );
		setKey( "YouDon'tOwnMe" );

		return this;
	}

	/**
	* Save an user with extra pizazz!
	*/
	function saveUser(user,passwordChange=false){
		// hash password if new user
		if( !arguments.user.isLoaded() OR arguments.passwordChange OR arguments.user.getUserID() EQ '') {
			arguments.user.setPassword( hash(arguments.user.getPassword(), getHashType()) );
		}
		// save the user
		save( user );
	}

	/**
	* User search by name, email or username
	*/
	function search(criteria) {
		var params = {criteria="%#arguments.criteria#%"};
		var r = executeQuery(query="from user where firstName like :criteria OR lastName like :criteria OR email like :criteria",params=params,asQuery=false);
		return r;
	}

	/**
	* Username checks for users
	*/
	boolean function usernameFound(required username) {
		var args = {"username" = arguments.username};
		return ( countWhere(argumentCollection=args) GT 0 );
	}

	/**
	* returns the userID from the key
	*/
	function getUserIDFromKey(required apiUserKey) {
		return decrypt(apiUserKey,getKey());
	}

	/**
	* returns the key based on the userID
	*/
	function createAPIUserKeyFromID(required userID) {
		return encrypt(userID,getKey());
	}

}