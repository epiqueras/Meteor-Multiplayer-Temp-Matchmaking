/* eslint-disable import/no-extraneous-dependencies */
import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

import { removeCurrentAccount } from '../../api/methods.js';

// Import layouts
import '../../ui/layouts/home-layout.js';
import '../../ui/layouts/game-layout.js';

// Import pages
import '../../ui/pages/home-login-page.js';
import '../../ui/pages/game-page.js';

// Redirects user to login page if he tries to access the game without logging in.
FlowRouter.triggers.enter([function redirectIfLoggedOut() {
  if (!Meteor.userId()) {
    FlowRouter.go('Home.login');
  }
}]);

FlowRouter.route('/', {
  name: 'Home.login',
  // Remove current account and log out user for temporary account functionality.
  triggersEnter: [() => { removeCurrentAccount.call({}); Meteor.logout(); }],
  action() {
    BlazeLayout.render('Home_layout', { main: 'Home_login_page' });
  },
});
