![GitHub](https://img.shields.io/github/license/rmuchall/meta-controller)
![npm](https://img.shields.io/npm/v/meta-controller)

## What is meta-controller?
meta-controller is a library for creating NodeJs REST APIs using [TypeScript decorators](https://www.typescriptlang.org/docs/handbook/decorators.html). It is a wrapper for the popular [express](https://www.npmjs.com/package/express) framework. It's designed to be a lightweight alternative to [NestJs](https://www.npmjs.com/package/@nestjs/core). 

## Installation
Install the [meta-controller package](https://www.npmjs.com/package/meta-controller) from npm. <br/>
`npm install meta-controller`

## Basic Usage
Create a REST API controller by using the `JsonController(<route>)` decorator and define routes by using the `@Route(<http method>, <path>)` decorator.<br/> Routes can be synchronous or asynchronous. Route paramaters are automatically transformed ([meta-transformer](https://www.npmjs.com/package/meta-transformer)) and validated ([meta-validator](https://www.npmjs.com/package/meta-validator)). <br/>
```
@JsonController("/basic")
class WidgetController {
    @Route(HttpMethod.GET)
    get(): Widget {
        return testWidget;
    }
}

const expressApp = express();
MetaController.useExpressServer(expressApp, {
    isUseCors: true,
    controllerClassTypes: [
        WidgetController
    ]
});
apiServer = http.createServer(expressApp);
apiServer.listen(4500);
```

## Initialization
Pass an instance of [express](https://www.npmjs.com/package/express) to `MetaController.useExpressServer()` to initialize meta-controller. <br/>
```
const expressApp = express();
MetaController.useExpressServer(expressApp, {
    // options
});
```
The following initialization options are available. <br/>

| Option                                       | Description                                                                      | 
|----------------------------------------------|----------------------------------------------------------------------------------|
| isDebug?: boolean;                           | Log any errors to stdout                                                         |
| routePrefix?: string;                        | Add a global route prefix (e.g. /api)                                            | 
| isUseCors?: boolean;                         | Add CORS to all routes                                                           |
| isSaveRawBody?: boolean;                     | Add the raw body to the request object (request.rawBody)                         |
| controllerClassTypes: ClassType[];           | An array of class controllers that will be added as express routes)              |
| authorizationHandler?: AuthorizationHandler; | A user supplied function that determines if the request has been authorized      |
| currentUserHandler?: CurrentUserHandler;     | A user supplied function that retrieves the user (if any) of the current request |
| customErrorHandler?: ErrorHandler;           | A global custom error handler                                                    |
| globalMiddleware?: MiddlewareHandler[];      | Any optional global middleware                                                   |

## Route Parameters
Controllers may accept all standard REST type parameters. Parameters are automatically transformed or cast to the specified type.
### HTTP Request Body
```
@Route(HttpMethod.POST, "/body")
myRoute(@Body() widget: Widget) {
    // ... business logic
}
```
### Route Parameters
```
// Example: https://localhost/api/param/5
@Route(HttpMethod.GET, "/param/:id")
myRoute(@Param("id") id: number) {
    // ... business logic    
}
```
### Route Query Parameters
```
// Example: https://localhost/api/query-param?myQueryParam=test
@Route(HttpMethod.POST, "/query-param")
myRoute(@QueryParam("myQueryParam") myQueryParam: string) {
    // ... business logic    
}
```
### HTTP Request Headers
```
@Route(HttpMethod.GET, "/header-param")
myRoute(@HeaderParam("TestHeader") testHeader: string) {
    // ... business logic    
}
```

## Authorization
You can require authorization on a per-controller basis by specifying an `authorizationHandler()` and using the `@Authorization()` decorator. <br/>
```
const expressApp = express();
MetaController.useExpressServer(expressApp, {
    authorizationHandler: (request, response, roles): Promise<boolean> => {
        // ... business logic
        // Return true for authorized, false for unauthorized
        return Promise.resolve(true);
    }
});

@Authorize(["Admin"])
@JsonController("/secure")
class SecureController {
    @Route(HttpMethod.GET, "/protected-route")
    myRoute() {
        // ... business logic
    }
}
```
If you also add a `currentUserHandler()` you can inject the current user using the `CurrentUser()` decorator. <br/>
```
const expressApp = express();
MetaController.useExpressServer(expressApp, {
    authorizationHandler: (request, response, roles): Promise<boolean> => {
        // ... business logic
        // Return true for authorized, false for unauthorized
        return Promise.resolve(true);
    }
});

@Route(HttpMethod.GET, "/current-user")
getCurrentUser(@CurrentUser() currentUser: User): User {
    // ... business logic
}
```

## Error Handling
You can throw errors along with associated [HTTP error codes](https://github.com/rmuchall/http-status-ts). <br/>
```
@Authorize(["Admin"])
@JsonController("/secure")
class SecureController {
    @Route(HttpMethod.GET, "/protected-route")
    myRoute() {
        throw new HttpError(HttpStatus.UNAUTHORIZED, "Unauthorized request");
    }
}
```

If no HTTP error code is specified then meta-controller defaults to using HTTP status 500 (INTERNAL_SERVER_ERROR).<br />
```
@Route(HttpMethod.POST, "/body")
myRoute(@Body() widget: Widget) {
    // Returns HTTP status 500 - INTERNAL_SERVER_ERROR
    throw new Error("An unknown error occurred");
}
```

## Decorator Reference

| Decorator                     | Type      | Description                                          | 
|-------------------------------|-----------|------------------------------------------------------|
| @Authorize(<array of roles>)  | Class     | Controller requires authorization                    |
| @JsonController(<base route>) | Class     | Create a JSON controller                             |
| @Body()                       | Parameter | Inject a JSON body parameter                         |
| @CurrentUser()                | Parameter | Inject the current user                              |
| @EncodedJwtToken()            | Parameter | Inject the encoded JWT token string                  |
| @HeaderParam(<id>)            | Parameter | Inject a header from the HTTP request                |
| @Param(<id>)                  | Parameter | Inject a route parameter (e.g. /user/:id)            |
| @QueryParam(<id>)             | Parameter | Inject a query parameter (e.g. /route?my-param=test) |
| @Request()                    | Parameter | Inject the entire request object                     |
| @Response()                   | Parameter | Inject the entire response object                    |
| @Route(<http method, path>)   | Property  | Define a route on the controller                     |
