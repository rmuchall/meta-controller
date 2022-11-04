import t from "tap";
import express, {Application} from "express";
import http, {Server as HttpServer} from "http";
import {MetaController} from "../src/MetaController.js";
import {JsonController} from "../src/decorators/class/JsonController.js";
import {Route} from "../src/decorators/property/Route.js";
import {HttpStatus, HttpMethod} from "http-status-ts";
import {Request} from "../src/decorators/parameter/Request.js";

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

    @JsonController("/options")
    class WidgetController {
        @Route(HttpMethod.GET, "/route-prefix")
        routePrefix(): Widget {
            return testWidget;
        }

        @Route(HttpMethod.GET, "/error-handler")
        errorHandler(): void {
            throw new Error("test custom error handler");
        }

        @Route(HttpMethod.GET, "/global-middleware")
        globalMiddleware(@Request() request: express.Request): Record<string, any> {
            return {
                custom: (request as any).customProperty
            };
        }

        @Route(HttpMethod.POST, "/raw-body")
        testRawBody(@Request() request: express.Request): Record<string, any> {
            t.not((request as any).rawBody, undefined);
            return {
                isSuccess: true
            };
        }
    }

    expressApp = express();
    MetaController.useExpressServer(expressApp, {
        routePrefix: "api",
        isUseCors: true,
        isSaveRawBody: true,
        controllerClassTypes: [
            WidgetController
        ],
        customErrorHandler: (error, request, response, next) => {
            // console.error(error);
            response.status(500).send({customErrorHandler: true});
        },
        globalMiddleware: [
            (request, response, next) => {
                (request as any).customProperty = "from global middleware";
                next();
            }
        ]
    });
    apiServer = http.createServer(expressApp);
    apiServer.listen(4500);
});

t.teardown(() => {
    apiServer.close();
});

void t.test("route prefix", async t => {
    const response = await fetch("http://localhost:4500/api/options/route-prefix", {method: HttpMethod.GET});
    t.equal(response.status, HttpStatus.OK);
    t.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
    const result = await response.json();
    t.same(result, testWidget);
});

void t.test("custom error handler", async t => {
    const response = await fetch("http://localhost:4500/api/options/error-handler", {method: HttpMethod.GET});
    t.equal(response.status, HttpStatus.INTERNAL_SERVER_ERROR);
    t.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
    const result = await response.json();
    t.same(result, {customErrorHandler: true});
});

void t.test("global middleware", async t => {
    const response = await fetch("http://localhost:4500/api/options/global-middleware", {method: HttpMethod.GET});
    t.equal(response.status, HttpStatus.OK);
    t.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
    const result: any = await response.json();
    t.equal(result.custom, "from global middleware");
});

void t.test("raw body", async t => {
    const response = await fetch("http://localhost:4500/api/options/raw-body", {
        method: HttpMethod.POST,
        body: JSON.stringify({test: "this is a test"}),
        // raw body is only saved for json requests (because it uses express.json.verify)
        headers: {"content-type": "application/json; charset=utf-8"}
    });
    t.equal(response.status, HttpStatus.OK);
    t.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
    const result = await response.json() as Record<string, any>;
    t.ok(result["isSuccess"]);
});
