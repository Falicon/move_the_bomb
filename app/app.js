'use strict';

const us = require('./I18n/en-US');

const languageResources = {
  'en-US': us
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
  ANIMATE BUTTONS
  ****************************************/
  'AnimateButtons': function() {
    let jovo_state = this;

    let active_button = jovo_state.getSessionAttribute('active_button');
    let button_count = jovo_state.getSessionAttribute('button_count');
    let explode_button = jovo_state.getSessionAttribute('explode_button');
    let explosion_count = jovo_state.getSessionAttribute('explosion_count');
    let explosion_timeout = jovo_state.getSessionAttribute('explosion_timeout');
    let in_game = jovo_state.getSessionAttribute('in_game');
    let listen_for = jovo_state.getSessionAttribute('listen_for');
    let players = jovo_state.getSessionAttribute('players');
    let push_count = jovo_state.getSessionAttribute('push_count');

    let current_count = players.length;
    let speech = jovo_state.speechBuilder();
    let timeout = explosion_timeout;

    // available_buttons
    let available_buttons = [];
    for (var i = 0; i < players.length; i++) {
      if (!players[i]['exploded']) {
        available_buttons.push(players[i]['button_id']);
      }
    }

    let button_slot = 0;
    let chars = ["0","1","2","3","4","5","6","7","8","9","A","B","C","D","E","F"];
    let color = "";
    let sequence_set = [];

    // determine how many flashes we'll do in this animation
    let loop_count = Math.floor(Math.random() * (10 - 0) + 0);

    // cycle through the buttons and flash each one a color and then off
    for (var i = 0; i < loop_count; i++) {
      color = '00';
      for (var j = 0; j < 4; j++) {
        let char_slot = Math.floor(Math.random() * (chars.length - 0) + 0);
        color += chars[char_slot];
      }
      // pick a color to flash
      sequence_set.push(jovo_state.alexaSkill().gadgetController().getSequenceBuilder().duration(2).color(color));
    }

    // button we end on should be turned red and activated
    button_slot = Math.floor(Math.random() * (available_buttons.length - 0) + 0);

    // turn it red
    sequence_set.push(jovo_state.alexaSkill().gadgetController().getSequenceBuilder().duration(2).color('FF0000'));

    if (explode_button == active_button || explosion_count == push_count) {
      // explode this button!
      for (var i = 0; i < players.length; i++) {
        if (players[i]['button_id'] == active_button) {
          players[i]['exploded'] = true;
        }
      }
      jovo_state.setSessionAttribute('players', players);

      // TODO play explosion sound (and animation)
      speech.addText('BOOM!');

      // determine if the round is over or should continue
      let players_left = 0;
      for (var i = 0; i < players.length; i++) {
        if (!players[i]['exploded']) {
          players_left++;
        }
      }

      if (players_left > 1) {
        // move the bomb
        jovo_state.toIntent('AnimateButtons');

      } else {
        // round is complete!
        let winner = '';
        for (var i = 0; i < players.length; i++) {
          if (!players[i]['exploded']) {
            winner = i;
          }
        }

        // play a winner animation!
        sequence_set.push(jovo_state.alexaSkill().gadgetController().getSequenceBuilder().duration(2).color('000000'));
        sequence_set.push(jovo_state.alexaSkill().gadgetController().getSequenceBuilder().duration(2).color('00FF00'));
        sequence_set.push(jovo_state.alexaSkill().gadgetController().getSequenceBuilder().duration(2).color('00FFFF'));

        buttons_list.push(players[winner]['button_id']);

        // TODO flash the buttons using sequence set

        speech.addText(jovo_state.t('WINNER', {'player_name':players[winner]['player_name']})).addBreak('100ms');
        speech.addText(jovo_state.t('ANOTHER_ROUND'));

        jovo_state.setSessionAttribute('listen_for', 'continue_game');

        jovo_state.ask(speech, speech);

      }

    } else {
      // activate the button
      jovo_state.setSessionAttribute('active_button', available_buttons[button_slot]);

      // TODO update sound effect
      speech.addText('tick tick tick');

      // TODO flash the buttons using sequence set

      let pattern = {'action':'down', 'gadgetIds':[available_buttons[button_slot]]};
      let buttonDownRecognizer = jovo_state.alexaSkill().gameEngine().getPatternRecognizerBuilder('buttonDownRecognizer').anchorEnd().fuzzy(false).pattern([pattern]);
      let buttonDownEvent = jovo_state.alexaSkill().gameEngine().getEventsBuilder('buttonDownEvent').meets(['buttonDownRecognizer']).reportsMatches().shouldEndInputHandler(true).build();
      let timeoutEvent = this.alexaSkill().gameEngine().getEventsBuilder('timeoutEvent').meets(['timed out']).reportsNothing().shouldEndInputHandler(true).build();
      jovo_state.alexaSkill().gameEngine().setEvents([buttonDownEvent, timeoutEvent]).setRecognizers([buttonDownRecognizer]).startInputHandler(timeout);
      jovo_state.alexaSkill().gameEngine().respond(speech);

    }

  },

  /****************************************
  ANSWER INTENT
  ****************************************/
  'AnswerIntent': function(questionResponse) {
    let jovo_state = this;
    let question_response = questionResponse.value;

    let active_button = jovo_state.getSessionAttribute('active_button');
    let button_count = jovo_state.getSessionAttribute('button_count');
    let explode_button = jovo_state.getSessionAttribute('explode_button');
    let explosion_count = jovo_state.getSessionAttribute('explosion_count');
    let explosion_timeout = jovo_state.getSessionAttribute('explosion_timeout');
    let in_game = jovo_state.getSessionAttribute('in_game');
    let listen_for = jovo_state.getSessionAttribute('listen_for');
    let players = jovo_state.getSessionAttribute('players');
    let push_count = jovo_state.getSessionAttribute('push_count');

    let current_count = players.length;
    let speech = jovo_state.speechBuilder();
    let timeout = 30000;

    if (listen_for == 'button_count') {
      /********************************
      GET THE NUMBER OF BUTTONS WE SHOULD SET UP
      ********************************/
      // ensure that user gave a number (ideally between 2 and 4)

      try {
        question_response = parseInt(question_response);
        if (isNaN(question_response)) {
          question_response = 0;
        }
      } catch (ex) {
        question_response = 0;
      }

      if (question_response < 2) {
        jovo_state.ask(jovo_state.t('TWO_REQUIRED'), jovo_state.t('TWO_REQUIRED_REPEAT'));

      } else {
        // ask the users to push a button and provide a name;

        jovo_state.setSessionAttribute('button_count', question_response);

        speech.addText(jovo_state.t('SETUP_BUTTON_COUNT', {button_count: question_response}));

        // start listening for a single button push event
        let pattern = {'action':'down'};
        let buttonDownRecognizer = jovo_state.alexaSkill().gameEngine().getPatternRecognizerBuilder('buttonDownRecognizer').anchorEnd().fuzzy(false).pattern([pattern]);
        let buttonDownEvent = jovo_state.alexaSkill().gameEngine().getEventsBuilder('buttonDownEvent').meets(['buttonDownRecognizer']).reportsMatches().shouldEndInputHandler(true).build();
        let timeoutEvent = this.alexaSkill().gameEngine().getEventsBuilder('timeoutEvent').meets(['timed out']).reportsNothing().shouldEndInputHandler(true).build();
        jovo_state.alexaSkill().gameEngine().setEvents([buttonDownEvent, timeoutEvent]).setRecognizers([buttonDownRecognizer]).startInputHandler(timeout);
        jovo_state.alexaSkill().gameEngine().respond(speech);

      }

    } else if (listen_for == 'continue_game') {
      /********************************
      EITHER MOVE TO THE NEXT ROUND OR END THE GAME
      ********************************/
      let continue_round = true;
      if (question_response.indexOf('no') > -1 || question_response.indexOf('stop') > -1 || question_response.indexOf('quit') > -1) {
        continue_round = false;

      }

      // if not yes or no, re-ask about playing another round?
      if (question_response.indexOf('no') == -1 && question_response.indexOf('yes') == -1 && question_response.indexOf('continue') == -1 && question_response.indexOf('quit') == -1) {
        // not sure what they actually wanted, so repeat the continue_round question
        jovo_state.ask(jovo_state.t('SORRY_CONTINUE'));

      } else {
        if (continue_round) {
          // start the next round

          // re-activate all the buttons
          for (var i = 0; i < players.length; i++) {
            players[i]['exploded'] = false;
          }
          jovo_state.setSessionAttribute('players', players);

          // Start the next round
          speech.addText(jovo_state.t('NEXT_ROUND'));

          // reset the push_count
          jovo_state.setSessionAttribute('push_count', 0);

          // reset the explode button
          jovo_state.setSessionAttribute('explode_button', 0);

          // set the explosion count (somewhere between 3 and 12)
          explosion_count = Math.floor(Math.random() * (13 - 3) + 3);
          jovo_state.setSessionAttribute('explosion_count', explosion_count);

          // set the explosion time out
          explosion_timeout = Math.floor(Math.random() * (10000 - 3000) + 3000);
          jovo_state.setSessionAttribute('explosion_timeout', explosion_timeout);

          // start the animation
          jovo_state.toIntent('AnimateButtons');

        } else {
          // END THE GAME
          this.toIntent('END');

        }

      }

    }

  },

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
    let jovo_state = this;
    let listen_for = jovo_state.getSessionAttribute('listen_for');

    let reprompt = jovo_state.speechBuilder();
    let speech = jovo_state.speechBuilder();

    // basic game instructions
    speech.addText(jovo_state.t('GAME_DETAIL'));

    if (listen_for == 'button_count') {
      speech.addBreak('100ms').addText(jovo_state.t('HOW_MANY_PLAYERS'));
      reprompt.addText(jovo_state.t('HOW_MANY_PLAYERS'));
      jovo_state.ask(speech, reprompt);

    } else {
      // ask about starting a new round
      speech.addBreak('100ms').addText(jovo_state.t('ANOTHER_ROUND'));
      reprompt.addText(jovo_state.t('ANOTHER_ROUND'));

      jovo_state.setSessionAttribute('listen_for', 'continue_round');
      jovo_state.ask(speech, reprompt);

    }

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
    let jovo_state = this;

    let active_button = jovo_state.getSessionAttribute('active_button');
    let button_count = jovo_state.getSessionAttribute('button_count');
    let explode_button = jovo_state.getSessionAttribute('explode_button');
    let explosion_count = jovo_state.getSessionAttribute('explosion_count');
    let explosion_timeout = jovo_state.getSessionAttribute('explosion_timeout');
    let in_game = jovo_state.getSessionAttribute('in_game');
    let listen_for = jovo_state.getSessionAttribute('listen_for');
    let players = jovo_state.getSessionAttribute('players');
    let push_count = jovo_state.getSessionAttribute('push_count');

    let current_count = players.length;
    let speech = jovo_state.speechBuilder();
    let timeout = 45000;

    let input_event = jovo_state.request().getEvents()[0];
    let input_event_name = input_event.name;

    if (input_event_name == 'timeoutEvent') {
      /********************************
      DEAL WITH BUTTON TIME OUT
      ********************************/
      // explode the active button
      jovo_state.setSessionAttribute('explode_button', active_button);

      jovo_state.toIntent('AnimateButtons');

    } else if (input_event_name == 'buttonDownEvent') {
      /********************************
      DEAL WITH BUTTON CLICK
      ********************************/
      // user pushed a button; so register it (if need be)
      let button_id = input_event.inputEvents[0].gadgetId;
      let known_button = false;

      for (var i = 0; i < players.length; i++) {
        if (players[i]['button_id'] == button_id) {
          known_button = true;
        }
      }

      if (!known_button) {
        /********************************
        UNKNOWN BUTTON - ATTEMPT TO REGISTER
        ********************************/
        // seems to be the first time we are seeing this button; let's try to set it up
        current_count += 1;
        players.push({
          'button_id': button_id,
          'exploded': false,
          'player_id': current_count,
          'player_name': 'Player ' + current_count
        });

        // save the updated player details to our session
        jovo_state.setSessionAttribute('listen_for', 'set_up');
        jovo_state.setSessionAttribute('players', players);

        if (current_count == button_count) {
          // we're ready to start the first round
          jovo_state.setSessionAttribute('in_game', true);

          // explain the details of the game
          speech.addText(jovo_state.t('GAME_DETAIL'));

          // set the explosion count (somewhere between 3 and 12)
          explosion_count = Math.floor(Math.random() * (13 - 3) + 3);
          jovo_state.setSessionAttribute('explosion_count', explosion_count);

          // set the explosion time out
          explosion_timeout = Math.floor(Math.random() * (45000 - 20000) + 20000);
          jovo_state.setSessionAttribute('explosion_timeout', explosion_timeout);

          // start the animation
          jovo_state.toIntent('AnimateButtons');

        } else {
          // need to set up more buttons
          speech.addText(jovo_state.t('PLAYER_PRESS_BUTTON', {player_name: 'Player ' + (current_count + 1)}));

          // enable the next input handler
          let pattern = {'action':'down'};
          let buttonDownRecognizer = jovo_state.alexaSkill().gameEngine().getPatternRecognizerBuilder('buttonDownRecognizer').anchorEnd().fuzzy(false).pattern([pattern]);
          let buttonDownEvent = jovo_state.alexaSkill().gameEngine().getEventsBuilder('buttonDownEvent').meets(['buttonDownRecognizer']).reportsMatches().shouldEndInputHandler(true).build();
          let timeoutEvent = this.alexaSkill().gameEngine().getEventsBuilder('timeoutEvent').meets(['timed out']).reportsNothing().shouldEndInputHandler(true).build();
          jovo_state.alexaSkill().gameEngine().setEvents([buttonDownEvent, timeoutEvent]).setRecognizers([buttonDownRecognizer]).startInputHandler(timeout);
          jovo_state.alexaSkill().gameEngine().respond(speech);

        }

      } else {
        /********************************
        KNOWN BUTTON
        ********************************/
        if (in_game) {
          /********************************
          IN GAME
          ********************************/
          // increment the push_count
          push_count++;
          jovo_state.setSessionAttribute('push_count', push_count);

          // move the bomb
          jovo_state.toIntent('AnimateButtons');

        } else {
          /********************************
          BUTTON ALREADY ASSIGNED
          ********************************/
          jovo_state.setSessionAttribute('music_slot', music_slot);

          speech.addText(jovo_state.t('ALREADY_REGISTERED'));

          let pattern = {'action':'down'};
          let buttonDownRecognizer = jovo_state.alexaSkill().gameEngine().getPatternRecognizerBuilder('buttonDownRecognizer').anchorEnd().fuzzy(false).pattern([pattern]);
          let buttonDownEvent = jovo_state.alexaSkill().gameEngine().getEventsBuilder('buttonDownEvent').meets(['buttonDownRecognizer']).reportsMatches().shouldEndInputHandler(true).build();
          let timeoutEvent = this.alexaSkill().gameEngine().getEventsBuilder('timeoutEvent').meets(['timed out']).reportsNothing().shouldEndInputHandler(true).build();
          jovo_state.alexaSkill().gameEngine().setEvents([buttonDownEvent, timeoutEvent]).setRecognizers([buttonDownRecognizer]).startInputHandler(timeout);
          jovo_state.alexaSkill().gameEngine().respond(speech);

        }
      }
    }

  },

  /****************************************
  WELCOME INTENT
  ****************************************/
  'WelcomeIntent': function() {
    let jovo_state = this;

    jovo_state.setSessionAttribute('active_button', 'xyz');
    jovo_state.setSessionAttribute('button_count', 0);
    jovo_state.setSessionAttribute('explode_button', 0);
    jovo_state.setSessionAttribute('explosion_count', 0);
    jovo_state.setSessionAttribute('explosion_timeout', 0);
    jovo_state.setSessionAttribute('in_game', false);
    jovo_state.setSessionAttribute('listen_for', 'button_count');
    jovo_state.setSessionAttribute('players', []);
    jovo_state.setSessionAttribute('push_count', 0);

    // Welcome players; ask how many buttons
    jovo_state.ask(jovo_state.t('WELCOME'), jovo_state.t('WELCOME_REPEAT'));

  },

});

module.exports.app = app;
