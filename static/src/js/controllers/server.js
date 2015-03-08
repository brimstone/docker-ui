app.controller('Server', function ($scope, $routeParams, docker, $location, $rootScope) {

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

	var myListener = $rootScope.$on('containerUpdate', function (event, data) {
		$scope.servers = docker.servers
		findContainer()
		$scope.$apply()
	});

	$scope.$on('$destroy', myListener);

});
