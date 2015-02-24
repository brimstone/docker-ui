var Docker = (function(){
	// stolen from https://github.com/toddmotto/atomic	
	!function(a,b){"function"==typeof define&&define.amd?define(b):"object"==typeof exports?module.exports=b:a.atomic=b(a)}(this,function(a){"use strict";var b={},c=function(a){var b;try{b=JSON.parse(a.responseText)}catch(c){b=a.responseText}return[b,a]},d=function(b,d,e){var f={success:function(){},error:function(){}},g=a.XMLHttpRequest||ActiveXObject,h=new g("MSXML2.XMLHTTP.3.0");return h.open(b,d,!0),h.setRequestHeader("Content-type","application/x-www-form-urlencoded"),h.onreadystatechange=function(){4===h.readyState&&(200===h.status?f.success.apply(f,c(h)):f.error.apply(f,c(h)))},h.send(e),{success:function(a){return f.success=a,f},error:function(a){return f.error=a,f}}};return b.get=function(a){return d("GET",a)},b.put=function(a,b){return d("PUT",a,b)},b.post=function(a,b){return d("POST",a,b)},b["delete"]=function(a){return d("DELETE",a)},b});

	var me = {
		servers: [],
		callback: null
	}

	var callbackTimer;

	function updateServer(server) {
		atomic.get("/containers/json?all=1&server=" + server)
		.success(function(containers, xhr){
			i = findElementByAttribute(me.servers, "Id", server)
			me.servers[i].containers = []

			for(c = 0; c < containers.length; c++) {
				atomic.get("/containers/" + containers[c].Id + "/json")
				.success(function(data, xhr){
					me.servers[i].containers.push(data)
					me.servers[i].containers.sort(function(a, b){
						if (a.Id > b.Id)
							return 1
						if (a.Id < b.Id)
							return -1
						return 0
					})
					if (me.callback != null) {
						clearTimeout(callbackTimer)
						callbackTimer = setTimeout(me.callback, 100)
					}
				})
			}

		})

		atomic.get("/images/json?all=1&server=" + server)
		.success(function(images, xhr){
			i = findElementByAttribute(me.servers, "Id", server)
			me.servers[i].images = images
			if (me.callback != null) {
				clearTimeout(callbackTimer)
				callbackTimer = setTimeout(me.callback, 100)
			}
		})

	}

	function findElementByAttribute(array, attribute, value) {
		for(i = 0; i < array.length; i++) {
			if(array[i][attribute] == value) {
				return i
			}
		}
		return -1
	}

	me.UpdateServerList = function() {
		// First, try to get our list of server
		atomic.get("/servers/json")
		.success(function(data, xhr){
			// Loop through each of our servers returned
			for(s = 0; s < data.length; s++) {
				// if we don't have a server by this name, add it
				if(findElementByAttribute(me.servers, "Id", data[s].Id) == -1) {
					me.servers[s] = data[s]
				}
			}
			// Loop through each of our known servers
			for(s = 0; s < me.servers.length; s++) {
				// if we don't have this in our xhr data, remove it
				if(findElementByAttribute(data, "Id", me.servers[s].Id) == -1) {
					me.servers.splice(s,1)
				}
			}
			// update all of our servers now
			for(s = 0; s < me.servers.length; s++) {
				updateServer(me.servers[s].Id)
			}
		})
		// If we can't, assume we only have one
		// This usually means we're really talking to a stock docker server
		.error(function(data, xhr){
			me.servers = [{"Id": "docker"}]
		})
	}

	//me.UpdateServerList()
	setInterval(me.UpdateServerList, 2000)

	return me;
}());
