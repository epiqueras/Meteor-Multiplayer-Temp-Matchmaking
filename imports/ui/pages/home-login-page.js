/* global window */
/* global document */
/* eslint-disable import/no-extraneous-dependencies */
import { Template } from 'meteor/templating';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { Accounts } from 'meteor/accounts-base';
import { $ } from 'meteor/jquery';
import { Random } from 'meteor/random';
import { Leaderboard } from '../../api/lobbies/lobbies.js';

BlazeLayout.setRoot('body');

import './home-login-page.html'; // eslint-disable-line import/imports-first

import '../layouts/game-layout.js'; // eslint-disable-line import/imports-first
import './game-page.js'; // eslint-disable-line import/imports-first

// Template.Home_login_page.onCreated(function onTemplateCreation() {
// });

Template.Home_login_page.onRendered(() => {
  // UI Validation
  $('.js-register-form').form({
    fields: {
      username: {
        identifier: 'username',
        rules: [
          {
            type: 'empty',
            prompt: 'Please enter a name.',
          },
        ],
      },
    },
    on: 'blur',
  });

  $('html, body').animate({ scrollTop: $(document).height() - $(window).height() }, 500);
});

Template.Home_login_page.helpers({
  scores() {
    return Leaderboard.find({});
  },
});

Template.Home_login_page.events({
  'submit .js-register-form': function onRegisteredFormSubmit(event) {
    event.preventDefault();

    // Get values from form element.
    const $form = $('.js-register-form');
    const username = $form.form('get value', 'username');
    const password = Random.secret();

    // Create account and render game if succesful.
    Accounts.createUser({ username, password }, (error) => {
      if (error) {
        const registerError = error.reason;
        if (error.error === 'too-many-requests') {
          return;
        }
        $('.js-register-form').form('add errors', [registerError]);
      } else {
        BlazeLayout.render('Game_layout', { main: 'Game_page' });
      }
    });
  },
});
