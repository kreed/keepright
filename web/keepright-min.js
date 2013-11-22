// this file includes derived classes from various libraries
// find the readable version of this file in the keepright svn repository
// JS code compressed by UglifyJS http://lisperator.net/uglifyjs/

/*
leaflet-hash
https://github.com/mlevans/leaflet-hash

Copyright (c) 2013 Michael Lawrence Evans

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
(function(e){var t=function(){var t=e.documentMode;return"onhashchange"in e&&(t===undefined||t>7)}();L.Hash=function(e){this.onHashChange=L.Util.bind(this.onHashChange,this);if(e){this.init(e)}};L.Hash.parseHash=function(e){if(e.indexOf("#")===0){e=e.substr(1)}var t=e.split("/");if(t.length==3){var r=parseInt(t[0],10),a=parseFloat(t[1]),o=parseFloat(t[2]);if(isNaN(r)||isNaN(a)||isNaN(o)){return false}else{return{center:new L.LatLng(a,o),zoom:r}}}else{return false}};L.Hash.formatHash=function(e){var t=e.getCenter(),r=e.getZoom(),a=Math.max(0,Math.ceil(Math.log(r)/Math.LN2));return"#"+[r,t.lat.toFixed(a),t.lng.toFixed(a)].join("/")},L.Hash.prototype={map:null,lastHash:null,parseHash:L.Hash.parseHash,formatHash:L.Hash.formatHash,init:function(e){this.map=e;this.lastHash=null;this.onHashChange();if(!this.isListening){this.startListening()}},removeFrom:function(e){if(this.changeTimeout){clearTimeout(this.changeTimeout)}if(this.isListening){this.stopListening()}this.map=null},onMapMove:function(){if(this.movingMap||!this.map._loaded){return false}var e=this.formatHash(this.map);if(this.lastHash!=e){location.replace(e);this.lastHash=e}},movingMap:false,update:function(){var e=location.hash;if(e===this.lastHash){return}var t=this.parseHash(e);if(t){this.movingMap=true;this.map.setView(t.center,t.zoom);this.movingMap=false}else{this.onMapMove(this.map)}},changeDefer:100,changeTimeout:null,onHashChange:function(){if(!this.changeTimeout){var e=this;this.changeTimeout=setTimeout(function(){e.update();e.changeTimeout=null},this.changeDefer)}},isListening:false,hashChangeInterval:null,startListening:function(){this.map.on("moveend",this.onMapMove,this);if(t){L.DomEvent.addListener(e,"hashchange",this.onHashChange)}else{clearInterval(this.hashChangeInterval);this.hashChangeInterval=setInterval(this.onHashChange,50)}this.isListening=true},stopListening:function(){this.map.off("moveend",this.onMapMove,this);if(t){L.DomEvent.removeListener(e,"hashchange",this.onHashChange)}else{clearInterval(this.hashChangeInterval)}this.isListening=false}};L.hash=function(e){return new L.Hash(e)};L.Map.prototype.addHash=function(){this._hash=L.hash(this)};L.Map.prototype.removeHash=function(){this._hash.removeFrom()}})(window);function createCheckboxHash(){var e=document.myform.querySelectorAll("input[name^=ch]");var t=[];var r=[];for(var a=0;a<e.length;++a){var o=e[a];if(o.checked){var n=parseInt(o.name.substr(2));var i=n/10>>0;var s=n%10;if(s==0){t[i+1]=true}else{u(r,i,s-1)}}}if(document.myform.show_ign.checked)t[0]=true;if(document.myform.show_tmpign.checked)t[1]=true;var h=[0];for(var a=0;a<t.length;++a){if(t[a]){u(h,1+(a/8>>0),a%8)}}var c=h.length;h[0]=c;for(var a=0;a<r.length;++a){if(r[a]){var l=a<<1;var p=r[a];if(p>>8){l=l|1;p=p&255}h[c++]=l;h[c++]=p}}function u(e,t,r){e[t]=(1<<r)+(e[t]||0)}return window.btoa(String.fromCharCode.apply(String,h)).replace(/\//g,"-")}function parseCheckboxesHash(e){var t=window.atob(e.replace(/-/g,"/"));if(!t)return null;var r={};var a=t.charCodeAt(0);for(var o=1;o<a;++o){var n=t.charCodeAt(o);var i=10*(8*(o-1)-1);while(n){if(n&1){if(i==-10){r["show_ign"]=true}else if(i==0){r["show_tmpign"]=true}else{r["ch"+i]=true}}n>>=1;i+=10}}for(var o=a;o<t.length;o=o+2){var i=t.charCodeAt(o);var n=t.charCodeAt(o+1);n+=(i&1)<<8;i=(i>>1)*10+1;while(n){if(n&1)r["ch"+i]=true;n>>=1;i+=1}}return r}L.Hash.prototype.formatHash=function(e){var t=e.getCenter().wrap();var r=e.getZoom();var a=Math.max(0,Math.ceil(Math.log(r)/Math.LN2));var o=[r,t.lat.toFixed(a),t.lng.toFixed(a),checkboxHash];if(document.myform.userfilter.value)o.push(document.myform.userfilter.value);return"#"+o.join("/")};L.Hash.prototype.parseHash=function(e){var t=splitHash(e);if(t.length>=3&&t.length<=5){var r=parseInt(t[0],10),a=parseFloat(t[1]),o=parseFloat(t[2]);if(isNaN(r)||isNaN(a)||isNaN(o)){return false}else{return{center:new L.LatLng(a,o),zoom:r}}}else{return false}};function splitHash(e){e=e||location.hash;if(e.indexOf("#")===0){e=e.substr(1)}return e.split("/")}function updateErrors(){var e=map.getCenter().wrap();var t="points.php"+"?lat="+e.lat+"&lon="+e.lng+"&zoom="+map.getZoom()+"&show_ign="+(document.myform.show_ign.checked?1:0)+"&show_tmpign="+(document.myform.show_tmpign.checked?1:0)+"&lang="+document.myform.lang.value+"&user="+document.myform.userfilter.value+"&"+getURL_checkboxes();var r=new XMLHttpRequest;r.onload=errorsLoaded;r.open("GET",t,true);r.send(null)}function errorsLoaded(e){var t=JSON.parse(this.responseText);var r=t.errors;map.errorLayer.eachLayer(function(e){if(r[e.error_id]){delete r[e.error_id]}else{map.errorLayer.removeLayer(e)}});for(var e in r){map.errorLayer.addLayer(new ErrorMarker(e,r[e]))}if(highlight_error){var a=getMarkerForError(highlight_error);if(a){a.openPopup();a.focus()}highlight_error=null}document.getElementById("update_date").innerHTML=t.updated}function getMarkerForError(e){var t=map.errorLayer._layers;for(var r in t){var a=t[r];if(a.error_id==e){return a}}return null}function onPopupSubmit(e,t){var r=getMarkerForError(e);if(r){var a=document["errfrm_"+e];r.error_data.state=a.querySelector("input[name=st]:checked").value;r.error_data.comment=a.co.value;r.setErrorData(r.error_id,r.error_data)}map.closePopup()}function getURL_checkboxes(){var e="ch=0";var t=document.myform.querySelectorAll("input[name^=ch]");for(var r=0;r<t.length;++r){var a=t[r];if(a.checked)e+=","+a.name.substr(2)}return e}var ErrorMarker=L.Marker.extend({initialize:function(e,t){L.Marker.prototype.initialize.apply(this,[new L.LatLng(t.lat,t.lon)]);this.setErrorData(e,t);this.bindPopup()},setErrorData:function(e,t){this.error_id=e;this.error_data=t;this.updateIcon()},bindPopup:function(){var e="";var t={autoPan:false};L.Marker.prototype.bindPopup.apply(this,[e,t]);this.off("click");this.on("click",function(){if(this._popup._isOpen){if(this.focused){this.closePopup()}else{this.focus()}}else{this.openPopup();this.focus()}},this);this.on("mouseover",this.openPopup,this);this.on("mouseout",function(){if(!this.focused){this.closePopup()}},this);this.on("popupclose",function(){this.focused=false})},focus:function(){this.focused=true;this._popup.options.autoPan=true;this._popup._adjustPan();this._popup.options.autoPan=false},openPopup:function(){this._popup.setContent(this.createPopupContent(this.error_id,this.error_data));L.Marker.prototype.openPopup.apply(this)},updateIcon:function(){var e="img/";var t=this.error_data.state;if(t=="ignore_temporarily"){e+="zapangel.png"}else if(t=="ignore"){e+="zapdevil.png"}else{e+="zap"+(this.error_data.error_type/10>>0)*10+".png"}this.setIcon(L.icon({iconUrl:e,iconSize:[24,24],iconAnchor:[1,23],popupAnchor:[12,-23]}))},createPopupContent:function(){var e=this.error_id;var t=this.error_data;var r="<h5>"+t.error_name+", "+t.object_type+' <a href="http://www.openstreetmap.org/browse/'+t.object_type_EN+"/"+t.object_id+'" target="_blank">'+t.object_id+"</a></h5>"+'<p class="desc">'+t.description+"</p>"+'<p class="edit_links">'+txt4+' <a href="http://localhost:8111/load_and_zoom?left='+(t.lon-.001)+"&right="+(t.lon- -.001)+"&top="+(t.lat- -.001)+"&bottom="+(t.lat-.001)+"&select="+t.object_type_EN+t.object_id+t.partner_objects+'&zoom_mode=download" target="hiddenIframe" title="'+txt6+'">'+txt5+"</a> "+'<a href="http://www.openstreetmap.org/edit?lat='+t.lat+"&lon="+t.lon+'&zoom=18" target="_blank">'+txt7+"</a> "+"</p>"+'<form name="errfrm_'+e+'" target="hiddenIframe" method="get" action="comment.php" onsubmit="onPopupSubmit(\''+e+"',"+t.error_type+')">'+'<input type="radio" id="st_'+e+'_n" '+(t.state!="ignore_temporarily"&&t.state!="ignore"?'checked="checked"':"")+' name="st" value="">'+'<label for="st_'+e+'_n">'+txt8+"</label><br>"+'<input type="radio" id="st_'+e+'_t" '+(t.state=="ignore_temporarily"?'checked="checked"':"")+' name="st" value="ignore_temporarily">'+'<label for="st_'+e+'_t">'+txt9+"</label><br>"+'<input type="radio" id="st_'+e+'_i" '+(t.state=="ignore"?'checked="checked"':"")+' name="st" value="ignore">'+'<label for="st_'+e+'_i">'+txt10+"</label><br>"+'<textarea cols="25" rows="2" name="co">'+(t.comment||"")+"</textarea>"+'<input type="hidden" name="schema" value="'+t.schema+'">'+'<input type="hidden" name="id" value="'+t.error_id+'">'+"<br>"+'<input type="submit" value="'+txt11+'">'+'<input type="button" value="'+txt12+'" onClick="javascript:map.closePopup()">'+"</form>"+'<p class="footnote">'+txt13+"<br>"+txt14+'<a href="report_map.php?schema='+t.schema+"&error="+t.error_id+'">'+t.error_id+"</a><br>"+txt15+" "+t.object_type+': <a href="http://www.openstreetmap.org/user/'+t.user_name+'" target="_blank">'+t.user_name+"</a> "+t.object_timestamp+"</p>";return r}});function initCheckboxes(e){var t=null;var r=splitHash();if(r.length>4&&r[3]){t=parseCheckboxesHash(r[3])}if(!t){var a=loadLocals();if(a&&a.checkHash){t=parseCheckboxesHash(a.checkHash)}}if(!t){document.myform.show_ign.checked=true;document.myform.show_tmpign.checked=true;var o=document.myform["tristate-1"];o.checked=true;tristate_click(o)}else{for(var n in t){var i=document.myform[n];if(i){i.checked=true}}}if(e){for(var n in e){var i=document.myform[n];if(i){i.checked=true}}}}function updateLinks(){var e=map.getCenter().wrap();var t=document.getElementById("editierlink");t.href="http://www.openstreetmap.org/#map="+L.Hash.formatHash(map).substr(1);var r=document.getElementById("rsslink");var a=document.getElementById("gpxlink");var o=map.getBounds();var n=o.getNorthWest().wrap();var i=o.getSouthEast().wrap();var s="export.php?format=";var h=getURL_checkboxes()+"&left="+n.lng+"&bottom="+i.lat+"&right="+i.lng+"&top="+n.lat;r.href=s+"rss&"+h;a.href=s+"gpx&"+h}function updateTristates(){var e=document.myform.querySelectorAll("input[name^=tristate]");for(var t=0;t<e.length;++t){var r=e[t];var a=r.parentNode.getElementsByTagName("ul")[0];var o=a.querySelectorAll("input[name^=ch]");var n=true;var i=true;for(var s=0;s<o.length;++s){if(o[s].checked){i=false}else{n=false}}r.indeterminate=false;if(n){r.checked=true}else if(i){r.checked=false}else{r.indeterminate=true}}}function checkbox_click(){updateTristates();checkboxHash=createCheckboxHash();map.fire("moveend")}function tristate_click(e){var t=e.checked;var r=e.parentNode.getElementsByTagName("ul")[0];var a=r.querySelectorAll("input[name^=ch]");for(var o=0;o<a.length;++o){a[o].checked=t}checkbox_click()}var map;var checkboxHash;var highlight_error;function init(e){map=L.map("map",{maxZoom:19});map.addLayer(L.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"Map data &copy; OpenStreetMap contributors",maxZoom:19}));var t=L.layerGroup();map.addLayer(t);map.errorLayer=t;var r=default_latlon;var a=default_zoom;var o=loadLocals();if(o){if(o.latlon)r=o.latlon;if(o.zoom)a=o.zoom}var n=splitHash();if(n.length==5&&n[4]){document.myform.userfilter.value=n[4]}var i={};if(e){r=e.latlon;a=e.zoom;highlight_error=e.schema+"_"+e.error_id;i["ch"+e.error_type]=true}map.setView(r,a);L.hash(map);initCheckboxes(i);map.on("moveend",function(){updateErrors();updateLinks();saveLocals()});checkbox_click()}function saveLocals(){var e={};e.latlon=map.getCenter().wrap();e.zoom=map.getZoom();e.checkHash=createCheckboxHash();localStorage.setItem("cookie",JSON.stringify(e))}function loadLocals(){var e=localStorage.getItem("cookie");return e&&JSON.parse(e)}function setLang(e){var t=new Date;t.setYear(t.getFullYear()+10);document.cookie="keepright_locale="+e+"; expires="+t.toGMTString()}