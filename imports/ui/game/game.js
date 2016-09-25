/* global p5 */
/* global window */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-param-reassign */
/* eslint-disable one-var-declaration-per-line */
/* eslint-disable one-var */
/* eslint-disable quotes */
/* eslint-disable quote-props */
/* eslint-disable consistent-return */
/* eslint-disable default-case */
/* eslint-disable func-names */
/* eslint-disable no-shadow */
/* eslint-disable comma-dangle */
/* eslint-disable prefer-arrow-callback */
/* eslint-disable space-before-function-paren */
/* eslint-disable no-eval */
/* eslint-disable prefer-template */
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { Streamy } from 'meteor/yuukan:streamy';
import { $ } from 'meteor/jquery';

import { removeCurrentAccount } from '../../api/methods.js';
import { recordScore } from '../../api/lobbies/methods.js';

import './game.html';

let myScore;

// TODO: send all positions on turns and collision.

const gameToRender = function createSketch(game) { // eslint-disable-line
  let myLobby = false;
  let myFrameCounter = 0;
  // Global game constants.
  const mapWidth = 300;
  const mapHeight = 300;
  const viewWidth = 350;
  // const normalSpeed = 5;
  const normalSpeed = 3;
  const boostedSpeed = 4;
  const brakeSpeed = 2;
  const dakWidth = 10;
  const dakHeight = 10;
  // const normalDakScale = 1;
  const destroyedDakScale = 2;
  const dakTailLength = 100;
  const dakrandomGradientRange = 11;

  // Global variables.
  const otherDakSocketIds = [];
  let dakNormalAnimation, dakDestroyedSpriteSheet, dakDestroyedAnimation, myDak, gameStartSound,
    gameOverSound, playerJoinedSound, collisionSpriteGroup;

  // JSON for the dak destroyed animation sprite sheet frames.
  const dakDestroyedFrames = [
    { "name": "dakDestroyedFrame1", "frame": { "x": 0, "y": 0, "width": 10, "height": 10 } },
    { "name": "dakDestroyedFrame2", "frame": { "x": 10, "y": 0, "width": 10, "height": 10 } },
    { "name": "dakDestroyedFrame3", "frame": { "x": 20, "y": 0, "width": 10, "height": 10 } },
    { "name": "dakDestroyedFrame4", "frame": { "x": 0, "y": 10, "width": 10, "height": 10 } },
    { "name": "dakDestroyedFrame5", "frame": { "x": 10, "y": 10, "width": 10, "height": 10 } },
    { "name": "dakDestroyedFrame6", "frame": { "x": 20, "y": 10, "width": 10, "height": 10 } },
    { "name": "dakDestroyedFrame7", "frame": { "x": 0, "y": 20, "width": 10, "height": 10 } },
    { "name": "dakDestroyedFrame8", "frame": { "x": 10, "y": 20, "width": 10, "height": 10 } },
    { "name": "dakDestroyedFrame9", "frame": { "x": 20, "y": 20, "width": 10, "height": 10 } },
    { "name": "dakDestroyedFrame10", "frame": { "x": 0, "y": 30, "width": 10, "height": 10 } },
    { "name": "dakDestroyedFrame11", "frame": { "x": 10, "y": 30, "width": 10, "height": 10 } },
    { "name": "dakDestroyedFrame12", "frame": { "x": 20, "y": 30, "width": 10, "height": 10 } }
  ];

  // Utility functions.

  // Returns a random x coordinate inside the stage with a 25px margin.
  function randomXOrigin() {
    return game.floor(game.random(25, mapWidth - 24));
  }

  // Returns a random y coordinate inside the stage with a 25px margin.
  function randomYOrigin() {
    return game.floor(game.random(25, mapHeight - 24));
  }

  // Returns top, right, down, or left in degrees.
  function randomAngle() {
    const randomInteger = game.floor(game.random(4));
    switch (randomInteger) {
      case 0:
        return 0;
      case 1:
        return -90;
      case 2:
        return 180;
      case 3:
        return 90;
    }
  }

  // Calculates desired direction based on key input and current direction.
  function calculateNewDirection(keyPressedIs, theCurrentDirection) {
    if (keyPressedIs === "left") {
      switch (theCurrentDirection) {
        case -90:
          return 180;
        case 0:
          return -90;
        case 90:
          return 0;
        case 180:
          return 90;
      }
    } else {
      switch (theCurrentDirection) {
        case -90:
          return 0;
        case 0:
          return 90;
        case 90:
          return 180;
        case 180:
          return -90;
      }
    }
  }

  // Dak factory function.
  function createDak(x, y, angle, dakName) {
    const dak = {};
    dak.randomR = game.floor(game.random(256));
    dak.randomG = game.floor(game.random(256));
    dak.randomB = game.floor(game.random(256));
    let randomColor;
    dak.randomGradientIntensity = game.floor(game.random(dakrandomGradientRange));
    dak.name = dakName;
    dak.head = game.createSprite(x, y, dakWidth, dakHeight);
    dak.head.addAnimation('normal', dakNormalAnimation);
    dak.head.addAnimation('destroyed', dakDestroyedAnimation);
    dak.head.rotateToDirection = true;
    dak.head.setSpeed(normalSpeed, angle);
    dak.tail = [];
    for (let i = 0; i < dakTailLength; i++) {
      dak.tail.push(game.createSprite(x, y, dakWidth, dakHeight));
      randomColor = game.color(dak.randomR + (i * dak.randomGradientIntensity),
       dak.randomG + (i * dak.randomGradientIntensity),
       dak.randomB + (i * dak.randomGradientIntensity));
      dak.tail[i].shapeColor = randomColor;
      collisionSpriteGroup.add(dak.tail[i]);
    }
    for (let i = 0; i < 4; i++) {
      collisionSpriteGroup.remove(dak.tail[i]);
    }
    dak.moveTail = function (dak) {
      dak.tail[0].position = dak.head.previousPosition;
      dak.tail[0].setCollider('rectangle', 0, 0, dakWidth, dakHeight);
      for (let i = 1; i < dakTailLength; i++) {
        dak.tail[i].position = dak.tail[i - 1].previousPosition;
        dak.tail[i].setCollider('rectangle', 0, 0, dakWidth, dakHeight);
      }
    };
    dak.drawName = function (dak) {
      if (dak.head.getDirection() === 90) {
        game.text(dak.name, dak.head.position.x, dak.head.position.y + (dakHeight * 1.5));
      } else {
        game.text(dak.name, dak.head.position.x, dak.head.position.y - dakHeight);
      }
    };
    return dak;
  }

  function convertDakToJson(dak) {
    const data = {};
    data.name = dak.name;
    data.rValue = dak.randomR;
    data.gValue = dak.randomG;
    data.bValue = dak.randomB;
    data.gradientIntensity = dak.randomGradientIntensity;
    data.headPosition = { x: dak.head.position.x, y: dak.head.position.y };
    data.speed = dak.head.getSpeed();
    data.direction = dak.head.getDirection();
    data.tailPositions = [];
    for (let i = 0; i < dakTailLength; i++) {
      data.tailPositions.push({
        x: dak.tail[i].position.x,
        y: dak.tail[i].position.y
      });
    }
    return data;
  }

  function convertJsonToDak(data) { // eslint-disable-line no-unused-vars
    const dak = {};
    let randomColor;
    dak.name = data.name;
    dak.head = game.createSprite(data.headPosition.x, data.headPosition.y, dakWidth, dakHeight);
    dak.head.addAnimation('normal', dakNormalAnimation);
    dak.head.addAnimation('destroyed', dakDestroyedAnimation);
    dak.head.rotateToDirection = true;
    dak.head.setSpeed(data.speed, data.direction);
    dak.tail = [];
    for (let i = 0; i < dakTailLength; i++) {
      dak.tail.push(game.createSprite(data.tailPositions[i].x, data.tailPositions[i].y,
       dakWidth, dakHeight));
      randomColor = game.color(data.rValue + (i * data.gradientIntensity),
       data.gValue + (i * data.gradientIntensity), data.bValue + (i * data.gradientIntensity));
      dak.tail[i].shapeColor = randomColor;
      collisionSpriteGroup.add(dak.tail[i]);
    }
    dak.moveTail = function (dak) {
      dak.tail[0].position = dak.head.previousPosition;
      dak.tail[0].setCollider('rectangle', 0, 0, dakWidth, dakHeight);
      for (let i = 1; i < dakTailLength; i++) {
        dak.tail[i].position = dak.tail[i - 1].previousPosition;
        dak.tail[i].setCollider('rectangle', 0, 0, dakWidth, dakHeight);
      }
    };
    dak.drawName = function (dak) {
      if (dak.head.getDirection() === 90) {
        game.text(dak.name, dak.head.position.x, dak.head.position.y + (dakHeight * 1.5));
      } else {
        game.text(dak.name, dak.head.position.x, dak.head.position.y - dakHeight);
      }
    };
    return dak;
  }

  // function printCollision() {
  //   console.log('COLLISION' + game.frameCount);
  //   return null;
  // }

  // Game starts
  game.preload = function onPreload() {
    // Load sounds
    game.soundFormats('ogg', 'mp3');
    gameStartSound = game.loadSound('/sounds/sound-game-start.mp3');
    gameOverSound = game.loadSound('/sounds/sound-game-over.mp3');
    playerJoinedSound = game.loadSound('/sounds/sound-player-joined.mp3');

    // Load sprite, sprite sheet and animations.
    dakNormalAnimation = game.loadAnimation(new game.SpriteSheet('/sprites/sprite-dak.png',
    [{ "name": "dakNormal",
     "frame": { "x": 0, "y": 0, "width": dakWidth, "height": dakHeight } }]));
    dakDestroyedSpriteSheet = game.loadSpriteSheet('/sprites/sprite-sheet-dak-destroyed.png',
     dakDestroyedFrames);
    dakDestroyedAnimation = game.loadAnimation(dakDestroyedSpriteSheet);

    // Handle multiplayer connections.
    Streamy.on('__join__', function(data) { // eslint-disable-line no-unused-vars
      playerJoinedSound.play();
      Streamy.rooms(myLobby).emit('hereIsDak', {
        dakData: convertDakToJson(myDak),
        socketId: Streamy.id()
      });
    });

    Streamy.on('__leave__', function(data) {
      if (data.sid !== Streamy.id()) {
        otherDakSocketIds.splice(otherDakSocketIds.indexOf(data.sid), 1);
        eval(data.sid + '.head.remove();');
        for (let i = 0; i < dakTailLength; i++) {
          eval(data.sid + '.tail[i].remove();');
        }
      }
    });

    Streamy.on('hereIsDak', function(data) {
      if (data.socketId !== Streamy.id()) {
        if (otherDakSocketIds.indexOf(data.socketId) === -1) {
          eval(data.socketId + ' = convertJsonToDak(data.dakData);');
          otherDakSocketIds.push(data.socketId);
        }
      }
    });

    Streamy.on('turnedLeft', function(data) {
      if (data.socketId !== Streamy.id()) {
        // eslint-disable-next-line no-unused-vars
        const currentDirection = eval(data.socketId + '.head.getDirection()');
        // eslint-disable-next-line no-unused-vars
        const currentSpeed = eval(data.socketId + '.head.getSpeed()');
        eval(data.socketId + '.head.position.x = data.headPosition.x;');
        eval(data.socketId + '.head.position.y = data.headPosition.y;');
        eval(data.socketId +
         '.head.setSpeed(currentSpeed, calculateNewDirection("left", currentDirection));');
        for (let i = 0; i < dakTailLength; i++) {
          eval(data.socketId + '.tail[i].position.x = data.tailPositions[i].x');
          eval(data.socketId + '.tail[i].position.y = data.tailPositions[i].y');
          eval(data.socketId + '.tail[i].setCollider("rectangle", 0, 0, dakWidth, dakHeight);');
        }
      }
    });

    Streamy.on('turnedRight', function(data) {
      if (data.socketId !== Streamy.id()) {
        // eslint-disable-next-line no-unused-vars
        const currentDirection = eval(data.socketId + '.head.getDirection()');
        // eslint-disable-next-line no-unused-vars
        const currentSpeed = eval(data.socketId + '.head.getSpeed()');
        eval(data.socketId + '.head.position.x = data.headPosition.x;');
        eval(data.socketId + '.head.position.y = data.headPosition.y;');
        eval(data.socketId +
         '.head.setSpeed(currentSpeed, calculateNewDirection("right", currentDirection));');
        for (let i = 0; i < dakTailLength; i++) {
          eval(data.socketId + '.tail[i].position.x = data.tailPositions[i].x');
          eval(data.socketId + '.tail[i].position.y = data.tailPositions[i].y');
          eval(data.socketId + '.tail[i].setCollider("rectangle", 0, 0, dakWidth, dakHeight);');
        }
      }
    });

    Streamy.on('startedBoost', function(data) {
      if (data.socketId !== Streamy.id()) {
        eval(data.socketId + '.head.position.x = data.headPosition.x;');
        eval(data.socketId + '.head.position.y = data.headPosition.y;');
        eval(data.socketId + '.head.setSpeed(boostedSpeed);');
      }
    });

    Streamy.on('stoppedBoost', function(data) {
      if (data.socketId !== Streamy.id()) {
        eval(data.socketId + '.head.position.x = data.headPosition.x;');
        eval(data.socketId + '.head.position.y = data.headPosition.y;');
        eval(data.socketId + '.head.setSpeed(normalSpeed);');
      }
    });

    Streamy.on('startedBrake', function(data) {
      if (data.socketId !== Streamy.id()) {
        eval(data.socketId + '.head.position.x = data.headPosition.x;');
        eval(data.socketId + '.head.position.y = data.headPosition.y;');
        eval(data.socketId + '.head.setSpeed(brakeSpeed);');
      }
    });

    Streamy.on('stoppedBrake', function(data) {
      if (data.socketId !== Streamy.id()) {
        eval(data.socketId + '.head.position.x = data.headPosition.x;');
        eval(data.socketId + '.head.position.y = data.headPosition.y;');
        eval(data.socketId + '.head.setSpeed(normalSpeed);');
      }
    });

    Streamy.on('collision', function(data) {
      if (data.socketId !== Streamy.id()) {
        eval(data.socketId + '.head.position.x = data.headPosition.x;');
        eval(data.socketId + '.head.position.y = data.headPosition.y;');
        eval(data.socketId + '.head.position.immovable = true;');
        eval(data.socketId + '.head.limitSpeed(0);');
        gameOverSound.play();
        for (let i = 0; i < dakTailLength; i++) {
          eval(data.socketId + '.tail[i].position.x = data.tailPositions[i].x');
          eval(data.socketId + '.tail[i].position.y = data.tailPositions[i].y');
          eval(data.socketId + '.tail[i].setCollider("rectangle", 0, 0, dakWidth, dakHeight);');
        }
        eval(data.socketId + '.head.changeAnimation("destroyed");');
        eval(data.socketId + '.head.scale = destroyedDakScale;');
      }
    });
  };

  game.setup = function onSetup() {
    game.createCanvas(game.windowWidth, game.windowHeight);
    game.frameRate(10);
    game.camera.zoom = game.windowWidth / 1000;

    // Sprite groups
    collisionSpriteGroup = new game.Group();

    // // Spawn
    // myDak = createDak(randomXOrigin(), randomYOrigin(), randomAngle(), Meteor.user().username);
    // myDak.head.depth = 100;
    // // Safety turning margin.
    // for (let i = 0; i < 4; i++) {
    //   collisionSpriteGroup.remove(myDak.tail[i]);
    // }
    // gameStartSound.play();
    // myDak.head.debug = true;
    // for (let i = 0; i < dakTailLength; i++) {
    //   myDak.tail[i].debug = true;
    //   myDak.tail[i].setCollider('rectangle', 0, 0, dakWidth, dakHeight);
    // }
  };

  game.draw = function onDraw() {
    if (myLobby) {
      game.background(20, 20, 20);
      game.strokeWeight(5);
      game.noFill();
      game.stroke(255);
      game.rect(-8, -8, mapWidth + 16, mapHeight + 16);
      game.textAlign(game.CENTER);
      game.textSize(8);
      game.noStroke();
      game.fill('rgba(255, 255, 255, 0.25)');

      // Center camera.
      game.camera.position.x = myDak.head.position.x;
      game.camera.position.y = myDak.head.position.y;

      if (myDak.head.position.x < 0) {
        myDak.head.position.x = 0;
      }
      if (myDak.head.position.y < 0) {
        myDak.head.position.y = 0;
      }
      if (myDak.head.position.x > mapWidth) {
        myDak.head.position.x = mapWidth;
      }
      if (myDak.head.position.y > mapHeight) {
        myDak.head.position.y = mapHeight;
      }

      const myCurrentDirection = myDak.head.getDirection();
      const myCurrentSpeed = myDak.head.getSpeed();

      // Turn left.
      if (game.keyWentDown('left') || game.keyWentDown('A')) {
        const myTailPositions = [];
        for (let i = 0; i < dakTailLength; i++) {
          myTailPositions.push({
            x: myDak.tail[i].position.x,
            y: myDak.tail[i].position.y
          });
        }
        Streamy.rooms(myLobby).emit('turnedLeft', {
          socketId: Streamy.id(),
          headPosition: { x: myDak.head.position.x, y: myDak.head.position.y },
          tailPositions: myTailPositions
        });
        myDak.head.setSpeed(myCurrentSpeed, calculateNewDirection('left', myCurrentDirection));
      }

      // Turn right.
      if (game.keyWentDown('right') || game.keyWentDown('D')) {
        const myTailPositions = [];
        for (let i = 0; i < dakTailLength; i++) {
          myTailPositions.push({
            x: myDak.tail[i].position.x,
            y: myDak.tail[i].position.y
          });
        }
        Streamy.rooms(myLobby).emit('turnedRight', {
          socketId: Streamy.id(),
          headPosition: { x: myDak.head.position.x, y: myDak.head.position.y },
          tailPositions: myTailPositions
        });
        myDak.head.setSpeed(myCurrentSpeed, calculateNewDirection('right', myCurrentDirection));
      }

      // Boost started.
      if (game.keyWentDown('space')) {
        Streamy.rooms(myLobby).emit('startedBoost', {
          socketId: Streamy.id(),
          headPosition: { x: myDak.head.position.x, y: myDak.head.position.y }
        });
        myDak.head.setSpeed(boostedSpeed);
      }

      // Boost stopped.
      if (game.keyWentUp('space')) {
        Streamy.rooms(myLobby).emit('stoppedBoost', {
          socketId: Streamy.id(),
          headPosition: { x: myDak.head.position.x, y: myDak.head.position.y }
        });
        myDak.head.setSpeed(normalSpeed);
      }

      // Brake started.
      if (game.keyWentDown('shift')) {
        Streamy.rooms(myLobby).emit('startedBrake', {
          socketId: Streamy.id(),
          headPosition: { x: myDak.head.position.x, y: myDak.head.position.y }
        });
        myDak.head.setSpeed(brakeSpeed);
      }

      // Brake stopped.
      if (game.keyWentUp('shift')) {
        Streamy.rooms(myLobby).emit('stoppedBrake', {
          socketId: Streamy.id(),
          headPosition: { x: myDak.head.position.x, y: myDak.head.position.y }
        });
        myDak.head.setSpeed(normalSpeed);
      }

      // Handle tail movement.
      myDak.moveTail(myDak);
      myDak.drawName(myDak);

      for (let i = 0; i < otherDakSocketIds.length; i++) {
        eval(otherDakSocketIds[i] + '.moveTail(' + otherDakSocketIds[i] + ');');
        eval(otherDakSocketIds[i] + '.drawName(' + otherDakSocketIds[i] + ');');
      }

      if (game.frameCount > myFrameCounter + 11) {
        if (myDak.head.collide(collisionSpriteGroup)) {
          const myTailPositions = [];
          for (let i = 0; i < dakTailLength; i++) {
            myTailPositions.push({
              x: myDak.tail[i].position.x,
              y: myDak.tail[i].position.y
            });
          }
          Streamy.rooms(myLobby).emit('collision', {
            socketId: Streamy.id(),
            headPosition: { x: myDak.head.position.x, y: myDak.head.position.y },
            tailPositions: myTailPositions
          });
          myDak.head.immovable = true;
          myDak.head.limitSpeed(0);
          myDak.head.changeAnimation('destroyed');
          myDak.head.scale = destroyedDakScale;
        }
      }

      if (myDak.head.getAnimationLabel() === 'destroyed' && myDak.head.animation.getFrame() === 0) {
        gameOverSound.play();
      }

      if (myDak.head.getAnimationLabel() === 'destroyed' &&
       myDak.head.animation.getFrame() === myDak.head.animation.getLastFrame()) {
        game.remove();
        recordScore.call({ name: Meteor.user().username, score: myScore });
        removeCurrentAccount.call({}); Meteor.logout();
        BlazeLayout.render('Home_layout', { main: 'Home_login_page' });
      }

      if (game.frameCount % 30 === 0) {
        myScore++;
      }

      game.textSize(20);
      game.fill(255);
      game.text(String(myScore), -25, -25);
      game.drawSprites();
    } else {
      game.textSize(20);
      game.fill(255);
      game.text('Finding game...', 100, 100);
      myLobby = Meteor.user().currentLobby;
      if (myLobby) {
        // Spawn
        myDak = createDak(randomXOrigin(), randomYOrigin(), randomAngle(), Meteor.user().username);
        myDak.head.depth = 100;
        gameStartSound.play();
        Streamy.join(myLobby);
      }
      myFrameCounter++;
    }
  };

  game.windowResized = function onWindowResize() {
    game.resizeCanvas(game.windowWidth, game.windowHeight);
    game.camera.zoom = game.windowWidth / viewWidth;
  };
};

Template.Game.onRendered(() => {
  myScore = 0;
  // eslint-disable-next-line no-unused-vars, new-cap
  const renderedGame = new p5(gameToRender, 'js-game-element');
  $(window).on("blur focus", function(e) {
    const prevType = $(this).data("prevType");
    if (prevType !== e.type) {   //  reduce double fire issues
      switch (e.type) {
        case "blur":
          BlazeLayout.render('Home_layout', { main: 'Home_login_page' });
          break;
        case "focus":
          // do work
          break;
      }
    }
    $(this).data("prevType", e.type);
  });
});
