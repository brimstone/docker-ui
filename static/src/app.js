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
.controller('Main', function ($scope, $routeParams, docker, $location) {

	
    $scope.menuCollapsed = true;
	$scope.consoleAvailable = false;
	$scope.container = {}

	function findContainer() {
		var found = false
		// find our container object, if we have it
		if ($routeParams.containerId) {
			if ($routeParams.containerId == "new") {
				console.log("Setting new container bits.")
				found = true
				$location.url("/")
			}
			else {
				for(s = 0; s < $scope.servers.length; s++) {
					if ($scope.servers[s].Id != $routeParams.serverId) {
						continue;
					}
					$scope.server = $scope.servers[s]
					for(c = 0; c < $scope.servers[s].containers.length; c++) {
						if ($scope.servers[s].containers[c].Id != $routeParams.containerId) {
							continue;
						}
						$scope.container = $scope.servers[s].containers[c]
						$scope.containerImage = findImageById($scope.servers[s].images, $scope.container.Image).RepoTags[0]
						found = true
					}
				}
			}
			if (!found) {
				$location.url("/")
			}
		}
		else if ($routeParams.serverId) {
			for(s = 0; s < $scope.servers.length; s++) {
				if ($scope.servers[s].Id != $routeParams.serverId) {
					continue;
				}
				$scope.server = $scope.servers[s]
			}
		}
	}

	function findImageById(images, image){
		for(i = 0; i < images.length; i++){
			if (images[i].Id == image) {
				return images[i]
			}
		}
		return "NOT FOUND"
	}

	$scope.stopContainer = function (){
		Docker.StopContainer($scope.server.Id, $scope.container.Id)
	}

	$scope.deleteContainer = function (){
		Docker.DeleteContainer($scope.server.Id, $scope.container.Id)
	}

	$scope.startContainer = function (){
		Docker.StartContainer($scope.server.Id, $scope.container.Id)
	}

	docker.callback = function(){
		findContainer()
		$scope.servers = docker.servers
		$scope.$apply()
	}

	$scope.servers = docker.servers
	findContainer()
})


// angular.element($('#containerName')).scope().servers[1].containers
