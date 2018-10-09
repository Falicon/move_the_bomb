'use strict';

/***********************************
Potential TODO:

Skip the "how many buttons" bit and just ask players to push the buttons they want to play with
  - just have timeout window that knows when we're ready?
  - detect second button click to know complete?

***********************************/

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

let clock_sounds = [
  'https://s3.amazonaws.com/coachwizard/light_cycle_converted.mp3',
  'https://s3.amazonaws.com/coachwizard/exoplanet_converted.mp3',
  'https://s3.amazonaws.com/coachwizard/sequence_bass_converted.mp3',
  'https://s3.amazonaws.com/coachwizard/liverpool_converted.mp3',
  'https://s3.amazonaws.com/coachwizard/muted_converted.mp3',
  'https://s3.amazonaws.com/coachwizard/p-bass_converted.mp3',
  'https://s3.amazonaws.com/coachwizard/picked_converted.mp3',
  'https://s3.amazonaws.com/coachwizard/retro_bass_converted.mp3',
];

let error_sounds = [
  'https://s3.amazonaws.com/coachwizard/error_one_converted.mp3',
  'https://s3.amazonaws.com/coachwizard/error_two_converted.mp3',
  'https://s3.amazonaws.com/coachwizard/error_three_converted.mp3',
  'https://s3.amazonaws.com/coachwizard/error_four_converted.mp3'
];

let explosion_sounds = [
  'https://s3.amazonaws.com/coachwizard/explosion_one_converted.mp3',
  'https://s3.amazonaws.com/coachwizard/explosion_two_converted.mp3',
  'https://s3.amazonaws.com/coachwizard/explosion_three_converted.mp3',
  'https://s3.amazonaws.com/coachwizard/explosion_four_converted.mp3',
  'https://s3.amazonaws.com/coachwizard/explosion_five_converted.mp3',
  'https://s3.amazonaws.com/coachwizard/explosion_six_converted.mp3',
  'https://s3.amazonaws.com/coachwizard/explosion_seven_converted.mp3',
  'https://s3.amazonaws.com/coachwizard/explosion_eight_converted.mp3',
  'https://s3.amazonaws.com/coachwizard/explosion_nine_converted.mp3',
  'https://s3.amazonaws.com/coachwizard/explosion_ten_converted.mp3',
  'https://s3.amazonaws.com/coachwizard/explosion_eleven_converted.mp3',
  'https://s3.amazonaws.com/coachwizard/explosion_twelve_converted.mp3',
  'https://s3.amazonaws.com/coachwizard/explosion_thirteen_converted.mp3',
  'https://s3.amazonaws.com/coachwizard/explosion_fourteen_converted.mp3',
  'https://s3.amazonaws.com/coachwizard/explosion_fifteen_converted.mp3',
  'https://s3.amazonaws.com/coachwizard/explosion_sixteen_converted.mp3',
  'https://s3.amazonaws.com/coachwizard/explosion_seventeen_converted.mp3'
];

/****************************************
PARSE FOR GERMAN NUMBERS
****************************************/
function parse_for_german_numbers(raw_text) {
  var parsed_val = raw_text;
  if (raw_text.indexOf('eins') > -1) { parsed_val = 1; }
  else if (raw_text.indexOf('zwei') > -1) { parsed_val = 2; }
  else if (raw_text.indexOf('drei') > -1) { parsed_val = 3; }
  else if (raw_text.indexOf('vier') > -1) { parsed_val = 4; }
  else if (raw_text.indexOf('fünf') > -1) { parsed_val = 5; }
  else if (raw_text.indexOf('sechs') > -1) { parsed_val = 6; }
  else if (raw_text.indexOf('sieben') > -1) { parsed_val = 7; }
  else if (raw_text.indexOf('acht') > -1) { parsed_val = 8; }
  else if (raw_text.indexOf('neun') > -1) { parsed_val = 9; }
  else if (raw_text.indexOf('zehn') > -1) { parsed_val = 10; }
  else if (raw_text.indexOf('elf') > -1) { parsed_val = 11; }
  else if (raw_text.indexOf('zwölf') > -1) { parsed_val = 12; }
  else if (raw_text.indexOf('dreizehn') > -1) { parsed_val = 13; }
  else if (raw_text.indexOf('vierzehn') > -1) { parsed_val = 14; }
  else if (raw_text.indexOf('fünfzehn') > -1) { parsed_val = 15; }
  else if (raw_text.indexOf('sechszehn') > -1) { parsed_val = 16; }
  else if (raw_text.indexOf('siebzehn') > -1) { parsed_val = 17; }
  else if (raw_text.indexOf('achtzehn') > -1) { parsed_val = 18; }
  else if (raw_text.indexOf('neunzehn') > -1) { parsed_val = 19; }
  else if (raw_text.indexOf('zwanzig') > -1) { parsed_val = 20; }
  return parsed_val;
}

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
    let repeat_count = jovo_state.getSessionAttribute('repeat_count');

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
    let sequence = [];

    // pick button we end on
    let end_on = Math.floor(Math.random() * (available_buttons.length - 0) + 0);

    if (push_count == 0) {
      // Let the players know we are starting
      speech.addText(jovo_state.t('START_ROUND'));

    }

    if (explode_button == active_button || explosion_count == push_count) {

      // explode this button!
      let eliminated_player = 0;
      for (var i = 0; i < players.length; i++) {
        if (players[i]['button_id'] == active_button) {
          players[i]['exploded'] = true;
          eliminated_player = i + 1;
          jovo_state.alexaSkill()
            .gadgetController()
            .setNoneTriggerEvent()
            .setAnimations([ { "repeat": 1, "targetLights":["1"], "sequence": [
              {'durationMs': 100, 'color': '000000', 'blend': false},
              {'durationMs': 200, 'color': 'FFA500', 'blend': false},
              {'durationMs': 100, 'color': '000000', 'blend': false},
              {'durationMs': 200, 'color': 'FFA500', 'blend': false},
              {'durationMs': 100, 'color': '000000', 'blend': false},
              {'durationMs': 200, 'color': 'FFA500', 'blend': false},
              {'durationMs': 200, 'color': '000000', 'blend': false},
            ] } ])
            .setLight([players[i]['button_id']], 0, []);
        }
      }
      jovo_state.setSessionAttribute('players', players);

      // play explosion sound (and animation)
      let explosion_slot = Math.floor(Math.random() * (explosion_sounds.length - 0) + 0);
      speech.addAudio(explosion_sounds[explosion_slot]);
      speech.addText(jovo_state.t('PLAYER_ELIMINATED', {'player_name': 'player ' + eliminated_player}));

      // determine if the round is over or should continue
      let players_left = 0;
      for (var i = 0; i < players.length; i++) {
        if (!players[i]['exploded']) {
          players_left++;
        }
      }

      if (players_left > 1) {
        // move the bomb for the remaining buttons

        // reset the push count (for the remaining players)
        jovo_state.setSessionAttribute('push_count', 0);

        // remove the exploded button from the available players
        available_buttons = [];
        for (var i = 0; i < players.length; i++) {
          if (!players[i]['exploded']) {
            available_buttons.push(players[i]['button_id']);
            // also reset each active button back to off
            jovo_state.alexaSkill()
              .gadgetController()
              .setNoneTriggerEvent()
              .setAnimations([ { "repeat": 1, "targetLights":["1"], "sequence": [{'durationMs': 100, 'color': '000000', 'blend': false}] } ])
              .setLight([players[i]['button_id']], 0, []);
          }
        }

        // pick button we end on
        let end_on = Math.floor(Math.random() * (available_buttons.length - 0) + 0);

        let animations = {};

        // determine how many flashes we'll do in this animation
        let loop_count = Math.floor(Math.random() * (10 - 2) + 2);

        let last_button = 0;
        for (var i = 0; i < loop_count; i++) {
          color = '00';
          for (var j = 0; j < 4; j++) {
            let char_slot = Math.floor(Math.random() * (chars.length - 0) + 0);
            color += chars[char_slot];

          }

          let flash_duration = Math.floor(Math.random() * (1000 - 250) + 250);

          sequence = [];
          if (i == loop_count - 1) {
            // turn the button we end on red
            sequence.push({'durationMs': flash_duration, 'color': '000000', 'blend': false});
            sequence.push({'durationMs': 5000, 'color': 'FF0000', 'blend': false});

          } else {
            // otherwise flash the button a random color
            sequence.push({'durationMs': flash_duration, 'color': color, 'blend': false});
            sequence.push({'durationMs': 100, 'color': '000000', 'blend': false});

          }

          // cycle to the next button we should flash
          button_slot++;
          if (button_slot > (available_buttons.length - 1)) {
            button_slot = 0;
          }

          if (available_buttons[button_slot] in animations) {
            // just append this sequence
            animations[available_buttons[button_slot]] = animations[available_buttons[button_slot]].concat(sequence);

          } else {
            // start this sequence
            animations[available_buttons[button_slot]] = sequence;

          }

          end_on = button_slot;

        }

        // actually flash the buttons
        var button_ids = Object.keys(animations);
        for (var i = 0; i < button_ids.length; i++) {
          // flash the button
          jovo_state.alexaSkill()
            .gadgetController()
            .setNoneTriggerEvent()
            .setAnimations([ { "repeat": 1, "targetLights":["1"], "sequence": animations[button_ids[i]] } ])
            .setLight([button_ids[i]], 0, []);
        }

        // keep track of the active_button the button
        jovo_state.setSessionAttribute('active_button', available_buttons[end_on]);

        // update sound effect
        let clock_slot = Math.floor(Math.random() * (clock_sounds.length - 0) + 0);
        speech.addAudio(clock_sounds[clock_slot]).addBreak('100ms');

        // start listening for (the correct) button push
        // let pattern = {'action':'down', 'gadgetIds':[available_buttons[end_on]]};
        let pattern = {'action':'down'};
        let buttonDownRecognizer = jovo_state.alexaSkill().gameEngine().getPatternRecognizerBuilder('buttonDownRecognizer').anchorEnd().fuzzy(false).pattern([pattern]);
        let buttonDownEvent = jovo_state.alexaSkill().gameEngine().getEventsBuilder('buttonDownEvent').meets(['buttonDownRecognizer']).reportsMatches().shouldEndInputHandler(true).build();
        let timeoutEvent = this.alexaSkill().gameEngine().getEventsBuilder('timeoutEvent').meets(['timed out']).reportsNothing().shouldEndInputHandler(true).build();
        jovo_state.alexaSkill().gameEngine().setEvents([buttonDownEvent, timeoutEvent]).setRecognizers([buttonDownRecognizer]).startInputHandler(timeout);
        jovo_state.alexaSkill().gameEngine().respond(speech);

      } else {
        // round is complete!
        let winner = '';
        for (var i = 0; i < players.length; i++) {
          if (!players[i]['exploded']) {
            winner = i;
          }
        }

        // determine how many flashes we'll do in this animation
        let loop_count = Math.floor(Math.random() * (10 - 2) + 2);

        sequence = [];
        for (var i = 0; i < loop_count; i++) {
          color = '00';
          for (var j = 0; j < 4; j++) {
            let char_slot = Math.floor(Math.random() * (chars.length - 0) + 0);
            color += chars[char_slot];

          }

          let flash_duration = Math.floor(Math.random() * (1000 - 250) + 250);

          sequence.push({'durationMs': flash_duration, 'color': color, 'blend': false});
          sequence.push({'durationMs': 100, 'color': '000000', 'blend': false});

        }

        // end on green as winning color
        sequence.push({'durationMs': 100, 'color': '00FF00', 'blend': true});

        // play a winner animation!
        jovo_state.alexaSkill()
          .gadgetController()
          .setNoneTriggerEvent()
          .setAnimations([ { "repeat": 1, "targetLights":["1"], "sequence": sequence } ])
          .setLight([players[winner]['button_id']], 0, []);

        speech.addText(jovo_state.t('WINNER', {'player_name':players[winner]['player_name']})).addBreak('100ms');

        speech.addText(jovo_state.t('ANOTHER_ROUND'));

        jovo_state.setSessionAttribute('listen_for', 'continue_game');

        jovo_state.ask(speech, speech);

      }

    } else {
      let animations = {};

      // determine how many flashes we'll do in this animation
      let loop_count = Math.floor(Math.random() * (10 - 2) + 2);

      let last_button = 0;
      for (var i = 0; i < loop_count; i++) {
        color = '00';
        for (var j = 0; j < 4; j++) {
          let char_slot = Math.floor(Math.random() * (chars.length - 0) + 0);
          color += chars[char_slot];

        }

        let flash_duration = Math.floor(Math.random() * (1000 - 250) + 250);

        sequence = [];
        if (i == loop_count - 1) {
          // turn the button we end on red
          sequence.push({'durationMs': flash_duration, 'color': '000000', 'blend': false});
          sequence.push({'durationMs': 5000, 'color': 'FF0000', 'blend': false});

        } else {
          // otherwise flash the button a random color
          sequence.push({'durationMs': flash_duration, 'color': color, 'blend': false});
          sequence.push({'durationMs': 100, 'color': '000000', 'blend': false});

        }

        // cycle to the next button we should flash
        button_slot++;
        if (button_slot > (available_buttons.length - 1)) {
          button_slot = 0;
        }

        if (available_buttons[button_slot] in animations) {
          // just append this sequence
          animations[available_buttons[button_slot]] = animations[available_buttons[button_slot]].concat(sequence);

        } else {
          // start this sequence
          animations[available_buttons[button_slot]] = sequence;

        }

        end_on = button_slot;

      }

      // actually flash the buttons
      var button_ids = Object.keys(animations);
      for (var i = 0; i < button_ids.length; i++) {
        // flash the button
        jovo_state.alexaSkill()
          .gadgetController()
          .setNoneTriggerEvent()
          .setAnimations([ { "repeat": 1, "targetLights":["1"], "sequence": animations[button_ids[i]] } ])
          .setLight([button_ids[i]], 0, []);
      }

      // keep track of the active_button the button
      jovo_state.setSessionAttribute('active_button', available_buttons[end_on]);

      let clock_slot = Math.floor(Math.random() * (clock_sounds.length - 0) + 0);
      speech.addAudio(clock_sounds[clock_slot]).addBreak('100ms');

      // start listening for (the correct) button push
      // let pattern = {'action':'down', 'gadgetIds':[available_buttons[end_on]]};
      let pattern = {'action':'down'};
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
    let repeat_count = jovo_state.getSessionAttribute('repeat_count');

    let current_count = players.length;
    let speech = jovo_state.speechBuilder();
    let timeout = 30000;

    if (listen_for == 'button_count') {
      /********************************
      GET THE NUMBER OF BUTTONS WE SHOULD SET UP
      ********************************/
      // ensure that user gave a number (ideally between 2 and 4)

      try {
        question_response = parseInt(parse_for_german_numbers(question_response));
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

        let clock_slot = Math.floor(Math.random() * (clock_sounds.length - 0) + 0);
        speech.addAudio(clock_sounds[clock_slot]).addBreak('100ms');

        // start listening for any button push event
        let pattern = {'action':'down'};
        let buttonDownRecognizer = jovo_state.alexaSkill().gameEngine().getPatternRecognizerBuilder('buttonDownRecognizer').anchorEnd().fuzzy(false).pattern([pattern]);
        let buttonDownEvent = jovo_state.alexaSkill().gameEngine().getEventsBuilder('buttonDownEvent').meets(['buttonDownRecognizer']).reportsMatches().shouldEndInputHandler(true).build();
        let timeoutEvent = this.alexaSkill().gameEngine().getEventsBuilder('timeoutEvent').meets(['timed out']).reportsNothing().shouldEndInputHandler(true).build();
        jovo_state.alexaSkill().gameEngine().setEvents([buttonDownEvent, timeoutEvent]).setRecognizers([buttonDownRecognizer]).startInputHandler(timeout);
        jovo_state.alexaSkill().gameEngine().respond(speech);

      }

    } else if (listen_for == 'start_game') {
      /********************************
      GET THE GAME STARTED
      ********************************/
      let start_game = false;
      if (
        question_response.indexOf('yes') > -1 ||
        question_response.indexOf('sure') > -1 ||
        question_response.indexOf('ok') > -1 ||
        question_response.indexOf('ja') > -1 ||
        question_response.indexOf('sicher') > -1
      ) {
        start_game = true;

      }

      if (!start_game) {
        // provide instructions on how to start the game;
        speech.addText(jovo_state.t('START_GAME_INSTRUCTIONS'));

        jovo_state.ask(speech, speech);

      } else {
        // set the explosion count (somewhere between 3 and 12)
        explosion_count = Math.floor(Math.random() * (13 - 3) + 3);
        jovo_state.setSessionAttribute('explosion_count', explosion_count);

        // set the explosion time out
        explosion_timeout = Math.floor(Math.random() * (45000 - 20000) + 20000);
        jovo_state.setSessionAttribute('explosion_timeout', explosion_timeout);

        // start the push_count
        jovo_state.setSessionAttribute('push_count', 0);

        // start the animation
        jovo_state.toIntent('AnimateButtons');

      }

    } else if (listen_for == 'continue_game') {
      /********************************
      EITHER MOVE TO THE NEXT ROUND OR END THE GAME
      ********************************/
      let continue_round = true;
      if (
        question_response.indexOf('no') > -1 || 
        question_response.indexOf('nein') > -1
      ) {
        continue_round = false;

      }

      // if not yes or no, re-ask about playing another round?
      if (
        question_response.indexOf('no') == -1 && 
        question_response.indexOf('yes') == -1 && 
        question_response.indexOf('ja') == -1 && 
        question_response.indexOf('nein') == -1
      ) {
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
    let repeat_count = jovo_state.getSessionAttribute('repeat_count');

    let current_count = players.length;
    let speech = jovo_state.speechBuilder();
    let timeout = 30000;

    let input_event = jovo_state.request().getEvents()[0];
    let input_event_name = input_event.name;

    if (input_event_name == 'timeoutEvent') {
      /********************************
      DEAL WITH BUTTON TIME OUT
      ********************************/
      if (in_game) {
        // explode the active button
        jovo_state.setSessionAttribute('explode_button', active_button);

        jovo_state.toIntent('AnimateButtons');

      } else {
        if (repeat_count > 1) {
          // we've already told them to push a button; time to end the game
          jovo_state.toIntent('END');

        } else {
          // explain that at least two buttons are required;
          repeat_count++;
          jovo_state.setSessionAttribute('repeat_count', repeat_count);

          speech.addText(jovo_state.t('PUSH_ANOTHER'));

          let clock_slot = Math.floor(Math.random() * (clock_sounds.length - 0) + 0);
          speech.addAudio(clock_sounds[clock_slot]).addBreak('100ms');

          let pattern = {'action':'down'};
          let buttonDownRecognizer = jovo_state.alexaSkill().gameEngine().getPatternRecognizerBuilder('buttonDownRecognizer').anchorEnd().fuzzy(false).pattern([pattern]);
          let buttonDownEvent = jovo_state.alexaSkill().gameEngine().getEventsBuilder('buttonDownEvent').meets(['buttonDownRecognizer']).reportsMatches().shouldEndInputHandler(true).build();
          let timeoutEvent = this.alexaSkill().gameEngine().getEventsBuilder('timeoutEvent').meets(['timed out']).reportsNothing().shouldEndInputHandler(true).build();
          jovo_state.alexaSkill().gameEngine().setEvents([buttonDownEvent, timeoutEvent]).setRecognizers([buttonDownRecognizer]).startInputHandler(timeout);
          jovo_state.alexaSkill().gameEngine().respond(speech);

        }

      }

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
          jovo_state.setSessionAttribute('listen_for', 'start_game');

          // explain the details of the game
          speech.addText(jovo_state.t('GAME_DETAIL'));
          speech.addText(jovo_state.t('START_GAME'));

          jovo_state.ask(speech, speech);

        } else {
          // need to set up more buttons
          speech.addText(jovo_state.t('PLAYER_PRESS_BUTTON', {player_name: 'Player ' + (current_count + 1)}));

          let clock_slot = Math.floor(Math.random() * (clock_sounds.length - 0) + 0);
          speech.addAudio(clock_sounds[clock_slot]).addBreak('100ms');

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

          // determine if the correct button was pushed (explode user if not?)
          if (button_id != active_button) {
            // deal with wrong butotn push
            jovo_state.setSessionAttribute('active_button', button_id);
            jovo_state.setSessionAttribute('explode_button', button_id);

            jovo_state.toIntent('AnimateButtons');

          } else {
            // increment the push_count
            push_count++;
            jovo_state.setSessionAttribute('push_count', push_count);

            // move the bomb
            jovo_state.toIntent('AnimateButtons');

          }

        } else {
          /********************************
          BUTTON ALREADY ASSIGNED
          ********************************/
          // play an error sound
          let error_slot = Math.floor(Math.random() * (error_sounds.length - 0) + 0);
          speech.addAudio(error_sounds[error_slot]).addBreak('100ms');

          speech.addText(jovo_state.t('ALREADY_REGISTERED'));

          let clock_slot = Math.floor(Math.random() * (clock_sounds.length - 0) + 0);
          speech.addAudio(clock_sounds[clock_slot]).addBreak('100ms');

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
    jovo_state.setSessionAttribute('repeat_count', 0);
    jovo_state.setSessionAttribute('say_something', '');

    // Welcome players; ask how many buttons
    jovo_state.ask(jovo_state.t('WELCOME'), jovo_state.t('WELCOME_REPEAT'));

  },

});

module.exports.app = app;
