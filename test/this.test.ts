import t from "tap";
import express, {Application} from "express";
import http, {Server as HttpServer} from "http";
import {MetaController} from "../src/MetaController.js";
import {JsonController} from "../src/decorators/class/JsonController.js";
import {Route} from "../src/decorators/property/Route.js";
import {HttpStatus, HttpMethod} from "http-status-ts";

let expressApp: Application;
let apiServer: HttpServer;

t.before(() => {
    MetaController.clearMetadata();

    @JsonController("/this")
    class WidgetController {
        classProperty: string = "this is a class property";

        @Route(HttpMethod.GET, "/sync")
        thisSync(): Record<string, string> {
            return {classProperty: this.classProperty};
        }

        @Route(HttpMethod.GET, "/async")
        thisAsync(): Promise<Record<string, string>> {
            return Promise.resolve({classProperty: this.classProperty});
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
    apiServer.listen(4506);
});

t.teardown(() => {
    apiServer.close();
});

void t.test("sync", async t => {
    const response = await fetch("http://localhost:4506/this/sync", {method: HttpMethod.GET});
    t.equal(response.status, HttpStatus.OK);
    t.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
    const result = await response.json();
    t.same(result, {classProperty: "this is a class property"});
});

void t.test("async", async t => {
    const response = await fetch("http://localhost:4506/this/async", {method: HttpMethod.GET});
    t.equal(response.status, HttpStatus.OK);
    t.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
    const result = await response.json();
    t.same(result, {classProperty: "this is a class property"});
});
