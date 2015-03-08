app.controller('Container', function ($scope, $routeParams, docker, $location, $rootScope) {

	$scope.consoleAvailable = false;
	$scope.container = {}

	function findContainer() {
		s = findElementByAttribute($scope.servers, "Id", $routeParams.serverId)
		if (s == -1) {
			return;
		}
		$scope.server = $scope.servers[s]

		if (!$routeParams.containerId) {
			return;
		}

		c = findElementByAttribute($scope.servers[s].containers, "Id", $routeParams.containerId)
		if (c == -1) {
			return;
		}
		$scope.container = $scope.servers[s].containers[c]
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
		updateScope()
		$scope.$apply()
	});
	$scope.$on('$destroy', handleContainerUpdate);

	updateScope();

});
