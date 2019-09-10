var height;
var remSpan;

function getFirstRange(el) {
  let sel = rangy.getSelection(document.getElementById(el));
  return sel.rangeCount ? sel.getRangeAt(0) : null;
}

//applies the hl to the area selected by the user
function highlightCurrentSelection(evt, currentUser) {
  var dfd = new $.Deferred();
  var mainUser = user.data.user;
  var selectedRange = getFirstRange(evt.currentTarget);
  if (selectedRange.endOffset != selectedRange.startOffset) {
    $(".loader").show();
    CKEDITOR.instances.textForm.setData("");
    $("#commentRemove").text("Unselect");
    $("#commentSave").text("Save");
    $("div[aria-describedby='choices']").hide();
    $("[id='ui-id-1']").text("Annotation by: " + mainUser.firstname + " " + mainUser.lastname);
    remSpan = 'hl_' + user.getUserNetID();

    var range = selectedRange.toCharacterRange();

    CKEDITOR.instances['textForm'].setReadOnly(false);
    $(".commentTypeDropdown").removeAttr("disabled")
    $("#commentSave").show();
    $("#commentRemove").show();
    $("#commentExit").hide("Exit");
    $("div[aria-describedby='comApproval']").hide();

    hlRange(selectedRange);

    $("." + remSpan).attr("startIndex", range.start);
    $("." + remSpan).attr("endIndex", range.end);
    $("div[aria-describedby='replies']").hide();

    $("span[class^='hl']").off().on("click", function(evt) {
      if ($(this).attr("class").substring(0, 3) != "hl_") {
        idName = $(this).attr("class").split("_");
        evt.stopPropagation();
        displayChoiceBox(evt);
        remSpan = $(evt.currentTarget).attr("class");
      }
    })
    $(".loader").hide();
    displayCommentBox(evt);
  }

  return dfd;
}

function unhighlight(hl_ID) {
  let applierCount = rangy.createClassApplier(hl_ID);
  let range = rangy.createRange();
  //console.log(range,applierCount)

  //console.log(applierCount, range);
  range.selectNodeContents(document.getElementById("text"))
  applierCount.undoToRange(range);
}

function hlRange(range) {
  remSpan = "hl_" + currentUser.netid;

  let applierCount = rangy.createClassApplier("hl_" + currentUser.netid, {
    useExistingElements: false
  });

  if (literatureText.length == 0) {
    literatureText = $("#textSpace")[0].outerText;
    console.log(literatureText);
  }
  applierCount.applyToRange(range);
  //console.log(range);
  //linkComments(id);
}
