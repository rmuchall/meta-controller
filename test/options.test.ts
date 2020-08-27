import express from "express";
import http, {Server as HttpServer} from "http";
import {MetaController} from "../src/MetaController";
import {JsonController} from "../src/decorators/class/JsonController";
import {Route} from "../src/decorators/property/Route";
import {unifiedFetch} from "./utilities/unified-fetch";
import {HttpStatus, HttpMethod} from "http-status-ts";
import {Request} from "../src/decorators/parameter/Request";

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
    }

    expressApp = express();
    MetaController.useExpressServer(expressApp, {
        routePrefix: "api",
        isUseCors: true,
        controllerClassTypes: [
            WidgetController
        ],
        customErrorHandler: (error, request, response, next) => {
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
    apiServer.listen(4500, done);
});

afterAll((done) => apiServer.close(done));

test("route prefix", async () => {
    expect.assertions(3);
    const response = await unifiedFetch.get("/api/options/route-prefix");
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    const result = await response.json();
    expect(result).toEqual(testWidget);
});

test("custom error handler", async () => {
    expect.assertions(3);
    const response = await unifiedFetch.get("/api/options/error-handler");
    expect(response.status).toEqual(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    const result = await response.json();
    expect(result).toEqual({customErrorHandler: true});
});

test("global middleware", async () => {
    const response = await unifiedFetch.get("/api/options/global-middleware");
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    const result = await response.json();
    expect(result.custom).toEqual("from global middleware");
});
