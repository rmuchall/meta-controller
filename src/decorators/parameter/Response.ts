import {MetaController} from "../../MetaController";
import {ParameterContext} from "../../models/contexts/ParameterContext";
import {ParameterType} from "../../enums/ParameterType";

export function Response(): Function {
    return function(target: Object, propertyKey: string | symbol, parameterIndex: number): void {
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
    }
}
