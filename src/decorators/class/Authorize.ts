import {MetaController} from "../../MetaController.js";
import {AuthorizationContext} from "../../models/contexts/AuthorizationContext.js";

export function Authorize(roles?: string[]): ClassDecorator {
    return target => {
        MetaController.addMetadata(Object.assign<AuthorizationContext, AuthorizationContext>(new AuthorizationContext(), {
            // Metadata
            target: target,
            // Context
            className: target.name,
            roles: roles
        }));
    };
}
