/* eslint-disable import/no-extraneous-dependencies */
import { Template } from 'meteor/templating';

import './home-layout.html';

Template.Home_layout.onCreated(function appBodyOnCreated() {
  this.subscribe('leaderboard');
});
