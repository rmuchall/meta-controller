import express from "express";
import http, {Server as HttpServer} from "http";
import {MetaController} from "../src/MetaController";
import {JsonController} from "../src/decorators/class/JsonController";
import {Route} from "../src/decorators/property/Route";
import {Authorize} from "../src/decorators/class/Authorize";
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

    @Authorize(["AllowRole"])
    @JsonController("/authorization-test")
    class WidgetAllowController {
        @Route(HttpMethod.GET, "/authorized")
        getOne(): Widget {
            return testWidget;
        }
    }

    @Authorize(["RefuseRole"])
    @JsonController("/authorization-test")
    class WidgetDenyController {
        @Route(HttpMethod.GET, "/unauthorized")
        getOne(): Widget {
            return testWidget;
        }
    }

    expressApp = express();
    MetaController.useExpressServer(expressApp, {
        isUseCors: true,
        controllerClassTypes: [
            WidgetAllowController,
            WidgetDenyController
        ],
        authorizationHandler: (request, response, roles): Promise<boolean> => {
            return Promise.resolve(roles.includes("AllowRole"));
        }
    });
    apiServer = http.createServer(expressApp);
    apiServer.listen(4500, done);
});

afterAll((done) => apiServer.close(done));

test("authorized", async () => {
    expect.assertions(3);
    const response = await kyi("http://localhost:4500/authorization-test/authorized", {method: "GET"});
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    const result = await response.json();
    expect(result).toEqual(testWidget);
});

test("unauthorized", async () => {
    expect.assertions(5);
    const response = await kyi("http://localhost:4500/authorization-test/unauthorized", {method: "GET", throwHttpErrors: false});
    expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
    expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    const result = await response.json();
    expect(result.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
    expect(result.message).toEqual("Unauthorized");
    expect(result.stack).toBeDefined();
});
