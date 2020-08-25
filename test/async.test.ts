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

    @JsonController("/async-test")
    class WidgetController {
        @Route(HttpMethod.GET)
        async getOne(): Promise<Widget> {
            return Promise.resolve(testWidget);
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

test("async routes", async () => {
    expect.assertions(3);
    const response = await kyi("http://localhost:4500/async-test", {method: "GET"});
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    const result = await response.json();
    expect(result).toEqual(testWidget);
});
