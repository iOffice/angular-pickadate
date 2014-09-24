;(function(angular){
  'use strict';
  var indexOf = [].indexOf;
  angular.module('iOffice.pickadate', [])
    .factory('pickadateUtils', ['dateFilter', function(dateFilter) {
      return {
        isDate: function(obj) {
          return Object.prototype.toString.call(obj) === '[object Date]';
        },

        stringToDate: function(dateString) {
          if (this.isDate(dateString)) return new Date(dateString);
          return this.stringToMoment(dateString).toDate();
          
        },

        stringToMoment: function(dateString) {
          return moment(dateString, 'YYYY-MM-DD').hour(3);
        }
      };
    }])

    .directive('pickadate', ['$locale', 'pickadateUtils', 'dateFilter', function($locale, dateUtils, dateFilter) {
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
          var minDate       = scope.minDate && dateUtils.stringToMoment(scope.minDate, 'YYYY-MM-DD'),
              maxDate       = scope.maxDate && dateUtils.stringToMoment(scope.maxDate, 'YYYY-MM-DD'),
              disabledDates = scope.disabledDates || [],
              currentDate   = (scope.defaultDate && dateUtils.stringToDate(scope.defaultDate)) || new Date(),
              range         = scope.range !== false;

          scope.dayNames    = $locale.DATETIME_FORMATS.SHORTDAY;
          scope.currentDate = currentDate;

          scope.render = function() {
            var startOfMonth = moment(currentDate).startOf('month');
            var endOfMonth = moment(currentDate).endOf('month');
            var calStart = moment(startOfMonth).startOf('week');
            var calEnd = moment(endOfMonth).endOf('week');

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
                date = iter.next(),
                formattedDate = date.format('YYYY-MM-DD');

              if ((minDate && date.isBefore(minDate, 'd')) || (maxDate && date.isAfter(maxDate, 'd'))) {
                className = 'pickadate-disabled';
              } else if (indexOf.call(disabledDates, formattedDate) >= 0) {
                className = 'pickadate-disabled pickadate-unavailable';
              } else {
                className = 'pickadate-enabled';
              }

              if (date.isSame(moment(), 'd')) {
                className += ' pickadate-today';
              }

              dates.push({
                date: formattedDate,
                className: className
              });
            }

            scope.dates = dates;
          };

          var assignDates = function(dates) {
            if (!dates || Object.keys(dates).length === 0) ngModel.$setViewValue({});
            ngModel.$setViewValue(dates);
          };

          scope.setDate = function(dateObj) {
            if (isDateDisabled(dateObj)) return;
            if (!dateObj.date) {
              ngModel.$setViewValue({});
              return;
            }

            var dates = scope.selectedDates;
            var start = dateUtils.stringToMoment(dates.start);
            var selectedDate = dateUtils.stringToMoment(dateObj.date);
            var newSelection = {};

            var rangeContainsDisabledDate = function() {
              var selectedStart = dateUtils.stringToMoment(newSelection.start),
                selectedEnd = dateUtils.stringToMoment(newSelection.end);

              return !(disabledDates.every(function(date) {
                return !selectedStart.twix(selectedEnd).contains(moment(date, 'YYYY-MM-DD'));
              }));
            };

            // We already have a start date
            if (dates.start
              && (dates.start === dates.end)
              && selectedDate.isAfter(start, 'd')
              && !selectedDate.isSame(start, 'd')
              && range) {

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

          scope.getDateClasses = function(d) {
            var classesToApply = [];
            var selectedDates = scope.selectedDates;
            var start = dateUtils.stringToMoment(selectedDates.start);
            var end = dateUtils.stringToMoment(selectedDates.end);

            if (d.date === selectedDates.start || d.date === selectedDates.end) {
              classesToApply.push(' pickadate-active');
            } else if (start.twix(end).contains(moment(d.date, 'YYYY-MM-DD'))) {
              classesToApply.push(' pickadate-in-range');
            }

            return classesToApply;
          };

          ngModel.$render = function () {
            var dates = ngModel.$modelValue;

            if ((dates) && dates.start && (indexOf.call(disabledDates, dates.start) === -1)) {
              scope.currentDate = currentDate = dateUtils.stringToDate(dates.start);

              dates.end = dates.end || dates.start;
              
              if (indexOf.call(disabledDates, dates.end) >= 0) {
                dates.end = dates.start;
              }
            } else if (dates) {
              // if the initial date set by the user is in the disabled dates list, unset it
              scope.setDate({});
            }
            scope.render();
          };

          scope.changeMonth = function (offset) {
            var currentMonth = moment(currentDate).month();
            scope.currentDate = currentDate = moment(currentDate).month(currentMonth + offset).toDate();
            scope.render();
          };

          function isDateDisabled(dateObj) {
            return (/pickadate-disabled/.test(dateObj.className));
          }
        }
      };
    }]);
})(window.angular);
