import {ControllerContext} from "./contexts/ControllerContext.js";
import {RouteContext} from "./contexts/RouteContext.js";
import {AuthorizationContext} from "./contexts/AuthorizationContext.js";
import {ParameterContext} from "./contexts/ParameterContext.js";

export class Metadata {
    controller: ControllerContext = new ControllerContext();
    routes: Record<string, RouteContext> = {};
    authorization?: AuthorizationContext;
    parameters: Record<string, ParameterContext[]> = {};
}
