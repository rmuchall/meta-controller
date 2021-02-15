import {MetaController} from "../../MetaController";
import {AuthorizationContext} from "../../models/contexts/AuthorizationContext";

export function Authorize(roles?: string[]): Function {
    return function(target: Function): Function | void {
        MetaController.addMetadata(Object.assign<AuthorizationContext, AuthorizationContext>(new AuthorizationContext(), {
            // Metadata
            target: target,
            // Context
            className: target.name,
            roles: roles
        }));
    }
}
