import t from "tap";
import express, {Application} from "express";
import http, {Server as HttpServer} from "http";
import {MetaController} from "../src/MetaController.js";
import {JsonController} from "../src/decorators/class/JsonController.js";
import {CurrentUser} from "../src/decorators/parameter/CurrentUser.js";
import {HeaderParam} from "../src/decorators/parameter/HeaderParam.js";
import {Request} from "../src/decorators/parameter/Request.js";
import {Response} from "../src/decorators/parameter/Response.js";
import {Body} from "../src/decorators/parameter/Body.js";
import {IsNumber, IsString, IsValid, MetaValidator} from "meta-validator";
import {QueryParam} from "../src/decorators/parameter/QueryParam.js";
import {Route} from "../src/decorators/property/Route.js";
import {Param} from "../src/decorators/parameter/Param.js";
import {HttpMethod, HttpStatus} from "http-status-ts";
import {stringify} from "querystring";
import {EncodedJwtToken} from "../src/decorators/parameter/EncodedJwtToken.js";

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

t.before(() => {
    MetaController.clearMetadata();

    @JsonController("/parameters")
    class WidgetController {
        @Route(HttpMethod.POST, "/body")
        postWidget(@Body() widget: Widget): Widget {
            t.type(widget, Widget);
            t.strictSame(widget, testWidget);
            return testWidget;
        }

        @Route(HttpMethod.GET, "/current-user")
        getCurrentUser(@CurrentUser() currentUser: User): User {
            t.type(currentUser, User);
            t.strictSame(currentUser, testUser);
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

        @Route(HttpMethod.GET, "/param-camel/:camelCasedId")
        getParamCamel(@Param("camelCasedId") id: number): Record<string, number> {
            t.type(id, "number");
            return {camelCasedParam: id};
        }

        @Route(HttpMethod.GET, "/param-number/:id")
        getParamNumber(@Param("id") id: number): Record<string, number> {
            t.type(id, "number");
            return {param: id};
        }

        @Route(HttpMethod.GET, "/param-string/:id")
        getParamString(@Param("id") id: string): Record<string, string> {
            t.type(id, "string");
            return {param: id};
        }

        @Route(HttpMethod.GET, "/param-boolean/:id")
        getParamBoolean(@Param("id") id: boolean): Record<string, boolean> {
            t.type(id, "boolean");
            return {param: id};
        }

        @Route(HttpMethod.POST, "/query-param-camel")
        postQueryParamCamel(@QueryParam("camelCasedParam") camelCasedParam: number) {
            t.type(camelCasedParam, "number");
            return {camelCasedParam: camelCasedParam};
        }

        @Route(HttpMethod.POST, "/query-param-number")
        postQueryParamNumber(@QueryParam("param") param: number) {
            t.type(param, "number");
            return {param: param};
        }

        @Route(HttpMethod.POST, "/query-param-string")
        postQueryParamString(@QueryParam("param") param: string) {
            t.type(param, "string");
            return {param: param};
        }

        @Route(HttpMethod.POST, "/query-param-boolean")
        postQueryParamBoolean(@QueryParam("param") param: boolean) {
            t.type(param, "boolean");
            return {param: param};
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
            t.type(currentUser, User);
            t.strictSame(currentUser, testUser);
            t.equal(encodedJwtToken, "this-is-an-encoded-jwt-token");
            t.type(widget, Widget);
            t.strictSame(widget, testWidget);
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
    apiServer.listen(4500);
});

t.teardown(() => {
    apiServer.close();
});

void t.test("@Body", async t => {
    const response = await fetch("http://localhost:4500/parameters/body", {
        method: HttpMethod.POST,
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(testWidget),
    });
    t.equal(response.status, HttpStatus.OK);
    t.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
    const result = await response.json();
    t.same(result, testWidget);
});

void t.test("@CurrentUser", async t => {
    const response = await fetch("http://localhost:4500/parameters/current-user", {method: HttpMethod.GET});
    t.equal(response.status, HttpStatus.OK);
    t.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
    const result = await response.json();
    t.same(result, testUser);
});

void t.test("@EncodedJwtToken", async t => {
    const response = await fetch("http://localhost:4500/parameters/encoded-jwt-token", {
        method: HttpMethod.GET,
        headers: {
            Authorization: "Bearer this-is-an-encoded-jwt-token"
        }
    });
    t.equal(response.status, HttpStatus.OK);
    t.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
    const result = await response.json();
    t.same(result, {"encodedJwtToken": "this-is-an-encoded-jwt-token"});
});

void t.test("@HeaderParam", async t => {
    const response = await fetch("http://localhost:4500/parameters/header-param", {
        method: HttpMethod.GET,
        headers: {
            TestHeader: "this-is-a-test-header"
        }
    });
    t.equal(response.status, HttpStatus.OK);
    t.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
    const result = await response.json();
    t.same(result, {"testHeader": "this-is-a-test-header"});
});

void t.test("@Param - camel case", async t => {
    const response = await fetch("http://localhost:4500/parameters/param-camel/17", {method: HttpMethod.GET});
    t.equal(response.status, HttpStatus.OK);
    t.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
    const result = await response.json();
    t.same(result, {"camelCasedParam": 17});
});

void t.test("@Param - number", async t => {
    const response = await fetch("http://localhost:4500/parameters/param-number/17", {method: HttpMethod.GET});
    t.equal(response.status, HttpStatus.OK);
    t.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
    const result = await response.json();
    t.same(result, {"param": 17});
});

void t.test("@Param - string", async t => {
    const response = await fetch("http://localhost:4500/parameters/param-string/e120ba97-47bd-46fa-a53f-5aea6cd889da", {method: HttpMethod.GET});
    t.equal(response.status, HttpStatus.OK);
    t.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
    const result = await response.json();
    t.same(result, {"param": "e120ba97-47bd-46fa-a53f-5aea6cd889da"});
});

void t.test("@Param - boolean", async t => {
    const response = await fetch("http://localhost:4500/parameters/param-boolean/true", {method: HttpMethod.GET});
    t.equal(response.status, HttpStatus.OK);
    t.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
    const result = await response.json();
    t.same(result, {"param": true});
});

void t.test("@QueryParam - camel case", async t => {
    const queryString = stringify({
        camelCasedParam: 123
    });
    const response = await fetch(`http://localhost:4500/parameters/query-param-camel?${queryString}`, {method: HttpMethod.POST});
    t.equal(response.status, HttpStatus.OK);
    t.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
    const result = await response.json();
    t.same(result, {camelCasedParam: 123});
});

void t.test("@QueryParam - number", async t => {
    const queryString = stringify({
        param: 123
    });
    const response = await fetch(`http://localhost:4500/parameters/query-param-number?${queryString}`, {method: HttpMethod.POST});
    t.equal(response.status, HttpStatus.OK);
    t.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
    const result = await response.json();
    t.same(result, {param: 123});
});

void t.test("@QueryParam - string", async t => {
    const queryString = stringify({
        param: "e120ba97-47bd-46fa-a53f-5aea6cd889da"
    });
    const response = await fetch(`http://localhost:4500/parameters/query-param-string?${queryString}`, {method: HttpMethod.POST});
    t.equal(response.status, HttpStatus.OK);
    t.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
    const result = await response.json();
    t.same(result, {param: "e120ba97-47bd-46fa-a53f-5aea6cd889da"});
});

void t.test("@QueryParam - boolean", async t => {
    const queryString = stringify({
        param: true
    });
    const response = await fetch(`http://localhost:4500/parameters/query-param-boolean?${queryString}`, {method: HttpMethod.POST});
    t.equal(response.status, HttpStatus.OK);
    t.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
    const result = await response.json();
    t.same(result, {param: true});
});

void t.test("@Request", async t => {
    const response = await fetch("http://localhost:4500/parameters/request", {method: HttpMethod.GET});
    t.equal(response.status, HttpStatus.OK);
    t.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
    const result = await response.json();
    t.ok(result);
});

void t.test("@Response", async t => {
    const response = await fetch("http://localhost:4500/parameters/response", {method: HttpMethod.GET});
    t.equal(response.status, HttpStatus.OK);
    t.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
    const result = await response.json();
    t.ok(result);
});

void t.test("Multiple", async t => {
    const response = await fetch("http://localhost:4500/parameters/multiple", {
        method: HttpMethod.POST,
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer this-is-an-encoded-jwt-token",
        },
        body: JSON.stringify(testWidget),
    });
    t.equal(response.status, HttpStatus.OK);
    t.equal(response.headers.get("content-type"), "application/json; charset=utf-8");
    const result = await response.json();
    t.ok(result);
});
