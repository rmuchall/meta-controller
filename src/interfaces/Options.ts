import {AuthorizationHandler, CurrentUserHandler, ErrorHandler, MiddlewareHandler} from "../utilities/handlers";
import {ClassType} from "meta-transformer";

export interface Options {
    routePrefix?: string;
    isUseCors?: boolean;
    controllerClassTypes: ClassType[];
    authorizationHandler?: AuthorizationHandler;
    currentUserHandler?: CurrentUserHandler;
    customErrorHandler?: ErrorHandler;
    globalMiddleware?: MiddlewareHandler[];
}
