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

	this.status = function() {
		return "Status!"
	}
})
.controller('Main', function ($scope, $routeParams, docker) {

	
    $scope.menuCollapsed = true;
	$scope.consoleAvailable = false;

	docker.callback = function(){
		$scope.servers = docker.servers
		console.log($scope.servers)
		$scope.$apply()
	}

	$scope.server = docker.servers[0]

	$scope.findme = $routeParams.serverId
	$scope.docker = docker.status()
})

