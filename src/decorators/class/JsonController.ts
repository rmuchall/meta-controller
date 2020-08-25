import {MetaController} from "../../MetaController";
import {ControllerContext} from "../../models/contexts/ControllerContext";

export function JsonController(baseRoute: string): Function {
    return function(target: Function): Function | void {
        MetaController.addMetadata(Object.assign<ControllerContext, ControllerContext>(new ControllerContext(), {
            // Metadata
            target: target,
            // Context
            className: target.name,
            baseRoute: baseRoute
        }));
    }
}
