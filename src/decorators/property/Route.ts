import {MetaController} from "../../MetaController";
import {RouteContext} from "../../models/contexts/RouteContext";
import {HttpMethod} from "http-status-ts";

export function Route(httpMethod: HttpMethod, path?: string): PropertyDecorator {
    return (target, propertyKey) => {
        MetaController.addMetadata(Object.assign<RouteContext, RouteContext>(new RouteContext(), {
            // Metadata
            target: target,
            propertyKey: propertyKey.toString(),
            // Context
            className: target.constructor.name,
            httpMethod: httpMethod,
            path: path
        }));
    };
}
