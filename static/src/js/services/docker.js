app.service('docker', function($rootScope){
	// http://clintberry.com/2013/angular-js-websocket-service/

	var callbacks = []

	me = this


	var callback = function(){
		me.servers = Docker.servers
		console.log("signalling rootscope")
		$rootScope.$emit("containerUpdate", "emitted data")
	}


	Docker.subscribe(callback)

	Docker.UpdateServerList()

	this.servers = []
});
