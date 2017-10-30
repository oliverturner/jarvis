#!/usr/bin/env node

/*!
 * webpack-jarvis <https://github.com/zouhir/webpack-jarvis>
 *
 * Copyright (c) 2017, Zouhir C.
 * Licensed under the MIT License.
 */

/**
 * External Dependencies
 */
const cwd = require("cwd");
const express = require("express");
const http = require("http");
const path = require("path");
const socket = require("socket.io");

/**
 * Compiler Dependencies
 */
const compiler = require("./webpack/compiler");

/**
 * Utility functions
 */
const parser = require("./lib/argv-parser");

/**
 * System custom events
 */
const clientEvents = require("./events/client");

/**
 * Setup express with live web sockets
 * 
 * socket.io docs: https://socket.io/docs/server-api/
 */
const app = express();
const server = http.Server(app);
const io = socket(server);
/**
 * init client events
 */
clientEvents(io);
/**
 * Mandatory service variables
 */
let env, port, configFile, config;
const DEFAULT_ENV = "development";
const DEFAULT_PORT = 1337;
const DEFAULT_WEBPACK_CONFIGS = "webpack.config";

/**
 * NPM script user arguments
 * Required:
 * @arg1: Environment 
 *        usage: --prod for "production", --dev for development
 * @arg2: Port
 *        usage: --port=3000 
 */
const args = process.argv.slice(2);
let parsed = parser(args);
env = DEFAULT_ENV;
if (parsed.production) {
  env = "production";
}
port = DEFAULT_PORT;
if (parsed.port) {
  port = parsed.port;
}
configFilePath = DEFAULT_WEBPACK_CONFIGS;
if (parsed.config) {
  configFilePath = parsed.config;
}

// Load the configs from the file
config = require(path.join(cwd(), configFilePath));

if (!config) {
  throw new Error("Config file error");
}

let c = compiler({ config: config, env: env });

if (env === "production") {
  c.makeProdBundle();
} else {
  c.startDevServer();
}

if (process.env.NODE_ENV !== "jarvis_dev") {
  app.use("/", express.static(path.join(__dirname, "../../dist/client")));
  app.get("/", (_, res) =>
    res.sendFile(path.join(__dirname + "../../dist/client/index.html"))
  );
} else {
  app.get("/", (_, res) => res.send("Jarvis client is running on: 1337"));
}
server.listen(1337, () =>
  console.log("Starting JARVIS on: http://localhost:1337")
);
