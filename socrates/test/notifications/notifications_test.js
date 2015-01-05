'use strict';

var sinon = require('sinon').sandbox.create();
var expect = require('must');

var beans = require('../../testutil/configureForTest').get('beans');
var notifications = beans.get('socratesNotifications');

var memberstore = beans.get('memberstore');
var participantstore = beans.get('participantstore');

var Member = beans.get('member');
var transport = beans.get('mailtransport');

var hans = new Member({
  id: 'hans',
  firstname: 'Hans',
  lastname: 'Dampf',
  email: 'hans@email.de',
  nickname: 'Gassenhauer'
});
var alice = new Member({
  id: 'alice',
  firstname: 'firstname of alice',
  lastname: 'lastname of alice',
  email: 'alice@email.de'
});
var bob = new Member({
  id: 'bob',
  firstname: 'firstname of bob',
  lastname: 'lastname of bob',
  email: 'bob@email.de',
  nickname: 'nickbob'
});
var superman = new Member({
  id: 'superuserID',
  firstname: 'firstname of su',
  lastname: 'lastname of su',
  email: 'superman@email.de',
  nickname: 'superman'
});

describe('Notifications', function () {

  beforeEach(function () {
    sinon.stub(transport, 'sendMail');
  });

  afterEach(function () {
    sinon.restore();
  });

  it('creates a meaningful text and subject', function () {
    sinon.stub(memberstore, "allMembers", function (callback) { callback(null, [hans, alice, bob, superman]); });
    sinon.stub(participantstore, "allParticipants", function (callback) { callback(null, ["p1", "p2", "p3"]); });

    notifications.newSoCraTesMemberRegistered(hans);
    expect(transport.sendMail.calledOnce).to.be(true);
    var options = transport.sendMail.firstCall.args[0];
    expect(options.subject).to.equal('Neuer Interessent');
    expect(options.html).to.contain('Es hat sich ein neuer SoCraTes-Interessent registriert:');
    expect(options.html).to.contain('Hans Dampf');
    expect(options.html).to.contain('/members/Gassenhauer');
    expect(options.html).to.contain('hans@email.de');
    expect(options.html).to.contain('Damit hat die SoCraTes jetzt 3 Interessenten.');
  });

  it('triggers mail sending for superusers', function () {
    sinon.stub(memberstore, "allMembers", function (callback) { callback(null, [hans, alice, bob, superman]); });
    sinon.stub(participantstore, "allParticipants", function (callback) { callback(null, ["p1", "p2", "p3"]); });

    notifications.newSoCraTesMemberRegistered(hans);
    expect(transport.sendMail.calledOnce).to.be(true);
    var options = transport.sendMail.firstCall.args[0];
    expect(options.bcc).to.contain('superman@email.de');
    expect(options.bcc).to.not.contain('hans@email.de');
    expect(options.bcc).to.not.contain('alice@email.de');
    expect(options.bcc).to.not.contain('bob@email.de');
    expect(options.from).to.contain('Softwerkskammer Benachrichtigungen');
  });

  it('does not trigger mail sending if there are no superusers', function () {
    sinon.stub(memberstore, "allMembers", function (callback) { callback(null, [hans, alice, bob]); });
    sinon.stub(participantstore, "allParticipants", function (callback) { callback(null, ["p1", "p2", "p3"]); });

    notifications.newSoCraTesMemberRegistered(hans);
    expect(transport.sendMail.called).to.be(false);
  });

});
