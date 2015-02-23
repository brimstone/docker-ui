angular.module('docker-ui', ['ui.bootstrap', 'ngRoute'], function($httpProvider){
	delete $httpProvider.defaults.headers.common['X-Requested-With'];
})
.config(['$routeProvider', function($routeProvider){
	$routeProvider.when('/', {
		templateUrl: 'main',
		controller: 'Main'
	}).when('/:serverId', {
		templateUrl: 'main',
		controller: 'Main'
	}).when('/:serverId/:containerId', {
		templateUrl: 'main',
		controller: 'Main'
	}).otherwise({
		redirectTo: '/'
	})
}])
.service('docker', function(){
	// http://clintberry.com/2013/angular-js-websocket-service/

	me = this
	Docker.callback = function(){
		me.servers = Docker.servers
		me.callback()
	}

	Docker.UpdateServerList()
	this.servers = []
})
.controller('Main', function ($scope, $routeParams, docker) {

	
    $scope.menuCollapsed = true;
	$scope.consoleAvailable = false;
	$scope.container = {"Name": [], "Image": "Test"}

	function findContainer() {
		console.log($routeParams)
		// find our container object, if we have it
		if ($routeParams.containerId) {
			console.log("Hunting for", $routeParams.serverId, $routeParams.containerId)
			if ($routeParams.containerId == "new") {
				console.log("Setting new container bits.")
			}
			else {
				for(s = 0; s < $scope.servers.length; s++) {
					if ($scope.servers[s].Id != $routeParams.serverId) {
						continue;
					}
					for(c = 0; c < $scope.servers[s].containers.length; c++) {
						if ($scope.servers[s].containers[c].Id != $routeParams.containerId) {
							console.log($scope.servers[s].containers[c].Id, "is not", $routeParams.containerId)
							continue;
						}
						$scope.container = $scope.servers[s].containers[c]
						console.log("Found container", $scope.container)
					}
				}
			}
		}
	}

	docker.callback = function(){
		findContainer()
		$scope.servers = docker.servers
		$scope.$apply()
	}

	$scope.servers = docker.servers
})


// angular.element($('#containerName')).scope().servers[1].containers
