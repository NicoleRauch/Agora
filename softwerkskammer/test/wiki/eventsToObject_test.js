'use strict';

var expect = require('must-dist');
var eventsToObject = require('../../lib/wiki/eventsToObject');

describe('Wiki EventsToObject', function () {
  var eventsWithOOP = [{
    start: '2015-02-01T00:00:00+00:00',
    end:'2015-02-06T00:00:00+00:00',
    url:'http://www.oop-konferenz.de/',
    title:'OOP (München)',
    color:'#999'
  }];

  describe('parses multiline text', function () {
    var oop = '[OOP](http://www.oop-konferenz.de/) | München  | 1.2. - 5.2.';
    var microXchg = '[microXchg - The Microservices Conference](http://microxchg.io) | Berlin | 4.2. - 5.2. ';
    
    it('seperated by LF', function () {
      var text = oop + '\n' + microXchg;
      expect(eventsToObject(text, 2015)).to.have.length(2);
    });

    it('seperated by CR', function () {
      var text = oop + '\r' + microXchg;
      expect(eventsToObject(text, 2015)).to.have.length(2);
    });

    it('seperated by CRLF', function () {
      var text = oop + '\r\n' + microXchg;
      expect(eventsToObject(text, 2015)).to.have.length(2);
    });
    
    it('ignoring meaningless lines', function () {
      var text = oop + '\n' + 'some text | even | in table' + '\n' + microXchg;
      expect(eventsToObject(text, 2015)).to.have.length(2);
    });
  });

  describe('parses lines with "columns" ("|")', function () {
    it('having three "columns"', function () {
      var text = '[OOP](http://www.oop-konferenz.de/) | München  | 1.2. - 5.2.';
      expect(eventsToObject(text, 2015)).to.eql(eventsWithOOP);
    });

    it('less than three "columns" are ignored', function () {
      var text = '[OOP](http://www.oop-konferenz.de/) München  | 1.2. - 5.2.';
      expect(eventsToObject(text, 2015)).to.be.empty();
    });
    
    it('more than three "columns" are ignored', function () {
      var text = '[OOP](http://www.oop-konferenz.de/) | | München  | 1.2. - 5.2.';
      expect(eventsToObject(text, 2015)).to.be.empty();
    });
  });

  describe('parses title and url', function () {
    it('ignoring leading and trailing spaces around the "column"', function () {
      var text = '   [OOP](http://www.oop-konferenz.de/)    | München  | 1.2. - 5.2.';
      expect(eventsToObject(text, 2015)).to.eql(eventsWithOOP);
    });

    it('ignoring leading and trailing spaces inside', function () {
      var text = '[   OOP   ]( http://www.oop-konferenz.de/ )| München  | 1.2. - 5.2.';
      expect(eventsToObject(text, 2015)).to.eql(eventsWithOOP);
    });

    it('ignores wrongly formatted first "column"', function () {
      var text = 'http://www.oop-konferenz.de/| München  | 1.2. - 5.2.';
      expect(eventsToObject(text, 2015)).to.be.empty();
    });
  });
  
  describe('parses start and end', function () {
    it('when present', function () {
      var text = '[OOP](http://www.oop-konferenz.de/) | München  | 1.2. - 5.2.';
      expect(eventsToObject(text, 2015)).to.eql(eventsWithOOP);
    });

    it('ignoring leading and trailing spaces around the "column"', function () {
      var text = '   [OOP](http://www.oop-konferenz.de/)    | München  |   1.2. - 5.2.   ';
      expect(eventsToObject(text, 2015)).to.eql(eventsWithOOP);
    });

    it('ignoring missing leading and trailing spaces inside', function () {
      var text = '[   OOP   ]( http://www.oop-konferenz.de/ )| München  |1.2.-5.2.';
      expect(eventsToObject(text, 2015)).to.eql(eventsWithOOP);
    });

    it('ignoring missing "to" date then replacing it with from (+1 day)', function () {
      var text = '[   OOP   ]( http://www.oop-konferenz.de/ )| München  | 1.2.';
      expect(eventsToObject(text, 2015)[0].start).to.be('2015-02-01T00:00:00+00:00');
      expect(eventsToObject(text, 2015)[0].end).to.be('2015-02-02T00:00:00+00:00');
    });

    it('ignoring missing "to" date (but " - ") then replacing it with from (+1 day)', function () {
      var text = '[   OOP   ]( http://www.oop-konferenz.de/ )| München  | 1.2. - ';
      expect(eventsToObject(text, 2015)[0].start).to.be('2015-02-01T00:00:00+00:00');
      expect(eventsToObject(text, 2015)[0].end).to.be('2015-02-02T00:00:00+00:00');
    });

    it('ignores wrongly formatted last "column"', function () {
      var text = 'http://www.oop-konferenz.de/| München  | 44.33.';
      expect(eventsToObject(text, 2015)).to.be.empty();
    });
  });
});
