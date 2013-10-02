'use strict';

// Declare app level module which depends on filters, and services
angular.module('myApp', [])
    .constant('CONFIG', {
        FORMATS: {
            DATE: 'D MMM YYYY',
            TIME: 'h:mmA'
        }
    })
    .controller('myCtrl', ['$scope', function($scope) {

        // a single date time value
        $scope.myDateTime = new Date().getTime();

        // separate date and time values
        $scope.myDate = moment('1/12/2011', 'M/DD/YYYY');
        $scope.myTime = moment('11:23', 'HH:mm');

    }])
    .directive('datepicker', ['$document', function($document){
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'partials/datepicker.html',
            scope: {
                value: '='
            },
            link: function(scope, element){
                var dateOffsets = [0, 0],
                    $body = angular.element($document).find('body');

                element.bind('keydown', function($event){
                   var shiftPressed = !!$event.shiftKey;
                   switch ($event.keyCode){
                       case 27:
                           scope.hideModal();
                           break;

                       case 37:
                           shiftPressed ? scope.datePicker.init(0,-1) : scope.datePicker.init(-1,0);
                           break;

                       case 39:
                           shiftPressed ? scope.datePicker.init(0,1) : scope.datePicker.init(1,0);
                           break;

                       default:
                   }
                   scope.$apply();
                });

                scope.hasTouch = Modernizr.touch;

                scope.hideModal = function(){
                    scope.showModal = false;
                    $body.removeClass('modal');
                };


                scope.datePicker = {
                    // step month, year, selected date, set date callback
                    init: function(month, year){
                        // default stepper increments
                        month = month || 0;
                        year = year || 0;

                        // client local timestamp
                        var now = moment(),
                            nowYear = now.year(),
                            nowMonth = now.month(),
                            nowWeek = now.week();

                        if (month === 0 && year === 0){
                            scope.datePicker.selected = moment(scope.value);
                            dateOffsets[0] = scope.datePicker.selected.month() - nowMonth;
                            dateOffsets[1] = scope.datePicker.selected.year() - nowYear;
                        } else {
                            dateOffsets[0] += month;
                            dateOffsets[1] += year;
                        }


                        var startDate = now.add('M', dateOffsets[0]).add('y', dateOffsets[1]),
                            startWeek = startDate.date(1).week(),
                            currentDay = startDate.date(),
                            isActiveMonth = function(date){
                                return startDate.year() === date.year() && startDate.month() === date.month();
                            },
                            isCurrentMonth = function(date, w){
                                return nowYear === date.year() && nowWeek === w;
                            },
                            d, w, date, days;

                        // column headings - this can live outside init() but needs to trigger on language change
                        scope.datePicker.daysOfWeek = [];
                        for (d = 0; d < 7; d++){
                            scope.datePicker.daysOfWeek.push(now.day(d).format('dd'));
                        }

                        // generate calendar model
                        scope.datePicker.viewTitle = startDate.format('MMMM YYYY');
                        scope.datePicker.weeks = [];
                        // 7 rows in calendar - add days for each row
                        for (w = startWeek; w < startWeek + 6; w++){
                            date = moment(startDate).week(w);
                            days = [];
                            for (d = 0; d < 7; d++){
                                days.push({
                                    date: moment(date.day(d)),
                                    day: date.day(d).format('D'),
                                    active: isActiveMonth(date),
                                    today: isCurrentMonth(date, w) && date.date() === currentDay,
                                    selected: scope.datePicker.selected.format('DD/MM/YYYY') === moment(date.day(d)).format('DD/MM/YYYY')
                                });
                            }
                            scope.datePicker.weeks.push({week: w, current: isCurrentMonth(date, w), days: days});
                        }

                        if (!scope.showModal){
                            scope.showModal = true;
                            $body.addClass('modal');
                        }
                    },

                    setSelected: function(day){
                        if (day.active){
                            var sel = moment(scope.datePicker.selected);
                            angular.forEach(scope.datePicker.weeks, function(week){
                                for (var d = 0; d < 7; d++){
                                    week.days[d].selected = week.days[d].date === day.date;
                                }
                            });
                            // set preferred return format here - valueOf() = Unix offset milliseconds
                            scope.datePicker.selected = day.date.hour(sel.hour()).minute(sel.minute()).seconds(0);
                        }
                    },

                    // preserve original time
                    today: function(){
                        var sel = moment(scope.datePicker.selected);
                        scope.value = moment().hour(sel.hour()).minute(sel.minute()).seconds(0);
                        scope.datePicker.init();
                    },

                    select: function(){
                        scope.value = scope.datePicker.selected.valueOf();
                        scope.hideModal();
                    }
                };

                scope.keyFn = function($event){
                    scope.hideModal();
                };

            }
        }
    }])
    .directive('timepicker', ['$document', function($document){
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'partials/timepicker.html',
            scope: {
                value: '='
            },
            link: function(scope, element){

                var timeOffsets = [0, 0],
                    $body = angular.element($document).find('body');

                scope.hasTouch = Modernizr.touch;

                scope.hideModal = function(){
                    scope.showModal = false;
                    $body.removeClass('modal');
                };

                scope.timePicker = {
                    time: {},

                    init: function(minute, hour){
                        // default stepper increments
                        minute = minute || 0;
                        hour = hour || 0;

                        if (minute === 0 && hour === 0){
                            scope.timePicker.selected = moment(scope.value);
                            timeOffsets[0] = scope.timePicker.selected.minute();
                            timeOffsets[1] = scope.timePicker.selected.hour();
                        } else {
                            timeOffsets[0] += minute;
                            if (timeOffsets[0] > 59){
                                timeOffsets[0] = 0;
                            } else if (timeOffsets[0] < 0){
                                timeOffsets[0] = 59;
                            }
                            timeOffsets[1] += hour;
                            if (timeOffsets[1] > 23){
                                timeOffsets[1] = 0
                            } else if (timeOffsets[1] < 0){
                                timeOffsets[1] = 23
                            }
                        }

                        // create valid moment to parse time
                        var h = timeOffsets[1], // 24 hour clock = 0 to 23
                            m = timeOffsets[0];

                        // period headings - this can live outside init() but needs to trigger on language change
                        scope.timePicker.meridiem = {
                            AM: moment('00:00', 'hh:mm').format('A'),
                            PM: moment('12:00', 'hh:mm').format('A')
                        };

                        // selectedTime used by picker clock
                        scope.timePicker.time = {
                            h: h === 0 ? 12 : h <= 12 ? h : h - 12,
                            m: m,
                            p: h < 12 ? 'AM' : 'PM'
                        };

                        // minutes are strings (single digits have leading zero)
                        scope.timePicker.time.m = scope.timePicker.time.m < 10 ? '0' + scope.timePicker.time.m : scope.timePicker.time.m.toString();

                        // parse value
                        scope.timePicker.setClock();

                        if (!scope.showModal){
                            scope.showModal = true;
                            $body.addClass('modal');
                        }
                    },

                    setSelected: function(period, value){
                        scope.timePicker.time[period] = value.value;
                        scope.timePicker.setClock();
                    },

                    // preserve original date
                    now: function(){
                        var now = moment();
                        scope.value = moment(scope.timePicker.selected).hour(now.hour()).minute(now.minute()).seconds(0);
                        scope.timePicker.init();
                    },

                    select: function(){
                        scope.value = scope.timePicker.selected.valueOf();
                        scope.hideModal();
                    },

                    setClock: function(){
                        scope.timePicker.clock = {
                            hours: [],
                            minutes: [],
                            periods: []
                        };

                        var minuteSelected = function(m, selected){
                                selected = selected === 0 ? 0 : 5 * Math.round(selected / 5);
                                if (selected === 60) selected = 0;
                                return m === selected;
                            },
                            minuteString = function(m){
                                return m < 10 ? '0' + m : m.toString();
                            };

                        for (var i = 0; i < 12; i++){
                            var h = i + 1,
                                m = i * 5,
                                p = i === 0 ? 'AM' : 'PM';
                            scope.timePicker.clock.hours.push({value: h, selected: h === scope.timePicker.time.h});
                            scope.timePicker.clock.minutes.push({value: minuteString(m), selected: minuteSelected(m, scope.timePicker.time.m)});
                            if (i < 2){
                                scope.timePicker.clock.periods.push({value: p, selected: p === scope.timePicker.time.p}); // meridiem
                            }
                        }

                        // make it a 24 our clock - set correct hours for 12AM/PM - 12:00AM = 0, 12:00PM = 12
                        if (scope.timePicker.time.h === 12){
                            h = scope.timePicker.time.p === 'AM' ? 0 : 12;
                        } else {
                            h = scope.timePicker.time.p === 'AM' ? scope.timePicker.time.h : scope.timePicker.time.h + 12;
                        }
                        // keep steppers in sync
                        timeOffsets = [parseInt(scope.timePicker.time.m), h];
                        scope.timePicker.selected = moment(scope.timePicker.selected).hour(timeOffsets[1]).minute(timeOffsets[0]).seconds(0);
                    }
                };
            }
        }
    }])
    .filter('dateFormat', ['CONFIG', function(CONFIG) {
        return function (ts) {
            return moment(ts).format(CONFIG.FORMATS.DATE);
        }
    }])
    .filter('timeFormat', ['CONFIG', function(CONFIG) {
        return function (ts) {
            return moment(ts).format(CONFIG.FORMATS.TIME);
        }
    }]);
