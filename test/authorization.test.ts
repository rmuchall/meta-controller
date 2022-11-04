import t from "tap";
import express, {Application} from "express";
import http, {Server as HttpServer} from "http";
import {MetaController} from "../src/MetaController.js";
import {JsonController} from "../src/decorators/class/JsonController.js";
import {Route} from "../src/decorators/property/Route.js";
import {Authorize} from "../src/decorators/class/Authorize.js";
import {HttpMethod, HttpStatus} from "http-status-ts";
import {CurrentUser} from "../src/index.js";

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

t.before(() => {
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
    apiServer.listen(4500);
});

t.teardown(() => {
    apiServer.close();
});

void t.test("authorized", async t => {
    const response = await fetch("http://localhost:4500/authorization/authorized", {method: HttpMethod.GET});
    t.equal(response.status, HttpStatus.OK);
    t.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
    const result = await response.json();
    t.same(result, testWidget);
});

void t.test("unauthorized", async t => {
    const response = await fetch("http://localhost:4500/authorization/unauthorized", {method: HttpMethod.GET});
    t.equal(response.status, HttpStatus.UNAUTHORIZED);
    t.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
    const result: any = await response.json();
    t.equal(result.statusCode, HttpStatus.UNAUTHORIZED);
    t.equal(result.message, "Unauthorized");
    t.not(result.stack, undefined);
});

void t.test("current user", async t => {
    const response = await fetch("http://localhost:4500/user/current-user", {method: HttpMethod.GET});
    t.equal(response.status, HttpStatus.OK);
    t.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
    const result = await response.json();
    t.same(result, testUser);
});
