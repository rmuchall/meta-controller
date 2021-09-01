import express, {Application} from "express";
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
import {Route} from "../src/decorators/property/Route";
import {Param} from "../src/decorators/parameter/Param";
import {HttpMethod, HttpStatus} from "http-status-ts";
import nodeFetch from "node-fetch";
import {stringify} from "querystring";
import {EncodedJwtToken} from "../src/decorators/parameter/EncodedJwtToken";

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

let expressApp: Application;
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
            expect(currentUser).toBeInstanceOf(User);
            expect(currentUser).toEqual(testUser);
            return currentUser;
        }

        @Route(HttpMethod.GET, "/encoded-jwt-token")
        extractJwtToken(@EncodedJwtToken() encodedJwtToken: string): Record<string, string> {
            return {encodedJwtToken: encodedJwtToken};
        }

        @Route(HttpMethod.GET, "/header-param")
        getHeaderParam(@HeaderParam("TestHeader") testHeader: string): Record<string, string> {
            return {testHeader: testHeader};
        }

        @Route(HttpMethod.GET, "/param-number/:id")
        getParamNumber(@Param("id") id: number): Record<string, number> {
            expect(typeof id).toEqual("number");
            return {testParam: id};
        }

        @Route(HttpMethod.GET, "/param-string/:id")
        getParamString(@Param("id") id: string): Record<string, string> {
            expect(typeof id).toEqual("string");
            return {testParam: id};
        }

        @Route(HttpMethod.GET, "/param-boolean/:id")
        getParamBoolean(@Param("id") id: boolean): Record<string, boolean> {
            expect(typeof id).toEqual("boolean");
            return {testParam: id};
        }

        @Route(HttpMethod.POST, "/query-param-number")
        postQueryParamNumber(@QueryParam("testParam") testParam: number) {
            expect(typeof testParam).toEqual("number");
            return {testParam: testParam};
        }

        @Route(HttpMethod.POST, "/query-param-string")
        postQueryParamString(@QueryParam("testParam") testParam: string) {
            expect(typeof testParam).toEqual("string");
            return {testParam: testParam};
        }

        @Route(HttpMethod.POST, "/query-param-boolean")
        postQueryParamBoolean(@QueryParam("testParam") testParam: boolean) {
            expect(typeof testParam).toEqual("boolean");
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

        @Route(HttpMethod.POST, "/multiple")
        getMultiple(@CurrentUser() currentUser: User, @EncodedJwtToken() encodedJwtToken: string, @Body() widget: Widget) {
            expect(currentUser).toBeInstanceOf(User);
            expect(currentUser).toEqual(testUser);
            expect(encodedJwtToken).toEqual("this-is-an-encoded-jwt-token");
            expect(widget).toBeInstanceOf(Widget);
            expect(widget).toEqual(testWidget);
            return true;
        }
    }

    expressApp = express();
    MetaController.useExpressServer(expressApp, {
        isDebug: true,
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

afterAll(done => {
    apiServer.close();
    done();
});

test("@Body", async () => {
    expect.assertions(5);
    const response = await nodeFetch("http://localhost:4500/parameters/body", {
        method: HttpMethod.POST,
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(testWidget),
    });
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    const result = await response.json();
    expect(result).toEqual(testWidget);
});

test("@CurrentUser", async () => {
    expect.assertions(5);
    const response = await nodeFetch("http://localhost:4500/parameters/current-user", {method: HttpMethod.GET});
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    const result = await response.json();
    expect(result).toEqual(testUser);
});

test("@EncodedJwtToken", async () => {
    expect.assertions(3);
    const response = await nodeFetch("http://localhost:4500/parameters/encoded-jwt-token", {
        method: HttpMethod.GET,
        headers: {
            Authorization: "Bearer this-is-an-encoded-jwt-token"
        }
    });
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    const result = await response.json();
    expect(result).toEqual({"encodedJwtToken": "this-is-an-encoded-jwt-token"});
});

test("@HeaderParam", async () => {
    expect.assertions(3);
    const response = await nodeFetch("http://localhost:4500/parameters/header-param", {
        method: HttpMethod.GET,
        headers: {
            TestHeader: "this-is-a-test-header"
        }
    });
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    const result = await response.json();
    expect(result).toEqual({"testHeader": "this-is-a-test-header"});
});

test("@Param - number", async () => {
    expect.assertions(4);
    const response = await nodeFetch("http://localhost:4500/parameters/param-number/17", {method: HttpMethod.GET});
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    const result = await response.json();
    expect(result).toEqual({"testParam": 17});
});

test("@Param - string", async () => {
    expect.assertions(4);
    const response = await nodeFetch("http://localhost:4500/parameters/param-string/e120ba97-47bd-46fa-a53f-5aea6cd889da", {method: HttpMethod.GET});
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    const result = await response.json();
    expect(result).toEqual({"testParam": "e120ba97-47bd-46fa-a53f-5aea6cd889da"});
});

test("@Param - boolean", async () => {
    expect.assertions(4);
    const response = await nodeFetch("http://localhost:4500/parameters/param-boolean/true", {method: HttpMethod.GET});
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    const result = await response.json();
    expect(result).toEqual({"testParam": true});
});

test("@QueryParam - number", async () => {
    expect.assertions(4);
    const queryString = stringify({
        testParam: 123
    });
    const response = await nodeFetch(`http://localhost:4500/parameters/query-param-number?${queryString}`, {method: HttpMethod.POST});
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    const result = await response.json();
    expect(result).toEqual({testParam: 123});
});

test("@QueryParam - string", async () => {
    expect.assertions(4);
    const queryString = stringify({
        testParam: "e120ba97-47bd-46fa-a53f-5aea6cd889da"
    });
    const response = await nodeFetch(`http://localhost:4500/parameters/query-param-string?${queryString}`, {method: HttpMethod.POST});
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    const result = await response.json();
    expect(result).toEqual({testParam: "e120ba97-47bd-46fa-a53f-5aea6cd889da"});
});

test("@QueryParam - boolean", async () => {
    expect.assertions(4);
    const queryString = stringify({
        testParam: true
    });
    const response = await nodeFetch(`http://localhost:4500/parameters/query-param-boolean?${queryString}`, {method: HttpMethod.POST});
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    const result = await response.json();
    expect(result).toEqual({testParam: true});
});

test("@Request", async () => {
    expect.assertions(3);
    const response = await nodeFetch("http://localhost:4500/parameters/request", {method: HttpMethod.GET});
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    const result = await response.json();
    expect(result).toBeTruthy();
});

test("@Response", async () => {
    expect.assertions(3);
    const response = await nodeFetch("http://localhost:4500/parameters/response", {method: HttpMethod.GET});
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    const result = await response.json();
    expect(result).toBeTruthy();
});

test("Multiple", async () => {
    expect.assertions(8);
    const response = await nodeFetch("http://localhost:4500/parameters/multiple", {
        method: HttpMethod.POST,
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer this-is-an-encoded-jwt-token",
        },
        body: JSON.stringify(testWidget),
    });
    expect(response.status).toEqual(HttpStatus.OK);
    expect(response.headers.get("content-type")).toEqual("application/json; charset=utf-8");
    const result = await response.json();
    expect(result).toBeTruthy();
});
