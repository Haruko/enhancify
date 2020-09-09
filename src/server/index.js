const express = require('express');

export default class AuthServer {
  // app;
  // server;
  // port;
  // state;

  get running() {
    return !!this.server;
  }

  constructor(port, successRedirect, errorRedirect) {
    this.port = port;
    this.app = express();

    this.app.get('/callback', async (req, res) => {
      const authState = req.query.state;
      const authCode = req.query.code;
      const authError = req.query.error;

      if (typeof authError !== 'undefined' || this.state !== authState) {
        res.redirect(errorRedirect);
      } else {
        res.redirect(`${successRedirect}?code=${authCode}`);
      }

      res.end();

      this.state = undefined;
      await this.stopAuthServer();
    });
  }

  // Start the auth server with expected state
  async startAuthServer(state) {
    if (this.running) {
      return;
    }

    this.state = state;

    await new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.port, () => {
          resolve();
        });
      } catch (error) {
        console.log(error);
        reject(error);
      }
    });
  }

  // Stop the auth server
  async stopAuthServer() {
    if (!this.running) {
      return;
    }

    await new Promise((resolve, reject) => {
      try {
        this.server.close(() => {
          this.server = undefined;
          resolve();
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}