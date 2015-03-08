var Docker = (function(){
	// stolen from https://github.com/toddmotto/atomic	
	!function(a,b){"function"==typeof define&&define.amd?define(b):"object"==typeof exports?module.exports=b:a.atomic=b(a)}(this,function(a){"use strict";var b={},c=function(a){var b;try{b=JSON.parse(a.responseText)}catch(c){b=a.responseText}return[b,a]},d=function(b,d,e){var f={success:function(){},error:function(){}},g=a.XMLHttpRequest||ActiveXObject,h=new g("MSXML2.XMLHTTP.3.0");h.open(b,d,!0),h.setRequestHeader("Content-type","application/x-www-form-urlencoded"),h.onreadystatechange=function(){4===h.readyState&&(h.status>=200&&h.status<300?f.success.apply(f,c(h)):f.error.apply(f,c(h)))},h.send(e);var i={success:function(a){return f.success=a,i},error:function(a){return f.error=a,i}};return i};return b.get=function(a){return d("GET",a)},b.put=function(a,b){return d("PUT",a,b)},b.post=function(a,b){return d("POST",a,b)},b["delete"]=function(a){return d("DELETE",a)},b});

	var apiversion = "v1.17"

	var me = {
		servers: []
	}

	var callbacks = []

	var callbackTimer;

	me.subscribe = function(callback) {
		callbacks.push(callback)
	}

	me.unsubscribe = function(callback) {
		// find the callback and remove it
		var index = callbacks.indexOf(callback)
		if (index > -1) {
			callbacks.splice(index, 1)
		}
	}

	function fireCallbacks() {
		for(c = 0; c < callbacks.length; c++) {
			callbacks[c]()
		}
	}

	function updateContainer(server, containerId) {
		atomic.get("/" + apiversion + "/containers/" + containerId + "/json?server=" + server)
		.success(function(data, xhr){
			var s = findElementByAttribute(me.servers, "Id", server)
			var c = findElementByAttribute(me.servers[s].containers, "Id", containerId)
			if ( c == -1 ) {
				me.servers[s].containers.push(data)
				me.servers[s].containers.sort(function(a, b){
					if (a.Id > b.Id)
						return 1
					if (a.Id < b.Id)
						return -1
					return 0
				})
				c = me.servers[s].containers.length - 1
			}
			else {
				me.servers[s].containers[c] = data
			}
			setInterval((function(s, c){
				atomic.get("/v1.17/containers/" + me.servers[s].containers[c].Id + "/logs?stderr=1&stdout=1&tail=1000")
				.success(function(data, xhr){
					me.servers[s].containers[c].logs = data
					clearTimeout(callbackTimer)
					callbackTimer = setTimeout(fireCallbacks, 100)
				})
			})(s, c), 1000)
			clearTimeout(callbackTimer)
			callbackTimer = setTimeout(fireCallbacks, 100)
		})
	}

	function updateServer(server) {
		atomic.get("/" + apiversion + "/containers/json?all=1&server=" + server)
		.success(function(containers, xhr){
			var i = findElementByAttribute(me.servers, "Id", server)
			me.servers[i].containers = []

			for(c = 0; c < containers.length; c++) {
				updateContainer(server, containers[c].Id)
			}

		})

		atomic.get("/" + apiversion + "/images/json?all=1&server=" + server)
		.success(function(images, xhr){
			i = findElementByAttribute(me.servers, "Id", server)
			me.servers[i].images = images
			clearTimeout(callbackTimer)
			callbackTimer = setTimeout(fireCallbacks, 100)
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

	me.StopContainer = function(serverId, containerId){
		atomic.post("/" + apiversion + "/containers/" + containerId + "/stop?t=5&server=" + serverId)
	}
	me.StartContainer = function(serverId, containerId){
		atomic.post("/" + apiversion + "/containers/" + containerId + "/start?server=" + serverId)
	}
	me.DeleteContainer = function(serverId, containerId){
		atomic.post("/" + apiversion + "/containers/" + containerId + "/stop?t=5&server=" + serverId)
		.success(function(){
			console.log("Delete Container success")
			atomic.delete("/" + apiversion + "/containers/" + containerId + "?v=1&server=" + serverId)
		})
		.error(function(){
			console.log("Delete Container error")
			atomic.delete("/" + apiversion + "/containers/" + containerId + "?v=1&server=" + serverId)
		})
	}

	handleWebsocket = function(ext) {
		e = JSON.parse(ext.data)
		// container related
		s = findElementByAttribute(me.servers, "Id", e.Server)
		if (e.Status == "create") {
			updateContainer(e.Server, e.Id)
		}
		else if (e.Status == "destroy") {
			c = findElementByAttribute(me.servers[s].containers, "Id", e.Id)
			me.servers[s].containers.splice(c,1)
			clearTimeout(callbackTimer)
			callbackTimer = setTimeout(fireCallbacks, 100)
		}
		else if (e.Status == "start") {
			c = findElementByAttribute(me.servers[s].containers, "Id", e.Id)
			updateContainer(e.Server,e.Id)
		}
		else if (e.Status == "die") {
			c = findElementByAttribute(me.servers[s].containers, "Id", e.Id)
			updateContainer(e.Server,e.Id)
		}

		// image related
		else if (e.Status == "untag") {
		}
		// other?
		else {
			console.log(e.Server, "Event status", e.Status)
		}
	}

	newwebsocket = function(){
		websocket = new WebSocket((location.protocol == "http:" ? "ws:" : "wss:") + "//" + location.host + "/proxyevents");
		websocket.onmessage = handleWebsocket
		websocket.onclose = function() {
			console.log("Websocket connection closed")
			newwebsocket()
		}
		websocket.onopen = function() {
			console.log("Websocket connection open")
		}
		websocket.onerror = function() {
			console.log("Websocket got an error")
		}
		return websocket
	}

	newwebsocket()

	return me;
}());
