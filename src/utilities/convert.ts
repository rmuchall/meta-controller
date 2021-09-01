export function convertToSimpleType(type: string, input: unknown): any {
    switch(type.toLowerCase()) {
        case "string":
            return String(input);
        case "number":
            return Number(input);
        case "boolean":
            if (typeof input === "string") {
                return input.toLowerCase() === "true";
            } else {
                return false;
            }
        default:
            throw new Error(`Invalid simple type, type = [${type}]`);
    }
}
