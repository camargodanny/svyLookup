/**
 * Creates a lookup object which can be used to show a pop-up form
 *
 * @public
 * @param {String|JSFoundSet|JSRecord} dataSource The data source to lookup
 * @return {Lookup}
 * @properties={typeid:24,uuid:"65E8E051-667D-4118-A873-8024C2648F09"}
 */
function createLookup(dataSource) {
	/** @type {String} */
	var ds = dataSource;
	if (dataSource instanceof JSRecord) {
		ds = dataSource.getDataSource();
	}
	return new Lookup(ds);
}

/**
 * Creates a lookup object from a valuelist which can be used to show a pop-up form or a modal window
 * NOTE: Valuelist cannot be depends on a database relation or is a global method valuelist.
 *
 * @public
 * @param {String} valuelistName
 * @param {String} [titleText] Sets the display text for the valuelist field. Default is 'Value';
 * TODO should i allow to override the valuelist displayvalue, realvalue dataproviders. Could be handy because the lookup returns the record and the user has no clue about displayvalue/realvalue ?
 *
 * @return {Lookup}
 *
 * @properties={typeid:24,uuid:"5FE26179-2276-4689-9101-C642C5C1EC68"}
 */
function createValuelistLookup(valuelistName, titleText) {

	// TODO it can be improved, checking the type of values, checking the type of dataprovider.
	// If is based on a dataset query, can look for more than > 500 values. It could actually run the query on the ds itself. Would the class clush in that case ?

	var jsList = solutionModel.getValueList(valuelistName);
	if (!jsList) {
		throw new scopes.svyExceptions.IllegalArgumentException("Cannot use undefined valuelist " + valuelistName);
	}
	if (jsList.valueListType != JSValueList.CUSTOM_VALUES && jsList.valueListType != JSValueList.DATABASE_VALUES) {
		throw new scopes.svyExceptions.IllegalArgumentException("The valuelist " + valuelistName + " must be a valuelist of type CUSTOM_VALUES or DATABASE_VALUE ");
	}

	var items = application.getValueListItems(valuelistName);
	var dataSource = "mem:valuelist_" + valuelistName;
	if (!databaseManager.dataSourceExists(dataSource)) {
		dataSource = items.createDataSource("valuelist_" + valuelistName, [JSColumn.TEXT, JSColumn.TEXT]);
		// TODO should allow to reset the selected values !?!?
	}

	// autoconfigure the valuelist lookup
	var valuelistLookup = createLookup(dataSource);
	valuelistLookup.setLookupDataProvider("realvalue");
	var field = valuelistLookup.addField("displayvalue");
	if (titleText) {
		field.setTitleText(titleText);
	} else {
		field.setTitleText("Value");
	}

	return valuelistLookup;
}

/**
 * Creates a set of lookup objects which can be used to show a pop-up form
 * @public
 * @param {Array<String|JSFoundSet|JSRecord>} dataSources The data source to lookup
 * @return {MultiLookup}
 *
 * @properties={typeid:24,uuid:"A80BE700-B4A6-4168-AC6E-9289E8BF0E44"}
 */
function createMultiDSLookup(dataSources) {
	var ml = new MultiLookup();
	for (var i = 0; i < dataSources.length; i++) {
		/** @type {String} */
		var ds = dataSources[i];
		if (dataSources[i] instanceof JSRecord) {
			ds = dataSources[i].getDataSource();
		}
		ml.addLookup(ds)
	}
	return ml;
}

/**
 * @private 
 * @constructor
 * @properties={typeid:24,uuid:"0C81E4B2-4943-40B4-BCF4-334C054D1DAA"}
 */
function MultiLookup() {

	/**
	 * @protected 
	 * @type {Object<Lookup>}
	 */
	this.lookups = { };
	
}

/**
 * @constructor 
 * @private 
 * @properties={typeid:24,uuid:"7A86E969-CAFE-483D-9141-52E2CD4BFDFE"}
 */
function init_MultiLookup() {
	
	/**
	 * Adds a dataSource to list of Lookups
	 *
	 * @public
	 * @param {String} dataSource
	 * @return {Lookup}
	 * @this {MultiLookup}
	 */
	 MultiLookup.prototype.addLookup = function(dataSource) {
		var lu = new Lookup(dataSource);
		lu.setHeader(dataSource);
		this.lookups[dataSource] = lu;
		return lu;
	}

	/**
	 * Get a dataSource from list of Lookups
	 *
	 * @public
	 * @param {String} dataSource
	 * @return {Lookup}
	 * @this {MultiLookup}
	 */
	MultiLookup.prototype.getLookup = function(dataSource) {
		return this.lookups[dataSource]
	}

	/**
	 * Get all lookup objects
	 *
	 * @public
	 * @return {Object<Lookup>}
	 * @this {MultiLookup}
	 */
	MultiLookup.prototype.getAllLookups = function() {
		return this.lookups;
	}

	/**
	 * Shows the lookup
	 *
	 * @public
	 * @param {Function} callback The function that will be called when a selection is made
	 * @param {RuntimeComponent} target The component to show relative to
	 * @param {Number} [width] The width of the lookup. Optional. Default is same as target component
	 * @param {Number} [height] The height of the lookup. Optional. Default is implementation-specifc.
	 * @param {String} [initialValue] And initial value to show in the search
	 * @this {MultiLookup}
	 */
	MultiLookup.prototype.showPopUpMultiDS = function(callback, target, width, height, initialValue) {
		var runtimeForm = forms.svyLookupTableMultiDS.newInstance(this);
		runtimeForm.showPopUp(callback, target, width, height, initialValue);
	}
	
	/**
	 * Creates and returns the lookup
	 * 
	 * @public 
	 * @param {function(Array<JSRecord>,Array<String|Date|Number>,scopes.svyLookup.Lookup)} callback The function that will be called when a selection is made; the callback returns the following arguments: {Array<JSRecord>} record, {Array<String|Date|Number>} lookupValue , {Lookup} lookup
	 * @param {String} [initialValue] And initial value to show in the search
	 * @return {plugins.window.FormPopup}
	 * @this {MultiLookup}
	 */
	MultiLookup.prototype.createPopUp = function(callback, initialValue) {
		var runtimeForm = forms.svyLookupTableMultiDS.newInstance(this);
		return runtimeForm.createPopUp(callback, initialValue);
	}	
}

/**
 * @private 
 * @param {String|JSFoundSet} datasource
 * @constructor
 * @properties={typeid:24,uuid:"DC5A7A69-5B84-4438-9BFD-06558632E4E8"}
 */
function Lookup(datasource) {

	/**
	 * @protected
	 * @type {Array<LookupField>}
	 */
	this.fields = [];

	/**
	 * @protected
	 * @type {Array} */
	this.params = [];

	/**
	 * @protected
	 * @type {String} */
	this.lookupDataprovider = null;

	/**
	 * @type {String}
	 * @protected 
	 * */
	this.lookupFormProvider = null;
	
	/**
	 * @type {Object}
	 * @protected 
	 */
	this.dataSource = datasource;

	// TODO var sort

	// TODO datasource could be an existing foundset, used to filter lookup data ?

	/**
	 * Sets the lookup form. The lookup form must be an instance of the AbstractLookup form.
	 *
	 * @protected 
	 * @type {String}
	 */
	this.header = null;

	/**
	 * @protected   
	 * @type {String}
	 */
	this.displayField = null;
}

/**
 * @constructor 
 * @private 
 * @properties={typeid:24,uuid:"C0E6C5B2-0E41-40B1-955F-6CC1FAD5FF71"}
 */
function init_Lookup() {
	
	/**
	 * Set display field to the lookup object
	 *
	 * @public
	 * @param {String} headerText HeaderText on datasource for Multi Lookup Popup
	 * @return {String}
	 * @this {Lookup}
	 */
	Lookup.prototype.setHeader = function(headerText) {
		if (!headerText || headerText.length < 1) {
			var ds = this.getDataSource().split('/')
			this.header = ds[ds.length - 1];
		} else {
			this.header = headerText
		}
		return this.header;
	}
	
	/**
	 * get header field
	 *
	 * @public
	 * @return {String}
	 * @this {Lookup}
	 */
	Lookup.prototype.getHeader = function() {
		return this.header;
	}

	/**
	 * Set display field to the lookup object
	 *
	 * @public
	 * @param {String} displayField Display dataprovider to be used for Multi Lookup Popup
	 * @return {String}
	 * @this {Lookup}
	 */
	Lookup.prototype.setDisplayField = function(displayField) {
		this.displayField = displayField
		return this.displayField;
	}
	
	/**
	 * get display field to the lookup object
	 *
	 * @public
	 * @return {String}
	 * @this {Lookup}
	 */
	Lookup.prototype.getDisplayField = function() {
		return this.displayField;
	}	
	
	/**
	 * @public
	 * @param {RuntimeForm<AbstractLookup>} lookupForm
	 * @this {Lookup}
	 *  */
	Lookup.prototype.setLookupFormProvider = function(lookupForm) {
		if (!lookupForm) {
			throw new scopes.svyExceptions.IllegalArgumentException("Illegal argument formProvider. formProvider must be an instance of AbstractLookup form")
		}
		if (!scopes.svyUI.isJSFormInstanceOf(lookupForm, "AbstractLookup")) {
			throw new scopes.svyExceptions.IllegalArgumentException("The given formProvider must be an instance of AbstractLookup form.");
		}
		this.lookupFormProvider = lookupForm['controller'].getName();
	}
	
	/**
	 * Gets the data source for this Lookup object
	 * @public
	 * @return {String}
	 * @this {Lookup}
	 */
	Lookup.prototype.getDataSource = function() {
		/** @type {String} */
		var ds;
		if (this.dataSource instanceof JSRecord || this.dataSource instanceof JSFoundSet) {
			ds = this.dataSource.getDataSource();
		} else if (this.dataSource instanceof String) {
			ds = this.dataSource;
		} 
		return ds;
	}
	
	/** 
	 * Gets the foundset for this Lookup object.
	 * @public 
	 * @return {JSFoundSet}
	 * @this {Lookup}
	 * */
	Lookup.prototype.getFoundSet = function() {
		/** @type {JSFoundSet} */
		var fs;
		if (this.dataSource instanceof JSRecord) {
			/** @type {JSRecord} */
			var record = this.dataSource;
			fs = record.foundset;
		} else if (this.dataSource instanceof JSFoundSet) { // return the given foundset
			fs = this.dataSource;
		} else {	// return a separate foundset
			/** @type {String} */
			var ds = this.dataSource;
			fs = databaseManager.getFoundSet(ds);
			fs.loadRecords();
		}
		return fs;
	}
	
	/**
	 * Sets the lookup dataprovider
	 *
	 * @public
	 * @param {String} dataProvider
	 * @this {Lookup}
	 * @deprecated use setLookupDataProvider instead
	 */
	Lookup.prototype.setLookupDataprovider = function(dataProvider) {
		this.lookupDataprovider = dataProvider;
	}
	
	/**
	 * Sets the lookup dataprovider
	 *
	 * @public
	 * @param {String} dataProvider
	 * @this {Lookup}
	 */
	Lookup.prototype.setLookupDataProvider = function(dataProvider) {
		this.lookupDataprovider = dataProvider;
	}	

	/**
	 * Gets the lookup dataprovider
	 * @public
	 * @return {String}
	 * @this {Lookup}
	 * @deprecated use getLookupDataProvider instead
	 */
	Lookup.prototype.getLookupDataprovider = function() {
		return this.lookupDataprovider;
	}	

	/**
	 * Gets the lookup dataprovider
	 * @public
	 * @return {String}
	 * @this {Lookup}
	 */
	Lookup.prototype.getLookupDataProvider = function() {
		return this.lookupDataprovider;
	}

	/**
	 * Adds a field to the lookup object
	 *
	 * @public
	 * @param {String} dataProvider
	 * @return {LookupField}
	 * @this {Lookup}
	 */
	Lookup.prototype.addField = function(dataProvider) {
		var provider = new LookupField(this, dataProvider);
		this.fields.push(provider);
		return provider;
	}

	/**
	 * Gets the field at the specified index
	 * @public
	 * @param {Number} index
	 * @return {LookupField}
	 * @this {Lookup}
	 */
	Lookup.prototype.getField = function(index) {
		return this.fields[index];
	}

	/**
	 * Removes a field at the specified index
	 * @public
	 * @param {Number} index
	 * @this {Lookup}
	 */
	Lookup.prototype.removeField = function(index) {
		this.fields.splice(index, 1);
	}

	/**
	 * Gets the number of fields in the lookup object
	 * @public
	 * @return {Number}
	 * @this {Lookup}
	 */
	Lookup.prototype.getFieldCount = function() {
		return this.fields.length;
	}

	/**
	 * Add a params to be added into the onSelect callback arguments
	 * @param {Object} param
	 * @public
	 * @this {Lookup}
	 * */
	Lookup.prototype.addParam = function(param) {
		this.params.push(param);
	}

	/**
	 * @public
	 * @return {Array}
	 * @this {Lookup}
	 * */
	Lookup.prototype.getParams = function() {
		return this.params;
	}

	/**
	 * Removes a param at the specified index
	 * @public
	 * @param {Number} index
	 * @this {Lookup}
	 */
	Lookup.prototype.removeParam = function(index) {
		this.params.splice(index, 1);
	}

	/**
	 * Clear the params
	 * @public
	 * @this {Lookup}
	 */
	Lookup.prototype.clearParams = function() {
		this.params = [];
	}
	/**
	 * Shows the lookup
	 *
	 * @public
	 * @param {function(Array<JSRecord>,Array<String|Date|Number>,Lookup)} callback The function that will be called when a selection is made; the callback returns the following arguments: {Array<JSRecord>} record, {Array<String|Date|Number>} lookupValue , {Lookup} lookup
	 * @param {RuntimeComponent} target The component to show relative to
	 * @param {Number} [width] The width of the lookup. Optional. Default is same as target component
	 * @param {Number} [height] The height of the lookup. Optional. Default is implementation-specifc.
	 * @param {String} [initialValue] And initial value to show in the search
	 * @this {Lookup}
	 */
	Lookup.prototype.showPopUp = function(callback, target, width, height, initialValue) {
		/** @type {RuntimeForm<AbstractLookup>} */
		var lookupForm;
		if (this.lookupFormProvider) {
			lookupForm = forms[this.lookupFormProvider];
		} else {
			lookupForm = forms.svyLookupTable;
		}

		/** @type {RuntimeForm<AbstractLookup>} */
		var runtimeForm = lookupForm.newInstance(this);
		runtimeForm.showPopUp(callback, target, width, height, initialValue);
	}
	
	/**
	 * Creates and returns the lookup
	 * 
	 * @public 
	 * @param {function(Array<JSRecord>,Array<String|Date|Number>,scopes.svyLookup.Lookup)} callback The function that will be called when a selection is made; the callback returns the following arguments: {Array<JSRecord>} record, {Array<String|Date|Number>} lookupValue , {Lookup} lookup
	 * @param {String} [initialValue] And initial value to show in the search
	 * @return {plugins.window.FormPopup}
	 * @this {Lookup}
	 */
	Lookup.prototype.createPopUp = function(callback, initialValue) {
		/** @type {RuntimeForm<AbstractLookup>} */
		var lookupForm;
		if (this.lookupFormProvider) {
			lookupForm = forms[this.lookupFormProvider];
		} else {
			lookupForm = forms.svyLookupTable;
		}
		
		/** @type {RuntimeForm<AbstractLookup>} */
		var runtimeForm = lookupForm.newInstance(this);
		return runtimeForm.createPopUp(callback, initialValue);
	}

	/**
	 * Shows the lookup in a modal Window
	 *
	 * @public
	 * @param {function(Array<JSRecord>,Array<String|Date|Number>,Lookup)} [callback] The function that will be called when a selection is made; the callback returns the following arguments: {Array<JSRecord>} record, {Array<String|Date|Number>} lookupValue , {Lookup} lookup
	 * @param {Number} [x]
	 * @param {Number} [y]
	 * @param {Number} [width] The width of the lookup. Optional. Default is same as target component
	 * @param {Number} [height] The height of the lookup. Optional. Default is implementation-specifc.
	 * @param {String} [initialValue] And initial value to show in the search
	 *
	 * @return {Array<JSRecord>|Array<String|Date|Number>} returns the selected records; if the lookupDataprovider has been set instead it returns the lookupDataprovider values on the selected records
	 * @this {Lookup}
	 */
	Lookup.prototype.showModalWindow = function(callback, x, y, width, height, initialValue) {

		/** @type {RuntimeForm<AbstractLookup>} */
		var lookupForm;
		if (this.lookupFormProvider) {
			lookupForm = forms[this.lookupFormProvider];
		} else {
			lookupForm = forms.svyLookupTable;
		}

		/** @type {RuntimeForm<AbstractLookup>} */
		var runtimeForm = lookupForm.newInstance(this);

		// TODO return the actual values, no need of params
		return runtimeForm.showModalWindow(callback, x, y, width, height, initialValue);
	}	
}

/**
 * @private 
 * @param {Lookup} lookup
 * @param {String} dataProvider
 * @constructor
 * @properties={typeid:24,uuid:"298B728E-ED51-4ECD-BB3B-0878B766BCBB"}
 * @AllowToRunInFind
 */
function LookupField(lookup, dataProvider) {

	/**
	 * @protected
	 * @type {String}
	 */
	this.dataProvider = dataProvider;	

	/**
	 * @protected 
	 * @type {Boolean}
	 */
	this.searchable = true;

	/**
	 * @protected
	 * @type {String}
	 */
	this.titleText = dataProvider;

	/**
	 * @protected
	 * @type {String}
	 */
	this.valueListName = null;

	/**
	 * @protected
	 * @type {String}
	 */
	this.format = null;

	/**
	 * @protected
	 * @type {Boolean}
	 */
	this.visible = true;

	/**
	 * @protected
	 * @type {String}
	 */
	this.styleClass = null;

	/**
	 * @protected
	 * @type {String}
	 */
	this.width = 'auto';

	/**
	 * @protected
	 * @type {String}
	 */
	this.styleClassDataprovider = null;
	
	/**
	 * @protected 
	 * @type {Lookup}
	 */
	this.lookup = lookup;

}

/**
 * @constructor 
 * @private 
 *
 * @properties={typeid:24,uuid:"2130130E-2BEE-4480-8E82-AD0B2AC051F2"}
 * @AllowToRunInFind
 */
function init_LookupField() {
	
	/**
	 * Gets the data provider for this field
	 * @public
	 * @return {String}
	 * @this {LookupField}
	 */
	LookupField.prototype.getDataProvider = function() {
		return this.dataProvider;
	}

	/**
	 * Indicates if this field is searchable
	 * @public
	 * @param {Boolean} searchable True to make searchable. False to make display-only
	 * @return {LookupField}
	 * @this {LookupField}
	 */
	LookupField.prototype.setSearchable = function(searchable) {
		this.searchable = searchable;
		return this;
	}

	/**
	 * Gets the searchability of this field
	 * @public
	 * @return {Boolean}
	 * @this {LookupField}
	 */
	LookupField.prototype.isSearchable = function() {
		return this.searchable;
	}

	/**
	 * Sets the display text for this field
	 * @public
	 * @param {String} titleText
	 * @return {LookupField}
	 * @this {LookupField}
	 */
	LookupField.prototype.setTitleText = function(titleText) {
		this.titleText = titleText;
		return this;
	}

	/**
	 * Gets the display text for this field
	 * @public
	 * @return {String}
	 * @this {LookupField}
	 */
	LookupField.prototype.getTitleText = function() {
		return this.titleText;
	}

	/**
	 * Sets the valuelist to use to display this field
	 * @public
	 * @param {String} vl
	 * @return {LookupField}
	 * @this {LookupField}
	 * @deprecated use setValueListName instead
	 */
	LookupField.prototype.setvalueListName = function(vl) {
		this.valueListName = vl;
		return this;
	}

	/**
	 * Sets the valuelist to use to display this field
	 * @public
	 * @param {String} valueListName
	 * @return {LookupField}
	 * @this {LookupField}
	 */
	LookupField.prototype.setValueListName = function(valueListName) {
		this.valueListName = valueListName;
		return this;
	}	

	/**
	 * Gets the value list name for this field
	 * @public
	 * @return {String}
	 * @this {LookupField}
	 */
	LookupField.prototype.getValueListName = function() {
		return this.valueListName;
	}

	/**
	 * Sets this field's visibility in the lookup form
	 * @public
	 * @param {Boolean} visible
	 * @return {LookupField}
	 * @this {LookupField}
	 */
	LookupField.prototype.setVisible = function(visible) {
		this.visible = visible;
		return this;
	}

	/**
	 * Indicates if this field should be displayed
	 * @public
	 * @return {Boolean}
	 * @this {LookupField}
	 */
	LookupField.prototype.isVisible = function() {
		return this.visible;
	}

	/**
	 * Sets the display format for this field
	 * @public
	 * @param {String} format
	 * @return {LookupField}
	 * @this {LookupField}
	 */
	LookupField.prototype.setFormat = function(format) {
		this.format = format;
		return this;
	}

	/**
	 * Gets the display format for this field;
	 * @public
	 * @return {String}
	 * @this {LookupField}
	 */
	LookupField.prototype.getFormat = function() {
		return this.format;
	}

	/**
	 * Sets the style class of this field
	 * @public
	 * @param {String} styleClass
	 * @return {LookupField}
	 * @this {LookupField}
	 */
	LookupField.prototype.setStyleClass = function(styleClass) {
		this.styleClass = styleClass;
		return this;
	}

	/**
	 * Returns the style class of this field
	 * @public
	 * @return {String}
	 * @this {LookupField}
	 */
	LookupField.prototype.getStyleClass = function() {
		return this.styleClass;
	}

	/**
	 * Sets the style class dataProvider of this field
	 * @public
	 * @param {String} styleClassDataprovider
	 * @return {LookupField}
	 * @this {LookupField}
	 */
	LookupField.prototype.setStyleClassDataprovider = function(styleClassDataprovider) {
		this.styleClassDataprovider = styleClassDataprovider;
		return this;
	}

	/**
	 * Returns the style class dataProvider of this field
	 * @public
	 * @return {String}
	 * @this {LookupField}
	 */
	LookupField.prototype.getStyleClassDataprovider = function() {
		return this.styleClassDataprovider;
	}

	/**
	 * Sets the width of this field
	 * @public
	 * @param {String} width Default "auto"
	 * @return {LookupField}
	 * @this {LookupField}
	 */
	LookupField.prototype.setWidth = function(width) {
		this.width = width;
		return this;
	}

	/**
	 * Returns the width of this field
	 * @public
	 * @return {String}
	 * @this {LookupField}
	 */
	LookupField.prototype.getWidth = function() {
		return this.width;
	}

	/**
	 * Returns the width of this field as an integer value
	 * @public
	 * @return {Number}
	 * @this {LookupField}
	 */
	LookupField.prototype.getWidthAsInteger = function() {
		if (this.width === 'auto') {
			return null;
		}
		var intValue = parseInt(this.width);
		if (isNaN(intValue)) {
			return intValue;
		}
		return null;
	}	
}

/**
 * @private 
 * @SuppressWarnings(unused)
 * @properties={typeid:35,uuid:"640AC4FA-EAE2-46B5-BE9A-28FC94F7FF35",variableType:-4}
 */
var initSvyLookup = (function() {
	init_Lookup();
	init_MultiLookup();
	init_LookupField();
})();
