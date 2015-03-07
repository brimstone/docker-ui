app.controller('Nav', function ($scope, $routeParams, docker, $location, $rootScope) {

	$scope.server = null
	$scope.container = null
    $scope.menuCollapsed = true;

	function findContainer() {
		s = findElementByAttribute($scope.servers, "Id", $routeParams.serverId)
		if (s == -1) {
			$location.url("/")
			return;
		}
		$scope.server = $scope.servers[s]

		if (!$routeParams.containerId) {
			return;
		}

		c = findElementByAttribute($scope.servers[s].containers, "Id", $routeParams.containerId)
		if (c == -1) {
			$location.url("/" + $routeParams.serverId)
			return;
		}
		$scope.container = $scope.servers[s].containers[c]
	}

	$scope.selectContainer = function(server, container){
		$scope.server = server
		$scope.container = container
		$scope.menuCollapsed = true;
	}

	$scope.selectServer = function(server) {
		$scope.server = server
		$scope.container = null
		$scope.menuCollapsed = true;
	}

	$scope.selectHome = function(server) {
		$scope.server = null
		$scope.container = null
		$scope.menuCollapsed = true;
	}
	// http://toddmotto.com/all-about-angulars-emit-broadcast-on-publish-subscribing/
	var myListener = $rootScope.$on('containerUpdate', function (event, data) {
		$scope.servers = docker.servers
		findContainer()
		$scope.$apply()
	});

	$scope.$on('$destroy', myListener);

});
