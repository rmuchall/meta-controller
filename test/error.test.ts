import express from "express";
import http, {Server as HttpServer} from "http";
import {MetaController} from "../src/MetaController";
import {JsonController} from "../src/decorators/class/JsonController";
import {Route} from "../src/decorators/property/Route";
import {Body} from "../src/decorators/parameter/Body";
import {kyi} from "./utilities/create-kyi";
import {HttpStatus, HttpMethod} from "http-status-ts";
import {HttpError} from "../src/models/HttpError";

class Widget {
    name: string;
    color: string;
}

const testWidget: Widget = Object.assign<Widget, Widget>(new Widget(), {
    name: "Doodad",
    color: "Blue"
});

let expressApp: any;
let apiServer: HttpServer;

beforeAll((done) => {
    MetaController.clearMetadata();

    @JsonController("/error-test")
    class WidgetController {
        @Route(HttpMethod.GET, "/throw-sync-nodejs")
        throwSyncNodeJs(): void {
            throw new Error("sync error from nodejs");
        }

        @Route(HttpMethod.GET, "/throw-async-nodejs")
        async throwAsyncNodeJs(): Promise<void> {
            return new Promise<void>((resolve, reject) => {
                throw new Error("async error from nodejs");
            });
        }

        @Route(HttpMethod.GET, "/throw-sync-meta")
        throwSyncMeta(): void {
            throw new HttpError(HttpStatus.BAD_REQUEST, "sync error from meta-controller");
        }

        @Route(HttpMethod.GET, "/throw-async-meta")
        async throwAsyncMeta(): Promise<void> {
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
    apiServer.listen(4500, done);
});

afterAll((done) => apiServer.close(done));

test("sync from nodejs", async () => {
    expect.assertions(4);
    const response = await kyi("http://localhost:4500/error-test/throw-sync-nodejs", {method: "GET"});
    expect(response.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    const result = await response.json();
    expect(result.message).toEqual("sync error from nodejs");
    expect(result.stack).toBeDefined();
});

test("async from nodejs", async () => {
    expect.assertions(4);
    const response = await kyi("http://localhost:4500/error-test/throw-async-nodejs", {method: "GET"});
    expect(response.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    const result = await response.json();
    expect(result.message).toEqual("async error from nodejs");
    expect(result.stack).toBeDefined();
});

test("sync from meta-controller", async () => {
    expect.assertions(5);
    const response = await kyi("http://localhost:4500/error-test/throw-sync-meta", {method: "GET"});
    expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
    expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    const result = await response.json();
    expect(result.statusCode).toEqual(HttpStatus.BAD_REQUEST);
    expect(result.message).toEqual("sync error from meta-controller");
    expect(result.stack).toBeDefined();
});

test("async from meta-controller", async () => {
    expect.assertions(5);
    const response = await kyi("http://localhost:4500/error-test/throw-async-meta", {method: "GET"});
    expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
    expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    const result = await response.json();
    expect(result.statusCode).toEqual(HttpStatus.BAD_REQUEST);
    expect(result.message).toEqual("async error from meta-controller");
    expect(result.stack).toBeDefined();
});

test("bodyParser", async () => {
    expect.assertions(5);
    const response = await kyi("http://localhost:4500/error-test/body-parser", {
        method: "POST",
        body: "this is a test string",
        headers: {"Content-Type": "application/json"}
    });
    expect(response.status).toEqual(HttpStatus.BAD_REQUEST);
    expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    const result = await response.json();
    expect(result.statusCode).toEqual(HttpStatus.BAD_REQUEST);
    expect(result.message).toEqual("Unexpected token t in JSON at position 0");
    expect(result.stack).toBeDefined();
});
