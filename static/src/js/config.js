app.config(['$routeProvider', function($routeProvider){
	$routeProvider.when('/', {
		templateUrl: 'js/views/main.html',
		controller: 'Main'
	}).when('/:serverId', {
		templateUrl: 'js/views/server.html',
		controller: 'Server'
	}).when('/:serverId/:containerId', {
		templateUrl: 'js/views/container.html',
		controller: 'Container'
	}).otherwise({
		redirectTo: '/'
	})
}]);
