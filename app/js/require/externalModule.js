/* jshint node: true */
'use strict';
/* global
  $, document */

const EventEmitter = require('events').EventEmitter;
const AppProcess= require('./appProcess.js').appProcess;
const {exec} = require('child_process');

class ExternalModule extends EventEmitter {
  constructor(filePath,unID=false) {
    super();
    this.filePath = filePath;
    this.document = document;
    this.container = 'right';
    this.refreshRate = 1000;
    this.unID = unID;
    this.isLoaded = false;
    this.node = document.createElement("div");
    this.node.innerHTML = this.HTMLContent;
    this.command = '';
  }

  updateContent(element, content) {
    if (element.html() != content) {
      element.html(content);
    }
  }

  updateElementProperty(element, property, propertyList) {
    if (!element.hasClass(property)) {
      propertyList.forEach(p => {
        element.removeClass(p);
      });
      if (property) {
        element.addClass(property);
      }
    }
  }

  get fileName() {
    return this.filePath.substring(
      this.filePath.lastIndexOf('/') + 1, this.filePath.lastIndexOf('.')
    );
  }

  get fileNameAndExtension() {
    return this.filePath.substring(this.filePath.lastIndexOf('/') + 1, this.filePath.length);
  }

  get fileType() {
    return this.filePath.substring(
      this.filePath.lastIndexOf('.') +1, this.filePath.length
    );
  }

  get fileRef() {
    var fileRef;
    if (this.fileType == "js"){ //if filename is a external JavaScript file
      fileRef = document.createElement('script');
      fileRef.setAttribute("type","text/javascript");
      fileRef.setAttribute("src", this.filePath);
    }
    else if (this.fileType == "css"){ //if filename is an external CSS file
      fileRef = document.createElement("link");
      fileRef.setAttribute("rel", "stylesheet");
      fileRef.setAttribute("type", "text/css");
      fileRef.setAttribute("href", this.filePath);
    }
    fileRef.setAttribute("id",this.unID);

    return fileRef;
  }

  get HTMLContent() {
    var moduleName = this.fileName;
    return  `<div class="widg" id="${moduleName}">
        <div class="button" id="${moduleName}-button">
          <i id="${moduleName}-icon"></i>
        </div>
        <span class="output" id="${moduleName}-output"> ... </span>
        <div class="popup" id="${moduleName}-popup">
        </div>
      </div>`;
  }

  loadIn() {
    console.log(`Loading module '${this.fileNameAndExtension}'`);
    document.head.appendChild(this.fileRef);
    this.isLoaded = true;
  }

  injectHTMLIn() {
    document.getElementById(this.container).appendChild(this.node);
  }

  update() {
    //  This must be overwritten by extensors
  }

  start() {
    var _this = this;
    this.update();
    this.intervalID = setInterval(() => { _this.update(); }, this.refreshRate);
  }

  execPopupCommand(button) {
    exec(`${ this.command } ${ button.getAttribute('value') }`);
  }

  setPopupListeners() {
    var _this = this;

    $(`#${this.fileName}-button`).on("click", () => {
      _this.togglePopupStatus();
    });

    $(`.${this.fileName}-button`).on("click", function() {
      _this.execPopupCommand(this);
      _this.togglePopupStatus();
    });
  }

  togglePopupStatus() {
    $(`#${this.fileName}-popup`).toggleClass("open");
    $(`#${this.fileName}-button`).toggleClass("pinned");
  }

  stop() {
    clearInterval(this.intervalID);
  }

  unload() {
    this.stop();
    this.node.remove();
    this.isLoaded = false;
  }

}

exports.ExternalModule = ExternalModule;
