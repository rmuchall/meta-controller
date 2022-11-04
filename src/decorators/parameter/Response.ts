import {MetaController} from "../../MetaController.js";
import {ParameterContext} from "../../models/contexts/ParameterContext.js";
import {ParameterType} from "../../enums/ParameterType.js";

export function Response(): ParameterDecorator {
    return (target, propertyKey, parameterIndex) => {
        MetaController.addMetadata(Object.assign<ParameterContext, ParameterContext>(new ParameterContext(), {
            // Metadata
            target: target,
            propertyKey: propertyKey.toString(),
            parameterIndex: parameterIndex,
            // Context
            className: target.constructor.name,
            type: ParameterType.Response,
            parameters: []
        }));
    };
}
