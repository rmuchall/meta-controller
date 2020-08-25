import {HttpMethod} from "http-status-ts";

export class RouteContext {
    // Metadata
    target: Object;
    propertyKey: string;
    // Context
    className: string;
    httpMethod: HttpMethod;
    path?: string;
}
