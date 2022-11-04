import {ParameterType} from "../../enums/ParameterType.js";

export class ParameterContext {
    // Metadata
    target: Object;
    propertyKey: string;
    parameterIndex: number;
    // Context
    className: string;
    type: ParameterType;
    parameters: any[];
}
