;(function(angular){
  'use strict';
  var indexOf = [].indexOf;
  angular.module('iOffice.pickadate', [])
    .directive('pickadate', ['$locale', function($locale) {
      return {
        require: 'ngModel',
        scope: {
          selectedDates: '=ngModel',
          defaultDate: '=',
          minDate: '=',
          maxDate: '=',
          disabledDates: '=',
          range: '='
        },
        template:
          '<div class="pickadate">' +
            '<div class="pickadate-header">' +
              '<div class="pickadate-controls">' +
                '<a href="" class="pickadate-prev" ng-click="changeMonth(-1)" ng-show="allowPrevMonth">prev</a>' +
                '<a href="" class="pickadate-next" ng-click="changeMonth(1)" ng-show="allowNextMonth">next</a>' +
              '</div>'+
              '<h3 class="pickadate-centered-heading">' +
                '{{currentDate | date:"MMMM yyyy"}}' +
              '</h3>' +
            '</div>' +
            '<div class="pickadate-body">' +
              '<div class="pickadate-main">' +
                '<ul class="pickadate-cell">' +
                  '<li class="pickadate-head" ng-repeat="dayName in dayNames">' +
                    '{{dayName}}' +
                  '</li>' +
                '</ul>' +
                '<ul class="pickadate-cell">' +
                  '<li ng-repeat="d in dates" ng-click="setDate(d)" class="{{d.className}}" ng-class="getDateClasses(d)">' +
                    '{{d.date | date:"d"}}' +
                  '</li>' +
                '</ul>' +
              '</div>' +
            '</div>' +
          '</div>',

        link: function(scope, element, attrs, ngModel)  {
          var minDate       = scope.minDate && moment(scope.minDate),
              maxDate       = scope.maxDate && moment(scope.maxDate),
              currentDate   = (scope.defaultDate && moment(scope.defaultDate).toDate()) || new Date(),
              range         = scope.range !== false;

          scope.dayNames    = $locale.DATETIME_FORMATS.SHORTDAY;
          scope.currentDate = currentDate;

          scope.$watch('minDate', function(newVal) {
            minDate = scope.minDate && moment(scope.minDate);
            scope.render();
          });

          scope.$watch('maxDate', function(newVal) {
            maxDate = scope.maxDate && moment(scope.maxDate);
            scope.render();
          });

          scope.$watchCollection('disabledDates', function(newVal) {
            scope.disabledDates = (newVal || []).sort(function(a, b) { return moment(a).toDate() - moment(b).toDate()});
            scope.render();
          });

          scope.render = function() {
            var startOfMonth = moment(currentDate).startOf('month');
            var endOfMonth = moment(currentDate).endOf('month');
            var calStart = moment(startOfMonth).startOf('week');
            var calEnd = moment(endOfMonth).endOf('week');
            //var minDate = $scope.minDate;
            //var maxDate = $scope.maxDate;

            var dates = [];

            if (calStart.twix(calEnd).count('days') / 7 < 6) {
              calEnd = moment(calEnd).add(1, 'week');
            }

            scope.allowPrevMonth = !minDate || minDate.isBefore(startOfMonth, 'd');
            scope.allowNextMonth = !maxDate || maxDate.isAfter(endOfMonth, 'd');

            var calendarRange = calStart.twix(calEnd);
            var iter = calendarRange.iterate('days');

            while(iter.hasNext()) {
              var className = "",
                date = iter.next();

              if ((minDate && date.isBefore(minDate, 'd')) || (maxDate && date.isAfter(maxDate, 'd'))) {
                className = 'pickadate-disabled';
              } else if (isDateDisabled(date)) {
                className = 'pickadate-disabled pickadate-unavailable';
              } else {
                className = 'pickadate-enabled';
              }

              if (date.isSame(moment(), 'd')) {
                className += ' pickadate-today';
              }

              dates.push({
                date: date.toDate(),
                className: className
              });
            }

            scope.dates = dates;
          };

          scope.getDateClasses = function(d) {
            if (isDateDisabled(d.date)) return;

            var classesToApply = [];
            var selectedDates = scope.selectedDates;
            var start = moment(selectedDates.start);
            var end = moment(selectedDates.end);

            if (start.isSame(d.date, 'd') || end.isSame(d.date, 'd')) {
              classesToApply.push(' pickadate-active');
            } else if (start.twix(end).contains(moment(d.date))) {
              classesToApply.push(' pickadate-in-range');
            }

            return classesToApply;
          };

          var assignDates = function(dates) {
            if (!dates || Object.keys(dates).length === 0) ngModel.$setViewValue({});

            ngModel.$setViewValue(dates);
          };

          scope.setDate = function(dateObj) {
            if ((/pickadate-disabled/.test(dateObj.className))) return;
            if (!dateObj.date) {
              ngModel.$setViewValue({});
              return;
            }

            var dates = scope.selectedDates;
            var start = moment(dates.start);
            var end = moment(dates.end);
            var selectedDate = moment(dateObj.date);
            var newSelection = {};

            var rangeContainsDisabledDate = function() {
              var selectedStart = moment(newSelection.start),
                selectedEnd = moment(newSelection.end);

              return !(scope.disabledDates.every(function(date) {
                return !selectedStart.twix(selectedEnd).contains(moment(date, 'YYYY-MM-DD'));
              }));
            };

            // We already have a start date
            if (dates.start &&
              start.isSame(end, 'd') &&
              selectedDate.isAfter(start, 'd') &&
              !selectedDate.isSame(start, 'd') &&
              range) {

              newSelection.start = dates.start;
              newSelection.end = dateObj.date;
            } else {
              newSelection.start = dateObj.date;
              newSelection.end = dateObj.date;
            }

            if (!rangeContainsDisabledDate()) {
              assignDates(newSelection);
            }
          };

          ngModel.$render = function () {
            var dates = ngModel.$modelValue;

            if ((dates) && dates.start && !isDateDisabled(dates.start)) {
              scope.currentDate = currentDate = moment(dates.start).toDate();

              dates.end = dates.end || moment(dates.start).toDate(); //clone
              
              if (isDateDisabled(dates.end)) {
                dates.end = moment(dates.start).toDate();
              }
            } else if (dates) {
              // if the initial date set by the user is in the disabled dates list, unset it

              var tempDate = moment(dates.start);

              while(isDateDisabled(tempDate)) {
                tempDate.add(1, 'd');
              }

              scope.setDate({date: tempDate});
            }
            scope.render();
          };

          scope.changeMonth = function (offset) {
            var currentMonth = moment(currentDate).month();
            scope.currentDate = currentDate = moment(currentDate).month(currentMonth + offset).toDate();
            scope.render();
          };

          function isDateDisabled(date) {
            var dateIndex = _.findIndex(scope.disabledDates, function(d) {
              return moment(date).isSame(d, 'd')
            });

            return dateIndex >= 0;
          }
        }
      };
    }]);
})(window.angular);
