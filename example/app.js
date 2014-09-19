angular.module('testApp', ['iOffice.pickadate'])
  .controller('TestController', function($scope) {
  	 // moment().add(1, 'd').toDate()
    $scope.selectedDates = {start: '2014-09-22'};
    // $scope.minDate = moment().subtract(1, 'd').format('YYYY-MM-DD');
    // $scope.maxDate = moment().add(20, 'd').format('YYYY-MM-DD');

    $scope.disabledDates = [
      moment('2014-09-27', 'YYYY-MM-DD').format('YYYY-MM-DD')
    ];

    // console.table([{
    //   minDate: $scope.minDate,
    //   maxDate: $scope.maxDate,
    //   disabledDates: $scope.disabledDates
    // }]);

    $scope.$watch('selectedDates', function(newVal, oldVal) {
    	console.log(newVal.start, newVal.end);
    })
  });