/* Handles dropzone input. Checks file type and sends to respective function depending on input.
Checks for non csv or plain text files.*/
function handleFileSelect(evt) {
    $('#drop_zone').removeClass("active");
    evt.stopPropagation();
    evt.preventDefault();
    var files = evt.dataTransfer.files; // FileList object.
    var file = files[0];
    //checks to see if they dropped a valid file type
    if ((file.type !== "text/csv") && (file.type !== "text/plain") && (file.type !== "application/vnd.ms-excel")) {
        swal({
            title: "Incorrect File type",
            text: "Please only drag and drop CSV files from Blackboard or TXT files from ParScore.",
            icon: "warning",
            buttons: true,
            dangerMode: true
        });
        return;
    }

    $('#recents').show();
    var $recent_list = $('#recent-files');
    while ($recent_list.find('li').length >= 5) {
        $recent_list.find('li').first().remove();
    }
    $recent_list.append('<li>' + file.name + '</li>');

    var reader = new FileReader();
    reader.onload = function () {
        var text = reader.result;
        if (file.type === "text/csv" || file.type === "application/vnd.ms-excel") {
            readFileCSV(text, file.name);
        }
        else if (file.type === "text/plain") {
            readFileTXT(text, file.name);
        }
    };
    reader.readAsText(file);
}

/* Reads in CSV file from Blackboard and parses through to write to text file.
 * Handles changes to the default grade center scheme. */
function readFileCSV(text, fileName) {
    var write = "";
    var user_name = 0,
        first_name = 0,
        last_name = 0;
    var allTextLines = text.split(/\r\n|\n/); //split by new line
    var line = allTextLines[0].split(',');
    //set correct positions for username, first name, and last name
    for (var i = 0; i < allTextLines[0].length; i++) {
        if (line[i] === "\"Username\"") user_name = i;
        else if (line[i] === "\"First Name\"") first_name = i;
        else if (line[i] === "\"Last Name\"") last_name = i;
    }
    if(user_name === first_name || user_name === last_name || first_name === last_name) {
        swal({
            title: "Incorrectly Formatted File",
            text: "Please only drag and drop CSV files given to you from the Blackboard Grade Center. We were not able to detect all of the columns necessary to convert your file.",
            icon: "warning",
            buttons: true,
            dangerMode: true
        });
        return;
    }
    for (var j = 1; j < allTextLines.length - 1; j++) { //skip header line
        line = allTextLines[j].split(',');
        if (!(isValidUser(line[user_name]))) continue; //skip over invalid users rollback
        if (line[user_name].substr(line[user_name]-12,line[user_name].length-1) === "previewuser") continue; //skip over preview users
        write = write + line[user_name] + "," + line[last_name] + "," + line[first_name] + "\n";
        write = write.replace(/['"]+/g, ''); //get rid of string quotes
    }
    makeTextFile(write, fileName);
}

/* Checks to see if a username is a valid blackboard and parscore readable string.*/
function isValidUser(userName) {
    userName = userName.replace(/['"]+/g, ''); //get rid of string quotes
    isValid = true;
    if (userName.length != 9) isValid = false;
    for (int i = 0; i < userName.length; i++)
        if (userName.charAt(i) > 9 || userName.charAt(i) < 0)
            isValid = false;
    return isValid;
}

/* Reads in Text file from ParScore and populates an array with the content of the text for CSV format.*/
function readFileTXT(text, fileName) {
    var rows = [["Username", fileName]];
    var allNewlines = text.split(/\r\n|\n/); //split by new line
    var write = allNewlines[0].split('\t');
    write[0] = write[0].replace(/['"]+/g, ''); //get rid of string quotes
    if (!(isValidUser(write[0]))) {
        swal({
            title: "Incorrectly Formatted File",
            text: "Please only drag and drop TXT files given to you from ParScore. We did not detect the proper formatting  necessary to convert your file.",
            icon: "warning",
            buttons: true,
            dangerMode: true
        });
        return;
    }

    for (var i = 0; i < allNewlines.length - 1; i++) {
        write = allNewlines[i].split('\t');
        write[0] = write[0].replace(/['"]+/g, ''); //get rid of string quotes
        write[1] = write[1].replace(/['"]+/g, ''); //get rid of string quotes
        var line = [write[0], write[1]];
        rows.push(line);
    }
    var csvContent = "data:text/csv;charset=utf-8,";
    rows.forEach(function (rowArray) {
        var row = rowArray.join(",");
        csvContent += row + "\r\n";
    });
    var encodedUri = encodeURI(csvContent);
    makeCSVFile(encodedUri, fileName);
}

/* Creates a text file through a Blob JS object and attaches it to downloads element in CSS.*/
function makeTextFile(text, fileName) {
    fileName = removeExtension(fileName);
    var data = new Blob([text], {type: 'text/plain'});
    var textFile = window.URL.createObjectURL(data);
    var link = document.createElement("a");
    link.setAttribute("href", textFile);
    link.setAttribute("download", fileName + ".txt");
    document.body.appendChild(link);
    link.click();
}

/* Creates a CSV file and links it with CSS download element. Sets to download in browser.*/
function makeCSVFile(encodedUri, fileName) {
    fileName = removeExtension(fileName);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", fileName + ".csv");
    document.body.appendChild(link);
    link.click();
}

/* Removes the filename extension for file names passed in*/
function removeExtension(fileName) {
    return fileName.substr(0, (fileName.length - 4));
}

/* Prevents default drag behavior for file drop.*/
function handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
}

/* Setup the drop zone event listeners.*/
var dropZone = $('#drop_zone')[0];
dropZone.addEventListener('dragleave', function () {
    $('#drop_zone').removeClass("active");
}, false);
dropZone.addEventListener('dragenter', function () {
    $('#drop_zone').addClass("active");
}, false);

dropZone.addEventListener('dragover', handleDragOver, false);
dropZone.addEventListener('drop', handleFileSelect, false);
