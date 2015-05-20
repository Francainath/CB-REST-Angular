//http://www.justcodefaster.com/blog/2012/07/toserializable-method-for-coldfusion-objects/
component {

	variables.serializePath = [];

	variables.javaSys = createObject("java", "java.lang.System");

	public any function includePath(required string path) {

		var a = listToArray(path, '.');
		var p = '';
		for(var i = 1 ; i <= a.size() ; i++) {
			if(len(p))
				p &= '.';
			p &= a[i];
			arrayAppend(serializePath, p);
		}
		return this;
	}

	public string function getComponentName() {
		return listLast(getMetaData(this).fullname,'.');
	}

	public struct function toSerializable(struct options, struct meta, struct props, any parent = '', string path = '', array serializePath) {
		// Only initialize if we are not recursively calling
		if(isNull(props))
			arguments.props = {};
		if(isNull(meta)) {
			arguments.meta = getMetaData(this);
			if(!len(path))
				arguments.path = getComponentName();
		}
		if(!isNull(arguments.serializePath))
			variables.serializePath = arguments.serializePath;

		// Set up the default options struct and default depth.
		if(isNull(options)) {
			arguments.options = {depth=0};
		} else if(isNull(options.depth)) {
			arguments.options.depth = 0;
		}

		// Get data recursively
		if(structKeyExists(meta, 'extends'))
			props = toSerializable(options, meta.extends, props);

		// Confirm Properties exists. This will be missing if the CFC has no properties defined
		if(structKeyExists(meta, 'properties')) {
			// Loop over the properties array
			for(var i = 1 ; i <= arrayLen(meta.properties) ; i++) {
				var propStruct = meta.properties[i];
				var propName = propStruct.name;

				// Determine whether we should serialize this property or not
				if(!isNull(propStruct.serialize)) {
					var skip = 0;
					var serializeGroups = listToArray(propStruct.serialize);
					if(arrayFindNoCase(serializeGroups, 'never'))
						skip = 1;
					if(!isNull(options.serialize) && !skip) {
						// Allow passing array of values or a string value
						options.serialize = (isSimpleValue(options.serialize) ? listToArray(options.serialize) : options.serialize);
						for(var x in serializeGroups) {
							if(arrayFindNoCase(options.serialize, x) && !skip)
								skip = 0;
							else
								skip = 1;
						}
					}
					if(skip)
						break;
				}

				// Exclude blob data
				if(structKeyExists(propStruct,'ORMTYPE') && propStruct.ORMTYPE == 'blob')
					continue;

				// Check if the property can be read (need to use isDefined as isNull errors on nulls using array notation)
				if(!isDefined('variables.#propName#'))
					props['#propName#'] = '';
				// Confirm that we can get to the property
				else if(structKeyExists(variables, propName)) {
					// Double-check for nulls
					if(isNull(variables[propName])) {
						props['#propName#'] = '';
					} else {
						// Check if the property is not a simple value. In that case, the includePath comes into play.
						if(!isSimpleValue(variables[propName]) && arrayLen(serializePath)) {
							if(!arrayFindNoCase(serializePath,path & '.' & propName))
								continue;
						}
						props['#propName#'] = toSerializableValue(variables[propName], options, propStruct, parent, path & '.' & propName, serializePath);
					}
				}
			}
		}

		return props;
	}

	private any function toSerializableValue(required any value, required struct options, required any propStruct, required any parent, string path = '', array serializePath) {
		var relationships = ['many-to-many','one-to-one','one-to-many','many-to-one'];
		var result = '';
		if(isNull(options.depth))
			options.depth = 0;
		var optionsCopy = duplicate(options);
		if(optionsCopy.depth > 0)
			optionsCopy.depth--;
		// Check if this is a simple value or Query, just assign the value
		if(isSimpleValue(value) || isQuery(value))
			result = value;

		// If we have an object reference
		else if(isInstanceOf(value, 'Component')) {
			if(options.depth > 0  || arrayLen(serializePath)) {
				if(!isNull(parent) && !isSimpleValue(parent) && !arrayLen(serializePath)){
					if(javaSys.identityHashCode(parent) == javaSys.identityHashCode(value))
						return result;
				}
				//throw(arrayToList(arguments.serializePath));
				result = {};
				try{
					result = value.toSerializable(options = optionsCopy, parent = this, path = path, serializePath = arguments.serializePath);
				} catch (any e) {}
			}
		}
		// Array values
		else if(isArray(value)) {
			result = [];
			for(var x = 1 ; x <= arrayLen(value) ; x++) {
				if(isNull(value[x]))
					continue;
				if(isInstanceOf(value[x], 'Component')) {
					if(options.depth > 0 || arrayLen(serializePath)) {
						try {
						arrayAppend(result, value[x].toSerializable(options = optionsCopy, parent = this, path = path, serializePath = arguments.serializePath));
						} catch (any e) {}
					}
				} else {
					arrayAppend(result,toSerializableValue(value[x], optionsCopy, propStruct, this, path, arguments.serializePath));
				}
			}
		}
		// Check if this is a struct value
		else if(isStruct(value)) {
			result = {};
			for(var x in value) {
				if(!isDefined("value.#x#")) // We have to use isDefined() here as isNull will not work with null values
					continue;
				if(isInstanceOf(value[x], 'Component')) {
					if(options.depth > 0  || arrayLen(serializePath)) {
						result['#lcase(x)#'] = value[x].toSerializable(options = optionsCopy, parent = this, path = path, serializePath = arguments.serializePath);
					}
				} else {
					result['#lcase(x)#'] = toSerializableValue(value[x], optionsCopy, propStruct, this, path, arguments.serializePath);
				}
			}
		}
		if(!isDefined("result")){result={};}
		return result;
	}

}