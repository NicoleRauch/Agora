'use strict';

var request = require('supertest');
require('../../testutil/configureForTest');

var app = require('../../app').create();

describe('Activities application security for normal visitors does not allow to access for', function () {

  it('/new', function (done) {
    request(app).get('/activities/new').expect(302).expect('location', /login/, done);
  });

  it('/newLike', function (done) {
    request(app).get('/activities/newLike/other').expect(302).expect('location', /login/, done);
  });

  it('/edit', function (done) {
    request(app).get('/activities/edit/EventA').expect(302).expect('location', /login/, done);
  });

  it('/submit', function (done) {
    request(app).post('/activities/submit').expect(302).expect('location', /login/, done);
  });

  it('/addon', function (done) {
    request(app).get('/activities/addon/someActivity').expect(302).expect('location', /login/, done);
  });

  it('/addons', function (done) {
    request(app).get('/activities/addons/someActivity').expect(302).expect('location', /login/, done);
  });

  it('/payment', function (done) {
    request(app).get('/activities/payment/someActivity').expect(302).expect('location', /login/, done);
  });

  it('/paymentReceived', function (done) {
    request(app).get('/activities/paymentReceived/someActivity').expect(302).expect('location', /login/, done);
  });

  it('/subscribe', function (done) {
    request(app).post('/activities/subscribe').expect(302).expect('location', /login/, done);
  });

  it('/addToWaitinglist', function (done) {
    request(app).post('/activities/addToWaitinglist').expect(302).expect('location', /login/, done);
  });

});
