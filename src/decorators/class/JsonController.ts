import {MetaController} from "../../MetaController";
import {ControllerContext} from "../../models/contexts/ControllerContext";

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
