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

  /****************************************
  END
  ****************************************/
  'END': function() {
    let jovo_state = this;
    jovo_state.tell(jovo_state.t('THANKS_FOR_PLAYING'));
  },

  /****************************************
  HELP INTENT
  ****************************************/
  'HelpIntent': function() {
  },

  /****************************************
  LAUNCH
  ****************************************/
  'LAUNCH': function() {
    this.toIntent('WelcomeIntent');
  },

  /****************************************
  ON GAME ENGINE INPUT HANDLER EVENT
  ****************************************/
  'ON_GAME_ENGINE_INPUT_HANDLER_EVENT': function () {
  },

  /****************************************
  WELCOME INTENT
  ****************************************/
  'WelcomeIntent': function() {
  },

});

module.exports.app = app;
