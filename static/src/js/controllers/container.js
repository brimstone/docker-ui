app.controller('Container', function ($scope, $routeParams, docker, $location, $rootScope) {

	$scope.consoleAvailable = false;
	$scope.container = {}

	function findContainer() {
		s = findElementByAttribute($scope.servers, "Id", $routeParams.serverId)
		if (s == -1) {
			// [todo] - Actually, if our server doesn't exist, what are we doing here?
			return;
		}
		$scope.server = $scope.servers[s]

		if (!$routeParams.containerId) {
			// [todo] - Actually, if our containerId doesn't exist, what are we doing here?
			return;
		}

		c = findElementByAttribute($scope.servers[s].containers, "Id", $routeParams.containerId)
		if (c == -1) {
			return;
		}
		$scope.container = $scope.servers[s].containers[c]
		if ($scope.container.logs) {
			$scope.consoleAvailable = true;
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

	$scope.reloadContainer = function (){
		container = $scope.container.Config
		container.HostConfig = $scope.container.HostConfig
		Docker.DeleteContainer($scope.server.Id, $scope.container.Id)
		.success(function(){
			Docker.CreateContainer($scope.server.Id, $scope.container.Name, container, function(data){
				$location.url("/" + $routeParams.serverId + "/" + data.Id)
			})
		})
	}

	$scope.addEnv = function(){
		$scope.container.Config.Env.push('')
	}

	$scope.removeEnv = function(i) {
		$scope.container.Config.Env.splice(i, 1)
	}

	updateScope = function() {
		if (docker.servers.length == 0) {
			return;
		}
		$scope.servers = docker.servers
		findContainer()
		console.log($scope)
	}
	// http://toddmotto.com/all-about-angulars-emit-broadcast-on-publish-subscribing/
	var handleContainerUpdate = $rootScope.$on('containerUpdate', function (event, data) {
		event.preventDefault();
		console.log("containerUpdate", event, data)
		updateScope()
		$scope.$apply()
	});
	$scope.$on('$destroy', handleContainerUpdate);

	updateScope();

});
