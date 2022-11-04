import {AuthorizationHandler, CurrentUserHandler, ErrorHandler, MiddlewareHandler} from "../utilities/handlers.js";
import {ClassType} from "meta-transformer";

export interface Options {
    isDebug?: boolean;
    routePrefix?: string;
    isUseCors?: boolean;
    isSaveRawBody?: boolean;
    controllerClassTypes: ClassType[];
    authorizationHandler?: AuthorizationHandler;
    currentUserHandler?: CurrentUserHandler;
    customErrorHandler?: ErrorHandler;
    globalMiddleware?: MiddlewareHandler[];
}
