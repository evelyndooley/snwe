/* jshint node: true */
'use strict';

/* global
  $, require, exports, __dirname */

const path = require('path');
const {execSync} = require('child_process');
const ExternalModule = require( path.resolve(__dirname, '../ExternalModule.js')).ExternalModule;


class windowModule extends ExternalModule {
  constructor(filePath,document) {
    super(filePath,document);
    this.container = 'left';
    this.refreshRate = 1000;
    this.scriptGetWindowTitle = path.join(__dirname, "../../../scpt/window.scpt");
  }

  update() {
    this.windowTitle = execSync(`/usr/bin/osascript ${this.scriptGetWindowTitle}`).toString();
    this.updateContent($("#window-output"), this.windowTitle);
  }

  get HTMLContent() {
    var moduleName = this.fileName;
    return  `<div class="widg" id="${moduleName}">
        <span class="output" id="${moduleName}-output"> ... </span>
      </div>`;
  }

}

exports.module = windowModule;
