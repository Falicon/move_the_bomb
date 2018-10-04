'use strict';

const de = require('./I18n/de-DE');
const us = require('./I18n/en-US');

const languageResources = {
  'en-US': us,
  'de-DE': de
}

const {App} = require('jovo-framework');
const config = {
  logging: false,
  i18n: {
    resources: languageResources,
    fallbackLng: 'en-US'
  },
  intentMap: {
    'AMAZON.FallbackIntent': 'AnswerIntent',
    'AMAZON.CancelIntent': 'END',
    'AMAZON.HelpIntent': 'HelpIntent',
    'AMAZON.StopIntent': 'END',
    'AMAZON.NavigateHomeIntent': 'END'
  }
};
const app = new App(config);

app.setHandler({

  'LAUNCH': function() {
    this.toIntent('HelloWorldIntent');
  },

  'HelloWorldIntent': function() {
    this.ask('Hello World! What\'s your name?', 'Please tell me your name.');
  },

  'MyNameIsIntent': function(name) {
    this.tell('Hey ' + name.value + ', nice to meet you!');
  },

});

module.exports.app = app;
