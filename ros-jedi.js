'use babel'

let helpers = null;

const regex = new RegExp([
  '^(<stdin>|.+):', // Path, usually <stdin>
  '(\\d+):\\s*', // Line Number
  '(.+)', // Main Text
  '\\s*\\[(.+)\\]', // category
  '\\s*\\[(.+)\\]', // certainty
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
    grammarScopes: ['source.cpp', 'source.h'],
    lint(textEditor) {
      if (helpers === null) {
        helpers = require('atom-linter');
      }
      const editorPath = textEditor.getPath()
      return helpers.exec('/opt/ros/indigo/lib/roslint/cpplint', [editorPath]).then(function(a) {
          return [];
      }, function(a) {
          var toReturn = [];
          var str_array = String(a).split('\n');
          for(var i = 0; i < str_array.length-2; i++) { // Minus 2 to skip done processing and total errors
              let match = regex.exec(str_array[i]);
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