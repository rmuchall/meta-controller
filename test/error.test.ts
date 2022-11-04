import t from "tap";
import express, {Application} from "express";
import http, {Server as HttpServer} from "http";
import {MetaController} from "../src/MetaController.js";
import {JsonController} from "../src/decorators/class/JsonController.js";
import {Route} from "../src/decorators/property/Route.js";
import {Body} from "../src/decorators/parameter/Body.js";
import {HttpStatus, HttpMethod} from "http-status-ts";
import {HttpError} from "../src/models/HttpError.js";

let expressApp: Application;
let apiServer: HttpServer;

t.before(() => {
    MetaController.clearMetadata();

    @JsonController("/error")
    class WidgetController {
        @Route(HttpMethod.GET, "/throw-sync-nodejs")
        throwSyncNodeJs(): void {
            throw new Error("sync error from nodejs");
        }

        @Route(HttpMethod.GET, "/throw-async-nodejs")
        throwAsyncNodeJs(): Promise<void> {
            return new Promise<void>((resolve, reject) => {
                throw new Error("async error from nodejs");
            });
        }

        @Route(HttpMethod.GET, "/throw-sync-meta")
        throwSyncMeta(): void {
            throw new HttpError(HttpStatus.BAD_REQUEST, "sync error from meta-controller");
        }

        @Route(HttpMethod.GET, "/throw-async-meta")
        throwAsyncMeta(): Promise<void> {
            return new Promise<void>((resolve, reject) => {
                throw new HttpError(HttpStatus.BAD_REQUEST, "async error from meta-controller");
            });
        }

        @Route(HttpMethod.POST, "/body-parser")
        postString(@Body() str: string): string {
            return str;
        }
    }

    expressApp = express();
    MetaController.useExpressServer(expressApp, {
        isUseCors: true,
        controllerClassTypes: [
            WidgetController
        ]
    });
    apiServer = http.createServer(expressApp);
    apiServer.listen(4500);
});

t.teardown(() => {
    apiServer.close();
});

void t.test("bad path", async t => {
    const response = await fetch("http://localhost:4500/error/bad-path", {method: HttpMethod.GET});
    t.equal(response.status, HttpStatus.NOT_FOUND);
    t.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
    const result: any = await response.json();
    t.equal(result.message, "Route not found");
});

void t.test("sync from nodejs", async t => {
    const response = await fetch("http://localhost:4500/error/throw-sync-nodejs", {method: HttpMethod.GET});
    t.equal(response.status, HttpStatus.INTERNAL_SERVER_ERROR);
    t.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
    const result: any = await response.json();
    t.equal(result.message, "sync error from nodejs");
    t.not(result.stack, undefined);
});

void t.test("async from nodejs", async t => {
    const response = await fetch("http://localhost:4500/error/throw-async-nodejs", {method: HttpMethod.GET});
    t.equal(response.status, HttpStatus.INTERNAL_SERVER_ERROR);
    t.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
    const result: any = await response.json();
    t.equal(result.message, "async error from nodejs");
    t.not(result.stack, undefined);
});

void t.test("sync from meta-controller", async t => {
    const response = await fetch("http://localhost:4500/error/throw-sync-meta", {method: HttpMethod.GET});
    t.equal(response.status, HttpStatus.BAD_REQUEST);
    t.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
    const result: any = await response.json();
    t.equal(result.statusCode, HttpStatus.BAD_REQUEST);
    t.equal(result.message, "sync error from meta-controller");
    t.not(result.stack, undefined);
});

void t.test("async from meta-controller", async t => {
    const response = await fetch("http://localhost:4500/error/throw-async-meta", {method: HttpMethod.GET});
    t.equal(response.status, HttpStatus.BAD_REQUEST);
    t.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
    const result: any = await response.json();
    t.equal(result.statusCode, HttpStatus.BAD_REQUEST);
    t.equal(result.message, "async error from meta-controller");
    t.not(result.stack, undefined);
});

void t.test("bodyParser", async t => {
    const response = await fetch("http://localhost:4500/error/body-parser", {
        method: "POST",
        body: "this is a test string",
        headers: {"Content-Type": "application/json"}
    });
    t.equal(response.status, HttpStatus.BAD_REQUEST);
    t.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
    const result: any = await response.json();
    t.equal(result.statusCode, HttpStatus.BAD_REQUEST);
    t.equal(result.message, "Unexpected token t in JSON at position 0");
    t.not(result.stack, undefined);
});
