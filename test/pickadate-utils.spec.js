describe('pickadateUtils', function () {
  'use strict';
  var utils = null;

  beforeEach(module("iOffice.pickadate"));

  beforeEach(inject(function (_pickadateUtils_) {
    utils = _pickadateUtils_;
  }));


  describe('stringToDate', function() {

    it("parses the string and return a date object", function() {
      var dateString = "2014-02-04",
          date = utils.stringToDate(dateString);

      expect(date.getDate()).to.equal(4);
      expect(date.getMonth()).to.equal(1);
      expect(date.getFullYear()).to.equal(2014);
      expect(date.getHours()).to.equal(3);
    });

    it("returns a new date if a date object is passed", function() {
      var date = new Date();

      expect(utils.stringToDate(date).getTime()).to.equal(date.getTime());
    });

  });

  describe('stringToMoment', function() {
    it("parses string and returns moment object", function() {
      var dateString = "2014-02-04",
        date = utils.stringToMoment(dateString);

        expect(date.date()).to.equal(4);
        expect(date.month()).to.equal(1);
        expect(date.year()).to.equal(2014);
        expect(date.hours()).to.equal(3);
    })
  })
});
