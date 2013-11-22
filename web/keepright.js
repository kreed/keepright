// compress using ./uglify.sh

///////////////////////////////////////////////////////////
// overrides for leaflet-hash to save checked error types
///////////////////////////////////////////////////////////

// save checkbox state into a short-ish hash to make the URL look pretty
//
// this creates binary data that is then base64 encoded
//
// binary format:
// byte 0    : length n
// byte 1 - n: bitflags of primary error types. error numbers are divided by
//             ten and first two bits reserved for show_ign/tmpign checkboxes
//             so e.g. if byte 1, bit 2 is set then error 10 is enabled
//             if byte 3, bit 0 is set then error 230 is enabled
//
// from byte n onward the subtype errors follow in two byte pairs
// first byte: ((parent error type / 10) << 1) + subtype 9 bit
// second byte: bit flag of subtypes 1-8
function createCheckboxHash() {
	var checkboxes = document.myform.querySelectorAll('input[name^=ch]');

	var primaryChecked = [];
	var subChecked = [];
	for (var i = 0; i < checkboxes.length; ++i) {
		var el = checkboxes[i];
		if (el.checked) {
			var err_no = parseInt(el.name.substr(2));
			var primary = err_no / 10 >> 0;
			var sub = err_no % 10;
			if (sub == 0) {
				primaryChecked[primary + 1] = true;
			} else {
				set_bit(subChecked, primary, sub - 1);
			}
		}
	}

	// stick ign/tmpign in the first two spots
	if (document.myform.show_ign.checked) primaryChecked[0] = true;
	if (document.myform.show_tmpign.checked) primaryChecked[1] = true;

	// store checked error types in an array of 1 byte bitflags
	var octets = [0];

	for (var i = 0; i < primaryChecked.length; ++i) {
		if (primaryChecked[i]) {
			set_bit(octets, 1 + (i / 8 >> 0), i % 8);
		}
	}

	var j = octets.length;
	octets[0] = j;

	for (var i = 0; i < subChecked.length; ++i) {
		if (subChecked[i]) {
			var n = i << 1;
			var bitflag = subChecked[i];
			if (bitflag >> 8) { // 9th bit is set; stick it in n
				n = n | 1;
				bitflag = bitflag & 255;
			}
			octets[j++] = n;
			octets[j++] = bitflag;
		}
	}

	function set_bit(array, i, bit) {
		array[i] = (1 << bit) + (array[i] || 0);
	}

	// base64 encode result, using - instead of /
	return window.btoa(String.fromCharCode.apply(String, octets)).replace(/\//g, '-');
}

// parse base64-encoded checkbox hash created with createCheckboxHash()
function parseCheckboxesHash(hash) {
	var octets = window.atob(hash.replace(/-/g, '/'));
	if (!octets) return null;

	var checked = {};

	var n = octets.charCodeAt(0);
	for (var i = 1; i < n; ++i) {
		var flag = octets.charCodeAt(i);
		var error_no = 10 * (8 * (i - 1) - 1);
		while (flag) {
			if (flag & 1) {
				if (error_no == -10) {
					checked['show_ign'] = true;
				} else if (error_no == 0) {
					checked['show_tmpign'] = true;
				} else {
					checked['ch' + error_no] = true;
				}
			}
			flag >>= 1;
			error_no += 10;
		}
	}

	for (var i = n; i < octets.length; i = i + 2) {
		var error_no = octets.charCodeAt(i);
		var flag = octets.charCodeAt(i + 1);

		flag += ((error_no & 1) << 8);
		error_no = (error_no >> 1) * 10 + 1;

		while (flag) {
			if (flag & 1) checked['ch' + error_no] = true;
			flag >>= 1;
			error_no += 1;
		}
	}

	return checked;
}

// formatHash from leaflet-hash modified to save checkbox hash and userfilter
L.Hash.prototype.formatHash = function(map) {
	var center = map.getCenter().wrap();
	var zoom = map.getZoom();
	var precision = Math.max(0, Math.ceil(Math.log(zoom) / Math.LN2));

	var array = [zoom,
		center.lat.toFixed(precision),
		center.lng.toFixed(precision),
		checkboxHash];

	if (document.myform.userfilter.value)
		array.push(document.myform.userfilter.value);

	return "#" + array.join("/");
}

// parseHash from leaflet-hash modified to accept up to 5 args.
// the additional args just ignored here; they are parsed
// separately down in init()
L.Hash.prototype.parseHash = function(hash) {
	var args = splitHash(hash);
	if (args.length >= 3 && args.length <= 5){
		var zoom = parseInt(args[0], 10),
			lat = parseFloat(args[1]),
			lon = parseFloat(args[2]);

		if (isNaN(zoom) || isNaN(lat) || isNaN(lon)) {
			return false;
		} else {
			return {
				center: new L.LatLng(lat, lon),
				zoom: zoom
			};
		}
	} else {
		return false;
	}
}

function splitHash(hash) {
	hash = hash || location.hash;
	if (hash.indexOf('#') === 0) {
		hash = hash.substr(1);
	}
	return hash.split('/');
}

///////////////////////////////////////
// error marker code
////////////////////////////////////////

function updateErrors() {
	var lonlat = map.getCenter().wrap();

	var loc = "points.php" +
		"?lat=" + lonlat.lat +
		"&lon=" + lonlat.lng +
		"&zoom=" + map.getZoom() +
		"&show_ign=" + (document.myform.show_ign.checked ? 1 : 0) +
		"&show_tmpign=" + (document.myform.show_tmpign.checked ? 1 : 0) +
		"&lang=" + document.myform.lang.value +
		"&user=" + document.myform.userfilter.value +
		"&" + getURL_checkboxes();

	var ajax = new XMLHttpRequest();
	ajax.onload = errorsLoaded;
	ajax.open('GET', loc, true);
	ajax.send(null);
}

function errorsLoaded(e) {
	var response = JSON.parse(this.responseText);
	var errorsToAdd = response.errors;

	map.errorLayer.eachLayer(function(e) {
		if (errorsToAdd[e.error_id]) {
			// no need to add the error again if we already have a marker for it
			delete errorsToAdd[e.error_id];
		} else {
			// old error; remove it
			map.errorLayer.removeLayer(e);
		}
	});

	// create new markers
	for (var e in errorsToAdd) {
		map.errorLayer.addLayer(new ErrorMarker(e, errorsToAdd[e]));
	}

	if (highlight_error) {
		var marker = getMarkerForError(highlight_error);
		if (marker) {
			marker.openPopup();
			marker.focus();
		}
		highlight_error = null;
	}

	document.getElementById('update_date').innerHTML = response.updated;
}

function getMarkerForError(error_id) {
	var errorMarkers = map.errorLayer._layers;
	for (var i in errorMarkers) {
		var e = errorMarkers[i];
		if (e.error_id == error_id) {
			return e;
		}
	}
	return null;
}

function onPopupSubmit(error_id, error_type) {
	var marker = getMarkerForError(error_id);
	if (marker) {
		var form = document['errfrm_' + error_id];
		marker.error_data.state = form.querySelector('input[name=st]:checked').value;
		marker.error_data.comment = form.co.value;
		marker.setErrorData(marker.error_id, marker.error_data);
	}
	map.closePopup();
}

// build the list of error type checkbox states for use in URLs
// echo the error_type number for every active checkbox, separated with ','
// by default the var.name "ch=" is put in front of the string
function getURL_checkboxes() {
	var loc="ch=0";
	// append error types for any checked checkbox that is called "ch..."
	var checkboxes = document.myform.querySelectorAll('input[name^=ch]');
	for (var i = 0; i < checkboxes.length; ++i) {
		var el = checkboxes[i];
		if (el.checked)
			loc+="," + el.name.substr(2);
	}
	return loc;
}

// extension of L.Marker that shows the popup when the marker
// is hovered over. the popup will close when the mouse is moved
// away unless the marker is "focused" by clicking on it
//
// also contains code to dynamically generate popup content from error data
//
// inspired by https://gist.github.com/sowelie/5099663
var ErrorMarker = L.Marker.extend({
	initialize: function(error_id, error_data) {
		L.Marker.prototype.initialize.apply(this, [new L.LatLng(error_data.lat, error_data.lon)]);
		this.setErrorData(error_id, error_data);
		this.bindPopup();
	},

	setErrorData: function(id, data) {
		this.error_id = id;
		this.error_data = data;
		this.updateIcon();
	},

	bindPopup: function() {
		var htmlContent = ""; // created in openPopup()
		var options = {
			autoPan: false // we disable autoPan for hovering and use it only when the marker is clicked
		};
		L.Marker.prototype.bindPopup.apply(this, [htmlContent, options]);

		// override click handler with our own version that sets the
		// focused state
		this.off("click");
		this.on("click", function() {
			if (this._popup._isOpen) {
				if (this.focused) {
					this.closePopup();
				} else {
					this.focus();
				}
			} else {
				this.openPopup();
				this.focus();
			}
		}, this);

		// open popup on mouseover
		this.on("mouseover", this.openPopup, this);

		// close popup on mouseout if not focused
		this.on("mouseout", function() {
			if (!this.focused) {
				this.closePopup();
			}
		}, this);

		// reset focused flag when popup is closed
		this.on("popupclose", function() {
			this.focused = false;
		});
	},

	focus: function() {
		this.focused = true;

		// pan the map so that the popup is in view
		this._popup.options.autoPan = true;
		this._popup._adjustPan();
		this._popup.options.autoPan = false;
	},

	openPopup: function() {
		this._popup.setContent(this.createPopupContent(this.error_id, this.error_data));
		L.Marker.prototype.openPopup.apply(this);
	},

	updateIcon: function() {
		var img = 'img/';
		var state = this.error_data.state;
		if (state == 'ignore_temporarily') {
			img += 'zapangel.png';
		} else if (state == 'ignore') {
			img += 'zapdevil.png';
		} else {
			img += 'zap' + (this.error_data.error_type / 10 >> 0) * 10 + '.png';
		}

		this.setIcon(L.icon({
			iconUrl: img,
			iconSize: [24, 24],
			iconAnchor: [1, 23],
			popupAnchor: [12, -23]
		}));
	},

	createPopupContent: function() {
		var id = this.error_id;
		var e = this.error_data;

		var html = '<h5>'+e.error_name+', '+e.object_type+' <a href="http://www.openstreetmap.org/browse/'+e.object_type_EN+'/'+e.object_id+'" target="_blank">'+e.object_id+'</a></h5>'+
		'<p class="desc">'+e.description+'</p>'+
		'<p class="edit_links">' +
		txt4+' <a href="http://localhost:8111/load_and_zoom?left=' + (e.lon-0.001) + '&right=' + (e.lon-(-0.001)) + '&top=' + (e.lat-(-0.001)) + '&bottom=' + (e.lat-0.001) + '&select=' + e.object_type_EN + e.object_id + e.partner_objects +'&zoom_mode=download" target="hiddenIframe" title="'+txt6+'">'+txt5+'</a> ' +
		'<a href="http://www.openstreetmap.org/edit?lat=' + e.lat + '&lon=' + e.lon + '&zoom=18" target="_blank">'+txt7+'</a> ' +
		'</p>' +

		'<form name="errfrm_'+ id +'" target="hiddenIframe" method="get" action="comment.php" onsubmit="onPopupSubmit(\'' + id +  '\',' + e.error_type + ')">' +
		'<input type="radio" id="st_' + id +'_n" '+(e.state!='ignore_temporarily' && e.state!='ignore' ? 'checked="checked"' :'')+' name="st" value="">'+
		'<label for="st_' + id + '_n">'+txt8+'</label><br>'+
		'<input type="radio" id="st_' + id +'_t" '+(e.state=='ignore_temporarily' ? 'checked="checked"' :'')+' name="st" value="ignore_temporarily">'+
		'<label for="st_' + id +'_t">'+txt9+'</label><br>'+
		'<input type="radio" id="st_' + id +'_i" '+(e.state=='ignore' ? 'checked="checked"' :'')+' name="st" value="ignore">'+
		'<label for="st_' + id +'_i">'+txt10+'</label><br>'+
		'<textarea cols="25" rows="2" name="co">'+(e.comment || '')+'</textarea>'+
		'<input type="hidden" name="schema" value="'+e.schema+'">'+
		'<input type="hidden" name="id" value="'+e.error_id+'">'+
		'<br>'+
		'<input type="submit" value="'+txt11+'">' +
		'<input type="button" value="'+txt12+'" onClick="javascript:map.closePopup()">' +
		'</form>' +

		'<p class="footnote">' +
		txt13 + '<br>' +
		txt14 + '<a href="report_map.php?schema='+e.schema+'&error='+e.error_id+'">'+e.error_id+'</a><br>' +
		txt15 + ' ' + e.object_type + ': <a href="http://www.openstreetmap.org/user/' + e.user_name + '" target="_blank">' + e.user_name + '</a> ' + e.object_timestamp +
		'</p>';

		return html;
	}
});

///////////////////////////////////////////////////////////////////////////////////////////
// sidebar/checkbox functions
///////////////////////////////////////////////////////////////////////////////////////////

// check all the checkboxes saved in the checkbox hash
// will look for saved hash from 3 sources:
// 1. first tries the url hash
// 2. second tries localStorage
// 3. finally falls back to checking all errors
//
// error types passed in forced_checked will always be checked regardless of
// above
function initCheckboxes(force_checked) {
	var checks = null;

	var args = splitHash();
	if (args.length > 4 && args[3]) {
		checks = parseCheckboxesHash(args[3]);
	}

	// if the url hash fails, try the localStorage
	if (!checks) {
		var cookie = loadLocals();
		if (cookie && cookie.checkHash) {
			checks = parseCheckboxesHash(cookie.checkHash);
		}
	}

	if (!checks) {
		// if we still can't load the saved checks, default to all errors
		document.myform.show_ign.checked = true;
		document.myform.show_tmpign.checked = true;

		var errors = document.myform['tristate-1'];
		errors.checked = true;
		tristate_click(errors);
	} else {
		for (var et in checks) {
			var el = document.myform[et];
			if (el) {
				el.checked = true;
			}
		}
	}

	if (force_checked) {
		for (var et in force_checked) {
			var el = document.myform[et];
			if (el) {
				el.checked = true;
			}
		}
	}
}

// update edit-in-potlatch-link and links for rss/gpx export
// call this after a pan and after changing checkboxes
function updateLinks() {
	var lonlat = map.getCenter().wrap();

	// update edit-in-potlatch-link
	var editierlink = document.getElementById('editierlink');
	editierlink.href="http://www.openstreetmap.org/#map=" + L.Hash.formatHash(map).substr(1);

	// update links for rss/gpx export
	var rsslink=document.getElementById('rsslink');
	var gpxlink=document.getElementById('gpxlink');

	var bounds = map.getBounds();
	// no wrap function for LatLngBounds, so we have call it on the points :(
	var nw = bounds.getNorthWest().wrap();
	var se = bounds.getSouthEast().wrap();

	var url = 'export.php?format=';
	var params = getURL_checkboxes() + '&left=' + nw.lng + '&bottom=' + se.lat + '&right=' + se.lng + '&top=' + nw.lat;

	rsslink.href = url + 'rss&' + params;
	gpxlink.href = url + 'gpx&' + params;
}

// update the indeterminate property on all tristate checkboxes
function updateTristates() {
	var tristates = document.myform.querySelectorAll('input[name^=tristate]');
	for (var i = 0; i < tristates.length; ++i) {
		var el = tristates[i];

		// find list of subtypes
		var ul = el.parentNode.getElementsByTagName('ul')[0];

		// loop through all subtypes, determine if all are checked or unchecked
		var checkboxes = ul.querySelectorAll('input[name^=ch]');
		var allChecked = true;
		var allUnchecked = true;
		for (var j = 0; j < checkboxes.length; ++j) {
			if (checkboxes[j].checked) {
				allUnchecked = false;
			} else {
				allChecked = false;
			}
		}

		// update the tristate checkbox
		el.indeterminate = false;
		if (allChecked) {
			el.checked = true;
		} else if (allUnchecked) {
			el.checked = false;
		} else {
			el.indeterminate = true;
		}
	}
}

// perform the state updates required after clicking a checkbox: update tristates,
// update hash, reload error markers, etc.
function checkbox_click() {
	updateTristates();
	checkboxHash = createCheckboxHash();
	map.fire('moveend');
}

// check/uncheck all children of the given tristate checkbox
function tristate_click(el) {
	var newValue = el.checked;

	var ul = el.parentNode.getElementsByTagName('ul')[0];

	var checkboxes = ul.querySelectorAll('input[name^=ch]');
	for (var j = 0; j < checkboxes.length; ++j) {
		checkboxes[j].checked = newValue;
	}

	checkbox_click();
}

////////////////////////////////////////////////
// setup
///////////////////////////////////////////////

var map;
var checkboxHash;
var highlight_error;

function init(highlight) {
	map = L.map('map', { maxZoom: 19 });

	var latlon = default_latlon;
	var zoom = default_zoom;
	var activeLayer;

	var cookie = loadLocals();
	if (cookie) {
		if (cookie.latlon) latlon = cookie.latlon;
		if (cookie.zoom) zoom = cookie.zoom;
		if (cookie.activeLayer) activeLayer = cookie.activeLayer;
	}

	initMapLayers(activeLayer);

	// load userfilter from url hash if present
	var args = splitHash();
	if (args.length == 5 && args[4]) {
		document.myform.userfilter.value = args[4];
	}

	var force_checked = {};
	if (highlight) {
		latlon = highlight.latlon;
		zoom = highlight.zoom;
		highlight_error = highlight.schema + '_' + highlight.error_id;
		force_checked['ch' + highlight.error_type] = true;
	}

	initCheckboxes(force_checked);

	L.hash(map);
	map.setView(latlon, zoom);

	map.on("moveend", function() {
		updateErrors();
		updateLinks();
		saveLocals();
	});

	checkbox_click();
}

var mapLayers = {
	osm: {
		displayName: 'OpenStreetMap.org',
		url: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
		attribution: 'Map data &copy; <a href="http://www.openstreetmap.org/copyright/en">OpenStreetMap</a> contributors',
		maxZoom: 19
	},
	mapquest: {
		displayName: "MapQuest Open",
		url: "http://otile{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png",
		attribution: 'Data &copy; <a href="http://www.openstreetmap.org/copyright/en">OpenStreetMap</a> contributors, Tiles &copy; <a href="http://open.mapquest.com/">MapQuest</a>',
		subdomains: "1234",
		maxZoom: 19,
		maxNativeZoom: 18
	},
	transport: {
		displayName: "Thunderforest Transport",
		url: "http://{s}.tile.thunderforest.com/transport/{z}/{x}/{y}.png",
		attribution: 'Data &copy; <a href="http://www.openstreetmap.org/copyright/en">OpenStreetMap</a> contributors, Tiles &copy; <a href="http://www.thunderforest.com/">Andy Allan</a>',
		maxZoom: 19,
		maxNativeZoom: 18
	}
}

function initMapLayers(activeLayer) {
	var custom = localStorage.getItem("customLayer");
	if (custom) {
		custom = JSON.parse(custom);
		if (!custom.displayName) custom.displayName = "Custom";
		mapLayers.custom = custom;
	}

	var baseLayers = {};
	var active;

	for (var i in mapLayers) {
		var options = mapLayers[i];
		var layer = L.tileLayer(options.url, options);
		layer.id = i;
		baseLayers[options.displayName] = layer;
		if (!active || activeLayer == i) active = layer;
	}

	L.control.layers(baseLayers).addTo(map);
	map.addLayer(active);
	map.on('baselayerchange', saveLocals);

	var errorLayer = L.layerGroup();
	map.addLayer(errorLayer);
	map.errorLayer = errorLayer;
}

// variables only used in the browser are saved to localStorage here
function saveLocals() {
	var vars = {};
	vars.latlon = map.getCenter().wrap();
	vars.zoom = map.getZoom();
	vars.checkHash = createCheckboxHash();

	for (var e in map._layers) {
		var layer = map._layers[e];
		if (layer.id) {
			vars.activeLayer = layer.id;
		}
	}

	localStorage.setItem("cookie", JSON.stringify(vars));
}

// load variables from localStorage
function loadLocals() {
	var cookie = localStorage.getItem("cookie");
	return cookie && JSON.parse(cookie);
}

// save the lang parameter to the cookie (lang is used server-side; can't save it to localStorage)
function setLang(lang) {
	var expiry = new Date();
	expiry.setYear(expiry.getFullYear() + 10);

	document.cookie = 'keepright_locale=' + lang + '; expires=' + expiry.toGMTString();
}
