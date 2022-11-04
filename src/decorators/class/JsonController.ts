import {MetaController} from "../../MetaController.js";
import {ControllerContext} from "../../models/contexts/ControllerContext.js";

export function JsonController(baseRoute: string): ClassDecorator {
    return target => {
        MetaController.addMetadata(Object.assign<ControllerContext, ControllerContext>(new ControllerContext(), {
            // Metadata
            target: target,
            // Context
            className: target.name,
            baseRoute: baseRoute
        }));
    };
}
