(function () {
    
    'use strict';
    
    angular.module('mailTemplate').controller('mailGeneratorCtrl', mailGeneratorCtrl);

    mailGeneratorCtrl.$inject = ['$scope'];

    var variables = new Array;// Array with the names of the variables of the selected templates
    var allTemplates = new Array;// ARRAY DE PRUEBA

    function mailGeneratorCtrl ($scope) {
        console.log('It works, you can start coding in mailGenerator Controller!');

        // Call the function that includes the templates in the scrool toolbar
        //getScroolTemplates();

        // Call the function that extract the variables of the template
        //extractVar();

        // Introduce the variables in the dropdown menu
        //introduceVar();

        // Function that activates when click on a templated
        $(".templateSelector").click(function (){
            //Extract the id_template
            var id = this.id;
            // Extract the tables of the templates
            $.get("/getTemplate/" + id, function (data, status) {
                $("#actualTemaplate").html(data.templates[0]);
                var num = $("html").html();
                //$("html").html(num);
                console.log(num);
                extractVar(data.templates[0]);
                introduceVar();
            });
        })

    }

    // Function that get all the templates at the database and show at the scrool tool bar
    function getScroolTemplates ()
    {
        // Get all the templates located at table templates at the database
        $.get("/getCreatedTemplates", function (data, status) {
            // Define the variables html and htmlMob that includes the html code in the html global page
            var html = "<div class='scroolTool'>";
            var htmlMob = "<div class='dropdown'><button id='templatesButton' type='button' data-toggle='dropdown' class='btn btn-primary dropdown-toggle' aria-expanded='true'>Templates<span class='caret'></span></button><div class='scroolTool dropdown-menu'>";

            // introduce the different parameters in the diferentes templates selectors
            data.templates.forEach(function (element) {
                html += "<a href='#'>" +
                    "<div id=" + element.id_template + " ng-click='loadTemplate(" + element.id_template + ")' class='templateSelector col-xs-12'>" +
                    "<div class='col-xs-5 icono'><table><tbody><tr><td>" +
                    "<img src=" + element.icon + " class='img-responsive'>" +
                    "</td></tr></tbody></table></div>" +
                    "<div class='col-xs-7 textTemplSel'>" + element.name_template + "<br>Fecha de creación: " + element.created_at.substring(0, 10) + "</div>" +
                    "</div></a>";
                htmlMob += "<a href='#'>" +
                    "<div id=" + element.id_template + " ng-click='loadTemplate(" + element.id_template + ")' class='col-xs-12 textTemplSel templateSelector'>" + element.name_template + "" +
                    "<br>Fecha de creación:<br>" + element.created_at.substring(0, 10) + "</div></a>";
            });

            // Complete the html code
            html += "</div><a href='#/templateGenerator'>" + $("#refTemplateGenerator").html() + "</a>";
            htmlMob += "<div class='col-xs-12 textTemplSel templateSelector'>Create a new Template</div></div></div>";
            // Includes the new html code into the global html
            $("#emailGeneratorToolbar").html(html);
            $("#emailGeneratorToolbarButton").html(htmlMob);
        });
    }

    // Function that extract the variables of the selected template and introduce it in the Array 'variables'
    function extractVar (str){
        variables = [];
        var n;// start of the variable
        var m;// end of the variable

        // If the template has any variables, we extract them to manage
        if (str.search("{{") != -1){
            do {
                n = str.search("{{");
                m = str.search("}}");
                variables.push(str.substring((n + 2), m));
                str = str.substring(0, n) +
                    "<b>Variable</b>" +
                    str.substring((m + 2), str.length);
                //document.getElementById("emailGeneratorBody").innerHTML = res;
                //str = document.getElementById("emailGeneratorBody").innerHTML;
            } while (str.search("{{") != -1)
        }
        // Visualice the variables
        console.log(variables);

    }

    // Function that introduce the variables of the Array 'variables' in the dropdown menu to introduce the text
    function introduceVar (){
        var html = "";// HTML to introduce in the dropdown menu
        var type = "text";
        variables.forEach(function (element){
            html += "<label for=" + element + " class='col-xs-12 formLabel'>" + element + ":</label>" +
            "<input type=" + type + " id=" + element + " placeholder=" + element + " ng-model=" +element + " class='col-xs-12 form-control'>";
        });
        $("#variablesForm").html(html);
    }
    
    
})();

