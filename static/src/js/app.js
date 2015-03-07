app = angular.module('docker-ui', ['ui.bootstrap', 'ngRoute'], function($httpProvider){
	delete $httpProvider.defaults.headers.common['X-Requested-With'];
});

function findElementByAttribute(array, attribute, value) {
	for(i = 0; i < array.length; i++) {
		if(array[i][attribute] == value) {
			return i
		}
	}
	return -1
}
