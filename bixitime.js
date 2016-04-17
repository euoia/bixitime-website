var
  hbs = require('koa-hbs'),
  log = require('winston'),
  koa = require('koa'),
  staticCache = require('koa-static-cache'),
  path = require('path'),
  util = require('util');

// Application configuration.
var appPort = process.env.BIXI_TIME_PORT || 3010;

// Configure logging.
log.remove(log.transports.Console);
log.add(log.transports.Console, {timestamp: true});

// Configure koa.
var app = koa();

app.use(staticCache(path.join(__dirname, 'public'), {
  maxAge: 365 * 24 * 60 * 60,
  gzip: true
}));

app.use(hbs.middleware({
  viewPath: __dirname + '/views'
}));

app.use(function *(next) {
  log.info(`Received request from ${this.ip} for ${this.path} ${this.querystring}`);
  yield next;
});

// Pass through IP address from apache reverse proxy.
app.proxy = true;

// Handle requests.
app.use(function *(){
  if (this.path === '/') {
    yield this.render('bixitime', {
      title: 'Bixi Time',
      apiUrl: 'http://api.bixitime.com/station/nearest'
    });
  }
});

app.listen(appPort);
util.log('Starting listening on port ' + appPort);
