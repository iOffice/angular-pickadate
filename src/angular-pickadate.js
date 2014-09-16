;(function(angular){
  'use strict';
  var indexOf = [].indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (i in this && this[i] === item) return i;
    }
    return -1;
  };

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
        },

        dateRange: function(first, last, initial, format) {
          var date, i, _i, dates = [];

          if (!format) format = 'yyyy-MM-dd';

          for (i = _i = first; first <= last ? _i < last : _i > last; i = first <= last ? ++_i : --_i) {
            date = this.stringToDate(initial);
            date.setDate(date.getDate() + i);
            dates.push(dateFilter(date, format));
          }

          return dates;
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
          var minDate       = scope.minDate && dateUtils.stringToDate(scope.minDate),
              maxDate       = scope.maxDate && dateUtils.stringToDate(scope.maxDate),
              disabledDates = scope.disabledDates || [],
              currentDate   = (scope.defaultDate && dateUtils.stringToDate(scope.defaultDate)) || new Date(),
              range         = scope.range || false;

          scope.dayNames    = $locale.DATETIME_FORMATS.SHORTDAY;
          scope.currentDate = currentDate;

          scope.render = function(selectedDates) {
            var startDate = dateUtils.stringToDate(selectedDates.start);
            var endDate = dateUtils.stringToDate(selectedDates.end);

            var initialDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1, 3);

            var currentMonth    = initialDate.getMonth() + 1,
              dayCount          = new Date(initialDate.getFullYear(), initialDate.getMonth() + 1, 0, 3).getDate(),
              prevDates         = dateUtils.dateRange(-initialDate.getDay(), 0, initialDate),
              currentMonthDates = dateUtils.dateRange(0, dayCount, initialDate),
              lastDate          = dateUtils.stringToDate(currentMonthDates[currentMonthDates.length - 1]),
              nextMonthDates    = dateUtils.dateRange(1, 7 - lastDate.getDay(), lastDate),
              allDates          = prevDates.concat(currentMonthDates, nextMonthDates),
              dates             = [],
              today             = moment().format('YYYY-MM-DD');

            // Add an extra row if needed to make the calendar to have 6 rows
            if (allDates.length / 7 < 6) {
              allDates = allDates.concat(dateUtils.dateRange(1, 8, allDates[allDates.length - 1]));
            }

            var nextMonthInitialDate = new Date(initialDate);
            nextMonthInitialDate.setMonth(currentMonth);

            scope.allowPrevMonth = !minDate || initialDate > minDate;
            scope.allowNextMonth = !maxDate || nextMonthInitialDate <= maxDate;

            for (var i = 0; i < allDates.length; i++) {
              var className = "", date = allDates[i];

              if (date < scope.minDate || date > scope.maxDate) {
                className = 'pickadate-disabled';
              } else if (indexOf.call(disabledDates, date) >= 0) {
                className = 'pickadate-disabled pickadate-unavailable';
              } else {
                className = 'pickadate-enabled';
              }

              if (date === today) {
                className += ' pickadate-today';
              }

              dates.push({date: date, className: className});
            }

            scope.dates = dates;
          };

          var assignDates = function(dates) {
            if (!dates || Object.keys(dates).length === 0) ngModel.$setViewValue({});
            ngModel.$setViewValue(dates);
          };

          scope.setDate = function(dateObj) {
            if (isDateDisabled(dateObj)) return;

            var dates = scope.selectedDates;
            var start = dateUtils.stringToMoment(dates.start);
            var end = dateUtils.stringToMoment(dates.end);
            var selectedDate = dateUtils.stringToMoment(dateObj.date);
            var newSelection = {};

            var rangeContainsDisabledDate = function() {
              var selectedStart = dateUtils.stringToMoment(newSelection.start),
                selectedEnd = dateUtils.stringToMoment(newSelection.end);

              return !(disabledDates.every(function(date) {
                return !selectedStart.twix(selectedEnd).contains(moment(date, 'YYYY-MM-DD'));
              }));
            }

            // We already have a start date
            if (dates.start
              && (dates.start === dates.end)
              && selectedDate.isAfter(start, 'd')
              && !selectedDate.isSame(start, 'd')) {
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


          // scope.dates = {
          //   start: 2014-09-21,
          //   end: 2014-09-22;
          // }

          // scope.disabledDates = [2014-09-24, 2014-09-29]

          ngModel.$render = function () {
            var dates = ngModel.$modelValue;
            if ((dates) && dates.start && (indexOf.call(disabledDates, dates.start) === -1)) {
              scope.currentDate = currentDate = dateUtils.stringToDate(dates.start);

            if (dates.end && (indexOf.call(disabledDates, dates.end) >= 0)) {
                dates.end = dates.start;
              }
            } else if (dates) {
              // if the initial date set by the user is in the disabled dates list, unset it
              scope.setDates({});
            }
            scope.render(dates);
          };

          scope.changeMonth = function (offset) {
            // If the current date is January 31th, setting the month to date.getMonth() + 1
            // sets the date to March the 3rd, since the date object adds 30 days to the current
            // date. Settings the date to the 2nd day of the month is a workaround to prevent this
            // behaviour
            currentDate.setDate(1);
            currentDate.setMonth(currentDate.getMonth() + offset);
            scope.render(currentDate);
          };

          function isDateDisabled(dateObj) {
            return (/pickadate-disabled/.test(dateObj.className));
          }
        }
      };
    }]);
})(window.angular);
