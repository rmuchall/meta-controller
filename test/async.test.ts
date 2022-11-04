import t from "tap";
import express, {Application} from "express";
import http, {Server as HttpServer} from "http";
import {MetaController} from "../src/MetaController.js";
import {JsonController} from "../src/decorators/class/JsonController.js";
import {Route} from "../src/decorators/property/Route.js";
import {HttpStatus, HttpMethod} from "http-status-ts";

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

t.before(() => {
    MetaController.clearMetadata();

    @JsonController("/async")
    class WidgetController {
        @Route(HttpMethod.GET)
        getOne(): Promise<Widget> {
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
    apiServer.listen(4500);
});

t.teardown(() => {
    apiServer.close();
});

void t.test("async routes", async t => {
    const response = await fetch("http://localhost:4500/async", {method: HttpMethod.GET});
    t.equal(response.status, HttpStatus.OK);
    t.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
    const result = await response.json();
    t.same(result, testWidget);
});
