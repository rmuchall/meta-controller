import {ValidationErrors} from "meta-validator";

export class HttpError extends Error {
    statusCode: number;
    validationErrors?: ValidationErrors | ValidationErrors[];

    constructor(statusCode: number, message: string, validationErrors?: ValidationErrors | ValidationErrors[]) {
        super(message);
        Object.setPrototypeOf(this, HttpError.prototype);
        Error.captureStackTrace(this, this.constructor);
        this.statusCode = statusCode;
        this.validationErrors = validationErrors;
    }
}
