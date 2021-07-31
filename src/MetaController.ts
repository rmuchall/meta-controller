import "reflect-metadata";
import {ControllerContext} from "./models/contexts/ControllerContext";
import {RouteContext} from "./models/contexts/RouteContext";
import {Metadata} from "./models/Metadata";
import {Options} from "./interfaces/Options";
import {AuthorizationContext} from "./models/contexts/AuthorizationContext";
import express, {Application} from "express";
import {ParameterContext} from "./models/contexts/ParameterContext";
import {ParameterType} from "./enums/ParameterType";
import {ClassType, MetaTransformer} from "meta-transformer";
import {MetaValidator, ValidationErrors} from "meta-validator";
import {HttpError} from "./models/HttpError";
import cors from "cors";
import {HttpStatus} from "http-status-ts";
import {stripDuplicateSlashes} from "./utilities/string-utils";
import {ErrorHandler} from "./utilities/handlers";

export abstract class MetaController {
    private static metadata: Record<string, Metadata> = {};
    private static controllers: Record<string, Record<string, any>> = {};
    private static options: Options;

    static useExpressServer(expressApp: Application, options: Options): void {
        for (const classType of options.controllerClassTypes) {
            MetaController.controllers[classType.name] = new classType();
        }

        // Set options
        MetaController.options = options;
        expressApp.use(express.json());

        if (options.isUseCors) {
            expressApp.use(cors());
        }

        // Register any global middleware
        if (options.globalMiddleware) {
            for (const middleware of options.globalMiddleware) {
                expressApp.use(middleware);
            }
        }

        // Register routes
        MetaController.registerRoutes(expressApp);

        // Add json 404 handler
        expressApp.use((request: express.Request, response: express.Response, next: express.NextFunction) => {
            response.status(HttpStatus.NOT_FOUND).send({message: "Route not found"});
        });

        // Set custom error handler (this must be registered last)
        if (options.customErrorHandler) {
            expressApp.use(MetaController.options.customErrorHandler as ErrorHandler);
        } else {
            expressApp.use(MetaController.defaultErrorHandler);
        }
    }

    private static registerRoutes(expressApp: any) {
        for (const className of Object.keys(MetaController.metadata)) {
            const classMetadata: Metadata = MetaController.metadata[className];

            // Skip any controllerClassTypes not specified in the options
            if (!MetaController.controllers[className]) {
                continue;
            }

            if (!classMetadata.controller) {
                throw new Error("No controller found");
            }

            if (!classMetadata.routes) {
                throw new Error("No routes found for controller");
            }

            // Iterate through routes
            const pathArray: string[] = [];
            for (const propertyKey of Object.keys(classMetadata.routes)) {
                // Normalize complete route path
                const prefixPath = MetaController.options.routePrefix ? MetaController.options.routePrefix : "";
                const controllerPath = classMetadata.controller.baseRoute;
                const routePath = classMetadata.routes[propertyKey].path ? classMetadata.routes[propertyKey].path : "";
                const normalizedPath: string = stripDuplicateSlashes(`/${prefixPath}/${controllerPath}/${routePath}`.toLowerCase());

                // Check for duplicate paths
                if (pathArray.includes(`${classMetadata.routes[propertyKey].httpMethod.toLowerCase()}/${normalizedPath}`)) {
                    throw new Error("Duplicate express paths found");
                } else {
                    pathArray.push(`${classMetadata.routes[propertyKey].httpMethod.toLowerCase()}/${normalizedPath}`);
                }

                // Create Express route handler
                const expressRouteHandler = (request: express.Request, response: express.Response, next: express.NextFunction): void => {
                    try {
                        MetaController.handleAuthorization(request, response, classMetadata.authorization)
                            .then(() => MetaController.handleParameters(request, response, classMetadata.parameters[propertyKey]))
                            .then((parameters) => MetaController.handleResult(request, response, next, classMetadata.routes[propertyKey], parameters))
                            .catch(error => {
                                // Catch async errors
                                next(error);
                            });
                    } catch (error) {
                        // Catch sync errors
                        next(error);
                    }
                };

                // Register Express route handler
                expressApp[classMetadata.routes[propertyKey].httpMethod.toLowerCase()](normalizedPath, expressRouteHandler);
            }
        }
    }

    static addMetadata(context: AuthorizationContext | ControllerContext | RouteContext | ParameterContext): void {
        if (!MetaController.metadata[context.className]) {
            MetaController.metadata[context.className] = new Metadata();
        }

        const classMetadata: Metadata = MetaController.metadata[context.className];
        switch (context.constructor) {
            case AuthorizationContext:
                classMetadata.authorization = context as AuthorizationContext;
                break;
            case ControllerContext:
                classMetadata.controller = context as ControllerContext;
                break;
            case RouteContext:
                classMetadata.routes[(context as RouteContext).propertyKey] = context as RouteContext;
                break;
            case ParameterContext:
                if (!classMetadata.parameters[(context as ParameterContext).propertyKey]) {
                    classMetadata.parameters[(context as ParameterContext).propertyKey] = [];
                }

                classMetadata.parameters[(context as ParameterContext).propertyKey].push(context as ParameterContext);
                break;
            default:
                throw new Error("Invalid context type");
        }
    }

    static clearMetadata(): void {
        MetaController.metadata = {};
        MetaController.controllers = {};
    }

    static extractJwtTokenFromHeader(authorizationHeader?: string): string {
        // No header
        if (!authorizationHeader) {
            throw new HttpError(HttpStatus.UNAUTHORIZED, "No authorization header found");
        }

        // Slice Bearer for case-insensitive search
        const slicedHeader = authorizationHeader.slice(0, 7);

        // No bearer
        if (slicedHeader.search(new RegExp("Bearer", "i")) === -1) {
            throw new HttpError(HttpStatus.UNAUTHORIZED, "No bearer found");
        }

        // Extract token
        const encodedJwtToken = authorizationHeader.split(slicedHeader).pop();
        if (!encodedJwtToken) {
            throw new HttpError(HttpStatus.UNAUTHORIZED, "No JWT token found");
        }

        return encodedJwtToken;
    }

    private static handleAuthorization(request: express.Request, response: express.Response, authorizationContext?: AuthorizationContext): Promise<void> {
        if (authorizationContext) {
            if (!MetaController.options.authorizationHandler || typeof MetaController.options.authorizationHandler !== "function") {
                throw new Error("No authorization handler specified");
            }

            return Promise.resolve(MetaController.options.authorizationHandler(request, response, authorizationContext.roles))
                .then(isAuthorized => {
                    if (!isAuthorized) {
                        throw new HttpError(HttpStatus.UNAUTHORIZED, "Unauthorized");
                    }
                });
        }

        return Promise.resolve();
    }

    private static handleResult(request: express.Request, response: express.Response, next: express.NextFunction, routeContext: RouteContext, parameters?: ParameterContext[]): Promise<void> {
        return Promise.resolve(parameters ?
            MetaController.controllers[routeContext.className][routeContext.propertyKey](...parameters) :
            MetaController.controllers[routeContext.className][routeContext.propertyKey]()).then(result => {
            response.send(result);
            // Do not call next - this is the final handler
            // next();
        });
    }

    private static async handleParameters(request: express.Request, response: express.Response, parameterMetadata: ParameterContext[] | undefined): Promise<any[] | undefined> {
        if (!parameterMetadata) {
            return Promise.resolve(undefined);
        }

        let reflectedTypes: ClassType[];
        let transformedObject: any;
        let validationErrors: ValidationErrors[];
        let encodedJwtToken: string;
        const parameterHandlers: Promise<any>[] = [];
        for (const context of parameterMetadata) {
            switch (context.type) {
                case ParameterType.Body:
                    if (!request.body) {
                        throw new HttpError(HttpStatus.BAD_REQUEST, "Invalid request.body");
                    }

                    // Transform
                    reflectedTypes = Reflect.getMetadata("design:paramtypes", context.target, context.propertyKey);
                    transformedObject = MetaTransformer.toClass(reflectedTypes[context.parameterIndex], request.body);
                    // Validate
                    validationErrors = await new MetaValidator().validate(transformedObject);
                    if (Object.keys(validationErrors).length > 0) {
                        throw new HttpError(HttpStatus.BAD_REQUEST, "Failed validation", validationErrors);
                    }

                    parameterHandlers.splice(context.parameterIndex, 0, Promise.resolve(transformedObject));
                    break;
                case ParameterType.CurrentUser:
                    if (!MetaController.options.currentUserHandler || typeof MetaController.options.currentUserHandler !== "function") {
                        throw new Error("Invalid currentUser handler");
                    }

                    parameterHandlers.splice(context.parameterIndex, 0, MetaController.options.currentUserHandler(request, response));
                    break;
                case ParameterType.EncodedJwtToken:
                    encodedJwtToken = MetaController.extractJwtTokenFromHeader(request.header("Authorization"));
                    parameterHandlers.splice(context.parameterIndex, 0, Promise.resolve(encodedJwtToken));
                    break;
                case ParameterType.HeaderParam:
                    if (!request.header(context.parameters[0])) {
                        throw new HttpError(HttpStatus.BAD_REQUEST, "Header does not exist");
                    }
                    parameterHandlers.splice(context.parameterIndex, 0, Promise.resolve(request.header(context.parameters[0])));
                    break;
                case ParameterType.Param:
                    if (!request.params[context.parameters[0]]) {
                        throw new HttpError(HttpStatus.BAD_REQUEST, "Parameter does not exist");
                    }
                    parameterHandlers.splice(context.parameterIndex, 0, Promise.resolve(JSON.parse(request.params[context.parameters[0]])));
                    break;
                case ParameterType.QueryParam:
                    if (!request.query[context.parameters[0]]) {
                        throw new HttpError(HttpStatus.BAD_REQUEST, "Query parameter does not exist");
                    }
                    parameterHandlers.splice(context.parameterIndex, 0, Promise.resolve(request.query[context.parameters[0]]));
                    break;
                case ParameterType.Request:
                    parameterHandlers.splice(context.parameterIndex, 0, Promise.resolve(request));
                    break;
                case ParameterType.Response:
                    parameterHandlers.splice(context.parameterIndex, 0, Promise.resolve(response));
                    break;
                default:
                    throw new Error("Invalid ParameterType");
            }
        }

        return Promise.all(parameterHandlers);
    }

    private static defaultErrorHandler(error: any, request: express.Request, response: express.Response, next: express.NextFunction): void {
        if (MetaController.options.isDebug) {
            console.error(error);
        }

        if (error.statusCode) {
            response.status(error.statusCode);
        } else {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR);
        }

        response.send({
            statusCode: error.statusCode ? error.statusCode : HttpStatus.INTERNAL_SERVER_ERROR,
            message: error.message ? error.message : "Unknown error",
            validationErrors: error.validationErrors,
            stack: error.stack
        });
    }
}
