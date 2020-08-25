import express from "express";
import http, {Server as HttpServer} from "http";
import {MetaController} from "../src/MetaController";
import {JsonController} from "../src/decorators/class/JsonController";
import {Route} from "../src/decorators/property/Route";
import {kyi} from "./utilities/create-kyi";
import {HttpStatus, HttpMethod} from "http-status-ts";

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

    @JsonController("/basic-test")
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

afterAll((done) => apiServer.close(done));

test("get no path", async () => {
    expect.assertions(3);
    const response = await kyi("http://localhost:4500/basic-test", {method: "GET"});
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    const result = await response.json();
    expect(result).toEqual(testWidget);
});

test("get with path", async () => {
    expect.assertions(3);
    const response = await kyi("http://localhost:4500/basic-test/with-path", {method: "GET"});
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    const result = await response.json();
    expect(result).toEqual(testWidget);
});

test("post no path", async () => {
    expect.assertions(3);
    const response = await kyi("http://localhost:4500/basic-test", {method: "POST"});
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    const result = await response.json();
    expect(result).toEqual(testWidget);
});

test("post with path", async () => {
    expect.assertions(3);
    const response = await kyi("http://localhost:4500/basic-test/with-path", {method: "POST"});
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    const result = await response.json();
    expect(result).toEqual(testWidget);
});
