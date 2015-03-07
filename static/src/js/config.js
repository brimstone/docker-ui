app.config(['$routeProvider', function($routeProvider){
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
}]);
