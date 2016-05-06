var doc = document,body = $(doc.body),win = window,settings;
win.bcpie = {
	active: {
		sdk: '2016.05.05',
		tricks: {} // populated automatically
	},
	globals: {
		path: win.location.pathname.toLowerCase(),
		pathArray: win.location.pathname.toLowerCase().split(/(?=\/#?[a-zA-Z0-9])/g),
		param: win.location.search,
		paramArray: win.location.search.split(/(?=&#?[a-zA-Z0-9])/g),
		hash: win.location.hash,
		browser: {
			language: (navigator.languages ? navigator.languages[0] : (navigator.language || navigator.userLanguage)).toLocaleLowerCase()
		}
	},
	ajax: {
		token: function() {
			if (typeof Cookies('access_token') !== 'undefined') return Cookies('access_token');
			else return Cookies('access_token',window.location.hash.replace('#access_token=',''));
		},
		file: {
			get: function(data,options) {
				if (typeof data === 'undefined') data = {};
				if (typeof options !== 'object') options = {};
				data = {
					path: data.path || '' // string
				}
				if (data.path.indexOf('/') !== 0) data.path = '/'+data.path;
				if (data.path.split('/').pop().indexOf('.') === -1) {
					if (data.path.charAt(data.path.length - 1) !== '/') data.path = data.path+'/';
					data.path = data.path+'?meta';
				}
				options.url = '/api/v2/admin/sites/current/storage'+data.path;
				options.headers = {Authorization: bcpie.ajax.token()};
				options.method = 'GET';
				if (typeof options.dataType !== 'undefined' && (options.dataType.toLowerCase() === 'binary' || options.dataType.toLowerCase() === 'arraybuffer')) options.processData = false;

				return bcpie.utils.ajax(options);
			},
			save: function(data,options) {
				if (typeof data === 'undefined') data = {};
				if (typeof options !== 'object') options = {};
				data = {
					path: data.path || '', // string
					content: data.content || '', // file object, string
					version: data.version || 'draft-publish' // 'draft', 'draft-publish'
				}

				
				if (data.path.indexOf('/') !== 0) data.path = '/'+data.path;
				
				options.url = '/api/v2/admin/sites/current/storage'+data.path;
				if (data.path.charAt(data.path.length - 1) === '/' || data.type === 'folder') options.url += '?type=folder';
				else options.url += '?version='+data.version;
				
				options.headers = {Authorization: bcpie.ajax.token()};

				if (typeof data.content === 'string' || typeof data.content.length === 'undefined') {
					options.method = 'PUT';
					options.contentType = 'application/octet-stream';
					options.processData = false;
					if (typeof data.content.upload !== 'undefined' || typeof data.content.type !== 'undefined') {
						options.url.replace('?version='+data.version,'');
						options.data = data.content;
					}else if (typeof data.content === 'string') options.data = data.content;
					else options.data = JSON.stringify(data.content);
				}else {
					options.method = 'POST';
					options.contentType = false;
					options.cache = false;
					options.data = new FormData();
					options.data.append('file', data.content);
				}

				return bcpie.utils.ajax(options);
			},
			delete: function(data,options) {
				if (typeof data === 'undefined') data = {};
				if (typeof options !== 'object') options = {};
				data = {
					path: data.path || '', // string
					force: data.force || '' // folders only
				}
				if (data.path.indexOf('/') !== 0) data.path = '/'+data.path;
				if (data.path.charAt(data.path.length - 1) === '/') data.path.slice(0, - 1);
				if (data.force !== '') data.path = data.path+'&force='+data.force;

				options.url = '/api/v2/admin/sites/current/storage'+data.path;
				options.headers = {Authorization: bcpie.ajax.token()};
				options.method = 'DELETE';

				return bcpie.utils.ajax(options);
			},
			uploadStatus: function() {
				if (typeof data === 'undefined') data = {};
				if (typeof options !== 'object') options = {};
				options.url = '/api/v2/admin/sites/current/storage?status';
				options.method = 'GET';
				options.headers = {Authorization: bcpie.ajax.token()};

				return bcpie.utils.ajax(options);
			}
		},
		folder: {
			save: function(data,options) {
				if (typeof data === 'undefined') data = {};
				if (typeof options !== 'object') options = {};
				data.type = 'folder';
				return bcpie.ajax.file.save(data,options);
			},
			delete: function(data,options) {
				if (typeof data === 'undefined') data = {};
				if (typeof options !== 'object') options = {};
				data.force = data.force || false;
				return bcpie.ajax.file.delete(data,options);
			},
			get: function(data,options) {
				if (typeof data === 'undefined') data = {};
				if (typeof options !== 'object') options = {};
				return bcpie.ajax.file.get(data,options);
			}
		},
		template: {
			save: function(data,options) {
				if (typeof options === 'undefined') options = {};
				if (typeof data === 'undefined') data = {};
				data = {
					id: data.id || null,
					categoryId: data.categoryId || -1,
					name: data.name || null,
					displayFileName: data.displayFileName || null,
					printerView: data.printerView || false,
					displayable: data.displayable || true,
					enabled: data.enabled || true,
					default: data.default || false,
					noHeaders: data.noHeaders || true,
					desktopContent: {content:data.content || null}
				};

				options.url = '/webresources/api/v3/sites/current/templates';
				if (data.id !== null) {
					options.url += '/'+data.id;
					options.method = 'PUT';
				}else options.method = 'POST';
				delete data.id;
				options.data = JSON.stringify(data);
				options.headers = {Authorization: bcpie.ajax.token()};
				options.mimeType = 'application/json';
				options.processData = false;

				return bcpie.utils.ajax(options);
			}
		},
		webapp: {
			item: {
				all: function(data,options) {
					if (typeof data === 'undefined') data = {};
					if (typeof options !== 'object') options = {};
					data = {
						webapp: data.webapp || null, // integer, string
						item: null, // doesn't accept an item value
						filters: data.filters || {}, // object
						items: data.items || [],
						finished: data.finished || false
					}
					options.async = false;
					if (data.finished === false) {
						var response = bcpie.ajax.webapp.item.get(data,options).responseJSON;
						data.items = data.items.concat(response.items);
						if (response.links[2].uri !== null) data.filters.skip = response.links[2].uri.split('skip=')[1].split('&')[0];
						else data.finished = true;
						return bcpie.ajax.webapp.item.all(data,options);
					};
					if (data.finished ===true) {
						return {
							totalItemsCount: data.items.length,
							items: data.items,
							skip: 0,
							limit: data.items.length
						}
					}
				},
				get: function(data,options) {
					if (typeof data === 'undefined') data = {};
					if (typeof options !== 'object') options = {};
					data = {
						webapp: data.webapp || null, // integer, string
						item: data.item || null, // integer
						filters: data.filters || {} // object
					}

					// Catch data errors
					var errors = bcpie.ajax.webapp.errors(data);
					if (errors.length > 0) return errors;

					options.url = '/api/v2/admin/sites/current/webapps/'+data.webapp+'/items';
					if (data.item !== null) options.url += '/'+data.item;
					else options.url += bcpie.utils.filters(data.filters);
					options.headers = {Authorization: bcpie.ajax.token()};
					options.method = 'GET';
					return bcpie.utils.ajax(options);
				},
				save: function(data,options) {
					if (typeof data === 'undefined') data = {};
					if (typeof options !== 'object') options = {};
					data = {
						content: data.content || null,  // $, {}
						webapp: data.webapp || null, // integer, string
						item: data.item || null // integer
					}

					// Catch data errors
					var errors = bcpie.ajax.webapp.errors(data);
					if (errors.length > 0) return console.log(errors);

					if (bcpie.utils.isAdmin() === true) {
						options.url = '/api/v2/admin/sites/current/webapps/'+data.webapp+'/items';
						if (data.item !== null) options.url += '/'+data.item;
						options.headers = {Authorization: bcpie.ajax.token()};

						var fieldTypes = {name:'String', weight:'Number', releaseDate:'DateTime', expiryDate:'String', enabled:'Boolean', slug:'String', description:'String', roleId:'Number', submittedBy:'Number', templateId:'Number', address:'String', city:'String', state:'String', zipCode:'String', country:'String',fields:{}},
							newData = {name:'', releaseDate:moment().subtract(12,'hour').format('YYYY-MM-DD'), expiryDate:'9999-01-01', enabled:true, country:bcpie.globals.site.countryCode, fields:{}},
							allFields = {name:'', weight:0, releaseDate:moment().subtract(12,'hour').format('YYYY-MM-DD'), expiryDate:'9999-01-01', enabled:true, slug:'', description:'', roleId:null, submittedBy:-1, templateId:-1, address:'', city:'', state:'', zipCode:'', country:bcpie.globals.visitor.country,fields:{}},
							field, result, fields;

						options.data = bcpie.utils.serializeObject(data.content);
						options.processData = false;

						if (typeof bcpie.ajax.webapp.item.save[data.webapp] === 'undefined') {
							// Retrieve the custom fields list from the server
							bcpie.ajax.webapp.item.save[data.webapp] = bcpie.ajax.webapp.fields({webapp: data.webapp},{async:false});
						}


						fields = bcpie.ajax.webapp.item.save[data.webapp].responseJSON;
						if (data.item !== null) {
							options.method = 'PUT';
							newData = {fields:{}};
						}else options.url = options.url.replace('/'+data.item,'');

						// Add custom fields to newData object
						for (var i=0; i<fields.items.length; i++) {
							if (typeof options.data[fields.items[i].name] !== 'undefined') {
								newData.fields[fields.items[i].name] = '';
								fieldTypes.fields[fields.items[i].name] = fields.items[i].type;
							}
						}

						// Fill the data object with form values
						for (var key in options.data) {
							if (typeof allFields[key] !== 'undefined') {
								if (options.data[key] !== 'undefined') {
									newData[key] = options.data[key];
									if (key === 'country' && newData[key] === ' ' ) newData[key] = '';
									if (key === 'state' && newData[key] === ' ' ) newData[key] = '';
									if (fieldTypes[key] === 'Number') {
										newData[key] = bcpie.utils.validation.number(key,newData[key]);
										if (newData[key] === NaN) delete data[key];
									}else if (fieldTypes[key] === 'Boolean') {
										newData[key] = bcpie.utils.validation.boolean(key,newData[key]);
									}else if (fieldTypes[key] === 'DateTime') {
										newData[key] = bcpie.utils.validation.dateTime(key,newData[key]);
									}
								}
							}else if (typeof newData.fields[key] !== 'undefined') {
								if (options.data[key] !== 'undefined') {
									newData.fields[key] = options.data[key];
									if (fieldTypes.fields[key] === 'Number' || fieldTypes.fields[key] === 'DataSource') {
										newData.fields[key] = bcpie.utils.validation.number(key,newData.fields[key]);
										if (fieldTypes.fields[key] === 'DataSource' && newData.fields[key] === 0) newData.fields[key] = null;
										if (newData.fields[key] === NaN) delete newData.fields[key];
									}else if (fieldTypes.fields[key] === 'Boolean') {
										newData.fields[key] = bcpie.utils.validation.boolean(key,newData.fields[key]);
										if (newData.fields[key] === null) delete newData.fields[key];
									}else if (fieldTypes.fields[key] === 'DateTime') {
										newData.fields[key] = bcpie.utils.validation.dateTime(key,newData.fields[key]);
										if (newData.fields[key] === null) delete newData.fields[key];
									}
								}else delete newData.fields[key];
							}
						}
						if (typeof options.data['country'] === 'undefined') newData['country'] = allFields['country'];
						options.data = JSON.stringify(newData);
					}else {
						if (data.item === null) options.url = '/CustomContentProcess.aspx?CCID='+data.webapp+'&OTYPE=1';
						else options.url = '/CustomContentProcess.aspx?A=EditSave&CCID='+data.webapp+'&OID='+data.item+'&OTYPE=35';

						if (body.find('[name=Amount]').length > 0) options.url = bcpie.globals.secureDomain + options.url;
						if (data.content instanceof $) {
							if (data.content.is('form') || data.content.is('input,select,textarea')) options.data = data.content.serialize();
							else options.data = data.content.find('input,select,textarea').serialize();
						}else if (bcpie.utils.isElement(data.content)) {
							data.content = $(data.content);
							if (data.content.is('form') || data.content.is('input,select,textarea')) options.data = data.content.serialize();
							else options.data = data.content.find('input,select,textarea').serialize();
						}else if (typeof data.content === 'object' && data.content.constructor.toString().indexOf('Array') == -1) options.data = $.param(data.content);
						else return 'Content may not be in the correct form.';

						options.contentType = 'application/x-www-form-urlencoded';
					}
					return bcpie.utils.ajax(options);
				},
				delete: function(data,options) {
					if (typeof data === 'undefined') data = {};
					if (typeof options !== 'object') options = {};
					data = {
						webapp: data.webapp || null, // integer, string
						item: data.item || null // integer
					}

					// Catch data errors
					var errors = bcpie.ajax.webapp.errors(data);
					if (errors.length > 0) return errors;

					if (bcpie.utils.isAdmin() === true) {
						options.url = '/api/v2/admin/sites/current/webapps/'+data.webapp+'/items/'+data.item;
						options.headers = {Authorization: bcpie.ajax.token()};
						options.method = 'DELETE';
					}else {
						options.url = '/CustomContentProcess.aspx?CCID='+data.webapp+'&OID='+data.item+'&A=Delete';
						options.contentType = false;
					}
					return bcpie.utils.ajax(options);
				},
				categories: function(data,options) {
					if (typeof data === 'undefined') data = {};
					if (typeof options !== 'object') options = {};
					data = {
						mode: data.mode.toLowerCase() || 'get', // 'get', 'save', delete
						webapp: data.webapp || null, // string
						item: data.item || null, // integer
						content: data.content || null  // $, {}
					}
					// Catch data errors
					var errors = bcpie.ajax.webapp.errors(data);
					if (errors.length > 0) return errors;

					options.url = '/api/v2/admin/sites/current/webapps/'+data.webapp+'/items/'+data.item+'/categories';
					options.headers = {'Authorization': bcpie.ajax.token()};

					if (data.mode === 'get') options.method = 'GET';
					else if (data.mode === 'save') {
						options.method = 'PUT';
						options.data = JSON.stringify(data.content);
						options.processData = false;
					}
					return bcpie.utils.ajax(options);
				}
			},
			get: function(data,options) {
				if (typeof data === 'undefined') data = {};
				if (typeof options !== 'object') options = {};
				data = {
					webapp: data.webapp || null
				}
				// Catch data errors
				var errors = bcpie.ajax.webapp.errors(data);
				if (errors.length > 0) return errors;

				options.url = '/api/v2/admin/sites/current/webapps/'+data.webapp;
				options.headers = {'Authorization': bcpie.ajax.token()};
				options.method = 'GET';
				return bcpie.utils.ajax(options);
			},
			fields: function(data,options) {
				if (typeof data === 'undefined') data = {};
				if (typeof options !== 'object') options = {};
				data = {
					webapp: data.webapp || null, // string
					field: data.field || null, // string
				}
				// Catch data errors
				var errors = bcpie.ajax.webapp.errors(data);
				if (errors.length > 0) return errors;

				options.url = '/api/v2/admin/sites/current/webapps/'+data.webapp+'/fields';
				if (data.field !== null) options.url += '/' + data.field;
				options.headers = {'Authorization': bcpie.ajax.token()};
				options.method = 'GET';
				return bcpie.utils.ajax(options);
			},
			search: function(data,options) {
				if (typeof data === 'undefined') data = {};
				if (typeof options !== 'object') options = {};
				data = {
					webapp: data.webapp || null,
					formID: data.formID || null,
					responsePageID: data.responsePageID || null,
					content: data.content || null,
					json: data.json || true
				}
				// Catch data errors
				var errors = bcpie.ajax.webapp.errors(data);
				if (errors.length > 0) return errors;

				if (data.responsePageID !== null) data.responsePageID = '&PageID='+data.responsePageID;
				else data.responsePageID = '';

				if (data.json === true) data.json = '&json='+data.json;
				else data.json = '';

				options.url = '/Default.aspx?CCID='+data.webapp+'&FID='+data.formID+'&ExcludeBoolFalse=True'+data.responsePageID+data.json;
				options.data = $.param(data.content);
				// options.contentType = false;
				options.contentType = options.contentType || 'application/x-www-form-urlencoded'; /* is this better than false? */ 
				options.method = 'POST';
				return bcpie.utils.ajax(options);
				// var response = $(bcpie.utils.ajax(options).responseText).find('.webappsearchresults');
				// return (response.children().length > 0) ? response.children() : response.html();
			},
			list: function(options) {
				if (typeof options !== 'object') options = {};
				options.url = '/api/v2/admin/sites/current/webapps';
				options.headers = {'Authorization': bcpie.ajax.token()};
				options.method = 'GET';
				return bcpie.utils.ajax(options);
			},
			errors: function(data) {
				if (typeof data === 'undefined') data = {};
				data.errors = [];
				if (typeof data.webapp !== 'undefined') {
					if (data.webapp === null) data.errors.push('"webapp" parameter cannot be null.');
					else if (data.webapp.toString().match(/\D/g) === null && bcpie.utils.isAdmin() === true) data.errors.push('For API use, the "webapp" parameter should be the Web App name, not the ID.');
					else if (data.webapp.toString().match(/\D/g) !== null && bcpie.utils.isAdmin() === false) data.errors.push('For non-API use, the "webapp" parameter should be the Web App ID, not the name.');
				}
				if (typeof data.item !== 'undefined') {
					if (data.item === null) {
						if (data.mode === 'get' || data.mode === 'delete' || (data.mode === 'save' && bcpie.utils.isAdmin() === false)) data.errors.push('"item" parameter cannot be null.');
					}else if (data.item.toString().match(/\D/g) !== null) data.errors.push('"item" parameter must be an integer.');
				}
				if (typeof data.formID !== 'undefined') {
					if (data.formID.toString().match(/\D/g) !== null) data.errors.push('"formID" parameter must be an integer.');
				}
				if (data.mode === 'get' && bcpie.utils.isAdmin() === false) data.errors.push('"get" mode is for API use only.');
				return data.errors;
			}
		},
		crm: {
			customers: {
				get: function(data,options) {
					if (typeof data === 'undefined') data = {};
					if (typeof options !== 'object') options = {};
					data = {
						customerID: data.customerID || null, // integer
						filters: data.filters || null // object
					}
					options.headers = {'Authorization': bcpie.ajax.token()};
					options.url = '/webresources/api/v3/sites/current/customers';
					if (data.customerID !== null) options.url += '/'+data.customerID;
					options.method = 'GET';
					options.mimeType = 'application/json';
					if (data.filters !== null) options.url += bcpie.utils.filters(data.filters);
					return bcpie.utils.ajax(options);
				},
				logout: function() {
					if (typeof options !== 'object') options = {};
					options.url = '/logoutprocess.aspx';
					options.method = 'POST';
					return bcpie.utils.ajax(options);
				},
				save: function(data,options) {
					if (typeof data === 'undefined') data = {};
					if (typeof options !== 'object') options = {};
					data = {
						customerID: data.customerID || null, // integer
						content: data.content || null
					}
					options.headers = {'Authorization': bcpie.ajax.token()};
					options.url = '/webresources/api/v3/sites/current/customers';
					if (data.customerID !== null) options.url += '/'+data.customerID;
					if (bcpie.utils.isAdmin() === true) {
						options.data = JSON.stringify(data.content);
						options.processData = false;
						if (data.customerID !== null) options.method = 'PUT';
						else options.method = 'POST';
					}else {
						options.url = '/MemberProcess.aspx';
						options.data = $.param(data.content);
						options.contentType = false;
					}
					return bcpie.utils.ajax(options);
				},
				delete: function(data,options) {
					if (typeof data === 'undefined') data = {};
					if (typeof options !== 'object') options = {};
					data = {
						customerID: data.customerID || null, // integer
					}
					options.headers = {'Authorization': bcpie.ajax.token()};
					options.url = '/webresources/api/v3/sites/current/customers';
					if (data.customerID !== null) options.url += '/'+data.customerID;
					options.method = 'DELETE';
					return bcpie.utils.ajax(options);
				},
				secureZones: function(data,options) {
					if (typeof data === 'undefined') data = {};
					if (typeof options !== 'object') options = {};
					data = {
						mode: data.mode.toLowerCase() || 'get', // 'get','subscribe',unsubscribe
						customerID: data.customerID || null, // integer
						filters: data.filters || null, // object
						zones: data.zones || null // object
					}
					options.headers = {'Authorization': bcpie.ajax.token()};
					options.url = '/webresources/api/v3/sites/current/customers/'+data.customerID+'/securezones';

					if (data.mode === 'get') options.method = 'GET';
					else if (data.mode === 'subscribe') {
						options.method = 'POST';
						options.data = JSON.stringify(data);
						options.processData = false;
					}else if (data.mode === 'unsubscribe') {
						options.method = 'DELETE';
						options.url += '&items='+bcpie.utils.jsonify(data.zones);
					}
					return bcpie.utils.ajax(options);
				},
				orders: function(data,options) {
					if (typeof data === 'undefined') data = {};
					if (typeof options !== 'object') options = {};
					data = {
						mode: data.mode.toLowerCase() || 'get', // 'get'
						customerID: data.customerID || null, // integer
						filters: data.filters || null, // object
					}
					options.headers = {'Authorization': bcpie.ajax.token()};
					options.url = '/webresources/api/v3/sites/current/customers/'+data.customerID+'/orders'+bcpie.utils.filters(data.filters);
					options.method = 'GET';
					return bcpie.utils.ajax(options);
				},
				addresses: function(data,options) {
					if (typeof data === 'undefined') data = {};
					if (typeof options !== 'object') options = {};
					data = {
						mode: data.mode.toLowerCase() || 'get', // 'get'
						customerID: data.customerID || null, // integer
						filters: data.filters || null, // object
					}
					options.headers = {'Authorization': bcpie.ajax.token()};
					options.url = '/webresources/api/v3/sites/current/customers/'+data.customerID+'/addresses'+bcpie.utils.filters(data.filters);
					options.method = 'GET';
					return bcpie.utils.ajax(options);
				}
			}
		}
	},
	utils: {
		isAdmin: function() { return bcpie.ajax.token().length > 10 && win.location.origin.match(/https:\/\/.*?-apps.worldsecuresystems.com/) !== null},
		escape: function(str) { return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g,"\\$&"); },
		jsonify: function(str) {
			bcpie.utils.jsonify.brace = /^[{\[]/;
			bcpie.utils.jsonify.token = /[^,(:){}\[\]]+/g;
			bcpie.utils.jsonify.quote = /^['"](.*)['"]$/;
			bcpie.utils.jsonify.escap = /(["])/g;
			bcpie.utils.jsonify.comma = {};
			bcpie.utils.jsonify.comma.curly = /,(\s*)}/g;
			bcpie.utils.jsonify.comma.square = /,(\s*)]/g;

			// Wrap with '{}' if not JavaScript object literal
			str = $.trim(str);
			if (bcpie.utils.jsonify.brace.test(str) === false) str = '{'+str+'}';

			// Fix trailing commas
			str = str.replace(bcpie.utils.jsonify.comma.curly, '}').replace(bcpie.utils.jsonify.comma.square, ']');

			// Retrieve token and convert to JSON
			return str.replace(bcpie.utils.jsonify.token, function (a) {
				a = $.trim(a);
				// Keep some special strings as they are
				if ('' === a || 'true' === a || 'false' === a || 'null' === a || (!isNaN(parseFloat(a)) && isFinite(a))) return a;
				// For string literal: 1. remove quotes at the top end; 2. escape double quotes in the middle; 3. wrap token with double quotes
				else return '"'+ a.replace(bcpie.utils.jsonify.quote, '$1').replace(bcpie.utils.jsonify.escap, '\\$1')+ '"';
			});
		},
		encode: function(str) {
			return encodeURIComponent(str).replace(/'/g,"%27").replace(/"/g,"%22");
		},
		decode: function(str) {
			return decodeURIComponent(str.replace(/\+/g,  " "));
		},
		guid: function() {
			function s4() {
				return Math.floor((1+Math.random()) * 0x10000).toString(16).substring(1);
			}
			return s4()+s4()+'-'+s4()+'-'+s4()+'-'+s4()+'-'+s4()+s4()+s4();
		},
		isElement: function(object){
			return (
				typeof HTMLElement === 'object' ? object instanceof HTMLElement : //DOM2
					object && typeof object === 'object' && object !== null && object.nodeType === 1 && typeof object.nodeName==='string'
			);
		},
		serializeObject: function(object) {
			var o = '',boolFalse,a;
			if (object instanceof jQuery) {
				if (object.is('form')) a = object.serializeArray();
				else if (object.is('select,textarea,input')) a = object.serializeArray(); // [{name:object.attr('name'),value:object.val()}];
				else a = object.find('input,select,textarea').serializeArray();
				boolFalse = object.find('[type=checkbox]').filter(function(){return $(this).prop('checked') === false});
				for (var i = 0; i < boolFalse.length; i++) {
					a.push({name: $(boolFalse[i]).attr('name'), value:null});
				}
			}else if ($.isArray(object) && typeof object[0].name !== 'undefined' && typeof object[0].value !== 'undefined') {
				a = object;
			}else if ($.isPlainObject(object) && typeof object.name !== 'undefined' && typeof object.value !== 'undefined') {
				a = [object];
			}else if ($.isPlainObject(object)) {
				o = object;
			}else {
				console.log('Malformed object passed to bcpie.utils.serializeObject method.');
				a = [];
			}
			if (o === '') {
				o = {};
				for (var i=0; i<a.length; i++) {
					if (o[a[i].name] !== undefined) {
						if (!o[a[i].name].push) o[a[i].name] = [o[a[i].name]];
						o[a[i].name].push(a[i].value || '');
					}
					else o[a[i].name] = a[i].value || '';
				}
			}
			return o;
		},
		closestChildren: function(data,depricatedMatch,depricatedFindAll) {
			if (data instanceof jQuery) { var depricatedSelector = data;} // for backwards compatibility

			data = {
				selector: data.selector || depricatedSelector || null,
				match: data.match || depricatedMatch || null,
				findAll: data.findAll || depricatedFindAll || false,
				results: data.results || null // the results property is used internally by the method
			};

			var children = (data.selector instanceof jQuery) ? data.selector.children() : $(data.selector).children();
			if (children.length === 0) {
				if (data.results !== null) return data.results;
				else return $();
			}
			if (data.results !== null) data.results = data.results.add(children.filter(data.match));
			else data.results = children.filter(data.match);

			if (data.findAll !== true) return (data.results.length > 0) ? data.results : bcpie.utils.closestChildren({
				selector: children,
				match: data.match
			});
			else return bcpie.utils.closestChildren({
				selector: children.not(data.results),
				match: data.match,
				findAll: data.findAll,
				results: data.results
			});
		},
		searchArray: function(array,value) {
			// Best for large arrays. For tiny arrays, use indexOf.
			for (var i = 0; i < array.length; i++) {
				if (array[i] === value) return i;
			}
			return -1;
		},
		classObject: function(classes) {
			return {
				names: classes,
				selector: '.'+classes.replace(/ /g,'.')
			}
		},
		xml2json: function(xml) {
			var obj = {};

			if (xml.nodeType == 1) { // element
				// do attributes
				if (xml.attributes.length > 0) {
				obj['@attributes'] = {};
					for (var j = 0; j < xml.attributes.length; j++) {
						var attribute = xml.attributes.item(j);
						obj['@attributes'][attribute.nodeName] = attribute.nodeValue;
					}
				}
			} else if (xml.nodeType == 3) { // text
				obj = xml.nodeValue;
			}

			// do children
			if (xml.hasChildNodes()) {
				for(var i = 0; i < xml.childNodes.length; i++) {
					var item = xml.childNodes.item(i);
					var nodeName = item.nodeName;
					if (typeof(obj[nodeName]) == 'undefined') {
						obj[nodeName] = bcpie.utils.xml2json(item);
					} else {
						if (typeof(obj[nodeName].push) == 'undefined') {
							var old = obj[nodeName];
							obj[nodeName] = [];
							obj[nodeName].push(old);
						}
						obj[nodeName].push(bcpie.utils.xml2json(item));
					}
				}
			}
			return obj;
		},
		isJson: function(str) {
			try {
				JSON.parse(str);
			} catch (e) {
				return false;
			}
			return true;
		},
		makeSlug: function(string) {
			var output = '',
				valid = '-0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

			string = string.replace(/ /g, '-').replace().replace(/-{2,}/g, "-");

			for (var i = 0; i < string.length; i++) {
				if (valid.indexOf(string.charAt(i)) != -1) output += string.charAt(i);
			}
			return output.toLowerCase();
		},
		executeCallback: function(data, depricatedCallback, depricatedData, depricatedStatus, depricatedXhr) {
			if (data instanceof jQuery) var depricatedSelector = data;
			data = {
				selector: data.selector || depricatedSelector || null,
				settings: data.settings || null,
				callback: data.callback || depricatedCallback || null,
				content: data.content || depricatedData || null,
				status: data.status || depricatedStatus || null,
				xhr: data.xhr || depricatedXhr || null
			};
			if (typeof data.callback === 'string') data.callback = win[data.callback];
			if (typeof data.callback === 'function') {
				function parameter(selector, settings, callback, data, status, xhr) {
					var deferred = $.Deferred();
					deferred.resolve(callback({
						selector: selector || null,
						settings: settings || null,
						content: data || null,
						status: status || null,
						xhr: xhr || null
					}));
					return deferred.promise();
				}

				return $.when(parameter(data.selector, data.settings, data.callback, data.content, data.status, data.xhr));
			}
		},
		filters: function(filters) {
			var response = '?limit=';
			response += filters.limit || 500;
			response += '&skip=';
			response += filters.skip || 0;
			if (typeof filters.order !== 'undefined') response += '&order='+bcpie.utils.encode(filters.order);
			if ($.isArray(filters.fields)) response += '&fields='+bcpie.utils.encode(filters.fields.toString());
			if (typeof filters.where === 'object') response += '&where='+bcpie.utils.encode(JSON.stringify(filters.where));
			return response;
		},
		ajax: function(options) {
			var settings = options || {};
			settings.url = options.url || '';
			settings.method = options.type || options.method || 'POST';
			settings.contentType = (options.contentType !== false) ? options.contentType || 'application/json' : false;
			if (bcpie.utils.isAdmin() === true) settings.connection = options.connection || 'keep-alive';
			if (typeof settings.data === 'undefined' && typeof settings.dataType !== 'undefined' && settings.dataType.toLowerCase() !== 'binary' && settings.dataType.toLowerCase() !== 'arraybuffer' && settings.dataType.toLowerCase() !== 'blob') delete settings.dataType;
			else if (typeof settings.data !== 'undefined' && typeof settings.dataType === 'undefined' && bcpie.utils.isJson(settings.data)) settings.dataType = 'application/json';
			return $.ajax(settings);
		},
		validation: {
			number: function(fieldName,value) {
				if (value === '') {
					return null;
				}else if (Number(value) === NaN) {
					console.log('The value of "'+fieldName+'" is not a number.');
					return NaN;
				}else return Number(value);
			},
			boolean: function(fieldName,value) {
				if (value == null || value.trim() == '' || value.toLowerCase() === 'false' || value == '0' || value === 'off') return false;
				else if (value.toLowerCase() === 'true' || value === '1' || value === 'on') return true;

				else return null;
			},
			dateTime: function(fieldName,value) {
				if (value.trim() === '') return null;
				else if (value.match(/([0-9]{4})-((0[1-9])|(1[0-2]))-((0[1-9])|([1-2][0-9])|(3[0-1]))T(([0-1][0-9])|(2[0-4])):([0-5][0-9]):([0-5][0-9])/)) return value;
				else {
					console.log('The value of "'+fieldName+'" is an invalid dateTime format.');
					return 'Invalid Date';
				}
			}
		}
	},
	extensions: {
		settings: function(selector,options,settings) {
			if (typeof settings.name === 'string' && settings.name.toLowerCase() !== 'engine' && settings.name.toLowerCase() !== 'settings') {
				if (typeof settings.defaults === 'undefined') settings.defaults = {};
				selector.data('bcpie-'+settings.name.toLowerCase()+'-settings', $.extend({}, settings.defaults, options, bcpie.globals));
				bcpie.active.tricks[settings.name] = settings.version;
				return selector.data('bcpie-'+settings.name.toLowerCase()+'-settings');
			}
		},
		engine: function(scope) {
			if (typeof scope === 'undefined') scope = $(doc);
			var tricks = bcpie.extensions.tricks,trick,instances,instance,arr=[],str="",options={},module = [],functions = {},defaults = {};
			for (trick in tricks) {
				arr=[];str="";options={};module = [];functions = {};defaults = {};
				instances = scope.find('[data-bcpie-'+trick.toLowerCase()+']');
				for (var a = 0; a<instances.length; a++) {
					options = {};instance = $(instances[a]);
					str = instance.data('bcpie-'+trick.toLowerCase());
					if (typeof str === 'string' && str.indexOf(':') > -1) {
						if (str.indexOf(';') > -1) {
							str = str.split(';');
							for (var e=0;e<str.length;e++){
								arr = str[e].split(':');
								options[$.trim(arr[0])] = GetOptionValue($.trim(arr.slice(1).join(':')));
							}
						}else {
							arr = str.split(':');
							options[$.trim(arr[0])] = GetOptionValue($.trim(arr.slice(1).join(':')));
						}
					}
					bcpie.extensions.tricks[trick](instance,options);
				}
			}
			function GetOptionValue(valstr){
				switch(valstr.toLowerCase()){
					case 'true': return true;
					case 'false': return false;
					default: return valstr;
				}
			}
		},
		tricks: {} // populated automatically
	}
};
bcpie.globals = $.extend({},bcpie.globals,globals);
bcpie.globals.currentDomain = (win.location.href.indexOf(bcpie.globals.primaryDomain) > -1) ? bcpie.globals.primaryDomain : bcpie.globals.secureDomain;

// Initialize tricks
$(function() {
	bcpie.extensions.engine();
});