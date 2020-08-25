import {ControllerContext} from "./contexts/ControllerContext";
import {RouteContext} from "./contexts/RouteContext";
import {AuthorizationContext} from "./contexts/AuthorizationContext";
import {ParameterContext} from "./contexts/ParameterContext";

export class Metadata {
    controller: ControllerContext = new ControllerContext();
    routes: Record<string, RouteContext> = {};
    authorization?: AuthorizationContext;
    parameters: Record<string, ParameterContext[]> = {};
}
