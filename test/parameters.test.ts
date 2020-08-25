import express, {Request as ExpressRequest, Response as ExpressResponse} from "express";
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
import {kyi} from "./utilities/create-kyi";
import {Route} from "../src/decorators/property/Route";
import {Param} from "../src/decorators/parameter/Param";
import {HttpStatus, HttpMethod} from "http-status-ts";

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

    @JsonController("/parameters-test")
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
        getRequest(@Request() request: ExpressRequest): boolean {
            return true;
        }

        @Route(HttpMethod.GET, "/response")
        getResponse(@Response() response: ExpressResponse): boolean {
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
    const response = await kyi("http://localhost:4500/parameters-test/body", {
        method: "POST",
        body: JSON.stringify(testWidget),
        headers: {"Content-Type": "application/json"}
    });
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    const result = await response.json();
    expect(result).toEqual(testWidget);
});

test("@CurrentUser", async () => {
    expect.assertions(4);
    const response = await kyi("http://localhost:4500/parameters-test/current-user", {method: "GET"});
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    const result = await response.json();
    expect(result).toEqual(testUser);
});

test("@HeaderParam", async () => {
    expect.assertions(3);
    const response = await kyi("http://localhost:4500/parameters-test/header-param", {method: "GET"});
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    const result = await response.json();
    expect(result).toEqual({"host": "localhost:4500"});
});

test("@Param", async () => {
    expect.assertions(4);
    const response = await kyi("http://localhost:4500/parameters-test/param/17", {method: "GET"});
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    const result = await response.json();
    expect(result).toEqual({"testParam": 17});
});

test("@QueryParam", async () => {
    expect.assertions(3);
    const response = await kyi("http://localhost:4500/parameters-test/query-param?test-param=this-is-a-test", {method: "POST"});
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    const result = await response.json();
    expect(result).toEqual({testParam: "this-is-a-test"});
});

test("@Request", async () => {
    expect.assertions(3);
    const response = await kyi("http://localhost:4500/parameters-test/request", {method: "GET"});
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    const result = await response.json();
    expect(result).toBeTruthy();
});

test("@Response", async () => {
    expect.assertions(3);
    const response = await kyi("http://localhost:4500/parameters-test/response", {method: "GET"});
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    const result = await response.json();
    expect(result).toBeTruthy();
});
