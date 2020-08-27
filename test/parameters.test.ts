import express from "express";
import http, {Server as HttpServer} from "http";
import {MetaController} from "../src/MetaController";
import {JsonController} from "../src/decorators/class/JsonController";
import {CurrentUser} from "../src/decorators/parameter/CurrentUser";
import {HeaderParam} from "../src/decorators/parameter/HeaderParam";
import {Request} from "../src/decorators/parameter/Request";
import {Response} from "../src/decorators/parameter/Response";
import {Body} from "../src/decorators/parameter/Body";
import {IsNumber, IsString, IsValid, MetaValidator} from "meta-validator";
import {QueryParam} from "../src/decorators/parameter/QueryParam";
import {unifiedFetch} from "./utilities/unified-fetch";
import {Route} from "../src/decorators/property/Route";
import {Param} from "../src/decorators/parameter/Param";
import {HttpStatus, HttpMethod} from "http-status-ts";
import {UnifiedFetch} from "unified-fetch";

class User {
    userName: string;
}

const testUser: User = Object.assign<User, User>(new User(), {
    userName: "myusername"
});

MetaValidator.clearMetadata();

class Widget {
    @IsString()
    name: string;

    @IsNumber()
    model: number;

    @IsValid()
    isBlue: boolean;
}

const testWidget: Widget = Object.assign<Widget, Widget>(new Widget(), {
    name: "Doodad",
    model: 1234,
    isBlue: true
});

let expressApp: any;
let apiServer: HttpServer;

beforeAll((done) => {
    MetaController.clearMetadata();

    @JsonController("/parameters")
    class WidgetController {
        @Route(HttpMethod.POST, "/body")
        postWidget(@Body() widget: Widget): Widget {
            expect(widget).toBeInstanceOf(Widget);
            expect(widget).toEqual(testWidget);
            return testWidget;
        }

        @Route(HttpMethod.GET, "/current-user")
        getCurrentUser(@CurrentUser() currentUser: User): User {
            expect(currentUser).toEqual(testUser);
            return currentUser;
        }

        @Route(HttpMethod.GET, "/header-param")
        getHeaderParam(@HeaderParam("Host") host: string): Record<string, string> {
            return {host: host};
        }

        @Route(HttpMethod.GET, "/param/:id")
        getParam(@Param("id") id: number): Record<string, number> {
            expect(typeof id).toEqual("number");
            return {testParam: id};
        }

        @Route(HttpMethod.POST, "/query-param")
        postQueryParam(@QueryParam("test-param") testParam: string) {
            return {testParam: testParam};
        }

        @Route(HttpMethod.GET, "/request")
        getRequest(@Request() request: express.Request): boolean {
            return true;
        }

        @Route(HttpMethod.GET, "/response")
        getResponse(@Response() response: express.Response): boolean {
            return true;
        }
    }

    expressApp = express();
    MetaController.useExpressServer(expressApp, {
        isUseCors: true,
        controllerClassTypes: [
            WidgetController
        ],
        currentUserHandler: (request, response): User => {
            return testUser;
        }
    });
    apiServer = http.createServer(expressApp);
    apiServer.listen(4500, done);
});

afterAll((done) => apiServer.close(done));

test("@Body", async () => {
    expect.assertions(5);
    const myUnifiedFetch = new UnifiedFetch({
        prefixUrl: "http://localhost:4500"
    })
    const response = await myUnifiedFetch.post("/parameters/body", {
        json: testWidget,
    });
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    const result = await response.json();
    expect(result).toEqual(testWidget);
});

test("@CurrentUser", async () => {
    expect.assertions(4);
    const response = await unifiedFetch.get("/parameters/current-user");
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    const result = await response.json();
    expect(result).toEqual(testUser);
});

test("@HeaderParam", async () => {
    expect.assertions(3);
    const response = await unifiedFetch.get("/parameters/header-param");
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    const result = await response.json();
    expect(result).toEqual({"host": "localhost:4500"});
});

test("@Param", async () => {
    expect.assertions(4);
    const response = await unifiedFetch.get("/parameters/param/17");
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    const result = await response.json();
    expect(result).toEqual({"testParam": 17});
});

test("@QueryParam", async () => {
    expect.assertions(3);
    const response = await unifiedFetch.post("/parameters/query-param?test-param=this-is-a-test");
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    const result = await response.json();
    expect(result).toEqual({testParam: "this-is-a-test"});
});

test("@Request", async () => {
    expect.assertions(3);
    const response = await unifiedFetch.get("/parameters/request");
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    const result = await response.json();
    expect(result).toBeTruthy();
});

test("@Response", async () => {
    expect.assertions(3);
    const response = await unifiedFetch.get("/parameters/response");
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    const result = await response.json();
    expect(result).toBeTruthy();
});
