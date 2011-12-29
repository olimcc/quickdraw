/* Config */

exports.configure = function() {

    this.port = 1337;
    this.testPadActivityInterval = 1000 * 60 * 5; // 5 mins
    this.padTimeoutTolerance = 1000 * 60 * 15; // 15 mins
    return this;
};
