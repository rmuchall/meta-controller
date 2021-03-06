import express, {Application} from "express";
import http, {Server as HttpServer} from "http";
import {MetaController} from "../src/MetaController";
import {JsonController} from "../src/decorators/class/JsonController";
import {Route} from "../src/decorators/property/Route";
import {HttpStatus, HttpMethod} from "http-status-ts";
import nodeFetch from "node-fetch";

let expressApp: Application;
let apiServer: HttpServer;

beforeAll((done) => {
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
    apiServer.listen(4500, done);
});

afterAll(done => {
    apiServer.close(done);
    done();
});

test("sync", async () => {
    expect.assertions(3);
    const response = await nodeFetch("http://localhost:4500/this/sync", {method: HttpMethod.GET});
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    const result = await response.json();
    expect(result).toEqual({classProperty: "this is a class property"});
});

test("async", async () => {
    expect.assertions(3);
    const response = await nodeFetch("http://localhost:4500/this/async", {method: HttpMethod.GET});
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    const result = await response.json();
    expect(result).toEqual({classProperty: "this is a class property"});
});
