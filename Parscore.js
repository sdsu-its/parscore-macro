/* Handles dropzone input. Checks file type and sends to respective function depending on input.
Checks for non csv or plain text files.*/
function handleFileSelect(evt) { 
    evt.stopPropagation();
    evt.preventDefault();
    var files = evt.dataTransfer.files; // FileList object.
    var file = files[0];
    //checks to see if they dropped a valid filetype
    console.log(file.name);
    if((file.type != "text/csv") && (file.type != "text/plain") && (file.type != "application/vnd.ms-excel")){
        swal({
            title: "Incorrect File type",
            text: "Please only drag and drop CSV files from Blackboard or TXT files from ParScore.",
            icon: "warning",
            buttons: true,
            dangerMode: true,
          })
          return;
    }
    $('#list').html('<p>' + file.name + '<p>');
    var reader = new FileReader();
    reader.onload= function(){
        var text = reader.result;
        if(file.type == "text/csv" || file.type == "application/vnd.ms-excel") {
            readFileCSV(text, file.name);
        }
        else if(file.type == "text/plain"){
            readFileTXT(text,file.name);
        }
    };
    reader.readAsText(file);
}
/* Reads in CSV file from Blackboard and parses through to write to text file.
 * Handles changes to the default grade center scheme. */
function readFileCSV(text) {
    var write = "";
    var uname = fname = lname = 0;
    var allTextLines = text.split(/\r\n|\n/); //split by new line
    var line = allTextLines[0].split(',');
    //set correct positions for username, first name, and last name
    for(var i = 0; i < allTextLines[0].length; i++){
        if(line[i] == "\"Username\"") uname = i;
        else if(line[i] == "\"First Name\"") fname = i;
        else if(line[i] == "\"Last Name\"") lname = i;
    }
    for(var i = 1; i<allTextLines.length;i++){ //skip header line
        line = allTextLines[i].split(',');
        if (i != allTextLines.length-1) {
            write = write + line[uname] + "," + line[lname] + "," + line[fname] + "\n";
        }
        else write = write + line[uname] + "," + line[lname] + "," + line[fname];
        write = write.replace(/['"]+/g, ''); //get rid of string quotes
    }
    makeTextFile(write);
}
/* Reads in Text file from Parscore and populates an array with the content of the text for CSV format.*/
function readFileTXT(text, fileName){
    var rows = [["Username",fileName]];
    var allNewlines = text.split(/\r\n|\n/); //split by new line
    for(var i = 1; i<allNewlines.length-1;i++){ //skip header line
        var write = allNewlines[i].split('\t');
        write[0] = write[0].replace(/['"]+/g, ''); //get rid of string quotes
        write[1] = write[1].replace(/['"]+/g, ''); //get rid of string quotes
        var line = [write[0], write[1]];
        rows.push(line);
    }
    var csvContent = "data:text/csv;charset=utf-8,";
    rows.forEach(function(rowArray) {
        var row = rowArray.join(",");
        csvContent += row + "\r\n";
    });
    var encodedUri = encodeURI(csvContent);
    makeCSVFile(encodedUri, fileName);
}
/* Creates a text file through a Blob JS object and attaches it to downloads element in CSS.*/
function makeTextFile(text, fileName) {
    fileName = removeExtention(fileName);
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
    fileName = removeExtention(filename);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", fileName+".csv");
    document.body.appendChild(link);
    link.click();
}
/* Removes the filename extension for filenames passed in*/
function removeExtention(fileName){
    return fileName.substr(0,(fileName.length()-4));
}
/* Prevents default drag behavior for file drop.*/
function handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
}
/* Setup the drop zone event listeners.*/
var dropZone = $('#drop_zone')[0];
dropZone.addEventListener('dragover', handleDragOver, false);
dropZone.addEventListener('drop', handleFileSelect, false);
