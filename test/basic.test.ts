import express, {Application} from "express";
import http, {Server as HttpServer} from "http";
import {MetaController} from "../src/MetaController";
import {JsonController} from "../src/decorators/class/JsonController";
import {Route} from "../src/decorators/property/Route";
import {HttpStatus, HttpMethod} from "http-status-ts";
import nodeFetch from "node-fetch";

class Widget {
    name: string;
    color: string;
}

const testWidget: Widget = Object.assign<Widget, Widget>(new Widget(), {
    name: "Doodad",
    color: "Blue"
});

let expressApp: Application;
let apiServer: HttpServer;

beforeAll((done) => {
    MetaController.clearMetadata();

    @JsonController("/basic")
    class WidgetController {
        @Route(HttpMethod.GET)
        get(): Widget {
            return testWidget;
        }

        @Route(HttpMethod.GET, "/with-path")
        getWithPath(): Widget {
            return testWidget;
        }

        @Route(HttpMethod.POST)
        post(): Widget {
            return testWidget;
        }

        @Route(HttpMethod.POST, "/with-path")
        postWithPath(): Widget {
            return testWidget;
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

test("get no path", async () => {
    expect.assertions(3);
    const response = await nodeFetch("http://localhost:4500/basic", {method: HttpMethod.GET});
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    const result = await response.json();
    expect(result).toEqual(testWidget);
});

test("get with path", async () => {
    expect.assertions(3);
    const response = await nodeFetch("http://localhost:4500/basic/with-path", {method: HttpMethod.GET});
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    const result = await response.json();
    expect(result).toEqual(testWidget);
});

test("post no path", async () => {
    expect.assertions(3);
    const response = await nodeFetch("http://localhost:4500/basic", {method: HttpMethod.POST});
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    const result = await response.json();
    expect(result).toEqual(testWidget);
});

test("post with path", async () => {
    expect.assertions(3);
    const response = await nodeFetch("http://localhost:4500/basic/with-path", {method: HttpMethod.POST});
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    const result = await response.json();
    expect(result).toEqual(testWidget);
});
