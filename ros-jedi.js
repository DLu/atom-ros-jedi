'use babel'

import { extname } from 'path';

let helpers = null;

const cpp_regex = new RegExp([
  '^(<stdin>|.+):', // Path, usually <stdin>
  '(\\d+):\\s*', // Line Number
  '(.+)', // Main Text
  '\\s*\\[(.+)\\]', // category
  '\\s*\\[(.+)\\]', // certainty
  '$', // End of fix-it block
].join(''));

const py_regex = new RegExp([
  '^(<stdin>|.+):', // Path, usually <stdin>
  '(\\d+):\\s*', // Line Number
  '(\\d+):\\s*', // Col Number
  '([EW])(\\d+)\\s+', // Categorization
  '(.+)', // Main Text
  '$', // End of fix-it block
].join(''));

export function activate() {
  // Fill something here, optional
}

export function deactivate() {
  // Fill something here, optional
}

export function provideLinter() {
  return {
    name: 'ROS Jedi',
    scope: 'file',
    lintsOnChange: false,
    grammarScopes: ['source.cpp', 'source.h', 'source.python'],
    lint(textEditor) {
      if (helpers === null) {
        helpers = require('atom-linter');
      }
      const editorPath = textEditor.getPath();
      if (typeof editorPath === 'undefined') {
        // The editor has no path, meaning it hasn't been saved.
        return [];
      }
      const fileExt = extname(editorPath);
      if(fileExt == '.py'){
          return helpers.exec('/opt/ros/indigo/lib/roslint/pep8', [editorPath], {ignoreExitCode: true}).then(function(a) {
              var toReturn = [];
              var str_array = String(a).split('\n');
              for(var i = 0; i < str_array.length; i++) {
                  let match = py_regex.exec(str_array[i]);
                  if(match == null){
                      console.log(str_array[i]);
                  }else{
                      var line = Number.parseInt(match[2])-1;
                      var col = Number.parseInt(match[3])-1;
                      toReturn.push({
                        severity: match[4]=='E'?'error':'warning',
                        location: {
                          file: editorPath,
                          position: [[line, col], [line, col+1]],
                        },
                        excerpt: match[6],
                        description: match[6],
                      });
                      //console.log(toReturn[toReturn.length-1]);
                  }
              }
              return toReturn;
          }, function(a) {
              console.log("X");
              return [];
          });

      }else{
          return helpers.exec('/opt/ros/indigo/lib/roslint/cpplint', [editorPath]).then(function(a) {
              return [];
          }, function(a) {
              var toReturn = [];
              var str_array = String(a).split('\n');
              for(var i = 0; i < str_array.length-2; i++) { // Minus 2 to skip done processing and total errors
                  let match = cpp_regex.exec(str_array[i]);
                  if(match == null){
                      console.log(str_array[i]);
                  }else{
                      var line = Number.parseInt(match[2])-1;
                      toReturn.push({
                        severity: 'error',
                        location: {
                          file: editorPath,
                          position: [[line, 0], [line, 1]],
                        },
                        excerpt: match[3],
                        description: match[4],
                      });
                  }
              }
              return toReturn;

          });
      }
    }
  }
}