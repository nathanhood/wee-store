/* global Number */

Wee.fn.make('store', {
	_construct: function() {
		this.$private.addNaNPolyfill();
	},
	get: function(key) {
		var priv = this.$private,
			segments = key.toString().split('.'),
			data = priv.getStorage(segments.shift());

		if (data && segments.length) {
			return priv.storage(data, segments).val;
		}

		return data;
	},
	set: function(key, val) {
		var priv = this.$private,
			segments = key.toString().split('.'),
			mainKey  = segments.shift(),
			data = priv.getStorage(mainKey) || (priv.isNumber(segments[0]) ? [] : {}),
			stored;

		if (segments.length) {
			stored = priv.storage(data, segments, true);

			stored.data[stored.key] = val;
		} else {
			data = val;
		}

		sessionStorage.setItem(mainKey, JSON.stringify(data));

		return val;
	},
	drop: function(key) {
		var priv = this.$private,
			segments = key.toString().split('.'),
			mainKey  = segments.shift(),
			data = priv.getStorage(mainKey),
			stored;

		if (! segments.length) {
			return priv.removeStorage(mainKey);
		}

		stored = priv.storage(data, segments);

		priv.drop(stored.data, stored.key, stored.val);

		sessionStorage.setItem(mainKey, JSON.stringify(data));

		return stored.val;
	}
}, {
	drop: function(root, key, val) {
		Array.isArray(root) ?
			root.splice(key, 1) :
			delete root[key];

		return val !== undefined ? root[key] : root;
	},

	/**
	 * Retrieve item from browser storage
	 *
	 * @param {string} key
	 * @returns {null|Object|Array|string|number|undefined}
	 */
	getStorage: function(key) {
		var data = sessionStorage.getItem(key);

		return data === undefined ? null : JSON.parse(data);
	},

	/**
	 * Remove property from browser storage
	 *
	 * @param {string} key
	 */
	removeStorage: function(key) {
		sessionStorage.removeItem(key);
	},

	/**
	 * Retrieve data from passed in object/creating properties if needed
	 *
	 * @param {Object} data
	 * @param {Array} segments
	 * @param {boolean} [create]
	 * @returns {Object}
	 */
	storage: function(data, segments, create) {
		var scope = this,
			val = null,
			lastKey = segments.pop();

		// Redefine data to be context of selection
		segments.forEach(function(key, i) {
			var nextIndex = i + 1,
				next = nextIndex === segments.length ? lastKey : segments[nextIndex];

			data = data.hasOwnProperty(key) ?
				data[key] :
				(create ?
					(scope.isNumber(next) ?
						data[key] = [] :
						data[key] = {}
					) :
					[]
				);
		});

		if (data.hasOwnProperty(lastKey)) {
			val = data[lastKey];
		}

		return {
			data: data,
			key: lastKey,
			val: val
		};
	},

	/**
	 * Test whether value is a number
	 *
	 * @param val
	 * @returns {boolean}
	 */
	isNumber: function(val) {
		return ! isNaN(parseInt(val));
	},

	/**
	 * Add polyfill for ES5 since it does not have Number.isNaN
	 * NaN is only value that does not equal itself
	 */
	addNaNPolyfill: function() {
		Number.isNaN = Number.isNaN ||
			function(value) {
				return value !== value;
			};
	}
});