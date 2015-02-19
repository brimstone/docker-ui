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
	this.servers = [
		{
			"name": "ServerA",
			"containers": [
				{"Config": {"Id": "000", "Names": ["/container 1"]}},
				{"Config": {"Id": "000", "Names": ["/container 2"]}}
			],
			"images": [
				{"Config": {"Id": "010", "RepoTags": ["brimstone/ubuntu:14.04"]}}
			]
		},
		{
			"name": "ServerB",
			"containers": [
				{"Config": {"Id": "100", "Names": ["/container 3"]}}
			],
			"images": [
				{"Config": {"Id": "110", "RepoTags": ["brimstone/ubuntu:14.04"]}}
			]
		}
	]
	console.log("Creating service")
	this.status = function() {
		console.log("Returning status")
		return "Status!"
	}
})
.controller('Main', function ($scope, $routeParams, docker) {

	
    $scope.menuCollapsed = true;
	$scope.consoleAvailable = false;

	$scope.servers = docker.servers

	$scope.server = docker.servers[0]

	$scope.findme = $routeParams.serverId
	$scope.docker = docker.status()
})

