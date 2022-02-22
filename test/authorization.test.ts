import express, {Application} from "express";
import http, {Server as HttpServer} from "http";
import {MetaController} from "../src/MetaController";
import {JsonController} from "../src/decorators/class/JsonController";
import {Route} from "../src/decorators/property/Route";
import {Authorize} from "../src/decorators/class/Authorize";
import {HttpMethod, HttpStatus} from "http-status-ts";
import nodeFetch from "node-fetch";
import {CurrentUser} from "../src/index";

class Widget {
    name: string;
    color: string;
}

const testWidget: Widget = Object.assign<Widget, Widget>(new Widget(), {
    name: "Doodad",
    color: "Blue"
});

class User {
    userName: string = "TestUser";
}

const testUser = new User();

let expressApp: Application;
let apiServer: HttpServer;

beforeAll((done) => {
    MetaController.clearMetadata();

    @Authorize(["AllowRole"])
    @JsonController("/authorization")
    class WidgetAllowController {
        @Route(HttpMethod.GET, "/authorized")
        getOne(): Widget {
            return testWidget;
        }
    }

    @Authorize(["RefuseRole"])
    @JsonController("/authorization")
    class WidgetDenyController {
        @Route(HttpMethod.GET, "/unauthorized")
        getOne(): Widget {
            return testWidget;
        }
    }

    @JsonController("/user")
    class WidgetUserController {
        @Route(HttpMethod.GET, "/current-user")
        getUser(@CurrentUser() currentUser: User): User {
            return currentUser;
        }
    }

    expressApp = express();
    MetaController.useExpressServer(expressApp, {
        isUseCors: true,
        controllerClassTypes: [
            WidgetAllowController,
            WidgetDenyController,
            WidgetUserController
        ],
        authorizationHandler: (request, response, roles): boolean => {
            if (roles) {
                return roles.includes("AllowRole");
            }

            return false;
        },
        currentUserHandler: (request, response) => {
            return testUser;
        }
    });
    apiServer = http.createServer(expressApp);
    apiServer.listen(4500, done);
});

afterAll(done => {
    apiServer.close();
    done();
});

test("authorized", async () => {
    expect.assertions(3);
    const response = await nodeFetch("http://localhost:4500/authorization/authorized", {method: HttpMethod.GET});
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    const result = await response.json();
    expect(result).toEqual(testWidget);
});

test("unauthorized", async () => {
    expect.assertions(5);
    const response = await nodeFetch("http://localhost:4500/authorization/unauthorized", {method: HttpMethod.GET});
    expect(response.status).toEqual(HttpStatus.UNAUTHORIZED);
    expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    const result: any = await response.json();
    expect(result.statusCode).toEqual(HttpStatus.UNAUTHORIZED);
    expect(result.message).toEqual("Unauthorized");
    expect(result.stack).toBeDefined();
});

test("current user", async () => {
    expect.assertions(3);
    const response = await nodeFetch("http://localhost:4500/user/current-user", {method: HttpMethod.GET});
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    const result = await response.json();
    expect(result).toEqual(testUser);
});
