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
            text: "Please only drag and drop CSV files from Canvas or TXT files from ParScore.",
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
        var file_content = reader.result;
        detectFileTypeAndParse(file_content, file.name);
    };
    reader.readAsText(file);
}

/* Reads in CSV file from Blackboard and parses through to write to text file.
 * Handles changes to the default grade center scheme. */
function detectFileTypeAndParse(text, fileName) {
    var parse = Papa.parse(text, {header: true, skipEmptyLines: 'greedy'});

    if (parse['data'][parse['data'].length - 1].hasOwnProperty("Student")) {
        return parseStudentsFile(parse['data'], fileName);
    }
    else if (isValidUser(parse['data'][0]['student_number'])) {
        return parseParScoreFile(parse['data'], fileName);
    }

    swal({
        title: "Incorrectly Formatted File",
        text: "Please only drag and drop files given to you from Canvas or ParScore. We did not detect the proper formatting necessary to convert your file.",
        icon: "warning",
        buttons: true,
        dangerMode: true
    });
}

function parseStudentsFile(students, fileName) {
    //if any of the column positions did not get set, we assume the file is not formatted correctly
    if (!students[students.length - 1].hasOwnProperty("Student") || !students[students.length - 1].hasOwnProperty("SIS Login ID")) {
        swal({
            title: "Incorrectly Formatted File",
            text: "Please only drag and drop CSV files given to you from Canvas. We were not able to detect all of the columns necessary to convert your file.",
            icon: "warning",
            buttons: true,
            dangerMode: true
        });
        return;
    }

    var parscore_string = ""
    for (let student of students) {
        if (!(isValidUser(student['SIS User ID']))) continue; //skip over invalid users
          name_split = student['Student'].split(", ");
          parscore_string = parscore_string + student['SIS User ID'].trim() + "," + name_split[0] + "," + name_split[1] + "\n\r";
    }

    makeTextFile(parscore_string, fileName);
}


/* Reads in Text file from ParScore and populates an array with the content of the text for CSV format.*/
function parseParScoreFile(records, fileName) {
    var header = ["Student", "ID", "SIS User ID", "SIS Login ID", "Section"];
    for(var key in records[1]) {
      if(records[1].hasOwnProperty(key) && key !== 'student_number') {
        header.push(key);
      }
    }

    for(let record of records){
      record['SIS User ID'] = record['student_number'];
      delete record['student_number'];
    }

    var result = Papa.unparse(records, {columns: header, skipEmptyLines: 'greedy'});

    var content_type_header = "data:text/csv;charset=utf-8,";
    var encodedUri = encodeURI(content_type_header + result);
    makeCSVFile(encodedUri, fileName);
}


/* Checks to see if a username is a valid and readable string.*/
function isValidUser(userName) {
    userName = userName.replace(/['"]+/g, '');  //get rid of string quotes
    isValid = true;
    num = parseInt(userName);
    if (isNaN(num) || num < 800000000) return false;  //if the number is not a number or it is less than the lowest redID it's not valid
    return true;
}

/* Creates a text file through a Blob JS object and attaches it to downloads element in CSS.*/
function makeTextFile(text, fileName) {
    fileName = removeExtension(fileName);
    var data = new Blob([text], {type: 'text/plain'});
    var textFile = window.URL.createObjectURL(data);
    var link = document.createElement("a");
    link.setAttribute("href", textFile);
    link.setAttribute("download", fileName + "-converted-from-canvas.txt");
    document.body.appendChild(link);
    link.click();
}

/* Creates a CSV file and links it with CSS download element. Sets to download in browser.*/
function makeCSVFile(encodedUri, fileName) {
    fileName = removeExtension(fileName);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", fileName + "-converted-from-parscore.csv");
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
