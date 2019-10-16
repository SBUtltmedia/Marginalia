var API;
var TEXTSPACE = "textSpace";

var currentUser = {};
var remSpan; // holds the name of made and clicked spans

/*
  Hides the loading symbol
  Loads the userdata obtained by the netID login
  Loads the users folder and creates a button for each user
*/
init = async ({ api = api, users = users } = {}) => {
    API = api;
    currentUser = users.current_user;

    const host = "apps.tlt.stonybrook.edu";

    $(".loader").hide();
    $("#text").hide();
    $("#addLitBase").hide();
    createUserSelectScreen({ users: users });

    $(window).on("resize", function () {
        var stageWidth = $(window).width();
        $("#text").css("height", $("#litDiv").height() + "px");
        $("html").css("font-size", (stageWidth / 60) + "px");
    }).trigger("resize")

    $.address.externalChange((evt) => {
        console.log("externalChange");
        loadFromDeepLink();
    });

    $(document).ajaxComplete(function () {
        (function bindRedirectConfirmation(specific = "a") {
            $(specific).one("click", function (event) {
                if ((this.href).indexOf(host) !== -1) {
                    console.log("do nothing is same host");
                } else if ((this.href).indexOf("javascript:void(0);") !== -1) {
                    console.log("do nothing is javascript void event");
                } else {
                    event.preventDefault();
                    let res = confirm("Are you sure you want to visit the URL:\n\n" + this.href);
                    if (res) {
                        window.location = this.href;
                    } else {
                        bindRedirectConfirmation(this);
                        return;
                    }
                }
            });
        })();
    });
}

// Creates a visual list of all users which gives access to their folders
/*
  Loads the user's works folder and creates a button for each work they have
  When the button is clicked the variable userFolderSelected is the work's name
  The cooresponding work then has it's text and comment/reply data loaded
*/
function buildHTMLFile(litContents, selected_eppn, textChosen) {
    // TODO check this logic
    console.log(selected_eppn, textChosen)
    if (!$(".commentTypeDropdown").length) {
        //TODO make drop down combine with commentbox
        makeDropDown();
        makeDraggableCommentBox(selected_eppn, textChosen);
        makeDraggableReplyBox();
        hideAllBoxes();
    } else {
        //TODO find a better way to do this (figure out why makeDraggableCommentBox is breaking the code if we call it twice)
        $("#commentSave").off().on("click", () => {
            saveButtonOnClick(selected_eppn, textChosen);
        });
    }
    loadUserComments(selected_eppn, textChosen);
    createWorkTitle(textChosen);

    var litDiv = $("<div/>", {
        "id": "litDiv"
    });

    var metaChar = $("<meta/>", {
        "charset": "utf-8"
    });

    var metaName = $("<meta/>", {
        "name": "viewport",
        "content": 'width=device-width, initial-scale=1.0'
    });

    var link = $("<link/>", {
        rel: "stylesheet",
        type: "text/css",
        media: "only screen",
        href: "css/style.css"
    });


    var preText = $("<div/>", {
        "id": "textSpace"
    });

    preText.html(litContents);

    litDiv.append(metaChar, metaName, link, script, preText);
    $("#text").append(litDiv);
}

function createWorkTitle(textChosen) {
    let workTitle = $("<div/>", {
        id: "workTitle"
    });
    let workTitleSpan = $("<span/>", {
        id: "workTitleSpan",
        text: textChosen
    });
    workTitle.append(workTitleSpan);
    $("#text").append(workTitle);
    createTips(workTitle);
}

function createTips(workTitle) {
    let tips = $("<div/>", {
        id: "tips"
    });
    let icon = $("<i/>", {
        class: "material-icons tipsIcon",
        text: "help"
    });
    let text = $("<span/>", {
        class: "tipsText"
    });
    text.html("The <span style = 'color : red'>Red</span> comments are the comments that are not approved yet.\nThe <span style = 'color : orange'>Orange</span> comments are comments that have unapproved replies.");
    tips.append(icon, text);
    workTitle.prepend(tips);
}

function makeDropDown() {
    let buttonTypes = ['Historical', 'Analytical', 'Comment', 'Definition', 'Question'];
    dropdown = $("<select>", {
        class: "commentTypeDropdown",
    });
    buttonTypes.forEach((type) => {
        var option = $("<option>", {
            name: type,
            text: type
        });
        dropdown.append(option);
        $("#commentTypeDropdown").val(option);
    });
}

// Load the user's comments after a work button is clicked
/*
  Fills the 3 comment variables with the comment/reply data
  Each is mapped with its cooresponding Hex-Encoded UNIX timestamp
  The student selection menu is filled with each student's netid
*/

loadUserComments = (selected_eppn, textChosen, selectedType, selectedCommenter) => {
    let endpoint, data;
    let isTypeAndCommenterUndefiend = (selectedType == undefined && selectedCommenter == undefined);
    if (isTypeAndCommenterUndefiend) {
        $("#text").hide();
        $("#textSpace").hide();
        $("#textTitle").hide();
        endpoint = "get_highlights";
        data = {
          creator : selected_eppn,
          work : textChosen
        }
    }
    // only reach here when selectorOnSelect() is called
    else {
      console.log(selectedType, selectedCommenter)
      endpoint = "get_highlights_filtered";
      data = {
        creator : selected_eppn,
        work : textChosen,
        filterEppn : selectedCommenter == "AllCommenters" ? "" : selectedCommenter,
        filterType: selectedType == "All" ? "" : selectedType
      }
    }
    API.request({
        endpoint: endpoint,
        data: data
    }).then((data) => {
        let sortedCommentData = [];
        for(var i = 0; i < data.length ; i++){
          let comment = data[i];
          sortedCommentData = sortCommentsByStartIndex(sortedCommentData,comment);
        }
        // reverse the list so the comments are created by the order of the startIndex. (bigger startIndex get created first)
        reverseSortedCommentData = reverseList(sortedCommentData);
        console.log(reverseSortedCommentData);
        renderComments(reverseSortedCommentData, selected_eppn, textChosen, getUnapprovedComments);
        if (isTypeAndCommenterUndefiend) {
            makeSelector(createListOfCommenter(data), colorNotUsedTypeSelector);
        }
    });
}

//selected_eppn : work creator
//textChosen : work Name
renderComments = (commentData, selected_eppn, textChosen, callback) => {
    $("#text").fadeIn();
    $("#textSpace").fadeIn();
    $("#textTitle").fadeIn();
    let temp;
    for (let i = 0; i < commentData.length; i++) {
        highlightText({
            startIndex: commentData[i].startIndex,
            endIndex: commentData[i].endIndex,
            commentType: commentData[i].commentType,
            eppn: commentData[i].eppn,
            hash: commentData[i].hash,
            approved: commentData[i].approved
        });
    }
    handleStartEndDiv(commentData);
    $("#text").css("height", $("#litDiv").height() + "px");
    //highlight to post comments
    $("#litDiv").on("mouseup", function (evt) {
        console.log(evt)
        highlightCurrentSelection(evt);
    });
    allowClickOnComment(textChosen, selected_eppn);
    callback(selected_eppn, textChosen);
}
//call this function to enable the clickEvent on .commented-selection
function allowClickOnComment(textChosen, selected_eppn) {
    //highlight on top of other's comment will bring them to the reply box
    $(".commented-selection").off().on("mouseup", function (evt) {
        clickOnComment(textChosen, selected_eppn, evt);
    });
}

function highlightText({ startIndex, endIndex, commentType, eppn, hash, approved }) {
    let range = rangy.createRange();
    range.selectCharacters(document.getElementById(TEXTSPACE), startIndex, endIndex);
    let area = rangy.createClassApplier("commented-selection", {
        useExistingElements: false,
        elementAttributes: {
            "commentId": hash,
            "creator": eppn,
            "typeof": commentType,
            "approved": approved
        }
    });
    area.applyToRange(range);
    $("<param/>", { class: 'startDiv', commentId: hash, startIndex: startIndex, colorId: 0 }).insertBefore(".commented-selection" + "[commentId = '" + hash + "']");
    $("<param/>", { class: 'endDiv', commentId: hash, endIndex: endIndex, colorId: 0 }).insertAfter(".commented-selection" + "[commentId = '" + hash + "']");
}

function handleStartEndDiv(commentData) {
    handleIncorrectTemplate();
    let sortedCommentData = [];
    console.log(commentData)
    //remove the duplicated startDiv and endDiv
    for (let i = 0; i < commentData.length; i++) {
        let startCount = $(".startDiv" + "[commentId = '" + commentData[i].hash + "']").length;
        if (startCount > 1) {
            $(".startDiv" + "[commentId = '" + commentData[i].hash + "']").not(":first").remove();
        }
        let endCount = $(".endDiv" + "[commentId = '" + commentData[i].hash + "']").length;
        if (endCount > 1) {
            $(".endDiv" + "[commentId = '" + commentData[i].hash + "']").not(":last").remove();
        }
        let isStartDivExist = $(".startDiv" + "[commentId = '" + commentData[i].hash + "']").length;
        let comment = {
            "hash": commentData[i].hash,
            // "startIndex":  isStartDivExist!=0 ? $(".startDiv"+"[commentId = '"+commentData[i].hash+"']").attr("startIndex") : $(".hiddenDiv"+"[commentId = '"+commentData[i].hash+"']").attr("startIndex")'
            "startIndex": $(".startDiv" + "[commentId = '" + commentData[i].hash + "']").attr("startIndex")
        }
        sortedCommentData = sortCommentsByStartIndex(sortedCommentData, comment);
    }
    console.log(sortedCommentData)
    //assign parent hash
    for (let i = 0; i < sortedCommentData.length; i++) {
        colorOverLappedComments(sortedCommentData[i].hash);
        colorAdjacentComments(sortedCommentData[i].hash);
    }
}

function sortCommentsByStartIndex(sortedCommentData, comment) {
    sortedCommentData.unshift(comment);
    for (var j = 0; j < sortedCommentData.length - 1; j++) {
        let first = parseInt(sortedCommentData[j]["startIndex"], 10);
        let second = parseInt(sortedCommentData[j + 1]["startIndex"], 10);
        if (first > second) {
            let temp = sortedCommentData[j + 1];
            sortedCommentData[j + 1] = sortedCommentData[j];
            sortedCommentData[j] = temp;
        }
    }
    return sortedCommentData;
}

function reverseList(list){
  let rlist = [];
  for(var i = 0; i < list.length ; i++){
    rlist.unshift(list[i]);
  }
  return rlist;
}

function handleIncorrectTemplate() {
    console.log($(".commented-selection").has('span'));
    let incorrectTemplate = $(".commented-selection").has('span');
    incorrectTemplate.each(function () {
        let span = $(this);
        let incorrectTemplateText = span.text();
        incorrectTemplateText.concat(span.find('span').text());
        span.empty();
        span.html(incorrectTemplateText);
    });
}

// TODO make a recursive to check if all it's parent is hidden
function colorOverLappedComments(commentHash) {
    // remove the parentHash first and reassign them if needed
    // $(".startDiv"+"[commentId = '"+commentHash+"']").removeAttr("parentHash");
    // $(".endDiv"+"[commentId = '"+commentHash+"']").removeAttr("parentHash");
    let prevStartDiv = $(".startDiv" + "[commentId = '" + commentHash + "']").prevAll(".startDiv:first");
    let nextEndDiv = $(".endDiv" + "[commentId = '" + commentHash + "']").nextAll(".endDiv:first");
    let prevStartColorId = parseInt(prevStartDiv.attr("colorId"), 10);
    //colorId 0:normal, 1:colorOneComments, 2:colorTwoComments, 3:colorThreeComments,4: colorFourComments
    if ((prevStartDiv.attr('commentId') == nextEndDiv.attr("commentId")) && (prevStartDiv.attr('commentId') != undefined)) {
        if ($(".commented-selection" + "[commentId = '" + prevStartDiv.attr('commentId') + "']").length != 0) {
            let startDiv = $(".startDiv" + "[commentId = '" + commentHash + "']");
            let endDiv = $(".endDiv" + "[commentId = '" + commentHash + "']");
            startDiv.attr("parentHash", nextEndDiv.attr("commentId"));
            endDiv.attr("parentHash", nextEndDiv.attr("commentId"));
            let commentsColorClass = ["", "colorOneComments", "colorTwoComments", "colorThreeComments", "colorFourComments"];
            if (prevStartColorId < 4) {
                $(".commented-selection" + "[commentId = '" + commentHash + "']").addClass(commentsColorClass[(prevStartColorId + 1)]);
                startDiv.attr("colorId", prevStartColorId + 1);
                endDiv.attr("colorId", prevStartColorId + 1);
            }
            else if (prevStartColorId == 4) {
                $(".commented-selection" + "[commentId = '" + commentHash + "']").addClass(commentsColorClass[0]);
                startDiv.attr("colorId", 0);
                endDiv.attr("colorId", 0);
            }
        }
    }
}

function colorAdjacentComments(commentHash) {
    let prevEndDiv = $(".startDiv" + "[commentId = '" + commentHash + "']").prevAll(".endDiv:first");
    let prevEndDivData = {
        "id": prevEndDiv.attr("commentId"),
        "index": prevEndDiv.attr("endIndex"),
        "colorId": parseInt(prevEndDiv.attr("colorId"), 10)
    }
    //console.log("prevEnd", prevEndDivData["id"],prevEndDivData["index"],prevEndDivData["isBlue"]);
    let currentStartDivIndex = $(".startDiv" + "[commentId = '" + commentHash + "']").attr("startIndex");
    let currentEndDivIndex = $(".endDiv" + "[commentId = '" + commentHash + "']").attr("endIndex");
    //console.log(commentHash,currentStartDivIndex,currentEndDivIndex);
    if (currentStartDivIndex <= parseInt(prevEndDivData["index"], 10)) {
        if ($(".commented-selection" + "[commentId = '" + prevEndDivData["id"] + "']").length != 0) {
            let commentsColorClass = ["", "colorOneComments", "colorTwoComments", "colorThreeComments", "colorFourComments"];
            if (prevEndDivData["colorId"] < 4) {
                $(".commented-selection" + "[commentId = '" + commentHash + "']").addClass(commentsColorClass[prevEndDivData["colorId"] + 1]);
                $(".startDiv" + "[commentId = '" + commentHash + "']").attr("colorId", prevEndDivData["colorId"] + 1);
                $(".endDiv" + "[commentId = '" + commentHash + "']").attr("colorId", prevEndDivData["colorId"] + 1);
            }
            else if (prevEndDivData["colorId"] == 4) {
                $(".commented-selection" + "[commentId = '" + commentHash + "']").addClass(commentsColorClass[0]);
                $(".startDiv" + "[commentId = '" + commentHash + "']").attr("colorId", 0);
                $(".endDiv" + "[commentId = '" + commentHash + "']").attr("colorId", 0);
            }
        }
    }
}

//if current user is admin for the current work, they are able to approve the unapproved comments
//if current user is creator of the comment, they are able to edit and delete the unapproved comment
//approved comments don't need to check anyPermission stuff
function clickOnComment(workChosen, workCreator, evt) {
    $("#replies").empty();
    $("#commentBox").removeAttr("data-replyToEppn");
    $("#commentBox").removeAttr("data-replyToHash");
    $("#commentBox").attr("data-editCommentId", "-1");
    let comment_data = {
        creator: workCreator,
        work: workChosen,
        commenter: evt["currentTarget"]["attributes"]["creator"]["value"],
        hash: evt["currentTarget"]["attributes"]["commentId"]["value"]
    };
    get_comment_chain_API_request(comment_data, comment_data["hash"]);
    evt.stopPropagation();
    displayReplyBox(evt, comment_data["hash"]);
    // displayCommentBox(evt);
    // hideCommentBox();
}

function getUnapprovedComments(workCreator, work) {
    //remove the unapproved classes
    $(".commented-selection").removeClass("unapprovedComments threadNotApproved");
    API.request({
        endpoint: "unapproved_comments",
        method: "GET",
        data: {
            creator: workCreator,
            work: work,
        },
    }).then((data) => {
        console.log(data);
        data.forEach((data) => {
            let ancesHash = data["AncestorHash"];
            let hash = data["CommentHash"];
            //console.log("for unaproved ",ancesHash,hash);
            //the first Level is unapproved
            if (ancesHash == hash) {
                $(".commented-selection" + "[commentId = '" + hash + "']").addClass("unapprovedComments");
            }
            else {
                $(".commented-selection" + "[commentId = '" + ancesHash + "']").addClass("threadNotApproved");
            }
        });
    });
}

function get_comment_chain_API_request(jsonData, commentSpanId) {
    let work = jsonData.work;
    let workCreator = jsonData.creator;
    API.request({
        endpoint: "get_comment_chain",
        data: jsonData,
        method: "GET"
    }).then((data) => {
        console.log(data);
        readThreads(data, work, workCreator);
    });
}

//read the thread (threads is the reply array, parentId is the hash, parentReplyBox is the replyBox returned by the showReply())
function readThreads(threads, work, workCreator, parentId = null) {
    if (threads.length == 0) {
        return;
    }
    else {
        for (var i = 0; i < threads.length; i++) {
            //TODO make it pass a object instead of every thing
            let dataForReplies = {
                eppn: threads[i].eppn,
                firstName: threads[i].firstName,
                lastName: threads[i].lastName,
                public: threads[i].public,
                type: threads[i].commentType,
                commentText: btoa(threads[i].commentText),
                hash: threads[i].hash,
                approved: threads[i].approved,
                parentId: parentId,
                work: work,
                workCreator: workCreator
            }
            createReplies(dataForReplies);
            readThreads(threads[i].threads, work, workCreator, threads[i].hash);
        }
    }
}

//TODO add the hidden comments also
//do the same thing as the commented-selection.length!=0 comment
function createCommentData() {
    let comments = $(".commented-selection");
    let commentData = [];
    for (var i = 0; i < comments.length; i++) {
        let commentHash = comments[i]['attributes']['commentId']['value'];
        let c = { hash: commentHash }
        let commentExist = false;
        for (var j = 0; j < commentData.length; j++) {
            if (commentData[j].hash == commentHash) {
                commentExist = true;
            }
        }
        if (!commentExist) {
            commentData.push(c);
        }
    }
    return commentData;
}

function createListOfCommenter(data) {
    var commenters = [];
    if (data.length) {
        commenters.push(data[0].eppn);
        for (var i = 1; i < data.length; i++) {
            var eppn = data[i].eppn;
            var eppnExist = false;
            for (var j = 0; j < commenters.length; j++) {
                if (commenters[j] == eppn) {
                    eppnExist = true;
                }
            }
            if (!eppnExist)
                commenters.push(eppn);
        }
    }
    return commenters;
}

// this function only check if the selected_eppn is same as the current user or not
function isCurrentUserSelectedUser(selected_eppn, needNotification) {
    if (selected_eppn == currentUser.eppn) {
        return true;
    }
    else {
        if (needNotification) {
            launchToastNotifcation("You don't have permission to do this action");
        }
        return false;
    }
}

//TODO this only blocks the Setting button:    mode = setting, mode = approvedComments
//need to update this function with other things that need to check if user is in whiteList
//ex: approve comments
function checkworkAdminList(selected_eppn, litId, mode) {
    var endPoint = "get_permissions_list";
    API.request({
        endpoint: endPoint,
        method: "GET",
        data: {
            eppn: selected_eppn,
            work: litId,
        }
    }).then((data) => {
        let isInWhiteList = false
        for (var i = 0; i < data["admins"].length; i++) {
            if (currentUser.eppn == data["admins"][i]) {
                isInWhiteList = true;
                console.log(currentUser.eppn, " in admins");
            }
        }
        if (!isInWhiteList) {
            if (mode == "approvedComments") {
                $("#replies").attr("isCurrentUserAdmin", false);
            }
        }
        else {
            if (mode == "approvedComments") {
                $("#replies").attr("isCurrentUserAdmin", true);
            }
        }
    });
}

function launchToastNotifcation(data) {
    var message = { message: data }
    console.log(data)
    var snackbarContainer = document.querySelector('.mdl-js-snackbar');
    snackbarContainer.MaterialSnackbar.showSnackbar(message);
}

//Make sure the dialog don't exceed the window
function adjustDialogPosition(evt, width, height, marginX, marginY) {
    let newLeft = (evt.pageX - marginX) + "px";
    let newTop = (evt.pageY + marginY) + "px";
    if (evt.clientY + (marginY + height) > $(window).height()) {
        newTop = (evt.pageY - (marginY + height)) + "px";
    }
    if (evt.pageX + width > $(window).width()) {
        newLeft = $(window).width() - (width + marginX) + "px";
    }
    return { newTop, newLeft }
}

//fucntions that were made by ppl before
//------------------------------------------------------------------------------

// Hides all movable and visable boxes on the screen
function hideAllBoxes() {
    $("[aria-describedby='replies']").hide();
    $("[aria-describedby='commentBox']").hide();
}
