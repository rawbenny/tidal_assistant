// ==UserScript==
// @name         Tidal
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        http://gvltidwp1.btoins.ibm.com:8080/client/console.html?locale=en
// @require     http://ajax.googleapis.com/ajax/libs/jquery/2.1.0/jquery.min.js
// @require     https://gist.github.com/raw/2625891/waitForKeyElements.js
// @grant        GM.xmlHttpRequest
// @grant        GM.getResourceURL
// ==/UserScript==

function GM_addStyle(css) {
    const style = document.getElementById("GM_addStyleBy8626") || (function() {
        const style = document.createElement('style');
        style.type = 'text/css';
        style.id = "GM_addStyleBy8626";
        document.head.appendChild(style);
        return style;
    })();
    style.appendChild(document.createTextNode(css));
}

(function() {
    'use strict';

    // Your code here...
    var _btn = "<button id='tamper_btn'  style='position:absolute;top:0;'>Analyze</button>";

    var appendBtn = function(){
        $('body').append(_btn);
        $('#tamper_btn').on('click',btnClick);
		GM.xmlHttpRequest({
		    method: "GET",
		    url: "https://raw.githubusercontent.com/rawbenny/tidal_assistant/master/css/style.css?" + Math.random(),
		    onload: function(response) {
		        var css = response.responseText;
		        GM_addStyle(css);
		    }
		});        
    };
    var btnClick = function(){
        var _iframe = document.querySelector('iframe.gwt-Frame.frame');
        var _doc = _iframe && _iframe.contentDocument;
        var rows = _doc.querySelectorAll(".grid-JobRun.grid");
        analyze($(rows).find('table').clone());
    };

    var blackListPtns = [/Interface_ADAMImage/,/Interface_ADAMIndex/,];
    var cycleName = "";
    var cycleStatus = "";
    var cycleStartTime = "";
    var cycleEndTime = "";
    var dailyStartTime = "";
    var dailyEndTime = "";
    var criticalPathEndTime = "";
    var sysUnlockTime = "";
    var whiteList = [""];

    function analyze($cloned){
        var gridRows = $cloned.find('.gridRow');
        if(gridRows.length > 200){
            alert("Please filter the grid and try again.");
        }
        var rowsData = [];
        var ignoredRows = [];
        var watchedRows = [];
        gridRows.each(function(index, elem){
            var name = $(elem).find('.gridContent.col-2').text();
            var status = $(elem).find('.gridContent.col-3').text();
            var actStart = $(elem).find('.gridContent.col-11').text();
            var actEnd = $(elem).find('.gridContent.col-12').text();
            var reRuns = $(elem).find('.gridContent.col-7').text();
            var reRunsNum = parseInt(reRuns);
            if(name.match(/^PNXModel-ProjA/)){
                cycleName = "PNXModel";
                cycleStatus = status;
                cycleStartTime = actStart;
                cycleEndTime = actEnd;
            }else if(name.match(/^PNXDevA.*ProjA.{4}$/)){
                cycleName = "PNXDev";
                cycleStatus = status;
                cycleStartTime = actStart;
                cycleEndTime = actEnd;
            }

            if(name == "PNXModel_Daily (1)"|| name == "PNXDev_Daily (1)"){
                dailyStartTime = actStart;
                dailyEndTime = actEnd;
            } else if(name.match(/Daily_CriticalPath/)){
                criticalPathEndTime = actEnd;
            } else if(name.match(/Environment_UnLock/)){
                sysUnlockTime = actEnd;
            }

            var rowData = {"name":name, "status":status,"reRuns":reRuns,"actStart":actStart,"actEnd":actEnd};
            if(ignore(rowData) && reRunsNum != 0 ){
                ignoredRows.push(rowData);
            }else if(reRunsNum != 0 || rowData.status.match(/Completed%sAbnormally/)||rowData.status.match(/Completed%sNormally\*/)){
                watchedRows.push(rowData);
            }else{
                rowsData.push(rowData);
            }

        });

        buildTable(watchedRows,ignoredRows);
        renderTable();
    }

    function ignore(data){
        for(var i=0; i<blackListPtns.length; i++){
            if(data.name.match(blackListPtns[i])){
                return true;
            }
        }
        return false;
    }

    function buildTable(watchedRows,ignoredRows){

        var html = '<div id="modal" class="modalwindow"><h2><span id="cycleName"></span>:<span id="cycleStatus"></span> </h2><a href="#" class="close">X</a><div class="content"><table><tr><td>Cycle Started at</td><td id="cycleStartTime"></td></tr><tr><td><span class="cycleName"></span>_Daily Started at</td><td id="dailyStartTime"></td></tr><tr><td><span class="cycleName"></span>_Daily Finished at</td><td id="dailyEndTime"></td></tr><tr><td>Daily Critical Path Finished at</td><td id="criticalPathEndTime"></td></tr><tr><td>System Availability Unlocked and Available to All Users at</td><td id="sysUnlockTime"></td></tr><tr><td><span class="cycleName"></span> Completed at</td><td id="cycleEndTime"></td></tr></table></div></div>';
        if($("#modal").length == 0){
            $(html).appendTo('body');
        }
        //if close button is clicked
        $('.modalwindow .close').click(function (e) {
            //Cancel the link behavior
            e.preventDefault();
            $('.modalwindow').fadeOut(500);
        });

        $("#cycleName").text(cycleName);
        $(".cycleName").text(cycleName);
        $("#cycleStatus").text(cycleStatus);
        $("#cycleStartTime").text(cycleStartTime);
        $("#cycleEndTime").text(cycleEndTime);
        $("#dailyStartTime").text(dailyStartTime);
        $("#dailyEndTime").text(dailyEndTime);
        $("#criticalPathEndTime").text(criticalPathEndTime);
        $("#sysUnlockTime").text(sysUnlockTime);
        $(".watchedRows").remove();

        if(watchedRows.length > 0){
            var $watchedTable = $("<table><tr><td>Job</td><td>Status</td><td>Rerun</td></tr>",{class:"watchedRows"});
            for(var i=0;i<watchedRows.length;i++){
                var $td1=$("<td/>").text(watchedRows[i].name);
                var $td2=$("<td/>").text(watchedRows[i].status);
                var $td3=$("<td/>").text(watchedRows[i].reRuns);
                var $tr=$("<tr/>").append($td1).append($td2).append($td3);
                $watchedTable.append($tr);
            }
            $(".modalwindow .content").append('<h3 class="watchedRows">Report these jobs</h3>');
            $(".modalwindow .content").append($watchedTable);  
        }

        $(".ignoredRows").remove();
        if(ignoredRows.length > 0){
            var $ignoredTable = $("<table><tr><td>Job</td><td>Status</td><td>Rerun</td></tr>",{class:"ignoredRows"});
            for(var i=0;i<ignoredRows.length;i++){
                var $td1=$("<td/>").text(ignoredRows[i].name);
                var $td2=$("<td/>").text(ignoredRows[i].status);
                var $td3=$("<td/>").text(ignoredRows[i].reRuns);
                var $tr=$("<tr/>").append($td1).append($td2).append($td3);
                $ignoredTable.append($tr);
            }
            $(".modalwindow .content").append('<h3 class="ignoredRows">Ignore these jobs</h3>');
            $(".modalwindow .content").append($ignoredTable);  
        }
    }

    function renderTable(){
        var id = "#modal";
        //Get the window height and width
        var winH = $(window).height();
        var winW = $(window).width();

        //Set the popup window to center
        $(id).css('top',0);
        $(id).css('left', winW/2-$(id).width()/2);

        //transition effect
        $(id).fadeIn(500);
    }
    setTimeout(appendBtn,6000);
})();



