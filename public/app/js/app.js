(function () {
    'use strict';
    angular
        .module('mailTemplate', [
            'ui.router',
            'ngRoute',
            'ngLodash',
            'gridster',
            'ngFileReader'
        ])
        .run(['$rootScope', '$state', '$stateParams', '$window',
            function ($rootScope, $state, $stateParams, $window) {
                $rootScope.$state = $state;
                $rootScope.$stateParams = $stateParams;
                $rootScope.$storage = $window.localStorage;
            }]);
})();



(function () {

    'use strict';
    
    angular.module('mailTemplate').controller('mailGeneratorCtrl', mailGeneratorCtrl);
    
    mailGeneratorCtrl.$inject = ['$scope', '$http', '$compile'];

    function mailGeneratorCtrl ($scope, $http, $compile) {
        
        // Loading templates and saving in $scope.templateList in order to use it on div#emailGeneratorToolbar
        $http.get('/getCreatedTemplates').then(function (response) {
            $scope.templateList = response.data.templates;
        });

        $scope.loadTemplate = loadTemplate;

        $scope.validateForm = validateForm;
       
        $scope.sendMail = sendMail;
        
        $scope.changeVariables = changeVariables;
        
        $scope.closeDropdown = closeDropdown;
        
        /*
         * This function loads clicked template on #actualTemplate container, checks for variables on it, and loads them on dropdown menu
         * @param {type} id
         */
        
        function loadTemplate (id) {
            $http.get('getTemplate/' + id).then(function (response) {
                // Getting new template
                var htmlTemplate = response.data.templates || '<h1> No template received from server</h1>';
                console.log('loading...' + id);
                // If there is some '{{' string on template
                if (htmlTemplate.search('{{') !== -1) {
                    var startOfVariable = null;
                    var endOfVariable = null;
                    var variable = null;
                    $scope.templateVariables = [];
                    do {
                        startOfVariable = htmlTemplate.search('{{');
                        endOfVariable = htmlTemplate.search('}}');
                        variable = htmlTemplate.substring(startOfVariable + 2, endOfVariable);
                        $scope.templateVariables.push([variable, variable]);
                        htmlTemplate = htmlTemplate.substring(0, startOfVariable) +
                            '<label for=' + variable + ' ' + 'class="variables">' + variable + '</label>' +
                            htmlTemplate.substring(endOfVariable + 2, htmlTemplate.length);
                    } while (htmlTemplate.search('{{') !== -1);
                }
                    // Injecting new template in DOM
                    $('#actualTemplate').html(htmlTemplate);

                    // Compiling the new DOM content to enable angular on it
                    $compile($('#actualTemplate').contents())($scope);
            });
        }
        
        /*
         * This function validates the fields in the mail sending form
         * @returns {Boolean}
         */
        function validateForm () {
            if (
                $scope.sendMailForm.email.$invalid ||
                $scope.sendMailForm.subject.$invalid) {
                return true;
            }
        }
        
       /*
         * This function sends the email when button in header is clicked
         */
        function sendMail () {

            // Getting mail data
            var mailData = {
                'email': $scope.email,
                'subject': $scope.subject,
                'htmlContent': document.getElementById('actualTemplate').innerHTML
            };

            // Parsing js object to string
            mailData = JSON.stringify(mailData);
            
            // Print actual request to debug with postman
            console.log(mailData);

            // Sending mail
            $http.post('mail', {
                'mailData': mailData
            }).then(function (response) {
                // If ajax call success but it returns a fail state
                if (response.data.status === 'fail') {
                    swal({
                        'title': 'error!',
                        'text': 'server could not validate your data!',
                        'type': 'error',
                        'confirmButtomText': 'close'
                    });
                }
                // If ajax call success and it return a success state
                else {
                    swal({
                        'title': 'success!',
                        'text': 'All your emails were sended!',
                        'type': 'success',
                        'confirmButtomText': 'cool'
                    });

                    // Hide the modal
                    $('#sendMail').modal('hide');

                    // Clear the modal data
                    $scope.name = '';
                    $scope.email = '';
                    $scope.subject = '';

                    // This removes the has-error class added when the input data was removed setting the form state to pristine
                    $scope.sendMailForm.$setPristine();
                }

            }, function () {
                // If ajax call does not success
                swal({
                    'title': 'error!',
                    'text': 'Something is wrong with the server, please try again latter',
                    'type': 'error',
                    'confirmButtomText': 'close'
                });
            });
        }

        /*
         * This function set the variables of the template when the user change it on the form
         */
        function changeVariables () {

            // Getting the name of the variable and the value
            var NameVariable = this.variable[0];
            var ValueVariable = this.variable[1];

            // Getting the labels of the html
            var labels = angular.element(document).find("label");
            
            // Search and modify the label that the is modifing
            for (var i = 0; i < labels.length; i++){
                if (labels[i].getAttribute("for") === NameVariable && labels[i].getAttribute("class") === "variables"){
                    labels[i].innerHTML = ValueVariable;
                }
            }

        }
        
        /*
         * This function close the dropdown variables menu when hit enter
         */
        function closeDropdown (event) {
            (event.keyCode === 13) ? $('div#variables').removeClass('open') : '';
        }
    }
})();


(function () {

    'use strict';
    angular.module('mailTemplate').controller('templateGeneratorCtrl', templateGeneratorCtrl);
    templateGeneratorCtrl.$inject = ['$scope', '$http', '$window'];
    
    function templateGeneratorCtrl ($scope, $http, $window) {
        
        // All controller functions are declared here
        $scope.saveTemplate = saveTemplate;
        $scope.validateTemForm = validateTemForm;
        $scope.createTextElement = createTextElement;
        $scope.validateForm = validateForm;
        $scope.createLink = createLink;
        $scope.deleteItem = deleteItem;
        $scope.onReaded = onReaded;
        $scope.openTinymce = openTinymce;
        
        // All controller properties are declared here
        $scope.readMethod = 'readAsDataURL';
        $scope.elementList = [];
        $scope.gridsterOpts = {
            'columns': 24,
            'pushing': true,
            'floating': false,
            'swapping': true,
            'width': 'auto',
            'colWidth': 'auto',
            'rowHeight': 50,
            'margins': [10, 10],
            'outerMargin': true,
            'isMobile': false,
            'mobileBreakPoint': 600,
            'mobileModeEnabled': true,
            'minColumns': 1,
            'minRows': 1,
            'maxRows': 100,
            'defaultSizeX': 4,
            'defaultSizeY': 1,
            'minSizeX': 1,
            'maxSizeX': null,
            'minSizeY': 1,
            'maxSizeY': null,
            'resizable': {
                'enabled': true,
                'handles': ['se']
                /*
                 * 'start': function(event, $element, widget) {},
                'resize': function(event, $element, widget) {},
                'stop': function(event, $element, widget) {}
                */
            },
            'draggable': {
                'enabled': false,
                'handle': '.my-class',
                'start': function (event, $element, widget) {
                    // Create a new property on widget to store initial row
                    widget.initialRow = widget.row;
                },
                'drag': function (event, $element, widget) {
                    // Declare array too store all columns occupied by the clicked widget
                    var columnsOccupied = [widget.col];
                    // Inject occupied columns on the previous array
                    for (var counter = 1;counter <= widget.sizeX;counter++) {
                        columnsOccupied.push(widget.col + counter);
                    }
                    // For each gridster element,  we check if it ocuppies the inmediate row below  to the selected widget
                    angular.forEach($scope.elementList, function (value) {
                        if (value.row === widget.sizeY + widget.row) {
                            // Declare array to store all columns occupied by the widget below the clicked widget
                            var columnsOccupiedByTheBelowOne = [value.col];
                            // Inject occupied columns on the previous array
                            for (var counter = 1;counter < value.sizeX;counter++) {
                                columnsOccupiedByTheBelowOne.push(value.col + counter);
                            }
                            // Check if any of the elements of array  columnsOccupiedByTheBelowOne is inside columnsOccupied array
                            for (var i = 0;i < columnsOccupiedByTheBelowOne.length;i++) {
                                if ($.inArray(columnsOccupiedByTheBelowOne[i], columnsOccupied) !== -1 && widget.row > widget.initialRow) {
                                    // If that is the case, the widget below our clicked widget is moved to the previous row
                                    value.row -= 1;
                                }
                            }
                        }
                    });
                }
                // 'stop': function (event, $element, widget) {}
            }
        };
        $scope.tinyMceTextOpts = {
            'selector': '.tinymceWidget',
            'font_formats': 'Andale Mono=andale mono, monospace;Arial=arial,helvetica,sans-serif;Courier New=courier new,courier;Times New Roman=times new roman,times;',
            'force_br_newlines': true,
            'force_p_newlines ': false,
            'forced_root_block': '',
            'inline': true,
            'resize': true,
            'plugins': [
                'link autolink image',
                'textcolor imagetools',
                'colorpicker'
            ],
            'menubar': false,
            'toolbar1': 'fontsizeselect fontselect | alignleft aligncenter alignright alignjustify | subscript superscript ',
            'toolbar2': 'undo redo | bold italic underline forecolor backcolor | mybutton | image  link unlink',
            'setup': function (editor) {
                editor.addButton('mybutton', {
                    'text': 'Variable',
                    'icon': false,
                    'onclick': function () {
                        editor.insertContent('<span class="variables" style="color: red; background: yellow; font-weight: bold">' +
                            '<span class="uneditable" contenteditable="false">{{</span>Variable<span class="uneditable" contenteditable="false">}}' +
                            '</span></span>');
                    }
                });
            },
            'file_browser_callback': myFileBrowser,
            'fontsize_formats': '8pt 10pt 12pt 14pt 18pt 24pt 36pt 42pt 72pt',
            'imagetools_cors_hosts': ['www.tinymce.com', 'codepen.io']
        };
        $scope.tinyMceImgOpts = {
            'selector': '.imageExample',
            'inline': true,
            'resize': true,
            'plugins': [
                'image',
                'imagetools'
            ],
            'menubar': false,
            'toolbar': 'undo redo | image | alignleft aligncenter alignright',
            'file_browser_callback': myFileBrowser,
            'imagetools_cors_hosts': ['www.tinymce.com', 'codepen.io']
        };

        /*
         * This function validates the fields in the mail sending form
         * @returns {Boolean}
         */
        function validateTemForm () {
            return $scope.saveTemplateForm.name_template.$invalid ? true : '';
        }
        
        /*
         * This function saves the  new template when button in header is clicked
         */
        function saveTemplate () {
            // Take a screenshot form the template for the icon
            var screenshot = document.getElementById('templateGeneratorBody');
            html2canvas(screenshot, {
                onrendered: function(canvas) {
                    // Getting template data
                    var templateData = {
                        'name_template': $scope.name_template,
                        'icon': canvas.toDataURL(),
                        'html': document.getElementById('templateGeneratorBody').innerHTML
                    };

                    // Parsing js object to string
                    templateData = JSON.stringify(templateData);

                    // Ajax request to sabe new template
                    $http.post('saveTemplate', {
                        'template': templateData
                    }).then(function (response) {
                        // If ajax call success but it returns a fail state
                        if (response.data.status === 'fail') {
                            swal({
                                'title': 'error!',
                                'text': 'server could not validate your data!',
                                'type': 'error',
                                'confirmButtomText': 'close'
                            });
                        }
                        // If ajax call success and it return a success state
                        else {
                            swal({
                                'title': 'success!',
                                'text': 'Your template is save!',
                                'type': 'success',
                                'confirmButtomText': 'cool'
                            });

                            // Hide the modal
                            $('#saveTemplate').modal('hide');

                            // Clear the modal data
                            $scope.name_template = '';
                            $scope.icon_template = '';

                            // This removes the has-error class added when the input data was removed setting the form state to pristine
                            $scope.saveTemplateForm.$setPristine();
                        }
                    }, function () {
                        // If ajax call does not success
                        swal({
                            'title': 'error!',
                            'text': 'Something is wrong with the server, please try again latter',
                            'type': 'error',
                            'confirmButtomText': 'close'
                        });
                    });
                }});
        }
        /*
        * This Function extract the url of the insert image
        * @param input {type} HTML Element
        * @param field_name {type} string
        * @param win {type} window Object
         */
        function readURL (input, field_name, win) {
            if (input.files && input.files[0]) {
                var reader = new FileReader();
                reader.onload = function (e) {
                    win.document.getElementById(field_name).value = e.target.result;
                };
                reader.readAsDataURL(input.files[0]);
            }
        }

        /*
        * This Function expand the browser file to insert an image
         */
        function myFileBrowser (field_name, url, type, win) {
            var elemId = 'img';
            var elem = win.document.getElementById(elemId);
            if (elem && document.createEvent) {
                var evt = document.createEvent('MouseEvents');
                evt.initEvent('click', true, false);
                elem.dispatchEvent(evt);
            }
            $('#' + elemId).change(function () {
                readURL(this, field_name, win);
            });
            win.document.getElementById(field_name).value = 'Without file';
        }
        
        /*
         * This function creates a new gridster element when a button in the toolbar is clicked. It is used
         * for all buttons, so it receives as an argument which elements needs to be created.
         * @param {type} element
         * @returns {undefined}
         */
        function createTextElement (element) {
            
            $scope.elementList.push({
                'type': element,
                'sizeX': 4,
                'sizeY': 1,
                'gridsterId': $scope.elementList.length,
                'innerBrNodes': 1
            });
        }
        /*
         * This functions validates form displayed when link button is clicked on the toolbar and returns
         * the disability status for sending button.
         * @returns {Boolean}
         */
        function validateForm () {
            if (
                $scope.linkSettingsForm.link.$invalid) {
                return true;
            }
        }

        /*
         * This function is used to create a link element (this functionality will probably be deprecated in order
         * to use tinymce instead). It receives as arguments the href and text values for link and creates
         * a new gridster element.
         * @param {type} link
         * @param {type} linkText
         * @returns {undefined}
         */
        function createLink (link, linkText) {
            $scope.elementList.push({
                'type': 'a',
                'href': link,
                'text': linkText,
                'sizeX': 1,
                'sizeY': 1
            });
        }
        
    /*
     * This function is used to delete a gridster element when trash icon is clicked
     * @param {type} index
     * @returns {undefined}
     */
        function deleteItem (index) {
            $scope.elementList.splice(index, 1);
        }
        
        /*
         * This function is used to create a gridster img element, in which the image source is used
         * as background.
         */
        function onReaded (e, file) {
            $scope.img = e.target.result;
            $scope.file = file;
            $scope.elementList.push({
                'type': 'img',
                'src': $scope.img,
                'sizeX': 1,
                'sizeY': 1
            });
            $('#askForImg').modal('hide');
        }
        /*
         *  This function opens tinymce menu wuen a gridster widget is clicked
         *   It also selects default text to change it
         */
        function openTinymce (event) {
            var selection = $window.getSelection();
            var range = document.createRange();
            var parent = $(event.target).parent();
            
            if (!$(event.target).parent('.tinymceContainer').hasClass('tinymceWidget')) {
                // This creates a tinymcewidget on widget clicked
                $(event.target).parent('.tinymceContainer').addClass('tinymceWidget');
                tinymce.init($scope.tinyMceTextOpts);
                tinymce.activeEditor.focus();
                range.selectNodeContents(parent.children().get(0));
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }
    }
})();

(function () {
    'use strict';
    angular
        .module('mailTemplate')
        .constant('BASEPATH', {
            apiURL: '[your API URL]',
            webURL: '[your WEB URL]'
        });
})();


(function () {
    
    'use strict';
    
    angular.module('mailTemplate').config(URLConfig);

    URLConfig.$inject = ['$stateProvider', '$locationProvider', '$urlRouterProvider', 'RouteHelpersProvider'];
    
    /**
     * URL Configurator
     * @param $stateProvider
     * @param $locationProvider
     * @param $urlRouterProvider
     * @param helper
     * @constructor
     */
    function URLConfig($stateProvider, $locationProvider, $urlRouterProvider, helper) {
        
        // Disabling HTML5
        $locationProvider.html5Mode(false);

        // default 
        $urlRouterProvider.otherwise('/mailGenerator');

        // Defining route to mailGenerator
        $stateProvider
            .state('mailGenerator', {
                url: '/mailGenerator',
                templateUrl: helper.basepath('components', 'mailGenerator'),
                controller: 'mailGeneratorCtrl'
            });
            
        // Defining route to templateGenerator    
        $stateProvider
            .state('templateGenerator', {
                url: '/templateGenerator',
                templateUrl: helper.basepath('components', 'templateGenerator'),
                controller: 'templateGeneratorCtrl'
            });            
    }
})();
(function () {
    angular.module('mailTemplate').directive('ngResizable', function () {
        return {
            'restrict': 'A',
            'link': function ($scope, element) {
                // Check fi some new node is inserted
                $(element).bind('DOMNodeInserted', function (e) {

                    // Check if new node is a br tag
                    if ($(e.target)[0].tagName === 'BR') {
                        
                        // Get id of li node where gridster is implemented
                        var gridsterId = $(element).parent('li').attr('data-gridsterId');

                        // Get gridster element needed to change its sizeY
                        var gridsterElement = $scope.elementList[gridsterId];
                        
                        // Get actual number of br children in element
                        var actualBrNodes = $(element).children().first().children('br').length;
                        
                        // Save new br count
                        gridsterElement.innerBrNodes = actualBrNodes;
                        
                        // Get tinymce height
                        var tinymceHeight = $(element).children().first().height();
                        
                        // Get gridster height
                        var gridsterHeight = $(element).parent('li').height();
                        
                        // Check if tinymce height is bigger than gridster height
                        if (tinymceHeight > gridsterHeight + 10) {
                            console.log('ITS INCREASED--> tinymce height: ' + tinymceHeight + ' gridster height: ' + gridsterHeight);

                            // Increase gridster rows until its smaller or equal to tinymce height
                            var diff = Math.ceil((tinymceHeight - gridsterHeight) / 100);

                           // Refresh $scope to apply new size changes
                            $scope.$apply(function () {
                                gridsterElement.sizeY += diff;
                                console.log('new height: ' + gridsterElement.sizeY);
                            });
                        }
                        else {
                            console.log('ITS NOT INCREASED--> tinymce height: ' + tinymceHeight + 'gridster height: ' + gridsterHeight);
                        }
                    }
                });
                
                 // Check if some node is removed
                element.bind('keydown', function (event) {
              // Check if back key is enter
                    if (event.keyCode === 8) {

                        // Get actual number of br children in element
                        var actualBrNodes = $(element).children().first().children('br').length;
                        
                        // Get previus saved number of br elements
                        var lastBrCheck =  $(element).parent('li').attr('data-innerBrNodes');
                        
                        // Compare it with previus saved number of br elements
                        if (actualBrNodes < lastBrCheck) {
                            
                            // Get id of li node where gridster is implemented
                            var gridsterId = $(element).parent('li').attr('data-gridsterId');
                            
                            // Get gridster element we need to change its sizeY
                            var gridsterElement = $scope.elementList[gridsterId];
                            
                            // Save new br count
                            gridsterElement.innerBrNodes = actualBrNodes;
                            
                            // Get the tinymce height
                            var tinymceHeight = $(element).children().first().height();

                            // Get gridster height
                            var gridsterHeight = $(element).parent('li').height();
                            
                            // Check if lost br implies an enough decresment of tinymce height
                            if (tinymceHeight + 40 < gridsterHeight) {
                                console.log('IT IS DECREASED--> tinymce: ' + tinymceHeight + ' gridster: ' + gridsterHeight);

                                 // Get id of li node where gridster is implemented
                                var gridsterId = $(element).parent('li').attr('data-gridsterId');

                                 // Get gridster element we need to change its sizeY
                                var gridsterElement = $scope.elementList[gridsterId];

                                 // Refresh $scope to apply new size changes
                                $scope.$apply(function () {
                                    gridsterElement.sizeY -= 1;
                                    console.log('new height: ' + gridsterElement.sizeY);
                                });
                            }
                             
                            else {
                                console.log('IT IS NOT DECREASED--> tinymce: ' + tinymceHeight + ' gridster: ' + gridsterHeight);
                            }
                            
                        }
                        // This resolves the bug that causes to remove h1/h2/h3/p tags
                        if ($(element).children().first().html() === '<br>') {
                            $(element).children().first().html('&nbsp');
                        }
                        
     /*
                        // We check if tinymce is smaller than gridster
                        if (tinymceHeight + 40 < gridsterHeight) {
                            
                            console.log ('ahora se borraría --> tinymce: ' + tinymceHeight + ' gridster: ' + gridsterHeight);
                            
                            // we get id of li node where gridster is implemented
                            var gridsterId = $(element).parent('li').attr('data-gridsterId');

                            // we get gridster element we need to change its sizeY
                            var gridsterElement = $scope.elementList[gridsterId];
                            
                           // HERE is where we need to trigger resize event on gridster widger so it only increases one time. It strangely triggers on mouseover over arrows icon
                            $scope.$apply(function () {
                                gridsterElement.sizeY -= 1;
                                console.log('new height: ' + gridsterElement.sizeY);
                            });
                        }
*/
                    }
                });
            }
        };
    });
})();


/* This is how it was done watching keypress events. Problem was that we want to check adding or deleting br tags, not keypressing enter key
(function () {
    angular.module('mailTemplate').directive('ngResizable', function () {
        return {
            'restrict': 'A',
            'link': function ($scope, element) {
                element.bind('keydown', function (event) {
              // We check if keypressed is enter
                    if (event.keyCode === 13) {
           
                        // We get the tinymce height
                        var tinymceHeight = $(element).children().first().height();
                        // we get gridster height
                        var gridsterHeight = $(element).parent('li').height();

                        // We check if tinymce height is bigger than gridster height
                        if (tinymceHeight > gridsterHeight) {
                            console.log('SI ENTRA --> altura tinymce: ' + tinymceHeight + ' altura gridster: ' + gridsterHeight);

                            // we get id of li node where gridster is implemented
                            var gridsterId = $(element).parent('li').attr('data-gridsterId');

                            // we get gridster element we need to change its sizeY
                            var gridsterElement = $scope.elementList[gridsterId];

                            // we increase gridster rows until its smaller or equal to tinymce height
                            var diff = Math.ceil((tinymceHeight - gridsterHeight) / 100);

                           // HERE is where we need to trigger resize event on gridster widger so it only increases one time. It strangely triggers on mouseover over arrows icon
                            $scope.$apply(function () {
                                gridsterElement.sizeY += diff;
                                console.log('new height: ' + gridsterElement.sizeY);
                            });
                        }
                        else {
                            console.log('NO ENTRA --> altura tinymce: ' + tinymceHeight + ' altura gridster: ' + gridsterHeight);
                        }
                    }

                });
            }
        };
    });
})();
 */


(function () {
    'use strict';
    angular
        .module('mailTemplate')
        .provider('RouteHelpers', RouteHelpers);

    function RouteHelpers() {
        this.basepath = basepath;

        function basepath(type, folder, template) {
            template = template || 'template';
            if (folder) {
                return '/app/views/' + type + '/' + folder + '/' + template + '.html';
            }
            return '/app/views/' + type + '/' + template + '.html';
        }

        this.$get = function () {
            return {
                basepath: this.basepath
            };
        };
    }
})();
